"use node";

/**
 * Pio's voice for the "Pio t'explique" explainer. Synthesises one short MP3
 * per narration segment (intro, each step, conclusion) with OpenAI TTS, stores
 * them in Convex file storage, and attaches the storage ids to the cached
 * explanation. Runs once per exercise (cache-first via `attachAudio`), so the
 * cost is a fraction of a cent and paid a single time for every kid.
 *
 * Best-effort: any failure leaves the explanation without audio and the client
 * narrates with the browser voice instead. Partial results are cleaned up so
 * we never leak orphaned storage.
 */

import { v } from "convex/values";
import OpenAI from "openai";
import { parseBuffer } from "music-metadata";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Warm, playful lion-cub explorer — the consistent voice of Pio everywhere.
// Exported so every narration feature (explainer, lecture des consignes —
// convex/promptAudio.ts) speaks with the SAME Pio.
export const PIO_VOICE = "fable";
export const PIO_TTS_MODEL = "gpt-4o-mini-tts";
export const PIO_TTS_FALLBACK_MODEL = "tts-1";
const PIO_VOICE_INSTRUCTIONS =
  "Tu es Pio, un adorable lionceau explorateur qui explique une leçon à un " +
  "enfant de 8 ans. Voix chaleureuse, douce et encourageante, débit lent et " +
  "articulé, avec le sourire. Jamais pressé, jamais condescendant.";

// Runaway-only guards — they must NEVER constrain a legitimate explanation
// (comprehensibility over brevity), only protect against malformed model
// output. 20 000 chars ≈ 22 minutes of speech ≈ $0.33 — far beyond any real
// 8-step explanation (~2 500 chars). Per-segment cap mirrors the OpenAI TTS
// hard input limit (4096 chars per request); one narrated step can't reach it.
const MAX_TOTAL_CHARS = 20_000;
const MAX_SEGMENT_CHARS = 4_000;

type Segment = { text: string; role: "intro" | "step" | "conclusion" };

export async function synthesizeOne(
  openai: OpenAI,
  text: string,
  instructions: string = PIO_VOICE_INSTRUCTIONS,
): Promise<ArrayBuffer> {
  try {
    const res = await openai.audio.speech.create({
      model: PIO_TTS_MODEL,
      voice: PIO_VOICE,
      input: text,
      instructions,
      response_format: "mp3",
    });
    return await res.arrayBuffer();
  } catch {
    // Older/cheaper model — no `instructions` support, still a fine Pio.
    const res = await openai.audio.speech.create({
      model: PIO_TTS_FALLBACK_MODEL,
      voice: PIO_VOICE,
      input: text,
      response_format: "mp3",
    });
    return await res.arrayBuffer();
  }
}

/** Probe the MP3 length so renderers never have to re-download the clips. */
export async function probeDurationSeconds(
  buf: ArrayBuffer,
): Promise<number | null> {
  try {
    const meta = await parseBuffer(new Uint8Array(buf), {
      mimeType: "audio/mpeg",
    });
    const dur = meta.format.duration;
    return dur && Number.isFinite(dur) ? dur : null;
  } catch {
    return null;
  }
}

export const synthesizeAndAttach = internalAction({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args): Promise<void> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return;

    const row = await ctx.runQuery(internal.explainMistake.getById, {
      explanationId: args.explanationId,
    });
    if (!row || row.audio) return; // gone or already voiced

    const segments: Segment[] = [
      { text: row.intro, role: "intro" as const },
      ...row.steps.map((text): Segment => ({ text, role: "step" })),
      { text: row.conclusion, role: "conclusion" as const },
    ].filter((s) => s.text.trim().length > 0);

    const totalChars = segments.reduce((n, s) => n + s.text.length, 0);
    if (
      segments.length === 0 ||
      totalChars > MAX_TOTAL_CHARS ||
      segments.some((s) => s.text.length > MAX_SEGMENT_CHARS)
    ) {
      return; // browser-voice fallback still narrates the full text
    }

    const openai = new OpenAI({ apiKey });
    const stored: {
      storageId: Id<"_storage">;
      text: string;
      role: Segment["role"];
      durationSeconds?: number;
    }[] = [];

    try {
      for (const seg of segments) {
        const buf = await synthesizeOne(openai, seg.text);
        const durationSeconds = await probeDurationSeconds(buf);
        const storageId = await ctx.storage.store(
          new Blob([buf], { type: "audio/mpeg" }),
        );
        stored.push({
          storageId,
          text: seg.text,
          role: seg.role,
          durationSeconds: durationSeconds ?? undefined,
        });
      }
    } catch {
      // Roll back any clips already stored so nothing leaks.
      for (const s of stored) {
        await ctx.storage.delete(s.storageId);
      }
      return;
    }

    await ctx.runMutation(internal.explainMistake.attachAudio, {
      explanationId: args.explanationId,
      voice: PIO_VOICE,
      model: PIO_TTS_MODEL,
      segments: stored,
    });

    // Audio is ready → hand the video render to Remotion Lambda (no-op when
    // the Lambda env isn't configured; the local worker then picks it up).
    await ctx.scheduler.runAfter(0, internal.explainRender.requestRender, {
      explanationId: args.explanationId,
    });
  },
});
