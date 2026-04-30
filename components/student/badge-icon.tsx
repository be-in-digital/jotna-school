import {
  Award,
  BookOpen,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Dumbbell,
  EyeOff,
  Feather,
  Flame,
  Footprints,
  GraduationCap,
  Heart,
  Infinity as InfinityIcon,
  Lightbulb,
  Lock,
  Medal,
  Moon,
  Mountain,
  Music,
  Palette,
  Pencil,
  Puzzle,
  Rabbit,
  RefreshCw,
  Rocket,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  Trophy,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { RarityTier } from "@/lib/badges";

/**
 * Maps the `badges.icon` string (a Lucide icon name) to the actual component.
 * Static map keeps lucide tree-shakable. Add new entries here when seeding
 * new badge icons; unknown names fall back to Trophy (a friendly default).
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  BookOpen,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Dumbbell,
  EyeOff,
  Feather,
  Flame,
  Footprints,
  GraduationCap,
  Heart,
  Infinity: InfinityIcon,
  Lightbulb,
  Medal,
  Moon,
  Mountain,
  Music,
  Palette,
  Pencil,
  Puzzle,
  Rabbit,
  RefreshCw,
  Rocket,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  Trophy,
  Wand2,
  Zap,
};

export function BadgeIcon({
  name,
  className,
  fallback = Trophy,
}: {
  name: string;
  className?: string;
  fallback?: LucideIcon;
}) {
  const Icon = ICON_MAP[name] ?? fallback;
  return <Icon className={className} aria-hidden />;
}

// ---------------------------------------------------------------------------
// BadgeShield — SVG procedural badge "écusson" rendering.
// Inspired by the Duolingo-style achievement plates: pastel-colored shape
// with a centered white circular medallion holding a padlock (locked) or
// the lucide icon (earned). Shape + color are deterministic by badge name.
// ---------------------------------------------------------------------------

type ShieldShape = "shield" | "round" | "hexagon" | "banner";

const SHAPES: ShieldShape[] = ["shield", "round", "hexagon", "banner"];

// Pastel palettes — each entry: outer ring, mid fill, inner fill.
// Picked to read clearly even when desaturated for locked state.
const PALETTES: Array<{
  outer: string;
  mid: string;
  inner: string;
  accent: string;
}> = [
  // blue
  { outer: "#bfdbfe", mid: "#93c5fd", inner: "#60a5fa", accent: "#3b82f6" },
  // green
  { outer: "#bbf7d0", mid: "#86efac", inner: "#4ade80", accent: "#22c55e" },
  // purple
  { outer: "#e9d5ff", mid: "#d8b4fe", inner: "#c084fc", accent: "#a855f7" },
  // orange
  { outer: "#fed7aa", mid: "#fdba74", inner: "#fb923c", accent: "#f97316" },
  // pink
  { outer: "#fbcfe8", mid: "#f9a8d4", inner: "#f472b6", accent: "#ec4899" },
  // teal
  { outer: "#99f6e4", mid: "#5eead4", inner: "#2dd4bf", accent: "#14b8a6" },
  // amber
  { outer: "#fde68a", mid: "#fcd34d", inner: "#fbbf24", accent: "#f59e0b" },
  // indigo
  { outer: "#c7d2fe", mid: "#a5b4fc", inner: "#818cf8", accent: "#6366f1" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickShape(name: string): ShieldShape {
  return SHAPES[hashString(name) % SHAPES.length];
}

function pickPalette(
  name: string,
  tier: RarityTier,
): (typeof PALETTES)[number] {
  // Legendary always gets amber; epic always gets purple; others hash-derived.
  if (tier === "legendary") return PALETTES[6];
  if (tier === "epic") return PALETTES[2];
  return PALETTES[hashString(name) % PALETTES.length];
}

/**
 * Renders the colored backdrop SVG path for a given shield shape.
 * Coordinate space: 100×100, centered at (50, 50).
 */
function ShapePath({ shape, fill }: { shape: ShieldShape; fill: string }) {
  switch (shape) {
    case "shield":
      // Classic shield with curved bottom point
      return (
        <path
          d="M 50 8 L 86 22 L 86 56 Q 86 78 50 92 Q 14 78 14 56 L 14 22 Z"
          fill={fill}
        />
      );
    case "round":
      return <circle cx="50" cy="50" r="42" fill={fill} />;
    case "hexagon":
      return (
        <path
          d="M 50 8 L 86 28 L 86 72 L 50 92 L 14 72 L 14 28 Z"
          fill={fill}
        />
      );
    case "banner":
      // Rounded rectangle with banner ribbons at bottom
      return (
        <>
          <path
            d="M 18 14 Q 18 8 24 8 L 76 8 Q 82 8 82 14 L 82 70 L 50 86 L 18 70 Z"
            fill={fill}
          />
        </>
      );
  }
}

/**
 * Decorative accents around the shield, varying by tier:
 *   - common:  a couple of tiny stars
 *   - rare:    star pair + small ribbon dots
 *   - epic:    laurel branches at the sides
 *   - legendary: laurels + crown sparkles
 */
function ShapeAccents({
  shape,
  tier,
  color,
}: {
  shape: ShieldShape;
  tier: RarityTier;
  color: string;
}) {
  const star = (cx: number, cy: number, size = 3) => (
    <path
      d={`M ${cx} ${cy - size} L ${cx + size * 0.3} ${cy - size * 0.3} L ${
        cx + size
      } ${cy} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx} ${cy + size} L ${
        cx - size * 0.3
      } ${cy + size * 0.3} L ${cx - size} ${cy} L ${
        cx - size * 0.3
      } ${cy - size * 0.3} Z`}
      fill={color}
      opacity="0.85"
    />
  );

  // Laurel branch starting at (cx, cy), curving outward by `dir` (-1 left, +1 right)
  const laurel = (cx: number, cy: number, dir: 1 | -1) => (
    <g>
      <path
        d={`M ${cx} ${cy} Q ${cx + dir * 12} ${cy - 4} ${cx + dir * 18} ${cy - 18}`}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx={cx + dir * (4 + i * 4)}
          cy={cy - 2 - i * 4}
          rx="3"
          ry="1.6"
          fill={color}
          opacity="0.7"
          transform={`rotate(${dir * (40 - i * 8)} ${cx + dir * (4 + i * 4)} ${cy - 2 - i * 4})`}
        />
      ))}
    </g>
  );

  // Place stars relative to shape's top-corner positions
  const corners: Record<ShieldShape, Array<[number, number]>> = {
    shield: [
      [18, 18],
      [82, 18],
    ],
    round: [
      [16, 22],
      [84, 22],
    ],
    hexagon: [
      [16, 24],
      [84, 24],
    ],
    banner: [
      [22, 14],
      [78, 14],
    ],
  };

  return (
    <g>
      {(tier === "common" || tier === "rare") && (
        <>
          {star(corners[shape][0][0], corners[shape][0][1])}
          {star(corners[shape][1][0], corners[shape][1][1])}
        </>
      )}
      {tier === "rare" && (
        <>
          <circle cx="20" cy="50" r="2" fill={color} opacity="0.6" />
          <circle cx="80" cy="50" r="2" fill={color} opacity="0.6" />
        </>
      )}
      {(tier === "epic" || tier === "legendary") && (
        <>
          {laurel(28, 70, -1)}
          {laurel(72, 70, 1)}
        </>
      )}
      {tier === "legendary" && (
        <>
          {star(50, 6, 4)}
          {star(20, 30, 3)}
          {star(80, 30, 3)}
        </>
      )}
    </g>
  );
}

