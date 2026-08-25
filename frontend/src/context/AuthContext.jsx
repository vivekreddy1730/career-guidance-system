import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      getMe()
        .then((res) => setStudent(res.data.student))
        .catch(() => {
          localStorage.removeItem("access_token");
          setStudent(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, studentData) => {
    localStorage.setItem("access_token", token);
    setStudent(studentData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setStudent(null);
  };

  const updateStudent = (data) => {
    setStudent((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ student, loading, login, logout, updateStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function PrivateRoute({ children }) {
  const { student, loading } = useAuth();
  const token = localStorage.getItem("access_token");

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: "var(--bg-dark)" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!student && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
