import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
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
});
