import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { readStudentPreferences, type StudentPreferences } from "./students";

// ---------------------------------------------------------------------------
// D10 — Rarity tier normalization. The schema currently widens
// `badges.rarity` as `v.optional(v.string())` (legacy free-form). Phase B
// narrows it to a strict enum via the widen-migrate-narrow pattern:
//   1. (already done) Widen accepts any string.
//   2. Run `internal.badges.normalizeRarities` once in production.
//   3. Narrow the validator in schema.ts to the strict union below.
// All read paths use `normalizeRarity()` so the UI always sees the typed value.
// ---------------------------------------------------------------------------

export const RARITY_TIERS = ["common", "rare", "epic", "legendary"] as const;
export type RarityTier = (typeof RARITY_TIERS)[number];
const RARITY_SET = new Set<string>(RARITY_TIERS);

export function normalizeRarity(raw: string | undefined | null): RarityTier {
  if (!raw) return "common";
  const lower = raw.toLowerCase().trim();
  if (RARITY_SET.has(lower)) return lower as RarityTier;
  // Legacy aliases — observed in seeded data and admin UI shorthand.
  if (lower === "uncommon" || lower === "bronze" || lower === "argent") {
    return "rare";
  }
  if (lower === "or" || lower === "gold") return "epic";
  if (lower === "diamond" || lower === "diamant" || lower === "platinum") {
    return "legendary";
  }
  return "common";
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// D10b — Map condition keys to readable French unlock criteria. Anything
// outside this list falls back to the generic encouragement copy.
// Redesign Gaming — accepte aussi les conditions data-driven (conditionType
// + conditionParams) du catalogue « gaming ».
export function getConditionText(
  condition: string,
  conditionType?: string,
  conditionParams?: unknown,
): string {
  const count =
    (conditionParams as { count?: number } | undefined)?.count ?? 1;
  switch (conditionType) {
    case "exercises_correct_total":
      return `Trouve ${count} bonnes réponses en tout`;
    case "topics_completed_total":
      return count === 1
        ? "Termine ta première thématique"
        : `Termine ${count} thématiques`;
    case "paliers_validated_total":
      return count === 1
        ? "Valide ton premier palier"
        : `Valide ${count} paliers`;
    case "subjects_started":
      return `Commence ${count} matières différentes`;
    case "subject_full_complete":
      return "Termine toutes les thématiques d'une matière";
    case "streak_days":
      return `Travaille ${count} jours d'affilée`;
    case "quests_completed_total":
      return count === 1
        ? "Termine ta première mission du jour"
        : `Termine ${count} missions du jour`;
    case "perfect_quest_days":
      return count === 1
        ? "Termine les 3 missions d'une même journée"
        : `Réussis ${count} journées de missions parfaites`;
    case "early_bird":
      return "Fais un exercice avant 8 h du matin";
    default:
      break;
  }
  switch (condition) {
    case "complete_topic":
      return "Termine une thématique";
    case "perfect_score":
      return "Termine une thématique sans erreur";
    case "streak_3":
      return "Termine 3 thématiques de suite";
    default:
      return "Continue à apprendre !";
  }
}

// ---------------------------------------------------------------------------
// Redesign Gaming — évaluateur data-driven. Pure et exportée pour les tests
// (convention projet). `stats` est un instantané borné calculé une seule
// fois par passage de checkAndAward.
// ---------------------------------------------------------------------------

export type BadgeStatsSnapshot = {
  totalCorrectExercises: number;
  topicsCompleted: number;
  paliersValidated: number;
  subjectsStarted: number;
  hasFullSubjectComplete: boolean;
  longestStreak: number;
  questsCompletedTotal: number;
  perfectQuestDays: number;
  hasEarlyBirdAttempt: boolean;
};

export function evaluateConditionType(
  conditionType: string,
  conditionParams: unknown,
  stats: BadgeStatsSnapshot,
): boolean {
  const count =
    (conditionParams as { count?: number } | undefined)?.count ?? 1;
  switch (conditionType) {
    case "exercises_correct_total":
      return stats.totalCorrectExercises >= count;
    case "topics_completed_total":
      return stats.topicsCompleted >= count;
    case "paliers_validated_total":
      return stats.paliersValidated >= count;
    case "subjects_started":
      return stats.subjectsStarted >= count;
    case "subject_full_complete":
      return stats.hasFullSubjectComplete;
    case "streak_days":
      return stats.longestStreak >= count;
    case "quests_completed_total":
      return stats.questsCompletedTotal >= count;
    case "perfect_quest_days":
      return stats.perfectQuestDays >= count;
    case "early_bird":
      return stats.hasEarlyBirdAttempt;
    default:
      return false;
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("badges").take(100);
    return rows.map((b) => ({
      ...b,
      rarity: normalizeRarity(b.rarity),
      criteriaText: getConditionText(
        b.condition,
        b.conditionType,
        b.conditionParams,
      ),
    }));
  },
});

