import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import SkillRadarChart from "../components/SkillRadarChart";
import { TrendingSkillsBar } from "../components/TrendingSkillsChart";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { getProfile, getReport, getRoadmap, getTrendingSkills } from "../api/endpoints";

export default function DashboardPage() {
  const { student } = useAuth();
  const [profile, setProfile] = useState(null);
  const [report, setReport] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getProfile(),
      getReport(),
      getRoadmap(),
      getTrendingSkills(),
    ]).then(([profRes, repRes, roadRes, trendRes]) => {
      if (profRes.status === "fulfilled") setProfile(profRes.value.data.student);
      if (repRes.status === "fulfilled") setReport(repRes.value.data.report);
      if (roadRes.status === "fulfilled") setRoadmap(roadRes.value.data.roadmap);
      if (trendRes.status === "fulfilled") setTrendingSkills(trendRes.value.data.trending_skills);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner fullPage text="Loading dashboard..." />;

  const skillCount = profile?.skills?.length || 0;
  const topSkill = report?.score_report
    ? Object.entries(report.score_report).sort((a, b) => b[1] - a[1])[0]
    : null;

  const completedMilestones = roadmap?.milestones?.filter((m) => m.is_completed).length || 0;
  const totalMilestones = roadmap?.milestones?.length || 0;
  const roadmapProgress = totalMilestones
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          {/* Welcome header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="gradient-text mb-1">
                Welcome back, {student?.name || student?.email?.split("@")[0] || "Student"}! 👋
              </h2>
              <p className="text-muted-dark mb-0">
                {student?.college ? `${student.college} · ` : ""}
                {student?.branch || "Computer Science"} · Year {student?.year || 4}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/interview" className="btn-brand btn btn-sm">
                🎙️ AI Mock Interview
              </Link>
              <Link to="/ats-scanner" className="btn-outline-brand btn btn-sm">
                📄 ATS Resume Scanner
              </Link>
            </div>
          </div>

          {/* Stat Cards Row */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard
                icon="🎯"
                label="Career Path"
                value={roadmap?.career_title || "Not predicted"}
                sub="Click to predict"
                color="#6366f1"
                link="/results"
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                icon="📊"
                label="Assessment Score"
                value={report ? `${report.total_score}%` : "Not taken"}
                sub={topSkill ? `Top: ${topSkill[0]} (${topSkill[1]}%)` : "Take assessment"}
                color="#10b981"
                link="/assessment"
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                icon="🗺️"
                label="Roadmap Progress"
                value={roadmap ? `${roadmapProgress}%` : "Generate one"}
                sub={roadmap ? `${completedMilestones}/${totalMilestones} milestones done` : "Not generated"}
                color="#06b6d4"
                link="/roadmap"
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                icon="💡"
                label="Skills Listed"
                value={skillCount || "0"}
                sub="Complete profile to add more"
                color="#f59e0b"
                link="/profile"
              />
            </div>
          </div>

          {/* Main Charts */}
          <div className="row g-4 mb-4">
            {/* Skill Radar */}
            <div className="col-lg-6">
              <div className="glass-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-700 mb-0">Skill Profile</h5>
                  <Link to="/assessment" className="text-brand" style={{ fontSize: "0.8rem" }}>
                    {report ? "Re-take →" : "Take Assessment →"}
                  </Link>
                </div>
                <SkillRadarChart scoreReport={report?.score_report || {}} />
              </div>
            </div>

            {/* Trending Skills */}
            <div className="col-lg-6">
              <div className="glass-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-700 mb-0">Market Demand</h5>
                  <Link to="/jobs" className="text-brand" style={{ fontSize: "0.8rem" }}>
                    See Jobs →
                  </Link>
                </div>
                <TrendingSkillsBar skills={trendingSkills} />
              </div>
            </div>
          </div>

          {/* Roadmap Snapshot */}
          {roadmap ? (
            <div className="glass-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-700 mb-0">Roadmap — {roadmap.career_title}</h5>
                <Link to="/roadmap" className="btn-brand btn btn-sm">View Full Roadmap →</Link>
              </div>
              <div className="progress-brand mb-2">
                <div className="progress-bar" style={{ width: `${roadmapProgress}%` }} />
              </div>
              <small className="text-muted-dark">{completedMilestones} of {totalMilestones} milestones completed · {roadmapProgress}%</small>

              <div className="row g-2 mt-3">
                {roadmap.milestones?.slice(0, 3).map((m) => (
                  <div key={m.id} className="col-md-4">
                    <div className="p-3 rounded" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="badge-brand" style={{ fontSize: "0.7rem" }}>Month {m.month}</span>
                        {m.is_completed && <span className="badge-brand badge-success" style={{ fontSize: "0.7rem" }}>✓ Done</span>}
                      </div>
                      <p className="fw-600 mb-0" style={{ fontSize: "0.875rem" }}>{m.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-4 mb-4 text-center">
              <p className="text-muted-dark mb-3">No roadmap generated yet. Predict your career first!</p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/results" className="btn-brand btn">Predict Career →</Link>
                <Link to="/assessment" className="btn-outline-brand btn">Take Assessment</Link>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <h5 className="fw-700 mb-3">Quick Actions</h5>
          <div className="row g-3">
            {[
              { icon: "🎙️", label: "AI Mock Interview", sub: "Live voice practice", path: "/interview", color: "#ec4899" },
              { icon: "📄", label: "ATS Resume Scanner", sub: "Scan & optimize bullets", path: "/ats-scanner", color: "#f59e0b" },
              { icon: "📝", label: "Take Assessment", sub: "Get your skill scores", path: "/assessment", color: "#6366f1" },
              { icon: "🎯", label: "Predict Career", sub: "Run ML analysis", path: "/results", color: "#10b981" },
              { icon: "💼", label: "Browse Jobs", sub: "Live market listings", path: "/jobs", color: "#06b6d4" },
              { icon: "🤖", label: "Ask CareerBot", sub: "AI-powered advice", path: "/chat", color: "#8b5cf6" },
            ].map((action, i) => (
              <div key={i} className="col-6 col-md-4 col-lg-2">
                <Link to={action.path} className="text-decoration-none">
                  <div className="stat-card text-center h-100" style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: "1.75rem", marginBottom: 8 }}>{action.icon}</div>
                    <div className="fw-700" style={{ fontSize: "0.85rem" }}>{action.label}</div>
                    <div className="text-muted-dark" style={{ fontSize: "0.72rem" }}>{action.sub}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
