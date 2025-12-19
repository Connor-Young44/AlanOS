import { collection, getDocs, addDoc, query, orderBy, Timestamp, limit as limitConstraint, where, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Photo } from "../components/PhotoCarousel";

const PHOTOS_COLLECTION = "uploaded_photos";

/**
 * Save a Cloudinary photo URL to Firestore
 */
export async function savePhotoUrl(url: string, fileName: string): Promise<void> {
  try {
    await addDoc(collection(db, PHOTOS_COLLECTION), {
      url, // Can be base64 data URL or Cloudinary URL
      fileName,
      uploadedAt: Timestamp.now(),
      vetted: false, // Photos need admin approval
      cloudinaryUrl: null, // Will be set when approved and uploaded to Cloudinary
      publicId: null, // Will be set when uploaded to Cloudinary
    });
  } catch (error) {
    console.error("Error saving photo URL:", error);
    throw error;
  }
}

/**
 * List all uploaded photos from Firestore (Cloudinary URLs)
 */
export async function listPhotos(limit?: number): Promise<Photo[]> {
  try {
    const photosQuery = limit
      ? query(
          collection(db, PHOTOS_COLLECTION),
          where("vetted", "==", true),
          orderBy("uploadedAt", "desc"),
          limitConstraint(limit)
        )
      : query(
          collection(db, PHOTOS_COLLECTION),
          where("vetted", "==", true),
          orderBy("uploadedAt", "desc")
        );
    const snapshot = await getDocs(photosQuery);

    const photos: Photo[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        src: data.url,
        alt: data.fileName || "Uploaded photo",
      };
    });

    return photos;
  } catch (error) {
    console.error("Error listing photos:", error);
    return [];
  }
}

/**
 * List unveted photos awaiting admin approval
 */
export async function listUnvettedPhotos(): Promise<Array<Photo & { docId: string }>> {
  try {
    const photosQuery = query(
      collection(db, PHOTOS_COLLECTION),
      where("vetted", "==", false),
      orderBy("uploadedAt", "desc")
    );
    const snapshot = await getDocs(photosQuery);

    const photos = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        docId: doc.id,
        src: data.url,
        alt: data.fileName || "Pending photo",
      };
    });

    return photos;
  } catch (error) {
    console.error("Error listing unveted photos:", error);
    return [];
  }
}

/**
 * Upload base64 image to Cloudinary
 */
async function uploadToCloudinary(base64DataUrl: string): Promise<{ url: string; publicId: string }> {
  const { env } = await import("./env");
  const CLOUD_NAME = env.CLOUDINARY_NAME;
  const UPLOAD_PRESET = "Unsigned_preset";
  
  const formData = new FormData();
  formData.append("file", base64DataUrl);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload to Cloudinary");
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Approve a photo (upload to Cloudinary and mark as vetted)
 */
export async function approvePhoto(photoId: string): Promise<void> {
  try {
    // Get the photo document to check if it needs uploading
    const photoDocRef = doc(db, PHOTOS_COLLECTION, photoId);
    const photoSnap = await getDoc(photoDocRef);
    
    if (!photoSnap.exists()) {
      throw new Error("Photo not found");
    }
    
    const photoData = photoSnap.data();
    
    // If it's a base64 data URL, upload to Cloudinary first
    if (photoData.url.startsWith("data:")) {
      const { url, publicId } = await uploadToCloudinary(photoData.url);
      
      await updateDoc(photoDocRef, {
        vetted: true,
        cloudinaryUrl: url,
        publicId: publicId,
        url: url, // Replace base64 with Cloudinary URL
      });
    } else {
      // Already uploaded, just mark as vetted
      await updateDoc(photoDocRef, {
        vetted: true,
      });
    }
  } catch (error) {
    console.error("Error approving photo:", error);
    throw error;
  }
}

export async function deletePhoto(photoId: string): Promise<void> {
  try {
    // Delete from Firestore (removes from gallery)
    await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId));
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
}

/**
 * Open a new projector window with photos
 */
export function openPhotoProjectorWindow(images: Photo[], startIndex: number = 0) {
  // Store images in localStorage so projector window can access them
  localStorage.setItem("projector_images", JSON.stringify(images));

  // Open new window
  const projectorWindow = window.open(
    `/photo-projector?index=${startIndex}`,
    "PhotoProjector",
    "toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=1920,height=1080"
  );

  // Send data via postMessage as backup
  if (projectorWindow) {
    // Wait for window to load before sending message
    setTimeout(() => {
      projectorWindow.postMessage(
        {
          type: "PHOTO_PROJECTOR_DATA",
          images,
          startIndex,
        },
        window.location.origin
      );
    }, 500);
  }
}
