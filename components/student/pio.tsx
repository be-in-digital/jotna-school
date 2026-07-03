"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Pio — LA mascotte : l'avatar officiel v4 « explorateur à la loupe »
 * (image fournie par l'utilisateur, 2026-07-02 — référence source dans
 * `public/brand/pio/reference-v4.png`), détouré localement et servi depuis
 * `public/images/pio/*.png`.
 *
 * Décisions utilisateur verrouillées :
 * - c'est CET avatar qui incarne Pio partout, modales et dialogs inclus ;
 * - AUCUNE animation du corps.
 *
 * Les 8 états sont des poses distinctes générées depuis la référence
 * (« EXACT same character », fond blanc, détourage local flood-fill) —
 * l'explorateur garde sa loupe, sa chemise à l'étoile et sa sacoche dans
 * chaque pose. Le composant rend uniquement la pose courante.
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

// Découpe v4 : ~0,715 (l./h., crinière large) ; `size` reste la hauteur
// (comme les versions précédentes) pour ne casser aucun appelant.
const ASPECT = 0.715;

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
