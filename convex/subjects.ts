import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects.sort((a, b) => a.order - b.order);
  },
});

export const getById = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subjects", {
      name: args.name,
      icon: args.icon,
      color: args.color,
      order: args.order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subjects"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Matière introuvable");
    }
    // Filter out undefined fields
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
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    // Check if any topics reference this subject
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", args.id))
      .first();
    if (topics) {
      throw new Error(
        "Impossible de supprimer cette matière car elle contient des thématiques.",
      );
    }
    await ctx.db.delete(args.id);
  },
});
