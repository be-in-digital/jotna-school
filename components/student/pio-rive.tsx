"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import type { PioState } from "@/components/student/pio";

const RIV_PATH = "/rive/pio.riv";

const STATE_MACHINE = "PioStateMachine";
const STATE_INPUT = "state";

const STATE_TO_NUMBER: Record<PioState, number> = {
  idle: 0,
  hello: 1,
  cheer: 2,
  sad: 3,
};

type PioRiveProps = {
  state?: PioState;
  size?: number;
  className?: string;
};

export function PioRive({ state = "idle", size = 224, className = "" }: PioRiveProps) {
  const [riveAvailable, setRiveAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(RIV_PATH, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setRiveAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setRiveAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (riveAvailable === false) {
    return (
      <PioImageFallback state={state} size={size} className={className} />
    );
  }

  if (riveAvailable === null) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return <PioRiveCanvas state={state} size={size} className={className} />;
}

function PioRiveCanvas({
  state,
  size,
  className,
}: {
  state: PioState;
  size: number;
  className: string;
}) {
  const { rive, RiveComponent } = useRive({
    src: RIV_PATH,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  useEffect(() => {
    if (!rive) return;
    const inputs = rive.stateMachineInputs(STATE_MACHINE);
    if (!inputs) return;
    const stateInput = inputs.find((i) => i.name === STATE_INPUT);
    if (stateInput) {
      stateInput.value = STATE_TO_NUMBER[state];
    }
  }, [rive, state]);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function PioImageFallback({
  state,
  size,
  className,
}: {
  state: PioState;
  size: number;
  className: string;
}) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <Image
        src={`/images/pio/${state}.png`}
        alt={`Pio — ${state}`}
        width={size}
        height={size}
        className="h-full w-full object-contain drop-shadow-lg"
        priority
      />
    </div>
  );
}
