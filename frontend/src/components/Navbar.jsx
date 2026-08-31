import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { path: "/dashboard", icon: "⊞", label: "Dashboard" },
  { path: "/assessment",icon: "📝", label: "Assessment" },
  { path: "/results",   icon: "🎯", label: "Predictions" },
  { path: "/roadmap",   icon: "🗺️", label: "Roadmap" },
  { path: "/interview", icon: "🎙️", label: "Mock Interview" },
  { path: "/ats-scanner",icon: "📄", label: "ATS Scanner" },
  { path: "/jobs",      icon: "💼", label: "Job Market" },
  { path: "/chat",      icon: "🤖", label: "AI Advisor" },
];

export default function Navbar() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar-brand-custom px-4 py-3">
      <div className="d-flex align-items-center justify-content-between">
        {/* Brand */}
        <Link to={student ? "/dashboard" : "/"} className="text-decoration-none d-flex align-items-center gap-2">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff"
          }}>C</div>
          <span className="gradient-text fw-800" style={{ fontSize: "1.25rem", fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
            CareerAI
          </span>
        </Link>

        {/* Nav Links (desktop) */}
        {student && (
          <div className="d-none d-xl-flex gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="px-3 py-2 text-decoration-none rounded"
                style={{
                  color: window.location.pathname === item.path ? "#6366f1" : "#94a3b8",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  background: window.location.pathname === item.path ? "rgba(99,102,241,0.1)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="d-flex align-items-center gap-3">
          {student ? (
            <>
              <div className="d-flex align-items-center gap-2">
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: "0.875rem",
                }}>
                  {(student.name || student.email || student.phone || "S")[0].toUpperCase()}
                </div>
                <span className="text-secondary d-none d-md-block" style={{ fontSize: "0.875rem" }}>
                  {student.name || student.email || student.phone}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-outline-brand btn btn-sm">
                Logout
              </button>
            </>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-sm btn-outline-brand">Login</Link>
              <Link to="/register" className="btn btn-sm btn-brand">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
