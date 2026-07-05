/**
 * Palier prompts — pure module.
 *
 * Three prompt families:
 *   - palier_base       : 10-exercise mega-prompt for a (subject, class, topic, palierIndex)
 *   - palier_personalized: "J'en veux encore" — focused on weaknesses
 *   - palier_variation  : regen of failed exercises — same concept, new context
 *
 * Senegalese cultural anchoring (Decision §6.2 — S2):
 *   prénoms locaux, FCFA, lieux SN, aliments locaux. NEVER €/$.
 *
 * Decision 71: for math, the model MUST emit a `mathExpression` field per
 * numeric exo so the gateway's factCheck.ts can verify the answer.
 */

import type { AiPurpose } from "../aiGateway/registry";
import type { ClassLevel } from "../classes";

export type { ClassLevel };

export interface PalierBasePromptInput {
  subject: string; // e.g. "Mathématiques"
  topic: string; // e.g. "Fractions"
  topicDescription?: string; // précision pédagogique du topic (seedCurriculum)
  class: ClassLevel;
  palierIndex: number; // 1..10
}

export interface PersonalizedPromptInput extends PalierBasePromptInput {
  weaknesses: string[];
  frequentMistakes: string[];
}

export interface VariationPromptInput {
  class: ClassLevel;
  failed: Array<{
    concept: string; // pedagogical concept tag
    statement: string;
    correctAnswer: string;
    studentAnswer: string;
  }>;
  subject: string;
  topic: string;
}

const SENEGAL_ANCHOR = `\nANCRAGE CULTUREL OBLIGATOIRE (impératif) :
- Prénoms sénégalais : Aïssatou, Modou, Fatou, Cheikh, Aminata, Ousmane, Mariama, Ibrahima, Awa, Penda, Mame, Khady.
- Monnaie : exclusivement FCFA. JAMAIS d'euros, dollars, centimes européens.
- Lieux : marché Sandaga, Dakar, Thiès, Saint-Louis, Casamance, Touba, Mbour, Kaolack, Ziguinchor.
- Aliments : mangue, mil, arachide, thiéboudienne, yassa, mafé, bissap, lait caillé, ngalakh, fonio.
- Mode de vie : famille élargie, école sénégalaise, marché, cour de récréation locale.
- Pas de neige, pas de châteaux européens, pas de dollars.`;

const TYPES_LIST = `qcm, drag-drop, match, order, short-answer`;

const HINTS_RULE = `
- 3 indices progressifs : le 1er = relire l'énoncé / observer ;
  le 2e = méthode pédagogique ; le 3e = quasi-réponse mais sans la donner.`;

const DIFFICULTY_NOTE = (palierIndex: number) =>
  `\nNiveau global du palier ${palierIndex}/10 : ${
    palierIndex <= 3
      ? "découverte (notions de base, peu d'étapes)."
      : palierIndex <= 6
        ? "consolidation (combinaison de plusieurs notions vues)."
        : palierIndex <= 9
          ? "approfondissement (problèmes en plusieurs étapes)."
          : "challenge / maîtrise (exercices complets, ouverture)."
  }
Difficulté progressive INTRA-palier : exos 1-3 = facile, 4-7 = moyen, 8-10 = challenge.`;

const ageForClass = (cls: ClassLevel): string => {
  switch (cls) {
    case "CI":
      return "5-6 ans";
    case "CP":
      return "6-7 ans";
    case "CE1":
      return "7-8 ans";
    case "CE2":
      return "8-9 ans";
    case "CM1":
      return "9-10 ans";
    case "CM2":
      return "10-11 ans";
  }
};

const MATH_OUTPUT_RULES = `
[Output structuré pour les Maths]
Pour chaque exercice numérique, INCLUS un champ "mathExpression" qui contient
l'expression arithmétique parseable (exemples : "53 - 27", "(3/4) + (1/2)", "2 × 7").
Cette expression sert à vérifier ta réponse automatiquement.
Si l'exercice n'est pas réductible à une expression simple (problème verbal complexe),
écris "mathExpression": null — un humain validera.`;

