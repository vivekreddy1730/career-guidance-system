import api from "./axios";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const verifyOtp = (idToken) =>
  api.post("/api/auth/verify-otp", { id_token: idToken });

export const getMe = () => api.get("/api/auth/me");

// ── Profile ───────────────────────────────────────────────────────────────────
export const getProfile = () => api.get("/api/profile");
export const updateProfile = (data) => api.put("/api/profile", data);
export const uploadResume = (formData) =>
  api.post("/api/profile/resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getResumeData = () => api.get("/api/profile/resume");

// ── Assessment ────────────────────────────────────────────────────────────────
export const getQuestions = (section, page = 1) =>
  api.get("/api/assessment/questions", { params: { section, page, per_page: 100 } });
export const startAssessment = () => api.post("/api/assessment/start");
export const submitAssessment = (assessmentId, responses) =>
  api.post("/api/assessment/submit", { assessment_id: assessmentId, responses });
export const getReport = () => api.get("/api/assessment/report");

// ── Career ────────────────────────────────────────────────────────────────────
export const predictCareer = () => api.post("/api/career/predict");
export const getGapAnalysis = (career) =>
  api.get("/api/career/gap", { params: { career } });
export const getRecommendations = (career) =>
  api.get("/api/career/recommend", { params: { career } });
export const listCareers = () => api.get("/api/career/list");

// ── Roadmap ───────────────────────────────────────────────────────────────────
export const getRoadmap = (career) =>
  api.get("/api/roadmap", { params: { career } });
export const generateRoadmap = (career) =>
  api.post("/api/roadmap/generate", { career });
export const completeMilestone = (milestoneId, isCompleted) =>
  api.put(`/api/roadmap/milestone/${milestoneId}/complete`, {
    is_completed: isCompleted,
  });

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const getJobs = (career) =>
  api.get("/api/jobs", { params: { career } });
export const getTrendingSkills = () => api.get("/api/jobs/trending");
export const getSalaryInsights = (career) =>
  api.get("/api/jobs/salary", { params: { career } });

// ── Chat ──────────────────────────────────────────────────────────────────────
export const sendMessage = (message, sessionId) =>
  api.post("/api/chat", { message, session_id: sessionId });
export const getChatHistory = (sessionId) =>
  api.get("/api/chat/history", { params: { session_id: sessionId } });
export const clearChatHistory = () => api.delete("/api/chat/history");
