import { describe, it, expect } from "vitest";
import {
  evaluateConditionType,
  getConditionText,
  type BadgeStatsSnapshot,
} from "../badges";

const BASE: BadgeStatsSnapshot = {
  totalCorrectExercises: 0,
  topicsCompleted: 0,
  paliersValidated: 0,
  subjectsStarted: 0,
  hasFullSubjectComplete: false,
  longestStreak: 0,
  questsCompletedTotal: 0,
  perfectQuestDays: 0,
  hasEarlyBirdAttempt: false,
};

describe("evaluateConditionType (badges gaming)", () => {
  it("évalue les seuils numériques (>=)", () => {
    expect(
      evaluateConditionType("quests_completed_total", { count: 10 }, {
        ...BASE,
        questsCompletedTotal: 9,
      }),
    ).toBe(false);
    expect(
      evaluateConditionType("quests_completed_total", { count: 10 }, {
        ...BASE,
        questsCompletedTotal: 10,
      }),
    ).toBe(true);
    expect(
      evaluateConditionType("paliers_validated_total", { count: 30 }, {
        ...BASE,
        paliersValidated: 42,
      }),
    ).toBe(true);
    expect(
      evaluateConditionType("streak_days", { count: 7 }, {
        ...BASE,
        longestStreak: 7,
      }),
    ).toBe(true);
    expect(
      evaluateConditionType("exercises_correct_total", { count: 100 }, {
        ...BASE,
        totalCorrectExercises: 99,
      }),
    ).toBe(false);
  });

  it("count par défaut = 1 quand params vides", () => {
    expect(
      evaluateConditionType("perfect_quest_days", {}, {
        ...BASE,
        perfectQuestDays: 1,
      }),
    ).toBe(true);
    expect(
      evaluateConditionType("subjects_started", undefined, {
        ...BASE,
        subjectsStarted: 1,
      }),
    ).toBe(true);
  });

  it("évalue les conditions booléennes", () => {
    expect(evaluateConditionType("subject_full_complete", {}, BASE)).toBe(
      false,
    );
    expect(
      evaluateConditionType("subject_full_complete", {}, {
        ...BASE,
        hasFullSubjectComplete: true,
      }),
    ).toBe(true);
    expect(
      evaluateConditionType("early_bird", {}, {
        ...BASE,
        hasEarlyBirdAttempt: true,
      }),
    ).toBe(true);
  });

  it("refuse les types inconnus (jamais d'attribution accidentelle)", () => {
    expect(
      evaluateConditionType("unknown_type", { count: 0 }, {
        ...BASE,
        questsCompletedTotal: 999,
      }),
    ).toBe(false);
  });
});

describe("getConditionText (critères français)", () => {
  it("génère le texte des nouveaux types", () => {
    expect(getConditionText("x", "quests_completed_total", { count: 1 })).toBe(
      "Termine ta première mission du jour",
    );
    expect(
      getConditionText("x", "quests_completed_total", { count: 10 }),
    ).toBe("Termine 10 missions du jour");
    expect(getConditionText("x", "streak_days", { count: 7 })).toBe(
      "Travaille 7 jours d'affilée",
    );
    expect(getConditionText("x", "early_bird", {})).toBe(
      "Fais un exercice avant 8 h du matin",
    );
  });

  it("retombe sur les conditions historiques puis le fallback", () => {
    expect(getConditionText("complete_topic")).toBe("Termine une thématique");
    expect(getConditionText("mystère")).toBe("Continue à apprendre !");
  });
});
