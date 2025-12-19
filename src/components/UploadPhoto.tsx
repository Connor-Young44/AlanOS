import React, { useState, useEffect } from "react";
import { env } from "../lib/env";
import { savePhotoUrl } from "../lib/photoStorage";

interface UploadPhotoProps {
  onUploadSuccess?: () => void;
  uploadsEnabled?: boolean;
}

const CLOUD_NAME = env.CLOUDINARY_NAME;
const UPLOAD_PRESET = "Unsigned_preset"; // Create this in Cloudinary dashboard

// Helper to compress image before upload
function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return reject("File read error");
      image.src = e.target.result as string;
    };

    image.onload = () => {
      const canvas = document.createElement("canvas");
      let width = image.width;
      let height = image.height;

      // Maintain aspect ratio while resizing
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject("Compression failed");
          const compressedFile = new File([blob], file.name, { type: "image/jpeg" });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    image.onerror = (err) => reject(err);

    reader.readAsDataURL(file);
  });
}

export default function UploadPhoto({ onUploadSuccess, uploadsEnabled = true }: UploadPhotoProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    try {
      setStatus("Compressing image...");
      const compressedFile = await compressImage(file);

      setStatus("Preparing for review...");
      // Convert to base64 data URL for temporary storage
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      
      reader.onload = async () => {
        const base64DataUrl = reader.result as string;
        
        setStatus("Saving for admin approval...");
        await savePhotoUrl(base64DataUrl, file.name);
        
        setUploadedUrl(base64DataUrl);
        setStatus("Submitted for approval!");
        setFile(null);
        
        // Call the success callback
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      };
      
      reader.onerror = () => {
        setStatus("Failed to process image");
      };
    } catch (err) {
      console.error(err);
      setStatus("Error during compression or upload");
    }
  }

  return (
    <div>
      {!uploadsEnabled && (
        <div style={{ padding: 12, marginBottom: 12, backgroundColor: "#ff9800", color: "#000", borderRadius: 4 }}>
          ⚠️ Photo uploads are currently disabled by the admin.
        </div>
      )}
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={!uploadsEnabled}
        />
        <button className="primary" type="submit" disabled={!file || !uploadsEnabled}>
          Upload
        </button>
      </form>

      {preview && (
        <div style={{ marginTop: 12 }}>
          <div>Preview:</div>
          <img
            className="upload-preview"
            src={preview}
            alt="preview"
            style={{ maxWidth: "300px", maxHeight: "300px" }}
          />
        </div>
      )}

      {status && (
        <div style={{ marginTop: 8, color: "#9fb3c8" }}>{status}</div>
      )}

      {uploadedUrl && (
        <div style={{ marginTop: 10, color: "#4caf50" }}>
          ✓ Photo uploaded successfully! It will appear in the gallery below.
        </div>
      )}
    </div>
  );
}