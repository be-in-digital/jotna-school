/**
 * Server side of the "Pio au tableau" explainer-video pipeline.
 *
 * The heavy work (React → MP4 with Remotion + headless Chrome) cannot run
 * inside Convex, so rendering is done by an external worker
 * (scripts/render-explainer-videos.mjs — locally, in CI, or on a render
 * lambda). This module is the worker's API:
 *
 *   1. `listPending`    — explanations whose audio is ready but video absent
 *   2. `videoUploadUrl` — one-shot upload URL for the rendered MP4
 *   3. `attachVideo`    — attach the stored MP4 to the explanation (first-wins)
 *
 * Videos are produced "en même temps que les exercices": exercise insertion →
 * eager script + TTS audio (explainMistake/explainAudio) → the worker picks
 * the row up and renders. Kids get the narrated in-app player until the MP4
 * lands, then the real video.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export type PendingExplanation = {
  explanationId: Doc<"exerciseExplanations">["_id"];
  exerciseId: Doc<"exercises">["_id"];
  title: string;
  intro: string;
  steps: string[];
  /** Chalk drawings aligned with `steps` (null/absent → chalk-note fallback). */
  boardSpecs: unknown[] | null;
  conclusion: string;
  audioSegments: {
    role: "intro" | "step" | "conclusion";
    text: string;
    url: string;
  }[];
};

export const listPending = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<PendingExplanation[]> => {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 25));
    // Explanations are few (one per exercise, created lazily/eagerly) — a
    // bounded scan of recent rows is fine at this scale.
    const rows = await ctx.db
      .query("exerciseExplanations")
      .order("desc")
      .take(200);

    const now = Date.now();
    const out: PendingExplanation[] = [];
    for (const row of rows) {
      if (out.length >= limit) break;
      if (!row.audio || row.video) continue;
      // A fresh claim means Remotion Lambda is already rendering this one —
      // don't double-pay. Stale claims (crashed render) are picked up again.
      if (row.renderRequestedAt && now - row.renderRequestedAt < 15 * 60 * 1000)
        continue;
      const exercise = await ctx.db.get(row.exerciseId);
      if (!exercise) continue;

      const audioSegments: PendingExplanation["audioSegments"] = [];
      let complete = true;
      for (const seg of row.audio.segments) {
        const url = await ctx.storage.getUrl(seg.storageId);
        if (!url) {
          complete = false;
          break;
        }
        audioSegments.push({ role: seg.role, text: seg.text, url });
      }
      if (!complete) continue;

      out.push({
        explanationId: row._id,
        exerciseId: row.exerciseId,
        title: exercise.prompt,
        intro: row.intro,
        steps: row.steps,
        boardSpecs: row.boardSpecs ?? null,
        conclusion: row.conclusion,
        audioSegments,
      });
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// Render claim — one renderer (Lambda or local worker) per explanation.
// Defined here because mutations can't live in a Node file
// (convex/explainRender.ts is "use node").
// ---------------------------------------------------------------------------

/** A claim older than this is considered a crashed render — re-claimable. */
const CLAIM_STALE_MS = 15 * 60 * 1000;

export const claimRender = internalMutation({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args): Promise<boolean> => {
    const row = await ctx.db.get(args.explanationId);
    if (!row || row.video || !row.audio) return false;
    const now = Date.now();
    if (
      row.renderRequestedAt &&
      now - row.renderRequestedAt < CLAIM_STALE_MS
    ) {
      return false; // another render is in flight
    }
    await ctx.db.patch(args.explanationId, { renderRequestedAt: now });
    return true;
  },
});

export const releaseClaim = internalMutation({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.explanationId);
    if (!row || row.video) return;
    await ctx.db.patch(args.explanationId, { renderRequestedAt: undefined });
  },
});

export const videoUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Ops helper — fetch the rendered MP4 URL of an explanation (or null). */
export const videoUrl = internalQuery({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.explanationId);
    if (!row?.video) return null;
    return await ctx.storage.getUrl(row.video.storageId);
  },
});

/**
 * Ops helper — detach (and delete) a rendered video so the worker re-renders
 * it on its next pass. Used when the video template improves.
 */
export const clearVideo = internalMutation({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.explanationId);
    if (!row?.video) return;
    await ctx.storage.delete(row.video.storageId);
    await ctx.db.patch(args.explanationId, {
      video: undefined,
      renderRequestedAt: undefined,
    });
  },
});

/**
 * Ops helper — delete an explanation entirely (script + audio + video) so the
 * next pregenerate/kid view rebuilds it from scratch. Used when the SCRIPT
 * format improves (e.g. board drawings added).
 */
export const resetExplanation = internalMutation({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.explanationId);
    if (!row) return;
    for (const seg of row.audio?.segments ?? []) {
      await ctx.storage.delete(seg.storageId);
    }
    if (row.video) await ctx.storage.delete(row.video.storageId);
    await ctx.db.delete(args.explanationId);
  },
});

export const attachVideo = internalMutation({
  args: {
    explanationId: v.id("exerciseExplanations"),
    storageId: v.id("_storage"),
    durationSeconds: v.number(),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.explanationId);
    // First writer wins; drop the orphan file on a race or a vanished row.
    if (!row || row.video) {
      await ctx.storage.delete(args.storageId);
      return;
    }
    await ctx.db.patch(args.explanationId, {
      video: {
        storageId: args.storageId,
        durationSeconds: args.durationSeconds,
        width: args.width,
        height: args.height,
        renderedAt: Date.now(),
      },
    });
  },
});
