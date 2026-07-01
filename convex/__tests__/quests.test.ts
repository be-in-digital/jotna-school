import { describe, it, expect } from "vitest";
import {
  buildDailyQuests,
  applyQuestEvents,
  dailyMissionsEnabled,
  hashSeed,
  mulberry32,
  COLD_START_QUEST,
  type DailyQuest,
  type QuestEvent,
} from "../quests";
import type { Id } from "../_generated/dataModel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const subjectId = (s: string) => s as Id<"subjects">;

const SUBJECTS = [
  { _id: subjectId("subj_math"), name: "Mathématiques" },
  { _id: subjectId("subj_fr"), name: "Français" },
  { _id: subjectId("subj_sci"), name: "Sciences" },
];

function regularQuests(seed = "student1:2026-07-01"): DailyQuest[] {
  return buildDailyQuests({ seed, isColdStart: false, subjects: SUBJECTS });
}

// ---------------------------------------------------------------------------
// PRNG / seed
// ---------------------------------------------------------------------------

describe("hashSeed + mulberry32", () => {
  it("is deterministic for the same input", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
    const r1 = mulberry32(hashSeed("abc"));
    const r2 = mulberry32(hashSeed("abc"));
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });

  it("produces values in [0, 1)", () => {
    const rand = mulberry32(hashSeed("xyz"));
    for (let i = 0; i < 100; i++) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

// ---------------------------------------------------------------------------
// buildDailyQuests
// ---------------------------------------------------------------------------

describe("buildDailyQuests", () => {
  it("returns the single welcome quest on cold start (D8)", () => {
    const quests = buildDailyQuests({
      seed: "kid:2026-07-01",
      isColdStart: true,
      subjects: SUBJECTS,
    });
    expect(quests).toHaveLength(1);
    expect(quests[0]).toMatchObject({
      type: "validate_palier",
      target: 1,
      progress: 0,
      reward: COLD_START_QUEST.reward,
    });
  });

  it("is deterministic: same (student, day) seed → identical quests", () => {
    expect(regularQuests()).toEqual(regularQuests());
  });

  it("varies with the seed (different day → different set)", () => {
    const seeds = Array.from(
      { length: 10 },
      (_, i) => `student1:2026-07-${String(i + 1).padStart(2, "0")}`,
    );
    const serialized = seeds.map((s) => JSON.stringify(regularQuests(s)));
    expect(new Set(serialized).size).toBeGreaterThan(1);
  });

  it("always starts with the effort quest and has unique keys", () => {
    for (let day = 1; day <= 15; day++) {
      const quests = regularQuests(`kid42:2026-06-${String(day).padStart(2, "0")}`);
      expect(quests).toHaveLength(3);
      expect(quests[0].type).toBe("do_exercises");
      expect(quests[0].target).toBeGreaterThanOrEqual(5);
      expect(quests[0].target).toBeLessThanOrEqual(8);
      const keys = quests.map((q) => q.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const quest of quests) {
        expect(quest.progress).toBe(0);
        expect(quest.completedAt).toBeUndefined();
        expect(quest.reward).toBeGreaterThan(0);
      }
    }
  });

  it("targets a real subject when building the subject quest", () => {
    for (let day = 1; day <= 20; day++) {
      const quests = regularQuests(`kid7:2026-05-${String(day).padStart(2, "0")}`);
      const subjectQuest = quests.find((q) => q.type === "subject_exercises");
      if (subjectQuest) {
        const match = SUBJECTS.find((s) => s._id === subjectQuest.subjectId);
        expect(match).toBeDefined();
        expect(subjectQuest.subjectName).toBe(match!.name);
        expect(subjectQuest.label).toContain(match!.name);
      }
    }
  });

  it("falls back gracefully when no subjects exist (no broken quest)", () => {
    for (let day = 1; day <= 15; day++) {
      const quests = buildDailyQuests({
        seed: `kid:2026-04-${String(day).padStart(2, "0")}`,
        isColdStart: false,
        subjects: [],
      });
      expect(quests.length).toBeGreaterThanOrEqual(2);
      expect(quests.every((q) => q.type !== "subject_exercises")).toBe(true);
      const keys = quests.map((q) => q.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

// ---------------------------------------------------------------------------
// applyQuestEvents
// ---------------------------------------------------------------------------

const NOW = 1_750_000_000_000;

function questsFixture(): DailyQuest[] {
  return [
    {
      key: "do_exercises",
      type: "do_exercises",
      label: "Fais 5 exercices",
      target: 5,
      progress: 0,
      reward: 1,
    },
    {
      key: "correct_answers",
      type: "correct_answers",
      label: "Trouve 3 bonnes réponses",
      target: 3,
      progress: 2,
      reward: 1,
    },
    {
      key: "subject_exercises",
      type: "subject_exercises",
      label: "Fais 3 exercices de Mathématiques",
      target: 3,
      progress: 0,
      reward: 2,
      subjectId: subjectId("subj_math"),
      subjectName: "Mathématiques",
    },
  ];
}

describe("applyQuestEvents", () => {
  it("increments effort quest on exercise_attempted", () => {
    const { quests } = applyQuestEvents(
      questsFixture(),
      [{ type: "exercise_attempted" }],
      NOW,
    );
    expect(quests[0].progress).toBe(1);
    expect(quests[1].progress).toBe(2); // untouched
  });

  it("routes subject events only to the matching subject quest", () => {
    const events: QuestEvent[] = [
      { type: "exercise_attempted", subjectId: subjectId("subj_math") },
      { type: "exercise_attempted", subjectId: subjectId("subj_fr") },
    ];
    const { quests } = applyQuestEvents(questsFixture(), events, NOW);
    // Both attempts count for the generic effort quest…
    expect(quests[0].progress).toBe(2);
    // …but only the math one advances the subject quest.
    expect(quests[2].progress).toBe(1);
  });

  it("completes a quest at target, stamps completedAt, reports it once", () => {
    const { quests, newlyCompleted } = applyQuestEvents(
      questsFixture(),
      [{ type: "exercise_correct" }],
      NOW,
    );
    expect(quests[1].progress).toBe(3);
    expect(quests[1].completedAt).toBe(NOW);
    expect(newlyCompleted).toHaveLength(1);
    expect(newlyCompleted[0].key).toBe("correct_answers");
  });

  it("caps progress at target and never re-completes a finished quest", () => {
    const first = applyQuestEvents(
      questsFixture(),
      [
        { type: "exercise_correct" },
        { type: "exercise_correct" },
        { type: "exercise_correct" },
      ],
      NOW,
    );
    expect(first.quests[1].progress).toBe(3); // capped, target = 3
    expect(first.newlyCompleted).toHaveLength(1);

    const second = applyQuestEvents(
      first.quests,
      [{ type: "exercise_correct" }],
      NOW + 1000,
    );
    expect(second.quests[1].progress).toBe(3);
    expect(second.quests[1].completedAt).toBe(NOW); // original timestamp kept
    expect(second.newlyCompleted).toHaveLength(0);
  });

  it("keeps reference identity for untouched quests (no-op patch guard)", () => {
    const before = questsFixture();
    const { quests } = applyQuestEvents(
      before,
      [{ type: "palier_validated" }],
      NOW,
    );
    // No quest matches palier_validated in this fixture → every ref intact.
    quests.forEach((quest, i) => expect(quest).toBe(before[i]));
  });

  it("advances validate_palier quests on palier_validated", () => {
    const quests: DailyQuest[] = [
      {
        key: "validate_palier",
        type: "validate_palier",
        label: "Termine un palier",
        target: 1,
        progress: 0,
        reward: 2,
      },
    ];
    const { quests: next, newlyCompleted } = applyQuestEvents(
      quests,
      [{ type: "palier_validated" }],
      NOW,
    );
    expect(next[0].completedAt).toBe(NOW);
    expect(newlyCompleted.map((q) => q.key)).toEqual(["validate_palier"]);
  });
});

// ---------------------------------------------------------------------------
// dailyMissionsEnabled (G10 — conservative parent gating, mirrors D7)
// ---------------------------------------------------------------------------

describe("dailyMissionsEnabled", () => {
  it("defaults ON when no parent is linked", () => {
    expect(dailyMissionsEnabled([])).toBe(true);
  });

  it("stays ON when all linked parents allow it", () => {
    expect(
      dailyMissionsEnabled([
        { dailyMissionEnabled: true },
        { dailyMissionEnabled: true },
      ]),
    ).toBe(true);
  });

  it("turns OFF when any parent explicitly disables it", () => {
    expect(
      dailyMissionsEnabled([
        { dailyMissionEnabled: true },
        { dailyMissionEnabled: false },
      ]),
    ).toBe(false);
  });
});
