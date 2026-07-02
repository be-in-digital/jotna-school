"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Pio — LA mascotte : l'avatar officiel rendu (lionceau chibi fourni par
 * l'utilisateur, 2026-07-02), décliné en 8 poses générées depuis la
 * référence exacte puis détourées (`public/images/pio/*.png`).
 *
 * Décisions utilisateur verrouillées :
 * - c'est CET avatar qui incarne Pio partout (le vectoriel plat est retiré
 *   de l'interface) ;
 * - AUCUNE animation du corps — le changement d'état est un simple
 *   crossfade d'opacité entre poses.
 *
 * Le composant rend uniquement la pose courante (next/image, mise en cache
 * navigateur au premier affichage de chaque pose).
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
  idle: "/images/pio/idle.png",
  hello: "/images/pio/hello.png",
  cheer: "/images/pio/cheer.png",
  // « sad » applicatif = pose douce (serre ses livres) — jamais moqueur.
  sad: "/images/pio/sad.png",
  amazed: "/images/pio/amazed.png",
  encourage: "/images/pio/encourage.png",
  think: "/images/pio/think.png",
  sleep: "/images/pio/sleep.png",
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

// Les découpes sont en ~2:3 portrait ; `size` reste la hauteur (comme les
// versions précédentes) pour ne casser aucun appelant.
const ASPECT = 2 / 3;

type PioProps = {
  state?: PioState;
  size?: number;
  className?: string;
};

export function Pio({ state = "idle", size = 96, className = "" }: PioProps) {
  const width = Math.round(size * ASPECT);
  return (
    <span
      role="img"
      aria-label={LABELS[state]}
      className={cn("relative inline-block align-bottom", className)}
      style={{ width, height: size }}
    >
      <Image
        key={state}
        src={FILES[state]}
        alt=""
        fill
        sizes={`${width}px`}
        className="object-contain"
        priority={state === "idle" || state === "hello"}
      />
    </span>
  );
}
