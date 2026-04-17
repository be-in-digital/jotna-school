import Link from "next/link";

import { Brand } from "./brand";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-2">
          <Brand size="sm" />
          <p className="text-xs text-gray-500">
            Apprendre en s&apos;amusant, du CP au CM2.
          </p>
        </div>

        <nav
          aria-label="Liens de pied de page"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600"
        >
          <Link href="/login" className="transition-colors hover:text-gray-900">
            Se connecter
          </Link>
          <Link
            href="/register"
            className="transition-colors hover:text-gray-900"
          >
            Créer un compte
          </Link>
          <a href="#faq" className="transition-colors hover:text-gray-900">
            FAQ
          </a>
        </nav>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Jotna School
        </p>
      </div>
    </footer>
  );
}
