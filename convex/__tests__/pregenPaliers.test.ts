import { describe, it, expect } from "vitest";
import { palierNeedsGeneration } from "../pregenPaliers";

// -----------------------------------------------------------------------
// Pré-génération palier 1 — prédicat de sélection des buckets à réchauffer.
// Script J0 = includeExpired vrai (démarrage à froid) ; cron = faux (ne
// couvre que les topics jamais générés).
// -----------------------------------------------------------------------

const NOW = 1_000_000_000_000;
const fresh = { status: "cached", expiresAt: NOW + 1000 };
const expired = { status: "cached", expiresAt: NOW - 1000 };
const stale = { status: "stale", expiresAt: NOW + 1000 };
const generating = { status: "generating", expiresAt: NOW + 1000 };

describe("palierNeedsGeneration", () => {
  it("thématique jamais générée → toujours réchauffée (script ET cron)", () => {
    expect(palierNeedsGeneration(null, NOW, true)).toBe(true);
    expect(palierNeedsGeneration(null, NOW, false)).toBe(true);
    expect(palierNeedsGeneration(undefined, NOW, false)).toBe(true);
  });

  it("palier frais et en cache → jamais réchauffé", () => {
    expect(palierNeedsGeneration(fresh, NOW, true)).toBe(false);
    expect(palierNeedsGeneration(fresh, NOW, false)).toBe(false);
  });

  it("palier expiré → réchauffé par le script J0, ignoré par le cron", () => {
    expect(palierNeedsGeneration(expired, NOW, true)).toBe(true);
    expect(palierNeedsGeneration(expired, NOW, false)).toBe(false);
  });

  it("palier stale ou generating → réchauffé seulement par le script J0", () => {
    expect(palierNeedsGeneration(stale, NOW, true)).toBe(true);
    expect(palierNeedsGeneration(stale, NOW, false)).toBe(false);
    expect(palierNeedsGeneration(generating, NOW, true)).toBe(true);
    expect(palierNeedsGeneration(generating, NOW, false)).toBe(false);
  });

  it("expiration pile à l'instant présent compte comme expiré", () => {
    const atNow = { status: "cached", expiresAt: NOW };
    expect(palierNeedsGeneration(atNow, NOW, true)).toBe(true);
    expect(palierNeedsGeneration(atNow, NOW, false)).toBe(false);
  });
});
