import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const FEATURES = [
  { icon: "🤖", title: "AI Career Prediction", desc: "ML models (RandomForest, XGBoost, KNN) predict your best-fit career from your skills, interests, and assessment scores." },
  { icon: "📊", title: "Skill Gap Analysis", desc: "Instantly see exactly which skills you need to develop to reach your target career — with specific course recommendations." },
  { icon: "🗺️", title: "Month-by-Month Roadmap", desc: "AI-generated, personalized learning plans with curated courses from Coursera, Udemy, edX, and NPTEL." },
  { icon: "💼", title: "Live Job Market Data", desc: "Real-time job listings, salary ranges, and trending skills powered by Adzuna and JSearch APIs." },
  { icon: "🤖", title: "AI Career Advisor", desc: "Ask any question — your personal chatbot answers grounded in YOUR profile, scores, and predicted career." },
  { icon: "📄", title: "Resume Analyzer", desc: "Upload your resume (PDF/DOC) and get instant skill extraction, verification, and profile consistency checks." },
];

const STATS = [
  { value: "10+", label: "Career Paths" },
  { value: "40+", label: "Skills Assessed" },
  { value: "15+", label: "Courses Mapped" },
  { value: "4", label: "ML Models" },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)" }}>
      <Navbar />

      {/* Hero */}
      <section className="hero-bg">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 fade-in-up">
              <div className="badge-brand mb-4 d-inline-flex align-items-center gap-2" style={{ padding: "8px 16px" }}>
                <span className="live-dot"></span>
                <span>AI-Powered · Live Job Data · Personalized</span>
              </div>
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15 }}>
                Discover Your{" "}
                <span className="gradient-text">Perfect Career</span>{" "}
                Path with AI
              </h1>
              <p className="text-secondary mt-3 mb-4" style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
                Take a skill assessment, get ML-powered career predictions, close your skill gaps with a personalized roadmap, and land your dream job — all in one platform.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/register" className="btn-brand btn btn-lg px-4">
                  Start Your Journey →
                </Link>
                <Link to="/login" className="btn-outline-brand btn btn-lg px-4">
                  Sign In
                </Link>
              </div>

              {/* Stats */}
              <div className="d-flex flex-wrap gap-4 mt-5">
                {STATS.map((s, i) => (
                  <div key={i}>
                    <div className="gradient-text fw-800" style={{ fontSize: "1.75rem", fontFamily: "Outfit, sans-serif" }}>
                      {s.value}
                    </div>
                    <div className="text-muted-dark" style={{ fontSize: "0.8rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating cards demo */}
            <div className="col-lg-6 d-none d-lg-block">
              <div style={{ position: "relative", height: 420 }}>
                {/* Main card */}
                <div className="card-glow p-4 floating-card" style={{ position: "absolute", top: 0, left: "10%", width: "80%" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-700">Career Prediction</span>
                    <span className="badge-brand badge-success">AI Powered</span>
                  </div>
                  {[
                    { career: "Data Scientist", conf: 89 },
                    { career: "AI/ML Engineer", conf: 74 },
                    { career: "Software Engineer", conf: 61 },
                  ].map((c, i) => (
                    <div key={i} className="mb-2">
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: "0.875rem" }}>{c.career}</span>
                        <span className="text-brand fw-600">{c.conf}%</span>
                      </div>
                      <div className="progress-brand">
                        <div className="progress-bar" style={{ width: `${c.conf}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating chip 1 */}
                <div className="glass-card p-3" style={{ position: "absolute", bottom: 80, left: 0, width: 180, animationDelay: "0.5s" }}>
                  <div className="fw-600 mb-1" style={{ fontSize: "0.8rem" }}>Skill Gap Closed</div>
                  <div className="gradient-text fw-800" style={{ fontSize: "1.5rem" }}>+3 Skills</div>
                  <div className="text-muted-dark" style={{ fontSize: "0.7rem" }}>This month</div>
                </div>

                {/* Floating chip 2 */}
                <div className="glass-card p-3" style={{ position: "absolute", bottom: 60, right: 0, width: 180, animationDelay: "1s" }}>
                  <div className="fw-600 mb-1" style={{ fontSize: "0.8rem" }}>Avg. Salary</div>
                  <div className="gradient-text fw-800" style={{ fontSize: "1.25rem" }}>₹12L / yr</div>
                  <div className="text-muted-dark" style={{ fontSize: "0.7rem" }}>Data Scientist, India</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-5" style={{ background: "var(--bg-card)" }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="gradient-text mb-2">Everything You Need to Launch Your Career</h2>
            <p className="text-secondary">Six powerful modules working together in one platform</p>
          </div>
          <div className="row g-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="glass-card p-4 h-100">
                  <div className="stat-icon mb-3" style={{ background: "rgba(99,102,241,0.1)" }}>
                    {f.icon}
                  </div>
                  <h5 className="fw-700 mb-2" style={{ fontSize: "1rem" }}>{f.title}</h5>
                  <p className="text-muted-dark mb-0" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 text-center" style={{ background: "var(--bg-dark)" }}>
        <div className="container">
          <h2 className="mb-3">Ready to find your career path?</h2>
          <p className="text-secondary mb-4">Join thousands of students who've used CareerAI to land their dream jobs.</p>
          <Link to="/register" className="btn-brand btn btn-lg px-5">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center" style={{ borderTop: "1px solid var(--border-color)" }}>
        <p className="text-muted-dark mb-0" style={{ fontSize: "0.8rem" }}>
          © 2025 CareerAI · AI-Powered Student Career Guidance System · Final Year Project
        </p>
      </footer>
    </div>
  );
}
