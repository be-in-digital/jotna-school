import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Section({
  id,
  eyebrow,
  title,
  description,
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24",
        className,
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-12 sm:mt-14">{children}</div>
    </section>
  );
}
