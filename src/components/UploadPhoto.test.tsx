import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import UploadPhoto from "./UploadPhoto";

const mockSavePhotoUrl = jest.fn();
jest.mock("../lib/photoStorage", () => ({
  savePhotoUrl: (...args: any[]) => mockSavePhotoUrl(...args),
}));

// Browser API mocks needed for the image compression pipeline
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/fake-preview");
  global.URL.revokeObjectURL = jest.fn();

  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    drawImage: jest.fn(),
  }) as any;

  HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation(
    function (callback: BlobCallback) {
      callback(new Blob(["fake"], { type: "image/jpeg" }));
    }
  );

  // Image that fires onload on the next microtask when src is assigned
  (global as any).Image = class {
    width = 800;
    height = 600;
    onload: (() => void) | null = null;
    onerror: ((err: any) => void) | null = null;
    private _src = "";
    get src() { return this._src; }
    set src(val: string) {
      this._src = val;
      Promise.resolve().then(() => this.onload?.());
    }
  };

  // FileReader that immediately returns a fake base64 data URL
  (global as any).FileReader = class {
    result: string | null = "data:image/jpeg;base64,/9j/fakedata";
    onload: ((e: any) => void) | null = null;
    onerror: ((e: any) => void) | null = null;
    readAsDataURL() {
      Promise.resolve().then(() =>
        this.onload?.({ target: { result: this.result } })
      );
    }
  };
});

describe("UploadPhoto", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSavePhotoUrl.mockResolvedValue(undefined);
  });

  it("renders the file input and upload button", () => {
    render(<UploadPhoto />);
    expect(document.querySelector("input[type=file]")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^upload$/i })).toBeInTheDocument();
  });

  it("upload button is disabled when no file is selected", () => {
    render(<UploadPhoto />);
    expect(screen.getByRole("button", { name: /^upload$/i })).toBeDisabled();
  });

  it("shows a disabled warning when uploadsEnabled is false", () => {
    render(<UploadPhoto uploadsEnabled={false} />);
    expect(screen.getByText(/photo uploads are currently disabled/i)).toBeInTheDocument();
  });

  it("disables the file input and button when uploadsEnabled is false", () => {
    render(<UploadPhoto uploadsEnabled={false} />);
    expect(document.querySelector("input[type=file]") as HTMLInputElement).toBeDisabled();
    expect(screen.getByRole("button", { name: /^upload$/i })).toBeDisabled();
  });

  it("shows a preview image when a file is selected", async () => {
    render(<UploadPhoto />);
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector("input[type=file]") as HTMLInputElement;

    await act(async () => {
      Object.defineProperty(input, "files", { value: [file], configurable: true });
      fireEvent.change(input);
    });

    await waitFor(() => expect(screen.getByText("Preview:")).toBeInTheDocument());
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:http://localhost/fake-preview");
  });

  it("calls savePhotoUrl and shows success status after submit", async () => {
    render(<UploadPhoto />);
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector("input[type=file]") as HTMLInputElement;

    await act(async () => {
      Object.defineProperty(input, "files", { value: [file], configurable: true });
      fireEvent.change(input);
    });

    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });

    await waitFor(() => expect(mockSavePhotoUrl).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(
      () => expect(screen.getByText(/submitted for approval/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });

  it("calls onUploadSuccess callback after a successful upload", async () => {
    const onUploadSuccess = jest.fn();
    render(<UploadPhoto onUploadSuccess={onUploadSuccess} />);
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector("input[type=file]") as HTMLInputElement;

    await act(async () => {
      Object.defineProperty(input, "files", { value: [file], configurable: true });
      fireEvent.change(input);
    });

    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalled(), { timeout: 3000 });
  });
});
