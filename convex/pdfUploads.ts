import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List all PDF uploads, most recent first. Includes subject name. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const uploads = await ctx.db.query("pdfUploads").order("desc").collect();

    const results = await Promise.all(
      uploads.map(async (upload) => {
        const subject = await ctx.db.get(upload.subjectId);
        return {
          ...upload,
          subjectName: subject?.name ?? "Inconnu",
        };
      }),
    );

    return results;
  },
});

/**
 * List PDF uploads owned by the current teacher (adminId === profile._id).
 * Returns [] if not a teacher/admin or unauthenticated.
 */
export const listByTeacher = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];
    if (profile.role !== "professeur" && profile.role !== "admin") return [];

    const uploads = await ctx.db.query("pdfUploads").order("desc").collect();
    const mine = uploads.filter((u) => u.adminId === profile._id);

    const results = await Promise.all(
      mine.map(async (upload) => {
        const subject = await ctx.db.get(upload.subjectId);
        return {
          ...upload,
          subjectName: subject?.name ?? "Inconnu",
        };
      }),
    );

    return results;
  },
});

/** Get a single upload by ID, including the count of generated exercises. */
export const getById = query({
  args: { id: v.id("pdfUploads") },
  handler: async (ctx, { id }) => {
    const upload = await ctx.db.get(id);
    if (!upload) return null;

    const subject = await ctx.db.get(upload.subjectId);

    // Count exercises generated from this upload
    const exercises = await ctx.db
      .query("exercises")
      .filter((q) => q.eq(q.field("sourcePdfUploadId"), id))
      .collect();

    return {
      ...upload,
      subjectName: subject?.name ?? "Inconnu",
      exercisesCount: exercises.length,
      exercises,
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Generate a Convex storage upload URL. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Create a PDF upload record and schedule AI extraction. */
export const create = mutation({
  args: {
    adminId: v.id("profiles"),
    storageId: v.string(),
    originalFilename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const uploadId = await ctx.db.insert("pdfUploads", {
      adminId: args.adminId,
      storageId: args.storageId,
      originalFilename: args.originalFilename,
      mimeType: args.mimeType,
      size: args.size,
      subjectId: args.subjectId,
      status: "uploaded",
    });

    // Schedule the extraction immediately
    await ctx.scheduler.runAfter(0, internal.pdfUploadsExtract.extract, { uploadId });

    return uploadId;
  },
});

/** Delete a PDF upload and its associated exercises. */
export const remove = mutation({
  args: { id: v.id("pdfUploads") },
  handler: async (ctx, { id }) => {
    const upload = await ctx.db.get(id);
    if (!upload) return;

    // Delete associated exercises
    const exercises = await ctx.db
      .query("exercises")
      .filter((q) => q.eq(q.field("sourcePdfUploadId"), id))
      .collect();

    for (const exercise of exercises) {
      await ctx.db.delete(exercise._id);
    }

    // Delete the storage file
    try {
      await ctx.storage.delete(upload.storageId as any);
    } catch {
      // Storage file may already be deleted
    }

    // Delete the upload record
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Internal mutations for updating status
// ---------------------------------------------------------------------------

/** Mark an upload as extracted with raw data. */
export const markExtracted = internalMutation({
  args: {
    uploadId: v.id("pdfUploads"),
    extractedRaw: v.any(),
    extractedAt: v.number(),
  },
  handler: async (ctx, { uploadId, extractedRaw, extractedAt }) => {
    await ctx.db.patch(uploadId, {
      status: "extracted",
      extractedRaw,
      extractedAt,
    });
  },
});

/** Mark an upload as errored with error info. */
export const markError = internalMutation({
  args: {
    uploadId: v.id("pdfUploads"),
    error: v.string(),
  },
  handler: async (ctx, { uploadId, error }) => {
    await ctx.db.patch(uploadId, {
      extractedRaw: { error },
    });
  },
});

/** Create draft exercises from extracted data. */
export const createDraftExercises = internalMutation({
  args: {
    uploadId: v.id("pdfUploads"),
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
      }),
    ),
    subjectId: v.id("subjects"),
    suggestedTopicName: v.optional(v.string()),
  },
  handler: async (ctx, { uploadId, exercises, subjectId, suggestedTopicName }) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", subjectId))
      .collect();

    // Resolve a target topic in this order:
    // 1. If the IA suggested a topic name and one already exists (case-insensitive match) → reuse it
    // 2. If the IA suggested a topic name → create a new topic with that name
    // 3. Else fall back to the first existing topic
    // 4. Else create a "Général" topic as last resort
    let targetTopicId;

    const suggested = suggestedTopicName?.trim();
    if (suggested) {
      const normalized = suggested.toLowerCase();
      const existing = topics.find((t) => t.name.toLowerCase() === normalized);
      if (existing) {
        targetTopicId = existing._id;
      } else {
        targetTopicId = await ctx.db.insert("topics", {
          subjectId,
          name: suggested,
          description: `Thème identifié automatiquement lors de l'import d'un PDF.`,
          order: topics.length + 1,
        });
      }
    } else if (topics.length > 0) {
      targetTopicId = topics[0]._id;
    } else {
      targetTopicId = await ctx.db.insert("topics", {
        subjectId,
        name: "Général",
        description:
          "Thème créé automatiquement lors de l'import d'un PDF. Vous pouvez le renommer ou le réorganiser.",
        order: 1,
      });
    }

    const defaultTopicId = targetTopicId;

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await ctx.db.insert("exercises", {
        topicId: defaultTopicId,
        type: ex.type,
        prompt: ex.prompt,
        payload: ex.payload,
        answerKey: ex.answerKey,
        hints: ex.hints,
        order: i + 1,
        status: "draft",
        version: 1,
        sourcePdfUploadId: uploadId,
        generatedBy: "ai",
      });
    }
  },
});

// NOTE: the internalAction `extract` lives in convex/pdfUploadsExtract.ts
// (Node runtime) so it can use Node's `Buffer` to base64-encode the PDF.

// ---------------------------------------------------------------------------
// Internal query (used by the extract action)
// ---------------------------------------------------------------------------

/** Get upload document for internal use. */
export const getUploadInternal = internalQuery({
  args: { uploadId: v.id("pdfUploads") },
  handler: async (ctx, { uploadId }) => {
    return await ctx.db.get(uploadId);
  },
});
