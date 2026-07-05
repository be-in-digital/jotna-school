"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pio, type PioState } from "@/components/student/pio";
import { useDeviceTier } from "@/hooks/use-device-tier";

// ---------------------------------------------------------------------------
// Pio buddy — a small companion in the corner of the focus session that
// reacts to what the kid does. It NEVER blocks input (pointer-events-none) and
// never covers the answer controls. The body stays grounded (G-decision): on
// weak devices / reduced-motion the pose still swaps, only the bounce is cut.
// ---------------------------------------------------------------------------

export type BuddyMood = "solving" | "correct" | "wrong";

const MOOD_POSE: Record<BuddyMood, PioState> = {
  solving: "think",
  correct: "cheer",
  wrong: "encourage",
};

const MOOD_BUBBLE: Partial<Record<BuddyMood, string>> = {
  wrong: "On réessaie !",
};

export function SessionPioBuddy({
  mood,
  reactKey,
  bubble,
}: {
  mood: BuddyMood;
  /** Bump to replay the reaction even when the mood string is unchanged. */
  reactKey: number;
  /** Optional speech line (combo milestones); falls back to the mood bubble. */
  bubble?: string | null;
}) {
  const tier = useDeviceTier();
  const reduce = useReducedMotion();
  const animate = tier === "full" && !reduce;

  const text = bubble ?? MOOD_BUBBLE[mood] ?? null;

  // Grounded reaction: a small hop for a correct answer, a tiny slump for a
  // wrong one — scaled from the feet so Pio never floats.
  const hop =
    mood === "correct"
      ? { y: [0, -18, 0], scaleY: [1, 1.06, 1] }
      : mood === "wrong"
        ? { y: [0, 3, 0], scaleY: [1, 0.97, 1] }
        : { y: 0, scaleY: 1 };

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-2 z-30 flex items-end gap-2 sm:bottom-8 sm:left-6"
      aria-hidden
    >
      <motion.div
        key={reactKey}
        initial={false}
        animate={animate ? hop : undefined}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "bottom center" }}
      >
        <Pio state={MOOD_POSE[mood]} size={76} />
      </motion.div>

      <AnimatePresence>
        {text && (
          <motion.div
            key={`${text}-${reactKey}`}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-8 max-w-[9rem] rounded-2xl rounded-bl-sm border-2 border-amber-200 bg-white px-3 py-1.5 font-game text-xs font-bold text-amber-900 shadow-md"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combo badge — pops in above the exercise when the kid chains correct
// answers. Escalating label makes a streak feel earned.
// ---------------------------------------------------------------------------

function comboLabel(combo: number): string {
  if (combo >= 7) return `Inarrêtable ! x${combo}`;
  if (combo >= 4) return `En feu ! x${combo}`;
  return `Combo x${combo}`;
}

export function ComboBadge({ combo }: { combo: number }) {
  const reduce = useReducedMotion();
  const show = combo >= 2;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-3 z-40 -translate-x-1/2"
      aria-hidden
    >
      <AnimatePresence mode="popLayout">
        {show && (
          <motion.div
            key={combo}
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: -14, scale: 0.7, rotate: -4 }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1, rotate: 0 }
            }
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            className="flex items-center gap-1.5 rounded-full border-2 border-orange-300 border-b-4 bg-gradient-to-b from-amber-400 to-orange-500 px-4 py-1.5 font-game text-sm font-extrabold text-white shadow-lg"
          >
            <span aria-hidden>🔥</span>
            {comboLabel(combo)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reward burst — a spray of stars on a correct answer. Purely decorative, so
// it self-disables on reduced-motion and lite devices.
// ---------------------------------------------------------------------------

const BURST_COLORS = ["#f59e0b", "#fb923c", "#84cc16", "#38bdf8", "#facc15"];

export function RewardBurst({ triggerKey }: { triggerKey: number }) {
  const tier = useDeviceTier();
  const reduce = useReducedMotion();

  // Deterministic angles/distances derived from the trigger, so no
  // Math.random (stable across renders of the same burst).
  const particles = useMemo(() => {
    const n = 10;
    return Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n + (triggerKey % 5) * 0.3;
      const dist = 90 + ((i * 37 + triggerKey * 13) % 70);
      return {
        id: `${triggerKey}-${i}`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 40, // bias upward
        color: BURST_COLORS[i % BURST_COLORS.length],
        rotate: (i * 57) % 360,
      };
    });
  }, [triggerKey]);

  if (tier !== "full" || reduce || triggerKey === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
      aria-hidden
    >
      <div className="relative -translate-y-10">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.4 }}
              animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.1, rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="absolute h-3 w-3 rounded-[3px]"
              style={{ background: p.color }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
