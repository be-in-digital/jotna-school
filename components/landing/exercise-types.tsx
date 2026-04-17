import { Section } from "./section";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

type ExerciseCard = {
  label: string;
  title: string;
  description: string;
  preview: React.ReactNode;
  tint: string;
};

const TYPES: ExerciseCard[] = [
  {
    label: "QCM",
    title: "Questions à choix multiples",
    description: "Quatre propositions, une bonne réponse. Simple et efficace.",
    tint: "from-amber-50 to-amber-100/50",
    preview: (
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { v: "12", ok: true },
          { v: "8", ok: false },
          { v: "15", ok: false },
          { v: "6", ok: false },
        ].map((o) => (
          <span
            key={o.v}
            className={
              o.ok
                ? "rounded-lg border-2 border-lime-500 bg-white px-2 py-1.5 text-center text-sm font-bold text-lime-700"
                : "rounded-lg border border-gray-200 bg-white/80 px-2 py-1.5 text-center text-sm font-semibold text-gray-500"
            }
          >
            {o.v}
          </span>
        ))}
      </div>
    ),
  },
  {
    label: "Glisser-déposer",
    title: "Drag & drop",
    description: "Classer, trier, ranger — par le geste.",
    tint: "from-orange-50 to-orange-100/50",
    preview: (
      <div className="space-y-1.5">
        <div className="rounded-lg border-2 border-dashed border-orange-300 bg-white/60 px-3 py-1.5 text-xs font-semibold text-orange-700">
          🍎 Fruits
        </div>
        <div className="flex gap-1.5">
          <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700">
            pomme
          </span>
          <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700">
            fraise
          </span>
        </div>
      </div>
    ),
  },
  {
    label: "Association",
    title: "Relier les paires",
    description: "Associer des mots, images ou concepts qui vont ensemble.",
    tint: "from-sky-50 to-sky-100/60",
    preview: (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-xs font-semibold">
        <span className="rounded-md bg-white px-2 py-1 text-center text-gray-700 ring-1 ring-sky-200">
          chat
        </span>
        <span className="text-sky-400" aria-hidden>
          ↔
        </span>
        <span className="rounded-md bg-white px-2 py-1 text-center text-gray-700 ring-1 ring-sky-200">
          miauler
        </span>
        <span className="rounded-md bg-white px-2 py-1 text-center text-gray-700 ring-1 ring-sky-200">
          chien
        </span>
        <span className="text-sky-400" aria-hidden>
          ↔
        </span>
        <span className="rounded-md bg-white px-2 py-1 text-center text-gray-700 ring-1 ring-sky-200">
          aboyer
        </span>
      </div>
    ),
  },
  {
    label: "Mise en ordre",
    title: "Remettre en ordre",
    description: "Chronologie, étapes, lettres d'un mot — dans le bon ordre.",
    tint: "from-lime-50 to-lime-100/60",
    preview: (
      <div className="flex items-center gap-1 text-xs font-bold">
        {["L", "I", "V", "R", "E"].map((l, i) => (
          <span
            key={l}
            className="flex size-7 items-center justify-center rounded-md bg-white text-lime-800 shadow-sm ring-1 ring-lime-300"
          >
            <span className="text-[9px] text-lime-500">{i + 1}</span>
            <span className="ml-0.5">{l}</span>
          </span>
        ))}
      </div>
    ),
  },
  {
    label: "Réponse libre",
    title: "Réponse courte",
    description: "Écrire la solution — l'orthographe compte.",
    tint: "from-yellow-50 to-yellow-100/60",
    preview: (
      <div className="rounded-lg border-2 border-yellow-400 bg-white px-3 py-2">
        <p className="text-[10px] font-medium text-gray-500">Ta réponse</p>
        <p className="text-sm font-bold text-gray-900">
          42<span className="ml-0.5 inline-block w-[2px] animate-pulse bg-amber-500 align-middle h-4" />
        </p>
      </div>
    ),
  },
];

export function ExerciseTypes() {
  return (
    <Section
      id="exercices"
      eyebrow="Exercices"
      title="Cinq formats, toujours ludiques."
      description="Chaque type d'exercice sollicite une compétence différente — pour garder l'attention et varier les plaisirs."
    >
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPES.map((t) => (
          <StaggerItem
            key={t.label}
            className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:shadow-lg"
          >
            <span className="inline-flex w-fit rounded-full bg-gray-900 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
              {t.label}
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-gray-900">
              {t.title}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-gray-600">
              {t.description}
            </p>
            <div
              className={`mt-5 rounded-2xl bg-gradient-to-br ${t.tint} p-4 ring-1 ring-inset ring-white/60`}
            >
              {t.preview}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </Section>
  );
}
