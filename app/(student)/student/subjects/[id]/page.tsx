"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Check,
  Lock,
  Play,
  ChevronRight,
} from "lucide-react";

export default function SubjectTopicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const subject = useQuery(api.subjects.getById, { id: id as any });
  const topics = useQuery(api.topics.listBySubject, {
    subjectId: id as any,
  });

  if (subject === undefined || topics === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (subject === null) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Matiere introuvable
        </h2>
        <Link
          href="/student/home"
          className="mt-4 inline-flex items-center gap-2 text-orange-600 hover:text-orange-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/student/home"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux matieres
      </Link>

      {/* Subject header */}
      <div
        className="rounded-3xl p-6 text-white shadow-xl"
        style={{ backgroundColor: subject.color }}
      >
        <h1 className="text-3xl font-extrabold">{subject.name}</h1>
        <p className="mt-1 text-lg opacity-90">
          {topics.length} thematique{topics.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Topic list */}
      {topics.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            Aucune thematique disponible pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, index) => {
            // Topics unlock linearly: first is always available,
            // others require the previous to be completed.
            // For now, we use a simple "first unlocked, rest locked" approach
            // that can be enhanced with real progress data.
            const isFirst = index === 0;
            const isLocked = !isFirst; // placeholder - real logic would check progress
            const isCompleted = false; // placeholder
            const progress = 0; // placeholder

            return (
              <div
                key={topic._id}
                className={`rounded-2xl border-3 bg-white p-5 shadow-sm transition-all duration-200 ${
                  isLocked
                    ? "border-gray-200 opacity-60"
                    : isCompleted
                      ? "border-green-200 hover:shadow-md"
                      : "border-orange-200 hover:shadow-md hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Status icon */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-lg font-bold ${
                        isCompleted
                          ? "bg-green-500"
                          : isLocked
                            ? "bg-gray-300"
                            : "bg-orange-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900">
                        {topic.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {topic.description}
                      </p>

                      {/* Progress bar */}
                      {!isLocked && (
                        <div className="mt-2 w-48">
                          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: isCompleted
                                  ? "#22c55e"
                                  : subject.color,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {!isLocked && (
                    <Link
                      href={`/student/topics/${topic._id}/session`}
                      className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-3 text-base font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
                    >
                      {isCompleted ? "Revoir" : "Commencer"}
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
