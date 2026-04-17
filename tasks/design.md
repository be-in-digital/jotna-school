# Design — Application Educative Gamifiee (Managua)

## Resume

Application web educative gamifiee pour enfants de CE2-CM2 (8-10 ans), focus francophone/senegalais.
Exercices multi-matieres extraits de PDFs par IA (GPT-4), valides par un admin, organises par matiere puis thematique.
Interface ludique avec gamification (badges, trophees, progression).
Rapport detaille envoye aux parents/tuteurs a la fin de chaque thematique.

## Stack

- **Frontend** : Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript
- **State** : Zustand (pas de React Context)
- **Backend** : Convex (DB, fonctions serveur, temps reel, auth)
- **Emails** : Resend
- **IA** : OpenAI GPT-4 (Structured Outputs)
- **UI** : shadcn/ui + Framer Motion + @dnd-kit + canvas-confetti + Lucide React

## Modele de donnees

```
users (Convex Auth)

profiles
  userId, role ("admin"|"parent"|"student"), name, avatar, preferences

studentGuardians (N<->N)
  studentId -> profiles, guardianId -> profiles, relation ("parent"|"tuteur"|"professeur")

subjects
  name, icon, color, order

topics
  subjectId -> subjects, name, description, order

exercises
  topicId -> topics
  type ("qcm"|"drag-drop"|"match"|"order"|"short-answer")
  prompt, payload (union typee), answerKey, hints[]
  order, status ("draft"|"published"), version
  sourcePdfUploadId?, generatedBy ("ai"|"manual"), reviewedBy?, publishedAt?

attempts
  studentId, exerciseId, submittedAnswer, isCorrect
  attemptNumber, hintsUsedCount, timeSpentMs, submittedAt

studentTopicProgress
  studentId, topicId, completedExercises, correctExercises
  totalHintsUsed, masteryLevel, completedAt?

badges
  name, description, icon, condition, subjectId?

earnedBadges
  badgeId, studentId, earnedAt

pdfUploads
  adminId, storageId, originalFilename, mimeType, size
  subjectId, status ("uploaded"|"extracted"|"reviewed"|"published")
  extractedRaw, extractedAt?, reviewedAt?, publishedAt?

topicReports
  studentId, topicId, score, strengths[], weaknesses[]
  frequentMistakes[], emailSentAt?
```

## Architecture Convex

Organisation par domaine metier. Chaque fichier exporte queries, mutations, actions liees.

```
convex/
  schema.ts
  auth/config.ts
  profiles.ts
  subjects.ts
  topics.ts
  exercises.ts       (+ internalMutation createDrafts)
  attempts.ts        (scheduler -> badges.check, reports.generate)
  badges.ts          (internalMutation checkAndAward)
  pdfUploads.ts      (mutation create -> scheduler -> internalAction extract)
  reports.ts         (internalMutation generate -> internalAction sendEmail)
```

Flux cles :
- PDF: mutation create -> scheduler -> internalAction extract -> internalMutation createDrafts
- Reponse: mutation submit -> update progress -> scheduler -> badges + reports
- Rapport: internalMutation generate -> scheduler -> internalAction sendEmail -> internalMutation markEmailSent

## Structure des pages

```
app/
  (auth)/login, register
  (admin)/dashboard, subjects/[id]/topics/[topicId]/edit, pdf-uploads/[id], exercises/drafts|[id]/edit|published, badges, students
  (student)/home, subjects/[id], topics/[id]/session|complete, exercises/[id], badges, profile
  (parent)/dashboard, children/add|[id]/edit|progress|reports/[topicId], settings
```

## Gamification

- Barre de progression thematique (vert -> dore)
- Badges/trophees par thematique et par matiere
- Animation unlock spectaculaire (confettis, rebond)
- Ecran de fin: score etoiles, stats, badge, bouton revoir erreurs
- Accueil gamifie: cartes colorees, dernier badge, message encourageant

## Composants d'exercices

ExercisePlayer (orchestrateur) avec composants par type :
QcmExercise, DragDropExercise, MatchExercise, OrderExercise, ShortAnswerExercise

Feedback: confettis si correct, shake + encouragement si incorrect, indices progressifs.

## Securite

- Admin: tout
- Parent: ses enfants uniquement (via studentGuardians)
- Student: contenu publie, ses propres tentatives/badges, jamais les answerKey

## Decision Log

1. Monolithe modulaire > apps separees (usage familial, simplicite)
2. Convex pour tout (DB + auth + temps reel + scheduler)
3. Organisation par domaine > par type de fonction
4. Scheduler pour traitements lourds (extraction IA, emails)
5. Structured Outputs OpenAI > prompt JSON libre
6. Internal mutations pour ecritures depuis actions
7. Preview integree dans editeur > route separee
8. storageId Convex > fileUrl pour les PDFs
9. Table unique exercises avec status/version > tables separees drafts/published
10. studentGuardians N<->N > simple parentId
