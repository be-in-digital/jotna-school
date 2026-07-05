"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Pause, Play, RotateCcw, X } from "lucide-react";
import { Pio } from "@/components/student/pio";
import { speak, stopSpeaking } from "@/lib/tts";
import { buildBeats, type AudioSegment, type Explanation } from "@/lib/explainBeats";

type Status =
  | { kind: "loading" }
  | {
      kind: "ready";
      explanation: Explanation;
      audio: AudioSegment[] | null;
      videoUrl: string | null;
    }
  | { kind: "error"; kidMessage: string };

/**
 * "Pio t'explique" — a narrated, animated explainer that plays like a little
 * video: Pio speaks each beat with his voice (pre-synthesised TTS, or the
 * browser voice as fallback), changes pose, and the matching line is
 * highlighted. Two entry points open it:
 *   - variant="stuck"  → after 5 failed attempts ("Je veux comprendre")
 *   - variant="review" → after a correct answer ("Pio m'explique")
 *
 * Parent must pass a stable `key={exerciseId}` so the component fully remounts
 * (and playback resets) when the kid moves to another exercise.
 */
export function ExplainStepByStep({
  exerciseId,
  open,
  onClose,
  variant = "stuck",
}: {
  exerciseId: Id<"exercises">;
  open: boolean;
  onClose: () => void;
  variant?: "stuck" | "review";
}) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const explainExercise = useAction(api.explainMistake.explainExercise);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    explainExercise({ exerciseId })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setStatus({
            kind: "ready",
            explanation: res.explanation,
            audio: res.audioSegments,
            videoUrl: res.videoUrl,
          });
        } else {
          setStatus({ kind: "error", kidMessage: res.kidMessage });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({
          kind: "error",
          kidMessage:
            "Une connexion lente, peut-être ? Réessaie dans un instant.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [open, exerciseId, explainExercise]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="explain-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-amber-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-label="Pio t'explique"
        >
          <motion.div
            initial={{ y: 40, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="overflow-y-auto px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
              {status.kind === "loading" && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <Pio state="think" size={88} />
                  <div className="flex items-center gap-2 font-game text-base font-semibold text-amber-950">
                    <Loader2
                      className="h-4 w-4 animate-spin text-orange-500"
                      aria-hidden
                    />
                    Pio prépare son explication…
                  </div>
                  <p className="max-w-xs text-sm text-amber-900/60">
                    Ça prend quelques secondes.
                  </p>
                </div>
              )}

              {status.kind === "error" && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <Pio state="sad" size={88} />
                  <p className="font-game text-base font-semibold text-amber-950">
                    {status.kidMessage}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 inline-flex min-h-12 items-center justify-center rounded-2xl border-b-4 border-amber-300 bg-amber-100 px-6 py-3 font-game text-base font-bold text-amber-900 transition-all duration-100 hover:bg-amber-200 active:translate-y-[2px] active:border-b-2"
                  >
                    Tant pis, je passe
                  </button>
                </div>
              )}

              {status.kind === "ready" &&
                (status.videoUrl ? (
                  <VideoExplainPlayer
                    explanation={status.explanation}
                    videoUrl={status.videoUrl}
                    variant={variant}
                    onClose={onClose}
                  />
                ) : (
                  <ExplainPlayer
                    explanation={status.explanation}
                    audio={status.audio}
                    variant={variant}
                    onClose={onClose}
                  />
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Real rendered video ("Pio au tableau", MP4 composed by the render worker).
 * The step list stays below the player so a kid can re-read after watching.
 */
function VideoExplainPlayer({
  explanation,
  videoUrl,
  variant,
  onClose,
}: {
  explanation: Explanation;
  videoUrl: string;
  variant: "stuck" | "review";
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border-2 border-amber-200 bg-amber-950 shadow-md">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="aspect-video w-full"
          aria-label="Vidéo : Pio t'explique"
        />
      </div>

      <ol className="space-y-2">
        {explanation.steps.map((step, idx) => (
          <li
            key={idx}
            className="flex gap-3 rounded-2xl border-2 border-amber-100 bg-amber-50/60 p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-400 font-game text-sm font-bold text-white shadow">
              {idx + 1}
            </span>
            <p className="flex-1 self-center text-left text-sm leading-snug text-amber-950/80">
              {step}
            </p>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onClose}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-orange-700 bg-orange-500 px-6 py-3 font-game text-base font-bold text-white shadow-md transition-all duration-100 hover:bg-orange-400 active:translate-y-[3px] active:border-b-0"
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        {variant === "review" ? "Super, j'ai compris !" : "J'ai compris !"}
      </button>
    </div>
  );
}

function ExplainPlayer({
  explanation,
  audio,
  variant,
  onClose,
}: {
  explanation: Explanation;
  audio: AudioSegment[] | null;
  variant: "stuck" | "review";
  onClose: () => void;
}) {
  const beats = useMemo(
    () => buildBeats(explanation, audio, variant),
    [explanation, audio, variant],
  );

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  // Kept in a ref so the <audio> `onended` handler never reads a stale index.
  const currentRef = useRef(0);
  // Indirection ref so `advance` can call the latest `playBeat` without a
  // self-reference (which the React lint forbids) or stale closure.
  const playBeatRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const stopAll = useCallback(() => {
    const el = audioElRef.current;
    if (el) {
      el.onended = null;
      el.pause();
    }
    stopSpeaking();
  }, []);

  const playBeat = useCallback(
    (index: number) => {
      if (index < 0 || index >= beats.length) return;
      stopAll();
      setCurrent(index);
      setFinished(false);
      setPlaying(true);
      currentRef.current = index;

      const advance = () => {
        const next = currentRef.current + 1;
        if (next < beats.length) {
          playBeatRef.current(next);
        } else {
          setPlaying(false);
          setFinished(true);
        }
      };

      const beat = beats[index];
      if (beat.audioUrl && audioElRef.current) {
        const el = audioElRef.current;
        el.src = beat.audioUrl;
        el.onended = advance;
        el.play().catch(() => {
          // Autoplay blocked (e.g. iOS after async load) — wait for a tap.
          setPlaying(false);
        });
      } else {
        speak(beat.text, { onend: advance });
      }
    },
    [beats, stopAll],
  );

  useEffect(() => {
    playBeatRef.current = playBeat;
  }, [playBeat]);

  // Auto-start the "video" once, on mount.
  useEffect(() => {
    audioElRef.current = new Audio();
    playBeatRef.current(0);
    const stop = stopAll;
    return () => {
      stop();
      audioElRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) {
      stopAll();
      setPlaying(false);
    } else {
      playBeat(finished ? 0 : current);
    }
  }, [playing, finished, current, playBeat, stopAll]);

  const replay = useCallback(() => playBeat(0), [playBeat]);

  const activeBeat = beats[current];

  return (
    <div className="space-y-5">
      {/* Stage — Pio + the line he's saying right now (the "video" frame). */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 px-4 pb-4 pt-5">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 shadow-sm">
            <Play className="h-3 w-3 fill-amber-600 text-amber-600" aria-hidden />
            Pio t&apos;explique
          </span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBeat.pose + current}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <Pio state={activeBeat.pose} size={104} />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={current}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-h-[3.5rem] max-w-sm text-center font-game text-base font-semibold leading-snug text-amber-950"
            >
              {activeBeat.stepNumber !== null && (
                <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 align-middle text-xs font-bold text-white">
                  {activeBeat.stepNumber}
                </span>
              )}
              {activeBeat.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots — one per beat. */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {beats.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à l'étape ${i + 1}`}
              onClick={() => playBeat(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-orange-500"
                  : i < current
                    ? "w-2 bg-amber-400"
                    : "w-2 bg-amber-200"
              }`}
            />
          ))}
        </div>

        {/* Transport controls. */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={replay}
            aria-label="Revoir depuis le début"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200 bg-white text-amber-700 shadow-sm transition-all hover:bg-amber-50 active:translate-y-[1px]"
          >
            <RotateCcw className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Écouter"}
            className="flex h-14 w-14 items-center justify-center rounded-full border-b-4 border-orange-700 bg-orange-500 text-white shadow-md transition-all hover:bg-orange-400 active:translate-y-[2px] active:border-b-2"
          >
            {playing ? (
              <Pause className="h-6 w-6 fill-white" aria-hidden />
            ) : (
              <Play className="h-6 w-6 fill-white" aria-hidden />
            )}
          </button>
          {/* Spacer to keep the play button centred. */}
          <span className="h-11 w-11" aria-hidden />
        </div>
      </div>

      {/* Full script — every beat listed, the current one highlighted, so a
          kid can read along or re-check a step after the narration. */}
      <ol className="space-y-2">
        {beats
          .filter((b) => b.role === "step")
          .map((beat) => {
            const beatIndex = beats.indexOf(beat);
            const isActive = beatIndex === current;
            return (
              <li
                key={beat.stepNumber}
                className={`flex gap-3 rounded-2xl border-2 p-3 transition-colors ${
                  isActive
                    ? "border-orange-300 bg-orange-50"
                    : "border-amber-100 bg-amber-50/60"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-game text-sm font-bold text-white shadow ${
                    isActive
                      ? "bg-gradient-to-br from-orange-500 to-amber-500"
                      : "bg-gradient-to-br from-amber-400 to-orange-400"
                  }`}
                >
                  {beat.stepNumber}
                </span>
                <button
                  type="button"
                  onClick={() => playBeat(beatIndex)}
                  className="flex-1 self-center text-left text-sm leading-snug text-amber-950/80"
                >
                  {beat.text}
                </button>
              </li>
            );
          })}
      </ol>

      <button
        type="button"
        onClick={onClose}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-orange-700 bg-orange-500 px-6 py-3 font-game text-base font-bold text-white shadow-md transition-all duration-100 hover:bg-orange-400 active:translate-y-[3px] active:border-b-0"
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        {variant === "review" ? "Super, j'ai compris !" : "J'ai compris !"}
      </button>
    </div>
  );
}
