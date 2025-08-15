import React, { useEffect, useState } from "react";

const tasks = [
  "Pouringing drinks...",
  "Finding embarrassing stories...",
  "Compiling heartfelt metaphors...",
  "Syncing dance moves (low-bandwidth)...",
  "Scanning single friends for availability...",
  "Assembling dad-joke fallback..."
];

export default function LoadingTerminal({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState<number>(0);
  const [lines, setLines] = useState<{ label: string; pct: number }[]>([]);

  useEffect(() => {
    let mounted = true;
    // simulate progressive task completion: each tick we push next task with a percent then finalize
    let tick = 0;

    function nextStep() {
      if (!mounted) return;
      if (tick < tasks.length) {
        const target = 90 - (tasks.length - tick) * 5; // stagger
        const label = tasks[tick];

        // animate this task from 0 to target
        let inner = 0;
        const id = setInterval(() => {
          inner += Math.random() * 8 + 3;
          if (inner >= target) inner = target;
          setLines((prev) => {
            const copy = prev.slice();
            copy[tick] = { label, pct: Math.round(inner) };
            return copy;
          });
          setProgress((p) => Math.min(100, Math.max(p, Math.round((tick / tasks.length) * 100 + inner / tasks.length))));
          if (inner >= target) {
            clearInterval(id);
            tick++;
            setTimeout(nextStep, 400 + Math.random() * 600);
          }
        }, 140);
      } else {
        // finish final surge to 100
        let final = progress;
        const id2 = setInterval(() => {
          final += Math.random() * 6 + 6;
          if (final >= 100) final = 100;
          setProgress(Math.round(final));
          if (final >= 100) {
            clearInterval(id2);
            setTimeout(() => {
              if (mounted) onFinished();
            }, 700);
          }
        }, 120);
      }
    }

    // initialize lines array
    setLines(tasks.map((t) => ({ label: t, pct: 0 })));
    nextStep();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="terminal">
      <div style={{display:"flex",justifyContent:"space-between", marginBottom:10}}>
        <div style={{fontWeight:700}}>Best Man Installer v1.0</div>
        <div style={{color:"#7fb1c8", fontSize:13}}>ready</div>
      </div>

      {lines.map((l, i) => (
        <div className="progress-row" key={i}>
          <div className="progress-label">[{i+1}/{lines.length}] {l.label}</div>
          <div className="bar"><i style={{ width: `${l.pct}%` }} /></div>
          <div style={{width:60, textAlign:"right", color:"#88b", fontSize:13}}>{l.pct}%</div>
        </div>
      ))}

      <div style={{height:10}} />

      <div style={{display:"flex", alignItems:"center", gap:12, marginTop:8}}>
        <div className="progress-label">Overall</div>
        <div className="bar"><i style={{ width: `${progress}%` }} /></div>
        <div style={{width:60, textAlign:"right", color:"#88b", fontSize:13}}>{progress}%</div>
      </div>

      <div style={{marginTop:14, color:"#6f8da4", fontSize:13}}>
        Tip: keep this up during your speech — reveal each section as the bar moves for comic timing.
      </div>
    </div>
  );
}
