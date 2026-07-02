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
  Map as MapIcon,
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
  ScrollText,
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
  Map: MapIcon,
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
  ScrollText,
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
// BadgeShield v2 — trophées de jeu « matière par rareté ».
// La valeur se lit d'un coup d'œil, comme dans les vrais jeux mobiles :
//   common    → BOIS   (plaque du camp, chaleureuse)
//   rare      → ARGENT (froid, ciel)
//   epic      → VIOLET royal serti d'or
//   legendary → OR massif + rayons de soleil (la savane !) + étincelles
// La forme (écusson/rond/hexagone/bannière) reste dérivée du nom pour la
// variété ; le verrouillé est en pierre grise. Style chunky du monde :
// contour épais sombre, biseau clair en haut, ruban sous les badges gagnés.
// ---------------------------------------------------------------------------

type ShieldShape = "shield" | "round" | "hexagon" | "banner";

const SHAPES: ShieldShape[] = ["shield", "round", "hexagon", "banner"];

type Material = {
  rim: string; // contour épais
  base: string; // corps
  bevel: string; // biseau haut (lumière)
  deep: string; // ombre basse
  medallion: string; // fond du médaillon central
  icon: string; // couleur de l'icône
  ribbon: string; // ruban
  ribbonDark: string;
};

const MATERIALS: Record<RarityTier, Material> = {
  common: {
    rim: "#7c4a12",
    base: "#b5762a",
    bevel: "#d9a05b",
    deep: "#8f5717",
    medallion: "#fdf3e0",
    icon: "#92400e",
    ribbon: "#b45309",
    ribbonDark: "#7c3f0d",
  },
  rare: {
    rim: "#475569",
    base: "#94a3b8",
    bevel: "#e2e8f0",
    deep: "#64748b",
    medallion: "#f8fafc",
    icon: "#0369a1",
    ribbon: "#0ea5e9",
    ribbonDark: "#0369a1",
  },
  epic: {
    rim: "#5b21b6",
    base: "#8b5cf6",
    bevel: "#c4b5fd",
    deep: "#6d28d9",
    medallion: "#f5f3ff",
    icon: "#6d28d9",
    ribbon: "#f59e0b",
    ribbonDark: "#b45309",
  },
  legendary: {
    rim: "#92400e",
    base: "#f59e0b",
    bevel: "#fde68a",
    deep: "#d97706",
    medallion: "#fffbeb",
    icon: "#b45309",
    ribbon: "#ef4444",
    ribbonDark: "#b91c1c",
  },
};

const LOCKED_MATERIAL: Material = {
  rim: "#78716c",
  base: "#a8a29e",
  bevel: "#d6d3d1",
  deep: "#8a8580",
  medallion: "#f5f5f4",
  icon: "#78716c",
  ribbon: "#a8a29e",
  ribbonDark: "#78716c",
};

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

/** Chemin SVG du corps pour chaque forme (espace 100×100, centré 50/50). */
function shapeD(shape: ShieldShape): string {
  switch (shape) {
    case "shield":
      return "M 50 8 L 84 21 L 84 54 Q 84 76 50 91 Q 16 76 16 54 L 16 21 Z";
    case "round":
      // cercle approximé en path pour partager le rendu contour/biseau
      return "M 50 8 A 42 42 0 1 1 49.9 8 Z";
    case "hexagon":
      return "M 50 7 L 85 27 L 85 71 L 50 91 L 15 71 L 15 27 Z";
    case "banner":
      return "M 20 12 Q 20 7 26 7 L 74 7 Q 80 7 80 12 L 80 66 L 50 84 L 20 66 Z";
  }
}

/** Rayons de soleil derrière le badge légendaire (la savane). */
function SunRays({ color }: { color: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const x1 = 50 + Math.cos(angle) * 38;
    const y1 = 50 + Math.sin(angle) * 38;
    const x2 = 50 + Math.cos(angle) * 49;
    const y2 = 50 + Math.sin(angle) * 49;
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={i % 2 === 0 ? 5 : 3}
        strokeLinecap="round"
        opacity={i % 2 === 0 ? 0.8 : 0.5}
      />
    );
  });
  return <g>{rays}</g>;
}

