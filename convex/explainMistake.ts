/**
 * "Pio t'explique" — the step-by-step pedagogical explanation behind every
 * exercise. Two moments use it: when a kid exhausts all 5 attempts ("Je veux
 * comprendre") AND when a kid succeeds but wants to see how Pio would do it
 * ("Pio m'explique"). Cache-first by exerciseId — the text script + Pio's
 * narrated audio are produced ONCE and served to every kid on that exercise.
 *
 * The cached row in `exerciseExplanations` holds:
 *   { intro, steps[3-5], conclusion, audio? }
 * The `audio` track (OpenAI TTS, Pio's voice) is synthesised separately and
 * attached by `convex/explainAudio.ts`; it may lag the text by a few seconds,
 * in which case the client narrates with the browser voice as a fallback.
 *
 * Explanations are generated eagerly, at the same time as the exercises (see
 * the schedulers in `convex/paliers/index.ts`), and lazily on first kid view.
 */

import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Types — match the JSON envelope the model is asked to return.
// ---------------------------------------------------------------------------

export type ExplanationPayload = {
  intro: string;
  steps: string[];
  conclusion: string;
};

/**
 * Chalk drawing the explainer video puts on the blackboard for one step.
 * The catalog must stay in sync with the renderer (remotion/ChalkBoard.tsx)
 * and the prompt below. Stored as-is in `boardSpecs`; renderers re-validate.
 */
export type BoardSpec = { kind: string } & Record<string, unknown>;

const BOARD_KINDS = new Set([
  "fraction",
  "objects",
  "numberline",
  "operation",
  "compare",
  "boxes",
  "word",
  "keyword",
]);

function parseBoardSpec(raw: unknown): BoardSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.kind !== "string" || !BOARD_KINDS.has(obj.kind)) return null;
  return obj as BoardSpec;
}

export type AudioSegment = {
  url: string;
  text: string;
  role: "intro" | "step" | "conclusion";
};

// La clarté prime sur la brièveté : jusqu'à 8 étapes quand le concept le
// demande (le prompt pousse le modèle à en prendre autant que nécessaire).
const MIN_STEPS = 3;
const MAX_STEPS = 8;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export const getCached = internalQuery({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exerciseExplanations")
      .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId))
      .unique();
  },
});

export const getExercise = internalQuery({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.exerciseId);
  },
});

export const getStudentProfileId = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;
    return profile._id;
  },
});

