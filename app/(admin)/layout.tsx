"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  PenTool,
  Award,
  Users,
  Settings,
} from "lucide-react";

import { Brand } from "@/components/landing/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/ui/user-menu";

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/subjects", label: "Matières", icon: BookOpen },
  { href: "/admin/pdf-uploads", label: "PDFs", icon: FileText },
  { href: "/admin/exercises/drafts", label: "Exercices", icon: PenTool },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/eleves", label: "Élèves", icon: Users },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <Brand size="sm" />
            <span className="ml-auto rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              Admin
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);
                  const Icon = link.icon;
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={link.href} />}
                      >
                        <Icon />
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <UserMenu
            profileHref="/admin/settings"
            settingsHref="/admin/settings"
            fallbackLabel="Admin"
          />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="text-sm font-medium text-gray-500">Administration</div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
