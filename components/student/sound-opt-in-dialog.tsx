"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Volume2, Volume1 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pio } from "@/components/student/pio";
import {
  markOptInAsked,
  playCorrect,
  preloadAll,
  setSoundEnabledLocal,
} from "@/lib/sounds";

/**
 * Phase A.5 — Sound opt-in dialog (D20, D32, D33).
 *
 *   D20 — Triggered from /complete page (NOT /home), after the kid has
 *         completed their first session. The kid is in a happy moment, so
 *         the question "want sound for the next ones?" lands well.
 *   D32 — CE2-friendly copy. Single short sentence, no abstract concepts,
 *         no hint that they can change later (the toggle in /profil exists,
 *         parents/teachers will tell them).
 *   D33 — "Écouter d'abord" is the FIRST and LARGEST CTA. Forces a preview
 *         which doubles as iOS audio context unlock gesture.
 */
export function SoundOptInDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setSoundEnabled = useMutation(api.streak.setSoundEnabled);
  const [previewed, setPreviewed] = useState(false);
  const [busy, setBusy] = useState(false);

  const handlePreview = async () => {
    setSoundEnabledLocal(true); // Allow play() to fire even before opt-in is persisted.
    await preloadAll();
    void playCorrect();
    setPreviewed(true);
  };

  const handleAccept = async () => {
    setBusy(true);
    setSoundEnabledLocal(true);
    markOptInAsked(userId);
    void preloadAll();
    try {
      await setSoundEnabled({ enabled: true });
    } catch {
      // Mutation will queue offline; UI proceeds either way.
    } finally {
      setBusy(false);
      onOpenChange(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    setSoundEnabledLocal(false);
    markOptInAsked(userId);
    try {
      await setSoundEnabled({ enabled: false });
    } catch {
      // Mutation will queue offline; UI proceeds either way.
    } finally {
      setBusy(false);
      onOpenChange(false);
    }
  };

  // ESC / outside-click → treat as decline so we don't re-prompt next visit.
  const handleOpenChange = (next: boolean) => {
    if (!next && open) {
      void handleDecline();
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal
    >
      <DialogContent>
        <DialogHeader>
          <Pio state="cheer" size={96} />
          <DialogTitle>Tu veux entendre Pio ?</DialogTitle>
          <DialogDescription>
            Il fait un petit son quand tu réussis !
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          {/* D33 — preview = primary first CTA, large + iOS audio unlock */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-orange-700 bg-orange-500 px-5 py-3 font-game text-base font-bold text-white shadow-md transition-all duration-100 hover:bg-orange-400 active:translate-y-[3px] active:border-b-0 disabled:opacity-50"
          >
            <Volume2 className="h-5 w-5" aria-hidden />
            {previewed ? "Encore une fois" : "Écouter d'abord"}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={busy}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3 text-base font-bold text-white shadow-md transition-all hover:bg-green-600 disabled:opacity-50"
            >
              <Volume1 className="h-5 w-5" aria-hidden />
              Oui
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={busy}
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl border-2 border-amber-300 border-b-4 bg-white px-4 py-3 font-game text-base font-bold text-amber-900 transition-all duration-100 hover:bg-amber-50 active:translate-y-[2px] active:border-b-2 disabled:opacity-50"
            >
              Non merci
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
