import { v } from "convex/values";
import {
  query,
  mutation,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import {
  exerciseExtractionSchema,
  type ExtractionResponse,
} from "../lib/openai-schema";

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
    await ctx.scheduler.runAfter(0, internal.pdfUploads.extract, { uploadId });

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
  },
  handler: async (ctx, { uploadId, exercises, subjectId }) => {
    // Find or use the first topic for this subject as a default
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", subjectId))
      .collect();

    const defaultTopicId = topics[0]?._id;
    if (!defaultTopicId) {
      throw new Error(
        `Aucun thème trouvé pour la matière. Créez d'abord un thème.`,
      );
    }

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

// ---------------------------------------------------------------------------
// Internal action: AI extraction
// ---------------------------------------------------------------------------

/** Fetch PDF content, call OpenAI GPT-4, and create draft exercises. */
export const extract = internalAction({
  args: { uploadId: v.id("pdfUploads") },
  handler: async (ctx, { uploadId }) => {
    // 1. Get the upload document
    const upload = await ctx.runQuery(internal.pdfUploads.getUploadInternal, {
      uploadId,
    });
    if (!upload) {
      await ctx.runMutation(internal.pdfUploads.markError, {
        uploadId,
        error: "Upload introuvable.",
      });
      return;
    }

    try {
      // 2. Get the file URL
      const fileUrl = await ctx.storage.getUrl(upload.storageId);
      if (!fileUrl) {
        throw new Error("Impossible de récupérer l'URL du fichier.");
      }

      // 3. Fetch the file content
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement du fichier: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString("base64");

      // 4. Call OpenAI GPT-4 with Structured Outputs
      const openai = new OpenAI();

      const completion = await openai.responses.create({
        model: "gpt-4o",
        store: false,
        instructions: `Tu es un assistant pédagogique spécialisé dans la création d'exercices pour les élèves de CE2 à CM2 (8-11 ans).
Analyse le document PDF fourni et extrais tous les exercices que tu peux identifier.
Pour chaque exercice, détermine le type le plus approprié parmi:
- qcm: Question à choix multiples. Payload: {options: string[], correctIndex: number, explanation?: string}
- match: Association de paires. Payload: {pairs: [{left: string, right: string}]}
- order: Remise en ordre. Payload: {correctSequence: string[]}
- drag-drop: Glisser-déposer dans des zones. Payload: {zones: string[], items: [{text: string, correctZone: string}]}
- short-answer: Réponse courte. Payload: {acceptedAnswers: string[], tolerance?: string}

Pour chaque exercice, fournis:
- Un énoncé clair adapté au niveau CE2-CM2
- Le payload correspondant au type choisi
- La réponse correcte sous forme lisible (answerKey)
- Exactement 3 indices progressifs (du plus vague au plus précis)

Si le document ne contient pas d'exercices identifiables, crée des exercices pertinents basés sur le contenu du document.`,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file" as const,
                filename: upload.originalFilename,
                file_data: `data:${upload.mimeType};base64,${base64Content}`,
              },
              {
                type: "input_text" as const,
                text: `Analyse ce document PDF et extrais les exercices pour le niveau CE2-CM2. Nom du fichier: ${upload.originalFilename}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            ...exerciseExtractionSchema,
          },
        },
      });

      // Parse the response
      const outputText = completion.output_text;
      const extraction: ExtractionResponse = JSON.parse(outputText);

      // 5. Store the raw extraction and mark as extracted
      await ctx.runMutation(internal.pdfUploads.markExtracted, {
        uploadId,
        extractedRaw: extraction,
        extractedAt: Date.now(),
      });

      // 6. Create draft exercises
      if (extraction.exercises.length > 0) {
        await ctx.runMutation(internal.pdfUploads.createDraftExercises, {
          uploadId,
          exercises: extraction.exercises,
          subjectId: upload.subjectId,
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Extraction error:", message);
      await ctx.runMutation(internal.pdfUploads.markError, {
        uploadId,
        error: message,
      });
    }
  },
});

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
