import React from "react";

function formatSalary(amount) {
  if (!amount) return "N/A";
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function JobCard({ job }) {
  const sourceBadge = {
    adzuna: { label: "Adzuna", color: "#10b981" },
    jsearch: { label: "JSearch", color: "#6366f1" },
    mock: { label: "Sample", color: "#64748b" },
  };
  const badge = sourceBadge[job.source] || sourceBadge.mock;

  return (
    <div className="glass-card p-4 h-100 fade-in-up">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span
          className="badge text-white px-2 py-1"
          style={{ background: badge.color, fontSize: "0.65rem", borderRadius: "6px" }}
        >
          {badge.label}
        </span>
        {job.created && (
          <small className="text-muted-dark">{new Date(job.created).toLocaleDateString()}</small>
        )}
      </div>

      <h6 className="fw-600 mb-1" style={{ fontSize: "0.95rem", lineHeight: 1.4 }}>
        {job.title}
      </h6>
      <p className="text-brand mb-1" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
        {job.company}
      </p>
      <p className="text-muted-dark mb-2" style={{ fontSize: "0.8rem" }}>
        📍 {job.location}
      </p>

      {(job.salary_min || job.salary_max) && (
        <div className="d-flex align-items-center gap-1 mb-2">
          <span style={{ fontSize: "0.8rem", color: "var(--brand-success)", fontWeight: 600 }}>
            💰 {formatSalary(job.salary_min)} – {formatSalary(job.salary_max)}
          </span>
          <small className="text-muted-dark">/ year</small>
        </div>
      )}

      {job.description && (
        <p className="text-muted-dark mb-3" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
          {job.description.slice(0, 120)}...
        </p>
      )}

      <a
        href={job.url !== "#" ? job.url : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-sm w-100 ${job.url !== "#" ? "btn-brand" : "btn-outline-secondary disabled"}`}
        style={{ fontSize: "0.8rem" }}
      >
        {job.url !== "#" ? "Apply Now →" : "Job Listing (Demo)"}
      </a>
    </div>
  );
}
