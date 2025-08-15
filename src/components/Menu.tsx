import React from "react";

export default function Menu({ onSelect, onBack }: { onSelect: (v: "quiz" | "upload" | "message" | "menu") => void; onBack: () => void }) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
      <div style={{flex:1, display:"flex", gap:12}} className="menu">
        <div className="card" onClick={() => onSelect("quiz")}>
          <strong>Quiz</strong>
          <div style={{color:"#9fb3c8", marginTop:6}}>How well do you know the couple? Great for audience interaction.</div>
        </div>
        <div className="card" onClick={() => onSelect("upload")}>
          <strong>Upload Photo</strong>
          <div style={{color:"#9fb3c8", marginTop:6}}>Upload a memory photo to display on the page live.</div>
        </div>
        <div className="card" onClick={() => onSelect("message")}>
          <strong>Leave a Message</strong>
          <div style={{color:"#9fb3c8", marginTop:6}}>Guests can leave short messages that you can read out.</div>
        </div>
      </div>

      <div style={{minWidth:120, display:"flex", justifyContent:"flex-end"}}>
        <button className="small" style={{marginRight:8}} onClick={() => onSelect("menu")}>Home</button>
        <button className="primary" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
