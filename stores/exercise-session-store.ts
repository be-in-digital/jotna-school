import { create } from "zustand";

export interface Exercise {
  id: string;
  type: string;
  prompt: string;
  payload: unknown;
  order: number;
}

export interface Attempt {
  attemptNumber: number;
  hintsUsed: number;
  startTime: number;
}

interface ExerciseSessionState {
  currentTopicId: string | null;
  exercises: Exercise[];
  currentExerciseIndex: number;
  attempts: Map<string, Attempt>;
  sessionStartTime: number | null;
  isComplete: boolean;
}

interface ExerciseSessionActions {
  startSession: (
    topicId: string,
    exercises: Exercise[],
    initialIndex?: number,
  ) => void;
  nextExercise: () => void;
  recordAttempt: (
    exerciseId: string,
    attemptNumber: number,
    hintsUsed: number
  ) => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const useExerciseSessionStore = create<
  ExerciseSessionState & ExerciseSessionActions
>((set, get) => ({
  currentTopicId: null,
  exercises: [],
  currentExerciseIndex: 0,
  attempts: new Map(),
  sessionStartTime: null,
  isComplete: false,

  startSession: (topicId, exercises, initialIndex = 0) =>
    set({
      currentTopicId: topicId,
      exercises,
      currentExerciseIndex: Math.max(
        0,
        Math.min(initialIndex, exercises.length - 1),
      ),
      attempts: new Map(),
      sessionStartTime: Date.now(),
      isComplete: false,
    }),

  nextExercise: () => {
    const { currentExerciseIndex, exercises } = get();
    if (currentExerciseIndex < exercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
    }
  },

  recordAttempt: (exerciseId, attemptNumber, hintsUsed) => {
    const newAttempts = new Map(get().attempts);
    newAttempts.set(exerciseId, {
      attemptNumber,
      hintsUsed,
      startTime: Date.now(),
    });
    set({ attempts: newAttempts });
  },

  completeSession: () => set({ isComplete: true }),

  resetSession: () =>
    set({
      currentTopicId: null,
      exercises: [],
      currentExerciseIndex: 0,
      attempts: new Map(),
      sessionStartTime: null,
      isComplete: false,
    }),
}));
