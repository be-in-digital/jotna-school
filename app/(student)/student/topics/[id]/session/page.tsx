"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, UserCircle, X } from "lucide-react";
import Link from "next/link";
import ExercisePlayer from "@/components/exercises/ExercisePlayer";
import { useGamificationStore } from "@/stores/gamification-store";

export default function TopicSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showConfetti } = useGamificationStore();

  const profile = useQuery(api.profiles.getCurrentProfile);

  const exercises = useQuery(api.exercises.listByTopic, {
    topicId: id as Id<"topics">,
    status: "published",
  });

  const resumeIndex = useQuery(api.attempts.getResumeIndex, {
    topicId: id as Id<"topics">,
  });

  const [sessionStarted, setSessionStarted] = useState(false);

  const topic = useQuery(api.topics.getById, {
    id: id as Id<"topics">,
  });

  const handleQuit = () => {
    if (
      !window.confirm(
        "Veux-tu vraiment quitter ? Ta progression est sauvegardée, tu pourras reprendre plus tard.",
      )
    )
      return;
    if (topic?.subjectId) {
      router.push(`/student/subjects/${topic.subjectId}`);
    } else {
      router.push("/student/home");
    }
  };

  if (
    profile === undefined ||
    exercises === undefined ||
    resumeIndex === undefined
  ) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement des exercices...</span>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <UserCircle className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Non connecté</h2>
        <p className="text-gray-500">Connecte-toi pour faire les exercices.</p>
        <Link
          href="/login"
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Se connecter
        </Link>
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

  const isResuming = resumeIndex !== null && resumeIndex > 0;

  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 p-8 text-center text-white shadow-xl max-w-md">
          <BookOpen className="mx-auto h-16 w-16 mb-4" />
          <h1 className="text-3xl font-extrabold mb-2">
            {isResuming ? "On reprend !" : "C'est parti !"}
          </h1>
          <p className="text-lg opacity-90">
            {isResuming
              ? `Tu étais à l'exercice ${(resumeIndex ?? 0) + 1} sur ${exercises.length}`
              : `${exercises.length} exercice${exercises.length !== 1 ? "s" : ""} à compléter`}
          </p>
        </div>
        <button
          onClick={() => setSessionStarted(true)}
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-8 py-4 text-xl font-extrabold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.03]"
        >
          {isResuming ? "Reprendre l'exercice" : "Commencer les exercices"}
        </button>
        <Link
          href={topic?.subjectId ? `/student/subjects/${topic.subjectId}` : "/student/home"}
          className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          Retour
        </Link>
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
      {/* Quit button — top-right, sticky */}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={handleQuit}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
        >
          <X className="h-4 w-4" />
          Sauvegarder et quitter
        </button>
      </div>

      {/* Confetti overlay */}
      {showConfetti && <ConfettiEffect />}

      <ExercisePlayer
        exercises={exercises}
        topicId={id}
        studentId={profile._id}
        initialIndex={resumeIndex ?? 0}
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
