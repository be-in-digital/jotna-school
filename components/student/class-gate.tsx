"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GraduationCap, Sparkles } from "lucide-react";
import { GamePanel } from "@/components/student/game/game-panel";
import { GameButton } from "@/components/student/game/game-button";
import { Pio } from "@/components/student/pio";
import {
  CLASS_LEVELS,
  CLASS_LABELS,
  currentSchoolYear,
  nextClass,
  type ClassLevel,
} from "@/convex/classes";

/**
 * Porte d'entrée « classe » de l'espace élève.
 *
 * Deux situations bloquantes (hors mode focus, géré par le layout) :
 *  1. L'élève n'a pas de classe (compte créé avant la fonctionnalité, ou
 *     inscription incomplète) → grand sélecteur plein écran. Sans classe,
 *     la carte ne peut pas adapter les exercices.
 *  2. Nouvelle année scolaire (classSchoolYear ≠ année courante) → Pio
 *     propose le passage dans la classe suivante — c'est le suivi de
 *     scolarité : un tap et l'élève repart avec des exercices de son
 *     nouveau niveau.
 */
export function ClassGate() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const setStudentClass = useMutation(api.profiles.setStudentClass);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // La modal rentrée propose 2 choix rapides ; « une autre classe » bascule
  // sur la grille complète.
  const [showFullPicker, setShowFullPicker] = useState(false);

  if (!profile || profile.role !== "student") return null;

  const schoolYear = currentSchoolYear();
  const needsClass = !profile.class;
  const needsYearlyConfirm =
    !needsClass && profile.classSchoolYear !== schoolYear;

  if (!needsClass && !needsYearlyConfirm) return null;

  const choose = async (cls: ClassLevel) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await setStudentClass({ class: cls });
    } catch {
      setError("Oups, ça n'a pas marché. Réessaie !");
    } finally {
      setSaving(false);
    }
  };

  const currentClass = (profile.class ?? null) as ClassLevel | null;
  const suggested = currentClass ? nextClass(currentClass) : null;

  const pickerGrid = (
    <div className="grid grid-cols-2 gap-3">
      {CLASS_LEVELS.map((c) => (
        <button
          key={c}
          type="button"
          disabled={saving}
          onClick={() => choose(c)}
          className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 border-b-4 border-amber-300 bg-white px-3 py-2.5 font-game font-bold text-amber-950 shadow-md transition-all duration-100 hover:bg-amber-50 active:translate-y-[3px] active:border-b-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="text-xl">{c}</span>
          <span className="text-[11px] font-semibold text-amber-900/60">
            {CLASS_LABELS[c].split("— ")[1]}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-sky-200/95 via-sky-100/95 to-amber-100/95 p-4 backdrop-blur-sm"
    >
      <GamePanel
        variant="board"
        className="w-full max-w-md p-6 text-center sm:p-8"
      >
        <div className="mx-auto mb-2 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-sky-100 to-amber-100 shadow-inner">
          <Pio state={needsClass ? "hello" : "cheer"} size={96} />
        </div>

        {needsClass || showFullPicker ? (
          <>
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 font-game text-xs font-bold uppercase tracking-wide text-sky-700">
              <GraduationCap className="h-4 w-4" aria-hidden />
              Ta classe
            </span>
            <h2
              id="class-gate-title"
              className="mt-2 font-game text-2xl font-bold text-amber-950"
            >
              Tu es dans quelle classe ?
            </h2>
            <p className="mx-auto mt-1 mb-5 max-w-sm text-sm font-semibold text-amber-900/70">
              Pio te préparera des exercices exactement de ton niveau.
            </p>
            {pickerGrid}
          </>
        ) : (
          <>
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-lime-100 px-3 py-1 font-game text-xs font-bold uppercase tracking-wide text-lime-700">
              <Sparkles className="h-4 w-4" aria-hidden />
              Nouvelle année {schoolYear}
            </span>
            <h2
              id="class-gate-title"
              className="mt-2 font-game text-2xl font-bold text-amber-950"
            >
              C&apos;est la rentrée !
            </h2>
            <p className="mx-auto mt-1 mb-5 max-w-sm text-sm font-semibold text-amber-900/70">
              {suggested !== currentClass
                ? `L'année dernière tu étais en ${currentClass}. Tu passes en ${suggested} ?`
                : `Tu es toujours en ${currentClass} cette année ?`}
            </p>
            <div className="flex flex-col gap-2.5">
              {suggested !== currentClass && suggested && (
                <GameButton
                  variant="success"
                  size="lg"
                  disabled={saving}
                  onClick={() => choose(suggested)}
                >
                  Oui, je passe en {suggested} !
                </GameButton>
              )}
              {currentClass && (
                <GameButton
                  variant={suggested !== currentClass ? "ghost" : "success"}
                  size={suggested !== currentClass ? "md" : "lg"}
                  disabled={saving}
                  onClick={() => choose(currentClass)}
                >
                  Je reste en {currentClass}
                </GameButton>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowFullPicker(true)}
                className="mx-auto mt-1 font-game text-sm font-semibold text-amber-900/60 underline-offset-4 hover:underline disabled:opacity-50"
              >
                Je suis dans une autre classe
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
      </GamePanel>
    </div>
  );
}
