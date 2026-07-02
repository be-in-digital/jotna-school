"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PioState } from "@/components/student/pio";

/**
 * Pio sprite — the official rendered avatar as a state-driven sprite
 * (idle / hello / cheer / sad). Pixel-perfect identity by construction:
 * these ARE the avatar renders (générés depuis la référence officielle,
 * détourés).
 *
 * ZERO motion by user decision (2026-07-02) : le personnage ne bouge pas ;
 * la vie vient uniquement du changement de pose entre les états (crossfade
 * d'opacité de 200 ms). All four states are stacked and preloaded so
 * switching is instant; mounted on tier "full" only (G5).
 */

const SPRITES: Record<PioState, string> = {
  idle: "/images/pio/idle.png",
  hello: "/images/pio/hello.png",
  cheer: "/images/pio/cheer.png",
  sad: "/images/pio/sad.png",
};

const LABELS: Record<PioState, string> = {
  idle: "Pio te regarde",
  hello: "Pio te dit bonjour",
  cheer: "Pio est content",
  sad: "Pio est pensif",
};

// Sources are ~2:3 portrait cutouts.
const ASPECT = 2 / 3;

export function PioSprite({
  state = "idle",
  size = 190,
  className = "",
  onFirstLoad,
}: {
  state?: PioState;
  /** Height in px (matches the vector Pio's box height). */
  size?: number;
  className?: string;
  /** Fired when the idle sprite is decoded — used for the crossfade. */
  onFirstLoad?: () => void;
}) {
  const width = Math.round(size * ASPECT);
  return (
    <div
      role="img"
      aria-label={LABELS[state]}
      className={cn("relative inline-block", className)}
      style={{ width, height: size }}
    >
      {(Object.keys(SPRITES) as PioState[]).map((s) => (
        <Image
          key={s}
          src={SPRITES[s]}
          alt=""
          fill
          sizes={`${width}px`}
          priority={s === "idle"}
          className={cn(
            "object-contain drop-shadow-md transition-opacity duration-200",
            s === state ? "opacity-100" : "opacity-0",
          )}
          onLoad={s === "idle" ? onFirstLoad : undefined}
        />
      ))}
    </div>
  );
}
