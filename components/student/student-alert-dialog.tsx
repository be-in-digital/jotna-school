"use client";

import type React from "react";
import { AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pio, type PioState } from "@/components/student/pio";

type StudentAlertTone = "success" | "warning" | "info";

// Boutons alignés sur GameButton (pression chunky) — palette du monde.
const toneStyles: Record<
  StudentAlertTone,
  {
    pioState: PioState;
    icon: React.ReactNode;
    chip: string;
    button: string;
  }
> = {
  success: {
    pioState: "cheer",
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
    chip: "bg-lime-100 text-lime-700",
    button:
      "border-b-4 border-lime-700 bg-lime-500 text-white shadow-md hover:bg-lime-400 active:translate-y-[3px] active:border-b-0",
  },
  warning: {
    pioState: "encourage",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
    chip: "bg-amber-100 text-amber-700",
    button:
      "border-b-4 border-orange-700 bg-orange-500 text-white shadow-md hover:bg-orange-400 active:translate-y-[3px] active:border-b-0",
  },
  info: {
    pioState: "hello",
    icon: <Mail className="h-4 w-4" aria-hidden />,
    chip: "bg-sky-100 text-sky-700",
    button:
      "border-b-4 border-sky-700 bg-sky-500 text-white shadow-md hover:bg-sky-400 active:translate-y-[3px] active:border-b-0",
  },
};

export function StudentAlertDialog({
  open,
  onOpenChange,
  tone = "info",
  label,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone?: StudentAlertTone;
  label: string;
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const styles = toneStyles[tone];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-100 via-orange-100 to-lime-100 p-1.5">
        <div className="rounded-[1.35rem] bg-white/95 px-5 py-6 text-center sm:px-6">
          <DialogHeader>
            <div className="mx-auto mb-1 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-sky-100 to-amber-100 shadow-inner">
              <Pio state={styles.pioState} size={96} />
            </div>
            <div
              className={`mx-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-game text-xs font-bold uppercase tracking-wide ${styles.chip}`}
            >
              {styles.icon}
              {label}
            </div>
            <DialogTitle className="font-game text-xl font-bold text-amber-950">
              {title}
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-sm font-semibold text-amber-900/70">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-5">
            <button
              type="button"
              onClick={onPrimary}
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 font-game text-base font-bold transition-all duration-100 ${styles.button}`}
            >
              {primaryLabel}
            </button>
            {secondaryLabel && onSecondary && (
              <button
                type="button"
                onClick={onSecondary}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-amber-300 border-b-4 bg-white px-6 py-3 font-game text-base font-bold text-amber-900 transition-all duration-100 hover:bg-amber-50 active:translate-y-[3px] active:border-b-2"
              >
                {secondaryLabel}
              </button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
