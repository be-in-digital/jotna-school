import { query } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getStudentProgress = query({
  args: {
    studentId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(200);
  },
});

export const getSubjectProgress = query({
  args: {
    studentId: v.id("profiles"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    // Get all topics for this subject
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", args.subjectId))
      .take(200);

    const topicIds = new Set(topics.map((t) => t._id));

    // Get all progress records for this student
    const allProgress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(200);

    // Filter to only include progress for topics in this subject
    const subjectProgress = allProgress.filter((p) => topicIds.has(p.topicId));

    // Aggregate
    const totalTopics = topics.length;
    const completedTopics = subjectProgress.filter(
      (p) => p.completedAt !== undefined,
    ).length;
    const totalCompleted = subjectProgress.reduce(
      (sum, p) => sum + p.completedExercises,
      0,
    );
    const totalCorrect = subjectProgress.reduce(
      (sum, p) => sum + p.correctExercises,
      0,
    );
    const totalHintsUsed = subjectProgress.reduce(
      (sum, p) => sum + p.totalHintsUsed,
      0,
    );
    const avgMastery =
      subjectProgress.length > 0
        ? subjectProgress.reduce((sum, p) => sum + p.masteryLevel, 0) /
          subjectProgress.length
        : 0;

    return {
      totalTopics,
      completedTopics,
      totalCompleted,
      totalCorrect,
      totalHintsUsed,
      avgMastery,
      topicProgress: subjectProgress,
    };
  },
});
