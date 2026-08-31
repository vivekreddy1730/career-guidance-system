import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "./context/AuthContext";
import api from "./api/axios";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AssessmentPage from "./pages/AssessmentPage";
import ResultsPage from "./pages/ResultsPage";
import RoadmapPage from "./pages/RoadmapPage";
import JobMarketPage from "./pages/JobMarketPage";
import ChatbotPage from "./pages/ChatbotPage";
import MockInterviewPage from "./pages/MockInterviewPage";
import AtsScannerPage from "./pages/AtsScannerPage";

export default function App() {
  // Pre-warm Render backend on initial page load
  useEffect(() => {
    api.get("/api/health").catch(() => {});
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/assessment" element={<PrivateRoute><AssessmentPage /></PrivateRoute>} />
      <Route path="/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
      <Route path="/roadmap" element={<PrivateRoute><RoadmapPage /></PrivateRoute>} />
      <Route path="/jobs" element={<PrivateRoute><JobMarketPage /></PrivateRoute>} />
      <Route path="/interview" element={<PrivateRoute><MockInterviewPage /></PrivateRoute>} />
      <Route path="/ats-scanner" element={<PrivateRoute><AtsScannerPage /></PrivateRoute>} />
      <Route path="/chat" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
