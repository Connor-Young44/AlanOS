import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PhotoCarousel, { type Photo } from "./PhotoCarousel";

const mockPhotos: Photo[] = [
  { id: "1", src: "https://example.com/photo1.jpg", alt: "Photo 1" },
  { id: "2", src: "https://example.com/photo2.jpg", alt: "Photo 2" },
  { id: "3", src: "https://example.com/photo3.jpg", alt: "Photo 3" },
];

describe("PhotoCarousel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render empty state when no images provided", () => {
    render(<PhotoCarousel images={[]} />);
    expect(screen.getByText("No photos uploaded yet")).toBeInTheDocument();
  });

  it("should render carousel with images", () => {
    render(<PhotoCarousel images={mockPhotos} />);
    
    // Check that the main image is displayed (first one with alt text is the main image)
    const images = screen.getAllByAltText("Photo 1");
    expect(images[0]).toBeInTheDocument();
    expect(images[0]).toHaveAttribute("src", "https://example.com/photo1.jpg");
    
    // Check counter
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("should navigate to next photo when next button is clicked", () => {
    render(<PhotoCarousel images={mockPhotos} />);
    
    const nextButton = screen.getByLabelText("Next photo");
    fireEvent.click(nextButton);
    
    // Should show second photo
    const images = screen.getAllByAltText("Photo 2");
    expect(images[0]).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it("should navigate to previous photo when previous button is clicked", () => {
    render(<PhotoCarousel images={mockPhotos} startIndex={1} />);
    
    const prevButton = screen.getByLabelText("Previous photo");
    fireEvent.click(prevButton);
    
    // Should show first photo
    const images = screen.getAllByAltText("Photo 1");
    expect(images[0]).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it("should toggle auto-play when button is clicked", () => {
    render(<PhotoCarousel images={mockPhotos} />);
    
    const autoPlayButton = screen.getByText(/Auto Play/i);
    expect(autoPlayButton).toHaveTextContent("▶ Auto Play");
    
    fireEvent.click(autoPlayButton);
    
    // Button should change to pause
    expect(autoPlayButton).toHaveTextContent("⏸ Pause");
  });

  it("should call onOpenProjector when projector button is clicked", () => {
    const onOpenProjector = jest.fn();
    render(<PhotoCarousel images={mockPhotos} onOpenProjector={onOpenProjector} />);
    
    const projectorButton = screen.getByText(/Open Projector/i);
    fireEvent.click(projectorButton);
    
    expect(onOpenProjector).toHaveBeenCalledWith(0);
  });

  it("should select photo when thumbnail is clicked", () => {
    render(<PhotoCarousel images={mockPhotos} />);
    
    // Get all list items
    const listItems = screen.getAllByRole("listitem");
    
    // Click third thumbnail
    fireEvent.click(listItems[2]);
    
    // Should show third photo
    const images = screen.getAllByAltText("Photo 3");
    expect(images[0]).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("should handle keyboard navigation", () => {
    render(<PhotoCarousel images={mockPhotos} />);
    
    // Press right arrow
    fireEvent.keyDown(window, { key: "ArrowRight" });
    
    // Should show second photo
    let images = screen.getAllByAltText("Photo 2");
    expect(images[0]).toBeInTheDocument();
    
    // Press left arrow
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    
    // Should show first photo again
    images = screen.getAllByAltText("Photo 1");
    expect(images[0]).toBeInTheDocument();
  });

  it("should toggle auto-play with space key", () => {
    render(<PhotoCarousel images={mockPhotos} />);
    
    const autoPlayButton = screen.getByText(/Auto Play/i);
    expect(autoPlayButton).toHaveTextContent("▶ Auto Play");
    
    // Press space bar
    fireEvent.keyDown(window, { key: " " });
    
    expect(autoPlayButton).toHaveTextContent("⏸ Pause");
  });
});
