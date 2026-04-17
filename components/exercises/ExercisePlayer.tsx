"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useExerciseSessionStore } from "@/stores/exercise-session-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { Lightbulb, ArrowRight, Loader2 } from "lucide-react";
import QcmExercise from "./QcmExercise";
import MatchExercise from "./MatchExercise";
import OrderExercise from "./OrderExercise";
import DragDropExercise from "./DragDropExercise";
import ShortAnswerExercise from "./ShortAnswerExercise";

type ExerciseType = "qcm" | "drag-drop" | "match" | "order" | "short-answer";

interface ExerciseData {
  _id: string;
  type: ExerciseType;
  prompt: string;
  payload: unknown;
  hints: string[];
  order: number;
}

interface ExercisePlayerProps {
  exercises: ExerciseData[];
  topicId: string;
  studentId: string;
  onComplete: (stats: {
    correctCount: number;
    totalCount: number;
    totalTimeMs: number;
    totalHintsUsed: number;
  }) => void;
}

const MAX_ATTEMPTS = 5;
const MAX_HINTS = 3;

export default function ExercisePlayer({
  exercises,
  topicId,
  studentId,
  onComplete,
}: ExercisePlayerProps) {
  const submitAttempt = useMutation(api.attempts.submit);

  const {
    currentExerciseIndex,
    startSession,
    nextExercise,
    recordAttempt,
    completeSession,
  } = useExerciseSessionStore();

  const { triggerConfetti, updateScore } = useGamificationStore();

  // Per-exercise state
  const [attemptCount, setAttemptCount] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [showRevealedAnswer, setShowRevealedAnswer] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Timer
  const exerciseStartTime = useRef<number>(Date.now());

  // Session-wide stats
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionTotalTime, setSessionTotalTime] = useState(0);
  const [sessionTotalHints, setSessionTotalHints] = useState(0);

  // Initialize session
  useEffect(() => {
    startSession(
      topicId,
      exercises.map((e) => ({
        id: e._id,
        type: e.type,
        prompt: e.prompt,
        payload: e.payload,
        order: e.order,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset timer when exercise changes
  useEffect(() => {
    exerciseStartTime.current = Date.now();
  }, [currentExerciseIndex]);

  const currentExercise = exercises[currentExerciseIndex];
  if (!currentExercise) return null;

  const availableHints = currentExercise.hints.slice(
    0,
    Math.min(MAX_HINTS, currentExercise.hints.length),
  );

  const handleAdvance = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        nextExercise();
        // Reset per-exercise state
        setAttemptCount(0);
        setHintsRevealed(0);
        setIsCorrect(null);
        setCorrectAnswer(null);
        setShowRevealedAnswer(false);
        setIsTransitioning(false);
      }, 300);
    } else {
      // Session complete
      completeSession();
      onComplete({
        correctCount: sessionCorrectCount,
        totalCount: exercises.length,
        totalTimeMs: sessionTotalTime,
        totalHintsUsed: sessionTotalHints,
      });
    }
  }, [
    currentExerciseIndex,
    exercises.length,
    nextExercise,
    completeSession,
    onComplete,
    sessionCorrectCount,
    sessionTotalTime,
    sessionTotalHints,
  ]);

  const handleSubmit = async (answer: string) => {
    if (isSubmitting || isCorrect === true) return;

    setIsSubmitting(true);
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    const timeSpentMs = Date.now() - exerciseStartTime.current;

    try {
      const result = await submitAttempt({
        exerciseId: currentExercise._id as Id<"exercises">,
        studentId: studentId as Id<"profiles">,
        submittedAnswer: answer,
        attemptNumber: newAttemptCount,
        hintsUsedCount: hintsRevealed,
        timeSpentMs,
      });

      recordAttempt(currentExercise._id, newAttemptCount, hintsRevealed);

      if (result.isCorrect) {
        setIsCorrect(true);
        const newCorrectCount = sessionCorrectCount + 1;
        setSessionCorrectCount(newCorrectCount);
        setSessionTotalTime((prev) => prev + timeSpentMs);
        setSessionTotalHints((prev) => prev + hintsRevealed);
        updateScore(newCorrectCount, exercises.length);
        triggerConfetti();

        // Wait 1.5s then advance
        setTimeout(() => {
          handleAdvance();
        }, 1500);
      } else {
        setIsCorrect(false);
        // Reset isCorrect feedback after 1s so the child can try again
        setTimeout(() => setIsCorrect(null), 1000);

        // If max attempts reached with all hints used, reveal answer
        if (
          newAttemptCount >= MAX_ATTEMPTS &&
          hintsRevealed >= Math.min(MAX_HINTS, availableHints.length)
        ) {
          setCorrectAnswer(result.correctAnswer ?? null);
          setShowRevealedAnswer(true);
          setSessionTotalTime((prev) => prev + timeSpentMs);
          setSessionTotalHints((prev) => prev + hintsRevealed);
        }
      }
    } catch (error) {
      console.error("Error submitting attempt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealHint = () => {
    if (hintsRevealed < availableHints.length) {
      setHintsRevealed(hintsRevealed + 1);
    }
  };

  const showHintButton =
    attemptCount > 0 &&
    isCorrect !== true &&
    hintsRevealed < availableHints.length &&
    !showRevealedAnswer;

  const exerciseDisabled = isSubmitting || isCorrect === true || showRevealedAnswer;

  const progressPercentage = ((currentExerciseIndex + 1) / exercises.length) * 100;

  return (
    <div
      className={`space-y-6 transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-600">
          <span>
            Exercice {currentExerciseIndex + 1} sur {exercises.length}
          </span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Exercise component */}
      <div className="rounded-3xl border-2 border-gray-100 bg-white p-6 shadow-lg">
        {currentExercise.type === "qcm" && (
          <QcmExercise
            prompt={currentExercise.prompt}
            payload={currentExercise.payload as any}
            onSubmit={handleSubmit}
            disabled={exerciseDisabled}
            isCorrect={isCorrect}
          />
        )}
        {currentExercise.type === "match" && (
          <MatchExercise
            prompt={currentExercise.prompt}
            payload={currentExercise.payload as any}
            onSubmit={handleSubmit}
            disabled={exerciseDisabled}
            isCorrect={isCorrect}
          />
        )}
        {currentExercise.type === "order" && (
          <OrderExercise
            prompt={currentExercise.prompt}
            payload={currentExercise.payload as any}
            onSubmit={handleSubmit}
            disabled={exerciseDisabled}
            isCorrect={isCorrect}
          />
        )}
        {currentExercise.type === "drag-drop" && (
          <DragDropExercise
            prompt={currentExercise.prompt}
            payload={currentExercise.payload as any}
            onSubmit={handleSubmit}
            disabled={exerciseDisabled}
            isCorrect={isCorrect}
          />
        )}
        {currentExercise.type === "short-answer" && (
          <ShortAnswerExercise
            prompt={currentExercise.prompt}
            payload={currentExercise.payload as any}
            onSubmit={handleSubmit}
            disabled={exerciseDisabled}
            isCorrect={isCorrect}
          />
        )}
      </div>

      {/* Loading indicator */}
      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Verification...</span>
        </div>
      )}

      {/* Hints */}
      {showHintButton && (
        <button
          onClick={handleRevealHint}
          className="flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-3 text-base font-semibold text-amber-800 transition-all hover:bg-amber-100 hover:shadow-md"
        >
          <Lightbulb className="h-5 w-5" />
          Voir un indice ({hintsRevealed}/{availableHints.length})
        </button>
      )}

      {hintsRevealed > 0 && (
        <div className="space-y-2">
          {availableHints.slice(0, hintsRevealed).map((hint, i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-3 text-base text-amber-800"
            >
              <span className="font-bold">Indice {i + 1} : </span>
              {hint}
            </div>
          ))}
        </div>
      )}

      {/* Revealed answer */}
      {showRevealedAnswer && correctAnswer && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-5 py-4 text-base text-indigo-800">
            <span className="font-bold">La bonne reponse etait : </span>
            {correctAnswer}
          </div>
          <button
            onClick={handleAdvance}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
          >
            Exercice suivant
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Attempt counter */}
      {attemptCount > 0 && isCorrect !== true && !showRevealedAnswer && (
        <div className="text-center text-sm text-gray-500">
          Tentative {attemptCount}/{MAX_ATTEMPTS}
        </div>
      )}
    </div>
  );
}
