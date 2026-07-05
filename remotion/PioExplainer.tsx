import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { CHALK, CHALK_DIM, ChalkDrawing } from "./ChalkBoard";
import type { ExplainerSegment, PioExplainerProps } from "./types";

const { fontFamily } = loadFont();

const POSE_FILES: Record<ExplainerSegment["pose"], string> = {
  hello: "images/pio/hello.png",
  amazed: "images/pio/amazed.png",
  think: "images/pio/think.png",
  encourage: "images/pio/encourage.png",
  cheer: "images/pio/cheer.png",
};

/** Chalk-note fallback when a step has no drawing: its first few words. */
function fallbackNote(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= 6 ? text : `${words.slice(0, 6).join(" ")}…`;
}

/**
 * One narrated beat, staged like a real classroom: Pio's VOICE explains (the
 * spoken line sits in the bottom speech card as a reading aid), while the
 * blackboard shows his teaching support — a chalk drawing (fraction pie,
 * mango groups, number line…) chosen by the AI script, never the sentence
 * itself. Poses swap per segment with a soft entrance — the body never
 * floats (G-decision: Pio stays grounded).
 */
const SegmentScene: React.FC<{
  segment: ExplainerSegment;
  title: string;
  totalSteps: number;
}> = ({ segment, title, totalSteps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const textReveal = interpolate(frame, [4, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isStep = segment.role === "step";

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {segment.audioSrc ? <Audio src={segment.audioSrc} /> : null}

      {/* Blackboard content — the teacher's visual support */}
      <div
        style={{
          position: "absolute",
          left: 84,
          top: 96,
          width: 690,
          height: 434,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 40px",
          textAlign: "center",
        }}
      >
        {isStep ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 26,
                opacity: appear,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  border: `3px solid ${CHALK}`,
                  color: CHALK,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {segment.stepNumber}
              </div>
              <div style={{ color: CHALK_DIM, fontSize: 24, fontWeight: 600 }}>
                Étape {segment.stepNumber} / {totalSteps}
              </div>
            </div>
            <ChalkDrawing
              board={segment.board}
              fallbackText={fallbackNote(segment.text)}
            />
          </>
        ) : (
          <>
            <div
              style={{
                color: CHALK_DIM,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 18,
                opacity: appear,
              }}
            >
              {segment.role === "intro" ? "Pio t'explique" : "À retenir"}
            </div>
            {segment.role === "intro" ? (
              <div
                style={{
                  color: CHALK,
                  fontSize: 42,
                  lineHeight: 1.3,
                  fontWeight: 700,
                  opacity: textReveal,
                  textShadow: "0 0 6px rgba(253,246,227,0.25)",
                }}
              >
                {title}
              </div>
            ) : (
              <ChalkDrawing
                board={segment.board ?? null}
                fallbackText={fallbackNote(segment.text)}
              />
            )}
          </>
        )}
      </div>

      {/* Pio — grounded, pose per segment, soft entrance only */}
      <Img
        src={staticFile(POSE_FILES[segment.pose])}
        style={{
          position: "absolute",
          right: 64,
          bottom: 34,
          height: 360,
          transformOrigin: "bottom center",
          transform: `scale(${0.94 + 0.06 * appear})`,
          opacity: Math.min(1, appear * 1.4),
          filter: "drop-shadow(0 14px 10px rgba(90, 50, 0, 0.25))",
        }}
      />

      {/* Spoken line — reading aid for beginner readers */}
      <div
        style={{
          position: "absolute",
          left: 84,
          right: 84,
          bottom: 26,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            background: "rgba(255, 251, 240, 0.96)",
            border: "3px solid #fcd34d",
            borderBottom: "6px solid #d97706",
            borderRadius: 22,
            padding: "12px 26px",
            color: "#451a03",
            fontSize: 26,
            lineHeight: 1.3,
            fontWeight: 600,
            textAlign: "center",
            opacity: textReveal,
          }}
        >
          {segment.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Static savanna-classroom backdrop: sky, sun, ground, board and its frame. */
const Backdrop: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 58%, #fbd38d 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 46,
        right: 120,
        width: 130,
        height: 130,
        borderRadius: 65,
        background: "radial-gradient(circle, #fcd34d 0%, #f59e0b 70%)",
        boxShadow: "0 0 80px 28px rgba(245, 158, 11, 0.45)",
      }}
    />
    {/* Ground */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 132,
        background: "linear-gradient(180deg, #f6ad55 0%, #ed8936 100%)",
        borderTop: "6px solid rgba(146, 64, 14, 0.25)",
      }}
    />
    {/* Blackboard: wooden chunky frame + deep green slate + chalk tray */}
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 76,
        width: 730,
        height: 474,
        borderRadius: 30,
        background: "#92400e",
        boxShadow: "0 18px 0 rgba(120, 53, 15, 0.55), 0 24px 40px rgba(90, 50, 0, 0.3)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 84,
        top: 96,
        width: 690,
        height: 434,
        borderRadius: 20,
        background: "radial-gradient(ellipse at 30% 25%, #2f5648 0%, #1d3a30 75%)",
        boxShadow: "inset 0 0 46px rgba(0,0,0,0.45)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 240,
        top: 556,
        width: 380,
        height: 16,
        borderRadius: 8,
        background: "#b45309",
        boxShadow: "0 4px 0 rgba(120, 53, 15, 0.6)",
      }}
    />
  </AbsoluteFill>
);

export const PioExplainer: React.FC<PioExplainerProps> = ({
  title,
  segments,
}) => {
  const totalSteps = segments.filter((s) => s.role === "step").length;
  // Start frame of each segment = sum of the previous segments' durations.
  const starts = segments.reduce<number[]>(
    (acc, _s, i) =>
      i === 0 ? [0] : [...acc, acc[i - 1] + segments[i - 1].durationInFrames],
    [],
  );

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: "#fef3c7" }}>
      <Backdrop />
      {segments.map((segment, i) => (
        <Sequence
          key={i}
          from={starts[i]}
          durationInFrames={segment.durationInFrames}
          name={`${segment.role}${segment.stepNumber ? ` ${segment.stepNumber}` : ""}`}
        >
          <SegmentScene
            segment={segment}
            title={title}
            totalSteps={totalSteps}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
