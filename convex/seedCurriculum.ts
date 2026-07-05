/**
 * Seed curriculum — thématiques Français + Mathématiques pour les 6 classes
 * de l'élémentaire sénégalais (CI → CM2).
 *
 * Idempotent : ne recrée jamais une thématique existante (même nom + même
 * classe dans la matière). Relançable sans risque :
 *   npx convex run seedCurriculum:seedAll
 *
 * Les exercices eux-mêmes sont générés par palier (IA) à partir du nom et
 * de la description du topic — les libellés ci-dessous sont donc rédigés
 * comme des consignes pédagogiques précises, pas comme de simples titres.
 *
 * CI et CP : le Français est entièrement centré sur l'APPRENTISSAGE DE LA
 * LECTURE ET DE L'ÉCRITURE (lettres, sons, syllabes, premiers mots, dictée)
 * — c'est le cœur du programme à cet âge.
 */

import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { ClassLevel } from "./classes";
import { CLASS_LEVELS } from "./classes";

type TopicSeed = { name: string; description: string };

type SubjectSeed = {
  name: string;
  icon: string;
  color: string;
  order: number;
  topics: Partial<Record<ClassLevel, TopicSeed[]>>;
};

const FRANCAIS: SubjectSeed = {
  name: "Français",
  icon: "Book",
  color: "#db2777",
  order: 2,
  topics: {
    // ----------------------------------------------------------------- CI
    // Cours d'initiation (5-6 ans) — première année : découverte du code
    // écrit. Tout passe par l'oral et la reconnaissance visuelle.
    CI: [
      {
        name: "Les lettres de l'alphabet",
        description:
          "Reconnaître les lettres de l'alphabet en majuscule et en minuscule, associer une majuscule à sa minuscule (A↔a), retrouver une lettre dans un mot.",
      },
      {
        name: "Les voyelles et leurs sons",
        description:
          "Entendre et reconnaître les sons des voyelles a, e, i, o, u dans des mots simples du quotidien (mangue, moto, sac) ; trouver le mot qui contient le son demandé.",
      },
      {
        name: "Mes premières syllabes",
        description:
          "Assembler une consonne et une voyelle pour former une syllabe (ma, pa, la, mi, lo) et reconnaître une syllabe entendue au début d'un mot.",
      },
      {
        name: "Je reconnais des mots",
        description:
          "Reconnaître globalement des mots très simples et fréquents (mama, papa, moto, sac, riz), associer deux mots identiques, retrouver un mot parmi des intrus proches.",
      },
      {
        name: "J'écris mes premières lettres",
        description:
          "Copier des lettres et des syllabes simples, compléter un mot à trous avec la bonne lettre (m_to → moto), écrire une syllabe dictée.",
      },
    ],
    // ----------------------------------------------------------------- CP
    // Cours préparatoire (6-7 ans) — l'année où l'on apprend à lire et à
    // écrire : combinatoire complète, premiers textes, première dictée.
    CP: [
      {
        name: "Les sons simples (a, i, o, u, é, e)",
        description:
          "Reconnaître les sons voyelles dans les mots, distinguer deux sons proches (é/è, o/ou), trouver la voyelle qui manque dans un mot simple.",
      },
      {
        name: "Les sons des consonnes (m, l, s, r, t, p)",
        description:
          "Associer chaque consonne à son son, trouver le mot qui commence par le son demandé (m → mangue), compléter un mot avec la bonne consonne.",
      },
      {
        name: "Lire des syllabes et des mots",
        description:
          "Combiner consonnes et voyelles pour lire des syllabes (sa, lo, ri, mé), remettre des syllabes dans l'ordre pour former un mot (ma-man, vé-lo, mo-to), lire des mots simples de la vie sénégalaise.",
      },
      {
        name: "Les sons complexes (ou, oi, on, an, en)",
        description:
          "Reconnaître les sons composés de deux lettres dans des mots simples (mouton, poisson, maison), choisir la bonne graphie du son entendu.",
      },
      {
        name: "Lire des phrases simples",
        description:
          "Lire et comprendre des phrases très courtes de la vie quotidienne sénégalaise (Fatou mange une mangue.), remettre les mots d'une phrase dans l'ordre, associer une phrase à sa situation.",
      },
      {
        name: "Écrire des mots et des petites phrases",
        description:
          "Copier des mots sans erreur, écrire un mot simple dicté (sac, moto, mangue), compléter une phrase à trous, écrire une petite phrase avec majuscule et point.",
      },
    ],
    // ---------------------------------------------------------------- CE1
    CE1: [
      {
        name: "La phrase : majuscule et point",
        description:
          "Reconnaître une phrase correcte, remettre les mots dans l'ordre, placer la majuscule et le point, distinguer phrase et suite de mots.",
      },
      {
        name: "Le nom et le déterminant",
        description:
          "Identifier les noms (personnes, animaux, choses) et les petits mots qui les accompagnent (le, la, les, un, une, des) ; accorder le déterminant au nom.",
      },
      {
        name: "Le verbe et son sujet",
        description:
          "Trouver le verbe (l'action) et son sujet dans une phrase simple, conjuguer les verbes courants au présent avec je, tu, il/elle.",
      },
      {
        name: "Le singulier et le pluriel",
        description:
          "Passer un nom du singulier au pluriel (ajout du s, mots en -ou/-eau), accorder le déterminant et le nom en nombre.",
      },
      {
        name: "Lire et comprendre un petit texte",
        description:
          "Lire un texte de 3 à 5 phrases sur la vie quotidienne sénégalaise et répondre à des questions simples : qui, quoi, où, quand.",
      },
      {
        name: "Copie et dictée de phrases",
        description:
          "Écrire sans erreur des phrases courtes dictées, avec majuscule, point et mots fréquents bien orthographiés.",
      },
    ],
    // ---------------------------------------------------------------- CE2
    CE2: [
      {
        name: "La phrase et la ponctuation",
        description:
          "Utiliser le point, la virgule, le point d'interrogation et d'exclamation ; distinguer phrase déclarative et interrogative.",
      },
      {
        name: "Le présent des verbes du 1er groupe",
        description:
          "Conjuguer au présent les verbes en -er (chanter, jouer, manger) à toutes les personnes, repérer les terminaisons.",
      },
      {
        name: "Le nom : genre et nombre",
        description:
          "Distinguer masculin/féminin et singulier/pluriel, accorder déterminant + nom + adjectif dans le groupe nominal.",
      },
      {
        name: "L'adjectif qualificatif",
        description:
          "Identifier l'adjectif, l'accorder avec le nom, enrichir une phrase avec des adjectifs adaptés.",
      },
      {
        name: "Lire et comprendre un texte",
        description:
          "Lire un court récit ancré dans la vie sénégalaise et répondre à des questions de compréhension : personnages, lieux, ordre des événements.",
      },
      {
        name: "Vocabulaire de la vie courante",
        description:
          "Classer des mots par famille et par thème (marché, école, famille), trouver des synonymes et des contraires simples.",
      },
    ],
    // ---------------------------------------------------------------- CM1
    CM1: [
      {
        name: "Le présent, le futur et l'imparfait",
        description:
          "Conjuguer les verbes des 1er et 2e groupes et les auxiliaires être/avoir au présent, au futur simple et à l'imparfait ; choisir le temps qui convient.",
      },
      {
        name: "L'accord sujet-verbe",
        description:
          "Accorder le verbe avec son sujet même éloigné ou inversé, repérer les sujets multiples.",
      },
      {
        name: "Les compléments du verbe",
        description:
          "Identifier le COD et le COI dans une phrase, enrichir une phrase avec des compléments de lieu et de temps.",
      },
      {
        name: "Les homophones (a/à, et/est, on/ont)",
        description:
          "Choisir le bon homophone grammatical dans une phrase et justifier par une astuce de remplacement.",
      },
      {
        name: "Compréhension de texte",
        description:
          "Lire un texte narratif ou documentaire d'une dizaine de lignes (contexte sénégalais) et répondre à des questions littérales et d'inférence simple.",
      },
      {
        name: "Vocabulaire et familles de mots",
        description:
          "Construire des familles de mots (préfixes, suffixes), utiliser le contexte pour deviner le sens d'un mot inconnu.",
      },
    ],
    // ---------------------------------------------------------------- CM2
    CM2: [
      {
        name: "Le passé composé et l'imparfait",
        description:
          "Conjuguer au passé composé avec être et avoir (accord du participe passé avec être), distinguer l'usage de l'imparfait et du passé composé dans un récit.",
      },
      {
        name: "Les accords dans le groupe nominal",
        description:
          "Accorder en genre et en nombre déterminant, nom et adjectifs, y compris les pluriels particuliers (-al/-aux, -eau/-eaux).",
      },
      {
        name: "La phrase complexe",
        description:
          "Distinguer phrase simple et phrase complexe, repérer les propositions, utiliser les conjonctions (mais, car, donc, parce que).",
      },
      {
        name: "Les homophones grammaticaux",
        description:
          "Maîtriser ses/ces, la/là, ou/où, leur/leurs, quel(s)/quelle(s) dans des phrases du quotidien.",
      },
      {
        name: "Compréhension fine de textes",
        description:
          "Lire des textes variés (récit, article, recette) et répondre à des questions d'inférence : intentions des personnages, informations implicites, idée principale.",
      },
      {
        name: "Rédaction : raconter et décrire",
        description:
          "Organiser un petit texte en phrases cohérentes : choisir la phrase qui complète le récit, remettre un paragraphe dans l'ordre, corriger des répétitions. Préparation à l'entrée en 6e.",
      },
    ],
  },
};

