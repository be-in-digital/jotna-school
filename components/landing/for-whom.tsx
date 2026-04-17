import { BookOpen, Heart, GraduationCap } from "lucide-react";

import { Section } from "./section";

const PERSONAS = [
  {
    icon: BookOpen,
    emoji: "🎒",
    title: "Pour les enfants",
    color: "bg-amber-500",
    points: [
      "Des exercices courts et variés",
      "Des badges pour chaque étape",
      "Une jauge de progression visuelle",
    ],
  },
  {
    icon: Heart,
    emoji: "💚",
    title: "Pour les parents",
    color: "bg-lime-600",
    points: [
      "Tableau de bord pour plusieurs enfants",
      "Rapports clairs par chapitre",
      "Notifications quand un badge est gagné",
    ],
  },
  {
    icon: GraduationCap,
    emoji: "🧑‍🏫",
    title: "Pour les professeurs",
    color: "bg-orange-500",
    points: [
      "Suivi individuel des élèves",
      "Détection des difficultés récurrentes",
      "Contenus validés avant publication",
    ],
  },
];

export function ForWhom() {
  return (
    <Section
      id="pour-qui"
      eyebrow="Pour qui"
      title="Un outil pensé pour toute la famille."
      description="Chaque rôle dispose de son espace. Les enfants apprennent, les adultes accompagnent."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 transition-all hover:border-gray-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex size-11 items-center justify-center rounded-2xl ${p.color} text-white shadow-sm`}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span aria-hidden className="text-2xl">
                  {p.emoji}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-extrabold text-gray-900">
                {p.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {p.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span
                      aria-hidden
                      className="mt-[7px] size-1.5 flex-none rounded-full bg-gray-300"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
