"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pio, type PioState } from "@/components/student/pio";
import { PioSprite } from "@/components/student/pio-sprite";
import { kidMessages } from "@/lib/kidCopy";
import { play } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/**
 * Redesign Gaming — Pio, alive at the center of his camp.
 * Tap → random happy reaction; 5 quick taps → secret celebration (the kind
 * of hidden toy kids hunt for). Contextual speech bubble on arrival.
 *
 * Phase H (révisée) — on capable devices (`rich`) the vector Pio crossfades
 * into the OFFICIAL avatar sprite (state-driven renders of the reference —
 * pixel-perfect identity). The image→3D mesh path was tried and retired:
 * single-image meshing visibly degrades a fluffy chibi character (G2 plan B).
 */

const REACTION_MS = 1600;
const SECRET_WINDOW_MS = 2500;
const SECRET_TAPS = 5;

export type PioStageContext = {
  firstName?: string;
  coldStart: boolean;
  questsDone?: number;
  questsTotal?: number;
  streak?: number;
};

function pickArrivalMessage(ctx: PioStageContext): string {
  const hub = kidMessages.pioHub;
  if (ctx.coldStart) return hub.welcome;
  if (
    ctx.questsTotal &&
    ctx.questsDone !== undefined &&
    ctx.questsDone >= ctx.questsTotal
  ) {
    return hub.allQuestsDone;
  }
  if (
    ctx.questsTotal &&
    ctx.questsDone !== undefined &&
    ctx.questsTotal - ctx.questsDone === 1
  ) {
    return hub.oneQuestLeft;
  }
  if (ctx.streak && ctx.streak >= 3) return hub.streak(ctx.streak);
  const day = new Date().getDate();
  return hub.daily[day % hub.daily.length];
}

function celebrateSecret() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  void import("canvas-confetti").then((m) =>
    m.default({
      particleCount: 90,
      spread: 100,
      origin: { y: 0.55 },
      colors: ["#f97316", "#fbbf24", "#84cc16", "#38bdf8", "#f472b6"],
    }),
  );
}

export function PioStage({
  context,
  size = 190,
  rich = false,
}: {
  context: PioStageContext;
  size?: number;
  /** G5 — passed by the hub when the device tier is "full". */
  rich?: boolean;
}) {
  const [pioState, setPioState] = useState<PioState>("idle");
  const [bubble, setBubble] = useState<string | null>(null);
  const tapsRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Crossfade: the vector Pio shows instantly, the official avatar sprite
  // takes over once its idle frame is decoded.
  const [spriteReady, setSpriteReady] = useState(false);

  const scheduleReset = useCallback((ms: number) => {
    const t = setTimeout(() => setPioState("idle"), ms);
    timersRef.current.push(t);
  }, []);

  // Arrival: greet, show the contextual bubble, then settle down.
  // Runs in an effect (not render) so SSR/client hour differences are safe.
  const arrivalShown = useRef(false);
  useEffect(() => {
    if (arrivalShown.current) return;
    arrivalShown.current = true;
    setPioState("hello");
    setBubble(pickArrivalMessage(context));
    scheduleReset(2000);
    const hide = setTimeout(() => setBubble(null), 6000);
    timersRef.current.push(hide);
  }, [context, scheduleReset]);

  useEffect(
    () => () => timersRef.current.forEach((t) => clearTimeout(t)),
    [],
  );

  const onTap = useCallback(() => {
    const now = Date.now();
    tapsRef.current = [
      ...tapsRef.current.filter((t) => now - t < SECRET_WINDOW_MS),
      now,
    ];

    if (tapsRef.current.length >= SECRET_TAPS) {
      tapsRef.current = [];
      setPioState("cheer");
      setBubble(kidMessages.pioHub.secret);
      celebrateSecret();
      void play("levelUp");
      scheduleReset(2600);
      const hide = setTimeout(() => setBubble(null), 3500);
      timersRef.current.push(hide);
      return;
    }

    const reaction: PioState = Math.random() < 0.5 ? "hello" : "cheer";
    setPioState(reaction);
    if (Math.random() < 0.34) {
      const lines = kidMessages.pioHub.tapReactions;
      setBubble(lines[Math.floor(Math.random() * lines.length)]);
      const hide = setTimeout(() => setBubble(null), 1800);
      timersRef.current.push(hide);
    }
    scheduleReset(REACTION_MS);
  }, [scheduleReset]);

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="absolute -top-2 z-10 -translate-y-full"
            role="status"
          >
            <div className="relative max-w-[16rem] rounded-2xl border-2 border-amber-200 bg-white/95 px-4 py-2 text-center font-game text-sm font-semibold text-amber-950 shadow-lg">
              {bubble}
              <span
                aria-hidden
                className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-amber-200 bg-white/95"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onTap}
        aria-label="Jouer avec Pio"
        className="group rounded-full outline-none transition-transform focus-visible:ring-4 focus-visible:ring-sky-300 active:scale-95"
      >
        <span
          className="relative flex items-end justify-center"
          style={{ width: size, height: size }}
        >
          {/* vector Pio — instant, fades out once the avatar sprite is in */}
          <span
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              spriteReady ? "opacity-0" : "opacity-100",
            )}
          >
            <Pio state={pioState} size={size} className="drop-shadow-md" />
          </span>
          {/* official avatar sprite (rich tier only, crossfaded) */}
          {rich && (
            <span
              className={cn(
                "transition-opacity duration-500",
                spriteReady ? "opacity-100" : "opacity-0",
              )}
            >
              <PioSprite
                state={pioState}
                size={size}
                onFirstLoad={() => setSpriteReady(true)}
              />
            </span>
          )}
        </span>
        {/* ground shadow anchors Pio in the scene */}
        <span
          aria-hidden
          className="mx-auto -mt-2 block h-3 rounded-[100%] bg-amber-900/15 blur-[2px] transition-transform group-active:scale-90"
          style={{ width: size * 0.55 }}
        />
      </button>
    </div>
  );
}
