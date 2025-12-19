import React, { useEffect, useState } from "react";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { questions } from "../data/quizQuestions";

export default function QuizProjector() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [votes, setVotes] = useState<number[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  // Listen to active question
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "quiz", "state"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setActiveIdx(data.activeQuestionIndex ?? null);
        setReveal(data.revealAnswer ?? false);
      }
    });
    return () => unsub();
  }, []);

  // Listen to responses for current question
  useEffect(() => {
    if (activeIdx === null) {
      setVotes([]);
      setTotalVotes(0);
      return;
    }

    const currentQuestion = questions[activeIdx];
    if (!currentQuestion) return;

    const q = query(
      collection(db, "quiz_responses"),
      where("questionIndex", "==", activeIdx)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const counts = new Array(currentQuestion.opts.length).fill(0);
      let total = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const answerIdx = data.answer;
        if (typeof answerIdx === "number" && answerIdx >= 0 && answerIdx < counts.length) {
          counts[answerIdx]++;
          total++;
        }
      });

      setVotes(counts);
      setTotalVotes(total);
    });

    return () => unsub();
  }, [activeIdx]);

  if (activeIdx === null) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#fff",
        fontSize: 32,
        textAlign: "center",
        padding: 40
      }}>
        <div>
          <h1 style={{ fontSize: 48, marginBottom: 20 }}>🎯 Live Quiz</h1>
          <p style={{ color: "#888", fontSize: 24 }}>
            Waiting for question...
          </p>
        </div>
      </div>
    );
  }

  const q = questions[activeIdx];
  const maxVotes = Math.max(...votes, 1);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      color: "#fff",
      padding: 60,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Question */}
        <h1 style={{
          fontSize: 42,
          marginBottom: 60,
          textAlign: "center",
          lineHeight: 1.4
        }}>
          {q.q}
        </h1>

        {/* Vote count */}
        <div style={{
          textAlign: "center",
          fontSize: 20,
          color: "#888",
          marginBottom: 40
        }}>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </div>

        {/* Options with bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {q.opts.map((option, i) => {
            const percentage = totalVotes > 0 ? (votes[i] / totalVotes) * 100 : 0;
            const barWidth = totalVotes > 0 ? (votes[i] / maxVotes) * 100 : 0;
            
            const isCorrect = i === q.answerIndex;
            const borderColor = reveal && isCorrect ? "#4caf50" : "#333";
            const labelColor = reveal && isCorrect ? "#4caf50" : "#fff";

            return (
              <div
                key={i}
                style={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: 20,
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: "#1a1a1a",
                }}
              >
                {/* Background bar */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barWidth}%`,
                    backgroundColor: reveal && isCorrect
                      ? "rgba(76, 175, 80, 0.2)"
                      : "rgba(74, 158, 255, 0.15)",
                    transition: "width 0.5s ease",
                  }}
                />

                {/* Content */}
                <div style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 28,
                }}>
                  <span style={{ color: labelColor, fontWeight: 500 }}>
                    {option}
                    {reveal && isCorrect && " ✓"}
                  </span>
                  <span style={{ color: "#888", fontSize: 24 }}>
                    {votes[i]} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {reveal && (
          <div style={{
            marginTop: 60,
            textAlign: "center",
            fontSize: 28,
            color: "#4caf50",
            fontWeight: 600
          }}>
            ✓ Correct answer revealed!
          </div>
        )}
      </div>
    </div>
  );
}
