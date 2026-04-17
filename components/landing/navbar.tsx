"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

import { Brand } from "./brand";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#comment", label: "Comment ça marche" },
  { href: "#exercices", label: "Exercices" },
  { href: "#pour-qui", label: "Pour qui" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md"
    >
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
            className="hidden items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-gray-800 active:scale-[0.98] sm:inline-flex"
          >
            Commencer
            <span aria-hidden className="text-amber-300">
              ✨
            </span>
          </Link>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="text-left border-b border-gray-100 pb-4">
                <SheetTitle>
                  <Brand size="lg" className="h-16 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-6 px-2">
                {LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium text-gray-600 transition-colors hover:text-gray-900"
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="border-gray-100" />
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="flex h-12 items-center justify-center rounded-xl border border-gray-200 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    className="flex h-12 items-center justify-center rounded-xl bg-gray-900 text-base font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
                  >
                    Commencer ✨
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
