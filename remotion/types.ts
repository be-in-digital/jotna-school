/**
 * Props of the PioExplainer composition. The render worker
 * (scripts/render-explainer-videos.mjs) builds this JSON from a cached
 * exercise explanation (text + Pio's TTS audio segments) stored in Convex.
 */

export type ExplainerPose =
  | "hello"
  | "amazed"
  | "think"
  | "encourage"
  | "cheer";

/**
 * Chalk drawing put on the blackboard for a step — the teacher's visual
 * support (the spoken sentence lives in the bottom speech card, never on the
 * board). Produced by the AI script call; renderers validate defensively and
 * fall back to a chalk note. Keep the catalog in sync with
 * convex/explainMistake.ts (prompt + BOARD_KINDS) and ChalkBoard.tsx.
 */
export type BoardSpec =
  | { kind: "fraction"; parts?: number; filled?: number; label?: string }
  | {
      kind: "objects";
      emoji?: string;
      count?: number;
      groups?: number;
      crossed?: number;
      label?: string;
    }
  | {
      kind: "numberline";
      from?: number;
      to?: number;
      marks?: number[];
      label?: string;
    }
  | { kind: "operation"; expr?: string; label?: string }
  | { kind: "compare"; left?: string; right?: string; symbol?: string }
  | { kind: "boxes"; items?: string[]; label?: string }
  | { kind: "word"; text?: string; highlight?: string; label?: string }
  | { kind: "keyword"; text?: string };

export type ExplainerSegment = {
  role: "intro" | "step" | "conclusion";
  text: string;
  /** 1-based for steps, null for intro/conclusion. */
  stepNumber: number | null;
  pose: ExplainerPose;
  /** Chalk drawing for step segments; null → fallback chalk note. */
  board?: BoardSpec | null;
  /** HTTPS URL of the narrated MP3 for this segment (Convex storage). */
  audioSrc: string | null;
  /** Length of this segment in frames (audio duration + breathing pad). */
  durationInFrames: number;
};

export type PioExplainerProps = {
  /** Short lesson title chalked on the board (usually the exercise prompt). */
  title: string;
  segments: ExplainerSegment[];
};

export const EXPLAINER_FPS = 30;
export const EXPLAINER_WIDTH = 1280;
export const EXPLAINER_HEIGHT = 720;
/** Quiet tail after the last narration segment. */
export const EXPLAINER_TAIL_FRAMES = 24;
