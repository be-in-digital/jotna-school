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
    chip: "bg-emerald-100 text-emerald-700",
    button:
      "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg hover:scale-[1.01] hover:shadow-xl",
  },
  warning: {
    pioState: "hello",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
    chip: "bg-amber-100 text-amber-700",
    button:
      "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg hover:scale-[1.01] hover:shadow-xl",
  },
  info: {
    pioState: "hello",
    icon: <Mail className="h-4 w-4" aria-hidden />,
    chip: "bg-sky-100 text-sky-700",
    button:
      "bg-gradient-to-r from-sky-400 to-violet-500 text-white shadow-lg hover:scale-[1.01] hover:shadow-xl",
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
      <DialogContent className="overflow-hidden border-0 bg-gradient-to-br from-amber-200 via-pink-200 to-sky-200 p-1">
        <div className="rounded-[1.35rem] bg-white px-5 py-6 text-center sm:px-6">
          <DialogHeader>
            <div className="mx-auto mb-1 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-pink-100 shadow-inner">
              <Pio state={styles.pioState} size={96} />
            </div>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${styles.chip}`}
            >
              {styles.icon}
              {label}
            </div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mx-auto max-w-sm font-semibold">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-5">
            <button
              type="button"
              onClick={onPrimary}
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-extrabold transition-all ${styles.button}`}
            >
              {primaryLabel}
            </button>
            {secondaryLabel && onSecondary && (
              <button
                type="button"
                onClick={onSecondary}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-base font-extrabold text-slate-600 transition-all hover:bg-slate-50"
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
