import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { todayYmd } from "./streak";
import {
  readStudentPreferences,
  type StudentPreferences,
} from "./students";

// ===========================================================================
// Quêtes quotidiennes — Redesign Gaming G7/G10 (tasks/redesign-gaming.md)
//
// - 3 quêtes/jour (1 seule au cold start), générées de façon DÉTERMINISTE à
//   partir de (studentId, dayKey) : la ligne est identique qu'elle soit créée
//   au premier affichage du hub ou à la première activité de la journée.
// - Progression branchée sur palierAttempts.verifyAttempt / submitPalier et
//   attempts.markAttemptCorrectByAI via internal.quests.recordActivity.
// - Récompense = étoiles bonus, agrégées dans preferences.questBonusStars
//   (même pattern que le streak — une seule lecture dans getMyStats).
// - Gating parent : parentSettings.dailyMissionEnabled, règle conservatrice
//   identique à streaksEnabled (D7) — un parent explicitement false ⇒ off.
// ===========================================================================

export type QuestType =
  | "do_exercises"
  | "correct_answers"
  | "validate_palier"
  | "subject_exercises";

export type DailyQuest = {
  key: string;
  type: QuestType;
  label: string;
  target: number;
  progress: number;
  reward: number;
  subjectId?: Id<"subjects">;
  subjectName?: string;
  completedAt?: number;
};

export type QuestEvent = {
  type: "exercise_attempted" | "exercise_correct" | "palier_validated";
  subjectId?: Id<"subjects">;
};

// ---------------------------------------------------------------------------
// Pure logic — exported for unit tests (project convention: logic-level tests,
// see convex/__tests__/streak.test.ts).
// ---------------------------------------------------------------------------

/** FNV-1a 32-bit hash — stable across runtimes, no deps. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — deterministic, good enough for quest variety. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

export const COLD_START_QUEST: Omit<DailyQuest, "progress"> = {
  key: "validate_palier",
  type: "validate_palier",
  label: "Termine ton premier niveau",
  target: 1,
  reward: 3,
};

/**
 * Construit les quêtes du jour. Déterministe pour (seed, subjects) donnés.
 * - Cold start (aucune tentative de palier) : une seule quête d'accueil.
 * - Sinon : 1 quête d'effort (facile), 1 quête de réussite, 1 quête de
 *   matière ciblée (si des matières existent).
 */
export function buildDailyQuests(opts: {
  seed: string;
  isColdStart: boolean;
  subjects: { _id: Id<"subjects">; name: string }[];
}): DailyQuest[] {
  if (opts.isColdStart) {
    return [{ ...COLD_START_QUEST, progress: 0 }];
  }

  const rand = mulberry32(hashSeed(opts.seed));
  const quests: DailyQuest[] = [];

  // 1 — effort (toujours présente, la plus facile à faire avancer).
  const doTarget = pickInt(rand, 5, 8);
  quests.push({
    key: "do_exercises",
    type: "do_exercises",
    label: `Fais ${doTarget} exercices`,
    target: doTarget,
    progress: 0,
    reward: 1,
  });

  // 2 — réussite : bonnes réponses OU valider un palier (50/50).
  if (rand() < 0.5) {
    const okTarget = pickInt(rand, 3, 6);
    quests.push({
      key: "correct_answers",
      type: "correct_answers",
      label: `Trouve ${okTarget} bonnes réponses`,
      target: okTarget,
      progress: 0,
      reward: 1,
    });
  } else {
    quests.push({
      key: "validate_palier",
      type: "validate_palier",
      label: "Termine un palier",
      target: 1,
      progress: 0,
      reward: 2,
    });
  }

  // 3 — matière ciblée (si des matières existent), sinon 2e quête de réussite.
  if (opts.subjects.length > 0) {
    const subject = opts.subjects[Math.floor(rand() * opts.subjects.length)];
    const subTarget = pickInt(rand, 3, 5);
    quests.push({
      key: "subject_exercises",
      type: "subject_exercises",
      label: `Fais ${subTarget} exercices de ${subject.name}`,
      target: subTarget,
      progress: 0,
      reward: 2,
      subjectId: subject._id,
      subjectName: subject.name,
    });
  } else if (quests[1].type !== "correct_answers") {
    const okTarget = pickInt(rand, 3, 6);
    quests.push({
      key: "correct_answers",
      type: "correct_answers",
      label: `Trouve ${okTarget} bonnes réponses`,
      target: okTarget,
      progress: 0,
      reward: 1,
    });
  }

  return quests;
}

/**
 * Applique une liste d'événements d'activité aux quêtes du jour.
 * Retourne les quêtes mises à jour + celles qui viennent d'être complétées
 * (pour créditer la récompense et déclencher la célébration côté client).
 */
export function applyQuestEvents(
  quests: DailyQuest[],
  events: QuestEvent[],
  now: number,
): { quests: DailyQuest[]; newlyCompleted: DailyQuest[] } {
  const newlyCompleted: DailyQuest[] = [];
  const next = quests.map((quest) => {
    if (quest.completedAt) return quest;
    let progress = quest.progress;
    for (const event of events) {
      const matches =
        (quest.type === "do_exercises" &&
          event.type === "exercise_attempted") ||
        (quest.type === "correct_answers" &&
          event.type === "exercise_correct") ||
        (quest.type === "validate_palier" &&
          event.type === "palier_validated") ||
        (quest.type === "subject_exercises" &&
          event.type === "exercise_attempted" &&
          event.subjectId !== undefined &&
          event.subjectId === quest.subjectId);
      if (matches) progress += 1;
    }
    if (progress === quest.progress) return quest;
    const updated: DailyQuest = {
      ...quest,
      progress: Math.min(progress, quest.target),
    };
    if (progress >= quest.target) {
      updated.completedAt = now;
      newlyCompleted.push(updated);
    }
    return updated;
  });
  return { quests: next, newlyCompleted };
}

