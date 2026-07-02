"use client";

import { cn } from "@/lib/utils";

/**
 * Pio v3 — « Lionceau Téranga », mascotte officielle vectorielle de
 * Jotna School (brief 2026-07-02 : flat vector, palette plateforme,
 * crinière-soleil, bandana wax discret, feuille lime).
 *
 * SOURCE DE VÉRITÉ : scripts/generate-pio.mjs → public/brand/pio/*.svg
 * (8 états + silhouette + pictos). Ce composant est un simple rendu :
 * les 8 états sont empilés (≈6 Ko/SVG, mis en cache) pour un changement
 * de pose instantané. Aucune animation du corps (décision utilisateur) —
 * la vie vient du changement d'état.
 */

export type PioState =
  | "idle"
  | "hello"
  | "cheer"
  | "sad"
  | "amazed"
  | "encourage"
  | "think"
  | "sleep";

const FILES: Record<PioState, string> = {
  idle: "/brand/pio/pio-idle.svg",
  hello: "/brand/pio/pio-hero.svg",
  cheer: "/brand/pio/pio-cheer.svg",
  // « sad » applicatif = pose réconfortante du brief (« on réessaie
  // ensemble ») — jamais moqueur, toujours encourageant.
  sad: "/brand/pio/pio-comfort.svg",
  amazed: "/brand/pio/pio-amazed.svg",
  encourage: "/brand/pio/pio-encourage.svg",
  think: "/brand/pio/pio-think.svg",
  sleep: "/brand/pio/pio-sleep.svg",
};

const LABELS: Record<PioState, string> = {
  idle: "Pio te regarde",
  hello: "Pio te dit bonjour",
  cheer: "Pio célèbre avec toi",
  sad: "Pio te réconforte",
  amazed: "Pio est émerveillé",
  encourage: "Pio t'encourage",
  think: "Pio réfléchit",
  sleep: "Pio dort",
};

type PioProps = {
  state?: PioState;
  size?: number;
  className?: string;
};

export function Pio({ state = "idle", size = 96, className = "" }: PioProps) {
  return (
    <span
      role="img"
      aria-label={LABELS[state]}
      className={cn("relative inline-block align-bottom", className)}
      style={{ width: size, height: size }}
    >
      {(Object.keys(FILES) as PioState[]).map((s) => (
        // eslint-disable-next-line @next/next/no-img-element -- SVG statique,
        // aucune optimisation next/image nécessaire
        <img
          key={s}
          src={FILES[s]}
          alt=""
          width={size}
          height={size}
          loading={s === "idle" || s === state ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            s === state ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </span>
  );
}
