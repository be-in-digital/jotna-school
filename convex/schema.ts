import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Class enum (curriculum stages, élémentaire sénégalais).
// MVP-1 ships CE2 + CM1 only; the full enum is here so the schema is
// forward-compatible with the public big-bang launch (Decision 14).
// ---------------------------------------------------------------------------
const classEnum = v.union(
  v.literal("CI"),
  v.literal("CP"),
  v.literal("CE1"),
  v.literal("CE2"),
  v.literal("CM1"),
  v.literal("CM2"),
);

// ---------------------------------------------------------------------------
// AI gateway purposes — mirrors aiGateway/registry.ts. Listed here as
// literal union so settings.modelOverrides (Decision 76) can validate keys.
// ---------------------------------------------------------------------------
const aiPurposeEnum = v.union(
  v.literal("palier_base"),
  v.literal("palier_personalized"),
  v.literal("verify_short_answer"),
  v.literal("explain_mistake"),
  v.literal("verify_math"),
);

export default defineSchema({
  ...authTables,
  // ---------------------------------------------------------------------------
  // profiles
  // ---------------------------------------------------------------------------
  profiles: defineTable({
    userId: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("parent"),
      v.literal("student"),
      v.literal("professeur"),
    ),
    name: v.string(),
    avatar: v.optional(v.string()),
    preferences: v.optional(v.any()),
    // Parental consent for AI data processing (Loi 2008-12, Sénégal)
    aiDataConsentGranted: v.optional(v.boolean()),
    aiDataConsentGrantedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // ---------------------------------------------------------------------------
  // studentGuardians
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
  // ---------------------------------------------------------------------------
  subjects: defineTable({
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    order: v.number(),
  }),

  // ---------------------------------------------------------------------------
  // topics — added `class` (Decision 10 + 14)
  // ---------------------------------------------------------------------------
  topics: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    description: v.string(),
    order: v.number(),
    class: v.optional(classEnum), // optional for backward-compat with seeded rows
  })
    .index("by_subjectId", ["subjectId"])
    .index("by_subjectId_class", ["subjectId", "class"]),

  // ---------------------------------------------------------------------------
  // exercises — extended for paliers (Decisions 9, 10, 46, 52, 53, 71, 75)
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
    publishedAt: v.optional(v.number()),

    // ---------------- v2 palier extensions ----------------
    palierIndex: v.optional(v.number()), // 1..10
    palierId: v.optional(v.id("paliers")),
    personalizedFor: v.optional(v.id("profiles")), // "J'en veux encore" personalised pool
    palierAttemptId: v.optional(v.id("palierAttempts")), // attached to current attempt (regen)
    mathExpression: v.optional(v.string()), // Decision 71 — fact-check anchor
    needsManualReview: v.optional(v.boolean()), // Decision 53 — flagged by factCheck
    isVariation: v.optional(v.boolean()), // Decision 52
    originalExerciseId: v.optional(v.id("exercises")), // Decision 52 — traceability
  })
    .index("by_topicId", ["topicId"])
    .index("by_palierId", ["palierId"])
    .index("by_palierAttemptId", ["palierAttemptId"])
    .index("by_personalizedFor", ["personalizedFor"]),

  // ---------------------------------------------------------------------------
  // attempts — added gradedScore + palierAttemptId (Decisions 12, 51, 52)
  // ---------------------------------------------------------------------------
  attempts: defineTable({
    studentId: v.id("profiles"),
    exerciseId: v.id("exercises"),
    submittedAnswer: v.string(),
    isCorrect: v.boolean(),
    attemptNumber: v.number(),
    hintsUsedCount: v.number(),
    timeSpentMs: v.number(),
    submittedAt: v.number(),
    gradedScore: v.optional(v.number()), // 0..10 per scoring.computeExerciseScore
    palierAttemptId: v.optional(v.id("palierAttempts")),
  })
    .index("by_studentId_exerciseId", ["studentId", "exerciseId"])
    .index("by_studentId", ["studentId"])
    .index("by_palierAttemptId", ["palierAttemptId"])
    .index("by_palierAttempt_exercise", ["palierAttemptId", "exerciseId"]),

  // ---------------------------------------------------------------------------
  // studentTopicProgress
  // ---------------------------------------------------------------------------
  studentTopicProgress: defineTable({
    studentId: v.id("profiles"),
    topicId: v.id("topics"),
    completedExercises: v.number(),
    correctExercises: v.number(),
    totalHintsUsed: v.number(),
    masteryLevel: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_studentId", ["studentId"])
    .index("by_studentId_topicId", ["studentId", "topicId"]),

  // ---------------------------------------------------------------------------
  // badges
  // ---------------------------------------------------------------------------
  badges: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    condition: v.string(),
    subjectId: v.optional(v.id("subjects")),
    catalogKey: v.optional(v.string()),
    category: v.optional(v.string()),
    conditionType: v.optional(v.string()),
    conditionParams: v.optional(v.any()),
    order: v.optional(v.number()),
    // D10 — Phase B narrow. Before deploying this validator, run once:
    //   npx convex run badges:normalizeRarities
    // Otherwise the schema push will reject existing rows whose rarity is a
    // legacy free-form string (e.g. "Bronze", "uncommon"). The migration is
    // idempotent so it's safe to re-run.
    rarity: v.optional(
      v.union(
        v.literal("common"),
        v.literal("rare"),
        v.literal("epic"),
        v.literal("legendary"),
      ),
    ),
    source: v.optional(v.string()),
    tierSystem: v.optional(v.string()),
    tiers: v.optional(v.any()),
    visibility: v.optional(v.string()),
    xpReward: v.optional(v.number()),
  }).index("by_rarity", ["rarity"]),

  // ---------------------------------------------------------------------------
  // earnedBadges
  // ---------------------------------------------------------------------------
  earnedBadges: defineTable({
    badgeId: v.id("badges"),
    studentId: v.id("profiles"),
    earnedAt: v.number(),
    currentTier: v.optional(v.number()),
    lastTierUpAt: v.optional(v.number()),
    progressValue: v.optional(v.number()),
  }).index("by_studentId", ["studentId"]),

  // ---------------------------------------------------------------------------
  // pdfUploads (legacy — kept while admin PDF flow is wound down)
  // ---------------------------------------------------------------------------
  pdfUploads: defineTable({
    adminId: v.id("profiles"),
    storageId: v.string(),
    originalFilename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    subjectId: v.id("subjects"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("extracted"),
      v.literal("reviewed"),
      v.literal("published"),
    ),
    extractedRaw: v.optional(v.any()),
    extractedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // ---------------------------------------------------------------------------
  // topicReports
  // ---------------------------------------------------------------------------
  topicReports: defineTable({
    studentId: v.id("profiles"),
    topicId: v.id("topics"),
    score: v.number(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    frequentMistakes: v.array(v.string()),
    emailSentAt: v.optional(v.number()),
  }).index("by_studentId_topicId", ["studentId", "topicId"]),

  // ===========================================================================
  // v2 NEW TABLES
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // paliers
  // (subject, class, topic, palierIndex) bucket with weekly cache.
  // Decisions 3, 9, 10, 46, 53, 56, 75
  // ---------------------------------------------------------------------------
  paliers: defineTable({
    subjectId: v.id("subjects"),
    topicId: v.id("topics"),
    class: classEnum,
    palierIndex: v.number(), // 1..10
    status: v.union(
      v.literal("cached"),
      v.literal("stale"),
      v.literal("generating"),
    ),
    qaStatus: v.optional(
      v.union(
        v.literal("auto_ok"),
        v.literal("pending_human"),
        v.literal("human_approved"),
        v.literal("rejected"),
      ),
    ),
    factCheckResults: v.optional(
      v.object({
        totalChecked: v.number(),
        divergences: v.number(),
      }),
    ),
    shuffleSeed: v.optional(v.string()), // Decision 75 — server-side deterministic shuffle seed prefix
    preGenerated: v.optional(v.boolean()), // Decision 73 — tagged by J0 pre-gen script
    generatedAt: v.number(),
    expiresAt: v.number(), // generatedAt + 7d
    generationTraceId: v.optional(v.string()),
  })
    .index("by_bucket", ["subjectId", "class", "topicId", "palierIndex"])
    .index("by_topic_class", ["topicId", "class"])
    .index("by_status", ["status"]),

  // ---------------------------------------------------------------------------
  // palierAttempts
  // Track a kid's run through a palier (10 exos). Status drives UI + regen.
  // Decisions 12, 13, 50, 52, 59, 78
  // ---------------------------------------------------------------------------
  palierAttempts: defineTable({
    userId: v.id("profiles"),
    palierId: v.id("paliers"),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(
      v.literal("in_progress"),
      v.literal("validated"),
      v.literal("failed"),
      v.literal("regen_failed"), // Decision 78
      v.literal("abandoned"),
    ),
    averageScore: v.optional(v.number()), // 0..10
    failedExerciseIds: v.optional(v.array(v.id("exercises"))),
    regenCount: v.number(), // 0..3, capped at submitPalier-level
  })
    .index("by_user", ["userId"])
    .index("by_user_palier", ["userId", "palierId"])
    .index("by_palier", ["palierId"]),

  // ---------------------------------------------------------------------------
  // palierAttemptHistory
  // Cumulative regen tracking per (user, palier) over a 7-day rolling window.
  // Decisions 60, 77, 88
  // ---------------------------------------------------------------------------
  palierAttemptHistory: defineTable({
    userId: v.id("profiles"),
    palierId: v.id("paliers"),
    regenCount: v.number(),
    lastRegenAt: v.number(),
    parentNotifiedAt: v.optional(v.number()), // Decision 88 — anti-spam
    createdAt: v.number(),
  })
    .index("by_user_palier", ["userId", "palierId"])
    .index("by_createdAt", ["createdAt"]),

  // ---------------------------------------------------------------------------
  // aiUsage
  // Per-call telemetry (success or failure) for budget + audit.
  // Decisions 4, 45, 69
  // ---------------------------------------------------------------------------
  aiUsage: defineTable({
    userId: v.optional(v.id("profiles")),
    purpose: aiPurposeEnum,
    modelUsed: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    latencyMs: v.number(),
    status: v.union(
      v.literal("ok"),
      v.literal("failed"),
      v.literal("rejected_budget"),
      v.literal("rejected_quota"),
    ),
    traceId: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    month: v.string(), // YYYY-MM, indexed for budget queries
    errorMessage: v.optional(v.string()),
  })
    .index("by_month", ["month"])
    .index("by_month_status", ["month", "status"])
    .index("by_user_month", ["userId", "month"])
    .index("by_traceId", ["traceId"]),

  // ---------------------------------------------------------------------------
  // aiUserQuota
  // Daily rate limit per (user, purpose, scope).
  // Decisions 47, 54
  // ---------------------------------------------------------------------------
  aiUserQuota: defineTable({
    userId: v.id("profiles"),
    purpose: aiPurposeEnum,
    quotaScope: v.union(
      v.literal("kid_initiated"),
      v.literal("system_regen"),
    ),
    count: v.number(),
    resetAt: v.number(), // unix ms; row is replaced on next day
    dayKey: v.string(), // YYYY-MM-DD for fast lookup
  })
    .index("by_user_scope_day", ["userId", "quotaScope", "dayKey"])
    .index("by_user_purpose_day", ["userId", "purpose", "dayKey"]),

  // ---------------------------------------------------------------------------
  // settings (singleton)
  // Decisions 4, 45, 69, 70, 76
  // ---------------------------------------------------------------------------
  settings: defineTable({
    singleton: v.literal("settings"), // always "settings"
    aiMonthlyBudgetUsd: v.number(), // default 100
    economyMode: v.boolean(), // default false (auto-on at 90%)
    dailyMoreLimitPerKid: v.number(), // default 3
    modelOverrides: v.optional(v.record(v.string(), v.string())), // purpose -> modelId
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("profiles")),
  }).index("by_singleton", ["singleton"]),

  // ---------------------------------------------------------------------------
  // exerciseExplanations
  // AI-generated step-by-step explanation cached per exercise. Triggered on
  // kid request after exhausting all 5 attempts. Cache-first to keep the
  // explain_mistake AI cost bounded — same explanation served to every kid
  // that bricks on the same exercise.
  // ---------------------------------------------------------------------------
  exerciseExplanations: defineTable({
    exerciseId: v.id("exercises"),
    intro: v.string(),
    steps: v.array(v.string()),
    conclusion: v.string(),
    generatedAt: v.number(),
    model: v.string(),
    traceId: v.optional(v.string()),
  }).index("by_exercise", ["exerciseId"]),

  // ---------------------------------------------------------------------------
  // exerciseReports
  // Kid-flagged exos via "Cet exo est bizarre" button. Decision 94
  // ---------------------------------------------------------------------------
  exerciseReports: defineTable({
    exerciseId: v.id("exercises"),
    userId: v.id("profiles"),
    reason: v.optional(
      v.union(
        v.literal("unclear"),
        v.literal("wrong_answer"),
        v.literal("too_hard"),
        v.literal("other"),
      ),
    ),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_exercise", ["exerciseId"])
    .index("by_user", ["userId"]),

  // ---------------------------------------------------------------------------
  // linkRequests
  // Parent→Student link requests awaiting student email confirmation.
  // ---------------------------------------------------------------------------
  linkRequests: defineTable({
    parentId: v.id("profiles"),
    studentId: v.id("profiles"),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_parentId", ["parentId"])
    .index("by_studentId", ["studentId"]),

  // ---------------------------------------------------------------------------
  // parentSettings
  // Per-kid wellbeing toggles, owned by the parent profile. Decision 84
  // ---------------------------------------------------------------------------
  parentSettings: defineTable({
    parentId: v.id("profiles"),
    kidId: v.id("profiles"),
    streaksEnabled: v.boolean(),
    dailyMissionEnabled: v.boolean(),
    kidPushNotifsEnabled: v.boolean(),
    parentLowScoreNotifEnabled: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_kid", ["kidId"])
    .index("by_parent_kid", ["parentId", "kidId"]),
});
