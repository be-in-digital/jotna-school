import Link from "next/link";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Settings,
  UserCircle,
} from "lucide-react";

const sidebarLinks = [
  { href: "/parent/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/parent/children/add", label: "Ajouter un enfant", icon: Users },
  { href: "/parent/settings", label: "Paramètres", icon: Settings },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <GraduationCap className="h-7 w-7 text-teal-600" />
          <span className="text-lg font-bold text-gray-900">Jotna School</span>
          <span className="ml-1 rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
            Parent
          </span>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-16 items-center justify-end border-b border-gray-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <UserCircle className="h-8 w-8 text-gray-400" />
            <span className="hidden font-medium sm:inline">Parent</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
