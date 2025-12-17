import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInWithEmail, error, isLoading, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      return;
    }

    try {
      await signInWithEmail(email, password);
      onSuccess();
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{ 
        maxWidth: "400px", 
        width: "100%",
        padding: "30px",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        border: "1px solid #333"
      }}>
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>🔐 Admin Login</h2>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label htmlFor="email" style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          {error && (
            <div style={{ 
              color: "#ff6b6b", 
              fontSize: "14px", 
              padding: "10px",
              backgroundColor: "rgba(255, 107, 107, 0.1)",
              borderRadius: "4px",
              border: "1px solid rgba(255, 107, 107, 0.3)"
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="primary"
            style={{ 
              width: "100%", 
              padding: "12px",
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ 
          marginTop: "20px", 
          fontSize: "12px", 
          textAlign: "center", 
          color: "#888" 
        }}>
          Admin access only. Contact system administrator if you need access.
        </div>
      </div>
    </div>
  );
}
