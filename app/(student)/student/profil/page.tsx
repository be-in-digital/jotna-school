"use client";

import {
  Loader2,
  BookCheck,
  Award,
  Clock,
  Star,
  Heart,
  UserCircle,
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setSoundEnabledLocal } from "@/lib/sounds";

const EXOS_PER_LEVEL_UI = 50; // Mirrors students.EXOS_PER_LEVEL.

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0min";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export default function StudentProfilePage() {
  const stats = useQuery(api.students.getMyStats);
  const setSoundEnabledMut = useMutation(api.streak.setSoundEnabled);

  const handleToggleSound = async () => {
    if (!stats) return;
    const next = !stats.soundEnabled;
    setSoundEnabledLocal(next);
    try {
      await setSoundEnabledMut({ enabled: next });
    } catch {
      // Mutation queues offline; UI reflects optimistic state via memo + Convex.
    }
  };

  if (stats === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement du profil...</span>
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <UserCircle className="mb-4 h-16 w-16 opacity-20" aria-hidden />
        <p>Profil non trouvé. Veuillez vous reconnecter.</p>
      </div>
    );
  }

  const initials = stats.student.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Anneau de progression XP (D3b) — pourcentage rempli avant prochain niveau.
  const xpInLevel =
    EXOS_PER_LEVEL_UI - (stats.exosToNextLevel ?? EXOS_PER_LEVEL_UI);
  const xpProgress = Math.max(
    0,
    Math.min(100, (xpInLevel / EXOS_PER_LEVEL_UI) * 100),
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Avatar + level ring */}
      <div className="mb-8 flex flex-col items-center">
        <LevelRing progressPct={xpProgress}>
          {stats.student.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stats.student.avatar}
              alt={stats.student.name}
              className="h-24 w-24 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-3xl font-bold text-white shadow-lg">
              {initials}
            </div>
          )}
        </LevelRing>

        {/* Level badge */}
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-sm font-extrabold text-white shadow">
          <Star className="h-4 w-4 fill-white" aria-hidden />
          Niveau {stats.level ?? 1}
        </span>

        <h1 className="font-display mt-3 text-2xl font-extrabold text-gray-900">
          {stats.student.name}
        </h1>

        {(stats.exosToNextLevel ?? 0) > 0 && (
          <p className="mt-1 text-xs font-medium text-gray-500">
            {stats.exosToNextLevel} bonne
            {(stats.exosToNextLevel ?? 0) > 1 ? "s" : ""} réponse
            {(stats.exosToNextLevel ?? 0) > 1 ? "s" : ""} avant le niveau{" "}
            {(stats.level ?? 1) + 1}
          </p>
        )}
      </div>

      {/* Stats grid — 2x2 on mobile, kept simple */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          icon={<Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />}
          label="Étoiles gagnées"
          value={(stats.totalStars ?? 0).toString()}
        />
        <StatCard
          icon={<BookCheck className="h-5 w-5 text-green-500" />}
          label="Exercices"
          value={(stats.totalExercises ?? 0).toString()}
        />
        <StatCard
          icon={<Award className="h-5 w-5 text-purple-500" />}
          label="Badges"
          value={(stats.badgeCount ?? 0).toString()}
        />
        {stats.streaksEnabled ? (
          <StatCard
            icon={<Flame className="h-5 w-5 fill-orange-500 text-orange-500" />}
            label={`Série${(stats.longestStreak ?? 0) > 0 ? ` (record ${stats.longestStreak})` : ""}`}
            value={`${stats.currentStreak ?? 0} j`}
          />
        ) : (
          <StatCard
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            label="Temps total"
            value={formatDuration(stats.totalTimeMs ?? 0)}
          />
        )}
      </div>

      {/* Favorite subject */}
      {stats.favoriteSubject && (
        <div className="mb-8 rounded-2xl border-2 border-pink-200 bg-pink-50 p-5">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-pink-500" aria-hidden />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Matière préférée
              </p>
              <p className="font-display text-lg font-bold text-gray-900">
                {stats.favoriteSubject}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* D6/D22 — Sound preference toggle (kid-friendly, no jargon) */}
      <div className="mb-8 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {stats.soundEnabled ? (
              <Volume2
                className="h-6 w-6 text-orange-600"
                aria-hidden
              />
            ) : (
              <VolumeX className="h-6 w-6 text-gray-500" aria-hidden />
            )}
            <div>
              <p className="font-display text-base font-bold text-gray-900">
                Sons
              </p>
              <p className="text-xs text-gray-600">
                Petit son joyeux quand tu réussis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleSound}
            role="switch"
            aria-checked={stats.soundEnabled}
            aria-label={stats.soundEnabled ? "Couper les sons" : "Activer les sons"}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${
              stats.soundEnabled ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                stats.soundEnabled ? "translate-x-7" : "translate-x-1"
              }`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {/* Recent badges (kept) */}
      <div>
        <h2 className="font-display mb-4 text-lg font-bold text-gray-900">
          Derniers badges
        </h2>
        {stats.recentBadges.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun badge obtenu pour le moment. Continue tes exercices !
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {stats.recentBadges.map((eb) => (
              <div
                key={eb._id}
                className="flex flex-col items-center rounded-2xl border-2 border-yellow-200 bg-gradient-to-b from-yellow-50 to-orange-50 p-4 text-center"
              >
                <span className="text-3xl">{eb.badge.icon}</span>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {eb.badge.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(eb.earnedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LevelRing({
  children,
  progressPct,
  size = 120,
  stroke = 6,
}: {
  children: React.ReactNode;
  progressPct: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (progressPct / 100) * circumference;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fef3c7"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#level-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-[stroke-dasharray] duration-700"
        />
        <defs>
          <linearGradient id="level-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
