"use client";

import { Pio } from "@/components/student/pio";

// Redesign Gaming — error boundary de l'espace élève : Pio réconforte,
// le ton reste positif (Decision 82), bouton chunky du design system.
export default function StudentError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <Pio state="sad" size={130} className="mb-4 drop-shadow-md" />
      <h2 className="mb-2 font-game text-2xl font-bold text-amber-950">
        Oups !
      </h2>
      <p className="mb-6 text-amber-900/70">
        Quelque chose s&apos;est mal passé. Pas de panique !
      </p>
      <button
        onClick={reset}
        className="inline-flex min-h-12 items-center justify-center rounded-2xl border-b-4 border-orange-700 bg-orange-500 px-8 py-3 font-game text-lg font-bold text-white shadow-md transition-all duration-100 hover:bg-orange-400 active:translate-y-[3px] active:border-b-0"
      >
        Réessayer
      </button>
    </div>
  );
}
