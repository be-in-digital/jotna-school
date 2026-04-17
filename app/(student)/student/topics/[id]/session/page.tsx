"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen } from "lucide-react";
import ExercisePlayer from "@/components/exercises/ExercisePlayer";
import { useGamificationStore } from "@/stores/gamification-store";

// Placeholder student ID - in production this would come from auth
const PLACEHOLDER_STUDENT_ID = "placeholder_student_id";

export default function TopicSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showConfetti } = useGamificationStore();

  const exercises = useQuery(api.exercises.listByTopic, {
    topicId: id as any,
    status: "published",
  });

  const [sessionStarted, setSessionStarted] = useState(false);

  if (exercises === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement des exercices...</span>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <BookOpen className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">
          Aucun exercice disponible
        </h2>
        <p className="text-gray-500">
          Cette thematique n&apos;a pas encore d&apos;exercices publies.
        </p>
        <button
          onClick={() => router.back()}
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 p-8 text-center text-white shadow-xl max-w-md">
          <BookOpen className="mx-auto h-16 w-16 mb-4" />
          <h1 className="text-3xl font-extrabold mb-2">C&apos;est parti !</h1>
          <p className="text-lg opacity-90">
            {exercises.length} exercice{exercises.length !== 1 ? "s" : ""} a
            completer
          </p>
        </div>
        <button
          onClick={() => setSessionStarted(true)}
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-8 py-4 text-xl font-extrabold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.03]"
        >
          Commencer les exercices
        </button>
      </div>
    );
  }

  const handleComplete = (stats: {
    correctCount: number;
    totalCount: number;
    totalTimeMs: number;
    totalHintsUsed: number;
  }) => {
    // Store stats in sessionStorage for the complete page
    sessionStorage.setItem(`session_stats_${id}`, JSON.stringify(stats));
    router.push(`/student/topics/${id}/complete`);
  };

  return (
    <div className="relative mx-auto max-w-2xl py-4">
      {/* Confetti overlay */}
      {showConfetti && <ConfettiEffect />}

      <ExercisePlayer
        exercises={exercises}
        topicId={id}
        studentId={PLACEHOLDER_STUDENT_ID}
        onComplete={handleComplete}
      />
    </div>
  );
}

function ConfettiEffect() {
  useEffect(() => {
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f97316", "#ec4899", "#8b5cf6", "#22c55e", "#eab308"],
      });
    });
  }, []);

  return null;
}
