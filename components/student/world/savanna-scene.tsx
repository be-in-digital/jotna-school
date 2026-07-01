import { cn } from "@/lib/utils";

/**
 * Redesign Gaming G4b/G9 — the savanna world, hand-crafted vector art.
 * One inline SVG (~a few KB gzipped, zero network requests) instead of AI
 * bitmaps: crisp at every DPI, tintable, and far under the perf budget.
 * Pio (rich mascot) pops as the hero on this stylized flat world — the
 * classic mobile-game hierarchy (cf. Duolingo).
 *
 * Two compositions share the same building blocks:
 *  - "wide"     → desktop/tablet (16:9-ish container)
 *  - "portrait" → phones: the camp landmarks (baobab, hut) are recomposed
 *    into the narrow visible band so the camp identity survives the crop.
 *
 * Purely decorative: aria-hidden, no text, pointer-events disabled.
 * Ambient motion uses the CSS keyframes from globals.css, disabled under
 * prefers-reduced-motion (D12) and on lite devices (G5, `animated={false}`).
 */

type Composition = "wide" | "portrait";

type Layout = {
  viewW: number;
  sun: { x: number; y: number };
  clouds: { x: number; y: number; s: number }[];
  farHills: { cx: number; cy: number; rx: number; ry: number; fill: string; opacity: number }[];
  acacias: { x: number; y: number; s: number }[];
  baobab: { x: number; y: number; s: number };
  hut: { x: number; y: number; s: number };
  grassBack: string;
  grassFront: string;
  rock: { x: number; y: number } | null;
  bushes: { x: number; y: number; s: number }[];
  tufts: { x: number; y: number }[];
  fireflies: { x: number; y: number; r: number }[];
};

const LAYOUTS: Record<Composition, Layout> = {
  wide: {
    viewW: 1440,
    sun: { x: 1150, y: 92 },
    clouds: [
      { x: 160, y: 80, s: 1 },
      { x: 620, y: 50, s: 0.7 },
      { x: 950, y: 130, s: 0.55 },
    ],
    farHills: [
      { cx: 240, cy: 420, rx: 480, ry: 150, fill: "#fde68a", opacity: 0.7 },
      { cx: 1240, cy: 440, rx: 560, ry: 170, fill: "#fcd34d", opacity: 0.5 },
      { cx: 760, cy: 460, rx: 520, ry: 150, fill: "#fbbf24", opacity: 0.35 },
    ],
    acacias: [
      { x: 760, y: 330, s: 0.8 },
      { x: 930, y: 352, s: 1 },
      { x: 520, y: 350, s: 0.65 },
    ],
    baobab: { x: 150, y: 120, s: 1 },
    hut: { x: 1090, y: 250, s: 1 },
    grassBack:
      "M0 470 C 240 440 420 452 720 466 C 1020 480 1220 452 1440 462 L 1440 560 L 0 560 Z",
    grassFront:
      "M0 494 C 260 470 480 486 760 494 C 1040 502 1240 480 1440 490 L 1440 560 L 0 560 Z",
    rock: { x: 360, y: 500 },
    bushes: [
      { x: 1240, y: 470, s: 1 },
      { x: 90, y: 488, s: 0.8 },
    ],
    tufts: [
      { x: 210, y: 512 },
      { x: 560, y: 520 },
      { x: 860, y: 514 },
      { x: 1120, y: 524 },
      { x: 1360, y: 512 },
    ],
    fireflies: [
      { x: 470, y: 380, r: 4 },
      { x: 1010, y: 360, r: 3 },
      { x: 680, y: 410, r: 3 },
    ],
  },
  portrait: {
    viewW: 720,
    sun: { x: 600, y: 78 },
    clouds: [
      { x: 130, y: 70, s: 0.7 },
      { x: 430, y: 46, s: 0.55 },
    ],
    farHills: [
      { cx: 140, cy: 430, rx: 320, ry: 140, fill: "#fde68a", opacity: 0.7 },
      { cx: 620, cy: 445, rx: 340, ry: 155, fill: "#fcd34d", opacity: 0.5 },
      { cx: 380, cy: 465, rx: 300, ry: 140, fill: "#fbbf24", opacity: 0.35 },
    ],
    // Landmarks pulled into the visible band; Pio stands center (~360).
    acacias: [
      { x: 250, y: 352, s: 0.5 },
      { x: 690, y: 345, s: 0.55 },
    ],
    baobab: { x: 18, y: 168, s: 0.78 },
    hut: { x: 478, y: 288, s: 0.78 },
    grassBack:
      "M0 470 C 120 446 220 456 360 466 C 510 476 610 452 720 462 L 720 560 L 0 560 Z",
    grassFront:
      "M0 494 C 130 474 240 488 380 494 C 520 500 620 482 720 490 L 720 560 L 0 560 Z",
    rock: { x: 200, y: 508 },
    bushes: [{ x: 640, y: 486, s: 0.7 }],
    tufts: [
      { x: 90, y: 516 },
      { x: 320, y: 522 },
      { x: 560, y: 516 },
    ],
    fireflies: [
      { x: 240, y: 390, r: 3 },
      { x: 520, y: 375, r: 3 },
    ],
  },
};

