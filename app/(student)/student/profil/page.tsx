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
  GraduationCap,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setSoundEnabledLocal } from "@/lib/sounds";
import { Pio } from "@/components/student/pio";
import { GamePanel } from "@/components/student/game/game-panel";
import { GameLinkButton } from "@/components/student/game/game-button";

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
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-3 text-amber-900/70">Chargement du carnet…</span>
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-amber-900/60">
        <UserCircle className="mb-4 h-16 w-16 opacity-20" aria-hidden />
        <p>Profil non trouvé. Veuillez vous reconnecter.</p>
      </div>
    );
  }

  // D8 — cold start : un tout nouvel élève ne voit pas un mur de zéros.
  // On bascule sur un état d'accueil positif tant qu'il n'a rien accompli.
  const hasActivity =
    (stats.totalExercises ?? 0) > 0 ||
    (stats.totalStars ?? 0) > 0 ||
    (stats.badgeCount ?? 0) > 0 ||
    (stats.currentStreak ?? 0) > 0;

  // Anneau de progression XP (D3b) — pourcentage rempli avant prochain niveau.
  const xpInLevel =
    EXOS_PER_LEVEL_UI - (stats.exosToNextLevel ?? EXOS_PER_LEVEL_UI);
  const xpProgress = Math.max(
    0,
    Math.min(100, (xpInLevel / EXOS_PER_LEVEL_UI) * 100),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-center font-game text-sm font-bold uppercase tracking-widest text-amber-700/80">
        Carnet de l&apos;aventurier
      </p>

      {/* Hero card — Pio + level ring + name */}
      <GamePanel variant="board" className="relative overflow-hidden p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[-10%] h-48 w-48 rounded-full bg-amber-200/50 blur-3xl"
        />
        <div className="relative flex flex-col items-center">
          <LevelRing progressPct={xpProgress}>
            {stats.student.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stats.student.avatar}
                alt={stats.student.name}
                className="h-24 w-24 rounded-full object-cover shadow-lg"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-sky-100 to-amber-100 shadow-inner">
                <Pio state="hello" size={82} />
              </span>
            )}
          </LevelRing>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border-b-4 border-orange-600 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 font-game text-sm font-bold text-white shadow">
            <Star className="h-4 w-4 fill-white" aria-hidden />
            Niveau {stats.level ?? 1}
          </span>

          <h1 className="mt-3 text-center font-game text-2xl font-bold text-amber-950">
            {stats.student.name}
          </h1>

          {stats.student.class && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border-2 border-sky-200 bg-sky-50 px-3 py-0.5 font-game text-sm font-bold text-sky-700">
              <GraduationCap className="h-4 w-4" aria-hidden />
              Classe de {stats.student.class}
            </span>
          )}

          {(stats.exosToNextLevel ?? 0) > 0 && (
            <p className="mt-1 text-center text-xs font-medium text-amber-900/60">
              {stats.exosToNextLevel} bonne
              {(stats.exosToNextLevel ?? 0) > 1 ? "s" : ""} réponse
              {(stats.exosToNextLevel ?? 0) > 1 ? "s" : ""} avant le niveau{" "}
              {(stats.level ?? 1) + 1}
            </p>
          )}
        </div>
      </GamePanel>

      {/* D8 — cold start: encouraging call-to-adventure instead of zeros */}
      {!hasActivity ? (
        <GamePanel
          variant="soft"
          className="flex flex-col items-center gap-3 p-6 text-center"
        >
          <Sparkles className="h-8 w-8 text-amber-500" aria-hidden />
          <p className="font-game text-lg font-bold text-amber-950">
            Ton aventure commence !
          </p>
          <p className="max-w-sm text-sm text-amber-900/70">
            Termine ton premier niveau pour gagner tes premières étoiles et
            remplir ce carnet.
          </p>
          <GameLinkButton href="/student/map" size="lg" className="mt-1">
            Partir à l&apos;aventure
          </GameLinkButton>
        </GamePanel>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            icon={<Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />}
            label="Étoiles gagnées"
            value={(stats.totalStars ?? 0).toString()}
            accent="yellow"
          />
          <StatCard
            icon={<BookCheck className="h-5 w-5 text-emerald-600" />}
            label="Exercices"
            value={(stats.totalExercises ?? 0).toString()}
            accent="emerald"
          />
          <StatCard
            icon={<Award className="h-5 w-5 text-violet-600" />}
            label="Badges"
            value={(stats.badgeCount ?? 0).toString()}
            accent="violet"
          />
          {stats.streaksEnabled ? (
            <StatCard
              icon={
                <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
              }
              label={`Série${(stats.longestStreak ?? 0) > 0 ? ` · record ${stats.longestStreak}` : ""}`}
              value={`${stats.currentStreak ?? 0} j`}
              accent="orange"
            />
          ) : (
            <StatCard
              icon={<Clock className="h-5 w-5 text-sky-600" />}
              label="Temps total"
              value={formatDuration(stats.totalTimeMs ?? 0)}
              accent="sky"
            />
          )}
        </div>
      )}

      {/* Favorite subject */}
      {stats.favoriteSubject && (
        <GamePanel variant="soft" className="p-5">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 fill-pink-500 text-pink-500" aria-hidden />
            <div>
              <p className="text-sm font-medium text-amber-900/70">
                Matière préférée
              </p>
              <p className="font-game text-lg font-bold text-amber-950">
                {stats.favoriteSubject}
              </p>
            </div>
          </div>
        </GamePanel>
      )}

      {/* D6/D22 — Sound preference toggle */}
      <GamePanel variant="board" className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {stats.soundEnabled ? (
              <Volume2 className="h-6 w-6 text-orange-600" aria-hidden />
            ) : (
              <VolumeX className="h-6 w-6 text-gray-500" aria-hidden />
            )}
            <div>
              <p className="font-game text-base font-bold text-amber-950">
                Sons
              </p>
              <p className="text-xs text-amber-900/60">
                Petit son joyeux quand tu réussis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleSound}
            role="switch"
            aria-checked={stats.soundEnabled}
            aria-label={
              stats.soundEnabled ? "Couper les sons" : "Activer les sons"
            }
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
      </GamePanel>

      {/* Recent badges — only when the kid has some (no empty consolation box) */}
      {stats.recentBadges.length > 0 && (
        <div>
          <h2 className="mb-3 font-game text-lg font-bold text-amber-950">
            Derniers trophées
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.recentBadges.map((eb) => (
              <GamePanel
                key={eb._id}
                variant="soft"
                className="flex flex-col items-center p-4 text-center"
              >
                <span className="text-3xl">{eb.badge.icon}</span>
                <p className="mt-2 text-sm font-semibold text-amber-950">
                  {eb.badge.name}
                </p>
                <p className="mt-0.5 text-xs text-amber-900/50">
                  {new Date(eb.earnedAt).toLocaleDateString("fr-FR")}
                </p>
              </GamePanel>
            ))}
          </div>
        </div>
      )}
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
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
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
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const STAT_ACCENT: Record<string, string> = {
  yellow: "border-yellow-200",
  emerald: "border-emerald-200",
  violet: "border-violet-200",
  orange: "border-orange-200",
  sky: "border-sky-200",
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: keyof typeof STAT_ACCENT;
}) {
  return (
    <div
      className={`rounded-3xl border-2 bg-white/95 p-4 shadow-[0_4px_0_rgba(217,119,6,0.12)] ${STAT_ACCENT[accent]}`}
    >
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-amber-900/60">{label}</span>
      </div>
      <p className="font-game text-2xl font-bold text-amber-950">{value}</p>
    </div>
  );
}
