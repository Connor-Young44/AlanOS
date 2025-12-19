import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_API_KEY,
//   authDomain: import.meta.env.VITE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_APP_ID,
//   measurementId: import.meta.env.VITE_MEASUREMENT_ID
// };


type Msg = { id: string; name?: string; message: string; createdAt: string };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

export default function LeaveMessage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [list, setList] = useState<Msg[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    // Query messages ordered by creation date ascending
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    // Subscribe to realtime updates
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const msgs: Msg[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          name: data.name,
          message: data.message,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });
      setList(msgs);
    }, (error) => {
      setStatus("Failed to load messages.");
      console.error(error);
    });

    return () => unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setStatus("Message cannot be empty.");
      return;
    }
    setStatus("Sending...");
    try {
      await addDoc(collection(db, "messages"), {
        name: name.trim() || "Anonymous",
        message: message.trim(),
        createdAt: serverTimestamp(), // Use server timestamp for accurate sorting
      });
      setMessage("");
      setStatus("Sent!");
    } catch (error) {
      setStatus("Failed to send message.");
      console.error(error);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{
        backgroundColor: "rgba(25, 118, 210, 0.1)",
        border: "2px solid rgba(25, 118, 210, 0.3)",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24
      }}>
        <h3 style={{ margin: 0, marginBottom: 4, fontSize: 18, fontWeight: 600 }}>💬 Leave a Message</h3>
        <p style={{ margin: 0, fontSize: 14, color: "#888" }}>Share your thoughts with everyone</p>
      </div>
      
      <form onSubmit={onSubmit} style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: 12,
        marginBottom: 12
      }}>
        <input
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          style={{
            padding: 14,
            fontSize: 16,
            borderRadius: 8,
            border: "2px solid #333",
            backgroundColor: "#1a1a1a",
            color: "#fff"
          }}
        />
        <textarea
          placeholder="Leave a short message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={3}
          style={{
            padding: 14,
            fontSize: 16,
            borderRadius: 8,
            border: "2px solid #333",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />
        <button 
          className="primary" 
          type="submit"
          style={{
            padding: 16,
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8
          }}
        >
          Send Message
        </button>
      </form>
      {status && (
        <div style={{ 
          marginTop: 12, 
          padding: 12,
          backgroundColor: status.includes("Failed") ? "rgba(244, 67, 54, 0.1)" : "rgba(76, 175, 80, 0.1)",
          border: `2px solid ${status.includes("Failed") ? "#f44336" : "#4caf50"}`,
          borderRadius: 8,
          color: status.includes("Failed") ? "#f44336" : "#4caf50",
          textAlign: "center",
          fontWeight: 500
        }}>
          {status}
        </div>
      )}

      <div className="message-list" style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Recent Messages</h3>
        {list.length === 0 && (
          <div style={{ 
            padding: 40,
            textAlign: "center",
            color: "#666",
            fontSize: 16,
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
            border: "2px dashed #333"
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💭</div>
            No messages yet — be the first!
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((m) => (
            <div key={m.id} style={{
              padding: 16,
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              border: "2px solid #2a2a2a",
              transition: "all 0.2s ease"
            }}>
              <div style={{ 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: 8,
                gap: 12,
                flexWrap: "wrap"
              }}>
                <span style={{ fontWeight: 600, color: "#4a9eff", fontSize: 15 }}>
                  {m.name || "Anonymous"}
                </span>
                <span style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ color: "#ddd", lineHeight: 1.5, fontSize: 15 }}>{m.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
