#!/usr/bin/env node
/**
 * Générateur de la mascotte Pio v3 — « Lionceau Téranga » (brief 2026-07-02).
 *
 * Source de vérité UNIQUE de la mascotte : produit des SVG autonomes dans
 * public/brand/pio/ (8 états + silhouette + 4 pictos + preview.html).
 * Style : vectoriel plat, formes rondes, contours charbon doux épais,
 * palette stricte de la plateforme. Lisible de 32px à 1200px.
 *
 * Usage : node scripts/generate-pio.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "brand", "pio");

// ---------------------------------------------------------------------------
// Palette OBLIGATOIRE (brief)
// ---------------------------------------------------------------------------
const P = {
  amber: "#FCD34D", // corps — dominante
  orange: "#F97316", // crinière solaire
  lime: "#84CC16", // feuille
  emerald: "#10B981", // accents de réussite / bandana
  ink: "#1F2937", // contours / yeux (jamais de noir pur)
  cream: "#FFFBEB", // museau / ventre / lumière
  amberDeep: "#F59E0B", // ombre plate du corps (2 tons max)
  orangeDeep: "#EA580C", // ombre plate de la crinière
};

const SW = 5; // épaisseur de contour (viewBox 200) — doux et épais
const S = `stroke="${P.ink}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"`;
const SNONE = 'stroke="none"';

// ---------------------------------------------------------------------------
// Géométrie de base (viewBox 0 0 200 200, sol à y≈188)
// ---------------------------------------------------------------------------
const CX = 100; // axe
const HEAD = { cx: 100, cy: 86, r: 42 };
const MANE_R = 51; // rayon du ring des pétales
const PETAL_R = 15.5;

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Crinière-soleil : 12 pétales ronds + disque de fusion (téranga). */
function mane() {
  let petals = "";
  for (let i = 0; i < 12; i++) {
    const [x, y] = polar(HEAD.cx, HEAD.cy, MANE_R, i * 30 - 90);
    petals += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${PETAL_R}" fill="${P.orange}" ${S}/>`;
  }
  // disque de fusion : efface les traits intérieurs des pétales
  return `<g>${petals}<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${MANE_R + 2}" fill="${P.orange}" ${SNONE}/></g>`;
}

/** Feuille lime dans la crinière (accent nature, clin d'œil à l'identité). */
function leaf() {
  return `<g transform="translate(133 42) rotate(28)">
    <path d="M0 0 C 8 -8 18 -8 22 -2 C 16 6 6 7 0 0 Z" fill="${P.lime}" ${S}/>
    <path d="M2 0 C 8 -2 14 -3 19 -2" fill="none" stroke="${P.ink}" stroke-width="2.4" stroke-linecap="round"/>
  </g>`;
}

function ears() {
  const ear = (x) => `
    <circle cx="${x}" cy="46" r="12" fill="${P.amber}" ${S}/>
    <circle cx="${x}" cy="46" r="5.5" fill="${P.cream}" ${SNONE}/>`;
  return `<g>${ear(66)}${ear(134)}</g>`;
}

function head() {
  return `<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="${P.amber}" ${S}/>`;
}

function body() {
  return `
  <path d="M 70 132 C 66 152 66 166 72 176 C 80 184 120 184 128 176 C 134 166 134 152 130 132 C 120 124 80 124 70 132 Z" fill="${P.amber}" ${S}/>
  <ellipse cx="100" cy="156" rx="19" ry="19" fill="${P.cream}" ${SNONE}/>`;
}

function legs() {
  const foot = (x) => `
    <ellipse cx="${x}" cy="181" rx="14" ry="8.5" fill="${P.amber}" ${S}/>
    <ellipse cx="${x - 5}" cy="182.5" rx="2.2" ry="1.6" fill="${P.cream}" ${SNONE}/>
    <ellipse cx="${x}" cy="183.5" rx="2.2" ry="1.6" fill="${P.cream}" ${SNONE}/>
    <ellipse cx="${x + 5}" cy="182.5" rx="2.2" ry="1.6" fill="${P.cream}" ${SNONE}/>`;
  return `<g>${foot(84)}${foot(116)}</g>`;
}

