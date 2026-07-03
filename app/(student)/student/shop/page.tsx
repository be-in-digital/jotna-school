"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Check, Coins, Loader2, Sparkles } from "lucide-react";
import { GamePanel } from "@/components/student/game/game-panel";
import { GameButton } from "@/components/student/game/game-button";
import { Pio } from "@/components/student/pio";
import { track } from "@/lib/analytics";

/**
 * Boutique du camp — Redesign Gaming G7-V2. Objets 100 % cosmétiques :
 * décos posées dans la scène du hub + auras derrière Pio. Les pièces se
 * gagnent en jouant (paliers, missions, journées parfaites, trésors de
 * zone) — AUCUN achat réel, évidemment.
 */
export default function ShopPage() {
  const shop = useQuery(api.shop.getMyShop);
  const buyItem = useMutation(api.shop.buyItem);
  const toggleEquip = useMutation(api.shop.toggleEquip);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (shop === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-3 text-amber-900/70">
          Ouverture de la boutique…
        </span>
      </div>
    );
  }
  if (shop === null) {
    return (
      <div className="py-20 text-center text-amber-900/60">
        Connecte-toi pour visiter la boutique.
      </div>
    );
  }

  const handleBuy = async (itemKey: string) => {
    setBusyKey(itemKey);
    setError(null);
    try {
      await buyItem({ itemKey });
      track("shop_item_purchased", { itemKey });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Petit souci !";
      const match = msg.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
      setError(match ? match[1].trim() : msg);
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggle = async (itemKey: string) => {
    setBusyKey(itemKey);
    try {
      await toggleEquip({ itemKey });
    } catch {
      // silencieux — l'état réactif Convex reste la vérité
    } finally {
      setBusyKey(null);
    }
  };

  const campItems = shop.items.filter((i) => i.kind === "camp");
  const auraItems = shop.items.filter((i) => i.kind === "aura");

  return (
    <div className="space-y-6">
      <Link
        href="/student/home"
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-game text-sm font-semibold text-amber-900/70 transition-colors hover:text-amber-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour au camp
      </Link>

      {/* Bandeau — Pio marchand + solde */}
      <GamePanel variant="board" className="overflow-hidden">
        <div className="flex items-center gap-3 border-b-2 border-amber-800 bg-gradient-to-b from-amber-600 to-amber-700 px-5 py-3">
          <Sparkles className="h-5 w-5 text-amber-100" aria-hidden />
          <h1 className="font-game text-xl font-bold text-amber-50">
            La boutique du camp
          </h1>
        </div>
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Pio state="hello" size={64} />
            <p className="max-w-[16rem] text-sm font-semibold text-amber-900/80">
              Gagne des pièces en réussissant tes missions et tes paliers,
              puis décore ton camp !
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-100 px-4 py-2 font-game text-lg font-bold text-amber-800"
            aria-label={`Ton solde : ${shop.coins} pièces`}
          >
            <Coins className="h-5 w-5 text-amber-600" aria-hidden />
            {shop.coins}
          </span>
        </div>
      </GamePanel>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-3 text-center font-game text-sm font-semibold text-orange-700"
        >
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 font-game text-lg font-bold text-amber-950">
          Décos du camp
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {campItems.map((item) => (
            <ShopCard
              key={item.key}
              item={item}
              coins={shop.coins}
              busy={busyKey === item.key}
              onBuy={() => handleBuy(item.key)}
              onToggle={() => handleToggle(item.key)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-game text-lg font-bold text-amber-950">
          Auras de Pio
        </h2>
        <p className="mb-3 text-sm text-amber-900/60">
          Une seule aura à la fois — choisis bien !
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {auraItems.map((item) => (
            <ShopCard
              key={item.key}
              item={item}
              coins={shop.coins}
              busy={busyKey === item.key}
              onBuy={() => handleBuy(item.key)}
              onToggle={() => handleToggle(item.key)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ShopCard({
  item,
  coins,
  busy,
  onBuy,
  onToggle,
}: {
  item: {
    key: string;
    name: string;
    description: string;
    emoji: string;
    price: number;
    owned: boolean;
    equipped: boolean;
  };
  coins: number;
  busy: boolean;
  onBuy: () => void;
  onToggle: () => void;
}) {
  const affordable = coins >= item.price;
  return (
    <GamePanel
      variant={item.equipped ? "soft" : "board"}
      className={`flex flex-col items-center gap-2 p-4 text-center ${
        item.equipped ? "ring-2 ring-lime-400" : ""
      }`}
    >
      <span className="text-4xl" aria-hidden>
        {item.emoji}
      </span>
      <p className="font-game text-sm font-bold leading-tight text-amber-950">
        {item.name}
      </p>
      <p className="text-xs leading-snug text-amber-900/60">
        {item.description}
      </p>

      {item.owned ? (
        <GameButton
          variant={item.equipped ? "success" : "ghost"}
          onClick={onToggle}
          disabled={busy}
          className="mt-1 w-full !min-h-10 !px-3 !py-1.5 !text-sm"
        >
          {item.equipped ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Équipé
            </>
          ) : (
            "Équiper"
          )}
        </GameButton>
      ) : (
        <GameButton
          onClick={onBuy}
          disabled={busy || !affordable}
          className="mt-1 w-full !min-h-10 !px-3 !py-1.5 !text-sm"
          aria-label={`Acheter ${item.name} pour ${item.price} pièces`}
        >
          <Coins className="h-4 w-4" aria-hidden />
          {item.price}
        </GameButton>
      )}
    </GamePanel>
  );
}
