"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Check } from "lucide-react";
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
import { Pio } from "@/components/student/pio";
import { useDeviceTier } from "@/hooks/use-device-tier";

/**
 * Redesign Gaming §5 — la carte-monde : chaque matière est une zone de la
 * savane le long d'un sentier serpentin. Entièrement pilotée par les données
 * (n'importe quel nombre de matières), zéro asset bitmap (G4b).
 */

const ROW_H = 168;

export default function WorldMapPage() {
  const zones = useQuery(api.students.getMyWorldMap);
  // G5 — rich art (terrain bitmap, biome photos) only on capable devices.
  const tier = useDeviceTier();
  const rich = tier === "full";

  if (zones === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-3 text-amber-900/70">
          Chargement de la carte…
        </span>
      </div>
    );
  }

  if (zones === null || zones.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-white/70 p-12 text-center">
        <p className="font-game text-lg font-semibold text-amber-900">
          La savane est encore en train de pousser…
        </p>
        <p className="mt-1 text-amber-900/60">
          Les aventures arrivent bientôt !
        </p>
      </div>
    );
  }

  const stops = trailStops(zones.length, { rowHeight: ROW_H });
  const height = trailHeight(zones.length, ROW_H);

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-game text-2xl font-bold text-amber-950 sm:text-3xl">
          La carte de la savane
        </h1>
        <p className="mt-1 text-amber-900/70">
          Choisis une zone et pars à l&apos;aventure !
        </p>
      </header>

      <div
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem]"
        style={{ height }}
      >
        {/* G4 — ambient terrain art behind the algorithmic trail (full tier);
            the SVG scenery covers the lite tier. */}
        {rich && (
          <Image
            src="/images/world/map-trail-bg.jpg"
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 640px) 28rem, 100vw"
            className="object-cover opacity-90"
          />
        )}
        <TrailConnector stops={stops} height={height} />
        {!rich && <TrailScenery stops={stops} height={height} />}

        {zones.map((zone, i) => {
          const stop = stops[i];
          const done =
            zone.topicCount > 0 && zone.completedTopics >= zone.topicCount;
          return (
            <motion.div
              key={zone._id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.5) }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${stop.x}%`, top: stop.y }}
            >
              <Link
                href={`/student/map/${zone._id}`}
                aria-label={`Zone ${zone.name} : ${zone.completedTopics} thématique${zone.completedTopics > 1 ? "s" : ""} validée${zone.completedTopics > 1 ? "s" : ""} sur ${zone.topicCount}`}
                className="group flex w-36 flex-col items-center gap-1.5 outline-none"
              >
                <span className="relative block">
                  {/* current zone: pulsing ring + mini Pio waiting there */}
                  {zone.isCurrent && (
                    <motion.span
                      aria-hidden
                      className="absolute -inset-2 rounded-full border-4 border-orange-400/70"
                      animate={{ scale: [1, 1.08, 1], opacity: [0.8, 0.4, 0.8] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  )}
                  {rich ? (
                    <BiomeMedallionRich
                      kind={biomeForKey(zone._id)}
                      tint={zone.color}
                      className="h-24 w-24 drop-shadow-lg transition-transform group-hover:scale-105 group-focus-visible:scale-105 group-active:scale-95 sm:h-28 sm:w-28"
                    />
                  ) : (
                    <BiomeMedallion
                      kind={biomeForKey(zone._id)}
                      tint={zone.color}
                      className="h-24 w-24 drop-shadow-lg transition-transform group-hover:scale-105 group-focus-visible:scale-105 group-active:scale-95 sm:h-28 sm:w-28"
                    />
                  )}
                  {done && (
                    <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-lime-500 shadow-md">
                      <Check className="h-4.5 w-4.5 text-white" strokeWidth={3.5} aria-hidden />
                    </span>
                  )}
                  {zone.isCurrent && (
                    <span
                      aria-hidden
                      className="absolute -bottom-1 -left-7"
                    >
                      <Pio state="idle" size={46} />
                    </span>
                  )}
                </span>

                <span className="max-w-full truncate rounded-full border-2 border-white/70 bg-white/90 px-3 py-0.5 text-center font-game text-sm font-bold text-amber-950 shadow-sm backdrop-blur-sm">
                  {zone.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    done
                      ? "bg-lime-100 text-lime-700"
                      : zone.topicCount === 0
                        ? "bg-stone-100 text-stone-500"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {zone.topicCount === 0
                    ? "Bientôt !"
                    : `${zone.completedTopics}/${zone.topicCount}`}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
