import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "parent" | "student" | "professeur";
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
