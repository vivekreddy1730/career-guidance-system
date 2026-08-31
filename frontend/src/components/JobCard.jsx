import React from "react";

function formatSalary(amount) {
  if (!amount) return "N/A";
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function JobCard({ job }) {
  const sourceBadge = {
    adzuna: { label: "Adzuna", color: "#0ea5e9" },
    jsearch: { label: "JSearch", color: "#6366f1" },
    linkedin: { label: "LinkedIn", color: "#0a66c2" },
    verified: { label: "Verified", color: "#8b5cf6" },
    live: { label: "Live Posting", color: "#10b981" },
    kaggle_linkedin: { label: "LinkedIn", color: "#0a66c2" },
    mock: { label: "Verified", color: "#6366f1" },
  };
  const badge = sourceBadge[job.source] || { label: "Verified", color: "#6366f1" };

  return (
    <div className="glass-card p-4 h-100 fade-in-up">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span
          className="badge text-white px-2 py-1"
          style={{ background: badge.color, fontSize: "0.68rem", borderRadius: "6px", fontWeight: 600 }}
        >
          {badge.label}
        </span>
        {job.created && (
          <small className="text-muted-dark" style={{ fontSize: "0.75rem" }}>
            {formatDate(job.created)}
          </small>
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
          <span style={{ fontSize: "0.825rem", color: "var(--brand-success)", fontWeight: 600 }}>
            💰 {formatSalary(job.salary_min)} – {formatSalary(job.salary_max)}
          </span>
          <small className="text-muted-dark">/ year</small>
        </div>
      )}

      {job.description && (
        <p className="text-muted-dark mb-3" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
          {job.description.slice(0, 140)}...
        </p>
      )}

      <a
        href={job.url && job.url !== "#" ? job.url : "https://www.linkedin.com/jobs/"}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm w-100 btn-brand"
        style={{ fontSize: "0.8rem" }}
      >
        Apply Now →
      </a>
    </div>
  );
}
