import axios from "axios";

/**
 * Normalises any error thrown by Axios into a plain Error with a
 * human-readable message, then re-throws it so callers can catch it.
 *
 * Because this function always throws, TypeScript understands that
 * code after a `handleApiError(error)` call is unreachable — which
 * resolves the "function lacks ending return statement" errors in the
 * service files.
 */
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const message: string =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "An unexpected error occurred";
    throw new Error(message);
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error("An unexpected error occurred");
}
