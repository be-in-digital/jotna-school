"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Award, ScrollText, Star, TrendingUp } from "lucide-react";
import { GamePanel } from "@/components/student/game/game-panel";

/**
 * « Ta semaine dans la savane » — récap des 7 derniers jours, affiché sur
 * le hub le LUNDI uniquement (le jour du bilan). Masqué s'il n'y a rien à
 * fêter (D8 : jamais de mur de zéros).
 */
export function WeeklyRecap() {
  // Jour calculé après hydratation (pas de mismatch SSR).
  const [isMonday, setIsMonday] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsMonday(new Date().getDay() === 1), 0);
    return () => clearTimeout(t);
  }, []);

  const recap = useQuery(
    api.students.getMyWeeklyRecap,
    isMonday ? {} : "skip",
  );

  if (!isMonday || !recap || !recap.hasAnything) return null;

  return (
    <GamePanel variant="board" className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b-2 border-amber-800 bg-gradient-to-b from-amber-600 to-amber-700 px-5 py-3">
        <TrendingUp className="h-5 w-5 text-amber-100" aria-hidden />
        <h2 className="font-game text-lg font-bold text-amber-50">
          Ta semaine dans la savane
        </h2>
      </div>
      <div className="grid grid-cols-3 divide-x divide-amber-100 px-2 py-4 text-center">
        <RecapStat
          icon={<Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />}
          value={recap.stars}
          label="étoiles"
        />
        <RecapStat
          icon={<ScrollText className="h-5 w-5 text-amber-600" />}
          value={recap.quests}
          label="missions"
        />
        <RecapStat
          icon={<Award className="h-5 w-5 text-violet-600" />}
          value={recap.badges}
          label="trophées"
        />
      </div>
    </GamePanel>
  );
}

function RecapStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      {icon}
      <p className="font-game text-2xl font-bold text-amber-950">{value}</p>
      <p className="text-xs font-semibold text-amber-900/60">{label}</p>
    </div>
  );
}
