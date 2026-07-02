# Redesign Gaming — Espace Élève « Le Monde de Pio »

> Issu d'une session de brainstorming structurée (2026-07-01). Statut au 2026-07-02 :
> **REDESIGN COMPLET ET LIVRÉ** — toutes les phases (A→H) implémentées et vérifiées
> (299 tests unitaires + e2e verts, build prod OK). Fin de Phase F durcie : Carnet
> (fix D8 cold start — plus de mur de zéros) et Salle des trophées (vitrine +
> progression de collection) portés au niveau gaming. Socle Rive retiré (remplacé
> par le système sprite). Seule la session d'exercices reste sobre — décision G3.
> **Phase H révisée et livrée** : l'identité officielle de Pio est l'avatar chibi (référence
> `.context`, 2026-07-02). Le mesh image→3D (Meshy, rig+idle) a été essayé puis retiré —
> qualité indigne d'un personnage chibi à fourrure (G2 plan B contractuel). Le « Pio riche »
> du hub est un **sprite d'états de l'avatar officiel** (idle/hello/cheer/sad générés depuis
> la référence, détourés, animés par transformations — `components/student/pio-sprite.tsx`),
> crossfadé sur le Pio vectoriel v2, gaté tier full (G5). Décors bitmap (G4) : scènes hub
> 16:9 + portrait, 4 biomes, fond de carte — Higgsfield, DA verrouillée sur l'avatar.
> Complète `tasks/design.md` (qui reste la référence du produit global).

## 1. Résumé de compréhension

- Refonte complète de l'espace élève en **expérience de jeu** : hub vivant (le camp de Pio dans la savane) + carte-monde de progression + quêtes quotidiennes.
- Cible : élèves CE2-CM2 (8-10 ans), francophones (Sénégal), appareils hétérogènes (souvent Android entrée de gamme, data chère).
- Objectif : **wow à la première visite** (parents, démos) + **mécaniques de retour quotidien** (quêtes, série, Pio).
- La **session d'exercices reste sobre** (mode focus intact) — le jeu motive *entre* les exercices, pas *pendant*.
- 3D hybride : décors 2.5D pré-rendus (images IA) + **un seul vrai élément 3D (Pio, GLB)** chargé en lazy sur appareils capables, fallback Rive/image sinon.
- Perf : progressive enhancement, base < 1,5 Mo fonctionnelle partout.

## 2. Journal de décisions (brainstorm)

| # | Décision | Alternatives écartées | Pourquoi |
|---|----------|----------------------|----------|
| G1 | Métaphore : carte-monde (progression) + hub avec Pio (accueil) | Habillage simple des écrans actuels ; carte seule | Combine wow + boucle quotidienne |
| G2 | 3D hybride ciblé : 2.5D pré-rendu + Pio 3D unique avec fallback | Tout WebGL ; tout pré-rendu | Le wow du 3D sans le payer partout ; compatible bas de gamme |
| G3 | Session d'exercices exclue du reskin gaming | Session immersive avec HUD | Charge cognitive 8-10 ans ; la pédagogie prime |
| G4 | Assets 100 % générés par IA (images + GLB), DA verrouillée sur Pio existant | Designer humain ; asset packs | Itération rapide, zéro coût, cohérence par prompts |
| G5 | Progressive enhancement avec seuils stricts (< 1,5 Mo base) | Budget riche ; cible unique | Réalité terrain Sénégal ; personne n'a une expérience cassée |
| G6 | Succès = wow première visite + rétention quotidienne | Temps de session | Guide les arbitrages visuels et mécaniques |
| G7 | Quêtes quotidiennes en V1 ; PAS de monnaie/boutique | Monnaie + personnalisation Pio | YAGNI ; levier rétention le plus prouvé au moindre coût |
| G8 | Approche DOM-native (React/Tailwind/Framer) ; seul canvas = îlot Pio 3D (R3F) | Scène canvas unique ; tout Rive | A11y, SSR, budget perf, tests conservés ; plan B = PioRive |
| G9 | DA « savane de Pio » (baobabs, acacias, soleil chaud) | Île tropicale générique | Pio est un lionceau ; cohérence culturelle Sénégal |
| G4b | **Amendement G4** : monde en SVG vectoriel fait main (flat-cartoon), pas de bitmaps IA en V1 | Génération IA (bloquée : 0,56 crédit Higgsfield, plan free) ; achat de crédits (décision utilisateur) | SVG = 10-20 Ko/scène vs 150+ Ko, net partout, teintable, zéro requête ; Pio rendu 3D reste le héros contrasté ; upgrade bitmap possible plus tard sans refonte |
| G10 | Quêtes gatées par `parentSettings.dailyMissionEnabled` (pattern streaksEnabled : un parent à false ⇒ off) | Toggle élève | Champ déjà prévu au schéma ; cohérence D7/D84 |