export const getById = query({
  args: { id: v.id("badges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listEarnedByStudent = query({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    const earned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(100);

    // Join with badges table for full info
    const results = [];
    for (const eb of earned) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        results.push({
          ...eb,
          badge: {
            ...badge,
            rarity: normalizeRarity(badge.rarity),
            criteriaText: getConditionText(
              badge.condition,
              badge.conditionType,
              badge.conditionParams,
            ),
          },
        });
      }
    }
    return results;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    condition: v.string(),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("badges", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      condition: args.condition,
      subjectId: args.subjectId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("badges"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    condition: v.optional(v.string()),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Badge introuvable");
    }
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("badges") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Badge introuvable");
    }

    // Check if any earnedBadges reference this badge
    const earned = await ctx.db
      .query("earnedBadges")
      .filter((q) => q.eq(q.field("badgeId"), args.id))
      .first();
    if (earned) {
      throw new Error(
        "Impossible de supprimer ce badge car des élèves l'ont déjà obtenu.",
      );
    }

    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// D25 — Mark earned badges as "seen" by the kid (after the /complete page
// renders the unlock card). Idempotent: re-calls with already-seen IDs are a
// no-op (early return without a db.patch). Caps the rolling list at 100
// entries (Guardian C4) — a student earning 100+ unique badges is far beyond
// MVP scope, but the cap keeps preferences bounded.
// ---------------------------------------------------------------------------

const LAST_SEEN_BADGE_IDS_CAP = 100;

export const markBadgesSeen = mutation({
  args: { badgeIds: v.array(v.id("badges")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") {
      throw new Error("Profil élève introuvable");
    }
    if (args.badgeIds.length === 0) return;

    const prefs = readStudentPreferences(profile);
    const current = prefs.lastSeenBadgeIds ?? [];
    const incoming = args.badgeIds.map((id) => id as string);
    const currentSet = new Set(current);
    const additions = incoming.filter((id) => !currentSet.has(id));
    if (additions.length === 0) return; // Idempotent — nothing new to record.

    const merged = [...current, ...additions].slice(-LAST_SEEN_BADGE_IDS_CAP);
    const next: StudentPreferences = { ...prefs, lastSeenBadgeIds: merged };
    await ctx.db.patch(profile._id, { preferences: next });
  },
});

// ---------------------------------------------------------------------------
// D10 step 2 — Migration: normalize all badges.rarity values to the strict
// enum so the schema can be narrowed (step 3) without rejecting any rows.
// Idempotent + paginated. Run once via `npx convex run badges:normalizeRarities`
// before bumping schema.ts to the strict union validator.
// ---------------------------------------------------------------------------
export const normalizeRarities = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    patched: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("badges")
      .paginate({ numItems: 100, cursor: args.cursor ?? null });

    let patched = args.patched ?? 0;
    for (const badge of result.page) {
      const next = normalizeRarity(badge.rarity);
      if (badge.rarity === next) continue; // No-op when already normalized.
      await ctx.db.patch(badge._id, { rarity: next });
      patched += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.badges.normalizeRarities, {
        cursor: result.continueCursor,
        patched,
      });
    }
    return { patched, isDone: result.isDone };
  },
});

