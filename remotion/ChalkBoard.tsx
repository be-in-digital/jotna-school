import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BoardSpec } from "./types";

export const CHALK = "#fdf6e3";
export const CHALK_DIM = "rgba(253, 246, 227, 0.72)";
const CHALK_YELLOW = "#fde68a";
const CHALK_GLOW = "0 0 6px rgba(253,246,227,0.28)";

/** Deterministic hand-drawn wobble (Math.random is unavailable in Remotion). */
const jitter = (i: number) => ((i * 37) % 5) - 2;

/** Staggered chalk "draw-in": each element pops with a small delay. */
function useDrawIn(index: number, perItemDelay = 3) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - 8 - index * perItemDelay,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 160 },
  });
}

const ChalkLabel: React.FC<{ label?: string }> = ({ label }) =>
  label ? (
    <div
      style={{
        marginTop: 20,
        color: CHALK_DIM,
        fontSize: 30,
        fontWeight: 600,
        textAlign: "center",
        textShadow: CHALK_GLOW,
      }}
    >
      {label}
    </div>
  ) : null;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const FractionPie: React.FC<{
  parts: number;
  filled: number;
  label?: string;
}> = ({ parts, filled, label }) => {
  const appear = useDrawIn(0);
  const R = 118;
  const C = 130;
  const slices = [];
  for (let i = 0; i < parts; i++) {
    const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    const large = 1 / parts > 0.5 ? 1 : 0;
    const d = [
      `M ${C} ${C}`,
      `L ${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)}`,
      `A ${R} ${R} 0 ${large} 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)}`,
      "Z",
    ].join(" ");
    slices.push(
      <path
        key={i}
        d={d}
        fill={i < filled ? "rgba(253, 230, 138, 0.85)" : "transparent"}
        stroke={CHALK}
        strokeWidth={5}
        strokeLinejoin="round"
      />,
    );
  }
  return (
    <div style={{ transform: `scale(${appear}) rotate(${jitter(1)}deg)` }}>
      <svg width={260} height={260} viewBox="0 0 260 260">
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke={CHALK}
          strokeWidth={6}
        />
        {slices}
      </svg>
      <ChalkLabel label={label} />
    </div>
  );
};

const ObjectsGroup: React.FC<{
  emoji: string;
  count: number;
  groups?: number;
  crossed?: number;
  label?: string;
}> = ({ emoji, count, groups, crossed = 0, label }) => {
  const n = Math.max(1, Math.min(count, 12));
  const g = Math.max(1, Math.min(groups ?? 1, n));
  const perGroup = Math.ceil(n / g);
  const buckets: number[][] = Array.from({ length: g }, (_, gi) =>
    Array.from(
      { length: Math.min(perGroup, n - gi * perGroup) },
      (_, k) => gi * perGroup + k,
    ).filter((idx) => idx < n),
  ).filter((b) => b.length > 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 26,
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
          maxWidth: 560,
        }}
      >
        {buckets.map((bucket, bi) => (
          <div
            key={bi}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
              maxWidth: 200,
              padding: buckets.length > 1 ? "14px 16px" : 0,
              border:
                buckets.length > 1 ? `4px dashed ${CHALK_DIM}` : undefined,
              borderRadius: 22,
              transform: `rotate(${jitter(bi)}deg)`,
            }}
          >
            {bucket.map((idx) => (
              <ObjectItem
                key={idx}
                index={idx}
                emoji={emoji}
                isCrossed={idx >= n - crossed}
              />
            ))}
          </div>
        ))}
      </div>
      <ChalkLabel label={label} />
    </div>
  );
};

const ObjectItem: React.FC<{
  index: number;
  emoji: string;
  isCrossed: boolean;
}> = ({ index, emoji, isCrossed }) => {
  const appear = useDrawIn(index);
  return (
    <span
      style={{
        position: "relative",
        fontSize: 52,
        lineHeight: 1.1,
        display: "inline-block",
        transform: `scale(${appear}) rotate(${jitter(index)}deg)`,
        filter: isCrossed ? "grayscale(0.9) opacity(0.6)" : undefined,
      }}
    >
      {emoji}
      {isCrossed ? (
        <span
          style={{
            position: "absolute",
            left: -4,
            right: -4,
            top: "48%",
            height: 5,
            background: CHALK,
            borderRadius: 3,
            transform: "rotate(-18deg)",
          }}
        />
      ) : null}
    </span>
  );
};

