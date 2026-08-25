import React from "react";

export default function EmptyState({ icon = "📭", title = "Nothing here yet", description = "", action = null }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
      <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>{icon}</div>
      <h5 className="fw-700 mb-2">{title}</h5>
      {description && (
        <p className="text-muted-dark mb-4" style={{ maxWidth: 380 }}>{description}</p>
      )}
      {action}
    </div>
  );
}
