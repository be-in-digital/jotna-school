import Link from "next/link";
import {
  GraduationCap,
  Home,
  Award,
  UserCircle,
  Star,
} from "lucide-react";

const navLinks = [
  { href: "/student/home", label: "Accueil", icon: Home },
  { href: "/student/badges", label: "Badges", icon: Award },
  { href: "/student/profil", label: "Profil", icon: UserCircle },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-yellow-50 via-orange-50 to-pink-50">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-10 border-b border-orange-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/student/home" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-orange-500" />
            <span className="text-lg font-bold text-gray-900">Jotna School</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-orange-100 hover:text-orange-700"
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Avatar + badges count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
              <Star className="h-4 w-4" />
              <span>0</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-400 text-sm font-bold text-white">
              ?
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
