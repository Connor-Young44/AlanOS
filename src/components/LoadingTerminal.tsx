import React, { useEffect, useState } from "react";

const funnyQuotes = [
  "Pouring drinks...",
  "Finding embarrassing stories...",
  "Compiling heartfelt metaphors...",
  "Syncing dance moves (low bandwidth)...",
  "Scanning single friends for availability...",
  "Assembling dad-joke fallback...",
  "Verifying cake backup plan...",
  "Loading best man speech generator...",
  "Calculating optimal toast timing..."
];

export default function LoadingTerminal({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState<number>(0);
  const [currentQuote, setCurrentQuote] = useState<string>(funnyQuotes[0]);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    // Smoothly animate progress from 0 to 100 (slower for readability)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            if (mounted) onFinished();
          }, 800);
          return 100;
        }
        // Slower increment for longer loading time
        const increment = Math.random() * 1.5 + 0.8;
        return Math.min(100, prev + increment);
      });
    }, 150);

    // Rotate through funny quotes (longer time to read each one)
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => {
        const next = (prev + 1) % funnyQuotes.length;
        setCurrentQuote(funnyQuotes[next]);
        return next;
      });
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(progressInterval);
      clearInterval(quoteInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="terminal">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Best Man Installer v1.0</div>
        <div style={{ color: "#7fb1c8", fontSize: 13 }}>initializing...</div>
      </div>

      {/* Single loading bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="bar" style={{ flex: 1 }}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <div style={{ width: 50, textAlign: "right", color: "#88b", fontSize: 14, fontWeight: 600 }}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* Rotating funny quote underneath */}
      <div style={{ 
        color: "#7fb1c8", 
        fontSize: 14, 
        minHeight: 20,
        transition: "opacity 0.3s ease",
        opacity: progress < 100 ? 1 : 0
      }}>
        {currentQuote}
      </div>

      <div style={{ marginTop: 20, color: "#6f8da4", fontSize: 13 }}>
        💡 Tip: Keep this open during your speech for comic timing.
      </div>
    </div>
  );
}
