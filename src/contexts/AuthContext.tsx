import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  browserLocalPersistence,
  setPersistence,
  AuthError,
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set persistence to LOCAL (survives page refreshes)
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error("Failed to set auth persistence:", err);
    });

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        console.log("🔐 Auth state changed:", user ? `User: ${user.email || user.uid}` : "No user");
        setCurrentUser(user);
        
        if (user) {
          // Check if user is admin by checking custom claims or email
          try {
            const tokenResult = await user.getIdTokenResult();
            const isAdminClaim = tokenResult.claims.admin === true;
            
            // Also check if email matches admin email from env
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@example.com";
            const isAdminEmail = user.email ? user.email === adminEmail : false;
            
            const adminStatus = isAdminClaim || isAdminEmail;
            console.log("👤 Admin check:", { 
              email: user.email, 
              isAnonymous: user.isAnonymous,
              isAdminClaim, 
              isAdminEmail, 
              adminStatus 
            });
            setIsAdmin(adminStatus);
          } catch (err) {
            console.error("Failed to get ID token:", err);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
        
        console.log("✅ Auth loading complete");
        setIsLoading(false);
      },
      (err) => {
        console.error("Auth state change error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Token refresh for authenticated users
  useEffect(() => {
    if (!currentUser || currentUser.isAnonymous) return;

    // Refresh token every 55 minutes
    const refreshInterval = setInterval(async () => {
      try {
        await currentUser.getIdToken(true);
        console.log("🔄 Token refreshed");
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
    }, 55 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = "Failed to sign in";
      
      switch (authError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid email or password";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          errorMessage = authError.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signInAnonymously = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = authError.message;
      
      // Provide helpful error messages
      if (authError.code === "auth/configuration-not-found") {
        errorMessage = "Anonymous authentication is not enabled. Enable it in Firebase Console > Authentication > Sign-in method.";
      }
      
      setError(errorMessage);
      console.error("Anonymous sign-in failed:", authError.code, authError.message);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      throw new Error(authError.message);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    currentUser,
    isAdmin,
    isLoading,
    error,
    signInWithEmail,
    signInAnonymously,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
