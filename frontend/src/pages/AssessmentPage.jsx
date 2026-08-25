import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { getQuestions, startAssessment, submitAssessment } from "../api/endpoints";

const SECTIONS = [
  { key: "aptitude", label: "Aptitude", icon: "🧠", color: "#6366f1" },
  { key: "technical", label: "Technical", icon: "💻", color: "#06b6d4" },
];

export default function AssessmentPage() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("intro"); // intro | quiz | result
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [answers, setAnswers] = useState({});   // questionId → selectedIndex
  const [currentSection, setCurrentSection] = useState("aptitude");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min
  const [result, setResult] = useState(null);

  const sectionQuestions = questions.filter((q) => q.section === currentSection);
  const currentQ = sectionQuestions[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const progress = questions.length ? Math.round((totalAnswered / questions.length) * 100) : 0;

  // Timer
  useEffect(() => {
    if (phase !== "quiz") return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startQuiz = async () => {
    setLoading(true);
    setError("");
    try {
      const [qRes, aRes] = await Promise.all([
        getQuestions(undefined, 1),
        startAssessment(),
      ]);
      setQuestions(qRes.data.questions);
      setAssessmentId(aRes.data.assessment_id);
      setPhase("quiz");
      setCurrentSection("aptitude");
      setCurrentIndex(0);
    } catch (err) {
      setError("Failed to load questions. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qId, idx) => {
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  };

  const nextQ = () => {
    if (currentIndex < sectionQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (currentSection === "aptitude") {
      setCurrentSection("technical");
      setCurrentIndex(0);
    }
  };

  const prevQ = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    else if (currentSection === "technical") {
      setCurrentSection("aptitude");
      setCurrentIndex(questions.filter((q) => q.section === "aptitude").length - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const responses = Object.entries(answers).map(([qId, idx]) => ({
        question_id: parseInt(qId),
        selected_index: idx,
      }));
      const res = await submitAssessment(assessmentId, responses);
      setResult(res.data);
      setPhase("result");
    } catch (err) {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          {/* INTRO */}
          {phase === "intro" && (
            <div>
              <h2 className="gradient-text mb-1">Skill Assessment</h2>
              <p className="text-muted-dark mb-4">
                Evaluate your aptitude and technical skills in one session
              </p>

              <div className="row g-4 mb-4">
                {SECTIONS.map((s) => (
                  <div key={s.key} className="col-md-6">
                    <div className="glass-card p-4">
                      <div className="stat-icon mb-3" style={{ background: `${s.color}20`, fontSize: "1.5rem" }}>
                        {s.icon}
                      </div>
                      <h5 className="fw-700 mb-1">{s.label} Section</h5>
                      <p className="text-muted-dark mb-0" style={{ fontSize: "0.875rem" }}>
                        {s.key === "aptitude"
                          ? "Logical reasoning, quantitative aptitude, and verbal ability"
                          : "Python, SQL, ML, web development, cloud, and DSA"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-4 mb-4">
                <h6 className="fw-600 mb-2">📋 Instructions</h6>
                <ul className="text-muted-dark mb-0" style={{ fontSize: "0.875rem" }}>
                  <li>Timer: 30 minutes total</li>
                  <li>All questions are multiple choice (single correct answer)</li>
                  <li>You can navigate between questions freely</li>
                  <li>Your skill scores are calculated automatically on submit</li>
                </ul>
              </div>

              {error && <div className="alert alert-danger mb-3">{error}</div>}

              <button className="btn-brand btn btn-lg px-5" onClick={startQuiz} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" text="" /> : "Start Assessment →"}
              </button>
            </div>
          )}

          {/* QUIZ */}
          {phase === "quiz" && currentQ && (
            <div>
              {/* Header bar */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex gap-2">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.key}
                      className="btn btn-sm"
                      onClick={() => { setCurrentSection(s.key); setCurrentIndex(0); }}
                      style={{
                        background: currentSection === s.key ? s.color : "var(--bg-surface)",
                        color: currentSection === s.key ? "#fff" : "var(--text-muted)",
                        border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600,
                      }}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="badge-brand">{totalAnswered}/{questions.length} answered</span>
                  <span
                    className="fw-700"
                    style={{ color: timeLeft < 300 ? "var(--brand-danger)" : "var(--brand-success)", fontFamily: "monospace", fontSize: "1.1rem" }}
                  >
                    ⏱ {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="progress-brand mb-4">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>

              {/* Question */}
              <div className="question-card fade-in-up">
                <div className="d-flex justify-content-between mb-3">
                  <span className="badge-brand" style={{ fontSize: "0.75rem" }}>
                    {currentQ.section === "aptitude" ? "🧠 Aptitude" : "💻 Technical"} · {currentQ.sub_section}
                  </span>
                  <span className="badge-brand" style={{ fontSize: "0.75rem", textTransform: "capitalize" }}>
                    {currentQ.difficulty}
                  </span>
                </div>

                <h5 className="fw-600 mb-4" style={{ lineHeight: 1.5 }}>
                  Q{currentIndex + 1}. {currentQ.question_text}
                </h5>

                <div>
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      className={`option-btn ${answers[currentQ.id] === i ? "selected" : ""}`}
                      onClick={() => selectAnswer(currentQ.id, i)}
                    >
                      <span className="me-2" style={{ opacity: 0.6, fontFamily: "monospace" }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="d-flex justify-content-between mt-3">
                <button className="btn-outline-brand btn" onClick={prevQ}>
                  ← Previous
                </button>
                <button
                  className="btn-brand btn px-4"
                  onClick={currentSection === "technical" && currentIndex === sectionQuestions.length - 1 ? handleSubmit : nextQ}
                  disabled={submitting}
                >
                  {submitting ? <LoadingSpinner size="sm" text="" /> :
                   currentSection === "technical" && currentIndex === sectionQuestions.length - 1 ? "Submit Assessment 🎯" : "Next →"}
                </button>
              </div>

              {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div>
          )}

          {/* RESULT */}
          {phase === "result" && result && (
            <div className="fade-in-up">
              <h2 className="gradient-text mb-1">Assessment Complete! 🎉</h2>
              <p className="text-muted-dark mb-4">
                Overall Score: <span className="text-brand fw-700" style={{ fontSize: "1.25rem" }}>{result.total_score}%</span>
              </p>

              <div className="row g-3 mb-4">
                {Object.entries(result.score_report || {}).map(([skill, score]) => (
                  <div key={skill} className="col-md-6 col-lg-4">
                    <div className="glass-card p-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-600" style={{ fontSize: "0.875rem" }}>{skill}</span>
                        <span className={`fw-700 ${score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-danger"}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="progress-brand">
                        <div className="progress-bar" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-brand btn btn-lg px-5" onClick={() => navigate("/results")}>
                View Career Predictions →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