// ---------------------------------------------------------------------------
// Redesign Gaming — catalogue de badges OBTENABLES, branchés sur les systèmes
// réels (quêtes, paliers, zones de la carte, série, rythme). Seed idempotent
// par catalogKey : `pnpx convex run badges:seedGamingBadges`.
// ---------------------------------------------------------------------------

const GAMING_BADGES: Array<{
  catalogKey: string;
  name: string;
  description: string;
  icon: string;
  rarity: RarityTier;
  conditionType: string;
  conditionParams: { count?: number };
  order: number;
}> = [
  // --- Missions du jour (G7) ---
  { catalogKey: "gaming_first_mission", name: "Première mission", description: "Tu as terminé ta première mission du jour !", icon: "Target", rarity: "common", conditionType: "quests_completed_total", conditionParams: { count: 1 }, order: 101 },
  { catalogKey: "gaming_mission_hunter", name: "Chasseur de missions", description: "10 missions du jour accomplies.", icon: "ScrollText", rarity: "rare", conditionType: "quests_completed_total", conditionParams: { count: 10 }, order: 102 },
  { catalogKey: "gaming_mission_hero", name: "Héros des missions", description: "50 missions du jour accomplies — Pio est fier de toi !", icon: "Crown", rarity: "epic", conditionType: "quests_completed_total", conditionParams: { count: 50 }, order: 103 },
  { catalogKey: "gaming_perfect_day", name: "Journée parfaite", description: "Les 3 missions d'une même journée, toutes réussies.", icon: "Sun", rarity: "rare", conditionType: "perfect_quest_days", conditionParams: { count: 1 }, order: 104 },
  { catalogKey: "gaming_perfect_week", name: "Semaine de légende", description: "7 journées de missions parfaites — incroyable !", icon: "Trophy", rarity: "legendary", conditionType: "perfect_quest_days", conditionParams: { count: 7 }, order: 105 },
  // --- Paliers ---
  { catalogKey: "gaming_first_palier", name: "Premiers pas de lion", description: "Ton tout premier palier validé.", icon: "Footprints", rarity: "common", conditionType: "paliers_validated_total", conditionParams: { count: 1 }, order: 110 },
  { catalogKey: "gaming_palier_10", name: "Grimpeur de la savane", description: "10 paliers validés, un vrai grimpeur !", icon: "Mountain", rarity: "rare", conditionType: "paliers_validated_total", conditionParams: { count: 10 }, order: 111 },
  { catalogKey: "gaming_palier_30", name: "Conquérant", description: "30 paliers validés — la savane t'applaudit.", icon: "Medal", rarity: "epic", conditionType: "paliers_validated_total", conditionParams: { count: 30 }, order: 112 },
  // --- Carte / zones ---
  { catalogKey: "gaming_explorer_3", name: "Explorateur de zones", description: "Tu as commencé l'aventure dans 3 matières différentes.", icon: "Map", rarity: "rare", conditionType: "subjects_started", conditionParams: { count: 3 }, order: 120 },
  { catalogKey: "gaming_zone_master", name: "Zone conquise", description: "Toutes les thématiques d'une matière terminées !", icon: "Compass", rarity: "epic", conditionType: "subject_full_complete", conditionParams: {}, order: 121 },
  // --- Série & rythme ---
  { catalogKey: "gaming_streak_7", name: "Semaine de feu", description: "7 jours d'affilée à apprendre.", icon: "Flame", rarity: "rare", conditionType: "streak_days", conditionParams: { count: 7 }, order: 130 },
  { catalogKey: "gaming_streak_30", name: "Flamme éternelle", description: "30 jours d'affilée — rien ne t'arrête.", icon: "Flame", rarity: "legendary", conditionType: "streak_days", conditionParams: { count: 30 }, order: 131 },
  { catalogKey: "gaming_early_bird", name: "Lève-tôt de la savane", description: "Un exercice réussi avant 8 h du matin.", icon: "Sunrise", rarity: "rare", conditionType: "early_bird", conditionParams: {}, order: 132 },
  // --- Volume ---
  { catalogKey: "gaming_correct_100", name: "Centurion", description: "100 bonnes réponses en tout. Championne, champion !", icon: "Star", rarity: "epic", conditionType: "exercises_correct_total", conditionParams: { count: 100 }, order: 140 },
];

