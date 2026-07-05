"use node";

/**
 * Remotion Lambda path of the "Pio au tableau" video pipeline — fully
 * serverless: the moment an explanation's audio is ready, Convex asks a
 * Remotion Lambda function to render the MP4, polls the render, then stores
 * the file in Convex storage and attaches it to the explanation.
 *
 * Feature-gated by env vars on the Convex deployment (see
 * scripts/deploy-remotion-lambda.mjs which sets them all):
 *   REMOTION_LAMBDA_FUNCTION_NAME  — deployed by `remotion lambda functions deploy`
 *   REMOTION_SERVE_URL             — site bundle from `remotion lambda sites create`
 *   REMOTION_AWS_REGION            — e.g. "us-east-1"
 *   REMOTION_AWS_ACCESS_KEY_ID / REMOTION_AWS_SECRET_ACCESS_KEY
 *
 * When unset, requestRender is a silent no-op and the local worker
 * (scripts/render-explainer-videos.mjs) remains the renderer.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;
const SEGMENT_PAD_S = 0.45;
const MIN_SEGMENT_FRAMES = 2 * FPS;
const TAIL_FRAMES = 24;
const POLL_DELAY_S = 10;
const MAX_POLLS = 40; // ~7 min of polling before giving up

function lambdaEnv() {
  const functionName = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;
  const region = process.env.REMOTION_AWS_REGION;
  const keyId = process.env.REMOTION_AWS_ACCESS_KEY_ID;
  const secret = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;
  if (!functionName || !serveUrl || !region || !keyId || !secret) return null;
  return { functionName, serveUrl, region };
}

/** Mirror of lib/explainBeats.ts pose mapping — keep the two in sync. */
function poseFor(role: string, stepIndex: number): string {
  if (role === "intro") return "hello";
  if (role === "conclusion") return "encourage";
  return stepIndex === 0 ? "amazed" : "think";
}

/** Mirror of lib/explainBeats.ts stripStepPrefix — keep the two in sync. */
function stripStepPrefix(step: string): string {
  return step.replace(/^\s*(étapes?\s*\d+|\d+)\s*[:.)\-–]\s*/i, "").trim();
}

// The render claim (one renderer per explanation) lives in
// convex/explainVideo.ts — mutations can't be defined in a Node file.

// ---------------------------------------------------------------------------
// Render request
// ---------------------------------------------------------------------------

