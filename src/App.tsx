import React, { useState, useEffect } from "react";
import LoadingTerminal from "./components/LoadingTerminal";
import Menu from "./components/Menu";
import Quiz from "./components/Quiz";
import UploadPhoto from "./components/UploadPhoto";
import LeaveMessage from "./components/LeaveMessage";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import QuizProjector from "./components/QuizProjector";
import { useAuth } from "./contexts/AuthContext";

type View = "admin" | "loading" | "menu" | "quiz" | "upload" | "message";

export default function App() {
  const [view, setView] = useState<View>("loading");
  const [requestedAdmin, setRequestedAdmin] = useState(false);
  const [isProjector, setIsProjector] = useState(false);
  const { currentUser, isAdmin, isLoading: authLoading, signInAnonymously, signOut, error: authError } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    
    if (path === "/projector") {
      setIsProjector(true);
      return;
    }
    
    if (params.has("admin")) {
      setRequestedAdmin(true);
    } else {
      setRequestedAdmin(false);
    }
  }, []);

  // Also check for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has("admin")) {
        setRequestedAdmin(true);
      } else {
        setRequestedAdmin(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    // Auto sign-in anonymously during loading screen for guest users
    if (!authLoading && !currentUser && !requestedAdmin) {
      signInAnonymously().catch((err) => {
        console.error("⚠️ Anonymous sign-in failed. Guest features may be limited:", err.message);
        // Don't block the UI - let users continue without auth if anonymous auth isn't enabled
      });
    }
  }, [authLoading, currentUser, requestedAdmin, signInAnonymously]);

  // Debug logging
  useEffect(() => {
    console.log("🔍 App state:", { 
      authLoading, 
      currentUser: currentUser?.email || currentUser?.uid?.slice(0,8), 
      isAdmin, 
      requestedAdmin, 
      view 
    });
  }, [authLoading, currentUser, isAdmin, requestedAdmin, view]);

  // Projector view (full screen quiz display)
  if (isProjector) {
    return <QuizProjector />;
  }

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="app" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        flexDirection: "column",
        gap: "10px"
      }}>
        <div>Loading authentication...</div>
        {requestedAdmin && (
          <div style={{ fontSize: "12px", color: "#888" }}>
            Preparing admin login...
          </div>
        )}
      </div>
    );
  }

  // Admin route guard: if ?admin is in URL, show login or dashboard
  if (requestedAdmin) {
    if (!isAdmin) {
      return (
        <div className="app">
          <AdminLogin onSuccess={() => setView("admin")} />
        </div>
      );
    }
    
    return (
      <div className="app">
        <div className="content">
          <AdminDashboard />
          <div style={{ padding: "20px", textAlign: "center" }}>
            <button 
              onClick={async () => {
                await signOut();
                setRequestedAdmin(false);
                setView("loading");
                window.history.replaceState({}, '', window.location.pathname);
              }}
              style={{ fontSize: "12px" }}
            >
              ← Sign Out & Back to Guest View
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular guest flow
  return (
    <div className="app">
      {view === "loading" && (
        <LoadingTerminal onFinished={() => setView("menu")} />
      )}

      {view !== "loading" && (
        <>
          {authError && !currentUser && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(255, 193, 7, 0.95)",
              color: "#000",
              padding: "10px 20px",
              textAlign: "center",
              fontSize: "14px",
              zIndex: 1000,
              borderBottom: "2px solid #ff9800"
            }}>
              ⚠️ Authentication setup incomplete. Some features may be limited. 
              {authError.includes("Anonymous") && (
                <span> Enable Anonymous Auth in Firebase Console.</span>
              )}
            </div>
          )}
          <Menu onSelect={(v) => setView(v)} onBack={() => setView("menu")} />

          <div className="content">
            {view === "menu" && (
              <div style={{ padding: 20 }}>
                Pick a card above to start. You can keep this open while you
                speak — the terminal is great for comedic timing.
              </div>
            )}
            {view === "quiz" && <Quiz />}
            {view === "upload" && <UploadPhoto />}
            {view === "message" && <LeaveMessage />}
          </div>
        </>
      )}
    </div>
  );
}
