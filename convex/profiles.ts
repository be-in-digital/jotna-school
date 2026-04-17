import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get the current user's profile using Convex Auth identity.
 * Returns null if no user is signed in or no profile exists yet.
 */
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

/** Get all student profiles linked to a guardian via studentGuardians. */
export const getChildren = query({
  args: { guardianId: v.id("profiles") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("studentGuardians")
      .withIndex("by_guardianId", (q) => q.eq("guardianId", args.guardianId))
      .collect();

    const children = await Promise.all(
      links.map(async (link) => {
        const profile = await ctx.db.get(link.studentId);
        return profile ? { ...profile, relation: link.relation } : null;
      }),
    );

    return children.filter(Boolean);
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new student profile and link it to the guardian via studentGuardians. */
export const createChildProfile = mutation({
  args: {
    guardianId: v.id("profiles"),
    name: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Create the student profile
    const studentId = await ctx.db.insert("profiles", {
      userId: args.userId,
      role: "student",
      name: args.name,
    });

    // Create the guardian ↔ student link
    await ctx.db.insert("studentGuardians", {
      studentId,
      guardianId: args.guardianId,
      relation: "parent",
    });

    return studentId;
  },
});

/** Update an existing profile (name, avatar). */
export const updateProfile = mutation({
  args: {
    id: v.id("profiles"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    preferences: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Profil introuvable");
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

/** Create a studentGuardian relation between an existing student and guardian. */
export const linkChild = mutation({
  args: {
    studentId: v.id("profiles"),
    guardianId: v.id("profiles"),
    relation: v.union(
      v.literal("parent"),
      v.literal("tuteur"),
      v.literal("professeur"),
    ),
  },
  handler: async (ctx, args) => {
    // Verify both profiles exist
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Profil étudiant introuvable");
    }
    const guardian = await ctx.db.get(args.guardianId);
    if (!guardian) {
      throw new Error("Profil tuteur introuvable");
    }

    // Check if relation already exists
    const existing = await ctx.db
      .query("studentGuardians")
      .withIndex("by_guardianId", (q) => q.eq("guardianId", args.guardianId))
      .collect();

    const alreadyLinked = existing.find(
      (link) => link.studentId === args.studentId,
    );
    if (alreadyLinked) {
      throw new Error("Ce lien parent-enfant existe déjà");
    }

    return await ctx.db.insert("studentGuardians", {
      studentId: args.studentId,
      guardianId: args.guardianId,
      relation: args.relation,
    });
  },
});
