"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PioState } from "@/components/student/pio";

/**
 * Pio sprite — the official rendered avatar as a state-driven sprite
 * (idle / hello / cheer / sad), animated by transforms like every mobile
 * game hero. Pixel-perfect identity by construction: these ARE the avatar
 * renders (généré depuis la référence officielle, détouré).
 *
 * All four states are stacked and preloaded so switching is instant; the
 * component is mounted on tier "full" only (G5) — lite devices keep the
 * lightweight vector Pio.
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
  animated = true,
  onFirstLoad,
}: {
  state?: PioState;
  /** Height in px (matches the vector Pio's box height). */
  size?: number;
  className?: string;
  animated?: boolean;
  /** Fired when the idle sprite is decoded — used for the crossfade. */
  onFirstLoad?: () => void;
}) {
  const width = Math.round(size * ASPECT);
  return (
    <motion.div
      role="img"
      aria-label={LABELS[state]}
      className={cn("relative inline-block", className)}
      // Grounded motion: transform origin at the FEET — Pio breathes and
      // hops from the ground instead of floating/swinging in the air.
      style={{ width, height: size, originY: 1 }}
      animate={
        animated
          ? state === "cheer"
            ? { y: [0, -10, 0], scaleY: [1, 1.04, 0.97, 1] }
            : state === "hello"
              ? { y: [0, -6, 0, -4, 0] }
              : state === "sad"
                ? { scaleY: [1, 0.99, 1] }
                : { scaleY: [1, 1.02, 1] } // idle breathing, feet planted
          : undefined
      }
      transition={
        animated
          ? {
              duration:
                state === "cheer" ? 0.6 : state === "hello" ? 0.9 : 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
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
    </motion.div>
  );
}
