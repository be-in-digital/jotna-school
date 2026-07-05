"use node";

/**
 * Voix de Pio sur les consignes d'exercices.
 *
 * Synthétise un court MP3 par consigne (OpenAI TTS, la même voix « fable »
 * que « Pio t'explique ») et le rattache à l'exercice. Payé UNE fois par
 * exercice, servi à tous les enfants ; indispensable en CI/CP où l'enfant ne
 * sait pas encore lire la consigne, agréable partout ailleurs.
 *
 * Déclencheurs (voir paliers/index.ts) :
 *   - insertGeneratedExercises   — palier fraîchement généré ;
 *   - replaceFailedWithVariations — variations de regen ;
 *   - startPalierAttempt          — rattrapage des paliers déjà en cache
 *     (générés avant la fonctionnalité).
 *
 * Best-effort comme explainAudio : tout échec laisse l'exercice sans audio
 * et le client lit avec la voix du navigateur. Jamais bloquant.
 */

import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  PIO_VOICE,
  PIO_TTS_MODEL,
  synthesizeOne,
  probeDurationSeconds,
} from "./explainAudio";

// Lecture de consigne : plus neutre que l'explication de leçon — l'enfant
// doit comprendre QUOI faire, pas recevoir un cours.
const PROMPT_INSTRUCTIONS =
  "Tu es Pio, un adorable lionceau explorateur. Tu lis la consigne d'un " +
  "exercice à un enfant qui apprend. Voix claire, chaleureuse et " +
  "encourageante, débit lent et bien articulé. Lis la consigne telle " +
  "quelle, sans rien ajouter.";

// Garde anti-dérive uniquement : une consigne réelle fait < 200 caractères.
const MAX_PROMPT_CHARS = 1_500;

export const synthesizeForExercises = internalAction({
  args: { exerciseIds: v.array(v.id("exercises")) },
  handler: async (ctx, args): Promise<void> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || args.exerciseIds.length === 0) return;

    // Claim transactionnel : ne synthétise que ce qui manque vraiment.
    const toVoice: Array<{ exerciseId: string; prompt: string }> =
      await ctx.runMutation(internal.exercises.claimForPromptAudio, {
        exerciseIds: args.exerciseIds,
      });
    if (toVoice.length === 0) return;

    const openai = new OpenAI({ apiKey });

    for (const { exerciseId, prompt } of toVoice) {
      const text = prompt.trim();
      if (!text || text.length > MAX_PROMPT_CHARS) continue;

      let storageId: Id<"_storage"> | null = null;
      try {
        const buf = await synthesizeOne(openai, text, PROMPT_INSTRUCTIONS);
        const durationSeconds = await probeDurationSeconds(buf);
        storageId = await ctx.storage.store(
          new Blob([buf], { type: "audio/mpeg" }),
        );
        await ctx.runMutation(internal.exercises.attachPromptAudio, {
          exerciseId: exerciseId as Id<"exercises">,
          storageId,
          voice: PIO_VOICE,
          model: PIO_TTS_MODEL,
          durationSeconds: durationSeconds ?? undefined,
        });
      } catch {
        // Nettoie le blob orphelin éventuel ; le claim expirera (15 min) et
        // une prochaine ouverture du palier retentera. Les autres consignes
        // du lot continuent.
        if (storageId) {
          try {
            await ctx.storage.delete(storageId);
          } catch {
            // ignore
          }
        }
      }
    }
  },
});
