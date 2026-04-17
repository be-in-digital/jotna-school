"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Star, Clock, Lightbulb, Trophy, ArrowRight, RotateCcw } from "lucide-react";

interface SessionStats {
  correctCount: number;
  totalCount: number;
  totalTimeMs: number;
  totalHintsUsed: number;
}

export default function TopicCompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [stats, setStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`session_stats_${id}`);
    if (stored) {
      setStats(JSON.parse(stored));
    }
  }, [id]);

  // Trigger confetti on mount
  useEffect(() => {
    import("canvas-confetti").then((mod) => {
      // Fire multiple bursts for celebration
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
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Trophy className="h-16 w-16 text-amber-400" />
        <h1 className="text-3xl font-extrabold text-gray-900">
          Bravo !
        </h1>
        <p className="text-gray-500">Session terminee.</p>
        <Link
          href="/student/home"
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Retour a l&apos;accueil
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

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      {/* Congratulations header */}
      <div className="rounded-3xl bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 p-8 text-center text-white shadow-xl">
        <Trophy className="mx-auto h-16 w-16 mb-4" />
        <h1 className="text-4xl font-extrabold mb-2">
          Felicitations !
        </h1>
        <p className="text-xl opacity-90">
          Tu as termine cette thematique
        </p>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={`h-14 w-14 transition-all duration-500 ${
              i <= starCount
                ? "text-amber-400 fill-amber-400 scale-110"
                : "text-gray-300"
            }`}
            style={{
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>

      {/* Score */}
      <div className="text-center">
        <p className="text-5xl font-extrabold text-gray-900">{percentage}%</p>
        <p className="text-lg text-gray-500 font-semibold">
          {stats.correctCount} / {stats.totalCount} bonnes reponses
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
          <Clock className="mx-auto h-8 w-8 text-blue-500 mb-2" />
          <p className="text-2xl font-extrabold text-blue-900">
            {formatTime(stats.totalTimeMs)}
          </p>
          <p className="text-sm font-semibold text-blue-600">Temps total</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-amber-500 mb-2" />
          <p className="text-2xl font-extrabold text-amber-900">
            {stats.totalHintsUsed}
          </p>
          <p className="text-sm font-semibold text-amber-600">
            Indice{stats.totalHintsUsed !== 1 ? "s" : ""} utilise
            {stats.totalHintsUsed !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Badge placeholder */}
      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-5 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-200">
          <Trophy className="h-6 w-6 text-purple-700" />
        </div>
        <p className="text-base font-bold text-purple-900">
          Badge en cours de deblocage...
        </p>
        <p className="text-sm text-purple-600">
          Continue pour obtenir de nouveaux badges !
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Link
          href={`/student/topics/${id}/session`}
          className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 text-lg font-bold text-gray-700 shadow-sm transition-all hover:shadow-md hover:bg-gray-50"
        >
          <RotateCcw className="h-5 w-5" />
          Revoir mes erreurs
        </Link>
        <Link
          href="/student/home"
          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
        >
          Thematique suivante
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
