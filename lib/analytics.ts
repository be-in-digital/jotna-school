"use client";

import posthog from "posthog-js";

/**
 * Analytics produit (PostHog) — mesure l'objectif du redesign (G6 :
 * wow + rétention). Politique minori-safe stricte :
 *   - AUCUNE identification des élèves (pas d'identify, events anonymes)
 *   - autocapture désactivée, session recordings désactivés
 *   - uniquement les événements métier listés ci-dessous + pageviews
 * Inactif sans NEXT_PUBLIC_POSTHOG_KEY (dev par défaut, prod à configurer).
 */

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    autocapture: false,
    capture_pageview: true,
    disable_session_recording: true,
    person_profiles: "identified_only", // élèves = anonymes, toujours
  });
  initialized = true;
}

export type AnalyticsEvent =
  | "hub_cta_clicked" // reprise/démarrage depuis le camp
  | "quest_completed" // une mission du jour terminée (côté client)
  | "palier_submitted" // fin de palier (validated/failed)
  | "shop_item_purchased"
  | "badge_toast_shown"
  | "zone_opened"; // ouverture d'une zone matière sur la carte

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}
