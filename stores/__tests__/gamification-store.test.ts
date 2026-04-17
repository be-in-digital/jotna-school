import { useGamificationStore } from "../gamification-store";
import type { Badge } from "../gamification-store";

const mockBadge: Badge = {
  name: "First Steps",
  icon: "trophy",
  description: "Complete your first exercise",
};

describe("useGamificationStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGamificationStore.setState({
      showConfetti: false,
      showBadgeUnlock: null,
      score: { correct: 0, total: 0 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should not show confetti", () => {
      expect(useGamificationStore.getState().showConfetti).toBe(false);
    });

    it("should have no badge unlock", () => {
      expect(useGamificationStore.getState().showBadgeUnlock).toBeNull();
    });

    it("should have zero score", () => {
      const score = useGamificationStore.getState().score;
      expect(score.correct).toBe(0);
      expect(score.total).toBe(0);
    });
  });

  describe("triggerConfetti", () => {
    it("should set showConfetti to true", () => {
      useGamificationStore.getState().triggerConfetti();
      expect(useGamificationStore.getState().showConfetti).toBe(true);
    });

    it("should auto-reset showConfetti after 3 seconds", () => {
      useGamificationStore.getState().triggerConfetti();
      expect(useGamificationStore.getState().showConfetti).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(useGamificationStore.getState().showConfetti).toBe(false);
    });

    it("should not reset before 3 seconds", () => {
      useGamificationStore.getState().triggerConfetti();

      vi.advanceTimersByTime(2999);
      expect(useGamificationStore.getState().showConfetti).toBe(true);
    });
  });

  describe("showBadge", () => {
    it("should display the badge", () => {
      useGamificationStore.getState().showBadge(mockBadge);

      const badge = useGamificationStore.getState().showBadgeUnlock;
      expect(badge).toEqual(mockBadge);
    });

    it("should replace an existing badge", () => {
      const anotherBadge: Badge = {
        name: "Speed Demon",
        icon: "lightning",
        description: "Complete an exercise in under 10 seconds",
      };

      useGamificationStore.getState().showBadge(mockBadge);
      useGamificationStore.getState().showBadge(anotherBadge);

      expect(useGamificationStore.getState().showBadgeUnlock).toEqual(anotherBadge);
    });
  });

  describe("hideBadge", () => {
    it("should dismiss the badge", () => {
      useGamificationStore.getState().showBadge(mockBadge);
      useGamificationStore.getState().hideBadge();

      expect(useGamificationStore.getState().showBadgeUnlock).toBeNull();
    });

    it("should be safe to call when no badge is shown", () => {
      useGamificationStore.getState().hideBadge();
      expect(useGamificationStore.getState().showBadgeUnlock).toBeNull();
    });
  });

  describe("updateScore", () => {
    it("should update the score", () => {
      useGamificationStore.getState().updateScore(3, 5);

      const score = useGamificationStore.getState().score;
      expect(score.correct).toBe(3);
      expect(score.total).toBe(5);
    });

    it("should overwrite previous score", () => {
      useGamificationStore.getState().updateScore(3, 5);
      useGamificationStore.getState().updateScore(7, 10);

      const score = useGamificationStore.getState().score;
      expect(score.correct).toBe(7);
      expect(score.total).toBe(10);
    });
  });

  describe("resetScore", () => {
    it("should reset score to zero", () => {
      useGamificationStore.getState().updateScore(5, 10);
      useGamificationStore.getState().resetScore();

      const score = useGamificationStore.getState().score;
      expect(score.correct).toBe(0);
      expect(score.total).toBe(0);
    });

    it("should not affect confetti or badge state", () => {
      useGamificationStore.getState().showBadge(mockBadge);
      useGamificationStore.getState().updateScore(5, 10);
      useGamificationStore.getState().resetScore();

      expect(useGamificationStore.getState().showBadgeUnlock).toEqual(mockBadge);
    });
  });
});