const NumberLine: React.FC<{
  from: number;
  to: number;
  marks: number[];
  label?: string;
}> = ({ from, to, marks, label }) => {
  const appear = useDrawIn(0);
  const W = 560;
  const span = Math.max(1, to - from);
  const ticks = span <= 12 ? span : 10;
  const xFor = (v: number) => 30 + ((v - from) / span) * (W - 60);
  return (
    <div style={{ transform: `scale(${appear})` }}>
      <svg width={W} height={150} viewBox={`0 0 ${W} 150`}>
        <line
          x1={16}
          y1={80}
          x2={W - 10}
          y2={80}
          stroke={CHALK}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path
          d={`M ${W - 26} 68 L ${W - 8} 80 L ${W - 26} 92`}
          fill="none"
          stroke={CHALK}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = from + (i * span) / ticks;
          const x = xFor(v);
          return (
            <g key={i}>
              <line
                x1={x}
                y1={70}
                x2={x}
                y2={90}
                stroke={CHALK}
                strokeWidth={4}
                strokeLinecap="round"
              />
              <text
                x={x}
                y={126}
                textAnchor="middle"
                fill={CHALK_DIM}
                fontSize={26}
                fontWeight={600}
              >
                {Math.round(v * 100) / 100}
              </text>
            </g>
          );
        })}
        {marks.slice(0, 6).map((m, i) => (
          <circle
            key={i}
            cx={xFor(m)}
            cy={80}
            r={20}
            fill="none"
            stroke={CHALK_YELLOW}
            strokeWidth={5}
          />
        ))}
      </svg>
      <ChalkLabel label={label} />
    </div>
  );
};

const Operation: React.FC<{ expr: string; label?: string }> = ({
  expr,
  label,
}) => {
  const appear = useDrawIn(0);
  return (
    <div style={{ transform: `scale(${appear}) rotate(${jitter(2)}deg)` }}>
      <div
        style={{
          color: CHALK,
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: 4,
          textAlign: "center",
          textShadow: CHALK_GLOW,
        }}
      >
        {expr}
      </div>
      <ChalkLabel label={label} />
    </div>
  );
};

const Compare: React.FC<{ left: string; right: string; symbol: string }> = ({
  left,
  right,
  symbol,
}) => {
  const a1 = useDrawIn(0);
  const a2 = useDrawIn(2);
  const a3 = useDrawIn(4);
  const box: React.CSSProperties = {
    border: `5px solid ${CHALK}`,
    borderRadius: 20,
    padding: "18px 30px",
    color: CHALK,
    fontSize: 58,
    fontWeight: 700,
    textShadow: CHALK_GLOW,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
      <div
        style={{ ...box, transform: `scale(${a1}) rotate(${jitter(0)}deg)` }}
      >
        {left}
      </div>
      <div
        style={{
          color: CHALK_YELLOW,
          fontSize: 84,
          fontWeight: 700,
          transform: `scale(${a2})`,
          textShadow: CHALK_GLOW,
        }}
      >
        {symbol}
      </div>
      <div
        style={{ ...box, transform: `scale(${a3}) rotate(${jitter(3)}deg)` }}
      >
        {right}
      </div>
    </div>
  );
};

const Boxes: React.FC<{ items: string[]; label?: string }> = ({
  items,
  label,
}) => {
  const shown = items.slice(0, 5);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: 600,
        }}
      >
        {shown.map((item, i) => (
          <BoxItem
            key={i}
            index={i}
            text={item}
            isLast={i === shown.length - 1}
          />
        ))}
      </div>
      <ChalkLabel label={label} />
    </div>
  );
};

const BoxItem: React.FC<{ index: number; text: string; isLast: boolean }> = ({
  index,
  text,
  isLast,
}) => {
  const appear = useDrawIn(index, 5);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          border: `4px solid ${CHALK}`,
          borderRadius: 16,
          padding: "12px 20px",
          color: CHALK,
          fontSize: 32,
          fontWeight: 600,
          textShadow: CHALK_GLOW,
          transform: `scale(${appear}) rotate(${jitter(index)}deg)`,
          maxWidth: 170,
        }}
      >
        {text}
      </div>
      {!isLast ? (
        <span
          style={{
            color: CHALK_YELLOW,
            fontSize: 40,
            fontWeight: 700,
            transform: `scale(${appear})`,
          }}
        >
          →
        </span>
      ) : null}
    </div>
  );
};

