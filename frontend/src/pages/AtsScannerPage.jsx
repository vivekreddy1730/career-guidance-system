import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import { scanResumeAts, optimizeAtsBullet } from "../api/endpoints";

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

const SAMPLE_RESUMES = {
  "Software Engineer": `TEJASWINI REDDY BODDU
Email: nanireddypvt@gmail.com | Phone: +91 9876543210 | LinkedIn: linkedin.com/in/tejaswini-reddy
GitHub: github.com/tejaswini-reddy

EDUCATION:
B.Tech in Computer Science and Engineering | CGPA: 8.5/10 (2022 - 2026)

TECHNICAL SKILLS:
- Languages: Python, Java, C++, SQL
- Technologies & Tools: REST API, Git, Docker, Microservices, CI/CD, Unit Testing, Agile
- Concepts: Data Structures, Algorithms, System Design, Object-Oriented Programming

PROJECTS:
1. High-Performance E-Commerce Microservices
- Architected and deployed scalable RESTful backend microservices using Python and PostgreSQL.
- Implemented Docker containerization and CI/CD pipelines, reducing deployment cycle times by 35%.
- Wrote automated unit tests achieving 90%+ code coverage for high-concurrency order processing.

2. Distributed File Storage Engine
- Developed multithreaded caching layers using Redis and optimized SQL indexing.
- Handled data structures and algorithms to achieve O(1) file lookup speeds for 10,000+ daily requests.

CERTIFICATIONS & ACHIEVEMENTS:
- AWS Certified Cloud Practitioner
- 1st Place at National Smart India Hackathon 2025`,

  "Web Developer": `TEJASWINI REDDY BODDU
Email: nanireddypvt@gmail.com | Phone: +91 9876543210
GitHub: github.com/tejaswini-reddy

EDUCATION:
B.Tech in Computer Science and Engineering | CGPA: 8.4/10

TECHNICAL SKILLS:
- Languages: JavaScript, TypeScript, HTML5, CSS3, SQL
- Frameworks & Libraries: React, Node.js, Next.js, Redux, Tailwind CSS, Webpack
- Concepts: Responsive Design, REST API, Web Performance, State Management, Git

PROJECTS:
1. Real-Time Collaboration Canvas (Next.js & React)
- Engineered responsive UI components with React & TypeScript, optimizing bundle size by 28%.
- Integrated REST API and WebSocket state management via Redux for real-time multiplayer editing.

2. Student Career Portal
- Designed mobile-first interfaces using Tailwind CSS and Next.js SSG rendering.
- Achieved a 98+ Google Lighthouse performance score across mobile and desktop devices.

CERTIFICATIONS:
- Meta Frontend Developer Professional Certificate`,
};