function tail() {
  return `<g>
    <path d="M 128 162 C 148 158 156 144 154 128" fill="none" stroke="${P.ink}" stroke-width="${SW + 5.5}" stroke-linecap="round"/>
    <path d="M 128 162 C 148 158 156 144 154 128" fill="none" stroke="${P.amber}" stroke-width="${SW + 1}" stroke-linecap="round"/>
    <circle cx="154" cy="123" r="9" fill="${P.orange}" ${S}/>
  </g>`;
}

/** Bandana wax — détail culturel subtil (émeraude + motifs discrets). */
function bandana() {
  return `<g>
    <path d="M 70 124 C 84 132 116 132 130 124 L 124 140 C 110 146 90 146 76 140 Z" fill="${P.emerald}" ${S}/>
    <path d="M 96 141 L 100 150 L 104 141 Z" fill="${P.emerald}" ${S}/>
    <g fill="${P.amber}" ${SNONE}>
      <circle cx="84" cy="133" r="1.9"/><circle cx="116" cy="133" r="1.9"/>
    </g>
    <g fill="${P.orange}" ${SNONE}>
      <path d="M 92 130 l 3.4 -4.8 3.4 4.8 Z"/>
      <path d="M 101.2 136 l 3.4 -4.8 3.4 4.8 Z"/>
    </g>
  </g>`;
}

// ---------------------------------------------------------------------------
// Visage par état
// ---------------------------------------------------------------------------
function muzzle() {
  return `
  <ellipse cx="100" cy="103" rx="17" ry="12.5" fill="${P.cream}" ${SNONE}/>
  <path d="M 95 97.5 Q 100 94.5 105 97.5 Q 102.6 102.5 100 102.5 Q 97.4 102.5 95 97.5 Z" fill="${P.ink}" ${SNONE}/>`;
}

function blush() {
  return `<g fill="${P.orange}" opacity="0.28" ${SNONE}>
    <ellipse cx="70" cy="98" rx="7" ry="4.5"/>
    <ellipse cx="130" cy="98" rx="7" ry="4.5"/>
  </g>`;
}

/** Yeux énormes et expressifs — le cœur de la personnalité. */
function eyes(kind) {
  const eye = (x, o) => `
    <ellipse cx="${x}" cy="82" rx="9.5" ry="12" fill="${P.ink}" ${SNONE}/>
    <circle cx="${x + 3 + o}" cy="77" r="3.6" fill="#FFFFFF"/>
    <circle cx="${x - 3 + o}" cy="86" r="1.7" fill="#FFFFFF" opacity="0.85"/>`;
  switch (kind) {
    case "closed-happy": // ^ ^
      return `<g fill="none" stroke="${P.ink}" stroke-width="${SW}" stroke-linecap="round">
        <path d="M 76 82 Q 83 74 90 82"/><path d="M 110 82 Q 117 74 124 82"/>
      </g>`;
    case "closed-sleep": // paupières douces
      return `<g fill="none" stroke="${P.ink}" stroke-width="${SW}" stroke-linecap="round">
        <path d="M 76 84 Q 83 90 90 84"/><path d="M 110 84 Q 117 90 124 84"/>
      </g>`;
    case "soft": // mi-clos réconfortant
      return `<g>
        <path d="M 74 80 Q 83 76 92 80 L 92 84 Q 83 92 74 84 Z" fill="${P.ink}" ${SNONE}/>
        <path d="M 108 80 Q 117 76 126 80 L 126 84 Q 117 92 108 84 Z" fill="${P.ink}" ${SNONE}/>
        <circle cx="86" cy="81.5" r="2.4" fill="#FFFFFF" opacity="0.9"/>
        <circle cx="120" cy="81.5" r="2.4" fill="#FFFFFF" opacity="0.9"/>
      </g>`;
    case "star": // émerveillé : étoiles dans les yeux
      return `<g>
        <ellipse cx="83" cy="82" rx="10.5" ry="13" fill="${P.ink}" ${SNONE}/>
        <ellipse cx="117" cy="82" rx="10.5" ry="13" fill="${P.ink}" ${SNONE}/>
        ${starPath(83, 80, 5, "#FFFFFF")}
        ${starPath(117, 80, 5, "#FFFFFF")}
        <circle cx="80" cy="88" r="1.6" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="114" cy="88" r="1.6" fill="#FFFFFF" opacity="0.8"/>
      </g>`;
    case "up": // réfléchi : regard vers le haut
      return `<g>
        <ellipse cx="83" cy="82" rx="9.5" ry="12" fill="${P.ink}" ${SNONE}/>
        <ellipse cx="117" cy="82" rx="9.5" ry="12" fill="${P.ink}" ${SNONE}/>
        <circle cx="86" cy="75.5" r="3.6" fill="#FFFFFF"/>
        <circle cx="120" cy="75.5" r="3.6" fill="#FFFFFF"/>
      </g>`;
    default: // grands yeux ronds curieux
      return `<g>${eye(83, 0)}${eye(117, 0)}</g>`;
  }
}

