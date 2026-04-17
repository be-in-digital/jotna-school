import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("badges").collect();
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
      .collect();

    // Join with badges table for full info
    const results = [];
    for (const eb of earned) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        results.push({
          ...eb,
          badge,
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
// Internal mutation: check and award badges after exercise/topic completion
// ---------------------------------------------------------------------------

export const checkAndAward = internalMutation({
  args: {
    studentId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const { studentId } = args;

    // Get all badge definitions
    const allBadges = await ctx.db.query("badges").collect();

    // Get all already-earned badges for this student
    const alreadyEarned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .collect();
    const earnedBadgeIds = new Set(alreadyEarned.map((eb) => eb.badgeId));

    // Get student's topic progress
    const allProgress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .collect();

    const newlyAwarded: Array<{
      badgeId: string;
      name: string;
      description: string;
      icon: string;
    }> = [];

    for (const badge of allBadges) {
      // Skip already earned
      if (earnedBadgeIds.has(badge._id)) continue;

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
              .collect();
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
              .collect();
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
