# Pré-génération du palier 1 (anti-attente du premier enfant)

## Problème

Le palier d'une thématique est généré par IA **à la demande** (`paliers.getBucket`).
Le premier enfant qui ouvre une thématique jamais jouée attend donc ~30-60 s.
Critique au lancement CP/CI (beaucoup de nouveaux topics d'un coup via
`seedCurriculum`).

## Solution — `convex/pregenPaliers.ts`

On réchauffe le **palier 1** (point d'entrée obligatoire de chaque thématique)
à l'avance. Les paliers 2+ se débloquent au fil du jeu et se génèrent à la
demande — inutile de les pré-générer pour tout le monde.

- `palierNeedsGeneration(existing, now, includeExpired)` — helper pur (testé) :
  jamais généré → toujours ; stale/generating/expiré → seulement si
  `includeExpired`.
- `palier1BucketsToWarm` (internalQuery) — liste les buckets palier-1 manquants,
  filtrable par classe.
- `run` (action, CLI) — **script J0**, `includeExpired: true` (démarrage à
  froid). Planifie `getBucket` par bucket, étalé (`staggerMs`, défaut 1500 ms),
  tag `markPreGenerated`. Idempotent (cache hit si déjà frais).
- `weeklyWarmNewTopics` (internalAction) — **cron** lundi 04:00 UTC,
  `includeExpired: false` : ne réchauffe que les topics JAMAIS générés (couvre
  les ajouts profs/admin sans re-payer tout le catalogue chaque semaine ; les
  paliers expirés se refont à la demande, à l'usage réel).

`getBucket` gagne un arg optionnel `markPreGenerated` (pur tag télémétrie,
`paliers.preGenerated` — Decision 73 ; lu nulle part, sans effet sur la boucle
enfant). Le palier 1 n'a pas de garde d'auth → planifiable sans session.

## Utilisation

```bash
# Lancement (J0) — après le gros seed, réchauffe tout :
npx convex run pregenPaliers:run                        # toutes les classes
npx convex run pregenPaliers:run '{"classes":["CI","CP"]}'  # priorité lecteurs
npx convex run pregenPaliers:run '{"limit":3}'          # test à petit coût

# En prod :
npx convex run pregenPaliers:run --prod '{"classes":["CI","CP"]}'
```

## Coût & garde-fous

- ~1 génération IA par thématique (≈ 70 pour le curriculum complet). Le gateway
  IA applique ses plafonds de budget/quota (economyMode auto à 90 %).
- `limit` permet un test à faible coût avant la passe complète.
- Le cron ne coûte que pour les **nouveaux** topics (souvent zéro).

## Vérifié

325 tests (5 nouveaux sur le prédicat), tsc + lint OK. Sur dev : énumération
correcte (22 buckets CI+CP manquants), et une génération `limit:1` a bien
réchauffé un palier CP (compteur 12 → 11).
