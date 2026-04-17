import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Answer verification helpers
// ---------------------------------------------------------------------------

function verifyQcm(submittedAnswer: string, payload: { correctIndex: number }): boolean {
  return parseInt(submittedAnswer, 10) === payload.correctIndex;
}

function verifyMatch(
  submittedAnswer: string,
  payload: { pairs: { left: string; right: string }[] },
): boolean {
  try {
    const submitted: { left: string; right: string }[] = JSON.parse(submittedAnswer);
    if (submitted.length !== payload.pairs.length) return false;

    const correctSet = new Set(
      payload.pairs.map((p) => `${p.left}|||${p.right}`),
    );
    for (const pair of submitted) {
      if (!correctSet.has(`${pair.left}|||${pair.right}`)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function verifyOrder(
  submittedAnswer: string,
  payload: { correctSequence: string[] },
): boolean {
  try {
    const submitted: string[] = JSON.parse(submittedAnswer);
    if (submitted.length !== payload.correctSequence.length) return false;
    return submitted.every((item, i) => item === payload.correctSequence[i]);
  } catch {
    return false;
  }
}

function verifyDragDrop(
  submittedAnswer: string,
  payload: { items: { text: string; correctZone: string }[] },
): boolean {
  try {
    const submitted: Record<string, string> = JSON.parse(submittedAnswer);
    for (const item of payload.items) {
      if (submitted[item.text] !== item.correctZone) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function verifyShortAnswer(
  submittedAnswer: string,
  payload: { acceptedAnswers: string[] },
): boolean {
  const normalized = submittedAnswer.toLowerCase().trim();
  return payload.acceptedAnswers.some(
    (answer) => answer.toLowerCase().trim() === normalized,
  );
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const submit = mutation({
  args: {
    exerciseId: v.id("exercises"),
    studentId: v.id("profiles"),
    submittedAnswer: v.string(),
    attemptNumber: v.number(),
    hintsUsedCount: v.number(),
    timeSpentMs: v.number(),
  },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new Error("Exercice introuvable");
    }

    // Verify the answer based on exercise type
    let isCorrect = false;
    switch (exercise.type) {
      case "qcm":
        isCorrect = verifyQcm(args.submittedAnswer, exercise.payload);
        break;
      case "match":
        isCorrect = verifyMatch(args.submittedAnswer, exercise.payload);
        break;
      case "order":
        isCorrect = verifyOrder(args.submittedAnswer, exercise.payload);
        break;
      case "drag-drop":
        isCorrect = verifyDragDrop(args.submittedAnswer, exercise.payload);
        break;
      case "short-answer":
        isCorrect = verifyShortAnswer(args.submittedAnswer, exercise.payload);
        break;
      default:
        throw new Error(`Type d'exercice non supporté: ${exercise.type}`);
    }

    // Create the attempt record
    await ctx.db.insert("attempts", {
      studentId: args.studentId,
      exerciseId: args.exerciseId,
      submittedAnswer: args.submittedAnswer,
      isCorrect,
      attemptNumber: args.attemptNumber,
      hintsUsedCount: args.hintsUsedCount,
      timeSpentMs: args.timeSpentMs,
      submittedAt: Date.now(),
    });

    // If correct, update studentTopicProgress
    if (isCorrect) {
      const progress = await ctx.db
        .query("studentTopicProgress")
        .withIndex("by_studentId_topicId", (q) =>
          q.eq("studentId", args.studentId).eq("topicId", exercise.topicId),
        )
        .first();

      if (progress) {
        await ctx.db.patch(progress._id, {
          completedExercises: progress.completedExercises + 1,
          correctExercises: progress.correctExercises + 1,
          totalHintsUsed: progress.totalHintsUsed + args.hintsUsedCount,
        });
      } else {
        await ctx.db.insert("studentTopicProgress", {
          studentId: args.studentId,
          topicId: exercise.topicId,
          completedExercises: 1,
          correctExercises: 1,
          totalHintsUsed: args.hintsUsedCount,
          masteryLevel: 0,
        });
      }
    }

    // Build the correct answer to return only when max attempts reached
    let correctAnswer: string | undefined;
    if (!isCorrect && args.attemptNumber >= 5) {
      switch (exercise.type) {
        case "qcm":
          correctAnswer = String(exercise.payload.correctIndex);
          break;
        case "match":
          correctAnswer = JSON.stringify(exercise.payload.pairs);
          break;
        case "order":
          correctAnswer = JSON.stringify(exercise.payload.correctSequence);
          break;
        case "drag-drop": {
          const mapping: Record<string, string> = {};
          for (const item of exercise.payload.items) {
            mapping[item.text] = item.correctZone;
          }
          correctAnswer = JSON.stringify(mapping);
          break;
        }
        case "short-answer":
          correctAnswer = exercise.payload.acceptedAnswers[0];
          break;
      }
    }

    return { isCorrect, correctAnswer };
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAttemptsForExercise = query({
  args: {
    studentId: v.id("profiles"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attempts")
      .withIndex("by_studentId_exerciseId", (q) =>
        q.eq("studentId", args.studentId).eq("exerciseId", args.exerciseId),
      )
      .collect();
  },
});

export const getProgressForTopic = query({
  args: {
    studentId: v.id("profiles"),
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId_topicId", (q) =>
        q.eq("studentId", args.studentId).eq("topicId", args.topicId),
      )
      .first();
  },
});