export const saveExplanation = internalMutation({
  args: {
    exerciseId: v.id("exercises"),
    intro: v.string(),
    steps: v.array(v.string()),
    boardSpecs: v.optional(v.array(v.any())),
    conclusion: v.string(),
    model: v.string(),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Idempotent — if another concurrent call beat us to it, keep the first.
    const existing = await ctx.db
      .query("exerciseExplanations")
      .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("exerciseExplanations", {
      exerciseId: args.exerciseId,
      intro: args.intro,
      steps: args.steps,
      boardSpecs: args.boardSpecs,
      conclusion: args.conclusion,
      generatedAt: Date.now(),
      model: args.model,
      traceId: args.traceId,
    });
  },
});

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(exercise: Doc<"exercises">): {
  system: string;
  user: string;
} {
  const system = [
    "Tu es Pio, un professeur adorable et patient pour un élève sénégalais de CE2 ou CM1 (8 à 10 ans).",
    "Tu prépares une petite vidéo où tu fais la leçon comme un vrai maître d'école : ta voix explique, et tu DESSINES au tableau un support visuel pour chaque étape (schéma, objets, opération…). Le texte parlé sera lu par ta voix, donc il doit sonner naturel à l'oral.",
    "Ton but : que l'élève comprenne le concept pour de bon, qu'il ait échoué ou même réussi sans tout saisir.",
    "",
    "Règles pédagogiques :",
    "- Commence TOUJOURS par une analogie tirée de la vie de tous les jours (le marché, le foot, la cuisine, la famille, les mangues, le bus…). L'analogie doit rendre le concept évident.",
    "- Ensuite, relie l'analogie à l'exercice concret, étape par étape.",
    "- Termine par la règle ou l'astuce à retenir, formulée comme un petit secret entre toi et l'élève.",
    "- Ton ton est chaleureux, jamais condescendant. Tu tutoies l'élève.",
    "- Phrases courtes (max 20 mots). Pas d'emoji dans les textes parlés, pas de Markdown, pas de symboles qui ne se lisent pas à voix haute.",
    "- L'explication doit être si claire que même un enfant qui n'a jamais vu le sujet comprendrait.",
    "",
    "Le dessin au tableau (« board ») de chaque étape — choisis LE plus parlant, il doit MONTRER ce que ta voix explique, jamais répéter la phrase :",
    `- {"kind":"fraction","parts":4,"filled":1,"label":"1/4"} → camembert découpé en parts (parts ≤ 12), parties coloriées`,
    `- {"kind":"objects","emoji":"🥭","count":6,"groups":2,"crossed":0,"label":"6 mangues"} → objets dessinés, en groupes (groups optionnel, count ≤ 12), crossed = barrés`,
    `- {"kind":"numberline","from":0,"to":10,"marks":[3,7],"label":""} → droite graduée, points entourés`,
    `- {"kind":"operation","expr":"4 + 3 = ?","label":""} → grande opération posée à la craie (expr ≤ 12 caractères)`,
    `- {"kind":"compare","left":"1/2","right":"1/4","symbol":">"} → deux valeurs et le bon signe`,
    `- {"kind":"boxes","items":["matin","midi","soir"],"label":"dans l'ordre"} → cases reliées par des flèches (2 à 5 items courts)`,
    `- {"kind":"word","text":"les mangues","highlight":"s","label":"le pluriel"} → mot/phrase courte avec les lettres importantes soulignées`,
    `- {"kind":"keyword","text":"3 à 5 mots maxi"} → note encadrée à la craie (SEULEMENT si aucun dessin ne convient)`,
    "",
    `Réponds UNIQUEMENT au format JSON suivant, rien d'autre :`,
    `{`,
    `  "intro": "1 phrase d'accroche rassurante (max 20 mots)",`,
    `  "steps": [`,
    `    { "text": "<phrase parlée de l'étape>", "board": { <un dessin du catalogue ci-dessus> } }`,
    `  ],`,
    `  "conclusion": "1 phrase d'encouragement personnelle (max 20 mots)"`,
    `}`,
    "",
    `Le tableau steps doit contenir entre ${MIN_STEPS} et ${MAX_STEPS} étapes, chacune avec "text" ET "board".`,
    `Le board utilise EXACTEMENT les mêmes nombres, mots et valeurs que la phrase parlée de son étape — jamais d'autres exemples.`,
    `N'écris JAMAIS de numérotation dans le texte des étapes (pas de « étape 1 : », pas de « 1. ») — écris directement la phrase ; l'application affiche déjà les numéros.`,
    `Prends AUTANT d'étapes que nécessaire pour être limpide — la clarté prime sur la brièveté. Ne saute jamais un raisonnement intermédiaire pour raccourcir.`,
    `Chaque étape reste une ou deux phrases courtes (l'élève les écoute une par une).`,
    `L'étape 1 est TOUJOURS une analogie concrète (son board montre l'analogie, souvent "objects"). L'avant-dernière ou dernière étape est TOUJOURS la règle à retenir (souvent "keyword" ou "operation").`,
  ].join("\n");

  const user = [
    `Type d'exercice : ${exercise.type}`,
    `Question : ${exercise.prompt}`,
    `Réponse correcte : ${exercise.answerKey}`,
  ].join("\n");

  return { system, user };
}

// ---------------------------------------------------------------------------
// Parser — defensive against bad model output
// ---------------------------------------------------------------------------

// The app renders step numbers itself (board badge, list bullets) — a model
// echoing "étape 2 :" in the text would double the numbering on screen and in
// Pio's voice. Belt-and-suspenders with the prompt rule above.
function stripStepPrefix(step: string): string {
  return step.replace(/^\s*(étapes?\s*\d+|\d+)\s*[:.)\-–]\s*/i, "").trim();
}