const MATHS: SubjectSeed = {
  name: "Mathématiques",
  icon: "Calculator",
  color: "#4f46e5",
  order: 1,
  topics: {
    // ----------------------------------------------------------------- CI
    CI: [
      {
        name: "Compter jusqu'à 20",
        description:
          "Compter des objets du quotidien (mangues, billes, cauris) jusqu'à 20, lire et reconnaître les nombres, compléter une suite de nombres.",
      },
      {
        name: "Comparer des quantités",
        description:
          "Dire où il y a plus, moins ou autant d'objets ; ranger de petites quantités de la plus petite à la plus grande (nombres jusqu'à 20).",
      },
      {
        name: "Les formes : rond, carré, triangle",
        description:
          "Reconnaître et nommer le rond, le carré, le triangle et le rectangle dans les objets de tous les jours.",
      },
      {
        name: "Ajouter et enlever (jusqu'à 10)",
        description:
          "Petites additions et soustractions imagées avec des objets (2 mangues + 1 mangue), sans retenue, nombres jusqu'à 10.",
      },
      {
        name: "Se repérer dans l'espace",
        description:
          "Utiliser devant/derrière, dessus/dessous, gauche/droite, premier/dernier dans des situations concrètes.",
      },
    ],
    // ----------------------------------------------------------------- CP
    CP: [
      {
        name: "Les nombres jusqu'à 100",
        description:
          "Lire, écrire et ranger les nombres jusqu'à 100 ; dizaines et unités ; compter de 2 en 2, de 5 en 5, de 10 en 10.",
      },
      {
        name: "L'addition (jusqu'à 100)",
        description:
          "Additionner deux nombres sans puis avec retenue simple, compléments à 10, petits problèmes d'achat au marché en FCFA.",
      },
      {
        name: "La soustraction",
        description:
          "Soustraire de petits nombres (sans retenue), situations concrètes : ce qui reste, ce qui manque.",
      },
      {
        name: "Comparer et ranger les nombres",
        description:
          "Comparer deux nombres (plus grand, plus petit, égal), ranger des nombres, encadrer un nombre entre deux dizaines.",
      },
      {
        name: "Les formes et les tailles",
        description:
          "Reconnaître carré, rectangle, triangle, cercle ; comparer des longueurs et des tailles (plus long, plus court).",
      },
      {
        name: "Petits problèmes du quotidien",
        description:
          "Résoudre des problèmes simples en une étape avec des objets familiers (billes, mangues, pièces de FCFA).",
      },
    ],
    // ---------------------------------------------------------------- CE1
    CE1: [
      {
        name: "Les nombres jusqu'à 1 000",
        description:
          "Lire, écrire, décomposer (centaines, dizaines, unités), comparer et ranger les nombres jusqu'à 1 000.",
      },
      {
        name: "L'addition posée avec retenue",
        description:
          "Poser et calculer des additions à 2 ou 3 chiffres avec retenue, vérifier l'ordre de grandeur.",
      },
      {
        name: "La soustraction posée",
        description:
          "Poser et calculer des soustractions avec et sans retenue, situations de différence et de reste.",
      },
      {
        name: "Les tables de multiplication (2, 3, 4, 5)",
        description:
          "Mémoriser les premières tables, calculer des doubles et des moitiés, situations de groupements.",
      },
      {
        name: "La monnaie : le franc CFA",
        description:
          "Reconnaître les pièces et billets en FCFA, payer un achat, rendre la monnaie sur des petites sommes.",
      },
      {
        name: "Lire l'heure et mesurer",
        description:
          "Lire l'heure juste et la demi-heure, mesurer des longueurs en cm, comparer des durées simples.",
      },
    ],
    // ---------------------------------------------------------------- CE2
    CE2: [
      {
        name: "Les nombres jusqu'à 10 000",
        description:
          "Lire, écrire, décomposer, comparer et encadrer les nombres jusqu'à 10 000.",
      },
      {
        name: "La multiplication posée",
        description:
          "Toutes les tables jusqu'à 9, multiplication posée à 1 chiffre au multiplicateur, ordre de grandeur.",
      },
      {
        name: "La division : partages",
        description:
          "Situations de partage équitable et de groupement, division avec reste par un petit nombre.",
      },
      {
        name: "Les fractions simples",
        description:
          "Découvrir les fractions usuelles (1/2, 1/3, 1/4) par le partage d'objets et de figures, comparer des fractions simples.",
      },
      {
        name: "Périmètres et longueurs",
        description:
          "Mesurer et convertir des longueurs (m, cm, km), calculer le périmètre du carré et du rectangle.",
      },
      {
        name: "Problèmes de la vie courante",
        description:
          "Résoudre des problèmes à une ou deux étapes : achats au marché en FCFA, récoltes, distances entre villes du Sénégal.",
      },
    ],
    // ---------------------------------------------------------------- CM1
    CM1: [
      {
        name: "Les grands nombres",
        description:
          "Lire, écrire, comparer et décomposer les nombres jusqu'au million ; placer sur une droite graduée.",
      },
      {
        name: "La multiplication à 2 chiffres",
        description:
          "Poser et calculer des multiplications avec un multiplicateur à 2 chiffres, estimer un ordre de grandeur.",
      },
      {
        name: "La division posée",
        description:
          "Diviser par un nombre à 1 chiffre (quotient et reste), vérifier avec la multiplication.",
      },
      {
        name: "Fractions et nombres décimaux",
        description:
          "Passer des fractions décimales aux nombres à virgule, comparer et ranger des décimaux simples, les placer sur une droite.",
      },
      {
        name: "Aires et périmètres",
        description:
          "Distinguer aire et périmètre, calculer l'aire du carré et du rectangle en unités simples.",
      },
      {
        name: "Problèmes à plusieurs étapes",
        description:
          "Résoudre des problèmes combinant plusieurs opérations : achats et budget en FCFA, transports, quantités de récolte.",
      },
    ],
    // ---------------------------------------------------------------- CM2
    CM2: [
      {
        name: "Les nombres décimaux : 4 opérations",
        description:
          "Additionner, soustraire, multiplier des décimaux ; diviser un décimal par un entier ; situations de mesure et de monnaie.",
      },
      {
        name: "La proportionnalité",
        description:
          "Reconnaître une situation proportionnelle, compléter un tableau de proportionnalité, règle de trois sur des situations concrètes (recettes, prix au kilo).",
      },
      {
        name: "Les fractions : calculs",
        description:
          "Comparer, ranger et additionner des fractions de même dénominateur, prendre la fraction d'une quantité.",
      },
      {
        name: "Aires, volumes et mesures",
        description:
          "Calculer aires (carré, rectangle, triangle) et volumes simples (pavé), convertir les unités de mesure usuelles.",
      },
      {
        name: "Les pourcentages",
        description:
          "Comprendre et calculer des pourcentages simples (50 %, 25 %, 10 %) dans des situations de réduction et de partage.",
      },
      {
        name: "Problèmes complexes (vers la 6e)",
        description:
          "Résoudre des problèmes à étapes mêlant opérations, mesures et proportionnalité — préparation à l'entrée en 6e et au CFEE.",
      },
    ],
  },
};

