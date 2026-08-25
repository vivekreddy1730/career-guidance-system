import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import { getProfile, updateProfile, uploadResume } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

const SKILLS_LIST = [
  "Python", "Java", "JavaScript", "C++", "R", "SQL", "Machine Learning",
  "Deep Learning", "TensorFlow", "PyTorch", "React", "Node.js", "AWS",
  "Azure", "GCP", "Docker", "Kubernetes", "MySQL", "MongoDB", "Cybersecurity",
  "Data Visualization", "Statistics", "Tableau", "Power BI", "Linux",
];

const STEPS = ["Personal Info", "Skills & Interests", "Education", "Resume Upload"];

export default function ProfilePage() {
  const { updateStudent } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", college: "", branch: "", year: "", cgpa: "",
    interests: [], skills: [], resume_url: "",
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);

  useEffect(() => {
    getProfile()
      .then((res) => {
        const p = res.data.profile;
        setForm({
          name: p.name || "",
          email: p.email || "",
          college: p.college || "",
          branch: p.branch || "",
          year: p.year || "",
          cgpa: p.cgpa || "",
          interests: p.interests || [],
          skills: p.skills || [],
          resume_url: p.resume_url || "",
        });
        setSelectedSkills(p.skills?.map((s) => s.skill_name || s).filter(Boolean) || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      setSelectedSkills((prev) => [...prev, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await updateProfile({
        ...form,
        year: form.year ? parseInt(form.year) : null,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
        skills: selectedSkills.map((name) => ({ name, proficiency: 70 })),
        interests: form.interests,
      });
      updateStudent(res.data.profile);
      setSuccess("Profile saved successfully!");
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        navigate("/assessment");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("resume", resumeFile);
      const res = await uploadResume(fd);
      setParsedResume(res.data);
      setForm((prev) => ({ ...prev, resume_url: res.data.resume_url }));
      setSuccess("Resume parsed! Skills extracted automatically.");
      if (res.data.parsed_data?.skills) {
        const newSkills = res.data.parsed_data.skills.filter((s) => !selectedSkills.includes(s));
        setSelectedSkills((prev) => [...prev, ...newSkills]);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading your profile..." />;

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content">
          <h2 className="gradient-text mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Your Profile</h2>
          <p className="text-muted-dark mb-4">Complete your profile for better career predictions</p>

          {/* Step Indicator */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {STEPS.map((s, i) => (
              <button
                key={i}
                className="btn btn-sm"
                onClick={() => setStep(i)}
                style={{
                  background: i === step ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--bg-surface)",
                  color: i === step ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  fontWeight: i === step ? 700 : 400,
                }}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>

          {success && <div className="alert alert-success py-2 mb-3" style={{ borderRadius: 8 }}>{success}</div>}
          {error && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: 8 }}>{error}</div>}

          <div className="glass-card p-4">
            {/* Step 0: Personal Info */}
            {step === 0 && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ fontSize: "0.875rem" }}>Full Name</label>
                  <input name="name" className="form-control form-control-dark" value={form.name} onChange={handleChange} placeholder="Tejaswini Pallavi" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ fontSize: "0.875rem" }}>Email</label>
                  <input name="email" type="email" className="form-control form-control-dark" value={form.email} onChange={handleChange} placeholder="teju@example.com" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ fontSize: "0.875rem" }}>College / University</label>
                  <input name="college" className="form-control form-control-dark" value={form.college} onChange={handleChange} placeholder="NIT Warangal" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ fontSize: "0.875rem" }}>Branch / Major</label>
                  <input name="branch" className="form-control form-control-dark" value={form.branch} onChange={handleChange} placeholder="Computer Science" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ fontSize: "0.875rem" }}>Year of Study</label>
                  <select name="year" className="form-control form-control-dark" value={form.year} onChange={handleChange}>
                    <option value="">Select year</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-600" style={{ fontSize: "0.875rem" }}>CGPA (out of 10)</label>
                  <input name="cgpa" type="number" step="0.1" min="0" max="10" className="form-control form-control-dark" value={form.cgpa} onChange={handleChange} placeholder="8.5" />
                </div>
              </div>
            )}

            {/* Step 1: Skills & Interests */}
            {step === 1 && (
              <div>
                <h6 className="fw-600 mb-3">Select Your Skills</h6>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {SKILLS_LIST.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="badge px-3 py-2"
                      style={{
                        background: selectedSkills.includes(skill) ? "rgba(99,102,241,0.2)" : "var(--bg-surface)",
                        border: selectedSkills.includes(skill) ? "1.5px solid #6366f1" : "1px solid var(--border-color)",
                        color: selectedSkills.includes(skill) ? "#6366f1" : "var(--text-muted)",
                        cursor: "pointer",
                        borderRadius: "20px",
                        fontWeight: selectedSkills.includes(skill) ? 700 : 400,
                        fontSize: "0.8rem",
                        transition: "all 0.2s",
                      }}
                    >
                      {selectedSkills.includes(skill) ? "✓ " : ""}{skill}
                    </button>
                  ))}
                </div>

                {/* Custom skill input */}
                <div className="d-flex gap-2 mb-4">
                  <input
                    className="form-control form-control-dark"
                    placeholder="Add custom skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                  />
                  <button className="btn-brand btn" onClick={addCustomSkill}>Add</button>
                </div>

                {selectedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="fw-600 mb-2" style={{ fontSize: "0.875rem" }}>Selected ({selectedSkills.length}):</p>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedSkills.map((s) => (
                        <span key={s} className="badge-brand px-3 py-1" style={{ borderRadius: "20px", fontSize: "0.8rem" }}>
                          {s}
                          <button
                            onClick={() => setSelectedSkills((prev) => prev.filter((x) => x !== s))}
                            style={{ background: "none", border: "none", color: "inherit", marginLeft: 4, cursor: "pointer", padding: 0 }}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <h6 className="fw-600 mb-2 mt-4">Interests</h6>
                <div className="d-flex flex-wrap gap-2">
                  {["Data Science", "AI/ML", "Web Development", "Cloud Computing", "Cybersecurity", "Mobile Dev", "DevOps", "Product Management", "Data Analytics", "Research"].map((interest) => (
                    <button
                      key={interest}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          interests: prev.interests.includes(interest)
                            ? prev.interests.filter((i) => i !== interest)
                            : [...prev.interests, interest],
                        }));
                      }}
                      className="badge px-3 py-2"
                      style={{
                        background: form.interests.includes(interest) ? "rgba(6,182,212,0.2)" : "var(--bg-surface)",
                        border: form.interests.includes(interest) ? "1.5px solid #06b6d4" : "1px solid var(--border-color)",
                        color: form.interests.includes(interest) ? "#06b6d4" : "var(--text-muted)",
                        cursor: "pointer",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: form.interests.includes(interest) ? 700 : 400,
                      }}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Education (simple) */}
            {step === 2 && (
              <div>
                <p className="text-muted-dark mb-4">Verify your education details from Step 1.</p>
                <div className="row g-3">
                  {[["College", "college"], ["Branch", "branch"], ["Year", "year"], ["CGPA", "cgpa"]].map(([label, name]) => (
                    <div key={name} className="col-md-6">
                      <label className="form-label fw-600" style={{ fontSize: "0.875rem" }}>{label}</label>
                      <input name={name} className="form-control form-control-dark" value={form[name]} onChange={handleChange} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Resume Upload */}
            {step === 3 && (
              <div>
                <h6 className="fw-600 mb-3">Upload Resume (PDF or DOCX)</h6>
                <div
                  className="p-4 text-center rounded mb-3"
                  style={{ border: "2px dashed var(--border-color)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", cursor: "pointer" }}
                  onClick={() => document.getElementById("resume-input").click()}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📄</div>
                  {resumeFile ? (
                    <p className="text-brand mb-0 fw-600">{resumeFile.name}</p>
                  ) : (
                    <p className="text-muted-dark mb-0">Click to select PDF or DOCX (max 10MB)</p>
                  )}
                </div>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="d-none"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />

                <button
                  className="btn-brand btn w-100 mb-3"
                  onClick={handleResumeUpload}
                  disabled={!resumeFile || uploading}
                >
                  {uploading ? <LoadingSpinner size="sm" text="" /> : "Upload & Parse Resume →"}
                </button>

                {parsedResume && (
                  <div className="glass-card p-3">
                    <p className="fw-600 mb-2">✅ Parsed Successfully</p>
                    <p className="text-muted-dark mb-1" style={{ fontSize: "0.875rem" }}>
                      Skills found: {parsedResume.parsed_data?.skills?.join(", ") || "None detected"}
                    </p>
                    {parsedResume.inconsistencies && (
                      <p className="text-muted-dark" style={{ fontSize: "0.875rem" }}>
                        Consistency score: {parsedResume.inconsistencies.consistency_score}%
                      </p>
                    )}
                  </div>
                )}

                {form.resume_url && !parsedResume && (
                  <p className="text-muted-dark" style={{ fontSize: "0.875rem" }}>
                    Current resume: <a href={form.resume_url} target="_blank" rel="noreferrer" className="text-brand">View</a>
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="d-flex justify-content-between mt-4">
              {step > 0 ? (
                <button className="btn-outline-brand btn" onClick={() => setStep((s) => s - 1)}>
                  ← Back
                </button>
              ) : <div />}
              <button className="btn-brand btn px-4" onClick={handleSave} disabled={saving}>
                {saving ? <LoadingSpinner size="sm" text="" /> : step === STEPS.length - 1 ? "Save & Go to Assessment →" : "Next →"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
