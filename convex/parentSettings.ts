import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ===========================================================================
// Réglages bien-être par enfant (Decision 84) — enfin exposés aux parents.
// Défauts : tout activé (D7 — la règle conservatrice s'applique côté lecture :
// un parent explicitement à false l'emporte).
// ===========================================================================

async function getParentProfile(
  ctx: QueryCtx | MutationCtx,
  userId: string,
) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!profile || (profile.role !== "parent" && profile.role !== "professeur"))
    return null;
  return profile;
}

export const getMyKidsSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const parent = await getParentProfile(ctx, userId as string);
    if (!parent) return null;

    const links = await ctx.db
      .query("studentGuardians")
      .withIndex("by_guardianId", (q) => q.eq("guardianId", parent._id))
      .take(20);

    const kids = [];
    for (const link of links) {
      const kid = await ctx.db.get(link.studentId);
      if (!kid) continue;
      const settings = await ctx.db
        .query("parentSettings")
        .withIndex("by_parent_kid", (q) =>
          q.eq("parentId", parent._id).eq("kidId", link.studentId),
        )
        .unique();
      kids.push({
        kidId: kid._id,
        name: kid.name,
        streaksEnabled: settings?.streaksEnabled ?? true,
        dailyMissionEnabled: settings?.dailyMissionEnabled ?? true,
      });
    }
    return kids;
  },
});

export const updateKidSetting = mutation({
  args: {
    kidId: v.id("profiles"),
    field: v.union(
      v.literal("streaksEnabled"),
      v.literal("dailyMissionEnabled"),
    ),
    value: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const parent = await getParentProfile(ctx, userId as string);
    if (!parent) throw new Error("Profil parent introuvable");

    // Sécurité : le parent doit être lié à cet enfant.
    const links = await ctx.db
      .query("studentGuardians")
      .withIndex("by_guardianId", (q) => q.eq("guardianId", parent._id))
      .take(20);
    if (!links.some((l) => (l.studentId as string) === (args.kidId as string))) {
      throw new Error("Enfant non lié à ce compte");
    }

    const existing = await ctx.db
      .query("parentSettings")
      .withIndex("by_parent_kid", (q) =>
        q.eq("parentId", parent._id).eq("kidId", args.kidId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        [args.field]: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("parentSettings", {
        parentId: parent._id,
        kidId: args.kidId as Id<"profiles">,
        streaksEnabled: args.field === "streaksEnabled" ? args.value : true,
        dailyMissionEnabled:
          args.field === "dailyMissionEnabled" ? args.value : true,
        kidPushNotifsEnabled: true,
        parentLowScoreNotifEnabled: true,
        updatedAt: Date.now(),
      });
    }
  },
});
