"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamificationStore } from "@/stores/gamification-store";

export default function BadgeUnlockModal() {
  const badge = useGamificationStore((s) => s.showBadgeUnlock);
  const hideBadge = useGamificationStore((s) => s.hideBadge);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(() => {
      hideBadge();
    }, 4000);
    return () => clearTimeout(timer);
  }, [badge, hideBadge]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={hideBadge}
        >
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 15,
              duration: 0.6,
            }}
            className="relative flex flex-col items-center rounded-3xl bg-white p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Golden glow effect */}
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-yellow-200 via-yellow-100 to-white opacity-80 blur-xl" />
            <div className="absolute -inset-2 -z-20 rounded-3xl bg-yellow-400/30 blur-2xl" />

            {/* Badge icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.2,
              }}
              className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-6xl shadow-lg"
            >
              {badge.icon}
            </motion.div>

            {/* Text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-2xl font-bold text-yellow-600"
            >
              Félicitations !
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="mt-2 text-xl font-semibold text-gray-900"
            >
              {badge.name}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-1 max-w-xs text-center text-sm text-gray-500"
            >
              {badge.description}
            </motion.p>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5 }}
              className="mt-6 text-xs text-gray-400"
            >
              Cliquez pour fermer
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
