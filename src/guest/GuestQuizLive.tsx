import React, { useEffect, useState } from "react";
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { questions } from "../data/quizQuestions";
import { useAuth } from "../contexts/AuthContext";

export default function GuestQuizLive() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "quiz", "state"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const newIdx = data.activeQuestionIndex ?? null;
        const newReveal = data.revealAnswer ?? false;
        
        // Reset vote state when question changes
        if (newIdx !== activeIdx) {
          setSelectedAnswer(null);
          setHasVoted(false);
        }
        
        setActiveIdx(newIdx);
        setReveal(newReveal);
      }
    });
    return () => unsub();
  }, [activeIdx]);

  if (activeIdx === null) {
    return (
      <div className="quiz" style={{ textAlign: "center", padding: "40px 20px" }}>
        <h2>🎯 Live Quiz</h2>
        <p style={{ color: "#888", marginTop: 20 }}>
          Waiting for the host to start a question...
        </p>
      </div>
    );
  }

  const q = questions[activeIdx];

  const handleVote = async (optionIndex: number) => {
    if (hasVoted || !currentUser) return;

    setSelectedAnswer(optionIndex);
    setHasVoted(true);

    try {
      await addDoc(collection(db, "quiz_responses"), {
        questionIndex: activeIdx,
        answer: optionIndex,
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setHasVoted(false);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="quiz">
      <h2 style={{ marginBottom: 20, fontSize: 20 }}>{q.q}</h2>

      {q.opts.map((option, i) => {
        let bgColor = "";
        let borderColor = "";

        if (hasVoted && selectedAnswer === i) {
          borderColor = "#4a9eff";
          bgColor = "rgba(74, 158, 255, 0.1)";
        }

        if (reveal) {
          if (i === q.answerIndex) {
            bgColor = "rgba(76, 175, 80, 0.2)";
            borderColor = "#4caf50";
          } else if (selectedAnswer === i) {
            bgColor = "rgba(244, 67, 54, 0.2)";
            borderColor = "#f44336";
          }
        }

        return (
          <div key={i} style={{ marginBottom: 12 }}>
            <button
              onClick={() => handleVote(i)}
              disabled={hasVoted || reveal}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: 15,
                backgroundColor: bgColor || "#1a1a1a",
                border: borderColor ? `2px solid ${borderColor}` : "1px solid #333",
                color: "#fff",
                cursor: hasVoted || reveal ? "default" : "pointer",
                opacity: hasVoted || reveal ? 0.8 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {option}
              {reveal && i === q.answerIndex && " ✓"}
            </button>
          </div>
        );
      })}

      {hasVoted && !reveal && (
        <p style={{ color: "#4a9eff", marginTop: 20, textAlign: "center" }}>
          ✓ Your answer has been recorded!
        </p>
      )}

      {reveal && (
        <p style={{ color: "#4caf50", marginTop: 20, textAlign: "center", fontWeight: 600 }}>
          Correct answer revealed!
        </p>
      )}
    </div>
  );
}
