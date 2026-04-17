import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CallToAction() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] bg-gray-900 px-6 py-16 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
        >
          <div className="absolute -top-24 left-1/4 size-[360px] rounded-full bg-amber-400/30 blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 size-[320px] rounded-full bg-lime-500/25 blur-3xl" />
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Prêt en 30 secondes
          </span>
          <h2 className="mt-5 font-sans text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Lance la première session.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Créer un compte, choisir une matière, et c&apos;est parti. Aucune
            carte bancaire, aucun téléchargement.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-gray-900 shadow-sm transition-transform hover:bg-gray-100 active:scale-[0.98] sm:w-auto"
            >
              Commencer gratuitement
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