export function SavannaScene({
  className,
  animated = true,
  composition = "wide",
}: {
  className?: string;
  /** Set false on lite devices — renders the same scene fully static. */
  animated?: boolean;
  /** "portrait" recomposes the camp landmarks for narrow phone screens. */
  composition?: Composition;
}) {
  const L = LAYOUTS[composition];

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      viewBox={`0 0 ${L.viewW} 560`}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
    >
      {/* ------------------------------------------------ sun + halo */}
      <g
        style={
          animated
            ? { animation: "sunPulse 6s ease-in-out infinite" }
            : undefined
        }
      >
        <circle cx={L.sun.x} cy={L.sun.y} r="70" fill="#fde68a" opacity="0.55" />
      </g>
      <circle cx={L.sun.x} cy={L.sun.y} r="42" fill="#fcd34d" />
      <circle cx={L.sun.x - 12} cy={L.sun.y - 10} r="12" fill="#fef3c7" opacity="0.9" />

      {/* ------------------------------------------------ clouds */}
      <g
        fill="#ffffff"
        opacity="0.85"
        style={
          animated
            ? { animation: "cloudDrift 24s ease-in-out infinite alternate" }
            : undefined
        }
      >
        {L.clouds.map((c, i) => (
          <Cloud key={i} x={c.x} y={c.y} s={c.s} />
        ))}
      </g>

      {/* ------------------------------------------------ far hills (haze) */}
      {L.farHills.map((h, i) => (
        <ellipse
          key={i}
          cx={h.cx}
          cy={h.cy}
          rx={h.rx}
          ry={h.ry}
          fill={h.fill}
          opacity={h.opacity}
        />
      ))}

      {/* ------------------------------------------------ acacias (midground) */}
      {L.acacias.map((a, i) => (
        <Acacia key={i} x={a.x} y={a.y} s={a.s} />
      ))}

      {/* ------------------------------------------------ baobab (hero) */}
      <g
        transform={`translate(${L.baobab.x} ${L.baobab.y}) scale(${L.baobab.s})`}
      >
        {/* trunk */}
        <path
          d="M60 300 C 52 220 48 170 58 120 C 62 96 76 84 96 82 C 118 84 130 98 134 120 C 142 170 140 220 132 300 Z"
          fill="#b45309"
        />
        <path
          d="M96 82 C 76 84 62 96 58 120 C 52 158 52 200 58 252 C 74 258 88 260 96 260 Z"
          fill="#92400e"
          opacity="0.55"
        />
        {/* branches */}
        <path d="M70 110 C 40 84 26 66 18 40 L 40 34 C 52 62 66 82 84 98 Z" fill="#b45309" />
        <path d="M122 108 C 152 82 168 64 178 38 L 156 30 C 144 58 128 80 110 96 Z" fill="#b45309" />
        <path d="M94 88 C 92 66 92 50 96 28 L 116 30 C 112 52 112 68 112 88 Z" fill="#b45309" />
        {/* foliage */}
        <g fill="#65a30d">
          <circle cx="24" cy="34" r="34" />
          <circle cx="96" cy="16" r="42" />
          <circle cx="172" cy="30" r="36" />
          <circle cx="58" cy="16" r="30" />
          <circle cx="138" cy="12" r="30" />
        </g>
        <g fill="#84cc16" opacity="0.85">
          <circle cx="42" cy="20" r="20" />
          <circle cx="112" cy="2" r="22" />
          <circle cx="158" cy="16" r="18" />
        </g>
        {/* fruits — Pio's green-leaf accent */}
        <g fill="#16a34a">
          <circle cx="70" cy="44" r="5" />
          <circle cx="130" cy="38" r="5" />
          <circle cx="96" cy="52" r="4" />
        </g>
      </g>

      {/* ------------------------------------------------ Pio's hut */}
      <g transform={`translate(${L.hut.x} ${L.hut.y}) scale(${L.hut.s})`}>
        {/* wall */}
        <path
          d="M20 150 C 20 96 40 78 105 78 C 170 78 190 96 190 150 L 184 190 C 130 200 80 200 26 190 Z"
          fill="#f59e0b"
        />
        <path
          d="M20 150 C 20 96 40 78 105 78 L 105 196 C 78 196 50 194 26 190 Z"
          fill="#d97706"
          opacity="0.45"
        />
        {/* roof */}
        <path d="M105 -28 L 214 96 C 140 78 70 78 -4 96 Z" fill="#ca8a04" />
        <path d="M105 -28 L 214 96 C 178 87 141 82 105 81 Z" fill="#eab308" opacity="0.6" />
        {/* roof fringe */}
        <path
          d="M-4 96 Q 20 104 44 99 Q 68 108 105 102 Q 142 108 166 99 Q 190 104 214 96 L 208 106 Q 105 124 2 106 Z"
          fill="#a16207"
        />
        {/* door */}
        <path d="M78 196 C 78 150 90 136 105 136 C 120 136 132 150 132 196 Z" fill="#7c2d12" />
        <path d="M84 196 C 84 154 93 142 105 142 L 105 196 Z" fill="#92400e" opacity="0.7" />
        {/* flag */}
        <line x1="105" y1="-28" x2="105" y2="-64" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <path d="M105 -62 L 148 -50 L 105 -38 Z" fill="#f97316" />
      </g>

      {/* ------------------------------------------------ foreground grass */}
      <path d={L.grassBack} fill="#a3e635" />
      <path d={L.grassFront} fill="#84cc16" />

      {/* rocks + bushes + grass tufts */}
      <g>
        {L.rock && (
          <>
            <ellipse cx={L.rock.x} cy={L.rock.y} rx="34" ry="20" fill="#d6d3d1" />
            <ellipse
              cx={L.rock.x - 12}
              cy={L.rock.y - 8}
              rx="16"
              ry="10"
              fill="#e7e5e4"
            />
          </>
        )}
        {L.bushes.map((b, i) => (
          <Bush key={i} x={b.x} y={b.y} s={b.s} />
        ))}
        {L.tufts.map((t, i) => (
          <GrassTuft key={i} x={t.x} y={t.y} />
        ))}
      </g>

      {/* fireflies / sparkles for life */}
      <g
        fill="#fef08a"
        style={
          animated
            ? { animation: "gentleBob 3.5s ease-in-out infinite" }
            : undefined
        }
      >
        {L.fireflies.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} />
        ))}
      </g>
    </svg>
  );
}

