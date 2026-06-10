import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Menu from "./Menu";

describe("Menu", () => {
  const onSelect = jest.fn();
  const onBack = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders all three feature cards", () => {
    render(<Menu onSelect={onSelect} onBack={onBack} />);
    expect(screen.getByText("Quiz")).toBeInTheDocument();
    expect(screen.getByText("Upload Photo")).toBeInTheDocument();
    expect(screen.getByText("Leave a Message")).toBeInTheDocument();
  });

  it("calls onSelect('quiz') when Quiz card is clicked", () => {
    render(<Menu onSelect={onSelect} onBack={onBack} />);
    fireEvent.click(screen.getByText("Quiz"));
    expect(onSelect).toHaveBeenCalledWith("quiz");
  });

  it("calls onSelect('upload') when Upload Photo card is clicked", () => {
    render(<Menu onSelect={onSelect} onBack={onBack} />);
    fireEvent.click(screen.getByText("Upload Photo"));
    expect(onSelect).toHaveBeenCalledWith("upload");
  });

  it("calls onSelect('message') when Leave a Message card is clicked", () => {
    render(<Menu onSelect={onSelect} onBack={onBack} />);
    fireEvent.click(screen.getByText("Leave a Message"));
    expect(onSelect).toHaveBeenCalledWith("message");
  });

  it("calls onSelect('menu') when Home button is clicked", () => {
    render(<Menu onSelect={onSelect} onBack={onBack} />);
    fireEvent.click(screen.getByText("Home"));
    expect(onSelect).toHaveBeenCalledWith("menu");
  });

  it("calls onBack when Back button is clicked", () => {
    render(<Menu onSelect={onSelect} onBack={onBack} />);
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });
});
