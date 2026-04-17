"use client";

import { Loader2, BookCheck, Award, Clock, Star, Heart } from "lucide-react";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
        <UserCircle className="h-16 w-16 mb-4 opacity-20" />
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-8">
        {stats.student.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stats.student.avatar}
            alt={stats.student.name}
            className="h-24 w-24 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-400 text-3xl font-bold text-white shadow-lg">
            {initials}
          </div>
        )}
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {stats.student.name}
        </h1>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <StatCard
          icon={<BookCheck className="h-5 w-5 text-green-500" />}
          label="Exercices complétés"
          value={stats.totalExercises.toString()}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-yellow-500" />}
          label="Thèmes complétés"
          value={stats.completedTopics.toString()}
        />
        <StatCard
          icon={<Award className="h-5 w-5 text-purple-500" />}
          label="Badges obtenus"
          value={stats.badgeCount.toString()}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          label="Temps total"
          value={formatDuration(stats.totalTimeMs)}
        />
      </div>

      {/* Favorite subject */}
      {stats.favoriteSubject && (
        <div className="mb-8 rounded-xl border border-pink-200 bg-pink-50 p-5">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-pink-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Matière préférée
              </p>
              <p className="text-lg font-bold text-gray-900">
                {stats.favoriteSubject}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent badges */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
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
                className="flex flex-col items-center rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-center"
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
