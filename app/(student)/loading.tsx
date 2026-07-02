// Redesign Gaming — points rebondissants aux couleurs du monde (ambre,
// orange, lime, ciel) pendant les transitions de pages élève.
export default function StudentLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-amber-400 [animation-delay:0ms]" />
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-orange-500 [animation-delay:150ms]" />
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-lime-500 [animation-delay:300ms]" />
          <span className="inline-block h-4 w-4 animate-bounce rounded-full bg-sky-400 [animation-delay:450ms]" />
        </div>
        <p className="font-game text-sm font-semibold text-amber-900/70">
          Chargement en cours…
        </p>
      </div>
    </div>
  );
}
