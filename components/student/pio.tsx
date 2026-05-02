"use client";

import { motion } from "framer-motion";
import { useId } from "react";

/**
 * Pio — la mascotte de Jotna pour l'expérience élève.
 *
 * Décisions :
 *   - D1  : Pio apparaît UNIQUEMENT sur les transitions (home, complete,
 *           level-up, fail-soft). Jamais pendant un exercice (focusMode).
 *   - D2a : Statique en MVP (SVG inline + transitions framer-motion légères).
 *           Pas de Lottie en Phase A.
 *   - D12 : Le wrapper framer-motion respecte `prefers-reduced-motion` via
 *           `<MotionConfig reducedMotion="user">` au niveau (student)/layout.
 *
 * Personnage : un petit oiseau-mascotte rond aux couleurs chaudes
 * (orange/amber, en cohérence avec la palette Jotna). 4 états expressifs.
 */
export type PioState = "idle" | "hello" | "cheer" | "sad";

type PioProps = {
  state?: PioState;
  size?: number;
  className?: string;
  /**
   * Si true, ajoute une légère animation de respiration (idle bobbing).
   * Désactivable pour les usages en hero où une animation parente joue déjà.
   */
  animated?: boolean;
};

export function Pio({
  state = "idle",
  size = 96,
  className = "",
  animated = true,
}: PioProps) {
  // useId garantit que les <linearGradient> ne collident pas avec d'autres SVGs.
  const idBase = useId().replace(/:/g, "");
  const gradId = `pio-grad-${idBase}`;
  const highlightId = `pio-highlight-${idBase}`;

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
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <radialGradient id={highlightId} cx="0.3" cy="0.25" r="0.4">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Body — round, gradient orange→amber */}
        <ellipse cx="50" cy="58" rx="36" ry="34" fill={`url(#${gradId})`} />
        {/* Soft highlight to give volume */}
        <ellipse cx="50" cy="58" rx="36" ry="34" fill={`url(#${highlightId})`} />

        {/* Belly patch (creamy oval) */}
        <ellipse cx="50" cy="68" rx="20" ry="16" fill="#fef3c7" opacity="0.7" />

        {/* Wings — small ovals on sides */}
        {state === "cheer" ? (
          <>
            {/* Wings raised in celebration */}
            <ellipse
              cx="14"
              cy="40"
              rx="9"
              ry="5"
              fill="#ea580c"
              transform="rotate(-30 14 40)"
            />
            <ellipse
              cx="86"
              cy="40"
              rx="9"
              ry="5"
              fill="#ea580c"
              transform="rotate(30 86 40)"
            />
          </>
        ) : state === "hello" ? (
          <>
            {/* Right wing waving */}
            <ellipse cx="14" cy="58" rx="9" ry="5" fill="#ea580c" />
            <motion.ellipse
              cx="86"
              cy="46"
              rx="9"
              ry="5"
              fill="#ea580c"
              transform="rotate(20 86 46)"
              animate={animated ? { rotate: [10, 30, 10] } : undefined}
              transition={
                animated
                  ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
              style={{ originX: "86px", originY: "46px" }}
            />
          </>
        ) : (
          <>
            <ellipse cx="14" cy="58" rx="9" ry="5" fill="#ea580c" />
            <ellipse cx="86" cy="58" rx="9" ry="5" fill="#ea580c" />
          </>
        )}

        {/* Beak — small triangle */}
        <polygon
          points="46,52 54,52 50,58"
          fill="#dc2626"
          opacity="0.9"
        />

        {/* Eyes */}
        {state === "cheer" ? (
          // Eyes closed in joy — upward arcs ^^
          <>
            <path
              d="M 36 38 Q 40 33 44 38"
              stroke="#1f2937"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 56 38 Q 60 33 64 38"
              stroke="#1f2937"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : state === "sad" ? (
          // Half-closed gentle eyes
          <>
            <ellipse cx="40" cy="40" rx="3.5" ry="2" fill="#1f2937" />
            <ellipse cx="60" cy="40" rx="3.5" ry="2" fill="#1f2937" />
          </>
        ) : (
          // Open round eyes (idle / hello) with shine
          <>
            <ellipse cx="40" cy="38" rx="4" ry="5" fill="#1f2937" />
            <ellipse cx="60" cy="38" rx="4" ry="5" fill="#1f2937" />
            <circle cx="41.5" cy="36" r="1.3" fill="#fff" />
            <circle cx="61.5" cy="36" r="1.3" fill="#fff" />
          </>
        )}

        {/* Mouth (under beak) — varies with state */}
        {state === "cheer" ? (
          <path
            d="M 42 64 Q 50 70 58 64"
            stroke="#7f1d1d"
            strokeWidth="2"
            fill="#fda4af"
            strokeLinecap="round"
          />
        ) : state === "sad" ? (
          <path
            d="M 44 65 Q 50 62 56 65"
            stroke="#7f1d1d"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : state === "hello" ? (
          <path
            d="M 44 63 Q 50 67 56 63"
            stroke="#7f1d1d"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M 45 63 Q 50 65 55 63"
            stroke="#7f1d1d"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Cheek blush */}
        {(state === "cheer" || state === "hello") && (
          <>
            <ellipse cx="32" cy="50" rx="4" ry="2.5" fill="#fb7185" opacity="0.4" />
            <ellipse cx="68" cy="50" rx="4" ry="2.5" fill="#fb7185" opacity="0.4" />
          </>
        )}

        {/* Sparkles around body for cheer state */}
        {state === "cheer" && (
          <>
            <Sparkle cx={20} cy={20} delay={0} animated={animated} />
            <Sparkle cx={80} cy={22} delay={0.3} animated={animated} />
            <Sparkle cx={86} cy={70} delay={0.6} animated={animated} />
            <Sparkle cx={14} cy={70} delay={0.9} animated={animated} />
          </>
        )}

        {/* Tiny tuft on top */}
        <path
          d="M 47 23 Q 50 18 53 23"
          stroke="#ea580c"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
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
      animate={animated ? { scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] } : undefined}
      transition={
        animated
          ? { duration: 1.2, repeat: Infinity, delay, ease: "easeInOut" }
          : undefined
      }
      style={{ originX: `${cx}px`, originY: `${cy}px` }}
    />
  );
}
