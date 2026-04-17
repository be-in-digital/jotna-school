import { Section } from "./section";

const STEPS = [
  {
    number: "01",
    emoji: "👤",
    title: "Crée ton profil",
    description:
      "Les enfants créent leur avatar. Les parents gèrent plusieurs profils depuis un seul compte.",
    accent: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    number: "02",
    emoji: "🎯",
    title: "Choisis une matière",
    description:
      "Maths, français, sciences… chaque matière contient des chapitres adaptés au niveau scolaire.",
    accent: "bg-lime-50 text-lime-800 ring-lime-200",
  },
  {
    number: "03",
    emoji: "🏆",
    title: "Progresse et gagne des badges",
    description:
      "Chaque exercice réussi fait grimper la jauge de maîtrise et débloque des récompenses.",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="comment"
      eyebrow="Comment ça marche"
      title="Trois étapes, zéro friction."
      description="Pas d'installation, pas de configuration compliquée. On se connecte, on apprend."
    >
      <ol className="grid gap-5 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.number}
            className="group relative flex flex-col rounded-3xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${step.accent}`}
              >
                Étape {step.number}
              </span>
              <span aria-hidden className="text-3xl">
                {step.emoji}
              </span>
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-gray-900">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
