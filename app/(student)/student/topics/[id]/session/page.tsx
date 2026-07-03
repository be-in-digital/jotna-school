"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  LockKeyhole,
  Sparkles,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import Link from "next/link";

import { JotnaLoader } from "@/components/jotna-loader";
import { playCorrect, setSoundEnabledLocal } from "@/lib/sounds";
import { PalierStarsBar } from "@/components/star-rating";
import { CapRegenAlternatives } from "@/components/cap-regen-alternatives";
import { kidMessages } from "@/lib/kidCopy";
import { ExplainStepByStep } from "@/components/student/explain-step-by-step";
import { Pio } from "@/components/student/pio";
import { StudentAlertDialog } from "@/components/student/student-alert-dialog";
import {
  GameButton,
  GameLinkButton,
} from "@/components/student/game/game-button";
import { track } from "@/lib/analytics";
import QcmExercise from "@/components/exercises/QcmExercise";
import ShortAnswerExercise from "@/components/exercises/ShortAnswerExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import DragDropExercise from "@/components/exercises/DragDropExercise";
import { motion, AnimatePresence } from "framer-motion";

type SanitizedExo = {
  _id: Id<"exercises">;
  type: "qcm" | "drag-drop" | "match" | "order" | "short-answer";
  prompt: string;
  payload: Record<string, unknown>;
  hintsAvailable: number;
  palierAttemptId: Id<"palierAttempts">;
  isVariation: boolean;
};

type PalierResult = {
  status: "validated" | "failed";
  average: number;
  starsTotal: number;
  threshold: number;
  failedCount: number;
  canRegen: boolean;
  cumulativeRegens: number;
  coinsEarned?: number;
  zoneTreasure?: number;
};

type SceneAlert =
  | { type: "regen-error"; message: string }
  | { type: "parent-notified" }
  | { type: "quit-confirm" };

type AttemptProgress = {
  currentIndex: number;
  completedCount: number;
  totalCount: number;
  failedAttemptsThisExo: number;
  hintsUsedThisExo: number;
};

export default function TopicSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: topicId } = use(params);
  const searchParams = useSearchParams();
  const palierIndex = parseInt(searchParams.get("palier") ?? "1", 10);

  return <PalierSession key={`${topicId}-${palierIndex}`} topicId={topicId} palierIndex={palierIndex} />;
}

