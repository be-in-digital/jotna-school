import Link from "next/link";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  PenTool,
  Award,
  Users,
  Menu,
  Bell,
  UserCircle,
} from "lucide-react";

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/subjects", label: "Matières", icon: BookOpen },
  { href: "/admin/pdf-uploads", label: "PDFs", icon: FileText },
  { href: "/admin/exercises/drafts", label: "Exercices", icon: PenTool },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/eleves", label: "Eleves", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <GraduationCap className="h-7 w-7 text-indigo-600" />
          <span className="text-lg font-bold text-gray-900">Jotna School</span>
          <span className="ml-1 rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            Admin
          </span>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
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
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm font-medium text-gray-500 lg:block">
            Navigation
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <UserCircle className="h-8 w-8 text-gray-400" />
              <span className="hidden font-medium sm:inline">Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
