"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScrollText, Star, Check } from "lucide-react";
import { motion } from "framer-motion";
import { GamePanel } from "@/components/student/game/game-panel";
import { kidMessages } from "@/lib/kidCopy";
import { play } from "@/lib/sounds";

/**
 * Redesign Gaming G7 — the daily quest board on the hub.
 * - ensureDaily fires once on mount (idempotent, deterministic server-side).
 * - Hidden entirely when a parent disabled daily missions (G10) — the hub
 *   simply doesn't mention missions rather than showing a "disabled" state.
 * - Completion celebration: small confetti burst + badge sound, both gated
 *   (reduced-motion / sound opt-in respected by lib/sounds).
 */

function celebrate() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  // Dynamic import keeps canvas-confetti out of the initial bundle (G5).
  void import("canvas-confetti").then((m) =>
    m.default({
      particleCount: 50,
      spread: 75,
      origin: { y: 0.7 },
      colors: ["#f97316", "#fbbf24", "#84cc16", "#38bdf8"],
    }),
  );
}

export function QuestBoard() {
  const daily = useQuery(api.quests.getMyDaily);
  const ensureDaily = useMutation(api.quests.ensureDaily);

  useEffect(() => {
    // Swallow failures: a quest hiccup must never break the hub — the board
    // just stays in its skeleton state and heals on the next visit.
    ensureDaily({}).catch(() => {});
  }, [ensureDaily]);

  // Celebrate transitions: completed count going up while mounted.
  const prevCompleted = useRef<number | null>(null);
  const completedCount =
    daily?.enabled && daily.quests
      ? daily.quests.filter((q) => q.completedAt).length
      : null;
  useEffect(() => {
    if (completedCount === null) return;
    if (
      prevCompleted.current !== null &&
      completedCount > prevCompleted.current
    ) {
      celebrate();
      void play("badge");
    }
    prevCompleted.current = completedCount;
  }, [completedCount]);

  // Parent-disabled (G10) or non-student (query returned null): no board.
  if (daily === null || (daily && !daily.enabled)) return null;

  const quests = daily?.enabled ? daily.quests : null;
  const allDone = Boolean(daily?.enabled && daily.allCompletedAt);

  return (
    <GamePanel variant="board" className="overflow-hidden">
      {/* wood header — CSS only (G4b) */}
      <div className="flex items-center gap-2.5 border-b-2 border-amber-800 bg-gradient-to-b from-amber-600 to-amber-700 px-5 py-3">
        <ScrollText className="h-5 w-5 text-amber-100" aria-hidden />
        <h2 className="font-game text-lg font-bold text-amber-50">
          {kidMessages.questBoard.title}
        </h2>
      </div>

      <ul className="divide-y divide-amber-100 px-4 py-1">
        {quests === null || quests === undefined ? (
          <QuestSkeleton />
        ) : (
          quests.map((quest) => <QuestRow key={quest.key} quest={quest} />)
        )}
      </ul>

      {allDone && (
        <p className="border-t-2 border-amber-100 bg-lime-50 px-5 py-3 text-center font-game text-sm font-semibold text-lime-700">
          {kidMessages.questBoard.allDone}
        </p>
      )}
    </GamePanel>
  );
}

function QuestRow({
  quest,
}: {
  quest: {
    key: string;
    label: string;
    target: number;
    progress: number;
    reward: number;
    completedAt?: number;
  };
}) {
  const done = quest.completedAt !== undefined;
  return (
    <li className="flex min-h-14 items-center gap-3 py-2.5">
      <ProgressRing
        progress={quest.progress}
        target={quest.target}
        done={done}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-game text-base font-semibold ${
            done ? "text-lime-700" : "text-amber-950"
          }`}
        >
          {quest.label}
        </p>
        <p className="text-sm text-amber-900/60">
          {done ? "Mission accomplie !" : `${quest.progress} / ${quest.target}`}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border-2 px-2.5 py-1 font-game text-sm font-bold ${
          done
            ? "border-lime-200 bg-lime-100 text-lime-700"
            : "border-yellow-200 bg-yellow-50 text-yellow-800"
        }`}
        aria-label={`Récompense : ${quest.reward} étoile${quest.reward > 1 ? "s" : ""}`}
      >
        +{quest.reward}
        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" aria-hidden />
      </span>
    </li>
  );
}

/** SVG progress ring — no lib, ~free. Turns into a check disc when done. */
function ProgressRing({
  progress,
  target,
  done,
}: {
  progress: number;
  target: number;
  done: boolean;
}) {
  const R = 15;
  const C = 2 * Math.PI * R;
  const ratio = target > 0 ? Math.min(1, progress / target) : 0;

  if (done) {
    return (
      <motion.span
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-500 shadow-md shadow-lime-200"
      >
        <Check className="h-5 w-5 text-white" strokeWidth={3.5} aria-hidden />
      </motion.span>
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      className="h-10 w-10 shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r={R}
        fill="none"
        stroke="#fde68a"
        strokeWidth="5"
      />
      <circle
        cx="20"
        cy="20"
        r={R}
        fill="none"
        stroke="#f97316"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - ratio)}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

function QuestSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex min-h-14 items-center gap-3 py-2.5">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-amber-100" />
          <div className="flex-1 space-y-2">
            <span className="block h-4 w-2/3 animate-pulse rounded-full bg-amber-100" />
            <span className="block h-3 w-1/4 animate-pulse rounded-full bg-amber-50" />
          </div>
        </li>
      ))}
    </>
  );
}
