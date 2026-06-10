import React from "react";
import { render, screen, act } from "@testing-library/react";
import { onSnapshot } from "firebase/firestore";
import QuizProjector from "./QuizProjector";
import { questions } from "../data/quizQuestions";

describe("QuizProjector", () => {
  // Two onSnapshot calls per render: quiz/state and quiz_responses
  let callbacks: Array<(snap: any) => void>;

  const makeResponseSnap = (answers: number[]) => ({
    forEach: (cb: (doc: any) => void) =>
      answers.forEach((answer, i) =>
        cb({ id: `r${i}`, data: () => ({ answer, questionIndex: 0 }) })
      ),
  });

  const sendQuizState = (activeQuestionIndex: number | null, revealAnswer = false) => {
    act(() => {
      callbacks[0]?.({
        exists: () => true,
        data: () => ({ activeQuestionIndex, revealAnswer }),
      });
    });
  };

  const sendResponses = (answers: number[]) => {
    act(() => { callbacks[1]?.(makeResponseSnap(answers)); });
  };

  beforeEach(() => {
    callbacks = [];
    jest.clearAllMocks();
    (onSnapshot as jest.Mock).mockImplementation((_ref, callback) => {
      callbacks.push(callback);
      return jest.fn();
    });
  });

  it("shows waiting state when no question is active", () => {
    render(<QuizProjector />);
    sendQuizState(null);
    expect(screen.getByText(/waiting for question/i)).toBeInTheDocument();
  });

  it("renders the active question text", () => {
    render(<QuizProjector />);
    sendQuizState(0);
    expect(screen.getByText(questions[0].q)).toBeInTheDocument();
  });

  it("renders all answer options", () => {
    render(<QuizProjector />);
    sendQuizState(0);
    questions[0].opts.forEach((opt) =>
      expect(screen.getByText(opt)).toBeInTheDocument()
    );
  });

  it("shows total vote count from responses", () => {
    render(<QuizProjector />);
    sendQuizState(0);
    sendResponses([0, 0, 1, 2]);
    expect(screen.getByText("4 votes")).toBeInTheDocument();
  });

  it("uses singular 'vote' for exactly one response", () => {
    render(<QuizProjector />);
    sendQuizState(0);
    sendResponses([1]);
    expect(screen.getByText("1 vote")).toBeInTheDocument();
  });

  it("appends ✓ to the correct answer option when revealed", () => {
    render(<QuizProjector />);
    sendQuizState(0, true);
    const correctOpt = questions[0].opts[questions[0].answerIndex];
    expect(screen.getByText(`${correctOpt} ✓`)).toBeInTheDocument();
  });
});
