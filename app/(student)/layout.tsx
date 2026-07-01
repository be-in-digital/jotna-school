"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TentTree, Map, Trophy, NotebookPen, Star, Flame } from "lucide-react";
import { UserMenu } from "@/components/ui/user-menu";
import { Brand } from "@/components/landing/brand";
import { MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Redesign Gaming (tasks/redesign-gaming.md) — game shell for /student/*.
 * The student space is a world: sky gradient base, floating glass HUD on top,
 * chunky game dock on mobile. Screens draw their own scenery on this base.
 */

const navLinks = [
  { href: "/student/home", label: "Camp", icon: TentTree },
  { href: "/student/map", label: "Carte", icon: Map },
  { href: "/student/badges", label: "Trophées", icon: Trophy },
  { href: "/student/profil", label: "Carnet", icon: NotebookPen },
];

// Routes where the student should be fully focused on the exercise —
// the HUD + game dock are hidden to avoid distraction (Decision 90 +
// driving-test app pattern). Decision D5 extends focus to the bottom tab.
// G3 — the gaming reskin deliberately leaves these routes untouched.
function isFocusRoute(pathname: string): boolean {
  return (
    /^\/student\/topics\/[^/]+\/session/.test(pathname) ||
    /^\/student\/topics\/[^/]+\/complete/.test(pathname)
  );
}

function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const focusMode = isFocusRoute(pathname);

  return (
    // D12 — honors prefers-reduced-motion globally for all motion inside
    // /student/* routes (badges, session, complete, Pio, etc.).
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col overflow-x-clip bg-gradient-to-b from-sky-200 via-sky-100 to-amber-100">
        {/* Soft sun halo — pure CSS, part of the persistent world feel. */}
        {!focusMode && (
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-[8%] h-64 w-64 rounded-full bg-amber-200/60 blur-3xl"
          />
        )}

        {!focusMode && (
          <header className="sticky top-0 z-20 px-3 pt-3">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-full border-2 border-white/60 bg-white/75 px-4 shadow-lg shadow-sky-100/60 backdrop-blur-md sm:h-[4.5rem] sm:px-6">
              <Brand href="/student/home" size="sm" />

              {/* D5 — top nav links: tablet/desktop only. Mobile uses the dock. */}
              <nav className="hidden items-center gap-1.5 sm:flex">
                {navLinks.map((link) => {
                  const isActive = isNavActive(pathname, link.href);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 font-game text-base font-semibold transition-all",
                        isActive
                          ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                          : "text-amber-900/80 hover:bg-amber-100 hover:text-amber-900",
                      )}
                    >
                      <link.icon className="h-5 w-5" aria-hidden />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                <StudentStatusBar />
                <UserMenu
                  profileHref="/student/profil"
                  variant="compact"
                  fallbackLabel="Élève"
                />
                <StudentFirstName />
              </div>
            </div>
          </header>
        )}

        <main
          className={cn(
            "relative mx-auto w-full max-w-6xl flex-1 px-4 py-6",
            !focusMode && "pb-32 sm:pb-8",
          )}
        >
          {children}
        </main>

        {/* D5 — game dock: mobile only. Hidden during focus mode. */}
        {!focusMode && <GameDock pathname={pathname} />}
      </div>
    </MotionConfig>
  );
}

function StudentFirstName() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  if (!profile?.name) return null;
  const first = profile.name.split(" ")[0];
  return (
    <span className="hidden font-game text-sm font-semibold text-amber-900 sm:inline">
      {first}
    </span>
  );
}

/**
 * D17 — top status bar reduced to 2 metrics:
 *   🔥 série (only if streaksEnabled per D7 + currentStreak > 0)
 *   ⭐ étoiles totales (only if any earned — includes quest bonus, G7)
 *
 * D8 — Cold-start: renders nothing when neither has been earned, so a brand
 * new student never sees a row of zeros that frames the experience as
 * "you have nothing yet".
 */
function StudentStatusBar() {
  const stats = useQuery(api.students.getMyStats);
  if (!stats) return null;

  const showStreak = stats.streaksEnabled && stats.currentStreak > 0;
  const showStars = stats.totalStars > 0;

  if (!showStreak && !showStars) return null;

  return (
    <div className="flex items-center gap-1.5">
      {showStreak && (
        <span
          className="inline-flex items-center gap-1 rounded-full border-2 border-orange-200 bg-orange-100 px-2.5 py-1 font-game text-sm font-bold text-orange-700"
          aria-label={`Série de ${stats.currentStreak} jour${stats.currentStreak > 1 ? "s" : ""}`}
        >
          <Flame
            className="h-4 w-4 fill-orange-500 text-orange-500"
            aria-hidden
          />
          <span>{stats.currentStreak}</span>
        </span>
      )}
      {showStars && (
        <span
          className="inline-flex items-center gap-1 rounded-full border-2 border-yellow-200 bg-yellow-100 px-2.5 py-1 font-game text-sm font-bold text-yellow-800"
          aria-label={`${stats.totalStars} étoiles gagnées`}
        >
          <Star
            className="h-4 w-4 fill-yellow-500 text-yellow-500"
            aria-hidden
          />
          <span>{stats.totalStars}</span>
        </span>
      )}
    </div>
  );
}

function GameDock({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-3 left-3 right-3 z-20 sm:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around gap-1 rounded-[1.75rem] border-2 border-white/70 bg-white/90 px-2 py-1.5 shadow-xl shadow-amber-900/10 backdrop-blur-md">
        {navLinks.map((link) => {
          const isActive = isNavActive(pathname, link.href);
          return (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              // D15 — 56px tap target (>44px WCAG 2.5.5 AA).
              className={cn(
                "flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1.5 font-game text-xs font-semibold transition-all",
                isActive
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "text-amber-900/60 active:text-orange-600",
              )}
            >
              <link.icon
                className={cn("h-6 w-6", isActive && "drop-shadow-sm")}
                aria-hidden
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
