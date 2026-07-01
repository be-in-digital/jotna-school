"use client";

import { useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { roleHomePath, type Role } from "@/lib/auth";
import { Brand } from "@/components/landing/brand";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (profile === undefined) return;
    if (profile) {
      window.location.href = roleHomePath(profile.role as Role);
    }
  }, [isLoading, isAuthenticated, profile]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-lime-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <GraduationCap className="h-10 w-10 animate-pulse text-amber-600" />
          <p className="text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && profile !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-lime-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <GraduationCap className="h-10 w-10 animate-pulse text-amber-600" />
          <p className="text-sm">Redirection…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-lime-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Brand size="lg" priority className="mx-auto origin-center" />
          <p className="mt-2 text-sm text-gray-500">
            Apprends en t&apos;amusant
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
