import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  readStudentPreferences,
  type StudentPreferences,
} from "./students";

// ===========================================================================
// Boutique du camp — Redesign Gaming G7-V2 (backlog acté au brainstorm,
// implémenté sur validation utilisateur 2026-07-03).
//
// Économie des pièces 🪙 (créditées via creditCoins) :
//   palier validé      → 10 + étoiles du palier
//   quête complétée    → récompense de la quête × 3
//   journée parfaite   → +15 (les 3 quêtes du jour)
//   trésor de zone     → +50 (une matière 100 % terminée, 1 fois/matière)
//
// Objets 100 % cosmétiques : décos du camp (posées dans la scène du hub)
// et auras de Pio (halo derrière la mascotte — jamais SUR l'avatar, qui
// est sacré). Une seule aura équipée à la fois ; décos cumulables.
// ===========================================================================

export type ShopItemKind = "camp" | "aura";

export type ShopItem = {
  key: string;
  kind: ShopItemKind;
  name: string;
  description: string;
  emoji: string;
  price: number;
  /** Position dans la scène du hub (décos camp) — % depuis la gauche/le bas. */
  anchor?: { left: number; bottom: number; size: number };
  /** Classe/gradient de l'aura (auras uniquement). */
  aura?: string;
};

export const SHOP_ITEMS: ShopItem[] = [
  // --- Décos du camp ---
  { key: "camp_flag", kind: "camp", name: "Fanion du camp", description: "Un fanion coloré pour ton campement.", emoji: "🚩", price: 30, anchor: { left: 8, bottom: 34, size: 34 } },
  { key: "camp_drum", kind: "camp", name: "Djembé", description: "Le tambour de la savane, prêt pour la fête.", emoji: "🪘", price: 45, anchor: { left: 30, bottom: 16, size: 38 } },
  { key: "camp_plant", kind: "camp", name: "Plante fleurie", description: "Une belle plante pour décorer le camp.", emoji: "🪴", price: 35, anchor: { left: 88, bottom: 16, size: 36 } },
  { key: "camp_lantern", kind: "camp", name: "Lanterne", description: "Elle éclaire le camp quand le soir tombe.", emoji: "🏮", price: 60, anchor: { left: 70, bottom: 30, size: 32 } },
  { key: "camp_ballon", kind: "camp", name: "Ballon", description: "Pour jouer entre deux exercices !", emoji: "⚽", price: 40, anchor: { left: 55, bottom: 12, size: 32 } },
  { key: "camp_books", kind: "camp", name: "Pile de livres", description: "La bibliothèque du camp grandit.", emoji: "📚", price: 55, anchor: { left: 16, bottom: 14, size: 34 } },
  // --- Auras de Pio ---
  { key: "aura_gold", kind: "aura", name: "Halo doré", description: "Pio brille comme le soleil de la savane.", emoji: "🌞", price: 80, aura: "from-amber-300/70 via-amber-200/40 to-transparent" },
  { key: "aura_star", kind: "aura", name: "Pluie d'étoiles", description: "Des étoiles scintillent autour de Pio.", emoji: "✨", price: 100, aura: "from-yellow-200/70 via-sky-200/40 to-transparent" },
  { key: "aura_leaf", kind: "aura", name: "Souffle de savane", description: "Un halo vert comme les feuilles du baobab.", emoji: "🍃", price: 90, aura: "from-lime-300/70 via-emerald-200/40 to-transparent" },
  { key: "aura_royal", kind: "aura", name: "Aura royale", description: "Digne du roi de la savane.", emoji: "👑", price: 150, aura: "from-violet-300/70 via-fuchsia-200/40 to-transparent" },
];

const ITEM_BY_KEY = new Map(SHOP_ITEMS.map((i) => [i.key, i]));

export const ZONE_TREASURE_COINS = 50;
export const PERFECT_DAY_COINS = 15;
export const PALIER_BASE_COINS = 10;
export const QUEST_COIN_MULTIPLIER = 3;

/** Solde et crédit — pattern borné identique à questBonusStars. */
export async function creditCoins(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  const prefs = readStudentPreferences(profile);
  const next: StudentPreferences = {
    ...prefs,
    coins: (prefs.coins ?? 0) + amount,
  };
  await ctx.db.patch(profile._id, { preferences: next });
}

/**
 * Trésor de zone (G7-V2) — appelé après un palier validé : si la matière du
 * palier vient d'être 100 % terminée et n'a jamais été récompensée, crédite
 * +50 pièces et marque la matière. Retourne le montant crédité (0 sinon).
 */
