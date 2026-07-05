import { describe, it, expect } from "vitest";
import {
  buildBeats,
  stripStepPrefix,
  type AudioSegment,
} from "@/lib/explainBeats";

const explanation = {
  intro: "Pas de panique, on regarde ça ensemble.",
  steps: ["Analogie du marché.", "On relie à l'exercice.", "On résout."],
  conclusion: "Tu vas y arriver !",
};

describe("buildBeats", () => {
  it("orders beats intro → steps → conclusion", () => {
    const beats = buildBeats(explanation, null, "stuck");
    expect(beats.map((b) => b.role)).toEqual([
      "intro",
      "step",
      "step",
      "step",
      "conclusion",
    ]);
    expect(beats).toHaveLength(explanation.steps.length + 2);
  });

  it("numbers only step beats (1-based), leaves intro/conclusion null", () => {
    const beats = buildBeats(explanation, null, "stuck");
    expect(beats.map((b) => b.stepNumber)).toEqual([null, 1, 2, 3, null]);
  });

  it("opens on 'hello' when stuck and 'cheer' when reviewing a success", () => {
    expect(buildBeats(explanation, null, "stuck")[0].pose).toBe("hello");
    expect(buildBeats(explanation, null, "review")[0].pose).toBe("cheer");
  });

  it("attaches audio only when it lines up 1:1 with the beats", () => {
    const audio: AudioSegment[] = [
      { url: "u0", text: "a", role: "intro" },
      { url: "u1", text: "b", role: "step" },
      { url: "u2", text: "c", role: "step" },
      { url: "u3", text: "d", role: "step" },
      { url: "u4", text: "e", role: "conclusion" },
    ];
    const beats = buildBeats(explanation, audio, "stuck");
    expect(beats.map((b) => b.audioUrl)).toEqual([
      "u0",
      "u1",
      "u2",
      "u3",
      "u4",
    ]);
  });

  it("falls back to no audio when the count mismatches (browser voice)", () => {
    const audio: AudioSegment[] = [
      { url: "u0", text: "a", role: "intro" },
      { url: "u1", text: "b", role: "step" },
    ];
    const beats = buildBeats(explanation, audio, "stuck");
    expect(beats.every((b) => b.audioUrl === null)).toBe(true);
  });

  it("strips legacy 'étape N :' prefixes from step display text", () => {
    expect(stripStepPrefix("étape 2 : On relie à l'exercice.")).toBe(
      "On relie à l'exercice.",
    );
    expect(stripStepPrefix("Étape 10 - la règle à retenir")).toBe(
      "la règle à retenir",
    );
    expect(stripStepPrefix("3. On résout ensemble.")).toBe(
      "On résout ensemble.",
    );
    expect(stripStepPrefix("Une phrase normale reste intacte.")).toBe(
      "Une phrase normale reste intacte.",
    );
    const beats = buildBeats(
      { ...explanation, steps: ["étape 1 : Analogie du marché."] },
      null,
      "stuck",
    );
    expect(beats[1].text).toBe("Analogie du marché.");
  });
});
