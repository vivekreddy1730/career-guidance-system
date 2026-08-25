import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ProgressTimeline from "../components/ProgressTimeline";
import { getRoadmap, generateRoadmap, completeMilestone } from "../api/endpoints";

export default function RoadmapPage() {
  const [searchParams] = useSearchParams();
  const careerParam = searchParams.get("career");

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getRoadmap(careerParam)
      .then((res) => setRoadmap(res.data.roadmap))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [careerParam]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await generateRoadmap(careerParam);
      setRoadmap(res.data.roadmap);
    } catch (err) {
      setError(err.response?.data?.detail || "Roadmap generation failed. Run career prediction first.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleMilestone = async (milestoneId, isCompleted) => {
    try {
      await completeMilestone(milestoneId, isCompleted);
      setRoadmap((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === milestoneId ? { ...m, is_completed: isCompleted } : m
        ),
      }));
    } catch (err) {
      console.error("Milestone update failed:", err);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading your roadmap..." />;

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          <h2 className="gradient-text mb-1">Career Roadmap</h2>
          <p className="text-muted-dark mb-4">Your personalized month-by-month learning plan</p>

          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {!roadmap ? (
            <div className="glass-card p-5 text-center">
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗺️</div>
              <h4 className="fw-700 mb-2">Generate Your Learning Roadmap</h4>
              <p className="text-muted-dark mb-4">
                An AI-powered, month-by-month plan with courses, certifications, and milestones — personalized for{" "}
                <strong>{careerParam || "your predicted career"}</strong>.
              </p>
              <button className="btn-brand btn btn-lg px-5" onClick={handleGenerate} disabled={generating}>
                {generating ? <LoadingSpinner size="sm" text="Generating with AI..." /> : "🤖 Generate Roadmap →"}
              </button>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="glass-card p-4 mb-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h4 className="fw-700 mb-1">{roadmap.career_title} Roadmap</h4>
                    <p className="text-muted-dark mb-0" style={{ fontSize: "0.875rem" }}>
                      {roadmap.total_months} months · {roadmap.milestones.filter((m) => m.is_completed).length} completed
                    </p>
                  </div>
                  <button className="btn-outline-brand btn btn-sm" onClick={handleGenerate} disabled={generating}>
                    {generating ? "Regenerating..." : "↻ Regenerate"}
                  </button>
                </div>
                {roadmap.summary && (
                  <p className="text-muted-dark mt-3 mb-0" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
                    {roadmap.summary}
                  </p>
                )}
              </div>

              <ProgressTimeline
                milestones={roadmap.milestones}
                onToggle={handleToggleMilestone}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
