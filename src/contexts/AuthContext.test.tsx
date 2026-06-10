import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import React from "react";

// Mock Firebase auth
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Immediately call with null user
    callback(null);
    return jest.fn(); // unsubscribe function
  }),
  signInAnonymously: jest.fn(),
  browserLocalPersistence: {},
  setPersistence: jest.fn(() => Promise.resolve()),
}));

jest.mock("../lib/firebase", () => ({
  auth: {},
  db: {},
}));

describe("AuthContext", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if useAuth is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
    
    consoleSpy.mockRestore();
  });

  it("should provide initial auth state", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should call signInWithEmailAndPassword when signInWithEmail is called", async () => {
    const mockSignIn = signInWithEmailAndPassword as jest.Mock;
    mockSignIn.mockResolvedValue({ user: { uid: "test-uid", email: "test@example.com" } });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(async () => {
      await result.current.signInWithEmail("test@example.com", "password123");
    });

    expect(mockSignIn).toHaveBeenCalledWith({}, "test@example.com", "password123");
  });

  it("should handle sign-in errors correctly", async () => {
    const mockSignIn = signInWithEmailAndPassword as jest.Mock;
    mockSignIn.mockRejectedValue({ code: "auth/wrong-password", message: "Wrong password" });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await expect(
      result.current.signInWithEmail("test@example.com", "wrongpassword")
    ).rejects.toThrow("Invalid email or password");

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid email or password");
    });
  });

  it("should call firebaseSignOut when signOut is called", async () => {
    const mockSignOut = firebaseSignOut as jest.Mock;
    mockSignOut.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await result.current.signOut();

    expect(mockSignOut).toHaveBeenCalledWith({});
  });

  it("should clear error when clearError is called", async () => {
    const mockSignIn = signInWithEmailAndPassword as jest.Mock;
    mockSignIn.mockRejectedValue({ code: "auth/invalid-email", message: "Invalid email" });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Trigger an error
    await expect(
      result.current.signInWithEmail("invalid", "password")
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Clear the error
    result.current.clearError();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  // ── signInAnonymously ─────────────────────────────────────────────────────

  it("calls firebaseSignInAnonymously when signInAnonymously is called", async () => {
    (signInAnonymously as jest.Mock).mockResolvedValue({
      user: { uid: "anon-123", isAnonymous: true },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await result.current.signInAnonymously();
    expect(signInAnonymously).toHaveBeenCalled();
  });

  it("sets a helpful error message for auth/configuration-not-found", async () => {
    (signInAnonymously as jest.Mock).mockRejectedValue({
      code: "auth/configuration-not-found",
      message: "Configuration not found",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await expect(result.current.signInAnonymously()).rejects.toThrow();
    await waitFor(() =>
      expect(result.current.error).toMatch(/anonymous authentication is not enabled/i)
    );
  });

  // ── isAdmin via auth state ────────────────────────────────────────────────

  it("sets isAdmin=true when the ID token has admin custom claim", async () => {
    const mockUser = {
      uid: "admin-uid",
      email: "other@example.com",
      isAnonymous: false,
      getIdTokenResult: jest.fn().mockResolvedValue({ claims: { admin: true } }),
    };

    (onAuthStateChanged as jest.Mock).mockImplementationOnce((_, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("sets isAdmin=true when the user email matches ADMIN_EMAIL env var", async () => {
    const mockUser = {
      uid: "user-uid",
      email: "admin@test.com", // matches the ADMIN_EMAIL in src/__mocks__/env.ts
      isAnonymous: false,
      getIdTokenResult: jest.fn().mockResolvedValue({ claims: {} }),
    };

    (onAuthStateChanged as jest.Mock).mockImplementationOnce((_, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => expect(result.current.isAdmin).toBe(true));
  });

  it("sets isAdmin=false when neither claim nor email match", async () => {
    const mockUser = {
      uid: "user-uid",
      email: "guest@example.com",
      isAnonymous: false,
      getIdTokenResult: jest.fn().mockResolvedValue({ claims: {} }),
    };

    (onAuthStateChanged as jest.Mock).mockImplementationOnce((_, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ── signOut error handling ────────────────────────────────────────────────

  it("sets an error and re-throws when signOut fails", async () => {
    (firebaseSignOut as jest.Mock).mockRejectedValue({
      code: "auth/network-request-failed",
      message: "Network request failed",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await expect(result.current.signOut()).rejects.toThrow("Network request failed");
    await waitFor(() =>
      expect(result.current.error).toBe("Network request failed")
    );
  });
});
