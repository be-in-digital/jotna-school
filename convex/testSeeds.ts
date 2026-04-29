/**
 * Test seeds — MVP-1 minimum data set for local + Playwright testing.
 *
 * Idempotent. Safe to run multiple times. Use:
 *   npx convex run testSeeds:seedMvp1
 *
 * Creates :
 *   - Subject "Mathématiques" (if not already there)
 *   - Topic "Fractions" with class CE2
 *   - Topic "Multiplication" with class CM1
 *
 * Does NOT create users — register via /register UI.
 */

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Debug query — list recent aiUsage rows + paliers state + users. */
export const debugStatus = query({
  args: {},
  handler: async (ctx) => {
    const aiUsage = await ctx.db.query("aiUsage").order("desc").take(10);
    const paliers = await ctx.db.query("paliers").collect();
    const exercises = await ctx.db.query("exercises").take(5);
    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("profiles").collect();
    return {
      recentAiUsage: aiUsage.map((r) => ({
        purpose: r.purpose,
        status: r.status,
        modelUsed: r.modelUsed,
        costUsd: r.costUsd,
        latencyMs: r.latencyMs,
        errorMessage: r.errorMessage,
        traceId: r.traceId,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
      paliersCount: paliers.length,
      paliers: paliers.map((p) => ({
        _id: p._id,
        status: p.status,
        qaStatus: p.qaStatus,
        generatedAt: p.generatedAt
          ? new Date(p.generatedAt).toISOString()
          : null,
      })),
      exercisesCount: exercises.length,
      usersCount: users.length,
      profilesCount: profiles.length,
      latestUsers: users.slice(-3).map((u) => ({
        email: u.email,
        name: u.name,
      })),
    };
  },
});

export const seedMvp1 = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Subject Mathématiques
    const subjects = await ctx.db.query("subjects").collect();
    let mathsId: Id<"subjects">;
    const existingMaths = subjects.find(
      (s) => s.name.toLowerCase().includes("math"),
    );
    if (existingMaths) {
      mathsId = existingMaths._id;
    } else {
      mathsId = await ctx.db.insert("subjects", {
        name: "Mathématiques",
        icon: "Calculator",
        color: "#4f46e5",
        order: 1,
      });
    }

    // 2. Topics with class field
    const topicsToCreate: Array<{
      name: string;
      class: "CI" | "CP" | "CE1" | "CE2" | "CM1" | "CM2";
      description: string;
    }> = [
      {
        name: "Fractions",
        class: "CE2",
        description: "Découverte des fractions simples",
      },
      {
        name: "Multiplication",
        class: "CM1",
        description: "Tables et multiplications à 2 chiffres",
      },
    ];

    const existingTopics = await ctx.db
      .query("topics")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", mathsId))
      .collect();

    const created: Array<{ topic: string; class: string; id: string }> = [];
    const skipped: string[] = [];

    let order = existingTopics.length;
    for (const t of topicsToCreate) {
      const exists = existingTopics.find(
        (et) => et.name === t.name && et.class === t.class,
      );
      if (exists) {
        skipped.push(`${t.name} (${t.class})`);
        continue;
      }
      const id = await ctx.db.insert("topics", {
        subjectId: mathsId,
        name: t.name,
        order: ++order,
        description: t.description,
        class: t.class,
      });
      created.push({ topic: t.name, class: t.class, id });
    }

    // Ensure settings singleton exists
    const existingSettings = await ctx.db
      .query("settings")
      .withIndex("by_singleton", (q) => q.eq("singleton", "settings"))
      .unique();
    if (!existingSettings) {
      await ctx.db.insert("settings", {
        singleton: "settings",
        aiMonthlyBudgetUsd: 100,
        economyMode: false,
        dailyMoreLimitPerKid: 3,
        updatedAt: Date.now(),
      });
    }

    return {
      mathsId,
      topicsCreated: created,
      topicsSkipped: skipped,
      settingsExisted: !!existingSettings,
    };
  },
});
