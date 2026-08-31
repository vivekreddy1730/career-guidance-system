import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import { getInterviewQuestions, evaluateInterviewAnswer, saveInterviewSession } from "../api/endpoints";

const CAREERS = [
  "Software Engineer",
  "Web Developer",
  "Data Scientist",
  "Cloud Engineer",
  "AI/ML Engineer",
  "Cybersecurity Analyst",
  "Data Analyst",
  "DevOps Engineer",
];

export default function MockInterviewPage() {
  const [selectedCareer, setSelectedCareer] = useState("Software Engineer");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluations, setEvaluations] = useState({}); // index -> eval object
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");

  const fetchQuestions = async (career) => {
    setLoading(true);
    setEvaluations({});
    setCurrentIndex(0);
    setUserAnswer("");
    setSessionFinished(false);
    setShowModelAnswer(false);
    try {
      const res = await getInterviewQuestions(career);
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error("Failed to load interview questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(selectedCareer);
  }, [selectedCareer]);

  // Clean Speech Recognition (Voice Input)
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or type your answer.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      baseTextRef.current = userAnswer;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        const currentSession = (finalTranscript + interimTranscript).trim();
        const base = baseTextRef.current ? baseTextRef.current.trim() : "";
        setUserAnswer(base ? `${base} ${currentSession}` : currentSession);
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) {
      alert("Please provide or speak your response before submitting.");
      return;
    }

    // Stop recording if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const currentQ = questions[currentIndex];
    setEvaluating(true);

    try {
      const res = await evaluateInterviewAnswer({
        question: currentQ.question,
        keywords: currentQ.keywords,
        model_answer: currentQ.model_answer,
        user_answer: userAnswer,
      });

      const evalData = res.data.evaluation;
      setEvaluations((prev) => ({ ...prev, [currentIndex]: evalData }));
      setShowModelAnswer(true);

      // If last question evaluated, save session summary
      if (currentIndex === questions.length - 1) {
        const allScores = [...Object.values(evaluations).map((e) => e.score), evalData.score];
        const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
        saveInterviewSession({ career: selectedCareer, average_score: avg }).catch(() => {});
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer(evaluations[currentIndex + 1] ? userAnswer : "");
      setShowModelAnswer(Boolean(evaluations[currentIndex + 1]));
    } else {
      setSessionFinished(true);
    }
  };

  const currentQ = questions[currentIndex];
  const currentEval = evaluations[currentIndex];

  // Calculate overall performance summary
  const evalList = Object.values(evaluations);
  const avgTechnicalScore = evalList.length
    ? Math.round(evalList.reduce((sum, e) => sum + e.score, 0) / evalList.length)
    : 0;

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
            <div>
              <h2 className="gradient-text mb-0">🎙️ AI Mock Technical Interviewer</h2>
              <p className="text-muted-dark mb-0">
                Interactive real-time interview practice with voice input, instant rubric grading, and model answers.
              </p>
            </div>
            {evalList.length > 0 && (
              <div className="badge-brand px-3 py-2" style={{ borderRadius: 10, fontSize: "0.875rem" }}>
                Session Score: <strong>{avgTechnicalScore}%</strong>
              </div>
            )}
          </div>

          {/* Career Selector */}
          <div className="d-flex flex-wrap gap-2 my-4">
            {CAREERS.map((c) => (
              <button
                key={c}
                className="btn btn-sm"
                onClick={() => setSelectedCareer(c)}
                style={{
                  background: selectedCareer === c ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--bg-surface)",
                  color: selectedCareer === c ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  fontWeight: selectedCareer === c ? 700 : 400,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingSpinner fullPage={false} text="Generating role-specific technical questions..." />
          ) : sessionFinished ? (
            /* ── Summary Screen ── */
            <div className="glass-card p-5 text-center fade-in-up">
              <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🎯</div>
              <h3 className="fw-700 mb-2">Technical Interview Complete!</h3>
              <p className="text-muted-dark mb-4">
                You completed the technical interview session for <strong>{selectedCareer}</strong>.
              </p>

              <div className="row g-3 justify-content-center mb-4">
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="text-muted-dark" style={{ fontSize: "0.8rem" }}>Average Technical Score</div>
                    <div
                      className="fw-800 my-1"
                      style={{
                        fontSize: "2rem",
                        color: avgTechnicalScore >= 70 ? "var(--brand-success)" : avgTechnicalScore >= 40 ? "var(--brand-warning)" : "var(--brand-danger)",
                      }}
                    >
                      {avgTechnicalScore}%
                    </div>
                    <small className="text-muted-dark">Based on {questions.length} questions</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card">
                    <div className="text-muted-dark" style={{ fontSize: "0.8rem" }}>Interview Readiness</div>
                    <div className="fw-800 my-1" style={{ fontSize: "1.5rem", color: "var(--brand-primary)" }}>
                      {avgTechnicalScore >= 75 ? "Ready for Tier-1" : avgTechnicalScore >= 50 ? "Solid Foundation" : "Needs Revision"}
                    </div>
                    <small className="text-muted-dark">Real-time rubric evaluated</small>
                  </div>
                </div>
              </div>

              <button className="btn-brand btn btn-lg px-5" onClick={() => fetchQuestions(selectedCareer)}>
                ↻ Practice Another Session
              </button>
            </div>
          ) : currentQ ? (
            /* ── Live Question Room ── */
            <div className="row g-4">
              <div className="col-lg-7">
                <div className="glass-card p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge-brand" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                      Question {currentIndex + 1} of {questions.length} · {currentQ.type}
                    </span>
                    <span className="badge bg-dark border text-muted px-2 py-1" style={{ fontSize: "0.75rem" }}>
                      Difficulty: {currentQ.difficulty}
                    </span>
                  </div>

                  <h5 className="fw-700 mb-4" style={{ lineHeight: 1.5 }}>
                    {currentQ.question}
                  </h5>

                  {/* Input Form */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-600 mb-0" style={{ fontSize: "0.85rem" }}>
                        Your Technical Explanation
                      </label>
                      <div className="d-flex gap-2">
                        {userAnswer && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setUserAnswer("")}
                            style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                          >
                            ✕ Clear
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn btn-sm ${isListening ? "btn-danger" : "btn-outline-brand"}`}
                          onClick={toggleSpeechRecognition}
                          style={{ fontSize: "0.78rem", borderRadius: 20 }}
                        >
                          {isListening ? "🛑 Stop Listening..." : "🎤 Speak Your Answer"}
                        </button>
                      </div>
                    </div>

                    <textarea
                      className="form-control form-control-dark"
                      rows={6}
                      placeholder="Explain your approach, architecture, data structures, and reasoning clearly (or click 'Speak Your Answer' to dictate)..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={evaluating}
                      style={{ fontSize: "0.9rem", lineHeight: 1.6 }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                      disabled={currentIndex === 0}
                    >
                      ← Previous
                    </button>

                    <div className="d-flex gap-2">
                      <button
                        className="btn-brand btn btn-sm px-4"
                        onClick={handleEvaluate}
                        disabled={evaluating || !userAnswer.trim()}
                      >
                        {evaluating ? <LoadingSpinner size="sm" text="AI Grading..." /> : "Evaluate Answer 🤖"}
                      </button>
                      {currentEval && (
                        <button className="btn btn-success btn-sm px-3" onClick={handleNext}>
                          {currentIndex < questions.length - 1 ? "Next Question →" : "View Final Report 🎯"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Real-Time Evaluation & Coaching Card ── */}
              <div className="col-lg-5">
                {currentEval ? (
                  <div className="glass-card p-4 fade-in-up">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-700 mb-0">AI Evaluation Feedback</h5>
                      <span
                        className="fw-800 px-3 py-1"
                        style={{
                          borderRadius: 8,
                          background:
                            currentEval.score >= 70
                              ? "rgba(16,185,129,0.15)"
                              : currentEval.score >= 40
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(239,68,68,0.15)",
                          color:
                            currentEval.score >= 70
                              ? "var(--brand-success)"
                              : currentEval.score >= 40
                              ? "var(--brand-warning)"
                              : "var(--brand-danger)",
                          fontSize: "1.1rem",
                        }}
                      >
                        {currentEval.score}%
                      </span>
                    </div>

                    {/* Feedback note */}
                    <div
                      className="p-3 mb-3"
                      style={{
                        background: "var(--bg-surface)",
                        borderRadius: 8,
                        borderLeft: `3px solid ${
                          currentEval.score >= 70
                            ? "var(--brand-success)"
                            : currentEval.score >= 40
                            ? "var(--brand-warning)"
                            : "var(--brand-danger)"
                        }`,
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {currentEval.feedback}
                    </div>

                    {/* Strengths */}
                    {currentEval.strengths?.length > 0 ? (
                      <div className="mb-3">
                        <strong className="text-success" style={{ fontSize: "0.85rem" }}>
                          ✓ Strengths Identified:
                        </strong>
                        <ul className="mb-0 mt-1 ps-3 text-muted-dark" style={{ fontSize: "0.8rem" }}>
                          {currentEval.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <span className="text-danger" style={{ fontSize: "0.825rem" }}>
                          ✗ No key technical mechanisms were covered.
                        </span>
                      </div>
                    )}

                    {/* Missing Concepts */}
                    {currentEval.missing_concepts?.length > 0 && (
                      <div className="mb-3">
                        <strong className="text-warning" style={{ fontSize: "0.85rem" }}>
                          ⚠️ Critical Concepts Missed:
                        </strong>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {currentEval.missing_concepts.map((mc, idx) => (
                            <span key={idx} className="badge bg-secondary text-white" style={{ fontSize: "0.75rem" }}>
                              +{mc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exemplar Model Answer */}
                    <div className="mt-3">
                      <button
                        className="btn btn-sm btn-outline-brand w-100"
                        onClick={() => setShowModelAnswer((v) => !v)}
                        style={{ fontSize: "0.78rem" }}
                      >
                        {showModelAnswer ? "Hide Model Answer ▴" : "Show Ideal Model Answer ▾"}
                      </button>
                      {showModelAnswer && (
                        <div
                          className="mt-2 p-3 fade-in-up"
                          style={{
                            background: "rgba(99,102,241,0.08)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            borderRadius: 8,
                            fontSize: "0.82rem",
                            lineHeight: 1.6,
                            color: "var(--text-light)",
                          }}
                        >
                          <strong>Ideal Technical Answer:</strong>
                          <p className="mb-0 mt-1">{currentQ.model_answer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-4 text-center text-muted-dark h-100 d-flex flex-column justify-content-center align-items-center">
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>💡</div>
                    <h6>Live Interview Evaluator</h6>
                    <p className="mb-0" style={{ fontSize: "0.825rem", maxWidth: 300 }}>
                      Type or speak your answer and click <strong>"Evaluate Answer"</strong> to receive real-time technical grading, keyword gap analysis, and model answers.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
