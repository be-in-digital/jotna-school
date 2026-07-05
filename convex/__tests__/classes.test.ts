import { describe, it, expect } from "vitest";
import {
  CLASS_LEVELS,
  isClassLevel,
  nextClass,
  schoolYearOf,
} from "../classes";

// -----------------------------------------------------------------------
// Suivi de scolarité — l'année scolaire sénégalaise bascule au 1er octobre
// (fuseau Africa/Dakar = UTC+0) et la classe progresse CI → CM2.
// -----------------------------------------------------------------------

describe("schoolYearOf — année scolaire sénégalaise (rentrée octobre)", () => {
  it("30 septembre → encore l'année scolaire précédente", () => {
    const ts = Date.UTC(2026, 8, 30, 12, 0, 0); // 30 sept 2026
    expect(schoolYearOf(ts)).toBe("2025-2026");
  });

  it("1er octobre → nouvelle année scolaire", () => {
    const ts = Date.UTC(2026, 9, 1, 0, 0, 0); // 1er oct 2026
    expect(schoolYearOf(ts)).toBe("2026-2027");
  });

  it("janvier → au milieu de l'année scolaire commencée en octobre", () => {
    const ts = Date.UTC(2026, 0, 15); // 15 janv 2026
    expect(schoolYearOf(ts)).toBe("2025-2026");
  });

  it("juillet (vacances) → toujours rattaché à l'année écoulée", () => {
    const ts = Date.UTC(2026, 6, 5); // 5 juil 2026
    expect(schoolYearOf(ts)).toBe("2025-2026");
  });

  it("décembre → année scolaire en cours", () => {
    const ts = Date.UTC(2026, 11, 25);
    expect(schoolYearOf(ts)).toBe("2026-2027");
  });
});

describe("nextClass — progression dans la scolarité", () => {
  it("suit l'ordre CI → CP → CE1 → CE2 → CM1 → CM2", () => {
    expect(nextClass("CI")).toBe("CP");
    expect(nextClass("CP")).toBe("CE1");
    expect(nextClass("CE1")).toBe("CE2");
    expect(nextClass("CE2")).toBe("CM1");
    expect(nextClass("CM1")).toBe("CM2");
  });

  it("CM2 reste CM2 (fin de l'élémentaire)", () => {
    expect(nextClass("CM2")).toBe("CM2");
  });
});

describe("isClassLevel — validation des classes déclarées à l'inscription", () => {
  it("accepte les 6 classes de l'élémentaire", () => {
    for (const c of CLASS_LEVELS) {
      expect(isClassLevel(c)).toBe(true);
    }
  });

  it("rejette les valeurs invalides (chaîne vide, 6e, null, nombre)", () => {
    expect(isClassLevel("")).toBe(false);
    expect(isClassLevel("6e")).toBe(false);
    expect(isClassLevel("cp")).toBe(false); // sensible à la casse
    expect(isClassLevel(null)).toBe(false);
    expect(isClassLevel(undefined)).toBe(false);
    expect(isClassLevel(3)).toBe(false);
  });
});
