"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Clock,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Flame,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Pio } from "@/components/student/pio";
import { SoundOptInDialog } from "@/components/student/sound-opt-in-dialog";
import { LevelUpOverlay } from "@/components/student/level-up-overlay";
import { BadgeShield } from "@/components/student/badge-icon";
import {
  hasOptInBeenAsked,
  playBadge,
  preloadAll,
  setSoundEnabledLocal,
} from "@/lib/sounds";

type UnseenBadge = {
  _id: Id<"earnedBadges">;
  badgeId: Id<"badges">;
  earnedAt: number;
  badge: {
    _id: Id<"badges">;
    name: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    criteriaText: string;
  };
};

interface SessionStats {
  correctCount: number;
  totalCount: number;
  totalTimeMs: number;
  totalHintsUsed: number;
}

function readSessionStats(id: string): SessionStats | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(`session_stats_${id}`);
    return stored ? (JSON.parse(stored) as SessionStats) : null;
  } catch {
    return null;
  }
}

export default function TopicCompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // Lazy-init from sessionStorage avoids the cascading render the previous
  // useEffect+setState pattern would trigger (lint react-hooks/set-state-in-effect).
  const [stats] = useState<SessionStats | null>(() => readSessionStats(id));
  const myStats = useQuery(api.students.getMyStats);
  const markBadgesSeen = useMutation(api.badges.markBadgesSeen);
  const markLevelSeen = useMutation(api.students.markLevelSeen);

  // D25 — Snapshot unseen badges at first render so the celebration card
  // stays visible even after `markBadgesSeen` invalidates the subscription
  // and the server reports an empty `unseenBadges` array on the next tick.
  // The eslint disable below is intentional: this is a one-shot "capture
  // first arrival" pattern, gated so the setter only fires once per mount —
  // not a render cycle. The single extra render is the cost of avoiding a
  // ref-access-during-render which has its own (worse) lint pushback.
  const [snapshotBadges, setSnapshotBadges] = useState<UnseenBadge[] | null>(
    null,
  );
  // D20 — Defer the opt-in dialog open state until after the hero animation
  // (~1.4s) so the kid sees the celebration first, then the consent question.
  const [showOptInDialog, setShowOptInDialog] = useState(false);

  // D2b/D24 — Snapshot the unseen level-up at first arrival so the overlay
  // stays open even after `markLevelSeen` invalidates `getMyStats` and the
  // server reports `unseenLevelUp = null` on the next tick.
  const [levelUpToShow, setLevelUpToShow] = useState<number | null>(null);
  const [showLevelUpOverlay, setShowLevelUpOverlay] = useState(false);

  // Sync local sound memo with server preference whenever stats arrive (D29).
  useEffect(() => {
    if (myStats?.soundEnabled !== undefined) {
      setSoundEnabledLocal(myStats.soundEnabled === true);
    }
    if (myStats?.soundEnabled === true) {
      void preloadAll();
    }
  }, [myStats?.soundEnabled]);

  // D25 — Capture snapshot + side effects in one effect. Gating on
  // `snapshotBadges === null` ensures this runs exactly once per mount.
  useEffect(() => {
    if (!myStats) return;
    if (snapshotBadges !== null) return;
    if (myStats.unseenBadges.length === 0) return;

    const badges = myStats.unseenBadges as UnseenBadge[];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshotBadges(badges);
    const timer = setTimeout(() => {
      void playBadge();
    }, 800);
    void markBadgesSeen({ badgeIds: badges.map((b) => b.badgeId) });
    return () => clearTimeout(timer);
  }, [myStats, snapshotBadges, markBadgesSeen]);

  // D20 — Schedule the opt-in dialog after the hero, only if the kid has
  // never been asked. Per-userId localStorage flag (D21) prevents re-prompt.
  useEffect(() => {
    if (!myStats) return;
    if (myStats.soundOptInDecided) return; // Server already has a decision.
    const userId = myStats.student._id as string;
    if (hasOptInBeenAsked(userId)) return;
    const timer = setTimeout(() => setShowOptInDialog(true), 1400);
    return () => clearTimeout(timer);
  }, [myStats]);

  // D2b/D24 — Capture level-up snapshot once + show overlay after badge
  // celebration (which uses ~800ms timer). Sequencing keeps the kid's joy
  // moments distinct: badge → then level-up — not stacked.
  useEffect(() => {
    if (!myStats) return;
    if (levelUpToShow !== null) return;
    if (!myStats.unseenLevelUp) return;
    const newLevel = myStats.unseenLevelUp.level;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevelUpToShow(newLevel);
    // Sequence: if there are unseen badges too, give them ~2s to celebrate
    // first; otherwise show level-up immediately after the hero.
    const hasBadges = myStats.unseenBadges.length > 0;
    const delay = hasBadges ? 2200 : 1400;
    const timer = setTimeout(() => setShowLevelUpOverlay(true), delay);
    return () => clearTimeout(timer);
  }, [myStats, levelUpToShow]);

  const handleLevelUpDismiss = () => {
    setShowLevelUpOverlay(false);
    if (levelUpToShow !== null) {
      void markLevelSeen({ level: levelUpToShow });
    }
  };

  // D12-friendly confetti — guard with prefers-reduced-motion check.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    import("canvas-confetti").then((mod) => {
      const fire = (opts: object) =>
        mod.default({
          ...opts,
          colors: ["#f97316", "#ec4899", "#8b5cf6", "#22c55e", "#eab308"],
        });

      fire({ particleCount: 80, spread: 100, origin: { x: 0.3, y: 0.6 } });
      setTimeout(() => {
        fire({ particleCount: 80, spread: 100, origin: { x: 0.7, y: 0.6 } });
      }, 300);
      setTimeout(() => {
        fire({ particleCount: 50, spread: 120, origin: { x: 0.5, y: 0.4 } });
      }, 600);
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <Pio state="cheer" size={120} />
        <h1 className="font-display text-3xl font-extrabold text-gray-900">
          Bravo !
        </h1>
        <p className="text-gray-500">Session terminée.</p>
        <Link
          href="/student/home"
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const percentage =
    stats.totalCount > 0
      ? Math.round((stats.correctCount / stats.totalCount) * 100)
      : 0;

  const starCount = percentage > 90 ? 3 : percentage > 60 ? 2 : 1;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // D7 — celebrate streak update if active.
  const showStreak =
    myStats?.streaksEnabled === true && (myStats.currentStreak ?? 0) > 0;

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      {/* Hero with Pio cheering */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 p-6 text-center text-white shadow-xl sm:p-8"
      >
        <div className="mx-auto mb-2 flex justify-center">
          <Pio state="cheer" size={104} className="drop-shadow-lg" />
        </div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
          Félicitations !
        </h1>
        <p className="mt-1 text-base opacity-95 sm:text-xl">
          Tu as terminé cette thématique
        </p>
      </motion.div>

      {/* Stars */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 200 }}
          >
            <Star
              className={`h-14 w-14 transition-all duration-500 ${
                i <= starCount
                  ? "scale-110 fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
              aria-hidden
            />
          </motion.div>
        ))}
      </div>

      {/* Score */}
      <div className="text-center">
        <p className="font-display text-5xl font-extrabold text-gray-900">
          {percentage}%
        </p>
        <p className="text-lg font-semibold text-gray-500">
          {stats.correctCount} / {stats.totalCount} bonnes réponses
        </p>
      </div>

      {/* D7 — streak update banner (kid-friendly, no shame) */}
      {showStreak && myStats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="flex items-center gap-3 rounded-2xl border-2 border-orange-200 bg-orange-50 p-4"
        >
          <Flame
            className="h-8 w-8 fill-orange-500 text-orange-500"
            aria-hidden
          />
          <div>
            <p className="font-display text-base font-bold text-orange-900">
              {myStats.currentStreak} jour
              {myStats.currentStreak > 1 ? "s" : ""} de série !
            </p>
            <p className="text-xs text-orange-700">
              Reviens demain pour continuer.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
          <Clock className="mx-auto mb-2 h-8 w-8 text-blue-500" aria-hidden />
          <p className="font-display text-2xl font-extrabold text-blue-900">
            {formatTime(stats.totalTimeMs)}
          </p>
          <p className="text-sm font-semibold text-blue-600">Temps total</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
          <Lightbulb
            className="mx-auto mb-2 h-8 w-8 text-amber-500"
            aria-hidden
          />
          <p className="font-display text-2xl font-extrabold text-amber-900">
            {stats.totalHintsUsed}
          </p>
          <p className="text-sm font-semibold text-amber-600">
            Indice{stats.totalHintsUsed !== 1 ? "s" : ""} utilisé
            {stats.totalHintsUsed !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* D25 — Newly-unlocked badge card. Replaces the old placeholder.
          Only renders if the kid actually unlocked something — otherwise
          the section is hidden (no "Continue pour obtenir des badges"
          consolation copy that would just be noise). */}
      {snapshotBadges && snapshotBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5, type: "spring", stiffness: 180 }}
          className="rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <BadgeShield
                iconName={snapshotBadges[0].badge.icon}
                badgeName={snapshotBadges[0].badge.name}
                tier={snapshotBadges[0].badge.rarity}
                locked={false}
                size={80}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-extrabold uppercase tracking-wider text-purple-700">
                Nouveau badge !
              </p>
              <p className="truncate font-display text-lg font-bold text-purple-900">
                {snapshotBadges[0].badge.name}
              </p>
              <p className="text-xs text-purple-700">
                {snapshotBadges[0].badge.description}
              </p>
            </div>
          </div>
          {snapshotBadges.length > 1 && (
            <p className="mt-3 text-center text-xs font-semibold text-purple-700">
              + {snapshotBadges.length - 1} autre
              {snapshotBadges.length > 2 ? "s" : ""} badge
              {snapshotBadges.length > 2 ? "s" : ""} dans ton coffre
            </p>
          )}
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <Link
          href={`/student/topics/${id}/session`}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 text-lg font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
        >
          <RotateCcw className="h-5 w-5" aria-hidden />
          Revoir mes erreurs
        </Link>
        <Link
          href="/student/home"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl"
        >
          Thématique suivante
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>

      {/* D20 — Sound opt-in dialog, deferred after hero animation */}
      {myStats && (
        <SoundOptInDialog
          userId={myStats.student._id as string}
          open={showOptInDialog}
          onOpenChange={setShowOptInDialog}
        />
      )}

      {/* D2b/D24 — Level-up celebration overlay */}
      {levelUpToShow !== null && (
        <LevelUpOverlay
          level={levelUpToShow}
          open={showLevelUpOverlay}
          onDismiss={handleLevelUpDismiss}
        />
      )}
    </div>
  );
}
