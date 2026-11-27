import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 120000,
});

// Har request me login token jodo
api.interceptors.request.use((config) => {
  try {
    const t = localStorage.getItem("foundit_token");
    if (t) config.headers.Authorization = `Bearer ${t}`;
  } catch {}
  return config;
});

// Token expire ho gaya to wapas login par bhejo
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes("/api/auth/google")) {
      try { localStorage.removeItem("foundit_token"); } catch {}
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
