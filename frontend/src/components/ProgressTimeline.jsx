import React from "react";

export default function ProgressTimeline({ milestones = [], onToggle }) {
  const completed = milestones.filter((m) => m.is_completed).length;
  const progress = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;

  return (
    <div>
      {/* Overall progress */}
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-2">
          <span className="fw-600">Overall Progress</span>
          <span className="text-brand fw-700">{progress}%</span>
        </div>
        <div className="progress-brand">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <small className="text-muted-dark">{completed} of {milestones.length} months completed</small>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {milestones.map((m) => (
          <div key={m.id} className={`timeline-item ${m.is_completed ? "completed" : ""}`}>
            <div className="timeline-dot" />
            <div className={`glass-card p-4 ${m.is_completed ? "opacity-75" : ""}`}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="badge-brand mb-1 d-inline-block" style={{ fontSize: "0.7rem" }}>
                    Month {m.month}
                  </span>
                  <h6 className="fw-700 mb-0" style={{ fontSize: "1rem" }}>
                    {m.is_completed && "✅ "}{m.title}
                  </h6>
                </div>
                {onToggle && (
                  <button
                    className={`btn btn-sm ${m.is_completed ? "btn-outline-secondary" : "btn-brand"}`}
                    onClick={() => onToggle(m.id, !m.is_completed)}
                    style={{ fontSize: "0.75rem", minWidth: "100px" }}
                  >
                    {m.is_completed ? "Mark Incomplete" : "Mark Complete"}
                  </button>
                )}
              </div>

              {m.description && (
                <p className="text-muted-dark mb-3" style={{ fontSize: "0.875rem" }}>
                  {m.description}
                </p>
              )}

              {/* Tasks */}
              {m.tasks?.length > 0 && (
                <div className="mb-3">
                  <p className="fw-600 mb-2" style={{ fontSize: "0.8rem", color: "var(--brand-accent)", textTransform: "uppercase" }}>
                    🎯 Tasks
                  </p>
                  <ul className="mb-0 ps-3">
                    {m.tasks.map((task, i) => (
                      <li key={i} className="text-muted-dark mb-1" style={{ fontSize: "0.875rem" }}>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Courses */}
              {m.courses?.length > 0 && (
                <div className="mb-2">
                  <p className="fw-600 mb-2" style={{ fontSize: "0.8rem", color: "var(--brand-primary)", textTransform: "uppercase" }}>
                    📚 Recommended Courses
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {m.courses.map((c, i) => (
                      <a
                        key={i}
                        href={c.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge-brand text-decoration-none"
                        style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                      >
                        {c.provider || ""} · {c.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
