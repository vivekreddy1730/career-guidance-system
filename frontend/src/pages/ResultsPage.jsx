import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import SkillRadarChart from "../components/SkillRadarChart";
import GapHeatmap from "../components/GapHeatmap";
import { CourseCard } from "../components/CourseCard";
import { predictCareer, getGapAnalysis, getRecommendations, getReport } from "../api/endpoints";

export default function ResultsPage() {
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [gap, setGap] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [scoreReport, setScoreReport] = useState({});
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load score report
    getReport()
      .then((res) => setScoreReport(res.data.report.score_report || {}))
      .catch(() => {});

    // Load existing predictions if any
    setLoading(false);
  }, []);

  const runPrediction = async () => {
    setPredicting(true);
    setError("");
    try {
      const res = await predictCareer();
      const preds = res.data.predictions;
      setPredictions(preds);
      if (preds.length > 0) {
        await loadGapAndRec(preds[0].career);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed. Please complete your profile and assessment first.");
    } finally {
      setPredicting(false);
    }
  };

  const loadGapAndRec = async (career) => {
    setSelectedCareer(career);
    setGapLoading(true);
    try {
      const [gapRes, recRes] = await Promise.all([
        getGapAnalysis(career),
        getRecommendations(career),
      ]);
      setGap(gapRes.data.gap_analysis);
      setRecommendations(recRes.data.recommendations);
    } catch (err) {
      console.error("Gap/rec failed:", err);
    } finally {
      setGapLoading(false);
    }
  };

  const CONFIDENCE_COLOR = (c) => {
    if (c >= 0.7) return "var(--brand-success)";
    if (c >= 0.4) return "var(--brand-warning)";
    return "var(--brand-danger)";
  };

  if (loading) return <LoadingSpinner fullPage text="Loading results..." />;

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          <h2 className="gradient-text mb-1">Career Predictions</h2>
          <p className="text-muted-dark mb-4">ML-powered career matches based on your profile and assessment</p>

          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {/* Run Prediction Button */}
          {predictions.length === 0 && (
            <div className="glass-card p-5 text-center mb-4">
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎯</div>
              <h4 className="fw-700 mb-2">Ready to Predict Your Career?</h4>
              <p className="text-muted-dark mb-4">
                Our ML models will analyse your skills, interests, CGPA, and assessment scores to predict your best-fit careers.
              </p>
              <button className="btn-brand btn btn-lg px-5" onClick={runPrediction} disabled={predicting}>
                {predicting ? <LoadingSpinner size="sm" text="Predicting..." /> : "🤖 Predict My Career →"}
              </button>
            </div>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <div className="row g-4 mb-4">
              <div className="col-lg-5">
                <h5 className="fw-700 mb-3">Top Career Matches</h5>
                {predictions.map((p, i) => (
                  <div
                    key={i}
                    className={`glass-card p-3 mb-3 cursor-pointer ${selectedCareer === p.career ? "border-brand" : ""}`}
                    style={{
                      cursor: "pointer",
                      borderColor: selectedCareer === p.career ? "#6366f1" : undefined,
                      borderWidth: selectedCareer === p.career ? 2 : 1,
                    }}
                    onClick={() => loadGapAndRec(p.career)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="fw-700 d-flex align-items-center justify-content-center"
                          style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: i === 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--bg-surface)",
                            color: i === 0 ? "#fff" : "var(--text-muted)",
                            fontSize: "0.8rem",
                          }}
                        >#{p.rank}</span>
                        <span className="fw-600">{p.career}</span>
                      </div>
                      <span className="fw-700" style={{ color: CONFIDENCE_COLOR(p.confidence) }}>
                        {Math.round(p.confidence * 100)}%
                      </span>
                    </div>
                    <div className="progress-brand">
                      <div className="progress-bar" style={{ width: `${p.confidence * 100}%` }} />
                    </div>
                  </div>
                ))}

                <button className="btn-outline-brand btn w-100 mt-2" onClick={runPrediction} disabled={predicting}>
                  {predicting ? <LoadingSpinner size="sm" text="" /> : "↻ Re-run Prediction"}
                </button>
              </div>

              {/* Skill Radar */}
              <div className="col-lg-7">
                <div className="glass-card p-4 h-100">
                  <h5 className="fw-700 mb-3">Your Skill Profile</h5>
                  <SkillRadarChart scoreReport={scoreReport} />
                </div>
              </div>
            </div>
          )}

          {/* Gap Analysis */}
          {gapLoading ? (
            <LoadingSpinner text="Analysing skill gaps..." />
          ) : gap && (
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="glass-card p-4">
                  <h5 className="fw-700 mb-1">Skill Gap — {selectedCareer}</h5>
                  <p className="text-muted-dark mb-3" style={{ fontSize: "0.875rem" }}>
                    {gap.gap_statement}
                  </p>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge-brand">Gap Score: {gap.gap_score}%</span>
                    <span className="text-muted-dark" style={{ fontSize: "0.8rem" }}>
                      {gap.total_required} skills required
                    </span>
                  </div>
                  <GapHeatmap gaps={gap.gaps} strengths={gap.strengths} />
                </div>
              </div>

              {/* Recommendations */}
              {recommendations && (
                <div className="col-lg-6">
                  <div className="glass-card p-4 h-100">
                    <h5 className="fw-700 mb-3">📚 Recommended Courses</h5>
                    <div className="row g-2">
                      {recommendations.courses?.slice(0, 4).map((c, i) => (
                        <div key={i} className="col-12">
                          <CourseCard course={c} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Go to Roadmap */}
          {predictions.length > 0 && selectedCareer && (
            <div className="text-center">
              <button
                className="btn-brand btn btn-lg px-5"
                onClick={() => navigate(`/roadmap?career=${encodeURIComponent(selectedCareer)}`)}
              >
                Generate My Learning Roadmap 🗺️
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
