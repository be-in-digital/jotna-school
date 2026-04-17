import Link from "next/link";

import { Brand } from "./brand";

const LINKS = [
  { href: "#comment", label: "Comment ça marche" },
  { href: "#exercices", label: "Exercices" },
  { href: "#pour-qui", label: "Pour qui" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-24 w-full max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <Brand size="lg" priority className="h-20 w-auto" />

        <ul className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="transition-colors hover:text-gray-900"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:inline-flex"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-gray-800 active:scale-[0.98]"
          >
            Commencer
            <span aria-hidden className="text-amber-300">
              ✨
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
