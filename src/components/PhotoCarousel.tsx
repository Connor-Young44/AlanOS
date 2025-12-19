import React, { useState, useEffect, useCallback } from "react";

export interface Photo {
  id: string;
  src: string;
  alt?: string;
}

interface PhotoCarouselProps {
  images: Photo[];
  startIndex?: number;
  onOpenProjector?: (index: number) => void;
  onDelete?: (photoId: string) => void;
  showDelete?: boolean;
}

export default function PhotoCarousel({
  images,
  startIndex = 0,
  onOpenProjector,
  onDelete,
  showDelete = false,
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const autoPlayInterval = 3000; // 3 seconds

  // Ensure currentIndex stays within bounds
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(images.length - 1);
    }
    if (currentIndex < 0 && images.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, images.length]);

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
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsAutoPlay((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#888" }}>
        No photos uploaded yet
      </div>
    );
  }

  const currentPhoto = images[currentIndex];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 20,
        backgroundColor: "#0a0a0a",
        borderRadius: 8,
        color: "#fff",
      }}
    >
      {/* Main image display */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
          overflow: "hidden",
          aspectRatio: "16 / 9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={currentPhoto.src}
          alt={currentPhoto.alt || `Photo ${currentIndex + 1}`}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />

        {/* Delete button */}
        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(currentPhoto.id)}
            aria-label="Delete photo"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              padding: "8px 16px",
              backgroundColor: "#d32f2f",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            🗑️ Delete
          </button>
        )}

        {/* Navigation buttons overlay */}
        <button
          onClick={goToPrevious}
          aria-label="Previous photo"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "10px 15px",
            cursor: "pointer",
            fontSize: 24,
          }}
        >
          ←
        </button>

        <button
          onClick={goToNext}
          aria-label="Next photo"
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "10px 15px",
            cursor: "pointer",
            fontSize: 24,
          }}
        >
          →
        </button>

        {/* Photo counter */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            padding: "5px 15px",
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          style={{
            padding: "8px 16px",
            backgroundColor: isAutoPlay ? "#4caf50" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {isAutoPlay ? "⏸ Pause" : "▶ Auto Play"}
        </button>

        {onOpenProjector && (
          <button
            onClick={() => onOpenProjector(currentIndex)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            🖥 Open Projector
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div
        role="list"
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "10px 0",
        }}
      >
        {images.map((photo, index) => (
          <div
            key={photo.id}
            role="listitem"
            onClick={() => setCurrentIndex(index)}
            style={{
              minWidth: 100,
              height: 60,
              cursor: "pointer",
              border:
                index === currentIndex ? "2px solid #1976d2" : "2px solid #333",
              borderRadius: 4,
              overflow: "hidden",
              backgroundColor: "#1a1a1a",
            }}
          >
            <img
              src={photo.src}
              alt={photo.alt || `Thumbnail ${index + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ))}
      </div>

      {/* Keyboard hints */}
      <div
        style={{
          fontSize: 12,
          color: "#666",
          textAlign: "center",
        }}
      >
        Use ← → arrow keys to navigate • Press Space to toggle auto-play
      </div>
    </div>
  );
}
