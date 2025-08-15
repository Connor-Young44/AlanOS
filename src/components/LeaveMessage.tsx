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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};


type Msg = { id: string; name?: string; message: string; createdAt: string };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    <div>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />
        <input
          placeholder="Leave a short message..."
          style={{ flex: 1 }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
        />
        <button className="primary" type="submit">Send</button>
      </form>
      <div style={{ marginTop: 8, color: "#9fb3c8" }}>{status}</div>

      <div className="message-list" style={{ marginTop: 12 }}>
        {list.length === 0 && <div style={{ color: "#6f8da4" }}>No messages yet — be the first!</div>}
        {list.map((m) => (
          <div key={m.id} className="msg">
            <div style={{ fontWeight: 700 }}>
              {m.name}{" "}
              <span style={{ fontWeight: 400, color: "#7f9" }}>
                · {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
            <div style={{ marginTop: 6 }}>{m.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
