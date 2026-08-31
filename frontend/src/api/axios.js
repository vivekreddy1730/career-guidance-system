import axios from "axios";

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // If in production or custom cloud URL specified (not localhost)
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  // Otherwise use relative URL so Vite proxy forwards /api calls seamlessly on mobile & other laptops
  return "";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
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
