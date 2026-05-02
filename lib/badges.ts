import type React from "react";

/**
 * Phase B / D10 — UI helpers for badge rarity rendering.
 *
 * The server (`convex/badges.ts`) normalizes legacy free-form rarity strings
 * into the strict enum below via `normalizeRarity()` before sending data to
 * the client. The UI then maps each tier to the corresponding glow / label.
 */

export const RARITY_TIERS = ["common", "rare", "epic", "legendary"] as const;
export type RarityTier = (typeof RARITY_TIERS)[number];

export function getRarityLabel(tier: RarityTier): string {
  switch (tier) {
    case "common":
      return "Commun";
    case "rare":
      return "Rare";
    case "epic":
      return "Épique";
    case "legendary":
      return "Légendaire";
  }
}

export function getRarityRingClass(tier: RarityTier): string {
  switch (tier) {
    case "common":
      return "";
    case "rare":
      return "ring-2 ring-blue-300/70 shadow-lg shadow-blue-200/40";
    case "epic":
      return "ring-2 ring-purple-400/80 shadow-lg shadow-purple-300/50";
    case "legendary":
      return "ring-2 ring-amber-400 shadow-[0_0_20px_4px_rgba(251,191,36,0.35)] animate-[legendaryPulse_2s_ease-in-out_infinite]";
  }
}

export function getRarityGlowStyle(tier: RarityTier): React.CSSProperties {
  if (tier === "legendary") {
    return {
      background:
        "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.12), rgba(251,191,36,0.08))",
    };
  }
  if (tier === "epic") {
    return {
      background:
        "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(192,132,252,0.1), rgba(168,85,247,0.06))",
    };
  }
  return {};
}

/** Small chip color matching the rarity, e.g. for a "Rare" pill on the card. */
export function getRarityChipClass(tier: RarityTier): string {
  switch (tier) {
    case "common":
      return "bg-gray-100 text-gray-600";
    case "rare":
      return "bg-blue-100 text-blue-700";
    case "epic":
      return "bg-purple-100 text-purple-700";
    case "legendary":
      return "bg-amber-100 text-amber-700";
  }
}
