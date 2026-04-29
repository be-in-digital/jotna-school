import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------------------------------------------------------------------
// Queries for admin student management
// ---------------------------------------------------------------------------

export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").take(1000);
    const students = profiles.filter((p) => p.role === "student");

    const results = [];
    for (const student of students) {
      // Count completed topics
      const progress = await ctx.db
        .query("studentTopicProgress")
        .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
        .take(200);
      const completedTopics = progress.filter((p) => p.completedAt != null).length;

      // Count badges
      const earnedBadges = await ctx.db
        .query("earnedBadges")
        .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
        .take(100);

      results.push({
        ...student,
        completedTopics,
        badgeCount: earnedBadges.length,
      });
    }

    return results;
  },
});

export const getStudentDetail = query({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      return null;
    }

    // Get all progress entries
    const progress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(200);

    // Get subject progress with topic info
    const subjectProgress: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        subjectColor: string;
        totalTopics: number;
        completedTopics: number;
        totalExercises: number;
        correctExercises: number;
      }
    > = {};

    for (const p of progress) {
      const topic = await ctx.db.get(p.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;

      if (!subjectProgress[subject._id]) {
        // Count total topics in subject
        const allTopics = await ctx.db
          .query("topics")
          .withIndex("by_subjectId", (q) => q.eq("subjectId", subject._id))
          .take(200);

        subjectProgress[subject._id] = {
          subjectId: subject._id,
          subjectName: subject.name,
          subjectColor: subject.color,
          totalTopics: allTopics.length,
          completedTopics: 0,
          totalExercises: 0,
          correctExercises: 0,
        };
      }

      subjectProgress[subject._id].totalExercises += p.completedExercises;
      subjectProgress[subject._id].correctExercises += p.correctExercises;
      if (p.completedAt != null) {
        subjectProgress[subject._id].completedTopics += 1;
      }
    }

    // Get earned badges
    const earnedBadges = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(100);

    const badgesWithInfo = [];
    for (const eb of earnedBadges) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        badgesWithInfo.push({ ...eb, badge });
      }
    }

    // Get recent attempts (last 10) — use desc order + take to avoid loading all
    const sortedAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(10);

    const attemptsWithInfo = [];
    for (const attempt of sortedAttempts) {
      const exercise = await ctx.db.get(attempt.exerciseId);
      let topicName = "";
      if (exercise) {
        const topic = await ctx.db.get(exercise.topicId);
        topicName = topic?.name ?? "";
      }
      attemptsWithInfo.push({
        ...attempt,
        exercisePrompt: exercise?.prompt ?? "",
        exerciseType: exercise?.type ?? "",
        topicName,
      });
    }

    return {
      student,
      subjectProgress: Object.values(subjectProgress),
      earnedBadges: badgesWithInfo,
      recentAttempts: attemptsWithInfo,
    };
  },
});

/**
 * Auth-scoped wrapper: returns stats for the currently-logged-in student.
 * Used by the student's profile page — the client doesn't have to pass
 * (and possibly spoof) a studentId.
 */
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;

    const studentId = profile._id;

    const progress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(200);
    const completedTopics = progress.filter((p) => p.completedAt != null).length;
    const totalExercises = progress.reduce(
      (s, p) => s + p.completedExercises,
      0,
    );

    const earnedBadges = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(100);
    const badgesWithInfo = [];
    for (const eb of earnedBadges) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) badgesWithInfo.push({ ...eb, badge });
    }

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(1000);
    const totalTimeMs = attempts.reduce((s, a) => s + a.timeSpentMs, 0);

    const subjectCounts: Record<string, { name: string; count: number }> = {};
    for (const p of progress) {
      if (p.completedAt == null) continue;
      const topic = await ctx.db.get(p.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;
      if (!subjectCounts[subject._id]) {
        subjectCounts[subject._id] = { name: subject.name, count: 0 };
      }
      subjectCounts[subject._id].count += 1;
    }
    const favoriteSubject =
      Object.values(subjectCounts).sort((a, b) => b.count - a.count)[0]?.name ??
      null;

    return {
      student: profile,
      completedTopics,
      totalExercises,
      badgeCount: earnedBadges.length,
      totalTimeMs,
      favoriteSubject,
      recentBadges: badgesWithInfo
        .sort((a, b) => b.earnedAt - a.earnedAt)
        .slice(0, 3),
    };
  },
});

/**
 * Auth-scoped: return badges earned by the currently-logged-in student.
 */
export const getMyEarnedBadges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile) return [];
    const earned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", profile._id))
      .take(100);
    return earned.map((e) => ({
      _id: e._id,
      badgeId: e.badgeId as string,
      earnedAt: e.earnedAt,
    }));
  },
});

export const getStudentStats = query({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      return null;
    }

    // Get progress
    const progress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(200);

    const completedTopics = progress.filter((p) => p.completedAt != null).length;
    const totalExercises = progress.reduce((s, p) => s + p.completedExercises, 0);

    // Get badges
    const earnedBadges = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(100);

    const badgesWithInfo = [];
    for (const eb of earnedBadges) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        badgesWithInfo.push({ ...eb, badge });
      }
    }

    // Get total time spent from attempts
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(1000);

    const totalTimeMs = attempts.reduce((s, a) => s + a.timeSpentMs, 0);

    // Find favorite subject (most completed topics)
    const subjectCounts: Record<string, { name: string; count: number }> = {};
    for (const p of progress) {
      if (p.completedAt == null) continue;
      const topic = await ctx.db.get(p.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;
      if (!subjectCounts[subject._id]) {
        subjectCounts[subject._id] = { name: subject.name, count: 0 };
      }
      subjectCounts[subject._id].count += 1;
    }

    const favoriteSubject = Object.values(subjectCounts).sort(
      (a, b) => b.count - a.count,
    )[0]?.name ?? null;

    return {
      student,
      completedTopics,
      totalExercises,
      badgeCount: earnedBadges.length,
      totalTimeMs,
      favoriteSubject,
      recentBadges: badgesWithInfo
        .sort((a, b) => b.earnedAt - a.earnedAt)
        .slice(0, 3),
    };
  },
});
