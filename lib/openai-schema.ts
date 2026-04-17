/**
 * JSON Schema for OpenAI Structured Outputs.
 *
 * Used by the PDF extraction action to get a well-typed array of exercises
 * from GPT-4 analysis of uploaded PDF content.
 */

export const exerciseExtractionSchema = {
  name: "exercise_extraction",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      exercises: {
        type: "array" as const,
        description:
          "Liste des exercices extraits du document PDF, adaptés au niveau CE2-CM2.",
        items: {
          type: "object" as const,
          properties: {
            type: {
              type: "string" as const,
              enum: ["qcm", "drag-drop", "match", "order", "short-answer"],
              description: "Le type d'exercice.",
            },
            prompt: {
              type: "string" as const,
              description:
                "L'énoncé de l'exercice, clair et adapté au niveau CE2-CM2.",
            },
            payload: {
              type: "object" as const,
              description:
                "Les données spécifiques au type d'exercice. Pour qcm: {options, correctIndex, explanation}. Pour match: {pairs}. Pour order: {correctSequence}. Pour drag-drop: {zones, items}. Pour short-answer: {acceptedAnswers, tolerance}.",
              additionalProperties: true,
            },
            answerKey: {
              type: "string" as const,
              description:
                "La réponse correcte sous forme de texte lisible, pour référence rapide.",
            },
            hints: {
              type: "array" as const,
              description:
                "Trois indices progressifs, du plus vague au plus précis, pour aider l'élève.",
              items: {
                type: "string" as const,
              },
            },
          },
          required: ["type", "prompt", "payload", "answerKey", "hints"],
          additionalProperties: false,
        },
      },
    },
    required: ["exercises"],
    additionalProperties: false,
  },
} as const;

/** Type for a single extracted exercise from OpenAI */
export interface ExtractedExercise {
  type: "qcm" | "drag-drop" | "match" | "order" | "short-answer";
  prompt: string;
  payload: Record<string, unknown>;
  answerKey: string;
  hints: string[];
}

/** Type for the full extraction response */
export interface ExtractionResponse {
  exercises: ExtractedExercise[];
}