function parseExplanation(
  raw: unknown,
): (ExplanationPayload & { boardSpecs: (BoardSpec | null)[] }) | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const intro = typeof obj.intro === "string" ? obj.intro.trim() : null;
  const conclusion =
    typeof obj.conclusion === "string" ? obj.conclusion.trim() : null;
  const stepsRaw = Array.isArray(obj.steps) ? obj.steps : null;
  if (!intro || !conclusion || !stepsRaw) return null;

  // Steps arrive as { text, board } objects (current prompt) or plain
  // strings (older model output) — accept both, boards are best-effort.
  const steps: string[] = [];
  const boardSpecs: (BoardSpec | null)[] = [];
  for (const item of stepsRaw) {
    let text: string | null = null;
    let board: BoardSpec | null = null;
    if (typeof item === "string") {
      text = item;
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (typeof o.text === "string") text = o.text;
      board = parseBoardSpec(o.board);
    }
    if (!text) continue;
    const cleaned = stripStepPrefix(text);
    if (!cleaned) continue;
    steps.push(cleaned);
    boardSpecs.push(board);
  }
  if (steps.length < MIN_STEPS) return null;
  return {
    intro,
    steps: steps.slice(0, MAX_STEPS),
    boardSpecs: boardSpecs.slice(0, MAX_STEPS),
    conclusion,
  };
}

// ---------------------------------------------------------------------------
// Shared producer — ensures a cached text explanation exists for an exercise.
// Used by the kid-facing action (quota-scoped) and the eager pre-generation
// path (system-scoped, no per-kid quota). Returns the explanation row id and
// whether it was served from cache.
// ---------------------------------------------------------------------------

type ProduceResult =
  | { ok: true; explanationId: Id<"exerciseExplanations">; cached: boolean }
  | { ok: false; reason: string; kidMessage: string };

async function produceTextExplanation(
  ctx: ActionCtx,
  exerciseId: Id<"exercises">,
  opts: {
    userId?: Id<"profiles">;
    quotaScope: "kid_initiated" | "system";
  },
): Promise<ProduceResult> {
  const cached: Doc<"exerciseExplanations"> | null = await ctx.runQuery(
    internal.explainMistake.getCached,
    { exerciseId },
  );
  if (cached) return { ok: true, explanationId: cached._id, cached: true };

  const exercise: Doc<"exercises"> | null = await ctx.runQuery(
    internal.explainMistake.getExercise,
    { exerciseId },
  );
  if (!exercise) {
    return {
      ok: false,
      reason: "EXERCISE_NOT_FOUND",
      kidMessage: "Désolé, je n'arrive pas à retrouver l'exercice.",
    };
  }

  const { system, user } = buildPrompt(exercise);
  const result: {
    ok: boolean;
    result?: unknown;
    traceId: string;
    modelUsed?: string;
    reason?: string;
    kidMessage?: string;
  } = await ctx.runAction(internal.aiGateway.index.generate, {
    purpose: "explain_mistake",
    prompt: user,
    systemPrompt: system,
    expectJson: true,
    userId: opts.userId,
    quotaScope: opts.quotaScope,
    metadata: { exerciseId, kind: "explain_mistake" },
  });

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason ?? "AI_FAILED",
      kidMessage:
        result.kidMessage ??
        "L'aide est en pause. Réessaie dans un instant ou demande à un parent.",
    };
  }

  const parsed = parseExplanation(result.result);
  if (!parsed) {
    return {
      ok: false,
      reason: "AI_BAD_FORMAT",
      kidMessage: "Désolé, je n'ai pas bien préparé l'explication.",
    };
  }

  const explanationId: Id<"exerciseExplanations"> = await ctx.runMutation(
    internal.explainMistake.saveExplanation,
    {
      exerciseId,
      intro: parsed.intro,
      steps: parsed.steps,
      boardSpecs: parsed.boardSpecs,
      conclusion: parsed.conclusion,
      model: result.modelUsed ?? "unknown",
      traceId: result.traceId,
    },
  );

  return { ok: true, explanationId, cached: false };
}

// ---------------------------------------------------------------------------
// Audio helpers (storage id → signed url; attach synthesised clips)
// ---------------------------------------------------------------------------

