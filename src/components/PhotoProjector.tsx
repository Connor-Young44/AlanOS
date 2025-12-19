import React, { useEffect, useState } from "react";
import type { Photo } from "./PhotoCarousel";

export default function PhotoProjector() {
  const [images, setImages] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const autoPlayInterval = 5000; // 5 seconds for projector

  // Load images from URL params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const indexParam = params.get("index");
    const imagesParam = params.get("images");

    if (indexParam) {
      setCurrentIndex(parseInt(indexParam, 10) || 0);
    }

    // Try to load from localStorage (fallback)
    const storedImages = localStorage.getItem("projector_images");
    if (storedImages) {
      try {
        const parsed = JSON.parse(storedImages);
        setImages(parsed);
      } catch (err) {
        console.error("Failed to parse stored images:", err);
      }
    }

    // Listen for messages from the parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "PHOTO_PROJECTOR_DATA") {
        setImages(event.data.images);
        setCurrentIndex(event.data.startIndex || 0);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlay, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsAutoPlay((prev) => !prev);
      } else if (e.key === "Escape") {
        window.close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          color: "#fff",
          fontSize: 32,
          textAlign: "center",
          padding: 40,
        }}
      >
        <div>
          <h1 style={{ fontSize: 48, marginBottom: 20 }}>📸 Photo Slideshow</h1>
          <p style={{ color: "#888", fontSize: 24 }}>Loading photos...</p>
        </div>
      </div>
    );
  }

  const currentPhoto = images[currentIndex];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Full-screen photo with smooth transition */}
      <img
        key={currentPhoto.id}
        src={currentPhoto.src}
        alt={currentPhoto.alt || `Photo ${currentIndex + 1}`}
        style={{
          width: "100vw",
          height: "100vh",
          objectFit: "contain",
          animation: "fadeIn 1s ease-in-out",
        }}
      />

      {/* Elegant photo counter overlay - auto-hide after 3 seconds */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(10px)",
          padding: "12px 40px",
          borderRadius: 30,
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          gap: 15,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          animation: "slideUp 0.5s ease-out",
        }}
      >
        <span style={{ fontWeight: "300", letterSpacing: "1px" }}>
          {currentIndex + 1} / {images.length}
        </span>
        {isAutoPlay && (
          <>
            <span style={{ color: "#444" }}>•</span>
            <span style={{ fontSize: 14, color: "#4caf50", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ 
                display: "inline-block", 
                width: 8, 
                height: 8, 
                backgroundColor: "#4caf50", 
                borderRadius: "50%",
                animation: "pulse 2s infinite"
              }}></span>
              Auto-playing
            </span>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { 
              opacity: 0;
              transform: scale(1.05);
            }
            to { 
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes slideUp {
            from {
              transform: translateX(-50%) translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.4;
            }
          }
        `}
      </style>
    </div>
  );
}
