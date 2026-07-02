"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Loader2,
  Check,
  Lock,
  Play,
  Star,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BiomeMedallion,
  BiomeMedallionRich,
  biomeForKey,
} from "@/components/student/world/biome-medallion";
import {
  TrailConnector,
  TrailScenery,
  trailStops,
  trailHeight,
} from "@/components/student/world/trail";
import { GamePanel } from "@/components/student/game/game-panel";
import { useDeviceTier } from "@/hooks/use-device-tier";

/**
 * Redesign Gaming §5 — la zone d'une matière : chemin de niveaux (topics)
 * façon jeu mobile. Statuts via resolveTopicStatuses côté Convex (D4 —
 * chaîne de déblocage linéaire), données par getStudentSubjectMap.
 * Remplace l'ancienne page /student/subjects/[id] (redirigée ici).
 */

const ROW_H = 148;

type TopicStatus = "locked" | "available" | "in_progress" | "completed";

export default function SubjectMapPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = use(params);
  const map = useQuery(api.students.getStudentSubjectMap, {
    subjectId: subjectId as Id<"subjects">,
  });
  // G5 — rich art only on capable devices.
  const tier = useDeviceTier();
  const rich = tier === "full";

  if (map === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-3 text-amber-900/70">
          Chargement de l&apos;aventure…
        </span>
      </div>
    );
  }

  if (map === null) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-game text-xl font-semibold text-amber-950">
          Zone introuvable
        </h2>
        <Link
          href="/student/map"
          className="mt-4 inline-flex items-center gap-2 font-semibold text-orange-600 hover:text-orange-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour à la carte
        </Link>
      </div>
    );
  }

  const { subject, topics, totalStarsApprox } = map;
  const completedTopics = topics.filter(
    (t) => t.status === "completed",
  ).length;
  const allDone = topics.length > 0 && completedTopics === topics.length;

  // +1 stop: the treasure at the end of the trail (motivational anchor).
  const stops = trailStops(topics.length + 1, { rowHeight: ROW_H });
  const height = trailHeight(topics.length + 1, ROW_H);

  return (
    <div className="space-y-6">
      <Link
        href="/student/map"
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-game text-sm font-semibold text-amber-900/70 transition-colors hover:text-amber-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour à la carte
      </Link>

      {/* Zone banner */}
      <GamePanel
        variant="board"
        className="flex items-center gap-4 p-4 sm:p-5"
      >
        {rich ? (
          <BiomeMedallionRich
            kind={biomeForKey(subject._id)}
            tint={subject.color}
            className="h-20 w-20 shrink-0 drop-shadow-md sm:h-24 sm:w-24"
          />
        ) : (
          <BiomeMedallion
            kind={biomeForKey(subject._id)}
            tint={subject.color}
            className="h-20 w-20 shrink-0 drop-shadow-md sm:h-24 sm:w-24"
          />
        )}
        <div className="min-w-0">
          <h1 className="truncate font-game text-2xl font-bold text-amber-950 sm:text-3xl">
            {subject.name}
          </h1>
          <p className="mt-0.5 text-sm text-amber-900/70 sm:text-base">
            {completedTopics}/{topics.length} thématique
            {topics.length > 1 ? "s" : ""} validée
            {completedTopics > 1 ? "s" : ""}
          </p>
          {totalStarsApprox > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-yellow-200 bg-yellow-50 px-2.5 py-0.5 font-game text-sm font-bold text-yellow-800">
              <Star
                className="h-4 w-4 fill-yellow-500 text-yellow-500"
                aria-hidden
              />
              {totalStarsApprox}
            </span>
          )}
        </div>
      </GamePanel>

      {topics.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-white/70 p-12 text-center">
          <p className="font-game text-lg font-semibold text-amber-900">
            Cette zone est encore en préparation…
          </p>
          <p className="mt-1 text-amber-900/60">
            Reviens bientôt pour de nouvelles aventures !
          </p>
        </div>
      ) : (
        <div
          className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem]"
          style={{ height }}
        >
          {rich && (
            <Image
              src="/images/world/map-trail-bg.jpg"
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 640px) 28rem, 100vw"
              quality={78}
              className="object-cover opacity-90"
            />
          )}
          <TrailConnector stops={stops} height={height} />
          {!rich && <TrailScenery stops={stops} height={height} />}

          {topics.map((topic, i) => (
            <LevelNode
              key={topic._id}
              topic={topic}
              index={i}
              stop={stops[i]}
            />
          ))}

          {/* Treasure at the end of the trail */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${stops[topics.length].x}%`,
              top: stops[topics.length].y,
            }}
          >
            <div className="flex w-36 flex-col items-center gap-1.5">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-md ${
                  allDone
                    ? "border-yellow-300 bg-yellow-400"
                    : "border-dashed border-amber-300 bg-amber-50"
                }`}
              >
                <Sparkles
                  className={`h-7 w-7 ${allDone ? "text-white" : "text-amber-400"}`}
                  aria-hidden
                />
              </span>
              <span className="rounded-full bg-white/90 px-3 py-0.5 text-center font-game text-xs font-bold text-amber-900/80 shadow-sm">
                {allDone ? "Trésor de la zone gagné !" : "Le trésor t'attend !"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelNode({
  topic,
  index,
  stop,
}: {
  topic: {
    _id: string;
    name: string;
    status: TopicStatus;
    validatedPaliers: number;
    nextPalierIndex: number;
    starsApprox: number;
  };
  index: number;
  stop: { x: number; y: number };
}) {
  const { status } = topic;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";

  const circle = (
    <span
      className={`relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-b-4 shadow-lg transition-transform ${
        isCompleted
          ? "bg-lime-500 border-lime-700 text-white"
          : isInProgress
            ? "bg-orange-500 border-orange-700 text-white"
            : isLocked
              ? "bg-stone-200 border-stone-300 text-stone-400 shadow-none"
              : "bg-orange-400 border-orange-600 text-white"
      } ${!isLocked ? "group-hover:scale-105 group-focus-visible:scale-105 group-active:scale-95 group-active:border-b-0 group-active:translate-y-[3px]" : ""}`}
    >
      {isCompleted ? (
        <Check className="h-8 w-8" strokeWidth={3.5} aria-hidden />
      ) : isLocked ? (
        <Lock className="h-6 w-6" aria-hidden />
      ) : (
        <Play className="h-7 w-7 fill-current" aria-hidden />
      )}

      {/* in-progress: pulsing halo */}
      {isInProgress && (
        <motion.span
          aria-hidden
          className="absolute -inset-1.5 rounded-full border-4 border-orange-400/60"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* level number badge */}
      <span
        aria-hidden
        className={`absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white font-game text-xs font-bold shadow-sm ${
          isLocked ? "bg-stone-300 text-stone-600" : "bg-amber-500 text-white"
        }`}
      >
        {index + 1}
      </span>
    </span>
  );

  const label = (
    <span
      className={`line-clamp-2 max-w-full rounded-2xl px-3 py-1 text-center font-game text-sm font-bold shadow-sm ${
        isLocked
          ? "bg-white/85 text-stone-500"
          : "border-2 border-white/70 bg-white/90 text-amber-950 backdrop-blur-sm"
      }`}
    >
      {topic.name}
    </span>
  );

  const meta = isCompleted ? (
    topic.starsApprox > 0 && (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden />
        {topic.starsApprox}
      </span>
    )
  ) : isInProgress ? (
    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
      Palier {topic.nextPalierIndex}/10
    </span>
  ) : null;

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.45) }}
      className="flex w-36 flex-col items-center gap-1.5"
    >
      {circle}
      {label}
      {meta}
    </motion.div>
  );

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${stop.x}%`, top: stop.y }}
    >
      {isLocked ? (
        <div
          aria-label={`${topic.name} : verrouillé. Termine la thématique précédente pour débloquer.`}
        >
          {content}
        </div>
      ) : (
        <Link
          href={`/student/topics/${topic._id}/session?palier=${topic.nextPalierIndex}`}
          aria-label={
            isCompleted
              ? `Revoir ${topic.name}`
              : isInProgress
                ? `Continuer ${topic.name}, palier ${topic.nextPalierIndex}`
                : `Commencer ${topic.name}`
          }
          className="group block rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
        >
          {content}
        </Link>
      )}
    </div>
  );
}
