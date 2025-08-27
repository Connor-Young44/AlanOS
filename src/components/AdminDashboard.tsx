import React, { useState } from "react";
import AdminQuizPanel from "../admin/AdminQuizPanel";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"quiz" | "photos" | "messages">("quiz");

  return (
    <div style={{ padding: 20 }}>
      <h1>🎛 Admin Dashboard</h1>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setActiveTab("quiz")}>Quiz Control</button>
        <button onClick={() => setActiveTab("photos")}>Photo Slideshow</button>
        <button onClick={() => setActiveTab("messages")}>Messages</button>
      </div>

      {activeTab === "quiz" && (
        <AdminQuizPanel />
      )}

      {activeTab === "photos" && (
        <div>
          <h2>📸 Photo Slideshow</h2>
          <p>Slideshow of guest-uploaded photos will appear here.</p>
          {/* Later: Pull from Cloudinary and show in carousel */}
        </div>
      )}

      {activeTab === "messages" && (
        <div>
          <h2>💬 Guest Messages</h2>
          <p>Show live guest messages here.</p>
          {/* Later: Hook into Firebase or backend to stream messages */}
        </div>
      )}
    </div>
  );
}