function IconAtSize({
  name,
  pixels,
  color,
}: {
  name: string;
  pixels: number;
  color: string;
}) {
  const Icon = ICON_MAP[name] ?? Trophy;
  return (
    <Icon
      style={{ width: pixels, height: pixels, color }}
      strokeWidth={2.2}
      aria-hidden
    />
  );
}

export function BadgeShield({
  iconName,
  badgeName,
  tier,
  locked,
  size = 96,
}: {
  iconName: string;
  badgeName: string;
  tier: RarityTier;
  locked: boolean;
  size?: number;
}) {
  const shape = pickShape(badgeName);
  const palette = pickPalette(badgeName, tier);

  // Locked palette desaturates everything to slate/gray tones
  const lockedColors = {
    outer: "#e2e8f0",
    mid: "#cbd5e1",
    inner: "#94a3b8",
    accent: "#64748b",
  };
  const colors = locked ? lockedColors : palette;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Outer ring (largest) */}
        <ShapePath shape={shape} fill={colors.outer} />
        {/* Mid layer — slightly inset using transform */}
        <g transform="translate(50 50) scale(0.86) translate(-50 -50)">
          <ShapePath shape={shape} fill={colors.mid} />
        </g>
        {/* Inner layer */}
        <g transform="translate(50 50) scale(0.72) translate(-50 -50)">
          <ShapePath shape={shape} fill={colors.inner} />
        </g>
        {/* Decorative accents on the outer rim */}
        <ShapeAccents shape={shape} tier={tier} color={colors.accent} />
      </svg>

      {/* Centered white medallion holding the icon or padlock */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full bg-white shadow-md"
          style={{
            width: size * 0.42,
            height: size * 0.42,
          }}
        >
          {locked ? (
            <Lock
              className="text-slate-500"
              style={{ width: size * 0.22, height: size * 0.22 }}
              strokeWidth={2.5}
              aria-hidden
            />
          ) : (
            <IconAtSize
              name={iconName}
              pixels={Math.round(size * 0.24)}
              color={colors.accent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
