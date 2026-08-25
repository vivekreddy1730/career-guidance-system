import React from "react";
import { NavLink } from "react-router-dom";

const MENU = [
  { path: "/dashboard", icon: "⊞", label: "Dashboard" },
  { path: "/profile",   icon: "👤", label: "Profile" },
  { path: "/assessment",icon: "📝", label: "Assessment" },
  { path: "/results",   icon: "🎯", label: "Predictions" },
  { path: "/roadmap",   icon: "🗺️", label: "Roadmap" },
  { path: "/jobs",      icon: "💼", label: "Job Market" },
  { path: "/chat",      icon: "🤖", label: "AI Advisor" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar d-none d-lg-flex flex-column">
      <p className="text-muted-dark text-uppercase fw-600 mb-2" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>
        Navigation
      </p>
      {MENU.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="mt-auto pt-3 border-top" style={{ borderColor: "var(--border-color)" }}>
        <div className="d-flex align-items-center gap-2 px-2">
          <span className="live-dot"></span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>System Online</span>
        </div>
      </div>
    </aside>
  );
}
