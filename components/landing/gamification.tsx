import { Flame, Target, Trophy } from "lucide-react";

import { Section } from "./section";

const BADGES = [
  { icon: "🧮", label: "Petit matheux", unlocked: true },
  { icon: "📖", label: "Lecteur curieux", unlocked: true },
  { icon: "🔬", label: "Apprenti savant", unlocked: false },
  { icon: "🌍", label: "Globe-trotteur", unlocked: false },
];

export function Gamification() {
  return (
    <Section
      eyebrow="Gamification"
      title="La motivation, intégrée au parcours."
      description="Rien d'artificiel : chaque récompense traduit une vraie compétence acquise."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Mastery card */}
        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Target className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Maîtrise</h3>
              <p className="text-xs text-gray-500">Jauge par chapitre</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { name: "Les fractions", pct: 82, color: "bg-amber-500" },
              { name: "Conjugaison", pct: 54, color: "bg-orange-500" },
              { name: "Le vivant", pct: 31, color: "bg-lime-600" },
            ].map((row) => (
              <div key={row.name}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-700">{row.name}</span>
                  <span className="text-gray-900">{row.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Badges card */}
        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
              <Trophy className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Badges</h3>
              <p className="text-xs text-gray-500">À collectionner</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {BADGES.map((b) => (
              <div
                key={b.label}
                className={
                  b.unlocked
                    ? "flex flex-col items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 p-2 text-center"
                    : "flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-2 text-center opacity-60"
                }
              >
                <span
                  aria-hidden
                  className={b.unlocked ? "text-2xl" : "text-2xl grayscale"}
                >
                  {b.icon}
                </span>
                <span className="text-[10px] font-semibold leading-tight text-gray-700">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-gray-500">
            Plus de 20 badges à débloquer au fil des chapitres.
          </p>
        </article>

        {/* Streak card */}
        <article className="rounded-3xl border border-gray-100 bg-gradient-to-br from-lime-500 via-lime-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white">
              <Flame className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-extrabold">Série quotidienne</h3>
              <p className="text-xs text-white/70">Un peu chaque jour</p>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div
                key={d}
                className={
                  d <= 5
                    ? "flex flex-1 flex-col items-center gap-1"
                    : "flex flex-1 flex-col items-center gap-1 opacity-40"
                }
              >
                <div
                  className="w-full rounded-md bg-white/90"
                  style={{ height: `${16 + d * 6}px` }}
                />
                <span className="text-[10px] font-semibold">J{d}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold">
            5 jours d&apos;affilée — bravo !
          </p>
        </article>
      </div>
    </Section>
  );
}
