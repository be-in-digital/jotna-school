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

/**
 * Pio v2 — chibi vector mascot, redrawn to match the official avatar
 * (.context reference, 2026-07-02): oversized head, huge sparkly eyes, big
 * round pink ears, voluminous rust mane dotted with green leaves, golden
 * sparkly face with blush + freckles, green satchel and the signature
 * books under the arm. State API unchanged (idle/hello/cheer/sad).
 */
export function Pio({
  state = "idle",
  size = 96,
  className = "",
  animated = true,
}: PioProps) {
  const idBase = useId().replace(/:/g, "");
  const faceGrad = `pio-face-${idBase}`;
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
    // ZERO motion on the body (décision utilisateur 2026-07-02) : le
    // conteneur est statique ; seuls quelques détails internes (queue,
    // bras, étincelles) bougent quand `animated` est actif.
    <div
      role="img"
      aria-label={labels[state]}
      className={`pio-container inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 110"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={faceGrad} cx="0.5" cy="0.35" r="0.75">
            <stop offset="0%" stopColor="#f7c94b" />
            <stop offset="70%" stopColor="#eda832" />
            <stop offset="100%" stopColor="#df8f28" />
          </radialGradient>
          <linearGradient id={bodyGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2b13a" />
            <stop offset="100%" stopColor="#e08f2a" />
          </linearGradient>
          <radialGradient id={maneGrad} cx="0.5" cy="0.42" r="0.65">
            <stop offset="0%" stopColor="#c05a1d" />
            <stop offset="55%" stopColor="#a8451a" />
            <stop offset="100%" stopColor="#8a3413" />
          </radialGradient>
          <linearGradient id={bellyGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdf0cf" />
            <stop offset="100%" stopColor="#f8dfa4" />
          </linearGradient>
          <linearGradient id={bagGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22a04e" />
            <stop offset="100%" stopColor="#157a3c" />
          </linearGradient>
        </defs>

        {/* === TAIL (big fluffy tuft) === */}
        <Tail state={state} animated={animated} />

        {/* === FEET (chunky chibi paws) === */}
        <ellipse cx="41" cy="103" rx="9" ry="5" fill="#eda832" />
        <ellipse cx="59" cy="103" rx="9" ry="5" fill="#eda832" />
        <g fill="#f8dfa4" opacity="0.9">
          <ellipse cx="38" cy="104" rx="1.6" ry="1.1" />
          <ellipse cx="41" cy="105" rx="1.6" ry="1.1" />
          <ellipse cx="44" cy="104" rx="1.6" ry="1.1" />
          <ellipse cx="56" cy="104" rx="1.6" ry="1.1" />
          <ellipse cx="59" cy="105" rx="1.6" ry="1.1" />
          <ellipse cx="62" cy="104" rx="1.6" ry="1.1" />
        </g>

        {/* === BODY (small, chibi ratio) === */}
        <ellipse cx="50" cy="86" rx="18" ry="16" fill={`url(#${bodyGrad})`} />
        <ellipse cx="50" cy="89" rx="11" ry="11" fill={`url(#${bellyGrad})`} />

        {/* === BOOKS under the left arm (signature) === */}
        <g transform="rotate(-8 32 86)">
          <rect x="24" y="80" width="13" height="4.5" rx="1" fill="#e94f4f" />
          <rect x="24.8" y="80.8" width="11.4" height="1.2" rx="0.6" fill="#fda4a4" />
          <rect x="25" y="84.5" width="12" height="4" rx="1" fill="#f5c33b" />
          <rect x="25.8" y="85.3" width="10.4" height="1.1" rx="0.55" fill="#fde68a" />
        </g>

        {/* === SATCHEL (green, strap across) === */}
        <path
          d="M 36 70 Q 50 80 63 92"
          stroke="#157a3c"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="56" y="86" width="17" height="13" rx="3.5" fill={`url(#${bagGrad})`} />
        <path
          d="M56 89.5 L 73 89.5 L 73 89 C 73 86 71 86 69 86 L 60 86 C 58 86 56 86 56 89 Z"
          fill="#0f6631"
        />
        <rect x="62.5" y="88" width="4" height="3" rx="1" fill="#fbbf24" />

        {/* === ARMS === */}
        <Arms state={state} animated={animated} />

        {/* === MANE (huge, fluffy) === */}
        <g>
          {/* outer tufts */}
          <g fill="#8a3413">
            <ellipse cx="22" cy="26" rx="9" ry="12" transform="rotate(-28 22 26)" />
            <ellipse cx="78" cy="26" rx="9" ry="12" transform="rotate(28 78 26)" />
            <ellipse cx="16" cy="42" rx="8" ry="11" transform="rotate(-70 16 42)" />
            <ellipse cx="84" cy="42" rx="8" ry="11" transform="rotate(70 84 42)" />
            <ellipse cx="24" cy="57" rx="8" ry="10" transform="rotate(-115 24 57)" />
            <ellipse cx="76" cy="57" rx="8" ry="10" transform="rotate(115 76 57)" />
          </g>
          <circle cx="50" cy="40" r="31" fill={`url(#${maneGrad})`} />
          {/* top highlight tufts */}
          <g fill="#c2571f">
            <ellipse cx="35" cy="14" rx="8" ry="6" transform="rotate(-18 35 14)" />
            <ellipse cx="50" cy="10" rx="9" ry="6.5" />
            <ellipse cx="65" cy="14" rx="8" ry="6" transform="rotate(18 65 14)" />
          </g>
        </g>

        {/* === EARS (big, round, pink inside) === */}
        <g>
          <circle cx="24" cy="19" r="9" fill="#e08f2a" />
          <circle cx="24" cy="19" r="6" fill="#f8a8c9" />
          <circle cx="24.5" cy="19.5" r="3.4" fill="#f083ad" />
          <circle cx="76" cy="19" r="9" fill="#e08f2a" />
          <circle cx="76" cy="19" r="6" fill="#f8a8c9" />
          <circle cx="75.5" cy="19.5" r="3.4" fill="#f083ad" />
        </g>

        {/* === GREEN LEAVES in the mane === */}
        <g fill="#22c55e">
          <path d="M 33 9 Q 30 3 35 5 Q 32 1 37 4 Q 36 7 35 9 Z" />
          <path d="M 67 9 Q 70 3 65 5 Q 68 1 63 4 Q 64 7 65 9 Z" />
        </g>
        <g fill="#16a34a">
          <path d="M 17 30 Q 11 27 15 24 Q 10 25 14 21 Q 17 24 18 27 Z" />
          <path d="M 83 30 Q 89 27 85 24 Q 90 25 86 21 Q 83 24 82 27 Z" />
          <path d="M 26 52 Q 20 52 23 48 Q 18 48 23 45 Q 25 48 26 50 Z" />
          <path d="M 74 52 Q 80 52 77 48 Q 82 48 77 45 Q 75 48 74 50 Z" />
        </g>

        {/* === FACE === */}
        <circle cx="50" cy="42" r="24" fill={`url(#${faceGrad})`} />
        {/* muzzle */}
        <ellipse cx="50" cy="51" rx="10" ry="7.5" fill="#fdf0cf" />

        {/* === EYES (huge, sparkly) === */}
        <Eyes state={state} />

        {/* === BLUSH + FRECKLES (always on — part of the identity) === */}
        <ellipse cx="31" cy="49" rx="4.5" ry="3" fill="#fb7185" opacity="0.5" />
        <ellipse cx="69" cy="49" rx="4.5" ry="3" fill="#fb7185" opacity="0.5" />
        <g fill="#b45309" opacity="0.65">
          <circle cx="34" cy="53.5" r="0.7" />
          <circle cx="37" cy="55" r="0.7" />
          <circle cx="34.5" cy="56.5" r="0.7" />
          <circle cx="66" cy="53.5" r="0.7" />
          <circle cx="63" cy="55" r="0.7" />
          <circle cx="65.5" cy="56.5" r="0.7" />
        </g>

        {/* === NOSE === */}
        <path
          d="M 46.5 48.5 Q 50 46.5 53.5 48.5 Q 51.8 52 50 52 Q 48.2 52 46.5 48.5 Z"
          fill="#4a2512"
        />
        <ellipse cx="48.6" cy="48.6" rx="1.1" ry="0.7" fill="#7c5030" opacity="0.6" />

        {/* === MOUTH === */}
        <Mouth state={state} />

        {/* === SPARKLES (cheer) === */}
        {state === "cheer" && (
          <>
            <Sparkle cx={13} cy={14} delay={0} animated={animated} />
            <Sparkle cx={87} cy={16} delay={0.3} animated={animated} />
            <Sparkle cx={86} cy={72} delay={0.6} animated={animated} />
            <Sparkle cx={12} cy={70} delay={0.9} animated={animated} />
          </>
        )}
      </svg>
    </div>
  );
}

function Eyes({ state }: { state: PioState }) {
  if (state === "cheer") {
    // happy closed ^^ eyes
    return (
      <>
        <path
          d="M 34 40 Q 39.5 33.5 45 40"
          stroke="#2d1608"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 55 40 Q 60.5 33.5 66 40"
          stroke="#2d1608"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }
  if (state === "sad") {
    return (
      <>
        <g>
          <ellipse cx="39.5" cy="41" rx="6" ry="6.5" fill="#2d1608" />
          <circle cx="41.5" cy="38.5" r="2" fill="#fff" opacity="0.85" />
          <path d="M 33 34.5 Q 39 33 45 36" stroke="#8a3413" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        <g>
          <ellipse cx="60.5" cy="41" rx="6" ry="6.5" fill="#2d1608" />
          <circle cx="58.5" cy="38.5" r="2" fill="#fff" opacity="0.85" />
          <path d="M 67 34.5 Q 61 33 55 36" stroke="#8a3413" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      </>
    );
  }
  // idle / hello — huge sparkly chibi eyes
  return (
    <>
      <g>
        <ellipse cx="39.5" cy="40" rx="7" ry="8.5" fill="#2d1608" />
        <circle cx="42" cy="36.5" r="2.6" fill="#fff" />
        <circle cx="37" cy="42.5" r="1.2" fill="#fff" opacity="0.75" />
        <ellipse cx="39.5" cy="45.5" rx="3.4" ry="1.6" fill="#6b3a1d" opacity="0.55" />
      </g>
      <g>
        <ellipse cx="60.5" cy="40" rx="7" ry="8.5" fill="#2d1608" />
        <circle cx="58" cy="36.5" r="2.6" fill="#fff" />
        <circle cx="63" cy="42.5" r="1.2" fill="#fff" opacity="0.75" />
        <ellipse cx="60.5" cy="45.5" rx="3.4" ry="1.6" fill="#6b3a1d" opacity="0.55" />
      </g>
    </>
  );
}

function Mouth({ state }: { state: PioState }) {
  if (state === "cheer") {
    return (
      <path
        d="M 45 53.5 Q 50 58.5 55 53.5"
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
        d="M 46 55.5 Q 50 53.5 54 55.5"
        stroke="#4a2512"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (state === "hello") {
    return (
      <path
        d="M 45.5 53.5 Q 50 57 54.5 53.5"
        stroke="#4a2512"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d="M 46.5 53.5 Q 50 56 53.5 53.5"
      stroke="#4a2512"
      strokeWidth="1.6"
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
          cx="29"
          cy="74"
          rx="6.5"
          ry="10"
          fill="#eda832"
          transform="rotate(35 29 74)"
        />
        <ellipse
          cx="71"
          cy="74"
          rx="6.5"
          ry="10"
          fill="#eda832"
          transform="rotate(-35 71 74)"
        />
      </>
    );
  }
  if (state === "hello") {
    return (
      <>
        <ellipse cx="31" cy="84" rx="6.5" ry="10" fill="#eda832" />
        <motion.ellipse
          cx="71"
          cy="74"
          rx="6.5"
          ry="10"
          fill="#eda832"
          transform="rotate(-25 71 74)"
          animate={animated ? { rotate: [-12, -35, -12] } : undefined}
          transition={
            animated
              ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          style={{ originX: "71px", originY: "84px" }}
        />
      </>
    );
  }
  return (
    <>
      <ellipse cx="31" cy="84" rx="6.5" ry="10" fill="#eda832" />
      <ellipse cx="69" cy="84" rx="6.5" ry="10" fill="#eda832" />
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
      style={{ originX: "66px", originY: "92px" }}
    >
      <path
        d="M 66 92 Q 84 86 87 72 Q 89 65 86 61"
        stroke="#eda832"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* big fluffy tuft */}
      <g fill="#a8451a">
        <circle cx="86" cy="58" r="5.5" />
        <circle cx="82.5" cy="60.5" r="4" />
        <circle cx="89" cy="61.5" r="4" />
      </g>
      <circle cx="85.5" cy="57" r="2.4" fill="#c2571f" />
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
