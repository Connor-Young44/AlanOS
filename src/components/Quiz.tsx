import React, { useState, useEffect } from "react";

type Q = {
  q: string;
  opts: string[];
  answerIndex: number;
};

const questions: Q[] = [
  { q: "Where did they go on their first date?", opts: ["Italian restaurant", "Roller rink", "Coffee shop", "Hiking trail"], answerIndex: 2 },
  { q: "What is the groom's go-to karaoke song?", opts: ["Bohemian Rhapsody", "Wonderwall", "Uptown Funk", "Total Eclipse of the Heart"], answerIndex: 1 },
  { q: "Who said 'I love you' first?", opts: ["Bride", "Groom", "It was mutual", "Their dog"], answerIndex: 0 }
];

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function Quiz() {
  const [qList, setQList] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredIdx, setAnsweredIdx] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setQList(shuffle(questions));
  }, []);

  function choose(i: number) {
    if (answeredIdx !== null) return;
    setAnsweredIdx(i);
    if (i === qList[idx].answerIndex) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (idx + 1 < qList.length) {
        setIdx(idx + 1);
        setAnsweredIdx(null);
      } else {
        setFinished(true);
      }
    }, 1000);
  }

  if (!qList.length) return null;

  if (finished) {
    return (
      <div className="quiz">
        <h2>Quiz Complete!</h2>
        <p>You scored {score} / {qList.length}</p>
        <button onClick={() => {
          setQList(shuffle(questions));
          setIdx(0);
          setScore(0);
          setFinished(false);
          setAnsweredIdx(null);
        }}>
          Play Again
        </button>
      </div>
    );
  }

  const q = qList[idx];

  return (
    <div className="quiz">
      <div style={{ marginBottom: 8, color: "#9fb3c8" }}>
        Question {idx + 1} of {qList.length}
      </div>
      <q>{q.q}</q>
      {q.opts.map((o, i) => {
        let bg = "";
        if (answeredIdx !== null) {
          if (i === q.answerIndex) bg = "rgba(0,200,0,0.3)";
          else if (i === answeredIdx) bg = "rgba(200,0,0,0.3)";
        }
        return (
          <div key={i} className="option">
            <button
              className="small"
              style={{
                width: "100%",
                textAlign: "left",
                padding: 12,
                backgroundColor: bg,
                cursor: answeredIdx !== null ? "default" : "pointer"
              }}
              onClick={() => choose(i)}
              disabled={answeredIdx !== null}
            >
              {o}
            </button>
          </div>
        );
      })}
      <div style={{ marginTop: 12, color: "#9fb3c8" }}>Score: {score}</div>
    </div>
  );
}
