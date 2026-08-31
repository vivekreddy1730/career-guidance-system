import React from "react";
import { Link } from "react-router-dom";

export default function StatCard({ icon, label, value, sub, color = "#6366f1", link }) {
  const cardContent = (
    <div className="stat-card h-100" style={{ cursor: link ? "pointer" : "default" }}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span className="text-muted-dark" style={{ fontSize: "0.85rem", fontWeight: 500 }}>
          {label}
        </span>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
          }}
        >
          {icon}
        </div>
      </div>
      <div className="fw-800 mb-1" style={{ fontSize: "1.6rem", color: "var(--text-light)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-muted-dark" style={{ fontSize: "0.75rem" }}>
          {sub}
        </div>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="text-decoration-none">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