export function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="56" ry="24" />
      <ellipse cx="-36" cy="10" rx="34" ry="18" />
      <ellipse cx="40" cy="10" rx="38" ry="20" />
    </g>
  );
}

export function Acacia({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-4 90 C -2 50 -6 30 -14 6 L 6 2 C 10 30 8 54 10 90 Z"
        fill="#92400e"
      />
      <path d="M-10 24 L -34 6 L -30 0 L -6 14 Z" fill="#92400e" />
      <ellipse cx="-6" cy="-4" rx="58" ry="18" fill="#16a34a" />
      <ellipse cx="-16" cy="-12" rx="34" ry="12" fill="#22c55e" />
    </g>
  );
}

export function Bush({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#4d7c0f">
      <ellipse cx="0" cy="0" rx="36" ry="20" />
      <ellipse cx="-26" cy="8" rx="22" ry="14" />
      <ellipse cx="28" cy="8" rx="24" ry="15" />
      <ellipse cx="-4" cy="-8" rx="20" ry="12" fill="#65a30d" />
    </g>
  );
}

export function GrassTuft({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#4d7c0f" strokeWidth="4" strokeLinecap="round">
      <path d="M0 0 C -2 -10 -6 -16 -10 -20" />
      <path d="M4 0 C 4 -12 4 -18 4 -24" />
      <path d="M8 0 C 10 -10 14 -16 18 -20" />
    </g>
  );
}
