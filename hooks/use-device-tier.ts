"use client";

import { useEffect, useState } from "react";

/**
 * Redesign Gaming G5 — progressive enhancement tiers.
 *
 * "lite"  → data-saver on, low memory or few cores: ambient world animations
 *           are disabled and future heavy enhancers (Pio 3D, Phase H) must
 *           never load. The experience stays complete, just calmer.
 * "full"  → everything on.
 *
 * SSR/first paint returns "lite" (safe default: no animation flash on weak
 * devices); capable devices upgrade right after hydration. The decision is
 * memoized in sessionStorage to keep it stable across pages.
 */

export type DeviceTier = "lite" | "full";

const STORAGE_KEY = "jotna-device-tier";

type NavigatorProbe = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function detectDeviceTier(nav: NavigatorProbe): DeviceTier {
  if (nav.connection?.saveData) return "lite";
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return "lite";
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 3) {
    return "lite";
  }
  return "full";
}

/** Extra gate for WebGL consumers (Phase H): tier full AND WebGL2 available. */
export function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("lite");

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached === "lite" || cached === "full") {
          setTier(cached);
          return;
        }
        const detected = detectDeviceTier(navigator as NavigatorProbe);
        sessionStorage.setItem(STORAGE_KEY, detected);
        setTier(detected);
      } catch {
        setTier("full"); // storage blocked ≠ weak device
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return tier;
}
