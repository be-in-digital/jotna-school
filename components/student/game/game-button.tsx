import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Redesign Gaming — chunky "press" button (Duolingo-style physicality).
 * The depth comes from a hard bottom border that collapses on :active while
 * the label shifts down — a tactile push kids instantly understand.
 * Pure CSS: no motion library involved, so it costs nothing and respects
 * reduced-motion by nature (no animation, just an instant pressed state).
 */

type Variant = "primary" | "success" | "sky" | "wood" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-orange-500 text-white border-orange-700 hover:bg-orange-400 shadow-orange-200",
  success:
    "bg-lime-500 text-white border-lime-700 hover:bg-lime-400 shadow-lime-200",
  sky: "bg-sky-500 text-white border-sky-700 hover:bg-sky-400 shadow-sky-200",
  wood: "bg-amber-700 text-amber-50 border-amber-900 hover:bg-amber-600 shadow-amber-200",
  ghost:
    "bg-white/90 text-amber-900 border-amber-300 hover:bg-amber-50 shadow-amber-100",
};

const SIZES = {
  md: "min-h-11 px-5 py-2.5 text-base rounded-2xl border-b-4",
  lg: "min-h-14 px-7 py-3.5 text-lg rounded-3xl border-b-[6px]",
} as const;

const BASE =
  "inline-flex items-center justify-center gap-2 font-game font-semibold " +
  "select-none transition-all duration-100 shadow-md " +
  "active:translate-y-[3px] active:border-b-0 active:shadow-none " +
  "focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-sky-400 " +
  "disabled:opacity-50 disabled:pointer-events-none";

type CommonProps = {
  variant?: Variant;
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
};

export function GameButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(BASE, SIZES[size], VARIANTS[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function GameLinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link
      href={href}
      className={cn(BASE, SIZES[size], VARIANTS[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
