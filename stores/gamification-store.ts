import { create } from "zustand";

export interface Badge {
  name: string;
  icon: string;
  description: string;
}

interface GamificationState {
  showConfetti: boolean;
  showBadgeUnlock: Badge | null;
  score: { correct: number; total: number };
}

interface GamificationActions {
  triggerConfetti: () => void;
  showBadge: (badge: Badge) => void;
  hideBadge: () => void;
  updateScore: (correct: number, total: number) => void;
  resetScore: () => void;
}

export const useGamificationStore = create<
  GamificationState & GamificationActions
>((set) => ({
  showConfetti: false,
  showBadgeUnlock: null,
  score: { correct: 0, total: 0 },

  triggerConfetti: () => {
    set({ showConfetti: true });
    setTimeout(() => set({ showConfetti: false }), 3000);
  },

  showBadge: (badge) => set({ showBadgeUnlock: badge }),
  hideBadge: () => set({ showBadgeUnlock: null }),
  updateScore: (correct, total) => set({ score: { correct, total } }),
  resetScore: () => set({ score: { correct: 0, total: 0 } }),
}));