export async function awardZoneTreasureIfComplete(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  subjectId: Id<"subjects">,
): Promise<number> {
  const prefs = readStudentPreferences(profile);
  const rewarded = prefs.rewardedZoneSubjectIds ?? [];
  if (rewarded.includes(subjectId as string)) return 0;

  const topics = await ctx.db
    .query("topics")
    .withIndex("by_subjectId", (q) => q.eq("subjectId", subjectId))
    .take(200);
  if (topics.length === 0) return 0;

  const progress = await ctx.db
    .query("studentTopicProgress")
    .withIndex("by_studentId", (q) => q.eq("studentId", profile._id))
    .take(500);
  const completedTopicIds = new Set(
    progress.filter((p) => p.completedAt != null).map((p) => p.topicId as string),
  );
  const allDone = topics.every((t) => completedTopicIds.has(t._id as string));
  if (!allDone) return 0;

  const next: StudentPreferences = {
    ...prefs,
    coins: (prefs.coins ?? 0) + ZONE_TREASURE_COINS,
    rewardedZoneSubjectIds: [...rewarded, subjectId as string],
  };
  await ctx.db.patch(profile._id, { preferences: next });
  return ZONE_TREASURE_COINS;
}

// ---------------------------------------------------------------------------
// API boutique
// ---------------------------------------------------------------------------

async function getStudentProfile(ctx: MutationCtx, userId: string) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!profile || profile.role !== "student") return null;
  return profile;
}

export const getMyShop = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;

    const owned = await ctx.db
      .query("studentItems")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .take(100);
    const ownedByKey = new Map(owned.map((o) => [o.itemKey, o]));

    return {
      coins: readStudentPreferences(profile).coins ?? 0,
      items: SHOP_ITEMS.map((item) => ({
        ...item,
        owned: ownedByKey.has(item.key),
        equipped: ownedByKey.get(item.key)?.equipped ?? false,
      })),
    };
  },
});

export const buyItem = mutation({
  args: { itemKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await getStudentProfile(ctx, userId as string);
    if (!profile) throw new Error("Profil élève introuvable");

    const item = ITEM_BY_KEY.get(args.itemKey);
    if (!item) throw new Error("Objet introuvable");

    const existing = await ctx.db
      .query("studentItems")
      .withIndex("by_student_item", (q) =>
        q.eq("studentId", profile._id).eq("itemKey", args.itemKey),
      )
      .unique();
    if (existing) throw new Error("Tu as déjà cet objet !");

    const prefs = readStudentPreferences(profile);
    const coins = prefs.coins ?? 0;
    if (coins < item.price) {
      throw new Error("Pas assez de pièces — continue tes missions !");
    }

    // Les auras sont exclusives : équiper la nouvelle déséquipe l'ancienne.
    if (item.kind === "aura") {
      const owned = await ctx.db
        .query("studentItems")
        .withIndex("by_student", (q) => q.eq("studentId", profile._id))
        .take(100);
      for (const o of owned) {
        if (o.equipped && ITEM_BY_KEY.get(o.itemKey)?.kind === "aura") {
          await ctx.db.patch(o._id, { equipped: false });
        }
      }
    }

    await ctx.db.insert("studentItems", {
      studentId: profile._id,
      itemKey: args.itemKey,
      purchasedAt: Date.now(),
      equipped: true, // un achat s'équipe tout de suite — joie immédiate
    });
    const next: StudentPreferences = { ...prefs, coins: coins - item.price };
    await ctx.db.patch(profile._id, { preferences: next });
    return { coins: coins - item.price };
  },
});

export const toggleEquip = mutation({
  args: { itemKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await getStudentProfile(ctx, userId as string);
    if (!profile) throw new Error("Profil élève introuvable");

    const row = await ctx.db
      .query("studentItems")
      .withIndex("by_student_item", (q) =>
        q.eq("studentId", profile._id).eq("itemKey", args.itemKey),
      )
      .unique();
    if (!row) throw new Error("Objet non possédé");

    const item = ITEM_BY_KEY.get(args.itemKey);
    const nextEquipped = !row.equipped;
    if (nextEquipped && item?.kind === "aura") {
      const owned = await ctx.db
        .query("studentItems")
        .withIndex("by_student", (q) => q.eq("studentId", profile._id))
        .take(100);
      for (const o of owned) {
        if (
          o._id !== row._id &&
          o.equipped &&
          ITEM_BY_KEY.get(o.itemKey)?.kind === "aura"
        ) {
          await ctx.db.patch(o._id, { equipped: false });
        }
      }
    }
    await ctx.db.patch(row._id, { equipped: nextEquipped });
  },
});

// Crédit interne réutilisable (appelé par quests/palierAttempts via runMutation).
export const credit = internalMutation({
  args: { studentId: v.id("profiles"), amount: v.number() },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.studentId);
    if (!profile || profile.role !== "student") return;
    await creditCoins(ctx, profile, args.amount);
  },
});
