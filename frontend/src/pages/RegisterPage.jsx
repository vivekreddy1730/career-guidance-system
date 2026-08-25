// RegisterPage.jsx — same OTP flow as Login, but always redirects to /profile after
import React from "react";
import { Link } from "react-router-dom";
import LoginPage from "./LoginPage";

// Registration and login use identical OTP flow (Firebase Phone Auth)
// The difference is backend: new users are auto-created and marked as new
// This page simply wraps LoginPage with a "register" context label.
export default function RegisterPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)" }}>
      <LoginPage />
    </div>
  );
}
