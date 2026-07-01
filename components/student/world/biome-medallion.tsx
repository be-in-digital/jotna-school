import { cn } from "@/lib/utils";

/**
 * Redesign Gaming G4b — circular biome vignette for map zones. Four generic
 * savanna biomes cycled by index (data-driven: works for any number of
 * subjects), ring tinted with the subject's color from Convex.
 */

export type BiomeKind = "plaine" | "riviere" | "colline" | "foret";

export const BIOMES: BiomeKind[] = ["plaine", "riviere", "colline", "foret"];

export function biomeForIndex(index: number): BiomeKind {
  return BIOMES[index % BIOMES.length];
}

/** Stable biome per subject id — same zone art on every screen. */
export function biomeForKey(key: string): BiomeKind {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return BIOMES[h % BIOMES.length];
}

export function BiomeMedallion({
  kind,
  tint = "#f59e0b",
  className,
}: {
  kind: BiomeKind;
  /** subject.color — used for the ring so each zone reads as "its" subject. */
  tint?: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className={cn("select-none", className)}
      fill="none"
    >
      <defs>
        <clipPath id={`biome-clip-${kind}`}>
          <circle cx="60" cy="60" r="50" />
        </clipPath>
      </defs>

      {/* tinted ring — the subject identity */}
      <circle cx="60" cy="60" r="56" fill={tint} />
      <circle cx="60" cy="60" r="56" fill="#000" opacity="0.12" />
      <circle cx="60" cy="60" r="50" fill="#e0f2fe" />

      <g clipPath={`url(#biome-clip-${kind})`}>
        {/* sky + sun shared by all biomes */}
        <rect x="10" y="10" width="100" height="100" fill="#e0f2fe" />
        <circle cx="88" cy="30" r="12" fill="#fcd34d" />

        {kind === "plaine" && (
          <>
            <ellipse cx="60" cy="102" rx="70" ry="38" fill="#a3e635" />
            {/* mini baobab */}
            <path d="M56 84 C 54 68 55 60 58 50 L 66 50 C 69 60 70 68 68 84 Z" fill="#b45309" />
            <circle cx="50" cy="46" r="12" fill="#65a30d" />
            <circle cx="72" cy="44" r="13" fill="#65a30d" />
            <circle cx="61" cy="38" r="12" fill="#84cc16" />
          </>
        )}

        {kind === "riviere" && (
          <>
            <ellipse cx="60" cy="104" rx="70" ry="40" fill="#a3e635" />
            <path
              d="M10 78 C 40 70 52 88 78 82 C 96 78 104 84 112 82 L 112 110 L 10 110 Z"
              fill="#38bdf8"
            />
            <path
              d="M20 84 C 40 79 56 90 80 86"
              stroke="#7dd3fc"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* bridge */}
            <path d="M40 76 C 52 66 68 66 80 76" stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
            <line x1="46" y1="72" x2="46" y2="80" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
            <line x1="74" y1="72" x2="74" y2="80" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {kind === "colline" && (
          <>
            <ellipse cx="30" cy="96" rx="46" ry="30" fill="#84cc16" />
            <ellipse cx="88" cy="102" rx="50" ry="34" fill="#a3e635" />
            <path
              d="M18 92 C 34 86 46 88 58 96"
              stroke="#4d7c0f"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.6"
            />
            <circle cx="86" cy="76" r="8" fill="#65a30d" />
            <circle cx="96" cy="80" r="6" fill="#4d7c0f" />
          </>
        )}

        {kind === "foret" && (
          <>
            <ellipse cx="60" cy="104" rx="70" ry="38" fill="#84cc16" />
            {/* acacia row */}
            <line x1="38" y1="88" x2="38" y2="66" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="38" cy="60" rx="20" ry="8" fill="#16a34a" />
            <line x1="72" y1="92" x2="72" y2="62" stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="72" cy="55" rx="26" ry="10" fill="#16a34a" />
            <ellipse cx="66" cy="50" rx="14" ry="6" fill="#22c55e" />
            <line x1="98" y1="90" x2="98" y2="72" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="98" cy="67" rx="16" ry="7" fill="#16a34a" />
          </>
        )}
      </g>

      {/* glass highlight */}
      <path
        d="M26 38 C 34 22 52 12 70 14"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
