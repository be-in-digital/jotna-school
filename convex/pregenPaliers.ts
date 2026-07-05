/**
 * Pré-génération du palier 1 (Decision 73 — « J0 pre-gen script »).
 *
 * Sans ça, le PREMIER enfant qui ouvre une thématique attend ~30-60 s la
 * génération IA. On réchauffe donc le palier 1 de chaque thématique à
 * l'avance : le palier 1 est le point d'entrée obligatoire de chaque
 * thématique (les paliers 2+ se débloquent au fil du jeu et n'ont pas
 * besoin d'être pré-générés pour tout le monde).
 *
 * Deux usages :
 *   - Lancement (J0)   : `npx convex run pregenPaliers:run '{"classes":["CI","CP"]}'`
 *     réchauffe tout, y compris les paliers expirés (démarrage à froid).
 *   - Cron hebdo       : ne touche QUE les thématiques jamais générées, pour
 *     couvrir les topics ajoutés depuis (profs/admin) sans re-payer chaque
 *     semaine la génération de tout le catalogue.
 *
 * La génération réelle passe par `paliers.getBucket` (palier 1 = pas de garde
 * d'auth), planifiée et étalée pour ménager le gateway IA. `getBucket` est
 * idempotent (cache hit si déjà frais), donc re-lancer est sans risque.
 */

import { v } from "convex/values";
import {
  action,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { classValidator } from "./classes";
import type { ClassLevel } from "./classes";

type WarmBucket = {
  subjectId: Id<"subjects">;
  class: ClassLevel;
  topicId: Id<"topics">;
};

/**
 * Un palier 1 doit-il être (re)généré ? Pur → testé.
 *   - jamais généré (existing null)     → toujours ;
 *   - stale / generating / expiré       → seulement si includeExpired
 *     (vrai pour le script J0, faux pour le cron qui vise les nouveaux topics).
 */
export function palierNeedsGeneration(
  existing: { status: string; expiresAt: number } | null | undefined,
  now: number,
  includeExpired: boolean,
): boolean {
  if (!existing) return true;
  if (existing.status !== "cached") return includeExpired;
  if (existing.expiresAt <= now) return includeExpired;
  return false;
}

/** Buckets palier-1 à réchauffer (thématiques ayant une classe). */
export const palier1BucketsToWarm = internalQuery({
  args: {
    classes: v.optional(v.array(classValidator)),
    includeExpired: v.boolean(),
  },
  handler: async (ctx, args): Promise<WarmBucket[]> => {
    const now = Date.now();
    const topics = await ctx.db.query("topics").take(1000);
    const classFilter = args.classes ? new Set<string>(args.classes) : null;

    const out: WarmBucket[] = [];
    for (const t of topics) {
      const cls = t.class;
      if (!cls) continue; // sans classe → pas de bucket possible
      if (classFilter && !classFilter.has(cls)) continue;

      const existing = await ctx.db
        .query("paliers")
        .withIndex("by_bucket", (q) =>
          q
            .eq("subjectId", t.subjectId)
            .eq("class", cls)
            .eq("topicId", t._id)
            .eq("palierIndex", 1),
        )
        .unique();

      if (palierNeedsGeneration(existing, now, args.includeExpired)) {
        out.push({ subjectId: t.subjectId, class: cls, topicId: t._id });
      }
    }
    return out;
  },
});

/**
 * Planifie la génération du palier 1 pour chaque bucket manquant, étalée dans
 * le temps. Partagé par l'action CLI et le cron.
 */
async function scheduleWarm(
  ctx: ActionCtx,
  opts: {
    classes?: ClassLevel[];
    includeExpired: boolean;
    limit?: number;
    staggerMs: number;
  },
): Promise<{ scheduled: number; classes: string }> {
  const buckets: WarmBucket[] = await ctx.runQuery(
    internal.pregenPaliers.palier1BucketsToWarm,
    { classes: opts.classes, includeExpired: opts.includeExpired },
  );
  const list =
    opts.limit !== undefined ? buckets.slice(0, opts.limit) : buckets;

  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    await ctx.scheduler.runAfter(i * opts.staggerMs, api.paliers.index.getBucket, {
      subjectId: b.subjectId,
      class: b.class,
      topicId: b.topicId,
      palierIndex: 1,
      markPreGenerated: true,
    });
  }

  return {
    scheduled: list.length,
    classes: opts.classes ? opts.classes.join(",") : "toutes",
  };
}

/**
 * Script J0 — à lancer une fois avant le lancement (ou après un gros seed) :
 *   npx convex run pregenPaliers:run                      # toutes classes
 *   npx convex run pregenPaliers:run '{"classes":["CI","CP"]}'
 *   npx convex run pregenPaliers:run '{"limit":3}'        # test à petit coût
 * Réchauffe aussi les paliers expirés (démarrage à froid).
 */
export const run = action({
  args: {
    classes: v.optional(v.array(classValidator)),
    limit: v.optional(v.number()),
    staggerMs: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ scheduled: number; classes: string }> => {
    return await scheduleWarm(ctx, {
      classes: args.classes,
      includeExpired: true,
      limit: args.limit,
      staggerMs: args.staggerMs ?? 1500,
    });
  },
});

/**
 * Cron hebdo — réchauffe UNIQUEMENT le palier 1 des thématiques jamais
 * générées (nouveaux topics ajoutés par les profs/admin). N'inclut pas les
 * paliers expirés : ceux-là se régénèrent à la demande quand un enfant les
 * ouvre, donc seuls les topics réellement utilisés coûtent.
 */
export const weeklyWarmNewTopics = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scheduled: number; classes: string }> => {
    return await scheduleWarm(ctx, {
      includeExpired: false,
      staggerMs: 3000,
    });
  },
});
