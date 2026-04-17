import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  // ---------------------------------------------------------------------------
  // profiles
  // Stores user identity information linked to Convex Auth.
  // One profile per authenticated user; role determines access level.
  // ---------------------------------------------------------------------------
  profiles: defineTable({
    userId: v.string(), // Subject ID from Convex Auth
    role: v.union(
      v.literal("admin"),
      v.literal("parent"),
      v.literal("student"),
      v.literal("professeur"),
    ),
    name: v.string(),
    avatar: v.optional(v.string()),
    preferences: v.optional(v.any()),
  }).index("by_userId", ["userId"]),

  // ---------------------------------------------------------------------------
  // studentGuardians
  // N-to-N junction table linking students to their guardians/tutors/teachers.
  // ---------------------------------------------------------------------------
  studentGuardians: defineTable({
    studentId: v.id("profiles"),
    guardianId: v.id("profiles"),
    relation: v.union(
      v.literal("parent"),
      v.literal("tuteur"),
      v.literal("professeur"),
    ),
  })
    .index("by_studentId", ["studentId"])
    .index("by_guardianId", ["guardianId"]),

  // ---------------------------------------------------------------------------
  // subjects
  // Top-level curriculum categories (e.g. Mathematics, French).
  // ---------------------------------------------------------------------------
  subjects: defineTable({
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    order: v.number(),
  }),

  // ---------------------------------------------------------------------------
  // topics
  // Sub-sections within a subject (e.g. Fractions within Mathematics).
  // ---------------------------------------------------------------------------
  topics: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    description: v.string(),
    order: v.number(),
  }).index("by_subjectId", ["subjectId"]),

  // ---------------------------------------------------------------------------
  // exercises
  // Individual learning tasks belonging to a topic.
  // payload shape varies by type; v.any() is used to accommodate all variants:
  //   qcm        -> { options: string[], correctIndex: number, explanation?: string }
  //   match      -> { pairs: { left: string, right: string }[] }
  //   order      -> { correctSequence: string[] }
  //   drag-drop  -> { zones: string[], items: { text: string, correctZone: string }[] }
  //   short-answer -> { acceptedAnswers: string[], tolerance?: string }
  // ---------------------------------------------------------------------------
  exercises: defineTable({
    topicId: v.id("topics"),
    type: v.union(
      v.literal("qcm"),
      v.literal("drag-drop"),
      v.literal("match"),
      v.literal("order"),
      v.literal("short-answer"),
    ),
    prompt: v.string(),
    payload: v.any(),
    answerKey: v.string(),
    hints: v.array(v.string()),
    order: v.number(),
    status: v.union(v.literal("draft"), v.literal("published")),
    version: v.number(),
    sourcePdfUploadId: v.optional(v.id("pdfUploads")),
    generatedBy: v.union(v.literal("ai"), v.literal("manual")),
    reviewedBy: v.optional(v.id("profiles")),
    publishedAt: v.optional(v.number()), // Unix timestamp ms
  }).index("by_topicId", ["topicId"]),

  // ---------------------------------------------------------------------------
  // attempts
  // Records each time a student submits an answer to an exercise.
  // ---------------------------------------------------------------------------
  attempts: defineTable({
    studentId: v.id("profiles"),
    exerciseId: v.id("exercises"),
    submittedAnswer: v.string(),
    isCorrect: v.boolean(),
    attemptNumber: v.number(),
    hintsUsedCount: v.number(),
    timeSpentMs: v.number(),
    submittedAt: v.number(), // Unix timestamp ms
  })
    .index("by_studentId_exerciseId", ["studentId", "exerciseId"])
    .index("by_studentId", ["studentId"]),

  // ---------------------------------------------------------------------------
  // studentTopicProgress
  // Aggregated progress metrics per student per topic.
  // Updated after each attempt; drives mastery level and completion tracking.
  // ---------------------------------------------------------------------------
  studentTopicProgress: defineTable({
    studentId: v.id("profiles"),
    topicId: v.id("topics"),
    completedExercises: v.number(),
    correctExercises: v.number(),
    totalHintsUsed: v.number(),
    masteryLevel: v.number(), // e.g. 0–100
    completedAt: v.optional(v.number()), // Unix timestamp ms
  })
    .index("by_studentId", ["studentId"])
    .index("by_studentId_topicId", ["studentId", "topicId"]),

  // ---------------------------------------------------------------------------
  // badges
  // Achievement definitions. A badge may be scoped to a specific subject.
  // condition is a machine-readable tag (e.g. "complete_topic", "streak_3").
  // ---------------------------------------------------------------------------
  badges: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    condition: v.string(),
    subjectId: v.optional(v.id("subjects")),
  }),

  // ---------------------------------------------------------------------------
  // earnedBadges
  // Junction table recording when a student earned a specific badge.
  // ---------------------------------------------------------------------------
  earnedBadges: defineTable({
    badgeId: v.id("badges"),
    studentId: v.id("profiles"),
    earnedAt: v.number(), // Unix timestamp ms
  }).index("by_studentId", ["studentId"]),

  // ---------------------------------------------------------------------------
  // pdfUploads
  // Tracks PDF files uploaded by admins for AI-assisted exercise generation.
  // storageId is the Convex file storage reference.
  // extractedRaw holds the raw JSON returned by GPT-4 before review.
  // ---------------------------------------------------------------------------
  pdfUploads: defineTable({
    adminId: v.id("profiles"),
    storageId: v.string(), // Convex file storage ID
    originalFilename: v.string(),
    mimeType: v.string(),
    size: v.number(), // bytes
    subjectId: v.id("subjects"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("extracted"),
      v.literal("reviewed"),
      v.literal("published"),
    ),
    extractedRaw: v.optional(v.any()), // raw JSON from GPT-4
    extractedAt: v.optional(v.number()), // Unix timestamp ms
    reviewedAt: v.optional(v.number()), // Unix timestamp ms
    publishedAt: v.optional(v.number()), // Unix timestamp ms
  }).index("by_status", ["status"]),

  // ---------------------------------------------------------------------------
  // topicReports
  // Diagnostic reports generated per student per topic.
  // emailSentAt records when the report was delivered to a guardian.
  // ---------------------------------------------------------------------------
  topicReports: defineTable({
    studentId: v.id("profiles"),
    topicId: v.id("topics"),
    score: v.number(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    frequentMistakes: v.array(v.string()),
    emailSentAt: v.optional(v.number()), // Unix timestamp ms
  }).index("by_studentId_topicId", ["studentId", "topicId"]),
});