function brows(kind) {
  const b = (d) => `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`;
  switch (kind) {
    case "raised":
      return b("M 74 62 Q 83 56 92 61") + b("M 108 61 Q 117 56 126 62");
    case "think":
      return b("M 74 64 Q 83 59 92 62") + b("M 108 60 Q 117 57 126 61");
    case "soft":
      return b("M 75 65 Q 83 62 91 64") + b("M 109 64 Q 117 62 125 65");
    default:
      return "";
  }
}

function mouth(kind) {
  switch (kind) {
    case "open-joy":
      return `<path d="M 90 108 Q 100 120 110 108 Q 100 112 90 108 Z" fill="${P.ink}" ${SNONE}/>
        <path d="M 94 111.5 Q 100 115.5 106 111.5 Q 100 117 94 111.5 Z" fill="${P.orange}" ${SNONE}/>`;
    case "o":
      return `<ellipse cx="100" cy="109" rx="4.6" ry="5.6" fill="${P.ink}" ${SNONE}/>`;
    case "gentle":
      return `<path d="M 94 108.5 Q 100 112.5 106 108.5" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`;
    case "sleep":
      return `<path d="M 96 109 Q 100 111.5 104 109" fill="none" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round"/>`;
    default: // smile
      return `<path d="M 91 107 Q 100 114.5 109 107" fill="none" stroke="${P.ink}" stroke-width="4.4" stroke-linecap="round"/>`;
  }
}