function PalierSession({ topicId, palierIndex }: { topicId: string; palierIndex: number }) {
  const router = useRouter();

  // Wait for Convex auth before querying profile (Decision 99 — anti race-condition)
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );
  const topic = useQuery(api.topics.getById, {
    id: topicId as Id<"topics">,
  });

  const getBucket = useAction(api.paliers.index.getBucket);
  const startAttempt = useMutation(api.paliers.index.startPalierAttempt);
  const verifyAttempt = useMutation(api.palierAttempts.verifyAttempt);
  const requestHint = useMutation(api.palierAttempts.requestHint);
  const submitPalier = useMutation(api.palierAttempts.submitPalier);
  const regenerate = useAction(api.paliers.index.regenerateFailedExercises);
  // D22 — quick-mute support during session focus mode
  const soundPref = useQuery(api.students.getMySoundEnabled);
  const setSoundEnabled = useMutation(api.streak.setSoundEnabled);

  // Bootstrap state
  const [palierAttemptId, setPalierAttemptId] =
    useState<Id<"palierAttempts"> | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Load exercises (only when palierAttemptId ready)
  const exercises = useQuery(
    api.paliers.index.getExercisesForPalier,
    palierAttemptId ? { palierAttemptId } : "skip",
  ) as SanitizedExo[] | null | undefined;
  const attemptProgress = useQuery(
    api.palierAttempts.getProgressForPalierAttempt,
    palierAttemptId ? { palierAttemptId } : "skip",
  ) as AttemptProgress | null | undefined;

  // Palier loop state
  const [localCurrentIndex, setLocalCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    attemptsRemaining: number;
  } | null>(null);
  const [hintShown, setHintShown] = useState<{
    text: string;
    index: number;
  } | null>(null);
  const [localHintsUsedThisExo, setLocalHintsUsedThisExo] = useState(0);
  const [localFailedAttemptsThisExo, setLocalFailedAttemptsThisExo] =
    useState(0);
  const [palierResult, setPalierResult] = useState<PalierResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sceneAlert, setSceneAlert] = useState<SceneAlert | null>(null);
  const [localStateAttemptId, setLocalStateAttemptId] =
    useState<Id<"palierAttempts"> | null>(null);
  // Step-by-step explanation panel — opened when the kid taps
  // "Je veux comprendre" after exhausting all 5 attempts on an exercise.
  const [explainOpen, setExplainOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Network status (Decision 90)
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // D29 — sync local sound memo with server preference for play() short-circuit.
  useEffect(() => {
    if (soundPref?.soundEnabled !== undefined) {
      setSoundEnabledLocal(soundPref.soundEnabled);
    }
  }, [soundPref?.soundEnabled]);

  const handleToggleSound = useCallback(async () => {
    const next = !(soundPref?.soundEnabled ?? false);
    setSoundEnabledLocal(next);
    try {
      await setSoundEnabled({ enabled: next });
    } catch {
      // Mutation will queue offline; UI reflects optimistic state via memo.
    }
  }, [soundPref?.soundEnabled, setSoundEnabled]);

  // Bootstrap : getBucket → startAttempt
  useEffect(() => {
    if (!topic || palierAttemptId || bootstrapping || bootstrapError) return;
    (async () => {
      setBootstrapping(true);
      setBootstrapError(null);
      try {
        if (!topic.class) {
          setBootstrapError(
            "Cette thématique n'a pas encore de classe assignée.",
          );
          return;
        }
        const bucket = await getBucket({
          subjectId: topic.subjectId,
          class: topic.class as
            | "CI"
            | "CP"
            | "CE1"
            | "CE2"
            | "CM1"
            | "CM2",
          topicId: topicId as Id<"topics">,
          palierIndex,
        });
        const attemptId = await startAttempt({ palierId: bucket.palierId });
        setPalierAttemptId(attemptId);
      } catch (err: unknown) {
        let msg = err instanceof Error ? err.message : String(err ?? "Erreur inconnue");
        const match = msg.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
        if (match) msg = match[1].trim();
        setBootstrapError(msg);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [
    topic,
    palierAttemptId,
    bootstrapping,
    bootstrapError,
    getBucket,
    startAttempt,
    topicId,
    palierIndex,
  ]);

  const shouldUseServerProgress =
    palierAttemptId !== null &&
    localStateAttemptId !== palierAttemptId &&
    attemptProgress !== null &&
    attemptProgress !== undefined;
  const currentIndex = shouldUseServerProgress
    ? attemptProgress.currentIndex
    : localCurrentIndex;
  const hintsUsedThisExo = shouldUseServerProgress
    ? attemptProgress.hintsUsedThisExo
    : localHintsUsedThisExo;
  const failedAttemptsThisExo = shouldUseServerProgress
    ? attemptProgress.failedAttemptsThisExo
    : localFailedAttemptsThisExo;

  const handleQuit = useCallback(() => {
    setSceneAlert({ type: "quit-confirm" });
  }, []);

  const nextExoRef = useRef<() => void>(() => {});

  const handleRequestHint = useCallback(async () => {
    if (!exercises || !palierAttemptId) return;
    const exo = exercises[currentIndex];
    if (!exo) return;
    if (hintsUsedThisExo >= exo.hintsAvailable) return;
    try {
      const res = await requestHint({
        exerciseId: exo._id,
        palierAttemptId,
        hintIndex: hintsUsedThisExo,
      });
      setLocalStateAttemptId(palierAttemptId);
      setHintShown({ text: res.hint, index: res.hintIndex });
      setLocalHintsUsedThisExo(hintsUsedThisExo + 1);
    } catch (err) {
      console.error(err);
    }
  }, [exercises, palierAttemptId, currentIndex, hintsUsedThisExo, requestHint]);

  const handleNextExo = useCallback(async () => {
    if (!exercises) return;
    if (palierAttemptId) setLocalStateAttemptId(palierAttemptId);
    setFeedback(null);
    setHintShown(null);
    setLocalHintsUsedThisExo(0);
    setLocalFailedAttemptsThisExo(0);
    if (currentIndex < exercises.length - 1) {
      setLocalCurrentIndex(currentIndex + 1);
      return;
    }
    // End of palier — submit
    if (!palierAttemptId) return;
    setSubmitting(true);
    try {
      const res = await submitPalier({ palierAttemptId });
      setPalierResult(res as PalierResult);
      track("palier_submitted", {
        status: (res as PalierResult).status,
        stars: (res as PalierResult).starsTotal,
        palierIndex,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [exercises, currentIndex, palierAttemptId, submitPalier]);

  useEffect(() => {
    nextExoRef.current = handleNextExo;
  }, [handleNextExo]);

  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      if (!exercises || !palierAttemptId) return;
      const exo = exercises[currentIndex];
      if (!exo) return;
      try {
        const res = await verifyAttempt({
          exerciseId: exo._id,
          palierAttemptId,
          userAnswer: answer,
        });
        setFeedback({
          correct: res.isCorrect,
          attemptsRemaining: res.attemptsRemaining,
        });
        if (res.isCorrect) {
          setLocalStateAttemptId(palierAttemptId);
          void playCorrect();
          setTimeout(() => nextExoRef.current(), 1200);
        } else {
          setLocalStateAttemptId(palierAttemptId);
          setLocalFailedAttemptsThisExo(failedAttemptsThisExo + 1);
          if (res.attemptsRemaining > 0) {
            setTimeout(() => setFeedback(null), 2500);
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    [
      exercises,
      palierAttemptId,
      currentIndex,
      failedAttemptsThisExo,
      verifyAttempt,
    ],
  );

  const handleRegen = useCallback(async () => {
    if (!palierAttemptId) return;
    setRegenerating(true);
    try {
      await regenerate({ palierAttemptId });
      setPalierResult(null);
      setLocalStateAttemptId(palierAttemptId);
      setLocalCurrentIndex(0);
      setFeedback(null);
      setHintShown(null);
      setLocalHintsUsedThisExo(0);
      setLocalFailedAttemptsThisExo(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setSceneAlert({ type: "regen-error", message: msg });
    } finally {
      setRegenerating(false);
    }
  }, [palierAttemptId, regenerate]);

  // ==== RENDER ====

  // Loading states — wait for auth resolution AND queries
  if (authLoading || (isAuthenticated && profile === undefined) || topic === undefined) {
    return <JotnaLoader />;
  }
  if (!isAuthenticated || profile === null) {
    return (
      <CenteredCard>
        <Pio state="think" size={110} />
        <h2 className="font-game text-xl font-bold text-amber-950">
          Non connecté
        </h2>
        <p className="text-amber-900/60">
          Connecte-toi pour faire les exercices.
        </p>
        <GameLinkButton href="/login" size="lg">
          Se connecter
        </GameLinkButton>
      </CenteredCard>
    );
  }
  if (!topic) {
    return (
      <CenteredCard>
        <BookOpen className="h-16 w-16 text-amber-300" />
        <h2 className="font-game text-xl font-bold text-amber-950">
          Thématique introuvable
        </h2>
        <GameLinkButton href="/student/map" variant="ghost">
          Retour à la carte
        </GameLinkButton>
      </CenteredCard>
    );
  }

  if (bootstrapError) {
    const isPalierLocked = bootstrapError.includes("valider le palier");
    if (isPalierLocked && palierIndex > 1) {
      return (
        <LockedPalierScreen
          currentPalier={palierIndex}
          previousPalier={palierIndex - 1}
          message={bootstrapError}
          onGoPrevious={() =>
            router.replace(
              `/student/topics/${topicId}/session?palier=${palierIndex - 1}`,
            )
          }
        />
      );
    }

    return (
      <CenteredCard>
        <Pio state="sad" size={110} />
        <p className="max-w-md font-game text-base font-semibold text-amber-950">
          {bootstrapError}
        </p>
        <GameButton variant="ghost" onClick={() => router.back()}>
          Retour
        </GameButton>
      </CenteredCard>
    );
  }

  if (
    !palierAttemptId ||
    exercises === undefined ||
    attemptProgress === undefined
  ) {
    return <JotnaLoader />;
  }
  if (exercises === null || exercises.length === 0) {
    return (
      <CenteredCard>
        <Pio state="think" size={110} />
        <h2 className="font-game text-xl font-bold text-amber-950">
          Aucun exercice disponible
        </h2>
        <GameButton onClick={() => router.back()}>Retour</GameButton>
      </CenteredCard>
    );
  }

  // Final palier screen
  if (palierResult) {
    const validated = palierResult.status === "validated";
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative overflow-hidden rounded-3xl border-b-8 p-8 text-center text-white shadow-xl ${
            validated
              ? "border-emerald-700 bg-gradient-to-r from-lime-500 to-emerald-500"
              : "border-orange-700 bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400"
          }`}
        >
          <div className="mx-auto mb-3 flex justify-center">
            <Pio
              state={validated ? "cheer" : "encourage"}
              size={104}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="mb-3 font-game text-3xl font-bold">
            {validated
              ? kidMessages.palierValidatedShort
              : "Palier non validé"}
          </h1>
          <p className="mb-4 text-lg opacity-95">
            {validated
              ? kidMessages.palierValidated(palierResult.starsTotal)
              : kidMessages.palierFailed(palierResult.starsTotal)}
          </p>
          <div className="mx-auto max-w-sm">
            <PalierStarsBar
              starsTotal={palierResult.starsTotal}
              threshold={palierResult.threshold * 3}
            />
          </div>
          {/* Boutique G7-V2 — pièces gagnées + trésor de zone */}
          {validated && (palierResult.coinsEarned ?? 0) > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-1.5 font-game text-base font-bold backdrop-blur-sm">
              +{palierResult.coinsEarned} 🪙 pour la boutique !
            </p>
          )}
          {(palierResult.zoneTreasure ?? 0) > 0 && (
            <p className="mt-2 font-game text-base font-bold">
              🎁 Trésor de zone : +{palierResult.zoneTreasure} 🪙 — toute la
              matière est terminée !
            </p>
          )}
        </motion.div>

        {!validated && palierResult.canRegen && !regenerating && (
          <div className="space-y-3 text-center">
            <p className="text-base text-amber-900/80">
              {kidMessages.regenIntro}
            </p>
            <GameButton onClick={handleRegen} size="lg">
              {kidMessages.regenCta}
            </GameButton>
          </div>
        )}

        {regenerating && (
          <JotnaLoader message={kidMessages.regenLoading} />
        )}

        {!validated && !palierResult.canRegen && (
          <CapRegenAlternatives
            onSeeCorrected={() =>
              router.push(`/student/topics/${topicId}/session?palier=${palierIndex}&review=1`)
            }
            previousPalierHref={
              palierIndex > 1
                ? `/student/topics/${topicId}/session?palier=${palierIndex - 1}`
                : null
            }
            onAskParent={() => {
              setSceneAlert({ type: "parent-notified" });
            }}
          />
        )}

        {validated && (
          <div className="flex flex-col items-center gap-3 text-center">
            <GameLinkButton
              href={`/student/topics/${topicId}/session?palier=${palierIndex + 1}`}
              variant="success"
              size="lg"
            >
              Palier suivant 🚀
            </GameLinkButton>
            <GameLinkButton
              href={
                topic?.subjectId
                  ? `/student/map/${topic.subjectId}`
                  : "/student/map"
              }
              variant="ghost"
            >
              Retour à la carte
            </GameLinkButton>
          </div>
        )}
        <SceneAlertDialog
          alert={sceneAlert}
          onClose={() => setSceneAlert(null)}
          onGoHome={() => {
            setSceneAlert(null);
            router.push("/student/home");
          }}
          onQuit={() => {
            setSceneAlert(null);
            if (topic?.subjectId) {
              router.push(`/student/map/${topic.subjectId}`);
            } else {
              router.push("/student/home");
            }
          }}
        />
      </div>
    );
  }

  // In-progress palier player
  const exo = exercises[currentIndex];
  const totalExos = exercises.length;
  const disabled = feedback !== null;

  return (
    <div className="relative mx-auto max-w-2xl py-4">
      {/* Network drop banner (Decision 90) */}
      {!isOnline && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
          <WifiOff className="h-4 w-4" />
          {kidMessages.networkLost}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-amber-900/60">
          <span className="font-game font-bold text-amber-950">
            {topic.name ?? "Palier"} — niveau {palierIndex}
          </span>
          <span className="mx-2">·</span>
          <span className="font-semibold">
            Question {currentIndex + 1}/{totalExos}
          </span>
          {exo?.isVariation && (
            <span className="ml-2 rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
              Variation
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* D22 — quick-mute. Only renders if the kid has decided about
              sounds (soundPref !== null + .soundEnabled defined). Hides for
              brand-new students who haven't seen the opt-in dialog yet. */}
          {soundPref && (
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={
                soundPref.soundEnabled
                  ? "Couper le son"
                  : "Activer le son"
              }
              aria-pressed={soundPref.soundEnabled}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200 bg-white/85 text-amber-900/70 shadow-sm transition-all hover:bg-white"
            >
              {soundPref.soundEnabled ? (
                <Volume2 className="h-5 w-5" aria-hidden />
              ) : (
                <VolumeX className="h-5 w-5" aria-hidden />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleQuit}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-amber-200 bg-white/85 px-3 py-1.5 font-game text-xs font-semibold text-amber-900/70 shadow-sm hover:bg-white"
          >
            <X className="h-4 w-4" />
            {kidMessages.cta.quit}
          </button>
        </div>
      </div>

      {/* Progress bar — sand trail style */}
      <div className="mb-6 h-3 w-full overflow-hidden rounded-full border border-amber-200 bg-amber-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIndex + (feedback?.correct ? 1 : 0)) / totalExos) * 100}%`,
          }}
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
        />
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${exo._id}-${feedback?.correct ?? "pending"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl border-2 border-amber-200 bg-white/95 p-6 shadow-[0_6px_0_rgba(217,119,6,0.15)]"
        >
          <ExerciseRenderer
            exo={exo}
            disabled={disabled}
            isCorrect={feedback?.correct ?? null}
            onSubmit={handleSubmitAnswer}
            onSkip={handleNextExo}
          />

          {/* Hints — progressive: first hint unlocks after 1 failed attempt,
              second after 2, third after 4. Only shown when the kid has failed
              at least once and isn't currently seeing feedback. */}
          {!feedback && failedAttemptsThisExo > 0 && exo.hintsAvailable > 0 && (
            <div className="mt-4 space-y-2">
              {hintsUsedThisExo < exo.hintsAvailable &&
                hintsUsedThisExo < (failedAttemptsThisExo >= 4 ? 3 : failedAttemptsThisExo >= 2 ? 2 : 1) && (
                <button
                  onClick={handleRequestHint}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 border-amber-300 border-b-4 bg-amber-100 px-4 py-2 font-game text-sm font-semibold text-amber-800 transition-all hover:bg-amber-200 active:translate-y-[2px] active:border-b-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Voir un indice
                </button>
              )}
              {hintShown && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-amber-50 border border-amber-200 p-3"
                >
                  <p className="text-sm text-amber-900">
                    <span className="font-semibold">
                      Indice {hintShown.index + 1} :
                    </span>{" "}
                    {hintShown.text}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Feedback — brief flash, no buttons. Auto-dismisses (correct →
              auto-advance after 1.2s, wrong with retries → auto-clear 1.2s,
              wrong with 0 retries → stays until "Je veux comprendre" or next). */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mt-4 space-y-3"
              >
                <div
                  className={`rounded-2xl border-2 px-4 py-3 text-center font-game font-bold ${
                    feedback.correct
                      ? "border-lime-200 bg-lime-100 text-lime-800"
                      : "border-orange-200 bg-orange-100 text-orange-800"
                  }`}
                >
                  {feedback.correct
                    ? "Bravo !"
                    : feedback.attemptsRemaining > 0
                      ? `Pas tout à fait…`
                      : "Tu peux passer à la suite."}
                </div>
                {!feedback.correct && feedback.attemptsRemaining === 0 && (
                  <>
                    <GameButton
                      variant="ghost"
                      onClick={() => setExplainOpen(true)}
                      disabled={submitting}
                      className="w-full"
                    >
                      <Lightbulb className="h-5 w-5" aria-hidden />
                      Je veux comprendre
                    </GameButton>
                    <GameButton
                      onClick={handleNextExo}
                      disabled={submitting}
                      size="lg"
                      className="w-full"
                    >
                      {currentIndex < totalExos - 1
                        ? kidMessages.cta.next
                        : submitting
                          ? "..."
                          : "Voir mon résultat"}
                    </GameButton>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Step-by-step pedagogical explanation overlay (kid clicked
          "Je veux comprendre" after exhausting all 5 attempts). The
          `key={exo._id}` forces a remount on exercise change so the
          loading state resets cleanly without setState-in-effect. */}
      {exo && (
        <ExplainStepByStep
          key={exo._id}
          exerciseId={exo._id}
          open={explainOpen}
          onClose={() => setExplainOpen(false)}
        />
      )}
      <SceneAlertDialog
        alert={sceneAlert}
        onClose={() => setSceneAlert(null)}
        onGoHome={() => {
          setSceneAlert(null);
          router.push("/student/home");
        }}
        onQuit={() => {
          setSceneAlert(null);
          if (topic?.subjectId) {
            router.push(`/student/map/${topic.subjectId}`);
          } else {
            router.push("/student/home");
          }
        }}
      />
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function SceneAlertDialog({
  alert,
  onClose,
  onGoHome,
  onQuit,
}: {
  alert: SceneAlert | null;
  onClose: () => void;
  onGoHome: () => void;
  onQuit: () => void;
}) {
  if (alert?.type === "quit-confirm") {
    return (
      <StudentAlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        tone="warning"
        label="Pause possible"
        title="Tu veux quitter ?"
        description="Ta progression est sauvegardée. Tu pourras reprendre plus tard."
        primaryLabel="Sauvegarder et quitter"
        onPrimary={onQuit}
        secondaryLabel="Continuer l'exercice"
        onSecondary={onClose}
      />
    );
  }

  if (alert?.type === "parent-notified") {
    return (
      <StudentAlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onGoHome();
        }}
        tone="info"
        label="Message envoyé"
        title="Pio prévient ton parent"
        description="Ton parent va recevoir une notification pour t'aider à continuer."
        primaryLabel="Retour à l'accueil"
        onPrimary={onGoHome}
      />
    );
  }

  if (alert?.type === "regen-error") {
    return (
      <StudentAlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        tone="warning"
        label="Petit blocage"
        title="On réessaie dans un instant"
        description={alert.message}
        primaryLabel="J'ai compris"
        onPrimary={onClose}
      />
    );
  }

  return null;
}

function LockedPalierScreen({
  currentPalier,
  previousPalier,
  message,
  onGoPrevious,
}: {
  currentPalier: number;
  previousPalier: number;
  message: string;
  onGoPrevious: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-orange-300 to-lime-300 p-1 shadow-2xl"
      >
        <div className="absolute left-8 top-8 h-8 w-8 rotate-12 rounded-lg bg-white/35" />
        <div className="absolute right-10 top-10 h-7 w-7 -rotate-12 rounded-md bg-sky-200/70" />
        <div className="absolute bottom-12 left-12 h-6 w-6 rotate-45 rounded-md bg-emerald-200/70" />

        <div className="relative rounded-[1.35rem] bg-white/92 px-5 py-7 text-center sm:px-8 sm:py-8">
          <div className="mx-auto mb-3 flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-b from-sky-100 to-amber-100 shadow-inner">
            <Pio state="think" size={122} />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 font-game text-xs font-bold uppercase tracking-wide text-orange-700">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
            Palier {currentPalier} verrouillé
          </div>

          <h1 className="font-game text-3xl font-bold leading-tight text-amber-950 sm:text-4xl">
            Encore une marche avant !
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-semibold text-amber-900/70">
            Pio garde ce palier au chaud. Termine d&apos;abord le palier{" "}
            {previousPalier}, puis la suite s&apos;ouvrira.
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
            <StepBubble
              active
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
              label={`Palier ${previousPalier}`}
            />
            <StepBubble
              active={false}
              icon={<LockKeyhole className="h-5 w-5" aria-hidden />}
              label={`Palier ${currentPalier}`}
            />
            <StepBubble
              active={false}
              icon={<Sparkles className="h-5 w-5" aria-hidden />}
              label="Après"
            />
          </div>

          <p className="mx-auto mt-5 max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900/60">
            {message}
          </p>

          <GameButton
            onClick={onGoPrevious}
            size="lg"
            className="mt-6 w-full sm:w-auto"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            Reprendre le palier {previousPalier}
          </GameButton>
        </div>
      </motion.div>
    </div>
  );
}

function StepBubble({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 ${
        active
          ? "border-lime-200 bg-lime-50 text-lime-700"
          : "border-amber-200 bg-amber-50/60 text-amber-900/40"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
        {icon}
      </div>
      <p className="font-game text-xs font-bold">{label}</p>
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
      {children}
    </div>
  );
}

function ExerciseRenderer({
  exo,
  disabled,
  isCorrect,
  onSubmit,
  onSkip,
}: {
  exo: SanitizedExo;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
}) {
  // Existing components expect payloads with the answer fields; we pass the
  // sanitized payload as-is. They render UI without the answer, which is fine
  // because verification now happens server-side via mutation.
  switch (exo.type) {
    case "qcm":
      return (
        <QcmExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    case "short-answer":
      return (
        <ShortAnswerExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    case "match":
      return (
        <MatchExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    case "order":
      return (
        <OrderExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    case "drag-drop":
      return (
        <DragDropExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    default:
      return <p>Type d&apos;exercice non supporté</p>;
  }
}
