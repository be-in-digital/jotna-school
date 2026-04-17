import { useExerciseSessionStore } from "../exercise-session-store";
import type { Exercise } from "../exercise-session-store";

const mockExercises: Exercise[] = [
  { id: "ex-1", type: "multiple-choice", prompt: "What is 2+2?", payload: { options: [3, 4, 5] }, order: 0 },
  { id: "ex-2", type: "fill-in", prompt: "Complete: 3 + _ = 7", payload: { answer: 4 }, order: 1 },
  { id: "ex-3", type: "drag-drop", prompt: "Order these numbers", payload: { items: [3, 1, 2] }, order: 2 },
];

describe("useExerciseSessionStore", () => {
  beforeEach(() => {
    useExerciseSessionStore.setState({
      currentTopicId: null,
      exercises: [],
      currentExerciseIndex: 0,
      attempts: new Map(),
      sessionStartTime: null,
      isComplete: false,
    });
  });

  describe("initial state", () => {
    it("should have null topic id", () => {
      expect(useExerciseSessionStore.getState().currentTopicId).toBeNull();
    });

    it("should have empty exercises", () => {
      expect(useExerciseSessionStore.getState().exercises).toEqual([]);
    });

    it("should have currentExerciseIndex at 0", () => {
      expect(useExerciseSessionStore.getState().currentExerciseIndex).toBe(0);
    });

    it("should have empty attempts map", () => {
      expect(useExerciseSessionStore.getState().attempts.size).toBe(0);
    });

    it("should have null sessionStartTime", () => {
      expect(useExerciseSessionStore.getState().sessionStartTime).toBeNull();
    });

    it("should not be complete", () => {
      expect(useExerciseSessionStore.getState().isComplete).toBe(false);
    });
  });

  describe("startSession", () => {
    it("should initialize the session with topic and exercises", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);

      const state = useExerciseSessionStore.getState();
      expect(state.currentTopicId).toBe("topic-1");
      expect(state.exercises).toEqual(mockExercises);
      expect(state.currentExerciseIndex).toBe(0);
      expect(state.attempts.size).toBe(0);
      expect(state.sessionStartTime).toBeTypeOf("number");
      expect(state.isComplete).toBe(false);
    });

    it("should reset previous session data when starting new session", () => {
      const store = useExerciseSessionStore.getState();
      store.startSession("topic-1", mockExercises);
      store.nextExercise();
      store.recordAttempt("ex-1", 1, 0);
      store.completeSession();

      useExerciseSessionStore.getState().startSession("topic-2", [mockExercises[0]]);

      const state = useExerciseSessionStore.getState();
      expect(state.currentTopicId).toBe("topic-2");
      expect(state.exercises).toHaveLength(1);
      expect(state.currentExerciseIndex).toBe(0);
      expect(state.attempts.size).toBe(0);
      expect(state.isComplete).toBe(false);
    });
  });

  describe("nextExercise", () => {
    it("should advance to the next exercise", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);
      useExerciseSessionStore.getState().nextExercise();

      expect(useExerciseSessionStore.getState().currentExerciseIndex).toBe(1);
    });

    it("should not advance past the last exercise", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);

      const store = useExerciseSessionStore.getState();
      store.nextExercise(); // index 1
      useExerciseSessionStore.getState().nextExercise(); // index 2
      useExerciseSessionStore.getState().nextExercise(); // should stay at 2

      expect(useExerciseSessionStore.getState().currentExerciseIndex).toBe(2);
    });

    it("should not advance when exercises are empty", () => {
      useExerciseSessionStore.getState().nextExercise();
      expect(useExerciseSessionStore.getState().currentExerciseIndex).toBe(0);
    });
  });

  describe("recordAttempt", () => {
    it("should record an attempt for an exercise", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);
      useExerciseSessionStore.getState().recordAttempt("ex-1", 1, 0);

      const attempt = useExerciseSessionStore.getState().attempts.get("ex-1");
      expect(attempt).toBeDefined();
      expect(attempt!.attemptNumber).toBe(1);
      expect(attempt!.hintsUsed).toBe(0);
      expect(attempt!.startTime).toBeTypeOf("number");
    });

    it("should overwrite previous attempt for same exercise", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);
      useExerciseSessionStore.getState().recordAttempt("ex-1", 1, 0);
      useExerciseSessionStore.getState().recordAttempt("ex-1", 2, 1);

      const attempt = useExerciseSessionStore.getState().attempts.get("ex-1");
      expect(attempt!.attemptNumber).toBe(2);
      expect(attempt!.hintsUsed).toBe(1);
    });

    it("should track attempts for multiple exercises", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);
      useExerciseSessionStore.getState().recordAttempt("ex-1", 1, 0);
      useExerciseSessionStore.getState().recordAttempt("ex-2", 1, 2);

      const attempts = useExerciseSessionStore.getState().attempts;
      expect(attempts.size).toBe(2);
      expect(attempts.get("ex-1")!.hintsUsed).toBe(0);
      expect(attempts.get("ex-2")!.hintsUsed).toBe(2);
    });
  });

  describe("completeSession", () => {
    it("should mark the session as complete", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);
      useExerciseSessionStore.getState().completeSession();

      expect(useExerciseSessionStore.getState().isComplete).toBe(true);
    });

    it("should preserve other session data", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);
      useExerciseSessionStore.getState().recordAttempt("ex-1", 1, 0);
      useExerciseSessionStore.getState().completeSession();

      const state = useExerciseSessionStore.getState();
      expect(state.currentTopicId).toBe("topic-1");
      expect(state.exercises).toHaveLength(3);
      expect(state.attempts.size).toBe(1);
    });
  });

  describe("resetSession", () => {
    it("should reset all session state", () => {
      useExerciseSessionStore.getState().startSession("topic-1", mockExercises);
      useExerciseSessionStore.getState().nextExercise();
      useExerciseSessionStore.getState().recordAttempt("ex-1", 1, 0);
      useExerciseSessionStore.getState().completeSession();
      useExerciseSessionStore.getState().resetSession();

      const state = useExerciseSessionStore.getState();
      expect(state.currentTopicId).toBeNull();
      expect(state.exercises).toEqual([]);
      expect(state.currentExerciseIndex).toBe(0);
      expect(state.attempts.size).toBe(0);
      expect(state.sessionStartTime).toBeNull();
      expect(state.isComplete).toBe(false);
    });

    it("should be safe to call when already reset", () => {
      useExerciseSessionStore.getState().resetSession();

      const state = useExerciseSessionStore.getState();
      expect(state.currentTopicId).toBeNull();
      expect(state.exercises).toEqual([]);
    });
  });
});
