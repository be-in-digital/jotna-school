"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { BadgeShield } from "@/components/student/badge-icon";
import { Pio } from "@/components/student/pio";
import type { RarityTier } from "@/lib/badges";
import { play } from "@/lib/sounds";
import { track } from "@/lib/analytics";

type UnseenBadge = {
  badgeId: Id<"badges">;
  badge: { name: string; icon: string; rarity: RarityTier };
};

/**
 * « Nouveau trophée ! » sur le hub — les badges gagnés hors session (via
 * une mission, ou si l'enfant a quitté avant l'écran de fin) étaient
 * attribués silencieusement. Même mécanique unseenBadges/markBadgesSeen
 * que /complete (D25) : premier écran qui montre, marque.
 */
export function HubBadgeToast({ unseen }: { unseen: UnseenBadge[] }) {
  const markBadgesSeen = useMutation(api.badges.markBadgesSeen);
  const [snapshot, setSnapshot] = useState<UnseenBadge[] | null>(null);
  const [open, setOpen] = useState(false);
  const captured = useRef(false);

  useEffect(() => {
    if (captured.current || unseen.length === 0) return;
    captured.current = true;
    const t = setTimeout(() => {
      setSnapshot(unseen);
      setOpen(true);
      void play("badge");
      track("badge_toast_shown", { count: unseen.length });
      void markBadgesSeen({ badgeIds: unseen.map((b) => b.badgeId) });
    }, 800); // laisse la scène s'installer d'abord
    const hide = setTimeout(() => setOpen(false), 8000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, [unseen, markBadgesSeen]);

  const first = snapshot?.[0];

  return (
    <AnimatePresence>
      {open && first && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="fixed bottom-24 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:bottom-8"
          role="status"
        >
          <div className="flex items-center gap-3 rounded-3xl border-2 border-amber-200 bg-white/95 p-3 pr-10 shadow-xl backdrop-blur-sm">
            <BadgeShield
              iconName={first.badge.icon}
              badgeName={first.badge.name}
              tier={first.badge.rarity}
              locked={false}
              size={64}
            />
            <div className="min-w-0 flex-1">
              <p className="font-game text-xs font-bold uppercase tracking-wide text-amber-700">
                Nouveau trophée !
              </p>
              <p className="truncate font-game text-base font-bold text-amber-950">
                {first.badge.name}
              </p>
              {snapshot.length > 1 && (
                <p className="text-xs text-amber-900/60">
                  +{snapshot.length - 1} autre
                  {snapshot.length > 2 ? "s" : ""} dans ta vitrine
                </p>
              )}
            </div>
            <span className="shrink-0" aria-hidden>
              <Pio state="cheer" size={52} />
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