/**
 * Gating parent — même règle conservatrice que streaksEnabled (D7) :
 * missions actives par défaut, désactivées si N'IMPORTE QUEL parent lié a
 * explicitement mis dailyMissionEnabled à false.
 */
export function dailyMissionsEnabled(
  settings: { dailyMissionEnabled: boolean }[],
): boolean {
  return !settings.some((s) => s.dailyMissionEnabled === false);
}

// ---------------------------------------------------------------------------
// Convex-side helpers
// ---------------------------------------------------------------------------

async function getStudentProfile(ctx: MutationCtx, userId: string) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!profile || profile.role !== "student") return null;
  return profile;
}

async function questsEnabledFor(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
): Promise<boolean> {
  const settings = await ctx.db
    .query("parentSettings")
    .withIndex("by_kid", (q) => q.eq("kidId", studentId))
    .take(10);
  return dailyMissionsEnabled(settings);
}

/**
 * Ligne du jour, créée si absente. La génération étant déterministe, la ligne
 * est identique quel que soit le déclencheur (hub ou première activité).
 */
async function getOrCreateTodayRow(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
): Promise<Doc<"dailyQuests">> {
  const dayKey = todayYmd();
  const existing = await ctx.db
    .query("dailyQuests")
    .withIndex("by_student_day", (q) =>
      q.eq("studentId", studentId).eq("dayKey", dayKey),
    )
    .unique();
  if (existing) return existing;

  // Cold start = aucune tentative de palier, jamais (D8 : pas de mur de
  // compteurs pour un nouvel élève — une seule quête d'accueil).
  const anyPalierAttempt = await ctx.db
    .query("palierAttempts")
    .withIndex("by_user", (q) => q.eq("userId", studentId))
    .take(1);

  const subjects = await ctx.db.query("subjects").take(50);
  subjects.sort((a, b) => a.order - b.order);

  const quests = buildDailyQuests({
    seed: `${studentId}:${dayKey}`,
    isColdStart: anyPalierAttempt.length === 0,
    subjects: subjects.map((s) => ({ _id: s._id, name: s.name })),
  });

  const id = await ctx.db.insert("dailyQuests", {
    studentId,
    dayKey,
    quests,
    createdAt: Date.now(),
  });
  return (await ctx.db.get(id))!;
}

async function creditQuestRewards(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  newlyCompleted: DailyQuest[],
): Promise<void> {
  if (newlyCompleted.length === 0) return;
  const total = newlyCompleted.reduce((acc, q) => acc + q.reward, 0);
  const prefs = readStudentPreferences(profile);
  const next: StudentPreferences = {
    ...prefs,
    questBonusStars: (prefs.questBonusStars ?? 0) + total,
  };
  await ctx.db.patch(profile._id, { preferences: next });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Idempotent — appelée au mount du hub pour matérialiser les quêtes du jour.
 * No-op si missions désactivées par un parent ou profil non-élève.
 */
export const ensureDaily = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await getStudentProfile(ctx, userId as string);
    if (!profile) return null;
    if (!(await questsEnabledFor(ctx, profile._id))) return null;
    await getOrCreateTodayRow(ctx, profile._id);
    return null;
  },
});

export const getMyDaily = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;

    const settings = await ctx.db
      .query("parentSettings")
      .withIndex("by_kid", (q) => q.eq("kidId", profile._id))
      .take(10);
    const enabled = dailyMissionsEnabled(settings);
    if (!enabled) {
      return { enabled: false as const, dayKey: todayYmd(), quests: null };
    }

    const dayKey = todayYmd();
    const row = await ctx.db
      .query("dailyQuests")
      .withIndex("by_student_day", (q) =>
        q.eq("studentId", profile._id).eq("dayKey", dayKey),
      )
      .unique();

    return {
      enabled: true as const,
      dayKey,
      // null tant que ensureDaily n'a pas tourné aujourd'hui (le hub l'appelle
      // au mount) — le client affiche alors un état de chargement.
      quests: row?.quests ?? null,
      allCompletedAt: row?.allCompletedAt ?? null,
    };
  },
});

/**
 * Branchée sur le flux d'activité (verifyAttempt / submitPalier /
 * markAttemptCorrectByAI). Crée la ligne du jour si besoin, applique les
 * événements, crédite les récompenses.
 */
export const recordActivity = internalMutation({
  args: {
    studentId: v.id("profiles"),
    events: v.array(
      v.object({
        type: v.union(
          v.literal("exercise_attempted"),
          v.literal("exercise_correct"),
          v.literal("palier_validated"),
        ),
        subjectId: v.optional(v.id("subjects")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (args.events.length === 0) return;
    const profile = await ctx.db.get(args.studentId);
    if (!profile || profile.role !== "student") return;
    if (!(await questsEnabledFor(ctx, profile._id))) return;

    const row = await getOrCreateTodayRow(ctx, profile._id);
    const { quests, newlyCompleted } = applyQuestEvents(
      row.quests,
      args.events,
      Date.now(),
    );
    // applyQuestEvents renvoie la même référence par quête quand rien n'a
    // bougé — aucun patch si aucun événement ne matche.
    const changed = quests.some((q, i) => q !== row.quests[i]);
    if (!changed) return;

    const allDone = quests.every((q) => q.completedAt !== undefined);
    await ctx.db.patch(row._id, {
      quests,
      ...(allDone && !row.allCompletedAt
        ? { allCompletedAt: Date.now() }
        : {}),
    });
    await creditQuestRewards(ctx, profile, newlyCompleted);
  },
});