export const seedGamingBadges = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("badges").take(200);
    const byCatalogKey = new Map(
      existing.filter((b) => b.catalogKey).map((b) => [b.catalogKey!, b]),
    );
    const created: string[] = [];
    const updated: string[] = [];
    for (const def of GAMING_BADGES) {
      const row = byCatalogKey.get(def.catalogKey);
      const fields = {
        name: def.name,
        description: def.description,
        icon: def.icon,
        condition: def.conditionType, // compat affichage legacy
        catalogKey: def.catalogKey,
        category: "gaming",
        conditionType: def.conditionType,
        conditionParams: def.conditionParams,
        rarity: def.rarity,
        source: "seed-gaming",
        order: def.order,
      };
      if (row) {
        await ctx.db.patch(row._id, fields);
        updated.push(def.catalogKey);
      } else {
        await ctx.db.insert("badges", fields);
        created.push(def.catalogKey);
      }
    }
    return { created, updated };
  },
});

// ---------------------------------------------------------------------------
// Internal mutation: check and award badges after exercise/topic completion
// ---------------------------------------------------------------------------

export const checkAndAward = internalMutation({
  args: {
    studentId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const { studentId } = args;

    // Get all badge definitions
    const allBadges = await ctx.db.query("badges").take(100);

    // Get all already-earned badges for this student
    const alreadyEarned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(100);
    const earnedBadgeIds = new Set(alreadyEarned.map((eb) => eb.badgeId));

    // Get student's topic progress
    const allProgress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(200);

    // ------------------------------------------------------------------
    // Redesign Gaming — instantané borné pour l'évaluateur data-driven.
    // Calculé UNE fois par passage, quel que soit le nombre de badges.
    // ------------------------------------------------------------------
    const palierAttempts = await ctx.db
      .query("palierAttempts")
      .withIndex("by_user", (q) => q.eq("userId", studentId))
      .take(500);
    const validatedAttempts = palierAttempts.filter(
      (a) => a.status === "validated",
    );

    // Matières commencées = matières des paliers tentés (docs paliers uniques).
    const uniquePalierIds = Array.from(
      new Set(palierAttempts.map((a) => a.palierId as string)),
    );
    const startedSubjects = new Set<string>();
    const palierSubjectById = new Map<string, string>();
    for (const pid of uniquePalierIds) {
      const palier = await ctx.db.get(pid as (typeof palierAttempts)[number]["palierId"]);
      if (palier) {
        startedSubjects.add(palier.subjectId as string);
        palierSubjectById.set(pid, palier.subjectId as string);
      }
    }

    // Une matière entièrement terminée ? (toutes ses thématiques complétées)
    const completedTopicIds = new Set(
      allProgress
        .filter((p) => p.completedAt != null)
        .map((p) => p.topicId as string),
    );
    let hasFullSubjectComplete = false;
    for (const subjectId of startedSubjects) {
      const topicsInSubject = await ctx.db
        .query("topics")
        .withIndex("by_subjectId", (q) =>
          q.eq("subjectId", subjectId as never),
        )
        .take(200);
      if (
        topicsInSubject.length > 0 &&
        topicsInSubject.every((t) => completedTopicIds.has(t._id as string))
      ) {
        hasFullSubjectComplete = true;
        break;
      }
    }

    // Série (stockée dans les préférences du profil — voir streak.ts).
    const profile = await ctx.db.get(studentId);
    const prefs = profile ? readStudentPreferences(profile) : {};
    const longestStreak = prefs.streak?.longest ?? 0;

    // Quêtes quotidiennes (G7) — total complétées + journées parfaites.
    const questRows = await ctx.db
      .query("dailyQuests")
      .withIndex("by_student_day", (q) => q.eq("studentId", studentId))
      .take(400);
    const questsCompletedTotal = questRows.reduce(
      (acc, row) =>
        acc + row.quests.filter((q) => q.completedAt !== undefined).length,
      0,
    );
    const perfectQuestDays = questRows.filter(
      (row) => row.allCompletedAt !== undefined,
    ).length;

    // Lève-tôt — un exercice soumis entre 5 h et 8 h (Sénégal = UTC).
    const recentAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(200);
    const hasEarlyBirdAttempt = recentAttempts.some((a) => {
      const hour = new Date(a.submittedAt).getUTCHours();
      return a.attemptNumber > 0 && hour >= 5 && hour < 8;
    });

    const stats: BadgeStatsSnapshot = {
      totalCorrectExercises: allProgress.reduce(
        (s, p) => s + p.correctExercises,
        0,
      ),
      topicsCompleted: completedTopicIds.size,
      paliersValidated: validatedAttempts.length,
      subjectsStarted: startedSubjects.size,
      hasFullSubjectComplete,
      longestStreak,
      questsCompletedTotal,
      perfectQuestDays,
      hasEarlyBirdAttempt,
    };

    const newlyAwarded: Array<{
      badgeId: string;
      name: string;
      description: string;
      icon: string;
    }> = [];

    for (const badge of allBadges) {
      // Skip already earned
      if (earnedBadgeIds.has(badge._id)) continue;

      // Redesign Gaming — les badges du catalogue data-driven passent par
      // l'évaluateur ; les 3 conditions historiques restent en dessous.
      if (badge.conditionType) {
        if (
          evaluateConditionType(
            badge.conditionType,
            badge.conditionParams,
            stats,
          )
        ) {
          await ctx.db.insert("earnedBadges", {
            badgeId: badge._id,
            studentId,
            earnedAt: Date.now(),
          });
          newlyAwarded.push({
            badgeId: badge._id as string,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
          });
        }
        continue;
      }

      let deserved = false;

      switch (badge.condition) {
        case "complete_topic": {
          // Student has at least one completed topic
          const completed = allProgress.filter((p) => p.completedAt != null);
          if (badge.subjectId) {
            // Check completion in a specific subject
            const topicsInSubject = await ctx.db
              .query("topics")
              .withIndex("by_subjectId", (q) =>
                q.eq("subjectId", badge.subjectId!),
              )
              .take(200);
            const topicIds = new Set(topicsInSubject.map((t) => t._id));
            deserved = completed.some((p) => topicIds.has(p.topicId));
          } else {
            deserved = completed.length > 0;
          }
          break;
        }

        case "perfect_score": {
          // Student completed a topic with correctExercises === completedExercises
          const perfectTopics = allProgress.filter(
            (p) =>
              p.completedAt != null &&
              p.completedExercises > 0 &&
              p.correctExercises === p.completedExercises,
          );
          if (badge.subjectId) {
            const topicsInSubject = await ctx.db
              .query("topics")
              .withIndex("by_subjectId", (q) =>
                q.eq("subjectId", badge.subjectId!),
              )
              .take(200);
            const topicIds = new Set(topicsInSubject.map((t) => t._id));
            deserved = perfectTopics.some((p) => topicIds.has(p.topicId));
          } else {
            deserved = perfectTopics.length > 0;
          }
          break;
        }

        case "streak_3": {
          // Student has 3 consecutive topics completed (by completedAt timestamp)
          const completedSorted = allProgress
            .filter((p) => p.completedAt != null)
            .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

          if (completedSorted.length >= 3) {
            // Check if any 3 consecutive entries exist
            // "Consecutive" means 3 in a row with no gaps in the sorted list
            deserved = true;
          }
          break;
        }

        default:
          // Unknown condition, skip
          break;
      }

      if (deserved) {
        await ctx.db.insert("earnedBadges", {
          badgeId: badge._id,
          studentId,
          earnedAt: Date.now(),
        });
        newlyAwarded.push({
          badgeId: badge._id as string,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        });
      }
    }

    return newlyAwarded;
  },
});