export default function AtsScannerPage() {
  const [selectedCareer, setSelectedCareer] = useState("Software Engineer");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  // Bullet Optimizer state
  const [bulletInput, setBulletInput] = useState("");
  const [optimizedResult, setOptimizedResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleScan = async () => {
    setError("");
    if (!resumeText.trim()) {
      setError("Please paste or load your resume text before clicking Scan.");
      return;
    }

    if (resumeText.trim().split(/\s+/).length < 10) {
      setError("Resume text is too brief. Please paste complete resume sections (Skills, Projects, Education).");
      return;
    }

    setScanning(true);
    try {
      const res = await scanResumeAts(selectedCareer, resumeText);
      setAnalysis(res.data.ats_analysis);
    } catch (err) {
      console.error("ATS scan failed:", err);
      setError(err.response?.data?.error || "ATS scan failed. Please check backend connection.");
    } finally {
      setScanning(false);
    }
  };

  const handleLoadSample = () => {
    setError("");
    const sample = SAMPLE_RESUMES[selectedCareer] || SAMPLE_RESUMES["Software Engineer"];
    setResumeText(sample);
  };

  const handleOptimizeBullet = async (e) => {
    e.preventDefault();
    if (!bulletInput.trim()) return;

    setOptimizing(true);
    setCopied(false);
    try {
      const res = await optimizeAtsBullet(bulletInput, selectedCareer);
      setOptimizedResult(res.data.optimization);
    } catch (err) {
      console.error("Bullet optimization failed:", err);
    } finally {
      setOptimizing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          <h2 className="gradient-text mb-1">📄 Intelligent ATS Resume Scanner & Optimizer</h2>
          <p className="text-muted-dark mb-4">
            Audit your resume against applicant tracking system standards, detect keyword gaps, and enhance bullets using the Google X-Y-Z formula.
          </p>

          {/* Career Selector */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {CAREERS.map((c) => (
              <button
                key={c}
                className="btn btn-sm"
                onClick={() => {
                  setSelectedCareer(c);
                  setAnalysis(null);
                  setError("");
                }}
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

          <div className="row g-4 mb-4">
            {/* Input Form */}
            <div className="col-lg-5">
              <div className="glass-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="fw-700 mb-0">Resume Content</h5>
                  <div className="d-flex gap-1">
                    {resumeText && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setResumeText("");
                          setAnalysis(null);
                          setError("");
                        }}
                        style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                      >
                        ✕ Clear
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-brand"
                      onClick={handleLoadSample}
                      style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                    >
                      📋 Load Sample Resume
                    </button>
                  </div>
                </div>

                <p className="text-muted-dark mb-2" style={{ fontSize: "0.8rem" }}>
                  Paste your actual resume content (Skills, Projects, Experience, and Education) below:
                </p>

                <textarea
                  className="form-control form-control-dark mb-3"
                  rows={13}
                  placeholder="Paste your resume text here (or click 'Load Sample Resume' to test)..."
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setError("");
                  }}
                  style={{ fontSize: "0.85rem", lineHeight: 1.5 }}
                />

                {error && (
                  <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "0.85rem", borderRadius: 8 }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  className="btn-brand btn w-100"
                  onClick={handleScan}
                  disabled={scanning || !resumeText.trim()}
                >
                  {scanning ? <LoadingSpinner size="sm" text="Scanning ATS Compliance..." /> : `Scan Resume for ${selectedCareer} 🎯`}
                </button>
              </div>
            </div>

            {/* ATS Score Results */}
            <div className="col-lg-7">
              {analysis && analysis.ats_score > 0 ? (
                <div className="glass-card p-4 fade-in-up">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-700 mb-0">ATS Scorecard</h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted-dark" style={{ fontSize: "0.85rem" }}>Target Role:</span>
                      <span className="badge-brand">{analysis.target_career}</span>
                    </div>
                  </div>

                  {/* Main Score Gauge */}
                  <div className="p-3 mb-3 text-center" style={{ background: "var(--bg-surface)", borderRadius: 12 }}>
                    <div className="text-muted-dark" style={{ fontSize: "0.85rem" }}>Overall ATS Compatibility</div>
                    <div
                      className="fw-800 my-1"
                      style={{
                        fontSize: "2.8rem",
                        color:
                          analysis.ats_score >= 75
                            ? "var(--brand-success)"
                            : analysis.ats_score >= 50
                            ? "var(--brand-warning)"
                            : "var(--brand-danger)",
                      }}
                    >
                      {analysis.ats_score}%
                    </div>
                    <div className="progress-brand mx-auto" style={{ maxWidth: 300 }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${analysis.ats_score}%`,
                          background: analysis.ats_score >= 75 ? "#10b981" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>

                  {/* Keywords Breakdown */}
                  <div className="mb-3">
                    <h6 className="fw-600 mb-2" style={{ fontSize: "0.9rem" }}>
                      Matched Keywords ({analysis.matched_keywords?.length})
                    </h6>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {analysis.matched_keywords?.map((k, i) => (
                        <span key={i} className="badge bg-success bg-opacity-25 text-success border border-success" style={{ fontSize: "0.75rem" }}>
                          ✓ {k}
                        </span>
                      ))}
                      {analysis.matched_keywords?.length === 0 && (
                        <span className="text-muted-dark" style={{ fontSize: "0.8rem" }}>No matching core keywords found.</span>
                      )}
                    </div>

                    <h6 className="fw-600 mb-2" style={{ fontSize: "0.9rem", color: "var(--brand-warning)" }}>
                      Missing Keywords to Add ({analysis.missing_keywords?.length})
                    </h6>
                    <div className="d-flex flex-wrap gap-1">
                      {analysis.missing_keywords?.slice(0, 10).map((k, i) => (
                        <span key={i} className="badge bg-secondary text-white" style={{ fontSize: "0.75rem" }}>
                          + {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Section Completeness */}
                  <div className="mb-3">
                    <h6 className="fw-600 mb-2" style={{ fontSize: "0.9rem" }}>Section Verification</h6>
                    <div className="row g-2">
                      {Object.entries(analysis.section_analysis || {}).map(([sec, present]) => (
                        <div key={sec} className="col-6">
                          <div
                            className="p-2 d-flex justify-content-between align-items-center"
                            style={{ background: "var(--bg-surface)", borderRadius: 6, fontSize: "0.8rem" }}
                          >
                            <span>{sec}</span>
                            <span className={present ? "text-success fw-700" : "text-danger"}>
                              {present ? "✓ Found" : "✗ Missing"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h6 className="fw-600 mb-2" style={{ fontSize: "0.9rem" }}>💡 Actionable ATS Recommendations</h6>
                    <ul className="text-muted-dark mb-0 ps-3" style={{ fontSize: "0.825rem", lineHeight: 1.6 }}>
                      {analysis.recommendations?.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-5 text-center text-muted-dark h-100 d-flex flex-column justify-content-center align-items-center">
                  <div style={{ fontSize: "3rem", marginBottom: 10 }}>🔍</div>
                  <h5>Ready to Scan Your Resume</h5>
                  <p style={{ fontSize: "0.85rem", maxWidth: 360 }}>
                    Paste your resume in the left panel (or click <strong>"Load Sample Resume"</strong>) and click <strong>"Scan Resume"</strong> to get your ATS compatibility scorecard.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── One-Click AI Bullet-Point Optimizer (STAR / Google X-Y-Z) ── */}
          <div className="glass-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <h5 className="fw-700 mb-0">⚡ One-Click AI Resume Bullet Enhancer</h5>
              <span className="badge-brand" style={{ fontSize: "0.75rem" }}>Google X-Y-Z / STAR Formula</span>
            </div>
            <p className="text-muted-dark mb-3" style={{ fontSize: "0.85rem" }}>
              Transform passive, weak bullets into high-impact, quantifiable recruiter-friendly statements.
            </p>

            <form onSubmit={handleOptimizeBullet} className="mb-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control form-control-dark"
                  placeholder="e.g. worked on backend for food delivery app using node and sql"
                  value={bulletInput}
                  onChange={(e) => setBulletInput(e.target.value)}
                  required
                />
                <button className="btn-brand btn px-4" type="submit" disabled={optimizing || !bulletInput.trim()}>
                  {optimizing ? <LoadingSpinner size="sm" text="" /> : "Enhance Bullet 🪄"}
                </button>
              </div>
            </form>

            {optimizedResult && (
              <div
                className="p-3 fade-in-up"
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: 10,
                  border: "1px solid var(--border-color)",
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-success text-white" style={{ fontSize: "0.75rem" }}>
                    ✨ AI-Optimized STAR Bullet
                  </span>
                  <button
                    className="btn btn-sm btn-outline-brand"
                    onClick={() => copyToClipboard(optimizedResult.optimized)}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                  </button>
                </div>

                <div
                  className="p-3 mb-2 fw-600"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    borderLeft: "3px solid var(--brand-primary)",
                    borderRadius: 6,
                    color: "var(--text-light)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  {optimizedResult.optimized}
                </div>

                <div className="text-muted-dark" style={{ fontSize: "0.8rem" }}>
                  <strong>Why it works:</strong> {optimizedResult.why_it_works}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
