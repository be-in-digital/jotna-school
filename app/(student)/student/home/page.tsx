"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Loader2, Star, Trophy, BookOpen } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Calculator: <span className="text-3xl">🧮</span>,
  Book: <span className="text-3xl">📖</span>,
  Flask: <span className="text-3xl">🔬</span>,
  Globe: <span className="text-3xl">🌍</span>,
  Music: <span className="text-3xl">🎵</span>,
  Palette: <span className="text-3xl">🎨</span>,
  Code: <span className="text-3xl">💻</span>,
  Hash: <span className="text-3xl">#</span>,
};

export default function StudentHomePage() {
  const subjects = useQuery(api.subjects.list);

  if (subjects === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="rounded-3xl bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 p-6 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold">
          Bonjour ! 👋
        </h1>
        <p className="mt-2 text-lg opacity-90">
          Pret a apprendre en t&apos;amusant aujourd&apos;hui ?
        </p>
      </div>

      {/* Last badge placeholder */}
      <div className="flex items-center gap-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200">
          <Trophy className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Dernier badge obtenu
          </p>
          <p className="text-base font-bold text-amber-900">
            Continue tes exercices pour gagner des badges !
          </p>
        </div>
      </div>

      {/* Subject grid */}
      <div>
        <h2 className="mb-4 text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-orange-500" />
          Mes matieres
        </h2>

        {subjects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-lg font-medium text-gray-500">
              Aucune matiere disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject._id}
                href={`/student/subjects/${subject._id}`}
                className="group rounded-3xl border-3 border-gray-100 bg-white p-6 shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:border-transparent"
                style={{
                  borderColor: "transparent",
                  boxShadow: `0 4px 20px ${subject.color}20`,
                }}
              >
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: subject.color }}
                >
                  {iconMap[subject.icon] || (
                    <span className="text-2xl font-bold">
                      {subject.icon.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-gray-700">
                  {subject.name}
                </h3>

                {/* Progress bar placeholder */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-500">
                    <span>Progression</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400" />
                      0%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: "0%",
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
