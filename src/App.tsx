import React, { useState } from "react";
import LoadingTerminal from "./components/LoadingTerminal";
import Menu from "./components/Menu";
import Quiz from "./components/Quiz";
import UploadPhoto from "./components/UploadPhoto";
import LeaveMessage from "./components/LeaveMessage";

type View = "loading" | "menu" | "quiz" | "upload" | "message";

export default function App() {
  const [view, setView] = useState<View>("loading");

  return (
    <div className="app">
      {view === "loading" && <LoadingTerminal onFinished={() => setView("menu")} />}
      {view !== "loading" && (
        <>
          <Menu onSelect={(v) => setView(v)} onBack={() => setView("menu")} />
          <div className="content">
            {view === "menu" && <div style={{padding:20}}>Pick a card above to start. You can keep this open while you speak — the terminal is great for comedic timing.</div>}
            {view === "quiz" && <Quiz />}
            {view === "upload" && <UploadPhoto />}
            {view === "message" && <LeaveMessage />}
          </div>
        </>
      )}
    </div>
  );
}
