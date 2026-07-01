import { cn } from "@/lib/utils";

/**
 * Redesign Gaming — game board panel. A thick-bordered rounded card with a
 * hard offset shadow, replacing flat SaaS cards on /student/* surfaces.
 * The `wood` variant renders the quest-board header look in pure CSS
 * (G4b: no bitmap assets).
 */

type Variant = "board" | "wood" | "soft";

const VARIANTS: Record<Variant, string> = {
  board:
    "bg-white/95 border-2 border-amber-200 shadow-[0_6px_0_rgba(217,119,6,0.18)]",
  wood: "bg-gradient-to-b from-amber-600 to-amber-700 border-2 border-amber-800 shadow-[0_6px_0_rgba(120,53,15,0.45)] text-amber-50",
  soft: "bg-amber-50/90 border-2 border-amber-100 shadow-[0_4px_0_rgba(217,119,6,0.10)]",
};

export function GamePanel({
  variant = "board",
  className,
  children,
  ...props
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-3xl", VARIANTS[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
