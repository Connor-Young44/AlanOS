import React, { useState, useEffect } from "react";
import AdminQuizPanel from "../admin/AdminQuizPanel";
import PhotoCarousel, { type Photo } from "./PhotoCarousel";
import UploadPhoto from "./UploadPhoto";
import { listPhotos, openPhotoProjectorWindow, listUnvettedPhotos, approvePhoto, deletePhoto } from "../lib/photoStorage";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, deleteDoc, DocumentData, QuerySnapshot } from "firebase/firestore";

type Message = { id: string; name?: string; message: string; createdAt: any };

function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const msgs: Message[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          name: data.name,
          message: data.message,
          createdAt: data.createdAt,
        });
      });
      setMessages(msgs);
    }, (error) => {
      console.error("Failed to load messages:", error);
    });
    return () => unsubscribe();
  }, []);

  async function handleDelete(messageId: string) {
    if (!confirm("Delete this message?")) return;
    setDeleting(messageId);
    try {
      await deleteDoc(doc(db, "messages", messageId));
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {messages.length === 0 && (
        <p style={{ color: "#888" }}>No messages yet.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              padding: 16,
              backgroundColor: "#1a1a1a",
              borderRadius: 8,
              border: "1px solid #333",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {msg.name || "Anonymous"}
                  <span style={{ fontWeight: 400, color: "#888", marginLeft: 8 }}>
                    {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleString() : ""}
                  </span>
                </div>
                <div style={{ color: "#ddd" }}>{msg.message}</div>
              </div>
              <button
                onClick={() => handleDelete(msg.id)}
                disabled={deleting === msg.id}
                style={{
                  padding: "4px 12px",
                  backgroundColor: "#d32f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {deleting === msg.id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"quiz" | "photos" | "messages">("quiz");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadsEnabled, setUploadsEnabled] = useState<boolean>(true);
  const [messagesEnabled, setMessagesEnabled] = useState<boolean>(true);
  const [photoLimit, setPhotoLimit] = useState<number>(50);
  const [hasMore, setHasMore] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<Array<Photo & { docId: string }>>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  // Load photos when photos tab is active
  useEffect(() => {
    if (activeTab === "photos") {
      loadPhotos();
      loadPendingPhotos();
      loadUploadState();
    }
    if (activeTab === "messages") {
      loadMessagesState();
    }
  }, [activeTab]);

  async function loadUploadState() {
    try {
      const docRef = doc(db, "photo_upload", "state");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUploadsEnabled(docSnap.data().enabled ?? true);
      }
    } catch (error) {
      console.error("Error loading upload state:", error);
    }
  }

  async function toggleUploads() {
    try {
      const newState = !uploadsEnabled;
      const docRef = doc(db, "photo_upload", "state");
      await setDoc(docRef, { enabled: newState });
      setUploadsEnabled(newState);
    } catch (error) {
      console.error("Error toggling uploads:", error);
    }
  }

  async function loadMessagesState() {
    try {
      const docRef = doc(db, "messages_state", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMessagesEnabled(docSnap.data().enabled ?? true);
      }
    } catch (error) {
      console.error("Error loading messages state:", error);
    }
  }

  async function toggleMessages() {
    try {
      const newState = !messagesEnabled;
      const docRef = doc(db, "messages_state", "config");
      await setDoc(docRef, { enabled: newState });
      setMessagesEnabled(newState);
    } catch (error) {
      console.error("Error toggling messages:", error);
    }
  }

  async function loadPhotos(limit?: number) {
    setLoading(true);
    try {
      const photoList = await listPhotos(limit || photoLimit);
      setPhotos(photoList);
      // Check if there might be more photos
      setHasMore(photoList.length === (limit || photoLimit));
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingPhotos() {
    try {
      const pending = await listUnvettedPhotos();
      setPendingPhotos(pending);
    } catch (error) {
      console.error("Failed to load pending photos:", error);
    }
  }

  function handlePhotoUploaded() {
    // Refresh pending photos after upload
    loadPendingPhotos();
  }

  async function handleApprove(photoId: string) {
    setProcessing(photoId);
    try {
      await approvePhoto(photoId);
      await loadPendingPhotos();
      await loadPhotos();
    } catch (error) {
      console.error("Failed to approve photo:", error);
      alert("Failed to approve photo");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(photoId: string) {
    if (!confirm("Delete this photo permanently?")) return;
    setProcessing(photoId);
    try {
      await deletePhoto(photoId);
      await loadPendingPhotos();
    } catch (error) {
      console.error("Failed to delete photo:", error);
      alert("Failed to delete photo");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDeleteApproved(photoId: string) {
    if (!confirm("Remove this photo from the carousel?")) return;
    setProcessing(photoId);
    try {
      await deletePhoto(photoId);
      await loadPhotos();
    } catch (error) {
      console.error("Failed to delete photo:", error);
      alert("Failed to delete photo");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🎛 Admin Dashboard</h1>
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <button
          onClick={() => setActiveTab("quiz")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "quiz" ? "#1976d2" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Quiz Control
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "photos" ? "#1976d2" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Photo Slideshow
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "messages" ? "#1976d2" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Messages
        </button>
      </div>

      {activeTab === "quiz" && <AdminQuizPanel />}

      {activeTab === "photos" && (
        <div>
          <h2>📸 Photo Slideshow</h2>

          {/* Upload control toggle */}
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className={uploadsEnabled ? "danger" : "primary"}
              onClick={toggleUploads}
            >
              {uploadsEnabled ? "🛑 Stop Uploads" : "✅ Enable Uploads"}
            </button>
            <span style={{ color: uploadsEnabled ? "#4caf50" : "#f44336" }}>
              {uploadsEnabled ? "Guests can upload photos" : "Photo uploads disabled"}
            </span>
          </div>

          {/* Upload section */}
          <div style={{ marginBottom: 30 }}>
            <h3>Upload New Photo</h3>
            <UploadPhoto onUploadSuccess={handlePhotoUploaded} uploadsEnabled={uploadsEnabled} />
          </div>

          {/* Pending photos section */}
          {pendingPhotos.length > 0 && (
            <div style={{ marginBottom: 30, padding: 16, backgroundColor: "#2a1a1a", borderRadius: 8, border: "2px solid #ff9800" }}>
              <h3 style={{ color: "#ff9800" }}>⏳ Pending Approval ({pendingPhotos.length})</h3>
              <p style={{ color: "#ccc", marginBottom: 16 }}>Review photos before they appear in the carousel</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {pendingPhotos.map((photo) => (
                  <div key={photo.docId} style={{ position: "relative" }}>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: 4 }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => handleApprove(photo.docId)}
                        disabled={processing === photo.docId}
                        style={{
                          flex: 1,
                          padding: "8px",
                          backgroundColor: "#4caf50",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {processing === photo.docId ? "..." : "✅ Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(photo.docId)}
                        disabled={processing === photo.docId}
                        style={{
                          flex: 1,
                          padding: "8px",
                          backgroundColor: "#d32f2f",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {processing === photo.docId ? "..." : "❌ Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo carousel */}
          <div style={{ marginBottom: 20 }}>
            <h3>Approved Photos ({photos.length})</h3>
            {loading && <p>Loading photos...</p>}
            {!loading && photos.length > 0 && (
              <PhotoCarousel
                images={photos}
                onOpenProjector={(index) => openPhotoProjectorWindow(photos, index)}
                onDelete={handleDeleteApproved}
                showDelete={true}
              />
            )}
            {!loading && photos.length === 0 && (
              <p style={{ color: "#888" }}>
                No photos uploaded yet. Upload your first photo above!
              </p>
            )}
            {!loading && hasMore && (
              <button
                className="primary"
                onClick={() => {
                  const newLimit = photoLimit + 50;
                  setPhotoLimit(newLimit);
                  loadPhotos(newLimit);
                }}
                style={{ marginTop: 12 }}
              >
                Load More Photos (showing {photos.length})
              </button>
            )}
          </div>

          <button
            onClick={() => loadPhotos()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            🔄 Refresh Photos
          </button>
        </div>
      )}

      {activeTab === "messages" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>💬 Guest Messages</h2>
            <button
              className="primary"
              onClick={toggleMessages}
              style={{
                padding: "8px 16px",
                backgroundColor: messagesEnabled ? "#d32f2f" : "#4caf50",
              }}
            >
              {messagesEnabled ? "🚫 Disable Messages" : "✅ Enable Messages"}
            </button>
          </div>
          {!messagesEnabled && (
            <div style={{
              padding: 12,
              marginBottom: 16,
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              border: "2px solid #f44336",
              borderRadius: 8,
              color: "#f44336",
              textAlign: "center"
            }}>
              ⚠️ Messages are currently disabled. Guests cannot submit new messages.
            </div>
          )}
          <MessagesList />
        </div>
      )}
    </div>
  );
}
