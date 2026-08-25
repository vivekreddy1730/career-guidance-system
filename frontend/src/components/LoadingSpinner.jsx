import React from "react";

export default function LoadingSpinner({ size = "md", text = "Loading...", fullPage = false }) {
  const sizeMap = { sm: "1rem", md: "2rem", lg: "3rem" };

  const spinner = (
    <div className={`d-flex flex-column align-items-center justify-content-center gap-3 ${fullPage ? "vh-100" : "py-5"}`}>
      <div
        className="spinner-border"
        role="status"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          color: "var(--brand-primary)",
          borderWidth: "3px",
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <p className="text-muted-dark mb-0" style={{ fontSize: "0.9rem" }}>
          {text}
        </p>
      )}
    </div>
  );

  return spinner;
}
