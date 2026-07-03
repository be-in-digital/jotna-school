"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/** Initialise PostHog après hydratation (no-op sans clé). */
export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
