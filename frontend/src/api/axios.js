import axios from "axios";

const getBaseUrl = () => {
  // In production (Vercel), use same-origin requests.
  // Vercel's rewrite rules proxy /api/* to the Render backend server-side.
  // This eliminates CORS issues and mobile network blocks entirely.
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "";  // Same-origin — Vercel proxies to Render
  }
  // Local development: talk to local Flask backend directly
  return "";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear token and redirect to login only for authenticated routes, NOT login itself
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("access_token");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
