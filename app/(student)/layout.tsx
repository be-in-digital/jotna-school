"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Home, Award, UserCircle, Star } from "lucide-react";
import { UserMenu } from "@/components/ui/user-menu";
import { Brand } from "@/components/landing/brand";

const navLinks = [
  { href: "/student/home", label: "Accueil", icon: Home },
  { href: "/student/badges", label: "Badges", icon: Award },
  { href: "/student/profil", label: "Profil", icon: UserCircle },
];

// Routes where the student should be fully focused on the exercise —
// the top navigation is hidden to avoid distraction (pattern used by
// driving-test apps and most quiz platforms).
function isFocusRoute(pathname: string): boolean {
  return (
    /^\/student\/topics\/[^/]+\/session/.test(pathname) ||
    /^\/student\/topics\/[^/]+\/complete/.test(pathname)
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const focusMode = isFocusRoute(pathname ?? "");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-yellow-50 to-lime-50">
      {!focusMode && (
        <header className="sticky top-0 z-10 border-b border-amber-100 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex h-24 max-w-5xl items-center justify-between px-4">
            <Brand href="/student/home" size="md" />

            <nav className="flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 rounded-full px-5 py-2.5 text-base font-semibold transition-all ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                        : "text-gray-700 hover:bg-amber-100 hover:text-amber-800"
                    }`}
                  >
                    <link.icon className={`h-5 w-5 ${isActive ? "text-white" : ""}`} />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <StudentStatsSummary />
              <UserMenu
                profileHref="/student/profil"
                variant="compact"
                fallbackLabel="Élève"
              />
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
function StudentStatsSummary() {
  const stats = useQuery(api.students.getMyStats);
  const stars = stats?.completedTopics ?? 0;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-4 py-1.5 text-base font-bold text-yellow-800">
      <Star className="h-5 w-5 fill-yellow-500" />
      <span>{stars}</span>
    </div>
  );
}
