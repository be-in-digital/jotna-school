/**
 * Admin settings (singleton).
 *
 * Decisions: 4, 45, 69, 70, 76.
 *   - aiMonthlyBudgetUsd (default 100)
 *   - economyMode (auto-on at >=90% spend; admin can force-on)
 *   - dailyMoreLimitPerKid (default 3, range 1..10)
 *   - modelOverrides (per-purpose model id swap, Decision 76)
 *
 * Auth: every mutation requires role=admin. Queries return null if not admin.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { DatabaseReader } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "../_generated/dataModel";

const SINGLETON = "settings" as const;

async function loadAdminProfile(
  ctx: { db: DatabaseReader },
  userIdRaw: string,
): Promise<Doc<"profiles"> | null> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userIdRaw))
    .unique();
  if (!profile) return null;
  if (profile.role !== "admin") return null;
  return profile;
}

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_singleton", (q) => q.eq("singleton", SINGLETON))
      .unique();
    if (row) return row;
    // Return a synthetic default — caller mutates to persist on first save.
    return {
      _id: null,
      _creationTime: 0,
      singleton: SINGLETON,
      aiMonthlyBudgetUsd: 100,
      economyMode: false,
      dailyMoreLimitPerKid: 3,
      modelOverrides: undefined,
      updatedAt: 0,
    };
  },
});

export const updateSettings = mutation({
  args: {
    aiMonthlyBudgetUsd: v.optional(v.number()),
    economyMode: v.optional(v.boolean()),
    dailyMoreLimitPerKid: v.optional(v.number()),
    modelOverrides: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const admin = await loadAdminProfile(ctx, userId as string);
    if (!admin) throw new Error("Accès refusé (admin uniquement)");

    if (args.dailyMoreLimitPerKid !== undefined) {
      if (args.dailyMoreLimitPerKid < 1 || args.dailyMoreLimitPerKid > 10) {
        throw new Error("dailyMoreLimitPerKid hors plage (1..10)");
      }
    }
    if (args.aiMonthlyBudgetUsd !== undefined && args.aiMonthlyBudgetUsd < 0) {
      throw new Error("Budget négatif refusé");
    }

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_singleton", (q) => q.eq("singleton", SINGLETON))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        aiMonthlyBudgetUsd: args.aiMonthlyBudgetUsd ?? existing.aiMonthlyBudgetUsd,
        economyMode: args.economyMode ?? existing.economyMode,
        dailyMoreLimitPerKid:
          args.dailyMoreLimitPerKid ?? existing.dailyMoreLimitPerKid,
        modelOverrides: args.modelOverrides ?? existing.modelOverrides,
        updatedAt: Date.now(),
        updatedBy: admin._id,
      });
      return existing._id;
    }
    return await ctx.db.insert("settings", {
      singleton: SINGLETON,
      aiMonthlyBudgetUsd: args.aiMonthlyBudgetUsd ?? 100,
      economyMode: args.economyMode ?? false,
      dailyMoreLimitPerKid: args.dailyMoreLimitPerKid ?? 3,
      modelOverrides: args.modelOverrides,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    });
  },
});

export const getMonthSpendSummary = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const admin = await loadAdminProfile(ctx, userId as string);
    if (!admin) return null;

    const month =
      args.month ??
      (() => {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      })();

    const rows = await ctx.db
      .query("aiUsage")
      .withIndex("by_month", (q) => q.eq("month", month))
      .take(1000);

    let total = 0;
    let calls = 0;
    let failed = 0;
    let rejectedBudget = 0;
    let rejectedQuota = 0;
    const byPurpose: Record<string, { calls: number; cost: number }> = {};
    for (const r of rows) {
      calls++;
      if (r.status === "ok") total += r.costUsd;
      if (r.status === "failed") failed++;
      if (r.status === "rejected_budget") rejectedBudget++;
      if (r.status === "rejected_quota") rejectedQuota++;
      if (!byPurpose[r.purpose]) byPurpose[r.purpose] = { calls: 0, cost: 0 };
      byPurpose[r.purpose].calls++;
      byPurpose[r.purpose].cost += r.costUsd;
    }
    return {
      month,
      total,
      calls,
      failed,
      rejectedBudget,
      rejectedQuota,
      byPurpose,
    };
  },
});

export const listRecentIncidents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const admin = await loadAdminProfile(ctx, userId as string);
    if (!admin) return [];
    const limit = args.limit ?? 10;
    const month = (() => {
      const d = new Date();
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    })();
    const rows = await ctx.db
      .query("aiUsage")
      .withIndex("by_month_status", (q) =>
        q.eq("month", month).eq("status", "failed"),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});
