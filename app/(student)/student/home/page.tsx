"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Play, Map as MapIcon, Sparkles } from "lucide-react";
import { SavannaScene } from "@/components/student/world/savanna-scene";
import { HubBackdrop } from "@/components/student/world/hub-backdrop";
import { PioStage } from "@/components/student/game/pio-stage";
import { QuestBoard } from "@/components/student/game/quest-board";
import { GameLinkButton } from "@/components/student/game/game-button";
import { useDeviceTier } from "@/hooks/use-device-tier";

/**
 * Redesign Gaming — LE HUB : le camp de Pio (tasks/redesign-gaming.md §4).
 * Boucle quotidienne : Pio accueille → missions du jour → « Continuer
 * l'aventure » reprend exactement où l'élève s'était arrêté.
 * D8 — cold start : pas de compteurs à zéro, une bulle d'accueil et un CTA
 * « Commencer l'aventure ».
 */
export default function StudentHomePage() {
  const stats = useQuery(api.students.getMyStats);
  const resume = useQuery(api.students.getMyResumeTarget);
  const daily = useQuery(api.quests.getMyDaily);
  // G5 — lite devices get the same world, fully static (zero animation cost).
  const tier = useDeviceTier();

  // Teinte du soir (18h–6h locale) — appliquée après hydratation pour éviter
  // tout mismatch SSR/client ; différée d'un tick (lint set-state-in-effect),
  // invisible derrière la transition d'opacité d'une seconde.
  const [evening, setEvening] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      const hour = new Date().getHours();
      setEvening(hour >= 18 || hour < 6);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const loaded = stats !== undefined && resume !== undefined;
  const coldStart = Boolean(stats && stats.totalExercises === 0);
  const questsDone =
    daily?.enabled && daily.quests
      ? daily.quests.filter((q) => q.completedAt).length
      : undefined;
  const questsTotal =
    daily?.enabled && daily.quests ? daily.quests.length : undefined;

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="sr-only">Le camp de Pio</h1>

      {/* ------------------------------------------------ the world stage */}
      <section
        aria-label="Le camp de Pio"
        className="relative h-[27rem] overflow-hidden rounded-[2rem] border-2 border-white/70 shadow-xl shadow-amber-900/10 sm:h-[30rem] sm:rounded-[2.5rem]"
      >
        {/* sky backdrop behind the SVG horizon */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100" />
        {/* portrait composition on phones so the camp landmarks (baobab,
            cabane) stay in frame; wide composition from sm: up. */}
        <SavannaScene
          composition="portrait"
          className="absolute inset-0 h-full w-full sm:hidden"
          animated={tier === "full"}
        />
        <SavannaScene
          composition="wide"
          className="absolute inset-0 hidden h-full w-full sm:block"
          animated={tier === "full"}
        />
        {/* G4/G5 — rich AI backdrop fades in over the vector scene on
            capable devices only; lite devices never download it. */}
        {tier === "full" && <HubBackdrop />}

        {/* evening mood — pure CSS overlay */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-400/30 via-transparent to-rose-300/25 transition-opacity duration-1000 ${
            evening ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* wooden sign */}
        <div className="absolute left-4 top-4 rounded-2xl border-2 border-amber-800 bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-1.5 shadow-md sm:left-6 sm:top-6">
          <span className="font-game text-sm font-bold text-amber-50 sm:text-base">
            Le camp de Pio
          </span>
        </div>

        {/* level chip — hidden on cold start (D8) */}
        {stats && !coldStart && (
          <div className="absolute right-4 top-4 rounded-full border-2 border-white/70 bg-white/85 px-3.5 py-1.5 shadow-md backdrop-blur-sm sm:right-6 sm:top-6">
            <span className="font-game text-sm font-bold text-amber-900">
              Niveau {stats.level}
            </span>
          </div>
        )}

        {/* Pio + CTA anchored to the grass */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-6 sm:pb-8">
          {loaded ? (
            <PioStage
              context={{
                coldStart,
                questsDone,
                questsTotal,
                streak: stats?.streaksEnabled ? stats.currentStreak : 0,
              }}
              rich={tier === "full"}
            />
          ) : (
            <div className="h-[190px]" aria-hidden />
          )}

          {loaded ? (
            resume ? (
              <div className="flex flex-col items-center gap-2 px-4">
                <GameLinkButton
                  href={`/student/topics/${resume.topicId}/session?palier=${resume.palierIndex}`}
                  size="lg"
                  className="min-w-[16rem]"
                >
                  <Play className="h-5 w-5 fill-current" aria-hidden />
                  Continuer l&apos;aventure
                </GameLinkButton>
                <span className="max-w-[20rem] truncate rounded-full bg-white/80 px-3 py-1 text-center text-sm font-semibold text-amber-900/80 backdrop-blur-sm">
                  {resume.subjectName} · {resume.topicName} · Palier{" "}
                  {resume.palierIndex}
                </span>
              </div>
            ) : (
              <GameLinkButton
                href="/student/map"
                size="lg"
                className="min-w-[16rem]"
              >
                {coldStart ? (
                  <Sparkles className="h-5 w-5" aria-hidden />
                ) : (
                  <MapIcon className="h-5 w-5" aria-hidden />
                )}
                {coldStart ? "Commencer l'aventure" : "Choisir une aventure"}
              </GameLinkButton>
            )
          ) : (
            <div
              className="h-14 w-64 animate-pulse rounded-3xl bg-white/60"
              aria-hidden
            />
          )}
        </div>
      </section>

      {/* ------------------------------------------------ missions du jour */}
      <QuestBoard />
    </div>
  );
}
