import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { questions } from "../data/quizQuestions";

export default function QuizPoll() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);

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

  if (activeIdx === null) {
    return <p>No quiz question is live right now.</p>;
  }

  const q = questions[activeIdx];

  return (
    <div>
      <h2>{q.q}</h2>
      {q.opts.map((o: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, i: React.Key | null | undefined) => (
        <div key={i} style={{ margin: "8px 0" }}>
          <button
            style={{
              width: "100%",
              padding: "10px",
              background: reveal
                ? i === q.answerIndex
                  ? "rgba(0,200,0,0.3)"
                  : "rgba(200,0,0,0.3)"
                : "#eee",
            }}
            disabled
          >
            {o}
          </button>
        </div>
      ))}
      {reveal && <p style={{ color: "green" }}>Correct answer highlighted!</p>}
    </div>
  );
}
