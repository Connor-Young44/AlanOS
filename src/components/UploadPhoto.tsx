import React, { useState, useEffect } from "react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_NAME;
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

export default function UploadPhoto() {
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

      setStatus("Uploading...");
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadedUrl(data.secure_url);
        setStatus("Uploaded!");
      } else {
        setStatus(data.error?.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error during compression or upload");
    }
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="primary" type="submit" disabled={!file}>
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
        <div style={{ marginTop: 10 }}>
          <div>Live image URL (Cloudinary public link):</div>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#8fe" }}
          >
            {uploadedUrl}
          </a>
          <div style={{ marginTop: 8 }}>
            <img
              className="upload-preview"
              src={uploadedUrl}
              alt="uploaded"
              style={{ maxWidth: "300px", maxHeight: "300px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
