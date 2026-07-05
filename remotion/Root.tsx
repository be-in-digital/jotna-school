import React from "react";
import { Composition } from "remotion";
import { PioExplainer } from "./PioExplainer";
import {
  EXPLAINER_FPS,
  EXPLAINER_HEIGHT,
  EXPLAINER_TAIL_FRAMES,
  EXPLAINER_WIDTH,
  type PioExplainerProps,
} from "./types";

const PREVIEW_PROPS: PioExplainerProps = {
  title: "Range les nombres du plus petit au plus grand",
  segments: [
    {
      role: "intro",
      text: "Pas de panique, on va comprendre ensemble, étape par étape.",
      stepNumber: null,
      pose: "hello",
      audioSrc: null,
      durationInFrames: 120,
    },
    {
      role: "step",
      text: "Imagine trois mangues de tailles différentes posées au marché.",
      stepNumber: 1,
      pose: "amazed",
      board: { kind: "objects", emoji: "🥭", count: 3, label: "3 mangues" },
      audioSrc: null,
      durationInFrames: 140,
    },
    {
      role: "step",
      text: "On commence toujours par chercher la plus petite mangue.",
      stepNumber: 2,
      pose: "think",
      board: { kind: "compare", left: "3", right: "7", symbol: "<" },
      audioSrc: null,
      durationInFrames: 140,
    },
    {
      role: "conclusion",
      text: "Tu vois, ranger les nombres, c'est comme ranger tes mangues !",
      stepNumber: null,
      pose: "encourage",
      audioSrc: null,
      durationInFrames: 130,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PioExplainer"
      component={PioExplainer}
      fps={EXPLAINER_FPS}
      width={EXPLAINER_WIDTH}
      height={EXPLAINER_HEIGHT}
      defaultProps={PREVIEW_PROPS}
      calculateMetadata={({ props }) => {
        const total = props.segments.reduce(
          (n, s) => n + s.durationInFrames,
          0,
        );
        return {
          durationInFrames: Math.max(EXPLAINER_FPS, total) + EXPLAINER_TAIL_FRAMES,
        };
      }}
    />
  );
};
