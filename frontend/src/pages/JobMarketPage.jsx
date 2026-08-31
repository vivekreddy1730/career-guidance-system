import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import JobCard from "../components/JobCard";
import { TrendingSkillsDoughnut, TrendingSkillsBar } from "../components/TrendingSkillsChart";
import { getJobs, getTrendingSkills, getSalaryInsights } from "../api/endpoints";

const CAREERS = [
  "Data Scientist", "Software Engineer", "Web Developer", "Cloud Engineer",
  "AI/ML Engineer", "Cybersecurity Analyst", "Data Analyst", "DevOps Engineer",
];

function formatSalary(v) {
  if (!v) return "N/A";
  return `₹${(v / 100000).toFixed(1)}L`;
}

export default function JobMarketPage() {
  const [selectedCareer, setSelectedCareer] = useState("Data Scientist");
  const [jobs, setJobs] = useState([]);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(true);
  const [chartType, setChartType] = useState("doughnut");

  const fetchJobData = async (career) => {
    setLoading(true);
    try {
      const [jobRes, salRes] = await Promise.all([
        getJobs(career),
        getSalaryInsights(career),
      ]);
      setJobs(jobRes.data.jobs || []);
      setSalary(salRes.data.salary_insights);
    } catch (err) {
      console.error("Job fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTrendingSkills()
      .then((res) => setTrendingSkills(res.data.trending_skills || []))
      .catch(() => {})
      .finally(() => setTrendLoading(false));
  }, []);

  useEffect(() => {
    fetchJobData(selectedCareer);
  }, [selectedCareer]);

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          <h2 className="gradient-text mb-1">Job Market Intelligence</h2>
          <p className="text-muted-dark mb-4">Live job listings, salary data, and trending skills</p>

          {/* Career selector */}
          <div className="d-flex flex-wrap gap-2 mb-4">
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

          {/* Salary insights */}
          {salary && (
            <div className="row g-3 mb-4">
              {[
                { label: "Min Salary", value: formatSalary(salary.min), icon: "📉", color: "var(--brand-warning)" },
                { label: "Avg Salary", value: formatSalary(salary.avg), icon: "💰", color: "var(--brand-success)" },
                { label: "Max Salary", value: formatSalary(salary.max), icon: "📈", color: "var(--brand-primary)" },
              ].map((s, i) => (
                <div key={i} className="col-4">
                  <div className="stat-card text-center">
                    <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{s.icon}</div>
                    <div className="fw-800" style={{ fontSize: "1.25rem", color: s.color }}>{s.value}</div>
                    <div className="text-muted-dark" style={{ fontSize: "0.8rem" }}>{s.label}</div>
                    <div className="text-muted-dark" style={{ fontSize: "0.7rem" }}>/ year</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="row g-4">
            {/* Job listings */}
            <div className="col-lg-7">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-700 mb-0">{selectedCareer} Jobs in India</h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="live-dot" />
                  <small className="text-muted-dark">Live</small>
                </div>
              </div>
              {loading ? (
                <LoadingSpinner text="Fetching live jobs..." />
              ) : (
                <div className="row g-3">
                  {jobs.map((job, i) => (
                    <div key={i} className="col-12">
                      <JobCard job={job} />
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="col-12">
                      <div className="glass-card p-4 text-center text-muted-dark">
                        No job listings found. Configure Adzuna/JSearch API keys.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trending Skills */}
            <div className="col-lg-5">
              <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-700 mb-0">Trending Skills</h5>
                  <div className="d-flex gap-1">
                    {["doughnut", "bar"].map((t) => (
                      <button
                        key={t}
                        className="btn btn-sm"
                        onClick={() => setChartType(t)}
                        style={{
                          background: chartType === t ? "var(--brand-primary)" : "var(--bg-surface)",
                          color: chartType === t ? "#fff" : "var(--text-muted)",
                          border: "none",
                          borderRadius: 6,
                          padding: "3px 10px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {t === "doughnut" ? "◎" : "≡"}
                      </button>
                    ))}
                  </div>
                </div>
                {trendLoading ? (
                  <LoadingSpinner text="Loading trends..." />
                ) : chartType === "doughnut" ? (
                  <TrendingSkillsDoughnut skills={trendingSkills} />
                ) : (
                  <TrendingSkillsBar skills={trendingSkills} />
                )}

                {/* Growth tags */}
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {trendingSkills.slice(0, 5).map((s, i) => (
                    <span key={i} className="badge-brand" style={{ borderRadius: "20px", fontSize: "0.75rem" }}>
                      {s.skill} {s.growth}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
