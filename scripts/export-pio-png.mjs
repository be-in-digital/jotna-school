#!/usr/bin/env node
/**
 * Export PNG haute résolution (1200×1200, fond transparent) des SVG de la
 * mascotte Pio v3 — livrable du brief (« SVG vectoriel + PNG transparent »).
 *
 * Usage : node scripts/export-pio-png.mjs   (après generate-pio.mjs)
 */

import { readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public", "brand", "pio");
const OUT = join(SRC, "png");
mkdirSync(OUT, { recursive: true });

const svgs = readdirSync(SRC).filter((f) => f.endsWith(".svg"));
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 1200 },
});

for (const file of svgs) {
  await page.goto(`file://${join(SRC, file)}`);
  await page.screenshot({
    path: join(OUT, file.replace(".svg", ".png")),
    omitBackground: true,
  });
  console.log(`✓ ${file} → png/${file.replace(".svg", ".png")}`);
}

await browser.close();
console.log(`OK — ${svgs.length} PNG 1200×1200 transparents dans public/brand/pio/png/`);
