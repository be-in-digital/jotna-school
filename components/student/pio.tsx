"use client";

import { motion } from "framer-motion";
import { useId } from "react";

export type PioState = "idle" | "hello" | "cheer" | "sad";

type PioProps = {
  state?: PioState;
  size?: number;
  className?: string;
  animated?: boolean;
};

export function Pio({
  state = "idle",
  size = 96,
  className = "",
  animated = true,
}: PioProps) {
  const idBase = useId().replace(/:/g, "");
  const bodyGrad = `pio-body-${idBase}`;
  const maneGrad = `pio-mane-${idBase}`;
  const bellyGrad = `pio-belly-${idBase}`;
  const bagGrad = `pio-bag-${idBase}`;

  const labels: Record<PioState, string> = {
    idle: "Pio te regarde",
    hello: "Pio te dit bonjour",
    cheer: "Pio est content",
    sad: "Pio est pensif",
  };

  return (
    <motion.div
      role="img"
      aria-label={labels[state]}
      className={`pio-container inline-block ${className}`}
      style={{ width: size, height: size }}
      animate={
        animated
          ? state === "cheer"
            ? { rotate: [-3, 3, -3], y: [0, -4, 0] }
            : state === "hello"
              ? { y: [0, -3, 0] }
              : { y: [0, -2, 0] }
          : undefined
      }
      transition={
        animated
          ? {
              duration: state === "cheer" ? 0.6 : 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
    >
      <svg
        viewBox="0 0 100 110"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={bodyGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5b731" />
            <stop offset="100%" stopColor="#e5952b" />
          </linearGradient>
          <radialGradient id={maneGrad} cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="60%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>
          <linearGradient id={bellyGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id={bagGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>

        {/* === TAIL === */}
        <Tail state={state} animated={animated} />

        {/* === FEET === */}
        <ellipse cx="40" cy="100" rx="8" ry="4" fill="#e5952b" />
        <ellipse cx="60" cy="100" rx="8" ry="4" fill="#e5952b" />

        {/* === BODY === */}
        <ellipse cx="50" cy="78" rx="22" ry="24" fill={`url(#${bodyGrad})`} />

        {/* === BELLY === */}
        <ellipse cx="50" cy="82" rx="14" ry="15" fill={`url(#${bellyGrad})`} />

        {/* === ARMS === */}
        <Arms state={state} animated={animated} />

        {/* === BAG (satchel) === */}
        <line
          x1="36"
          y1="56"
          x2="60"
          y2="88"
          stroke="#15803d"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect x="52" y="80" width="16" height="14" rx="3" fill={`url(#${bagGrad})`} />
        <rect x="55" y="83" width="4" height="3" rx="1" fill="#fbbf24" />
        <rect x="61" y="83" width="4" height="3" rx="1" fill="#ef4444" />
        <rect x="55" y="88" width="4" height="3" rx="1" fill="#f97316" />
        <rect x="61" y="88" width="4" height="3" rx="1" fill="#fbbf24" />
        <rect x="52" y="80" width="16" height="2.5" rx="1" fill="#166534" />

        {/* === MANE === */}
        <circle cx="50" cy="38" r="28" fill={`url(#${maneGrad})`} />
        {/* Mane tufts */}
        <ellipse cx="26" cy="30" rx="6" ry="9" fill="#9a3412" transform="rotate(-15 26 30)" />
        <ellipse cx="74" cy="30" rx="6" ry="9" fill="#9a3412" transform="rotate(15 74 30)" />
        <ellipse cx="30" cy="48" rx="5" ry="8" fill="#9a3412" transform="rotate(-30 30 48)" />
        <ellipse cx="70" cy="48" rx="5" ry="8" fill="#9a3412" transform="rotate(30 70 48)" />
        <ellipse cx="40" cy="14" rx="7" ry="5" fill="#b45309" transform="rotate(-10 40 14)" />
        <ellipse cx="60" cy="14" rx="7" ry="5" fill="#b45309" transform="rotate(10 60 14)" />
        <ellipse cx="50" cy="11" rx="5" ry="4" fill="#b45309" />

        {/* === GREEN LEAVES in mane === */}
        <path d="M 44 12 Q 42 6 46 8 Q 43 4 48 7" fill="#22c55e" />
        <path d="M 56 12 Q 58 6 54 8 Q 57 4 52 7" fill="#22c55e" />
        <path d="M 24 36 Q 18 34 22 30 Q 17 32 21 28" fill="#16a34a" />
        <path d="M 76 36 Q 82 34 78 30 Q 83 32 79 28" fill="#16a34a" />

        {/* === HEAD (face area) === */}
        <circle cx="50" cy="38" r="20" fill={`url(#${bodyGrad})`} />

        {/* === EARS === */}
        <ellipse cx="34" cy="20" rx="7" ry="6" fill="#e5952b" />
        <ellipse cx="34" cy="20" rx="4.5" ry="3.5" fill="#fca5a5" opacity="0.6" />
        <ellipse cx="66" cy="20" rx="7" ry="6" fill="#e5952b" />
        <ellipse cx="66" cy="20" rx="4.5" ry="3.5" fill="#fca5a5" opacity="0.6" />

        {/* === EYES === */}
        <Eyes state={state} />

        {/* === NOSE === */}
        <ellipse cx="50" cy="42" rx="3" ry="2.2" fill="#4a2512" />
        <ellipse cx="50" cy="41.5" rx="1.5" ry="0.8" fill="#7c5030" opacity="0.5" />

        {/* === MOUTH === */}
        <Mouth state={state} />

        {/* === CHEEK BLUSH === */}
        {(state === "cheer" || state === "hello") && (
          <>
            <ellipse cx="36" cy="46" rx="4" ry="2.5" fill="#fb923c" opacity="0.4" />
            <ellipse cx="64" cy="46" rx="4" ry="2.5" fill="#fb923c" opacity="0.4" />
          </>
        )}

        {/* === SPARKLES (cheer) === */}
        {state === "cheer" && (
          <>
            <Sparkle cx={15} cy={16} delay={0} animated={animated} />
            <Sparkle cx={85} cy={18} delay={0.3} animated={animated} />
            <Sparkle cx={82} cy={72} delay={0.6} animated={animated} />
            <Sparkle cx={12} cy={70} delay={0.9} animated={animated} />
          </>
        )}
      </svg>
    </motion.div>
  );
}

function Eyes({ state }: { state: PioState }) {
  if (state === "cheer") {
    return (
      <>
        <path
          d="M 38 34 Q 42 29 46 34"
          stroke="#3b1a08"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 54 34 Q 58 29 62 34"
          stroke="#3b1a08"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }
  if (state === "sad") {
    return (
      <>
        <ellipse cx="42" cy="34" rx="4" ry="3" fill="#3b1a08" />
        <ellipse cx="58" cy="34" rx="4" ry="3" fill="#3b1a08" />
        <circle cx="43" cy="33" r="1" fill="#fff" opacity="0.6" />
        <circle cx="59" cy="33" r="1" fill="#fff" opacity="0.6" />
      </>
    );
  }
  return (
    <>
      <ellipse cx="42" cy="34" rx="4.5" ry="5.5" fill="#3b1a08" />
      <ellipse cx="58" cy="34" rx="4.5" ry="5.5" fill="#3b1a08" />
      <circle cx="43.5" cy="32" r="1.8" fill="#fff" />
      <circle cx="59.5" cy="32" r="1.8" fill="#fff" />
      <circle cx="41" cy="35" r="0.8" fill="#fff" opacity="0.5" />
      <circle cx="57" cy="35" r="0.8" fill="#fff" opacity="0.5" />
    </>
  );
}

function Mouth({ state }: { state: PioState }) {
  if (state === "cheer") {
    return (
      <path
        d="M 44 46 Q 50 52 56 46"
        stroke="#4a2512"
        strokeWidth="1.8"
        fill="#fda4af"
        strokeLinecap="round"
      />
    );
  }
  if (state === "sad") {
    return (
      <path
        d="M 45 48 Q 50 46 55 48"
        stroke="#4a2512"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (state === "hello") {
    return (
      <path
        d="M 45 46 Q 50 50 55 46"
        stroke="#4a2512"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d="M 46 46 Q 50 49 54 46"
      stroke="#4a2512"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  );
}

function Arms({
  state,
  animated,
}: {
  state: PioState;
  animated: boolean;
}) {
  if (state === "cheer") {
    return (
      <>
        <ellipse
          cx="28"
          cy="68"
          rx="6"
          ry="9"
          fill="#e5952b"
          transform="rotate(30 28 68)"
        />
        <ellipse
          cx="72"
          cy="68"
          rx="6"
          ry="9"
          fill="#e5952b"
          transform="rotate(-30 72 68)"
        />
      </>
    );
  }
  if (state === "hello") {
    return (
      <>
        <ellipse cx="28" cy="78" rx="6" ry="9" fill="#e5952b" />
        <motion.ellipse
          cx="72"
          cy="68"
          rx="6"
          ry="9"
          fill="#e5952b"
          transform="rotate(-20 72 68)"
          animate={animated ? { rotate: [-10, -30, -10] } : undefined}
          transition={
            animated
              ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          style={{ originX: "72px", originY: "78px" }}
        />
      </>
    );
  }
  return (
    <>
      <ellipse cx="28" cy="78" rx="6" ry="9" fill="#e5952b" />
      <ellipse cx="72" cy="78" rx="6" ry="9" fill="#e5952b" />
    </>
  );
}

function Tail({
  state,
  animated,
}: {
  state: PioState;
  animated: boolean;
}) {
  return (
    <motion.g
      animate={
        animated && state === "cheer"
          ? { rotate: [-8, 8, -8] }
          : animated
            ? { rotate: [-3, 3, -3] }
            : undefined
      }
      transition={
        animated
          ? {
              duration: state === "cheer" ? 0.5 : 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
      style={{ originX: "65px", originY: "85px" }}
    >
      <path
        d="M 65 85 Q 82 78 85 65 Q 88 58 84 55"
        stroke="#e5952b"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="84" cy="54" rx="5" ry="4" fill="#9a3412" />
    </motion.g>
  );
}

function Sparkle({
  cx,
  cy,
  delay,
  animated,
}: {
  cx: number;
  cy: number;
  delay: number;
  animated: boolean;
}) {
  return (
    <motion.path
      d={`M ${cx} ${cy - 3} L ${cx + 1} ${cy - 1} L ${cx + 3} ${cy} L ${cx + 1} ${cy + 1} L ${cx} ${cy + 3} L ${cx - 1} ${cy + 1} L ${cx - 3} ${cy} L ${cx - 1} ${cy - 1} Z`}
      fill="#fde68a"
      animate={
        animated
          ? { scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }
          : undefined
      }
      transition={
        animated
          ? { duration: 1.2, repeat: Infinity, delay, ease: "easeInOut" }
          : undefined
      }
      style={{ originX: `${cx}px`, originY: `${cy}px` }}
    />
  );
}