export const getById = internalQuery({
  args: { explanationId: v.id("exerciseExplanations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.explanationId);
  },
});

export const attachAudio = internalMutation({
  args: {
    explanationId: v.id("exerciseExplanations"),
    voice: v.string(),
    model: v.string(),
    segments: v.array(
      v.object({
        storageId: v.id("_storage"),
        text: v.string(),
        role: v.union(
          v.literal("intro"),
          v.literal("step"),
          v.literal("conclusion"),
        ),
        durationSeconds: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.explanationId);
    if (!existing) return;
    // First writer wins — avoids leaking orphan storage on a race.
    if (existing.audio) {
      for (const seg of args.segments) {
        await ctx.storage.delete(seg.storageId);
      }
      return;
    }
    await ctx.db.patch(args.explanationId, {
      audio: {
        voice: args.voice,
        model: args.model,
        generatedAt: Date.now(),
        segments: args.segments,
      },
    });
  },
});

async function resolveAudioSegments(
  ctx: ActionCtx,
  explanation: Doc<"exerciseExplanations">,
): Promise<AudioSegment[] | null> {
  if (!explanation.audio || explanation.audio.segments.length === 0) {
    return null;
  }
  const out: AudioSegment[] = [];
  for (const seg of explanation.audio.segments) {
    const url = await ctx.storage.getUrl(seg.storageId);
    if (!url) return null; // storage evicted — fall back to browser voice
    out.push({ url, text: seg.text, role: seg.role });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public action — the only entry point the explainer component calls.
// ---------------------------------------------------------------------------

type ExplainResult =
  | {
      ok: true;
      explanation: ExplanationPayload;
      cached: boolean;
      audioSegments: AudioSegment[] | null;
      /** Rendered "Pio au tableau" MP4, when the worker has produced it. */
      videoUrl: string | null;
    }
  | { ok: false; reason: string; kidMessage: string };

export const explainExercise = action({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args): Promise<ExplainResult> => {
    // Auth check — student-only.
    const studentId: Id<"profiles"> | null = await ctx.runQuery(
      internal.explainMistake.getStudentProfileId,
      {},
    );
    if (!studentId) {
      return {
        ok: false,
        reason: "UNAUTHENTICATED",
        kidMessage: "Reconnecte-toi pour voir l'explication.",
      };
    }

    const produced = await produceTextExplanation(ctx, args.exerciseId, {
      userId: studentId,
      quotaScope: "kid_initiated",
    });
    if (!produced.ok) {
      return {
        ok: false,
        reason: produced.reason,
        kidMessage: produced.kidMessage,
      };
    }

    const row: Doc<"exerciseExplanations"> | null = await ctx.runQuery(
      internal.explainMistake.getById,
      { explanationId: produced.explanationId },
    );
    if (!row) {
      return {
        ok: false,
        reason: "EXPLANATION_LOST",
        kidMessage: "Désolé, je n'ai pas retrouvé l'explication.",
      };
    }

    const audioSegments = await resolveAudioSegments(ctx, row);

    // Audio not ready yet → synthesise in the background so the next viewer
    // (and this kid on replay) gets Pio's real voice. The player narrates
    // with the browser voice meanwhile.
    if (!audioSegments) {
      await ctx.scheduler.runAfter(
        0,
        internal.explainAudio.synthesizeAndAttach,
        { explanationId: produced.explanationId },
      );
    }

    const videoUrl = row.video
      ? await ctx.storage.getUrl(row.video.storageId)
      : null;

    // Audio ready but no video yet → nudge the Lambda renderer (no-op when
    // Lambda isn't configured or a render is already in flight). Covers
    // legacy explanations created before the video pipeline existed.
    if (audioSegments && !videoUrl) {
      await ctx.scheduler.runAfter(0, internal.explainRender.requestRender, {
        explanationId: produced.explanationId,
      });
    }

    return {
      ok: true,
      cached: produced.cached,
      explanation: {
        intro: row.intro,
        steps: row.steps,
        conclusion: row.conclusion,
      },
      audioSegments,
      videoUrl,
    };
  },
});

// ---------------------------------------------------------------------------
// Eager pre-generation — scheduled the moment exercises are created, so the
// explainer video is ready before any kid needs it. System-scoped (no per-kid
// quota); still budget-gated by the AI gateway. Best-effort: failures are
// swallowed and simply retried on the next kid view.
// ---------------------------------------------------------------------------

export const pregenerateForExercise = internalAction({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args): Promise<void> => {
    const produced = await produceTextExplanation(ctx, args.exerciseId, {
      quotaScope: "system",
    });
    if (!produced.ok) return;

    const row: Doc<"exerciseExplanations"> | null = await ctx.runQuery(
      internal.explainMistake.getById,
      { explanationId: produced.explanationId },
    );
    if (!row || row.audio) return;

    await ctx.scheduler.runAfter(
      0,
      internal.explainAudio.synthesizeAndAttach,
      { explanationId: produced.explanationId },
    );
  },
});
