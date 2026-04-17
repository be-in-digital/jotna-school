import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandSize = "sm" | "md" | "lg";

type BrandProps = {
  className?: string;
  href?: string;
  size?: BrandSize;
  /** When true, render only the logo image without a Link wrapper. */
  asImage?: boolean;
  priority?: boolean;
};

const SIZES: Record<BrandSize, { w: number; h: number; className: string }> = {
  sm: { w: 160, h: 160, className: "h-16 w-auto scale-125 origin-left" },
  md: { w: 256, h: 256, className: "h-24 w-auto scale-150 origin-left" },
  lg: { w: 384, h: 384, className: "h-32 w-auto scale-150 origin-left" },
};

export function Brand({
  className,
  href = "/",
  size = "sm",
  asImage = false,
  priority = false,
}: BrandProps) {
  const dims = SIZES[size];
  const image = (
    <Image
      src="/jotna-logo.png"
      alt="Jotna School"
      width={dims.w}
      height={dims.h}
      priority={priority}
      className={cn("select-none", dims.className, className)}
    />
  );

  if (asImage) return image;

  return (
    <Link
      href={href}
      aria-label="Jotna School, retour à l'accueil"
      className="inline-flex items-center"
    >
      {image}
    </Link>
  );
}
