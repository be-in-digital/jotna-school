"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Pio } from "@/components/student/pio";
import { kidMessages } from "@/lib/kidCopy";

/**
 * Loader kid-friendly — Pio l'explorateur cherche les exercices à la loupe.
 * Decision 86 (UA M3) — affiché pour toutes attentes IA > 500ms.
 *
 * Pio reste immobile (décision utilisateur : aucune animation du corps) ;
 * la vie vient du halo doux derrière lui, des points rebondissants et des
 * messages rotatifs.
 *
 * Usage:
 *   <JotnaLoader message="Aïssatou prépare tes exos..." />
 *   <JotnaLoader />  // messages rotatifs
 */
export function JotnaLoader({
  message,
  size = 150,
  className = "",
}: {
  message?: string;
  size?: number;
  className?: string;
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (message) return; // override mode, pas de rotation
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % kidMessages.loaderMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message ?? kidMessages.loaderMessages[messageIndex];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-10 ${className}`}
    >
      {/* Pio l'explorateur, posé sur un halo doux (statique) */}
      <div className="relative flex items-end justify-center">
        <span
          aria-hidden
          className="absolute bottom-1 h-[38%] w-[130%] rounded-[100%] bg-amber-300/40 blur-xl"
        />
        <Pio state="think" size={size} className="relative drop-shadow-md" />
        <span
          aria-hidden
          className="absolute -bottom-1 h-3 w-[55%] rounded-[100%] bg-amber-900/15 blur-[2px]"
        />
      </div>

      {/* points rebondissants aux couleurs du monde */}
      <div className="flex items-center gap-2" aria-hidden>
        <span className="inline-block h-3.5 w-3.5 animate-bounce rounded-full bg-amber-400 [animation-delay:0ms]" />
        <span className="inline-block h-3.5 w-3.5 animate-bounce rounded-full bg-orange-500 [animation-delay:150ms]" />
        <span className="inline-block h-3.5 w-3.5 animate-bounce rounded-full bg-lime-500 [animation-delay:300ms]" />
        <span className="inline-block h-3.5 w-3.5 animate-bounce rounded-full bg-sky-400 [animation-delay:450ms]" />
      </div>

      <motion.p
        key={displayMessage}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs text-center font-game text-sm font-semibold text-amber-900/80"
        role="status"
      >
        {displayMessage}
      </motion.p>
    </div>
  );
}
