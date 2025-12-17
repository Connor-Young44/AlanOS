import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLogin from "./AdminLogin";
import { AuthProvider } from "../contexts/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";

// Mock Firebase
jest.mock("firebase/auth");
jest.mock("../lib/firebase", () => ({
  auth: {},
  db: {},
}));

const mockOnSuccess = jest.fn();

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe("AdminLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: "admin-uid", email: "admin@example.com" },
    });
  });

  it("should render login form", () => {
    renderWithAuth(<AdminLogin onSuccess={mockOnSuccess} />);

    expect(screen.getByText("🔐 Admin Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("should call signInWithEmail when form is submitted", async () => {
    renderWithAuth(<AdminLogin onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "admin@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it("should display error message on failed login", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: "auth/wrong-password",
      message: "Wrong password",
    });

    renderWithAuth(<AdminLogin onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "admin@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("should show loading state during sign-in", async () => {
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });
    (signInWithEmailAndPassword as jest.Mock).mockReturnValue(signInPromise);

    renderWithAuth(<AdminLogin onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "admin@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveSignIn!({ user: { uid: "test" } });
    
    await waitFor(() => {
      expect(screen.queryByText("Signing in...")).not.toBeInTheDocument();
    });
  });
});
