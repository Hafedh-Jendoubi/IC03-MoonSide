import { AxiosError } from "axios";
import { ApiResponse } from "@/types/api";

// ─── Typed API error ───────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Extract a human-readable message from any thrown value ───────────────────

export function parseApiError(error: unknown): string {
  if (error instanceof ApiError) return error.message;

  if (error instanceof AxiosError) {
    // Backend returns ApiResponse-shaped error bodies
    const body = error.response?.data as ApiResponse<null> | undefined;
    if (body?.message) return body.message;

    // Fallback to HTTP status text
    if (error.response?.statusText) return error.response.statusText;

    // Network / timeout
    if (error.code === "ECONNABORTED") return "Request timed out. Please try again.";
    if (!error.response) return "Network error. Check your connection.";
  }

  if (error instanceof Error) return error.message;

  return "An unexpected error occurred.";
}

// ─── Wrap an Axios error and re-throw as ApiError ─────────────────────────────

export function handleApiError(error: unknown): never {
  if (error instanceof AxiosError && error.response) {
    const body = error.response.data as ApiResponse<null> | undefined;
    throw new ApiError(
      error.response.status,
      body?.message ?? error.response.statusText ?? "Request failed",
      error
    );
  }
  throw error;
}