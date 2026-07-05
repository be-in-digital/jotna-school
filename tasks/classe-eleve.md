# Classe de l'élève — inscription, adaptation des exercices, suivi de scolarité

## Problème

Les élèves s'inscrivaient sans indiquer leur classe : la carte montrait les
thématiques de toutes les classes mélangées, et rien ne suivait l'élève d'une
année sur l'autre. Par ailleurs il n'existait aucun contenu CI/CP — or à cet
âge le programme, c'est apprendre à lire et à écrire.

## Décisions

- **C1 — La classe vit sur le profil** (`profiles.class` + `profiles.classSchoolYear`).
  Énum canonique dans `convex/classes.ts` (partagé backend/frontend) :
  CI, CP, CE1, CE2, CM1, CM2.
- **C2 — Demandée à l'inscription** (`/register`, select obligatoire quand
  rôle = élève, passée via les params `signIn` comme le rôle) et à l'ajout
  d'enfant côté parent (`createChildAccount({ class })`).
- **C3 — ClassGate élève** (`components/student/class-gate.tsx`, monté dans le
  layout hors mode focus) :
  - classe absente (comptes d'avant la fonctionnalité) → sélecteur plein
    écran bloquant ;
  - `classSchoolYear` ≠ année scolaire courante → modal « C'est la
    rentrée ! » proposant le passage dans la classe suivante (un tap).
    C'est le suivi de scolarité. CM2 reste CM2 (fin du cycle).
- **C4 — Année scolaire sénégalaise** : bascule au 1er octobre, fuseau
  Africa/Dakar (= UTC, même convention que streak). `schoolYearOf()` /
  `currentSchoolYear()` dans `convex/classes.ts`.
- **C5 — Filtrage par classe** : `getMyWorldMap` et `getStudentSubjectMap`
  ne renvoient que les topics de la classe de l'élève (index
  `by_subjectId_class`) ; zones vides masquées ; `getMyResumeTarget` ignore
  les paliers d'une ancienne classe. Élève sans classe → comportement legacy
  (tout), le gate la réclame de toute façon.
- **C6 — Curriculum seedé** : `convex/seedCurriculum.ts` (idempotent,
  `npx convex run seedCurriculum:seedAll`) — 70 thématiques Français +
  Mathématiques pour les 6 classes, alignées sur le programme élémentaire
  sénégalais. Le Français CI/CP est entièrement lecture-écriture : lettres,
  sons, syllabes, premiers mots, phrases, copie/dictée.
- **C7 — Lecteurs débutants (CI/CP)** :
  - prompts IA (`paliers/prompts.ts`) : bloc spécial — consignes de 3 à 8
    mots, une action par consigne, et pour le Français des exercices de
    lecture-écriture (match majuscule/minuscule, qcm de sons, order de
    syllabes, dictée en short-answer) avec mots sénégalais familiers ;
  - la description du topic est injectée dans le prompt de génération
    (`topicDescription`) pour cibler précisément la compétence ;
  - en session, `setEarlyReaderMode` (lib/tts) active l'auto-lecture de
    chaque consigne + une pastille « Écouter » visible (ExercisePrompt) —
    un enfant de CP ne sait pas encore lire la consigne.
- **C9 — Voix de Pio sur les consignes** : chaque consigne est pré-synthétisée
  en MP3 (OpenAI TTS, voix « fable », mêmes primitives que « Pio t'explique »
  — `convex/promptAudio.ts`), payée une fois par exercice et servie à tous.
  Déclencheurs : insertion des exos générés, variations de regen, et
  rattrapage au `startPalierAttempt` pour les paliers déjà en cache (claim
  15 min anti-doublon sur l'exercice). `getExercisesForPalier` renvoie
  `promptAudioUrl` ; côté client `lib/tts.speak()` consulte un registre
  consigne→MP3 et ne retombe sur la voix du navigateur que si le MP3 manque
  ou échoue. Tous les appelants (bouton 🔊, auto-lecture CI/CP) profitent de
  la voix de Pio sans changement d'API.
- **C8 — Édition** : parents (cartes enfants, select inline via
  `setStudentClass` — autorisé : élève lui-même, tuteur lié, admin) ; admin
  (formulaires topic création/édition + badge classe, `topics.create/update`
  acceptent `class`).

## Non couvert (volontairement)

- Passage CM2 → 6e (hors périmètre élémentaire).
- Re-proposition automatique en cours d'année si l'élève s'est trompé de
  classe (le parent peut corriger à tout moment).
- Voix de Pio sur les indices (3 indices × 10 exos — quadruplerait le coût
  TTS ; l'infra `promptAudio` est prête à être étendue si besoin).
