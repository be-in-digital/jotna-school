"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import {
  exerciseExtractionSchema,
  type ExtractionResponse,
} from "../lib/openai-schema";

/**
 * Fetch a PDF from Convex storage, send it to OpenAI GPT-4 with Structured
 * Outputs, and create draft exercises from the response.
 *
 * Runs in Node runtime (`"use node"`) because it relies on the global
 * `Buffer` API to base64-encode the PDF for the OpenAI Responses API.
 */
export const extract = internalAction({
  args: { uploadId: v.id("pdfUploads") },
  handler: async (ctx, { uploadId }) => {
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
      const fileUrl = await ctx.storage.getUrl(upload.storageId);
      if (!fileUrl) {
        throw new Error("Impossible de récupérer l'URL du fichier.");
      }

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(
          `Erreur lors du téléchargement du fichier: ${response.status}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString("base64");

      const openai = new OpenAI();

      const completion = await openai.responses.create({
        model: "gpt-4o",
        store: false,
        instructions: `Tu es un assistant pédagogique spécialisé dans la création d'exercices pour les élèves de CE2 à CM2 (8-11 ans).
Analyse le document PDF fourni et extrais tous les exercices que tu peux identifier.

RÈGLE CRITIQUE — DÉCOMPOSITION DES ITEMS NUMÉROTÉS :
Un "exercice" dans le PDF est souvent UNE CONSIGNE + PLUSIEURS ITEMS NUMÉROTÉS (1., 2., 3., ou a), b), c)).
Dans ce cas, tu DOIS créer UN exercice SÉPARÉ PAR ITEM — pas un seul exercice global, pas juste le premier item.

Exemple : si le PDF dit "Exercice 3 : Trouve le COD. 1. Le commerçant ferme sa boutique. 2. Nous écoutons la radio. 3. ..."
→ Génère 3+ exercices distincts, chacun contenant :
   - prompt : "Trouve le COD dans la phrase : 'Le commerçant ferme sa boutique.'"  (reprends le contexte de la consigne globale + l'item)
   - type : short-answer (par exemple)
   - acceptedAnswers : ["sa boutique", "la boutique", "boutique"]

Chaque item de liste numérotée doit devenir son propre exercice indépendant avec sa propre réponse, ses propres indices, et une consigne qui réintègre le contexte de l'énoncé global.

Si un exercice contient une liste d'items à traiter, NE RENVOIE PAS un seul exercice avec seulement le premier item. Décompose-le.


Pour chaque exercice, détermine le type d'INTERACTION le plus adapté à une application web interactive (PAS à un exercice papier):
- qcm: Question à choix multiples. Payload: {options: string[], correctIndex: number, explanation?: string}
- match: Association de paires gauche↔droite en cliquant. Payload: {pairs: [{left: string, right: string}]}
- order: Remise en ordre par drag-and-drop d'une séquence. Payload: {correctSequence: string[]}
- drag-drop: Glisser-déposer des éléments dans des zones cibles. Payload: {zones: string[], items: [{text: string, correctZone: string}]}
- short-answer: Réponse courte à taper au clavier. Payload: {acceptedAnswers: string[], tolerance?: string}
  IMPORTANT pour short-answer : acceptedAnswers doit contenir TOUTES les variantes linguistiquement valides.
  Pour la conjugaison : inclure TOUS les temps possibles si l'énoncé ne spécifie pas un temps précis.
  Exemple : "Hier, elle (dire) ___ la vérité." → acceptedAnswers: ["dit", "a dit", "disait"]
  (passé simple, passé composé ET imparfait sont tous corrects — sauf si l'énoncé force un temps).
  Pour les réponses numériques : inclure "10", "dix". Pour l'orthographe : inclure les variantes avec/sans accents, majuscules, etc.

RÈGLE IMPORTANTE — ADAPTATION DE LA CONSIGNE :
Le document PDF est prévu pour un exercice sur papier (recopier, souligner, classer dans un tableau, cocher, etc.).
Ton application est INTERACTIVE. Tu DOIS REFORMULER la consigne ("prompt") pour qu'elle corresponde exactement à l'interaction que tu as choisie.

Exemples d'adaptation OBLIGATOIRE :
- PDF "Classe les groupes dans le bon tableau" + type=match → "Associe chaque groupe à sa nature (temps, lieu, cause...)"
- PDF "Recopie la bonne réponse" + type=short-answer → "Écris la bonne réponse"
- PDF "Entoure les verbes conjugués" + type=qcm → "Clique sur le verbe conjugué dans la liste"
- PDF "Souligne les compléments circonstanciels" + type=match → "Relie chaque phrase à son complément"
- PDF "Range ces mots dans l'ordre alphabétique" + type=order → "Fais glisser les mots dans l'ordre alphabétique"
- PDF "Place chaque mot dans la bonne colonne" + type=drag-drop → "Glisse chaque mot dans la bonne zone"

Bannis ABSOLUMENT de la consigne les verbes liés au papier : recopie, souligne, entoure, coche, barre, trace, classe dans un tableau, écris dans la colonne, coller, découper.
Utilise à la place : associe, relie, clique, choisis, glisse, écris ta réponse, mets dans l'ordre.

Pour chaque exercice, fournis :
- prompt : une consigne CLAIRE, COURTE et ADAPTÉE au type d'interaction choisi (pas de référence au papier)
- payload : les données correspondant au type
- answerKey : la réponse correcte sous forme lisible
- hints : exactement 3 indices progressifs (du plus vague au plus précis)

Commence par identifier le thème global du document (ex: "Les fractions", "La conjugaison au présent", "Les compléments circonstanciels") et retourne-le dans le champ "suggestedTopic".

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

      const outputText = completion.output_text;
      const extraction: ExtractionResponse = JSON.parse(outputText);

      await ctx.runMutation(internal.pdfUploads.markExtracted, {
        uploadId,
        extractedRaw: extraction,
        extractedAt: Date.now(),
      });

      if (extraction.exercises.length > 0) {
        // Parse each payload (delivered as JSON string by OpenAI) before persisting.
        const parsedExercises = extraction.exercises.map((ex) => {
          let parsedPayload: unknown = {};
          try {
            parsedPayload = JSON.parse(ex.payload);
          } catch {
            parsedPayload = {};
          }
          return { ...ex, payload: parsedPayload };
        });

        await ctx.runMutation(internal.pdfUploads.createDraftExercises, {
          uploadId,
          exercises: parsedExercises,
          subjectId: upload.subjectId,
          suggestedTopicName: extraction.suggestedTopic,
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
