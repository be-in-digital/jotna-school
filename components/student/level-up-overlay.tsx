"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Pio } from "@/components/student/pio";
import { playLevelUp, preloadAll } from "@/lib/sounds";

type LottieProps = {
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
};

/**
 * D2b/D24 — Full-screen level-up celebration overlay.
 *
 *   D2b — One Lottie allowed in Phase B: this animation. Loaded dynamically
 *         (next/dynamic, ssr:false) so the lottie-react bundle (~50 kb gzip)
 *         + JSON (~25 kb) is fetched only when the overlay actually mounts.
 *   D24 — The level-up sound plays alongside the visible overlay so the audio
 *         always has a synchronized visual counterpart (WCAG 1.3.3).
 *   D12 — `prefers-reduced-motion` is honored implicitly via the parent
 *         <MotionConfig reducedMotion="user"> in (student)/layout.tsx — the
 *         framer transitions degrade to instant fades.
 *
 * Lifecycle:
 *   - mount → preloadAll (in case sound module wasn't warmed yet)
 *   - 200ms after mount → playLevelUp()
 *   - 4s after mount → auto-dismiss (parent calls markLevelSeen on close)
 *   - kid can also tap "Continuer" or backdrop to dismiss early
 */

// Dynamic import keeps lottie-react out of the initial bundle. ssr:false
// because Lottie touches the DOM and there's no point pre-rendering a JSON
// animation for a transient celebration overlay.
const Lottie = dynamic(
  () => import("lottie-react").then((m) => m.default),
  { ssr: false },
) as ComponentType<LottieProps>;

const AUTO_DISMISS_MS = 4000;
const SOUND_DELAY_MS = 200;

export function LevelUpOverlay({
  level,
  open,
  onDismiss,
}: {
  level: number;
  open: boolean;
  onDismiss: () => void;
}) {
  const [animationData, setAnimationData] = useState<unknown | null>(null);

  // Lazy-fetch the Lottie JSON only when the overlay actually opens.
  useEffect(() => {
    if (!open) return;
    if (animationData !== null) return;
    let cancelled = false;
    fetch("/lotties/level-up.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        // Network/offline — degrade gracefully to the framer-only celebration.
      });
    return () => {
      cancelled = true;
    };
  }, [open, animationData]);

  // Play sound + auto-dismiss timer when opened.
  useEffect(() => {
    if (!open) return;
    void preloadAll();
    const soundTimer = setTimeout(() => void playLevelUp(), SOUND_DELAY_MS);
    const dismissTimer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(soundTimer);
      clearTimeout(dismissTimer);
    };
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="level-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/80 via-pink-900/80 to-orange-900/80 p-4 backdrop-blur-sm"
          onClick={onDismiss}
          role="dialog"
          aria-label={`Tu passes au niveau ${level}`}
        >
          <motion.div
            initial={{ scale: 0.7, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 10 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lottie animation container — fixed size to avoid layout thrash. */}
            <div className="relative h-40 w-40">
              {animationData !== null ? (
                <Lottie
                  animationData={animationData}
                  loop={false}
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                /* Framer-only fallback Pio when Lottie hasn't loaded yet. */
                <div className="flex h-full items-center justify-center">
                  <Pio state="cheer" size={120} />
                </div>
              )}
              {/* Accent sparkles always visible regardless of Lottie state */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 220 }}
                className="absolute -top-2 -right-2 text-amber-400"
              >
                <Sparkles className="h-7 w-7 fill-amber-300" aria-hidden />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 220 }}
                className="absolute -bottom-1 -left-3 text-pink-400"
              >
                <Sparkles className="h-6 w-6 fill-pink-300" aria-hidden />
              </motion.div>
            </div>

            <div className="space-y-1">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-orange-600">
                Bravo !
              </p>
              <h2 className="font-display text-4xl font-extrabold text-gray-900">
                Niveau {level}
              </h2>
              <p className="text-base font-semibold text-gray-600">
                Tu progresses super bien
              </p>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="mt-2 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
            >
              Continuer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