// ---------------------------------------------------------------------------
// Bras par état
// ---------------------------------------------------------------------------
const paw = (x, y, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})">
    <ellipse cx="0" cy="0" rx="10" ry="15.5" fill="${P.amber}" ${S}/>
    <ellipse cx="0" cy="-9" rx="5.5" ry="4" fill="${P.cream}" ${SNONE}/>
  </g>`;

function arms(kind) {
  // Les pattes levées sortent NETTEMENT de la silhouette de la crinière
  // (fond crème) pour rester lisibles — idiome « membres détachés » des
  // mascottes flat (Duolingo). Le contour charbon fait le raccord visuel.
  switch (kind) {
    case "wave": // héro : patte droite levée qui salue, bien dégagée
      return paw(66, 148, 14) + paw(158, 106, -155);
    case "both-up": // célébration : les deux pattes hautes et écartées
      return paw(42, 106, 155) + paw(158, 106, -155);
    case "cheeks": // émerveillé : pattes vers les joues
      return paw(58, 118, -35) + paw(142, 118, 35);
    case "thumb": // encourageant : pouce levé, dégagé de la crinière
      return (
        paw(66, 148, 14) +
        `<g transform="translate(156 112) rotate(-160)">
          <ellipse cx="0" cy="0" rx="10" ry="15" fill="${P.amber}" ${S}/>
          <ellipse cx="9" cy="-7" rx="4.6" ry="7.5" fill="${P.amber}" ${S}/>
        </g>`
      );
    case "chin": // réfléchi : patte au menton
      return paw(66, 148, 14) + paw(126, 114, -55);
    case "open": // réconfortant : bras ouverts vers l'enfant
      return paw(56, 140, -65) + paw(144, 140, 65);
    case "hold": // pictos : les deux pattes tiennent un objet devant
      return paw(74, 136, -40) + paw(126, 136, 40);
    default: // repos
      return paw(68, 150, 10) + paw(132, 150, -10);
  }
}

// ---------------------------------------------------------------------------
// Extras (étoiles, cœur, lune…)
// ---------------------------------------------------------------------------
function starPath(cx, cy, r, fill, stroke = false) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const [x, y] = polar(cx, cy, rr, i * 36 - 90);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `<path d="${d}Z" fill="${fill}" ${stroke ? S : SNONE}/>`;
}

function heart(cx, cy, s, fill) {
  return `<path transform="translate(${cx} ${cy}) scale(${s})" d="M 0 4 C -6 -2 -12 2 -9 8 C -7 12 -3 15 0 18 C 3 15 7 12 9 8 C 12 2 6 -2 0 4 Z" fill="${fill}" ${S}/>`;
}

function extras(kind) {
  switch (kind) {
    case "sparkles":
      return (
        starPath(38, 52, 8, P.amber, true) +
        starPath(166, 66, 6, P.emerald, true) +
        starPath(158, 30, 5, P.orange, true)
      );
    case "celebrate":
      return (
        starPath(34, 60, 9, P.amber, true) +
        starPath(166, 60, 9, P.emerald, true) +
        starPath(100, 16, 7, P.orange, true)
      );
    case "heart":
      return heart(160, 46, 1.1, P.emerald);
    case "comfort-heart":
      return heart(100, 118, 0.9, P.emerald);
    case "moon":
      return `<path d="M 168 38 A 14 14 0 1 1 152 22 A 11.5 11.5 0 0 0 168 38 Z" fill="${P.amber}" ${S}/>`;
    case "zzz":
      return `<g fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 148 52 h 11 l -11 11 h 11"/>
        <path d="M 164 30 h 8 l -8 8 h 8"/>
      </g>`;
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------------
const EXPRESSIONS = {
  // pose héro : salut amical
  hero: { arms: "wave", eyes: "round", brows: "raised", mouth: "smile", extra: "" },
  idle: { arms: "rest", eyes: "round", brows: "", mouth: "smile", extra: "" },
  amazed: { arms: "cheeks", eyes: "star", brows: "raised", mouth: "o", extra: "sparkles" },
  encourage: { arms: "thumb", eyes: "round", brows: "raised", mouth: "smile", extra: "heart" },
  think: { arms: "chin", eyes: "up", brows: "think", mouth: "gentle", extra: "" },
  cheer: { arms: "both-up", eyes: "closed-happy", brows: "", mouth: "open-joy", extra: "celebrate" },
  comfort: { arms: "open", eyes: "soft", brows: "soft", mouth: "gentle", extra: "comfort-heart" },
  sleep: { arms: "rest", eyes: "closed-sleep", brows: "", mouth: "sleep", extra: "zzz" },
};

function mascot(exp) {
  const e = EXPRESSIONS[exp];
  return `
  ${tail()}
  ${mane()}
  ${ears()}
  ${legs()}
  ${body()}
  ${arms(e.arms)}
  ${bandana()}
  ${head()}
  ${leaf()}
  ${blush()}
  ${brows(e.brows)}
  ${eyes(e.eyes)}
  ${muzzle()}
  ${mouth(e.mouth)}
  ${extras(e.extra)}`;
}

function svgDoc(inner, viewBox = "0 0 200 200") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" role="img">
${inner}
</svg>`;
}

// Silhouette monochrome (favicon / petits formats) : formes pleines charbon.
function silhouette() {
  let petals = "";
  for (let i = 0; i < 12; i++) {
    const [x, y] = polar(HEAD.cx, HEAD.cy, MANE_R, i * 30 - 90);
    petals += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${PETAL_R + 2}"/>`;
  }
  return svgDoc(`<g fill="${P.ink}">
    ${petals}
    <circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${MANE_R + 4}"/>
    <circle cx="66" cy="44" r="13"/><circle cx="134" cy="44" r="13"/>
    <path d="M 68 130 C 62 154 62 168 72 179 C 82 188 118 188 128 179 C 138 168 138 154 132 130 Z"/>
    <ellipse cx="84" cy="181" rx="15" ry="9"/><ellipse cx="116" cy="181" rx="15" ry="9"/>
    <path d="M 128 162 C 148 158 156 144 154 128" stroke="${P.ink}" stroke-width="11" stroke-linecap="round" fill="none"/>
    <circle cx="154" cy="123" r="10"/>
  </g>
  <g fill="${P.cream}">
    <ellipse cx="83" cy="82" rx="9" ry="11.5"/>
    <ellipse cx="117" cy="82" rx="9" ry="11.5"/>
    <path d="M 88 106 Q 100 116 112 106 Q 100 122 88 106 Z"/>
  </g>`);
}