/**
 * CI/CP — l'enfant apprend tout juste à lire. Les consignes sont lues à voix
 * haute par l'appli, mais l'exercice lui-même doit travailler le code écrit
 * (lettres, sons, syllabes, mots) quand la matière est le Français.
 */
const isEarlyReaderClass = (cls: ClassLevel): boolean =>
  cls === "CI" || cls === "CP";

const isFrenchSubject = (subject: string): boolean => {
  const s = subject.toLowerCase();
  return s.includes("français") || s.includes("francais") || s.includes("lecture");
};

const earlyReaderNote = (cls: ClassLevel, subject: string): string => {
  const base = `
[Lecteurs débutants — ${cls}]
- Cet enfant APPREND À LIRE : consignes de 3 à 8 mots maximum, vocabulaire très simple.
- Une consigne = une seule action. L'application lit les consignes à voix haute.
- Jamais de texte long dans l'énoncé ; les options doivent être courtes (une lettre, une syllabe ou un mot).`;
  if (!isFrenchSubject(subject)) {
    return `${base}
- Situations très concrètes avec de petits nombres et des objets familiers.`;
  }
  return `${base}
- Les exercices travaillent la LECTURE et l'ÉCRITURE :
  * reconnaître une lettre, associer majuscule et minuscule (type "match" : A↔a) ;
  * retrouver le son entendu dans un mot (type "qcm" : quel mot contient « ou » ?) ;
  * remettre des syllabes dans l'ordre pour former un mot (type "order" : ma-man, vé-lo) ;
  * classer des mots selon leur son (type "drag-drop") ;
  * écrire un mot simple ou compléter la lettre manquante (type "short-answer" : m_to → moto).
- Mots courts, réguliers et familiers au Sénégal : mama, papa, moto, sac, riz, vélo, mangue, banane.
- ${cls === "CI" ? "CI : lettres, voyelles et syllabes simples uniquement — pas de sons complexes." : "CP : syllabes, mots simples, sons complexes courants (ou, oi, on, an, en) et petites phrases."}`;
};

const JSON_SHAPE = `
[Format JSON STRICT — réponds UNIQUEMENT avec ce JSON, sans texte avant/après]
{
  "exercises": [
    {
      "type": "qcm" | "drag-drop" | "match" | "order" | "short-answer",
      "statement": "énoncé clair, court, kid-friendly",
      "payload": { ... shape selon le type ... },
      "correctAnswer": "réponse canonique sous forme texte",
      "mathExpression": "53 - 27" | null,
      "concept": "tag pédagogique court (ex: 'soustraction avec retenue')",
      "hints": ["indice1", "indice2", "indice3"]
    }
    // ... 10 items au total
  ]
}

Schémas de payload :
  qcm        -> { "options": string[], "correctIndex": number, "explanation"?: string }
  match      -> { "pairs": [ { "left": string, "right": string } ] }
  order      -> { "correctSequence": string[] }
  drag-drop  -> { "zones": string[], "items": [ { "text": string, "correctZone": string } ] }
  short-answer -> { "acceptedAnswers": string[], "tolerance"?: string }`;

export function buildPalierBaseSystemPrompt(input: PalierBasePromptInput): string {
  const age = ageForClass(input.class);
  const isMaths = isMathSubject(input.subject);
  return `Tu es un professeur expérimenté du programme officiel élémentaire sénégalais.
Tu génères des exercices pour des enfants de classe ${input.class} (${age}).
Inspiré du programme officiel sénégalais (élémentaire).
${SENEGAL_ANCHOR}

[Contraintes pédagogiques]
- Pas de notions hors programme ${input.class} (ex: pas de fractions en CE1).
- Texte adapté à l'âge (${age}), phrases courtes, vocabulaire concret.
- Pas de question à pièges méchants ; bienveillance toujours.
- Au moins 3 types d'exos différents dans le palier (Decision 63).
${HINTS_RULE}
${isEarlyReaderClass(input.class) ? earlyReaderNote(input.class, input.subject) : ""}
${isMaths ? MATH_OUTPUT_RULES : ""}`;
}