export const requestRender = internalAction({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args): Promise<void> => {
    const env = lambdaEnv();
    if (!env) return; // Lambda not configured — local worker will render

    const row: Doc<"exerciseExplanations"> | null = await ctx.runQuery(
      internal.explainMistake.getById,
      { explanationId: args.explanationId },
    );
    if (!row?.audio || row.video) return;

    const exercise: Doc<"exercises"> | null = await ctx.runQuery(
      internal.explainMistake.getExercise,
      { exerciseId: row.exerciseId },
    );
    if (!exercise) return;

    const claimed: boolean = await ctx.runMutation(
      internal.explainVideo.claimRender,
      { explanationId: args.explanationId },
    );
    if (!claimed) return;

    try {
      // Build the composition props (same shape as remotion/types.ts).
      let stepIndex = 0;
      const segments = [];
      for (const seg of row.audio.segments) {
        const url = await ctx.storage.getUrl(seg.storageId);
        if (!url) throw new Error("audio segment missing from storage");
        const isStep = seg.role === "step";
        const pose = poseFor(seg.role, isStep ? stepIndex : 0);
        const stepNumber = isStep ? stepIndex + 1 : null;
        const board = isStep ? (row.boardSpecs?.[stepIndex] ?? null) : null;
        if (isStep) stepIndex++;

        // Legacy segments have no probed duration — measure from the MP3.
        let durationS = seg.durationSeconds ?? null;
        if (durationS === null) {
          const blob = await ctx.storage.get(seg.storageId);
          if (!blob) throw new Error("audio segment unreadable");
          const { parseBuffer } = await import("music-metadata");
          const meta = await parseBuffer(
            new Uint8Array(await blob.arrayBuffer()),
            { mimeType: "audio/mpeg" },
          );
          durationS = meta.format.duration ?? null;
          if (!durationS) throw new Error("could not probe mp3 duration");
        }

        segments.push({
          role: seg.role,
          text: isStep ? stripStepPrefix(seg.text) : seg.text,
          stepNumber,
          pose,
          board,
          audioSrc: url,
          durationInFrames: Math.max(
            MIN_SEGMENT_FRAMES,
            Math.ceil((durationS + SEGMENT_PAD_S) * FPS),
          ),
        });
      }

      const title =
        exercise.prompt.length > 110
          ? `${exercise.prompt.slice(0, 107)}…`
          : exercise.prompt;
      const totalFrames =
        segments.reduce((n, s) => n + s.durationInFrames, 0) + TAIL_FRAMES;

      const { renderMediaOnLambda } = await import("@remotion/lambda-client");
      const { renderId, bucketName } = await renderMediaOnLambda({
        region: env.region as Parameters<
          typeof renderMediaOnLambda
        >[0]["region"],
        functionName: env.functionName,
        serveUrl: env.serveUrl,
        composition: "PioExplainer",
        inputProps: { title, segments },
        codec: "h264",
        privacy: "public",
        maxRetries: 1,
        downloadBehavior: { type: "play-in-browser" },
      });

      await ctx.scheduler.runAfter(
        POLL_DELAY_S * 1000,
        internal.explainRender.pollRender,
        {
          explanationId: args.explanationId,
          renderId,
          bucketName,
          durationSeconds: Math.round(totalFrames / FPS),
          attempt: 0,
        },
      );
    } catch (err) {
      console.error(
        `explainRender.requestRender failed for ${args.explanationId}:`,
        err,
      );
      await ctx.runMutation(internal.explainVideo.releaseClaim, {
        explanationId: args.explanationId,
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Poll until the Lambda render lands, then store + attach
// ---------------------------------------------------------------------------

export const pollRender = internalAction({
  args: {
    explanationId: v.id("exerciseExplanations"),
    renderId: v.string(),
    bucketName: v.string(),
    durationSeconds: v.number(),
    attempt: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const env = lambdaEnv();
    if (!env) return;

    try {
      const { getRenderProgress } = await import("@remotion/lambda-client");
      const progress = await getRenderProgress({
        region: env.region as Parameters<
          typeof getRenderProgress
        >[0]["region"],
        functionName: env.functionName,
        renderId: args.renderId,
        bucketName: args.bucketName,
      });

      if (progress.fatalErrorEncountered) {
        console.error(
          `explainRender: fatal render error for ${args.explanationId}:`,
          progress.errors?.[0]?.message,
        );
        await ctx.runMutation(internal.explainVideo.releaseClaim, {
          explanationId: args.explanationId,
        });
        return;
      }

      if (progress.done && progress.outputFile) {
        const res = await fetch(progress.outputFile);
        if (!res.ok) throw new Error(`mp4 download failed: ${res.status}`);
        const blob = new Blob([await res.arrayBuffer()], {
          type: "video/mp4",
        });
        const storageId = await ctx.storage.store(blob);
        await ctx.runMutation(internal.explainVideo.attachVideo, {
          explanationId: args.explanationId,
          storageId,
          durationSeconds: args.durationSeconds,
          width: WIDTH,
          height: HEIGHT,
        });
        return;
      }

      if (args.attempt >= MAX_POLLS) {
        console.error(
          `explainRender: gave up polling ${args.explanationId} after ${MAX_POLLS} attempts`,
        );
        await ctx.runMutation(internal.explainVideo.releaseClaim, {
          explanationId: args.explanationId,
        });
        return;
      }

      await ctx.scheduler.runAfter(
        POLL_DELAY_S * 1000,
        internal.explainRender.pollRender,
        { ...args, attempt: args.attempt + 1 },
      );
    } catch (err) {
      console.error(
        `explainRender.pollRender failed for ${args.explanationId}:`,
        err,
      );
      await ctx.runMutation(internal.explainVideo.releaseClaim, {
        explanationId: args.explanationId,
      });
    }
  },
});
