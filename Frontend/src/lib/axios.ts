import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// ─── Token storage helpers ────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess: (): string | null =>
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null,
  getRefresh: (): string | null =>
    typeof window !== "undefined"
      ? localStorage.getItem("refreshToken")
      : null,
  set: (access: string, refresh: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
    }
  },
  clear: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
};

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