const WordHighlight: React.FC<{
  text: string;
  highlight?: string;
  label?: string;
}> = ({ text, highlight, label }) => {
  const appear = useDrawIn(0);
  const parts: { str: string; hot: boolean }[] = [];
  if (highlight && highlight.length > 0) {
    const lower = text.toLowerCase();
    const needle = highlight.toLowerCase();
    let i = 0;
    while (i < text.length) {
      const at = lower.indexOf(needle, i);
      if (at === -1) {
        parts.push({ str: text.slice(i), hot: false });
        break;
      }
      if (at > i) parts.push({ str: text.slice(i, at), hot: false });
      parts.push({ str: text.slice(at, at + needle.length), hot: true });
      i = at + needle.length;
    }
  } else {
    parts.push({ str: text, hot: false });
  }
  return (
    <div style={{ transform: `scale(${appear})`, textAlign: "center" }}>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: CHALK,
          textShadow: CHALK_GLOW,
        }}
      >
        {parts.map((p, i) =>
          p.hot ? (
            <span
              key={i}
              style={{
                color: CHALK_YELLOW,
                borderBottom: `6px solid ${CHALK_YELLOW}`,
                borderRadius: 2,
              }}
            >
              {p.str}
            </span>
          ) : (
            <span key={i}>{p.str}</span>
          ),
        )}
      </div>
      <ChalkLabel label={label} />
    </div>
  );
};

const Keyword: React.FC<{ text: string }> = ({ text }) => {
  const appear = useDrawIn(0);
  return (
    <div
      style={{
        border: `5px dashed ${CHALK_DIM}`,
        borderRadius: 24,
        padding: "26px 40px",
        color: CHALK,
        fontSize: 46,
        fontWeight: 700,
        textAlign: "center",
        maxWidth: 560,
        textShadow: CHALK_GLOW,
        transform: `scale(${appear}) rotate(${jitter(1)}deg)`,
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dispatcher — defensive: any invalid spec falls back to a chalk note.
// ---------------------------------------------------------------------------

export const ChalkDrawing: React.FC<{
  board: BoardSpec | null | undefined;
  /** Fallback note when the spec is missing/invalid (e.g. step keywords). */
  fallbackText: string;
}> = ({ board, fallbackText }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [2, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Every branch coerces and clamps its params BEFORE building JSX, so a
  // malformed spec degrades to the chalk-note fallback instead of throwing.
  let inner: React.ReactNode;
  switch (board?.kind) {
    case "fraction": {
      const parts = Math.max(2, Math.min(Number(board.parts) || 2, 12));
      const filled = Math.max(0, Math.min(Number(board.filled) || 0, parts));
      inner = <FractionPie parts={parts} filled={filled} label={board.label} />;
      break;
    }
    case "objects": {
      const emoji =
        typeof board.emoji === "string" && board.emoji.trim()
          ? board.emoji.trim()
          : "🥭";
      inner = (
        <ObjectsGroup
          emoji={emoji}
          count={Number(board.count) || 1}
          groups={board.groups ? Number(board.groups) : undefined}
          crossed={board.crossed ? Number(board.crossed) : 0}
          label={board.label}
        />
      );
      break;
    }
    case "numberline": {
      const from = Number(board.from) || 0;
      const to = Number(board.to);
      inner = (
        <NumberLine
          from={from}
          to={Number.isFinite(to) && to > from ? to : from + 10}
          marks={
            Array.isArray(board.marks)
              ? board.marks.map(Number).filter(Number.isFinite)
              : []
          }
          label={board.label}
        />
      );
      break;
    }
    case "operation": {
      const expr =
        typeof board.expr === "string" ? board.expr.slice(0, 16) : "";
      inner = expr ? <Operation expr={expr} label={board.label} /> : null;
      break;
    }
    case "compare": {
      if (typeof board.left === "string" && typeof board.right === "string") {
        inner = (
          <Compare
            left={board.left.slice(0, 8)}
            right={board.right.slice(0, 8)}
            symbol={
              typeof board.symbol === "string" ? board.symbol.slice(0, 2) : "?"
            }
          />
        );
      }
      break;
    }
    case "boxes": {
      const items = Array.isArray(board.items)
        ? board.items.filter((s): s is string => typeof s === "string")
        : [];
      inner =
        items.length >= 2 ? <Boxes items={items} label={board.label} /> : null;
      break;
    }
    case "word": {
      if (typeof board.text === "string" && board.text.trim()) {
        inner = (
          <WordHighlight
            text={board.text.slice(0, 40)}
            highlight={
              typeof board.highlight === "string" ? board.highlight : undefined
            }
            label={board.label}
          />
        );
      }
      break;
    }
    case "keyword": {
      if (typeof board.text === "string" && board.text.trim()) {
        inner = <Keyword text={board.text.slice(0, 60)} />;
      }
      break;
    }
    default:
      inner = null;
  }

  if (!inner) {
    inner = <Keyword text={fallbackText} />;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade,
      }}
    >
      {inner}
    </div>
  );
};
