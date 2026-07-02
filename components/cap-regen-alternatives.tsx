"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { kidMessages } from "@/lib/kidCopy";

/**
 * Écran "On t'a vu galérer 💪" — présenté quand cumulativeRegens >= 3 (Decision 83).
 *
 * Toujours une voie d'évasion bienveillante. Pas de cul-de-sac.
 */
export function CapRegenAlternatives({
  onSeeCorrected,
  previousPalierHref,
  onAskParent,
}: {
  onSeeCorrected: () => void;
  previousPalierHref?: string | null;
  onAskParent: () => void;
}) {
  const { intro, options } = kidMessages.capRegenReached;

  // Map options to handlers
  const handlers = [onSeeCorrected, undefined /* link */, onAskParent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-lg"
    >
      <div className="text-center">
        <p className="font-game text-lg font-bold text-amber-950">{intro}</p>
      </div>
      <div className="space-y-3">
        {options.map((opt, i) => {
          const isLink = i === 1; // refaire palier précédent = navigation
          const className =
            "flex w-full items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-left transition-all hover:scale-[1.02] hover:shadow-md";
          const content = (
            <>
              <span className="text-3xl" aria-hidden>
                {opt.icon}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-amber-950">{opt.label}</p>
              </div>
              <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                {opt.cta}
              </span>
            </>
          );
          if (isLink && previousPalierHref) {
            return (
              <Link key={i} href={previousPalierHref} className={className}>
                {content}
              </Link>
            );
          }
          if (isLink && !previousPalierHref) {
            return (
              <button
                key={i}
                disabled
                className={`${className} cursor-not-allowed opacity-50`}
              >
                {content}
              </button>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={handlers[i]}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
