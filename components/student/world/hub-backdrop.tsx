"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Redesign Gaming — rich bitmap backdrop for the hub (AI art, G4 restored).
 * Mounted ONLY on tier "full" (G5): lite devices never download it and keep
 * the SVG world underneath. Fades in over the SVG scene once decoded, so the
 * first paint is always instant vector art.
 *
 * One image is rendered at a time (portrait < 640px, wide ≥ 640px) so phones
 * never download the desktop art and vice versa.
 */
export function HubBackdrop() {
  const [loaded, setLoaded] = useState(false);
  // Aligned with the layout's `sm:` breakpoint (640px) — not useIsMobile
  // (768px), which would mismatch the SVG composition switch underneath.
  const [wide, setWide] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const onChange = () => setWide(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (wide === null) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 transition-opacity duration-700",
        loaded ? "opacity-100" : "opacity-0",
      )}
    >
      <Image
        src={
          wide
            ? "/images/world/hub-savanna-wide.jpg"
            : "/images/world/hub-savanna-portrait.jpg"
        }
        alt=""
        fill
        sizes="100vw"
        quality={80}
        // The sources are portrait; on wide stages the cover-crop band is
        // aimed at the landmarks + clearing (sky trimmed).
        className={cn(
          "object-cover",
          wide ? "object-[50%_50%]" : "object-[50%_46%]",
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
