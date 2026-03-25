import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tokenStorage } from "@/lib/axios";
import authService from "@/services/authService";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from "@/types/api";

// ─── State shape ───────────────────────────────────────────────────────────────

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Actions ───────────────────────────────────────────────────────────────────

interface AuthActions {
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: UserResponse) => void;
  clearError: () => void;
  /** Called on app boot to re-hydrate tokens from localStorage into the store */
  hydrateTokens: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function applyAuth(state: AuthState, auth: AuthResponse): Partial<AuthState> {
  tokenStorage.set(auth.accessToken, auth.refreshToken);
  return {
    user: auth.user,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  };
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Actions ──────────────────────────────────────────────────────────────

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const auth = await authService.login(payload);
          set(applyAuth({} as AuthState, auth));
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Login failed",
          });
          throw err;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const auth = await authService.register(payload);
          set(applyAuth({} as AuthState, auth));
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Registration failed",
          });
          throw err;
        }
      },

      logout: () => {
        tokenStorage.clear();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      hydrateTokens: () => {
        const accessToken = tokenStorage.getAccess();
        const refreshToken = tokenStorage.getRefresh();
        if (accessToken && refreshToken) {
          set({ accessToken, refreshToken, isAuthenticated: true });
        }
      },
    }),
    {
      name: "moonside-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist the tokens and user; loading/error state is ephemeral
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);