// Pictos : Pio (buste) tenant un objet.
function picto(item) {
  const items = {
    book: `<g transform="translate(100 150)">
      <path d="M -26 -12 C -16 -18 -4 -18 0 -12 C 4 -18 16 -18 26 -12 L 26 10 C 16 4 4 4 0 10 C -4 4 -16 4 -26 10 Z" fill="${P.cream}" ${S}/>
      <path d="M 0 -12 L 0 10" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M -20 -8 h 13 M -20 -2 h 13 M 7 -8 h 13 M 7 -2 h 13" stroke="${P.emerald}" stroke-width="3" stroke-linecap="round"/>
    </g>`,
    pencil: `<g transform="translate(100 148) rotate(-35)">
      <rect x="-6" y="-26" width="12" height="40" rx="3" fill="${P.orange}" ${S}/>
      <rect x="-6" y="-26" width="12" height="8" rx="3" fill="${P.emerald}" ${S}/>
      <path d="M -6 14 L 0 26 L 6 14 Z" fill="${P.cream}" ${S}/>
      <path d="M -2 20 L 0 26 L 2 20 Z" fill="${P.ink}" ${SNONE}/>
    </g>`,
    star: `<g transform="translate(100 148)">${starPath(0, 0, 24, P.amber, true)}</g>`,
    trophy: `<g transform="translate(100 146)">
      <path d="M -16 -18 L 16 -18 L 13 4 C 10 12 -10 12 -13 4 Z" fill="${P.amber}" ${S}/>
      <path d="M -16 -14 C -26 -12 -26 -2 -14 0 M 16 -14 C 26 -12 26 -2 14 0" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>
      <rect x="-4" y="10" width="8" height="8" fill="${P.amber}" ${S}/>
      <rect x="-13" y="18" width="26" height="7" rx="3" fill="${P.orange}" ${S}/>
      ${starPath(0, -7, 7, P.orange)}
    </g>`,
  };
  // buste : queue/jambes hors-champ, Pio derrière l'objet, pattes "hold"
  const bust = `
  <g transform="translate(0 -14)">
    ${mane()}
    ${ears()}
    <path d="M 70 130 C 66 150 66 168 74 178 C 84 186 116 186 126 178 C 134 168 134 150 130 130 Z" fill="${P.amber}" ${S}/>
    ${bandana()}
    ${head()}
    ${leaf()}
    ${blush()}
    ${eyes("round")}
    ${muzzle()}
    ${mouth("smile")}
    ${arms("hold")}
  </g>`;
  return svgDoc(bust + items[item]);
}

// ---------------------------------------------------------------------------
// Écriture des fichiers
// ---------------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });

const files = [];
for (const exp of Object.keys(EXPRESSIONS)) {
  const name = `pio-${exp}.svg`;
  writeFileSync(join(OUT, name), svgDoc(mascot(exp)));
  files.push(name);
}
writeFileSync(join(OUT, "pio-silhouette.svg"), silhouette());
files.push("pio-silhouette.svg");
for (const item of ["book", "pencil", "star", "trophy"]) {
  const name = `picto-${item}.svg`;
  writeFileSync(join(OUT, name), picto(item));
  files.push(name);
}

// Preview grid (QA visuelle : grands formats + test 64px)
const cells = files
  .map(
    (f) => `<figure>
      <img src="${f}" width="180" height="180" alt=""/>
      <img src="${f}" width="64" height="64" alt=""/>
      <figcaption>${f}</figcaption>
    </figure>`,
  )
  .join("\n");
writeFileSync(
  join(OUT, "preview.html"),
  `<!doctype html><meta charset="utf-8"><title>Pio v3 — preview</title>
<style>body{background:${P.cream};font:14px system-ui;margin:24px}
main{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
figure{margin:0;text-align:center;background:#fff;border-radius:16px;padding:12px}
img{vertical-align:bottom}figure img+img{margin-left:10px}</style>
<main>${cells}</main>`,
);

console.log(`OK — ${files.length} SVG écrits dans public/brand/pio/`);