export function buildPalierBasePrompt(input: PalierBasePromptInput): string {
  const topicDetail = input.topicDescription
    ? `\nCe que ce thème travaille précisément : ${input.topicDescription}`
    : "";
  return `[Tâche]
Génère 10 exercices pour la matière "${input.subject}", thème "${input.topic}",
palier ${input.palierIndex}/10, classe ${input.class}.${topicDetail}

Types autorisés : ${TYPES_LIST}.
${DIFFICULTY_NOTE(input.palierIndex)}

${JSON_SHAPE}`;
}

export function buildPersonalizedSystemPrompt(input: PersonalizedPromptInput): string {
  return buildPalierBaseSystemPrompt(input);
}

export function buildPersonalizedPrompt(input: PersonalizedPromptInput): string {
  const weaknessesBlock =
    input.weaknesses.length > 0
      ? `\n[Faiblesses identifiées]\n- ${input.weaknesses.join("\n- ")}`
      : "";
  const mistakesBlock =
    input.frequentMistakes.length > 0
      ? `\n[Erreurs fréquentes]\n- ${input.frequentMistakes.join("\n- ")}`
      : "";
  return `[Tâche — "J'en veux encore" personnalisé]
Cet enfant veut faire 10 exercices supplémentaires sur le thème "${input.topic}"
(matière "${input.subject}", classe ${input.class}, palier ${input.palierIndex}/10).
Cible spécifiquement ce qui pose problème à cet enfant — il a déjà fait le palier de base.
${weaknessesBlock}${mistakesBlock}

Types autorisés : ${TYPES_LIST}.
${DIFFICULTY_NOTE(input.palierIndex)}

${JSON_SHAPE}`;
}

export function buildVariationSystemPrompt(input: VariationPromptInput): string {
  return `Tu es un professeur expérimenté du programme officiel élémentaire sénégalais.
Tu génères des VARIATIONS d'exercices que l'enfant a ratés, pour qu'il puisse réessayer.
Classe : ${input.class}.
Inspiré du programme officiel sénégalais.
${SENEGAL_ANCHOR}

[Règles VARIATION]
- Garde le MÊME concept pédagogique que l'original (addition à retenue, accord du verbe, etc.).
- Change : la formulation, les noms, les chiffres, le contexte (mais reste sénégalais).
- Reste au même niveau de difficulté.
- Évite spécifiquement le piège qui a fait rater l'enfant — voir ses erreurs.
${HINTS_RULE}
${isEarlyReaderClass(input.class) ? earlyReaderNote(input.class, input.subject) : ""}
${isMathSubject(input.subject) ? MATH_OUTPUT_RULES : ""}`;
}

export function buildVariationPrompt(input: VariationPromptInput): string {
  const failedBlock = input.failed
    .map(
      (f, i) =>
        `${i + 1}. Concept : "${f.concept}"\n   Énoncé : "${f.statement}"\n   Bonne réponse : "${f.correctAnswer}"\n   Réponse de l'enfant : "${f.studentAnswer}"`,
    )
    .join("\n\n");
  return `[Tâche]
Voici ${input.failed.length} exercice(s) que l'enfant a raté(s) sur le thème "${input.topic}".
Pour chacun, génère UNE VARIATION qui force la même technique mais change le contexte.

[Exercices ratés]
${failedBlock}

Types autorisés : ${TYPES_LIST}.

${JSON_SHAPE.replace(
  "// ... 10 items au total",
  `// EXACTEMENT ${input.failed.length} variations, dans le même ordre que les exos ratés.`,
)}`;
}

function isMathSubject(subject: string): boolean {
  const s = subject.toLowerCase();
  return s.startsWith("math") || s.includes("calcul") || s.includes("arithm");
}

// Re-export for callers that pre-resolve purpose
export type { AiPurpose };
