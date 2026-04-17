"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentBadgesPage() {
  // For now, use a placeholder studentId. In a real app this would come from auth.
  // We'll fetch all badges and all earned badges separately.
  const allBadges = useQuery(api.badges.list);

  // TODO: Replace with real student ID from auth
  // const earned = useQuery(api.badges.listEarnedByStudent, { studentId });

  // For the UI, we simulate by showing all as unearned if no auth context
  // This will be connected to real auth later
  const earned: Array<{ badgeId: string; earnedAt: number }> = [];

  if (allBadges === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement des badges...</span>
      </div>
    );
  }

  const earnedBadgeIds = new Set(earned.map((e) => e.badgeId));
  const earnedCount = earnedBadgeIds.size;
  const totalCount = allBadges.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ma collection</h1>
        <p className="mt-1 text-sm text-gray-500">
          {earnedCount}/{totalCount} badges obtenus
        </p>
      </div>

      {allBadges.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Aucun badge disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {allBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge._id);
            const earnedEntry = earned.find((e) => e.badgeId === badge._id);

            return (
              <motion.div
                key={badge._id}
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative flex flex-col items-center rounded-2xl border p-5 text-center transition-colors ${
                  isEarned
                    ? "border-yellow-300 bg-gradient-to-b from-yellow-50 to-orange-50 shadow-md"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                    isEarned ? "bg-yellow-100" : "bg-gray-200"
                  }`}
                >
                  {isEarned ? (
                    <span>{badge.icon}</span>
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <span className="opacity-30 grayscale">{badge.icon}</span>
                      <Lock className="absolute h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <p
                  className={`mt-3 text-sm font-semibold ${
                    isEarned ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {badge.name}
                </p>

                {/* Description (hidden if not earned) */}
                {isEarned ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {badge.description}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-300">???</p>
                )}

                {/* Date earned */}
                {isEarned && earnedEntry && (
                  <p className="mt-2 text-xs font-medium text-yellow-600">
                    Obtenu le{" "}
                    {new Date(earnedEntry.earnedAt).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
