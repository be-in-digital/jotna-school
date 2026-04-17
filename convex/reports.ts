import {
  query,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Public Queries
// ---------------------------------------------------------------------------

/** List all topic reports for a given student, joined with topic & subject names. */
export const listByStudent = query({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("topicReports")
      .withIndex("by_studentId_topicId", (q) =>
        q.eq("studentId", args.studentId),
      )
      .collect();

    const enriched = await Promise.all(
      reports.map(async (report) => {
        const topic = await ctx.db.get(report.topicId);
        const subject = topic ? await ctx.db.get(topic.subjectId) : null;
        return {
          ...report,
          topicName: topic?.name ?? "Thématique inconnue",
          subjectName: subject?.name ?? "Matière inconnue",
        };
      }),
    );

    return enriched;
  },
});

/** Get a single report with full details (topic name, subject name). */
export const getById = query({
  args: { id: v.id("topicReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) return null;

    const topic = await ctx.db.get(report.topicId);
    const subject = topic ? await ctx.db.get(topic.subjectId) : null;

    return {
      ...report,
      topicName: topic?.name ?? "Thématique inconnue",
      subjectName: subject?.name ?? "Matière inconnue",
    };
  },
});

// ---------------------------------------------------------------------------
// Internal Queries (used by sendEmail action in reportsEmail.ts)
// ---------------------------------------------------------------------------

/** Internal: get a single report with topic & subject names. */
export const internalGetById = internalQuery({
  args: { id: v.id("topicReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) return null;

    const topic = await ctx.db.get(report.topicId);
    const subject = topic ? await ctx.db.get(topic.subjectId) : null;

    return {
      ...report,
      topicName: topic?.name ?? "Thématique inconnue",
      subjectName: subject?.name ?? "Matière inconnue",
    };
  },
});

/** Internal: get a student profile by document id. */
export const getStudentProfile = internalQuery({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Internal: get all guardian profiles + emails for a student. */
export const getGuardians = internalQuery({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("studentGuardians")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const guardians = await Promise.all(
      links.map(async (link) => {
        const profile = await ctx.db.get(link.guardianId);
        if (!profile) return null;

        // profile.userId is the _id of the users table (stored as string)
        // Look up the user to get their email
        const users = await ctx.db.query("users").collect();
        const user = users.find(
          (u) => (u._id as unknown as string) === profile.userId,
        );

        return {
          ...profile,
          email: (user?.email as string | undefined) ?? null,
        };
      }),
    );

    return guardians.filter(
      (g): g is NonNullable<typeof g> => g !== null,
    );
  },
});

// ---------------------------------------------------------------------------
// Internal Mutations
// ---------------------------------------------------------------------------

/**
 * Generate a topic report for a student + topic.
 * Analyses all attempts for exercises in the topic, computes score,
 * strengths, weaknesses, frequent mistakes, then schedules the email.
 */
export const generate = internalMutation({
  args: {
    studentId: v.id("profiles"),
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    // Fetch all exercises for this topic
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_topicId", (q) => q.eq("topicId", args.topicId))
      .collect();

    if (exercises.length === 0) {
      throw new Error("Aucun exercice trouvé pour cette thématique");
    }

    let totalAttempts = 0;
    let correctAttempts = 0;
    const typeScores: Record<string, { correct: number; total: number }> = {};
    const frequentMistakes: string[] = [];

    for (const exercise of exercises) {
      const attempts = await ctx.db
        .query("attempts")
        .withIndex("by_studentId_exerciseId", (q) =>
          q.eq("studentId", args.studentId).eq("exerciseId", exercise._id),
        )
        .collect();

      if (attempts.length === 0) continue;

      const exerciseCorrect = attempts.filter((a) => a.isCorrect).length;
      totalAttempts += attempts.length;
      correctAttempts += exerciseCorrect;

      // Aggregate by exercise type
      if (!typeScores[exercise.type]) {
        typeScores[exercise.type] = { correct: 0, total: 0 };
      }
      typeScores[exercise.type].correct += exerciseCorrect;
      typeScores[exercise.type].total += attempts.length;

      // Frequent mistakes: exercises attempted 3+ times with majority failures
      if (attempts.length >= 3 && exerciseCorrect / attempts.length < 0.5) {
        frequentMistakes.push(exercise.prompt);
      }
    }

    // Calculate score
    const score = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    // Identify strengths (exercise types with >80% success)
    const strengths: string[] = [];
    for (const [type, stats] of Object.entries(typeScores)) {
      if (stats.total > 0 && stats.correct / stats.total > 0.8) {
        strengths.push(formatExerciseType(type));
      }
    }

    // Identify weaknesses (exercise types with <50% success)
    const weaknesses: string[] = [];
    for (const [type, stats] of Object.entries(typeScores)) {
      if (stats.total > 0 && stats.correct / stats.total < 0.5) {
        weaknesses.push(formatExerciseType(type));
      }
    }

    // Create the report record
    const reportId = await ctx.db.insert("topicReports", {
      studentId: args.studentId,
      topicId: args.topicId,
      score,
      strengths,
      weaknesses,
      frequentMistakes,
    });

    // Schedule the email immediately (sendEmail is in reportsEmail.ts)
    await ctx.scheduler.runAfter(0, internal.reportsEmail.sendEmail, {
      reportId,
    });

    return reportId;
  },
});

/** Mark a report as email-sent with a timestamp. */
export const markEmailSent = internalMutation({
  args: { reportId: v.id("topicReports") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, { emailSentAt: Date.now() });
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatExerciseType(type: string): string {
  const labels: Record<string, string> = {
    qcm: "Questions à choix multiples",
    "drag-drop": "Glisser-déposer",
    match: "Association",
    order: "Remise en ordre",
    "short-answer": "Réponse courte",
  };
  return labels[type] ?? type;
}