const CURRICULUM: SubjectSeed[] = [MATHS, FRANCAIS];

/**
 * Seed idempotent de tout le curriculum. Chaque topic reçoit un `order`
 * égal à (index de classe × 100) + position, si bien que la piste de chaque
 * classe reste ordonnée quelle que soit la classe filtrée.
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSubjects = await ctx.db.query("subjects").take(50);

    const created: Array<{ subject: string; topic: string; class: string }> =
      [];
    let skipped = 0;

    for (const subjectSeed of CURRICULUM) {
      // Matière : réutilisée par nom (insensible aux accents près, on
      // matche en minuscule) ou créée avec les mêmes valeurs que
      // subjects.seedDefaults.
      const existing = existingSubjects.find(
        (s) => s.name.toLowerCase() === subjectSeed.name.toLowerCase(),
      );
      let subjectId: Id<"subjects">;
      if (existing) {
        subjectId = existing._id;
      } else {
        subjectId = await ctx.db.insert("subjects", {
          name: subjectSeed.name,
          icon: subjectSeed.icon,
          color: subjectSeed.color,
          order: subjectSeed.order,
        });
      }

      const existingTopics = await ctx.db
        .query("topics")
        .withIndex("by_subjectId", (q) => q.eq("subjectId", subjectId))
        .take(500);
      const existingKeys = new Set(
        existingTopics.map((t) => `${t.name.toLowerCase()}|${t.class ?? ""}`),
      );

      for (const cls of CLASS_LEVELS) {
        const topics = subjectSeed.topics[cls];
        if (!topics) continue;
        const classBase = CLASS_LEVELS.indexOf(cls) * 100;
        for (let i = 0; i < topics.length; i++) {
          const t = topics[i];
          const key = `${t.name.toLowerCase()}|${cls}`;
          if (existingKeys.has(key)) {
            skipped++;
            continue;
          }
          await ctx.db.insert("topics", {
            subjectId,
            name: t.name,
            description: t.description,
            order: classBase + i + 1,
            class: cls,
          });
          existingKeys.add(key);
          created.push({
            subject: subjectSeed.name,
            topic: t.name,
            class: cls,
          });
        }
      }
    }

    return {
      createdCount: created.length,
      skippedCount: skipped,
      created,
    };
  },
});
