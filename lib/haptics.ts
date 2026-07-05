"use client";

/**
 * Tiny haptic feedback wrapper (Vibration API). The target audience is
 * Android phones (Senegal), where `navigator.vibrate` is well supported and
 * makes correct/incorrect answers feel physical. Silently no-ops where the
 * API is missing (iOS Safari, desktop) — never throws, never blocks.
 *
 * Kept intentionally light: three intents, short durations. Vibration is a
 * motion-adjacent affordance, so callers should also honour
 * `prefers-reduced-motion` before invoking these.
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    vibrate?: (p: number | number[]) => boolean;
  };
  try {
    nav.vibrate?.(pattern);
  } catch {
    // Some browsers throw if called without a user gesture — ignore.
  }
}

/** A single soft tap — a good pulse for a correct answer. */
export function hapticSuccess(): void {
  vibrate(18);
}

/** A gentle double-buzz — "not quite", never harsh (kids, 8-10). */
export function hapticError(): void {
  vibrate([0, 22, 60, 22]);
}

/** A crisp escalating triple for a combo milestone. */
export function hapticCombo(): void {
  vibrate([0, 14, 40, 14, 40, 22]);
}
