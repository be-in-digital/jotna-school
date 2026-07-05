/**
 * Classes de l'élémentaire sénégalais — module pur, partagé backend + frontend.
 *
 * Source canonique de l'énum de classes (CI → CM2), des libellés affichés,
 * de la progression de scolarité (nextClass) et de l'année scolaire
 * sénégalaise (rentrée début octobre, fuseau Africa/Dakar = UTC+0, même
 * convention que convex/streak.ts).
 *
 * Importable côté client (aucune dépendance serveur autre que convex/values,
 * qui est isomorphe).
 */

import { v } from "convex/values";

export const CLASS_LEVELS = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"] as const;

export type ClassLevel = (typeof CLASS_LEVELS)[number];

/** Validateur Convex réutilisable pour les champs/arguments de classe. */
export const classValidator = v.union(
  v.literal("CI"),
  v.literal("CP"),
  v.literal("CE1"),
  v.literal("CE2"),
  v.literal("CM1"),
  v.literal("CM2"),
);

/** Libellés complets pour les formulaires (parents / inscription). */
export const CLASS_LABELS: Record<ClassLevel, string> = {
  CI: "CI — Cours d'initiation",
  CP: "CP — Cours préparatoire",
  CE1: "CE1 — Cours élémentaire 1",
  CE2: "CE2 — Cours élémentaire 2",
  CM1: "CM1 — Cours moyen 1",
  CM2: "CM2 — Cours moyen 2",
};

/** Libellés courts kid-friendly pour le sélecteur élève. */
export const CLASS_KID_LABELS: Record<ClassLevel, string> = {
  CI: "Je suis en CI",
  CP: "Je suis en CP",
  CE1: "Je suis en CE1",
  CE2: "Je suis en CE2",
  CM1: "Je suis en CM1",
  CM2: "Je suis en CM2",
};

export function isClassLevel(value: unknown): value is ClassLevel {
  return (
    typeof value === "string" &&
    (CLASS_LEVELS as readonly string[]).includes(value)
  );
}

/**
 * Classe suivante dans la scolarité. CM2 reste CM2 : la fin de l'élémentaire
 * (entrée en 6e) sort du périmètre de l'app — l'élève confirme simplement.
 */
export function nextClass(cls: ClassLevel): ClassLevel {
  const i = CLASS_LEVELS.indexOf(cls);
  return CLASS_LEVELS[Math.min(i + 1, CLASS_LEVELS.length - 1)];
}

/**
 * Année scolaire sénégalaise contenant le timestamp donné, ex. "2025-2026".
 * La rentrée a lieu début octobre : bascule au 1er octobre (UTC = Dakar).
 */
export function schoolYearOf(ts: number): string {
  const d = new Date(ts);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; // 1..12
  return month >= 10 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function currentSchoolYear(): string {
  return schoolYearOf(Date.now());
}
