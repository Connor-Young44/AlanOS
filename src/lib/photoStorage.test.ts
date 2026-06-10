import {
  savePhotoUrl,
  listPhotos,
  listUnvettedPhotos,
  approvePhoto,
  deletePhoto,
} from "./photoStorage";
import { addDoc, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Mock the sibling firebase module directly (path relative to this file)
jest.mock("./firebase", () => ({ db: {} }));

// Mock env for the dynamic import inside uploadToCloudinary
jest.mock("./env", () => ({
  env: { CLOUDINARY_NAME: "test-cloud" },
}));

describe("photoStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // ── savePhotoUrl ──────────────────────────────────────────────────────────

  describe("savePhotoUrl", () => {
    it("calls addDoc with the expected fields", async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: "new-id" });

      await savePhotoUrl("data:image/jpeg;base64,abc123", "photo.jpg");

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          url: "data:image/jpeg;base64,abc123",
          fileName: "photo.jpg",
          vetted: false,
          cloudinaryUrl: null,
          publicId: null,
        })
      );
    });

    it("re-throws when addDoc fails", async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error("Firestore write failed"));
      await expect(savePhotoUrl("url", "file.jpg")).rejects.toThrow("Firestore write failed");
    });
  });

  // ── listPhotos ────────────────────────────────────────────────────────────

  describe("listPhotos", () => {
    it("returns an empty array when no documents exist", async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
      expect(await listPhotos()).toEqual([]);
    });

    it("maps Firestore docs to Photo objects", async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { id: "p1", data: () => ({ url: "https://cdn.test/1.jpg", fileName: "one.jpg" }) },
          { id: "p2", data: () => ({ url: "https://cdn.test/2.jpg", fileName: "two.jpg" }) },
        ],
      });

      const result = await listPhotos();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: "p1", src: "https://cdn.test/1.jpg", alt: "one.jpg" });
      expect(result[1]).toEqual({ id: "p2", src: "https://cdn.test/2.jpg", alt: "two.jpg" });
    });

    it("returns an empty array (non-throwing) when getDocs rejects", async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error("Network error"));
      expect(await listPhotos()).toEqual([]);
    });
  });

  // ── listUnvettedPhotos ────────────────────────────────────────────────────

  describe("listUnvettedPhotos", () => {
    it("returns pending photos with both id and docId set", async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          {
            id: "u1",
            data: () => ({ url: "data:image/jpeg;base64,abc", fileName: "pending.jpg" }),
          },
        ],
      });

      const result = await listUnvettedPhotos();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "u1",
        docId: "u1",
        src: "data:image/jpeg;base64,abc",
        alt: "pending.jpg",
      });
    });

    it("returns an empty array (non-throwing) when getDocs rejects", async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error("Permission denied"));
      expect(await listUnvettedPhotos()).toEqual([]);
    });
  });

  // ── approvePhoto ──────────────────────────────────────────────────────────

  describe("approvePhoto", () => {
    it("uploads base64 to Cloudinary and updates the Firestore doc", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ url: "data:image/jpeg;base64,/9j/abc" }),
      });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          secure_url: "https://res.cloudinary.com/img.jpg",
          public_id: "img123",
        }),
      });

      await approvePhoto("photo-123");

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          vetted: true,
          cloudinaryUrl: "https://res.cloudinary.com/img.jpg",
          publicId: "img123",
          url: "https://res.cloudinary.com/img.jpg",
        })
      );
    });

    it("marks already-uploaded photos as vetted without calling Cloudinary", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ url: "https://res.cloudinary.com/already.jpg" }),
      });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await approvePhoto("photo-456");

      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { vetted: true });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("throws 'Photo not found' when the document does not exist", async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
      await expect(approvePhoto("missing-id")).rejects.toThrow("Photo not found");
    });
  });

  // ── deletePhoto ───────────────────────────────────────────────────────────

  describe("deletePhoto", () => {
    it("calls deleteDoc for the given photo id", async () => {
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      await deletePhoto("photo-abc");
      expect(deleteDoc).toHaveBeenCalled();
    });

    it("re-throws when deleteDoc fails", async () => {
      (deleteDoc as jest.Mock).mockRejectedValue(new Error("Permission denied"));
      await expect(deletePhoto("photo-abc")).rejects.toThrow("Permission denied");
    });
  });
});
