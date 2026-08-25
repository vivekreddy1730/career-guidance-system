import React from "react";

export function CourseCard({ course }) {
  const providerColors = {
    Coursera: "#0056D3",
    Udemy:    "#A435F0",
    edX:      "#02262B",
    NPTEL:    "#F7A800",
  };

  return (
    <div className="glass-card p-3 h-100">
      <div className="d-flex align-items-start gap-2 mb-2">
        <span
          className="badge text-white px-2 py-1"
          style={{
            background: providerColors[course.provider] || "#6366f1",
            fontSize: "0.7rem",
            borderRadius: "6px",
          }}
        >
          {course.provider}
        </span>
        {course.is_free && (
          <span className="badge-brand badge-success" style={{ fontSize: "0.7rem", borderRadius: "6px", padding: "2px 8px" }}>
            Free
          </span>
        )}
      </div>
      <h6 className="fw-600 mb-1" style={{ fontSize: "0.875rem", lineHeight: 1.4 }}>
        {course.title}
      </h6>
      <div className="d-flex align-items-center gap-3 mb-3">
        {course.duration_weeks && (
          <small className="text-muted-dark">⏱ {course.duration_weeks}w</small>
        )}
        {course.level && (
          <small className="text-muted-dark text-capitalize">📊 {course.level}</small>
        )}
      </div>
      {course.url && (
        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-brand btn btn-sm w-100"
          style={{ fontSize: "0.8rem" }}
        >
          Enroll →
        </a>
      )}
    </div>
  );
}

export function CertCard({ cert }) {
  return (
    <div className="glass-card p-3 h-100">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span className="badge-brand" style={{ fontSize: "0.7rem" }}>{cert.provider}</span>
        {cert.cost_usd === 0 && (
          <span className="badge-brand badge-success" style={{ fontSize: "0.7rem" }}>Free</span>
        )}
        {cert.cost_usd > 0 && (
          <small className="text-muted-dark">${cert.cost_usd}</small>
        )}
      </div>
      <h6 className="fw-600 mb-2" style={{ fontSize: "0.875rem", lineHeight: 1.4 }}>
        {cert.name}
      </h6>
      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="badge-brand" style={{ fontSize: "0.7rem", textTransform: "capitalize" }}>
          {cert.level}
        </span>
      </div>
      {cert.url && (
        <a
          href={cert.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-brand btn btn-sm w-100"
          style={{ fontSize: "0.8rem" }}
        >
          Learn More →
        </a>
      )}
    </div>
  );
}
