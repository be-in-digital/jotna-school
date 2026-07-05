import type { PioState } from "@/components/student/pio";

/** A narrated audio clip for one segment of an explanation, from the server. */
export type AudioSegment = {
  url: string;
  text: string;
  role: "intro" | "step" | "conclusion";
};

export type Explanation = {
  intro: string;
  steps: string[];
  conclusion: string;
};

/** One narrated beat of the "Pio t'explique" explainer video. */
export type Beat = {
  text: string;
  role: "intro" | "step" | "conclusion";
  pose: PioState;
  audioUrl: string | null;
  /** 1-based number for step beats, null for intro/conclusion. */
  stepNumber: number | null;
};

/**
 * Legacy cached explanations may embed their own numbering ("étape 2 : …");
 * the UI renders numbers itself, so strip the prefix for display. New
 * explanations are normalised at save time (convex/explainMistake.ts) —
 * keep the two regexes in sync.
 */
export function stripStepPrefix(step: string): string {
  return step.replace(/^\s*(étapes?\s*\d+|\d+)\s*[:.)\-–]\s*/i, "").trim();
}

/**
 * Turns a cached explanation (+ optional pre-synthesised Pio audio) into the
 * ordered beats the player narrates: intro → each step → conclusion, with a
 * Pio pose per beat. Audio is attached only when it lines up 1:1 with the
 * beats — otherwise the player falls back to the browser voice.
 *
 * `variant` tweaks the opening pose: after a success ("review") Pio cheers;
 * when the kid was stuck he greets calmly.
 */
export function buildBeats(
  explanation: Explanation,
  audio: AudioSegment[] | null,
  variant: "stuck" | "review",
): Beat[] {
  const beats: Beat[] = [];
  beats.push({
    text: explanation.intro,
    role: "intro",
    pose: variant === "review" ? "cheer" : "hello",
    audioUrl: null,
    stepNumber: null,
  });
  explanation.steps.forEach((text, i) => {
    beats.push({
      text: stripStepPrefix(text),
      role: "step",
      pose: i === 0 ? "amazed" : "think",
      audioUrl: null,
      stepNumber: i + 1,
    });
  });
  beats.push({
    text: explanation.conclusion,
    role: "conclusion",
    pose: "encourage",
    audioUrl: null,
    stepNumber: null,
  });

  if (audio && audio.length === beats.length) {
    beats.forEach((b, i) => {
      b.audioUrl = audio[i].url;
    });
  }
  return beats;
}
