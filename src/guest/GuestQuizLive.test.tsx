import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { onSnapshot, addDoc } from "firebase/firestore";
import GuestQuizLive from "./GuestQuizLive";
import { questions } from "../data/quizQuestions";

jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(() => ({
    currentUser: { uid: "guest-123", isAnonymous: true },
  })),
}));

describe("GuestQuizLive", () => {
  let quizCallback: (snap: any) => void;

  const sendQuizState = (activeQuestionIndex: number | null, revealAnswer = false) => {
    act(() => {
      quizCallback({
        exists: () => true,
        data: () => ({ activeQuestionIndex, revealAnswer }),
      });
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (onSnapshot as jest.Mock).mockImplementation((_ref, callback) => {
      quizCallback = callback;
      return jest.fn();
    });
    (addDoc as jest.Mock).mockResolvedValue({ id: "response-id" });
  });

  it("shows waiting state when no question is active", () => {
    render(<GuestQuizLive />);
    sendQuizState(null);
    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument();
  });

  it("renders the question text and all options when active", () => {
    render(<GuestQuizLive />);
    sendQuizState(0);
    expect(screen.getByText(questions[0].q)).toBeInTheDocument();
    questions[0].opts.forEach((opt) =>
      expect(screen.getByText(opt)).toBeInTheDocument()
    );
  });

  it("submits a vote with correct data when an option is clicked", async () => {
    render(<GuestQuizLive />);
    sendQuizState(0);
    fireEvent.click(screen.getByText(questions[0].opts[0]));

    await waitFor(() =>
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ questionIndex: 0, answer: 0, userId: "guest-123" })
      )
    );
  });

  it("disables all options after voting", async () => {
    render(<GuestQuizLive />);
    sendQuizState(0);
    fireEvent.click(screen.getByText(questions[0].opts[0]));

    await waitFor(() => {
      screen.getAllByRole("button").forEach((btn) => expect(btn).toBeDisabled());
    });
  });

  it("shows vote-recorded confirmation after voting", async () => {
    render(<GuestQuizLive />);
    sendQuizState(0);
    fireEvent.click(screen.getByText(questions[0].opts[0]));

    await waitFor(() =>
      expect(screen.getByText(/answer has been recorded/i)).toBeInTheDocument()
    );
  });

  it("shows the answer-revealed banner when revealAnswer is true", () => {
    render(<GuestQuizLive />);
    sendQuizState(0, true);
    expect(screen.getByText(/correct answer revealed/i)).toBeInTheDocument();
  });

  it("resets vote state when the question changes", async () => {
    render(<GuestQuizLive />);
    sendQuizState(0);
    fireEvent.click(screen.getByText(questions[0].opts[0]));
    await waitFor(() =>
      expect(screen.getByText(/answer has been recorded/i)).toBeInTheDocument()
    );

    sendQuizState(1);

    expect(screen.queryByText(/answer has been recorded/i)).not.toBeInTheDocument();
    expect(screen.getByText(questions[1].q)).toBeInTheDocument();
  });
});
