import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { onSnapshot, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import AdminQuizPanel from "./AdminQuizPanel";
import { questions } from "../data/quizQuestions";

jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(() => ({
    currentUser: { uid: "admin-uid", email: "admin@test.com" },
  })),
}));

describe("AdminQuizPanel", () => {
  let callbacks: Array<(snap: any) => void>;

  const sendQuizState = (activeQuestionIndex: number | null, revealAnswer = false) => {
    act(() => {
      callbacks[0]?.({
        exists: () => true,
        data: () => ({ activeQuestionIndex, revealAnswer }),
      });
    });
  };

  beforeEach(() => {
    callbacks = [];
    jest.clearAllMocks();
    (onSnapshot as jest.Mock).mockImplementation((_ref, callback) => {
      callbacks.push(callback);
      return jest.fn();
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it("renders a numbered button for each question", () => {
    render(<AdminQuizPanel />);
    questions.forEach((_, i) =>
      expect(screen.getByText(`Q${i + 1}`)).toBeInTheDocument()
    );
  });

  it("renders the Close Quiz button", () => {
    render(<AdminQuizPanel />);
    expect(screen.getByText("Close Quiz")).toBeInTheDocument();
  });

  it("calls setDoc with the correct question index when a question button is clicked", async () => {
    render(<AdminQuizPanel />);
    fireEvent.click(screen.getByText("Q1"));

    await waitFor(() =>
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { activeQuestionIndex: 0, revealAnswer: false }
      )
    );
  });

  it("calls setDoc with null activeQuestionIndex when Close Quiz is clicked", async () => {
    render(<AdminQuizPanel />);
    fireEvent.click(screen.getByText("Close Quiz"));

    await waitFor(() =>
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { activeQuestionIndex: null, revealAnswer: false }
      )
    );
  });

  it("shows the active question and its options when state is received", () => {
    render(<AdminQuizPanel />);
    sendQuizState(0);
    expect(screen.getByText(questions[0].q)).toBeInTheDocument();
    questions[0].opts.forEach((opt) =>
      expect(screen.getByText(opt)).toBeInTheDocument()
    );
  });

  it("shows Reveal Answer button while answer is not revealed", () => {
    render(<AdminQuizPanel />);
    sendQuizState(0, false);
    expect(screen.getByText("Reveal Answer")).toBeInTheDocument();
  });

  it("calls setDoc with revealAnswer=true when Reveal Answer is clicked", async () => {
    render(<AdminQuizPanel />);
    sendQuizState(0, false);
    fireEvent.click(screen.getByText("Reveal Answer"));

    await waitFor(() =>
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { activeQuestionIndex: 0, revealAnswer: true }
      )
    );
  });

  it("shows revealed confirmation instead of the Reveal button once revealed", () => {
    render(<AdminQuizPanel />);
    sendQuizState(0, true);
    expect(screen.queryByText("Reveal Answer")).not.toBeInTheDocument();
    expect(screen.getByText(/answer revealed to guests/i)).toBeInTheDocument();
  });

  it("deletes all response docs when Clear All Responses is confirmed", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ ref: "ref1" }, { ref: "ref2" }],
    });

    render(<AdminQuizPanel />);
    fireEvent.click(screen.getByText(/clear all responses/i));

    await waitFor(() => expect(deleteDoc).toHaveBeenCalledTimes(2));
  });

  it("does not delete anything when the confirm dialog is cancelled", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    render(<AdminQuizPanel />);
    fireEvent.click(screen.getByText(/clear all responses/i));
    expect(getDocs).not.toHaveBeenCalled();
  });
});
