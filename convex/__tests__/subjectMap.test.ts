import { describe, it, expect } from "vitest";
import {
  resolveTopicStatuses,
  type TopicInput,
} from "../students";

function makeTopic(
  overrides: Partial<TopicInput> & { order: number },
): TopicInput {
  return {
    id: `topic_${overrides.order}`,
    isCompleted: false,
    validatedPaliers: 0,
    hasInProgress: false,
    completedExercises: 0,
    ...overrides,
  };
}

describe("resolveTopicStatuses — D4 linear unlock chain", () => {
  it("single topic with no progress → available", () => {
    const statuses = resolveTopicStatuses([makeTopic({ order: 1 })]);
    expect(statuses).toEqual(["available"]);
  });

  it("single completed topic → completed", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1, isCompleted: true }),
    ]);
    expect(statuses).toEqual(["completed"]);
  });

  it("first available, second locked when first has no progress", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1 }),
      makeTopic({ order: 2 }),
    ]);
    expect(statuses).toEqual(["available", "locked"]);
  });

  it("completed → available chain", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1, isCompleted: true }),
      makeTopic({ order: 2 }),
    ]);
    expect(statuses).toEqual(["completed", "available"]);
  });

  it("1 validated palier unlocks the next topic", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1, validatedPaliers: 1 }),
      makeTopic({ order: 2 }),
    ]);
    expect(statuses[0]).toBe("in_progress");
    expect(statuses[1]).toBe("available");
  });

  it("in_progress (hasInProgress flag) does NOT unlock the next", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1, hasInProgress: true }),
      makeTopic({ order: 2 }),
    ]);
    expect(statuses[0]).toBe("in_progress");
    expect(statuses[1]).toBe("locked");
  });

  it("completedExercises > 0 marks in_progress but does NOT unlock next", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1, completedExercises: 5 }),
      makeTopic({ order: 2 }),
    ]);
    expect(statuses[0]).toBe("in_progress");
    expect(statuses[1]).toBe("locked");
  });

  it("full chain: completed → in_progress → available → locked → locked", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1, isCompleted: true }),
      makeTopic({ order: 2, validatedPaliers: 2 }),
      makeTopic({ order: 3 }),
      makeTopic({ order: 4 }),
      makeTopic({ order: 5 }),
    ]);
    expect(statuses).toEqual([
      "completed",
      "in_progress",
      "available",
      "locked",
      "locked",
    ]);
  });

  it("all completed → all completed", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 1, isCompleted: true }),
      makeTopic({ order: 2, isCompleted: true }),
      makeTopic({ order: 3, isCompleted: true }),
    ]);
    expect(statuses).toEqual(["completed", "completed", "completed"]);
  });

  it("out-of-order input is sorted by order before resolving", () => {
    const statuses = resolveTopicStatuses([
      makeTopic({ order: 3 }),
      makeTopic({ order: 1, isCompleted: true }),
      makeTopic({ order: 2 }),
    ]);
    expect(statuses).toEqual(["completed", "available", "locked"]);
  });

  it("empty list returns empty", () => {
    expect(resolveTopicStatuses([])).toEqual([]);
  });
});
