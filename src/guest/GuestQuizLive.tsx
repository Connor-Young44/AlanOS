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
      <div className="quiz" style={{ 
        textAlign: "center", 
        padding: "60px 20px",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          fontSize: 64,
          marginBottom: 20,
          animation: "pulse 2s infinite"
        }}>🎯</div>
        <h2 style={{ fontSize: 24, marginBottom: 16, fontWeight: 600 }}>Live Quiz</h2>
        <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6 }}>
          Waiting for the host to start a question...
        </p>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          `}
        </style>
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
    <div className="quiz" style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{
        backgroundColor: "rgba(25, 118, 210, 0.1)",
        border: "2px solid rgba(25, 118, 210, 0.3)",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24
      }}>
        <h2 style={{ 
          marginBottom: 0, 
          fontSize: 18,
          lineHeight: 1.5,
          fontWeight: 600,
          color: "#fff"
        }}>{q.q}</h2>
      </div>

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
                padding: "18px 20px",
                fontSize: 16,
                fontWeight: 500,
                backgroundColor: bgColor || "#1a1a1a",
                border: borderColor ? `3px solid ${borderColor}` : "2px solid #333",
                borderRadius: 12,
                color: "#fff",
                cursor: hasVoted || reveal ? "default" : "pointer",
                opacity: hasVoted || reveal ? 0.9 : 1,
                transition: "all 0.3s ease",
                textAlign: "left",
                position: "relative",
                boxShadow: borderColor ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                transform: hasVoted && selectedAnswer === i ? "scale(0.98)" : "scale(1)"
              }}
            >
              <span style={{ paddingRight: 30 }}>{option}</span>
              {reveal && i === q.answerIndex && (
                <span style={{ 
                  position: "absolute",
                  right: 20,
                  fontSize: 24
                }}>✓</span>
              )}
            </button>
          </div>
        );
      })}

      {hasVoted && !reveal && (
        <div style={{ 
          backgroundColor: "rgba(74, 158, 255, 0.15)",
          border: "2px solid #4a9eff",
          borderRadius: 12,
          padding: 16,
          marginTop: 24,
          textAlign: "center",
          animation: "slideIn 0.3s ease-out"
        }}>
          <span style={{ fontSize: 20, marginRight: 8 }}>✓</span>
          <span style={{ color: "#4a9eff", fontSize: 16, fontWeight: 500 }}>
            Your answer has been recorded!
          </span>
        </div>
      )}

      {reveal && (
        <div style={{ 
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          border: "2px solid #4caf50",
          borderRadius: 12,
          padding: 16,
          marginTop: 24,
          textAlign: "center",
          animation: "slideIn 0.3s ease-out"
        }}>
          <span style={{ fontSize: 20, marginRight: 8 }}>🎉</span>
          <span style={{ color: "#4caf50", fontSize: 16, fontWeight: 600 }}>
            Correct answer revealed!
          </span>
        </div>
      )}
      
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
