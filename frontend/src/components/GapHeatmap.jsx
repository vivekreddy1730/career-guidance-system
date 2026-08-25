import React from "react";

export default function GapHeatmap({ gaps = [], strengths = [] }) {
  if (!gaps.length && !strengths.length) {
    return (
      <div className="text-muted-dark text-center py-4">
        Complete assessment and run prediction to see gap analysis
      </div>
    );
  }

  return (
    <div>
      {/* Skill Gaps */}
      {gaps.length > 0 && (
        <div className="mb-4">
          <h6 className="fw-600 mb-3 text-danger" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            📉 Skills to Develop
          </h6>
          {gaps.map((g, i) => (
            <div key={i} className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{g.skill}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {g.student_level}% / {g.required_importance}% required
                </span>
              </div>
              <div className="progress-brand">
                <div
                  className="gap-bar"
                  style={{ width: `${Math.min(g.student_level, 100)}%` }}
                />
              </div>
              <small className="text-muted-dark">Gap: {g.gap} points to close</small>
            </div>
          ))}
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <h6 className="fw-600 mb-3" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--brand-success)" }}>
            💪 Your Strengths
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {strengths.map((s, i) => (
              <span key={i} className="badge-brand badge-success px-3 py-2" style={{ borderRadius: "20px", fontSize: "0.8rem" }}>
                ✓ {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