function Sparkle({ cx, cy, size, color }: { cx: number; cy: number; size: number; color: string }) {
  return (
    <path
      d={`M ${cx} ${cy - size} L ${cx + size * 0.3} ${cy - size * 0.3} L ${cx + size} ${cy} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx} ${cy + size} L ${cx - size * 0.3} ${cy + size * 0.3} L ${cx - size} ${cy} L ${cx - size * 0.3} ${cy - size * 0.3} Z`}
      fill={color}
    />
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
      strokeWidth={2.4}
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
  const m = locked ? LOCKED_MATERIAL : MATERIALS[tier];
  const d = shapeD(shape);
  const legendary = !locked && tier === "legendary";
  const epicPlus = !locked && (tier === "epic" || tier === "legendary");

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* rayons de soleil — légendaire uniquement */}
        {legendary && <SunRays color="#fbbf24" />}

        {/* ruban de trophée sous les badges gagnés */}
        {!locked && (
          <g>
            <path d="M 34 72 L 26 94 L 38 88 L 42 78 Z" fill={m.ribbonDark} />
            <path d="M 66 72 L 74 94 L 62 88 L 58 78 Z" fill={m.ribbon} />
          </g>
        )}

        {/* contour épais (rim) */}
        <g transform="translate(50 50) scale(1.06) translate(-50 -50)">
          <path d={d} fill={m.rim} />
        </g>
        {/* corps */}
        <path d={d} fill={m.base} />
        {/* biseau haut — lumière chunky */}
        <clipPath id={`bevel-${shape}-${tier}-${locked ? "l" : "u"}`}>
          <path d={d} />
        </clipPath>
        <g clipPath={`url(#bevel-${shape}-${tier}-${locked ? "l" : "u"})`}>
          <ellipse cx="50" cy="18" rx="46" ry="22" fill={m.bevel} opacity="0.75" />
          <ellipse cx="50" cy="96" rx="52" ry="26" fill={m.deep} opacity="0.7" />
        </g>
        {/* liseré doré des épiques/légendaires */}
        {epicPlus && (
          <g transform="translate(50 50) scale(0.9) translate(-50 -50)">
            <path
              d={d}
              fill="none"
              stroke={tier === "legendary" ? "#fffbeb" : "#fbbf24"}
              strokeWidth="2.5"
              opacity="0.9"
            />
          </g>
        )}

        {/* étincelles */}
        {legendary && (
          <>
            <Sparkle cx={22} cy={22} size={4} color="#fffbeb" />
            <Sparkle cx={80} cy={28} size={3} color="#fffbeb" />
            <Sparkle cx={76} cy={70} size={3.4} color="#fde68a" />
          </>
        )}
        {!locked && tier === "epic" && (
          <>
            <Sparkle cx={24} cy={24} size={3} color="#ede9fe" />
            <Sparkle cx={78} cy={30} size={2.5} color="#ede9fe" />
          </>
        )}
      </svg>

      {/* médaillon central : icône ou cadenas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full shadow-md"
          style={{
            width: size * 0.44,
            height: size * 0.44,
            background: m.medallion,
            boxShadow: `inset 0 ${size * 0.02}px 0 rgba(255,255,255,0.9), inset 0 -${size * 0.03}px 0 rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.15)`,
          }}
        >
          {locked ? (
            <Lock
              className="text-stone-500"
              style={{ width: size * 0.2, height: size * 0.2 }}
              strokeWidth={2.5}
              aria-hidden
            />
          ) : (
            <IconAtSize
              name={iconName}
              pixels={Math.round(size * 0.24)}
              color={m.icon}
            />
          )}
        </div>
      </div>
    </div>
  );
}
