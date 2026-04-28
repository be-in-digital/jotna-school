import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const BATCH_SIZE = 100;

// One-shot migration to lowercase email values written before
// `convex/auth.ts` started normalizing on every signIn/signUp/reset.
// Run via Convex dashboard: `npx convex run migrations:lowercaseEmails`.
//
// Order matters: we migrate `users.email` first, then chain into
// `authAccounts.providerAccountId` (where provider === "password"),
// since the auth library uses the latter as the canonical lookup key.
export const lowercaseEmails = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    updated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("users").paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    });

    let updated = args.updated ?? 0;
    for (const user of result.page) {
      if (!user.email) continue;
      const lower = user.email.toLowerCase();
      if (lower === user.email) continue;
      await ctx.db.patch(user._id, { email: lower });
      updated++;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.lowercaseEmails, {
        cursor: result.continueCursor,
        updated,
      });
      return { phase: "users", updated, isDone: false };
    }

    await ctx.scheduler.runAfter(
      0,
      internal.migrations.lowercaseAuthAccounts,
      { cursor: null, updated: 0 },
    );
    return { phase: "users", updated, isDone: true };
  },
});

export const lowercaseAuthAccounts = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    updated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("authAccounts").paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    });

    let updated = args.updated ?? 0;
    for (const account of result.page) {
      if (account.provider !== "password") continue;
      const lower = account.providerAccountId.toLowerCase();
      if (lower === account.providerAccountId) continue;

      // Refuse to silently merge two accounts that differ only in casing.
      const collision = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", lower),
        )
        .unique();
      if (collision !== null) {
        throw new Error(
          `Email collision on lowercase: account ${account._id} (${account.providerAccountId}) ` +
            `would clash with existing account ${collision._id} (${lower}). ` +
            `Resolve manually before re-running the migration.`,
        );
      }

      await ctx.db.patch(account._id, { providerAccountId: lower });
      updated++;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.lowercaseAuthAccounts,
        { cursor: result.continueCursor, updated },
      );
    }

    return { phase: "authAccounts", updated, isDone: result.isDone };
  },
});
