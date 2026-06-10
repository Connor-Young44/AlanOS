import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { onSnapshot, addDoc } from "firebase/firestore";
import LeaveMessage from "./LeaveMessage";

function makeSnapshot(messages: Array<{ id: string; name?: string; message: string }>) {
  return {
    forEach: (cb: (doc: any) => void) =>
      messages.forEach((msg) =>
        cb({
          id: msg.id,
          data: () => ({
            name: msg.name,
            message: msg.message,
            createdAt: { toDate: () => new Date("2024-06-01T12:00:00") },
          }),
        })
      ),
  };
}

describe("LeaveMessage", () => {
  let snapshotCallback: (snap: any) => void;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (onSnapshot as jest.Mock).mockImplementation((_query, callback) => {
      snapshotCallback = callback;
      callback(makeSnapshot([]));
      return mockUnsubscribe;
    });
    (addDoc as jest.Mock).mockResolvedValue({ id: "new-id" });
  });

  it("renders the name input, message textarea, and submit button", () => {
    render(<LeaveMessage />);
    expect(screen.getByPlaceholderText("Your name (optional)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Leave a short message...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("shows empty-state text when there are no messages", () => {
    render(<LeaveMessage />);
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("shows validation error when submitting an empty message", async () => {
    render(<LeaveMessage />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() =>
      expect(screen.getByText("Message cannot be empty.")).toBeInTheDocument()
    );
  });

  it("calls addDoc with name and message on submit", async () => {
    render(<LeaveMessage />);
    fireEvent.change(screen.getByPlaceholderText("Your name (optional)"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Leave a short message..."), {
      target: { value: "Congratulations!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() =>
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: "Alice", message: "Congratulations!" })
      )
    );
  });

  it("falls back to 'Anonymous' when name field is empty", async () => {
    render(<LeaveMessage />);
    fireEvent.change(screen.getByPlaceholderText("Leave a short message..."), {
      target: { value: "Hello!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() =>
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: "Anonymous" })
      )
    );
  });

  it("shows 'Sent!' confirmation after a successful submit", async () => {
    render(<LeaveMessage />);
    fireEvent.change(screen.getByPlaceholderText("Leave a short message..."), {
      target: { value: "Hello!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByText("Sent!")).toBeInTheDocument());
  });

  it("shows failure status when addDoc rejects", async () => {
    (addDoc as jest.Mock).mockRejectedValue(new Error("Network error"));
    render(<LeaveMessage />);
    fireEvent.change(screen.getByPlaceholderText("Leave a short message..."), {
      target: { value: "Hello!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to send message.")).toBeInTheDocument()
    );
  });

  it("renders messages received from the Firestore snapshot", () => {
    render(<LeaveMessage />);
    act(() => {
      snapshotCallback(
        makeSnapshot([
          { id: "1", name: "Bob", message: "Happy wedding!" },
          { id: "2", name: "Carol", message: "Congrats!" },
        ])
      );
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Happy wedding!")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("unsubscribes from the Firestore listener on unmount", () => {
    const { unmount } = render(<LeaveMessage />);
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