## 3. Architecture & navigation

```
app/(student)/
  layout.tsx                    → coquille jeu : HUD haut + nav bas illustrée (Île, Carte, Trophées, Carnet)
  student/home                  → LE HUB (camp de Pio) — remplace l'accueil
  student/map                   → NOUVEAU : carte-monde (zones = matières, data-driven)
  student/map/[subjectId]       → NOUVEAU : chemin de niveaux (topics) d'une matière
  student/subjects/[id]         → redirect vers /student/map/[id]
  student/mascotte              → supprimée (absorbée par le hub)
  student/badges                → reskin « salle des trophées »
  student/profil                → reskin « carnet de l'aventurier »
  student/topics/[id]/session   → INCHANGÉE (mode focus)
  student/topics/[id]/complete  → reskin léger (célébration + progression de quêtes + retour carte)
```

Boucle de jeu : Hub (Pio + quêtes) → Carte (choisir/reprendre) → Session (sobre) → Complete (récompenses) → Carte/Hub.
Principes : chaque écran = vraie page Next (URL, back, deep-link) ; DOM sémantique ; `prefers-reduced-motion` respecté (D12) ; tap targets ≥ 44px (D15) ; cold start sans zéros (D8).

## 4. Le Hub — camp de Pio (savane)

- 3 plans : ciel/lumière en CSS (teinte jour/soir selon l'heure) → décor savane illustré (baobab, cabane, panneau) → Pio interactif au centre.
- Pio : îlot 3D R3F lazy (tier « full » uniquement) OU PioRive/image (fallback). Tap → réaction aléatoire (salut, danse) + son court ; 5 taps rapides → réaction secrète.
- Panneau de quêtes 📜 : 3 quêtes du jour + anneaux de progression ; complétée → coche + confetti + Pio applaudit.
- CTA principal « Continuer l'aventure » ▶ : reprend le dernier topic en cours (ou 1er niveau si cold start).
- Bulle de dialogue Pio : phrases contextuelles (streak en danger, quête presque finie, bienvenue).
- Cold start (D8) : une seule quête « Termine ton premier niveau », pas de compteurs à zéro.

## 5. La Carte — monde & matières

- `/student/map` : sentier vertical serpentin dans la savane ; zones = matières (données `subjects.list` + progression par matière). Zone : médaillon biome (4 fonds génériques cyclés par index, teintés par `subject.color`), nom, % progression, état (verrouillé si 0 exercice publié ? non — toutes accessibles, l'ordre est une suggestion).
- `/student/map/[subjectId]` : chemin de niveaux (topics) façon Candy Crush — nœuds SVG sur sentier, statuts `resolveTopicStatuses` (done ✓ / current ▶ / locked 🔒), étoiles par topic, tap current → session. Source : `getStudentSubjectMap` (existant).
- Layout algorithmique (positions % le long d'une courbe), AUCUNE illustration par matière → scalable à N matières.

## 6. Quêtes quotidiennes (Convex)

- Table `dailyQuests` : 1 ligne / (studentId, dayKey) avec 3 quêtes embarquées `[{ key, type, label, target, progress, completedAt? }]` + index `by_student_day`.
- Types V1 : `do_exercises` (N=5-8), `correct_answers` (N=3-6), `validate_palier` (1), `subject_exercises` (N sur une matière suggérée). Sélection déterministe seedée par (studentId, dayKey) — toujours 1 quête facile.
- Génération lazy : mutation idempotente `quests.ensureDaily` appelée au mount du hub ; query réactive `quests.getMyDaily`.
- Progression : internalMutation `quests.recordActivity` branchée au même endroit que `streak.recordKidActivity` (soumission d'exercice/palier).
- Récompense : +étoiles bonus → agrégat lifetime dans `profile.preferences.questBonusStars` (borné, 1 lecture), détail du jour dans la ligne `dailyQuests`. `getMyStats.totalStars` ajoute cet agrégat.
- Gating parent : `dailyMissionEnabled` (un parent explicitement false ⇒ off) ; hub masque le panneau.
- Fuseau : réutilise `todayYmd()`/`daysBetween()` de `convex/streak.ts` (cohérence avec la série).

## 7. Performance & progressive enhancement

- **Tiers d'appareil** (`lib/device-tier.ts` + hook) : `lite` si `saveData` OU `deviceMemory ≤ 2` OU `hardwareConcurrency ≤ 3` ; sinon `full`. 3D exige en plus WebGL2 OK. Décision mémorisée en sessionStorage.
- Base (tous) : décors en 1 image/écran max via `next/image` (AVIF/WebP auto, `sizes` responsive), SVG/CSS pour le reste, fonts déjà chargées (Fredoka). Budget initial < 1,5 Mo, LCP = décor hub prioritaire (`priority`).
- Enrichissements (tier full) : parallaxe Framer Motion, Pio 3D (R3F en `next/dynamic`, ssr:false, chargé après idle + intersection), sons (opt-in existant).
- `prefers-reduced-motion` coupe parallaxe/célébrations (MotionConfig existant).
- Images sources versionnées ≤ ~500 Ko chacune, 1600w max ; jamais plus de ~2 décors visibles par écran.
- Pio 3D : GLB cible < 2 Mo, draco si besoin ; jamais chargé sur tier lite ; fallback = PioRive (`/rive/pio.riv` absent ⇒ images existantes).

## 8. Pipeline assets (génération IA)

DA verrouillée : lionceau Pio existant (crinière orange, feuilles vertes, sacoche), palette chaude ambre/orange/vert, style 3D-cartoon doux, lumière dorée de savane.
1. `public/images/world/hub-savanna.png` — scène du camp (baobab + cabane + panneau), 1600w.
2. `public/images/world/map-trail.png` — fond sentier carte-monde, vertical, 1200w.
3. `public/images/world/biome-{1..4}.png` — médaillons biomes génériques (plaine, rivière, colline, forêt).
4. `public/images/world/quest-board.png` — panneau bois transparent.
5. `public/images/world/trophy-room.png` — fond salle des trophées (léger).
6. GLB Pio : généré image→3D depuis `pio/idle.png` (phase finale, plan B = Rive/images).

## 9. Tests & risques

- Vitest : logique quêtes (sélection déterministe, progression, gating parent) via `convex-test` ; helpers tiers d'appareil.
- Playwright : parcours hub → carte → session inchangée → complete ; redirects subjects→map ; a11y de la nav.
- Risques : (1) GLB IA indigne de Pio → plan B Rive acté ; (2) poids images → budget vérifié au build ; (3) régression e2e existants → mise à jour des specs concernées ; (4) quêtes = écriture à chaque soumission → internalMutation ciblée, patch unique.

## 10. Phasage

- **A. Backend quêtes** (schema + quests.ts + hooks activité + tests)
- **B. Coquille jeu** (layout : HUD + nav illustrée + tokens/styles partagés)
- **C. Assets IA** (génération, intégration `public/images/world/`)
- **D. Hub** (scène + Pio interactif Rive/image + quêtes + CTA continuer)
- **E. Carte** (monde + matière, redirects, suppression mascotte)
- **F. Reskins** (complete, badges, profil)
- **G. Perf & QA** (device tier, lazy, e2e, budget)
- **H. Pio 3D** (GLB + îlot R3F gaté — enhancement final, optionnel)
