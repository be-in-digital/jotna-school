"use client";

import { useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { roleHomePath, type Role } from "@/lib/auth";
import { GraduationCap } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <GraduationCap className="h-10 w-10 animate-pulse text-indigo-600" />
        <p className="text-sm">Connexion en cours…</p>
      </div>
    </div>
  );
}

export default function PostAuthPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (profile === undefined) return;

    window.location.href = roleHomePath((profile?.role as Role) ?? null);
  }, [isLoading, isAuthenticated, profile]);

  return <LoadingScreen />;
}
