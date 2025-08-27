import React, { useEffect, useState } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase"; // adjust path
import { questions } from "../data/quizQuestions";

export default function AdminDashboard() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);

  // Subscribe to quiz state
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

  async function setQuestion(i: number) {
    await setDoc(doc(db, "quiz", "state"), {
      activeQuestionIndex: i,
      revealAnswer: false,
    });
  }

  async function revealAnswer() {
    if (activeIdx === null) return;
    await setDoc(doc(db, "quiz", "state"), {
      activeQuestionIndex: activeIdx,
      revealAnswer: true,
    });
  }

console.log("Your UID:", auth.currentUser?.uid);
  return (
    <div style={{ padding: 20 }}>
      <h2>📖 Quiz Control</h2>

      <div style={{ marginBottom: 20 }}>
        {questions.map((_q: any, i:number) => (
          <button
            key={i}
            onClick={() => setQuestion(i)}
            style={{
              margin: "5px",
              background: activeIdx === i ? "#4caf50" : "#ccc",
            }}
          >
            {`Q${i + 1}`}
          </button>
        ))}
      </div>

      {activeIdx !== null && (
        <div>
          <h3>{questions[activeIdx].q}</h3>
          <ul>
            {questions[activeIdx].opts.map((o:any, i:number) => (
              <li
                key={i}
                style={{
                  color: reveal
                    ? i === questions[activeIdx].answerIndex
                      ? "green"
                      : "red"
                    : "black",
                }}
              >
                {o}
              </li>
            ))}
          </ul>

          {!reveal && (
            <button onClick={revealAnswer} style={{ marginTop: 10 }}>
              Reveal Answer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
