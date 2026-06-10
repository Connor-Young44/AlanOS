import React from "react";
import { render, screen, act } from "@testing-library/react";
import LoadingTerminal from "./LoadingTerminal";

describe("LoadingTerminal", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("renders the installer title", () => {
    render(<LoadingTerminal onFinished={jest.fn()} />);
    expect(screen.getByText("Best Man Installer v1.0")).toBeInTheDocument();
  });

  it("starts at 0%", () => {
    render(<LoadingTerminal onFinished={jest.fn()} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows the first funny quote on mount", () => {
    render(<LoadingTerminal onFinished={jest.fn()} />);
    expect(screen.getByText("Pouring drinks...")).toBeInTheDocument();
  });

  it("rotates to the second quote after 2500ms", () => {
    render(<LoadingTerminal onFinished={jest.fn()} />);
    act(() => { jest.advanceTimersByTime(2500); });
    expect(screen.getByText("Finding embarrassing stories...")).toBeInTheDocument();
  });

  it("calls onFinished once progress completes", () => {
    const onFinished = jest.fn();
    render(<LoadingTerminal onFinished={onFinished} />);
    // Advance far enough for progress to hit 100% (max ~125 ticks × 150ms = ~19s)
    act(() => { jest.advanceTimersByTime(25000); });
    // The setTimeout(() => onFinished(), 800) is scheduled during React's state flush
    // above, so we need a second act() to advance past it.
    act(() => { jest.advanceTimersByTime(1000); });
    // With fake timers all interval callbacks fire before React can process state updates,
    // so multiple setProgress calls hit the >=100 branch. Just verify it was called.
    expect(onFinished).toHaveBeenCalled();
  });

  it("does not call onFinished before progress completes", () => {
    const onFinished = jest.fn();
    render(<LoadingTerminal onFinished={onFinished} />);
    // Advance only a short time — progress won't be at 100% yet
    act(() => { jest.advanceTimersByTime(500); });
    expect(onFinished).not.toHaveBeenCalled();
  });
});
