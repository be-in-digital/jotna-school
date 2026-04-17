import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listByTopic = query({
  args: {
    topicId: v.id("topics"),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("all")),
    ),
  },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_topicId", (q) => q.eq("topicId", args.topicId))
      .collect();

    const statusFilter = args.status ?? "all";

    const filtered =
      statusFilter === "all"
        ? exercises
        : exercises.filter((e) => e.status === statusFilter);

    return filtered.sort((a, b) => a.order - b.order);
  },
});

export const listAllDrafts = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    return exercises.filter((e) => e.status === "draft");
  },
});

export const listAllPublished = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    return exercises.filter((e) => e.status === "published");
  },
});

export const getById = query({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    topicId: v.id("topics"),
    type: v.union(
      v.literal("qcm"),
      v.literal("drag-drop"),
      v.literal("match"),
      v.literal("order"),
      v.literal("short-answer"),
    ),
    prompt: v.string(),
    payload: v.any(),
    answerKey: v.string(),
    hints: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) {
      throw new Error("Thématique introuvable");
    }
    return await ctx.db.insert("exercises", {
      topicId: args.topicId,
      type: args.type,
      prompt: args.prompt,
      payload: args.payload,
      answerKey: args.answerKey,
      hints: args.hints,
      order: args.order,
      status: "draft",
      version: 1,
      generatedBy: "manual",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("exercises"),
    type: v.optional(
      v.union(
        v.literal("qcm"),
        v.literal("drag-drop"),
        v.literal("match"),
        v.literal("order"),
        v.literal("short-answer"),
      ),
    ),
    prompt: v.optional(v.string()),
    payload: v.optional(v.any()),
    answerKey: v.optional(v.string()),
    hints: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Exercice introuvable");
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    // Increment version on each update
    updates.version = existing.version + 1;

    await ctx.db.patch(id, updates);
  },
});

export const publish = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Exercice introuvable");
    }
    await ctx.db.patch(args.id, {
      status: "published",
      publishedAt: Date.now(),
    });
  },
});

export const unpublish = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Exercice introuvable");
    }
    await ctx.db.patch(args.id, {
      status: "draft",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Exercice introuvable");
    }

    // Check if any attempts reference this exercise
    const attempt = await ctx.db
      .query("attempts")
      .filter((q) => q.eq(q.field("exerciseId"), args.id))
      .first();
    if (attempt) {
      throw new Error(
        "Impossible de supprimer cet exercice car des tentatives y sont associées.",
      );
    }

    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Internal mutation: create drafts from AI extraction
// ---------------------------------------------------------------------------

export const createDrafts = internalMutation({
  args: {
    topicId: v.id("topics"),
    sourcePdfUploadId: v.id("pdfUploads"),
    exercises: v.array(
      v.object({
        type: v.union(
          v.literal("qcm"),
          v.literal("drag-drop"),
          v.literal("match"),
          v.literal("order"),
          v.literal("short-answer"),
        ),
        prompt: v.string(),
        payload: v.any(),
        answerKey: v.string(),
        hints: v.array(v.string()),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) {
      throw new Error("Thématique introuvable");
    }

    const ids = [];
    for (const exercise of args.exercises) {
      const id = await ctx.db.insert("exercises", {
        topicId: args.topicId,
        type: exercise.type,
        prompt: exercise.prompt,
        payload: exercise.payload,
        answerKey: exercise.answerKey,
        hints: exercise.hints,
        order: exercise.order,
        status: "draft",
        version: 1,
        generatedBy: "ai",
        sourcePdfUploadId: args.sourcePdfUploadId,
      });
      ids.push(id);
    }

    return ids;
  },
});
