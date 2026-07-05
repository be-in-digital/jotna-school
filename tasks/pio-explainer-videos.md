# Vidéos « Pio t'explique » — pipeline automatique

Chaque exercice reçoit une **vraie vidéo MP4** où Pio explique la solution au
tableau, avec sa voix. Visionnable dans la session après un échec (« Je veux
comprendre ») ou après une réussite (« Pio m'explique »).

## Pourquoi pas une API de vidéo IA (Higgsfield/Veo/Kling)

Mesuré le 2026-07-04 : 8 à 30 crédits **par clip de 10 s** → ~1,5 à 4,5 $ et
plusieurs minutes de rendu **par vidéo d'une minute**, texte au tableau
souvent illisible. Par exercice généré (milliers + régénérations), le coût est
insoutenable. Les crédits Higgsfield restent réservés à d'éventuels contenus
« héro » ponctuels.

## Architecture retenue (coût ~2-4 centimes/vidéo)

```
exercice inséré (paliers/index.ts)
  → explainMistake.pregenerateForExercise   (script pédagogique, gpt-4o-mini)
  → explainAudio.synthesizeAndAttach        (voix de Pio, OpenAI TTS « fable »)
  → [worker] scripts/render-explainer-videos.mjs
      Remotion (React → MP4 : tableau + poses de Pio + voix + sous-titre)
      → upload Convex storage → exerciseExplanations.video
  → lecteur : vidéo si dispo, sinon lecteur narré (audio segments), sinon
    voix du navigateur — l'enfant n'est jamais bloqué.
```

- Composition : `remotion/PioExplainer.tsx` (1280×720, 30 fps, Fredoka,
  identité savane/ambre, Pio ancré au sol, sous-titre de lecture).
- API worker côté Convex : `convex/explainVideo.ts`
  (`listPending` / `videoUploadUrl` / `attachVideo` / `videoUrl` / `clearVideo`).

## Rendu en prod : Remotion Lambda (sans worker)

`convex/explainRender.ts` rend les vidéos sur **Remotion Lambda** dès que les
5 variables `REMOTION_*` existent sur le déploiement Convex : audio prêt →
`requestRender` (claim anti-doublon `renderRequestedAt`) → `renderMediaOnLambda`
→ poll → MP4 téléchargé dans Convex storage → `attachVideo`. Sans ces
variables, `requestRender` est un no-op silencieux et le worker local reste le
moteur de rendu.

Mise en route (une fois) :

1. Console AWS → IAM → Users → `safeUser` → **Add permissions → Create inline
   policy → JSON** → coller `scripts/aws/safeuser-setup-policy.json`
   (= policy officielle Remotion + droits de créer `remotion-lambda-role`).
2. `node scripts/deploy-remotion-lambda.mjs` — crée le rôle, déploie la
   fonction, upload le site, configure les env Convex. Idempotent.
3. Après amélioration du template : relancer le script (re-upload du site)
   puis `clearVideo` sur les explications à re-rendre.

Licence Remotion : gratuite jusqu'à 3 personnes dans l'entreprise ; au-delà,
licence Company requise (s'applique aussi à Lambda).

## Ops (worker local — dev / fallback)

```bash
pnpm render:videos              # une passe (3 vidéos max)
pnpm render:videos --limit=10   # passe plus large
pnpm render:videos --loop       # daemon dev (poll 60 s)
pnpm video:studio               # prévisualiser/éditer la composition
```

Le worker a besoin de Node + Chrome (Remotion le télécharge) et des
credentials Convex du repo (`npx convex run`). Il ignore les explications
« claimées » par Lambda depuis < 15 min. Idempotent : `attachVideo` est
premier-arrivé-gagnant, une vidéo attachée sort de la file.

Pour re-rendre après une amélioration du template :
`npx convex run explainVideo:clearVideo '{"explanationId":"…"}'` puis une passe.

## Coût unitaire

| Brique | Coût |
|---|---|
| Script (gpt-4o-mini, 2000 tokens max) | ~0,02 ¢ |
| Voix (gpt-4o-mini-tts, ~7 segments) | ~1,3-3 ¢ |
| Rendu Remotion (local/CI) | ~0 (compute) |
| Stockage Convex (~4-5 Mo/vidéo) | inclus plan |

Payé **une fois par exercice**, servi à tous les élèves.
