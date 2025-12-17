import React, { useEffect, useState } from "react";
import { doc, setDoc, onSnapshot, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { questions } from "../data/quizQuestions";
import { useAuth } from "../contexts/AuthContext";

export default function AdminQuizPanel() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState<number[]>([]);
  const { currentUser } = useAuth();

  // Subscribe to quiz state
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "quiz", "state"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setActiveIdx(data.activeQuestionIndex ?? null);
          setReveal(data.revealAnswer ?? false);
        }
        setError(null);
      },
      (err) => {
        console.error("Failed to sync quiz state:", err);
        setError("Failed to connect to quiz state");
      }
    );
    return () => unsub();
  }, []);

  // Listen to responses for current question
  useEffect(() => {
    if (activeIdx === null) return;

    const q = query(
      collection(db, "quiz_responses"),
      where("questionIndex", "==", activeIdx)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const counts = [0, 0, 0, 0];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const answerIdx = data.answer;
        if (typeof answerIdx === "number" && answerIdx >= 0 && answerIdx < counts.length) {
          counts[answerIdx]++;
        }
      });
      setVotes(counts);
    });

    return () => unsub();
  }, [activeIdx]);

  async function setQuestion(i: number) {
    try {
      await setDoc(doc(db, "quiz", "state"), {
        activeQuestionIndex: i,
        revealAnswer: false,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to set question:", err);
      setError("Failed to update question");
    }
  }

  async function revealAnswer() {
    if (activeIdx === null) return;
    try {
      await setDoc(doc(db, "quiz", "state"), {
        activeQuestionIndex: activeIdx,
        revealAnswer: true,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to reveal answer:", err);
      setError("Failed to reveal answer");
    }
  }

  async function closeQuestion() {
    try {
      await setDoc(doc(db, "quiz", "state"), {
        activeQuestionIndex: null,
        revealAnswer: false,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to close question:", err);
      setError("Failed to close question");
    }
  }

  function openProjector() {
    window.open("/projector", "_blank", "width=1920,height=1080");
  }

  async function clearAllResponses() {
    if (!window.confirm("Are you sure you want to clear ALL quiz responses? This cannot be undone.")) {
      return;
    }

    try {
      const responsesRef = collection(db, "quiz_responses");
      const snapshot = await getDocs(responsesRef);
      
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`✅ Cleared ${snapshot.docs.length} responses`);
      setError(null);
    } catch (err) {
      console.error("Failed to clear responses:", err);
      setError("Failed to clear responses");
    }
  }

  const totalVotes = votes.reduce((sum, v) => sum + v, 0);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>📖 Quiz Control</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={clearAllResponses}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}
          >
            🗑️ Clear All Responses
          </button>
          <button
            onClick={openProjector}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4a9eff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}
          >
            🖥️ Open Projector View
          </button>
        </div>
      </div>

      {currentUser && (
        <div style={{ fontSize: "12px", color: "#888", marginBottom: 10 }}>
          Signed in as: {currentUser.email || currentUser.uid}
        </div>
      )}

      {error && (
        <div style={{ 
          color: "#ff6b6b", 
          fontSize: "14px", 
          padding: "10px",
          marginBottom: "15px",
          backgroundColor: "rgba(255, 107, 107, 0.1)",
          borderRadius: "4px"
        }}>
          {error}
        </div>
      )}

      {/* Question Selection */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>Select Question:</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuestion(i)}
              style={{
                padding: "10px 16px",
                background: activeIdx === i ? "#4caf50" : "#333",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeIdx === i ? 600 : 400
              }}
            >
              Q{i + 1}
            </button>
          ))}
          <button
            onClick={closeQuestion}
            style={{
              padding: "10px 16px",
              background: activeIdx === null ? "#f44336" : "#555",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Close Quiz
          </button>
        </div>
      </div>

      {/* Active Question Display */}
      {activeIdx !== null && (
        <div style={{
          border: "2px solid #333",
          borderRadius: 8,
          padding: 20,
          backgroundColor: "#1a1a1a"
        }}>
          <h3 style={{ fontSize: 20, marginBottom: 20 }}>{questions[activeIdx].q}</h3>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 10 }}>
              Total Votes: {totalVotes}
            </div>

            {questions[activeIdx].opts.map((option, i) => {
              const percentage = totalVotes > 0 ? ((votes[i] / totalVotes) * 100).toFixed(0) : 0;
              const isCorrect = i === questions[activeIdx].answerIndex;

              return (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    marginBottom: 8,
                    backgroundColor: "#2a2a2a",
                    borderRadius: 4,
                    border: reveal && isCorrect ? "2px solid #4caf50" : "1px solid #333",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: reveal && isCorrect ? "#4caf50" : "#fff" }}>
                      {option}
                      {reveal && isCorrect && " ✓"}
                    </span>
                    <span style={{ color: "#888", fontSize: 14 }}>
                      {votes[i]} votes ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10 }}>
            {!reveal && (
              <button
                onClick={revealAnswer}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Reveal Answer
              </button>
            )}
            {reveal && (
              <div style={{ color: "#4caf50", fontSize: 14, fontWeight: 600, padding: "12px 0" }}>
                ✓ Answer Revealed to Guests
              </div>
            )}
          </div>
        </div>
      )}

      {activeIdx === null && (
        <div style={{
          textAlign: "center",
          padding: 40,
          color: "#888",
          fontSize: 16
        }}>
          No question is currently active. Select a question above to begin.
        </div>
      )}
    </div>
  );
}
