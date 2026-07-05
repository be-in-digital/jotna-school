#!/usr/bin/env node
/**
 * "Pio au tableau" render worker.
 *
 * Pulls exercise explanations whose narrated audio is ready but whose video
 * is missing (convex explainVideo:listPending), composes a real MP4 with
 * Remotion (blackboard + Pio poses + his TTS voice), uploads it to Convex
 * storage and attaches it to the explanation. Fully unattended — run it:
 *
 *   pnpm render:videos            # one pass (up to --limit videos)
 *   pnpm render:videos --loop     # keep polling every 60s (dev daemon)
 *
 * Deploy anywhere Node + Chrome can run (laptop, CI cron, a small VM or a
 * render lambda). Idempotent: attachVideo is first-writer-wins and pending
 * rows disappear once their video lands.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { parseBuffer } from "music-metadata";

const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;
/** Breathing pad appended after each spoken segment, in seconds. */
const SEGMENT_PAD_S = 0.45;
const MIN_SEGMENT_FRAMES = 2 * FPS;

const args = process.argv.slice(2);
const loop = args.includes("--loop");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 3) : 3;

const workDir = join(process.cwd(), ".render");

function convexRun(fn, payload) {
  const out = execFileSync(
    "npx",
    ["convex", "run", fn, JSON.stringify(payload ?? {})],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const trimmed = out.trim();
  if (!trimmed) return null;
  // `convex run` prints the raw function result (JSON) on the last lines;
  // tolerate any leading log noise by parsing from the first JSON char.
  const start = trimmed.search(/[[{"0-9tfn-]/);
  return JSON.parse(trimmed.slice(start));
}

/** Mirror of lib/explainBeats.ts pose mapping — keep the two in sync. */
function poseFor(role, stepIndex) {
  if (role === "intro") return "hello";
  if (role === "conclusion") return "encourage";
  return stepIndex === 0 ? "amazed" : "think";
}

/** Mirror of lib/explainBeats.ts stripStepPrefix — keep the two in sync. */
function stripStepPrefix(step) {
  return step.replace(/^\s*(étapes?\s*\d+|\d+)\s*[:.)\-–]\s*/i, "").trim();
}

async function audioDurationSeconds(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`audio fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await parseBuffer(buf, { mimeType: "audio/mpeg" });
  const dur = meta.format.duration;
  if (!dur || !Number.isFinite(dur)) throw new Error("no duration in mp3");
  return dur;
}

async function buildProps(pending) {
  let stepIndex = 0;
  const segments = [];
  for (const seg of pending.audioSegments) {
    const isStep = seg.role === "step";
    const pose = poseFor(seg.role, isStep ? stepIndex : 0);
    const stepNumber = isStep ? stepIndex + 1 : null;
    const board = isStep ? (pending.boardSpecs?.[stepIndex] ?? null) : null;
    if (isStep) stepIndex++;

    const durationS = await audioDurationSeconds(seg.url);
    segments.push({
      role: seg.role,
      text: isStep ? stripStepPrefix(seg.text) : seg.text,
      stepNumber,
      pose,
      board,
      audioSrc: seg.url,
      durationInFrames: Math.max(
        MIN_SEGMENT_FRAMES,
        Math.ceil((durationS + SEGMENT_PAD_S) * FPS),
      ),
    });
  }
  return {
    // Board title: keep the chalk line readable.
    title:
      pending.title.length > 110
        ? `${pending.title.slice(0, 107)}…`
        : pending.title,
    segments,
  };
}

async function renderOne(pending) {
  const t0 = Date.now();
  const id = pending.explanationId;
  const props = await buildProps(pending);
  const totalFrames =
    props.segments.reduce((n, s) => n + s.durationInFrames, 0) + 24;

  mkdirSync(workDir, { recursive: true });
  const propsPath = join(workDir, `${id}.props.json`);
  const outPath = join(workDir, `${id}.mp4`);
  writeFileSync(propsPath, JSON.stringify(props));

  console.log(
    `▶ ${id} — ${props.segments.length} segments, ~${Math.round(totalFrames / FPS)}s : rendu…`,
  );
  execFileSync(
    "npx",
    [
      "remotion",
      "render",
      "PioExplainer",
      outPath,
      `--props=${propsPath}`,
      "--codec=h264",
      "--log=error",
    ],
    { stdio: "inherit" },
  );

  const bytes = readFileSync(outPath);
  const uploadUrl = await convexRun("explainVideo:videoUploadUrl", {});
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "video/mp4" },
    body: bytes,
  });
  if (!uploadRes.ok) throw new Error(`upload failed: ${uploadRes.status}`);
  const { storageId } = await uploadRes.json();

  convexRun("explainVideo:attachVideo", {
    explanationId: id,
    storageId,
    durationSeconds: Math.round(totalFrames / FPS),
    width: WIDTH,
    height: HEIGHT,
  });

  rmSync(propsPath, { force: true });
  rmSync(outPath, { force: true });
  console.log(
    `✔ ${id} — ${(bytes.length / 1024 / 1024).toFixed(1)} Mo envoyés en ${Math.round((Date.now() - t0) / 1000)}s`,
  );
}

async function pass() {
  const pending = convexRun("explainVideo:listPending", { limit }) ?? [];
  if (pending.length === 0) {
    console.log("Rien à rendre — toutes les explications ont leur vidéo.");
    return 0;
  }
  let ok = 0;
  for (const p of pending) {
    try {
      await renderOne(p);
      ok++;
    } catch (err) {
      console.error(`✖ ${p.explanationId} — ${err.message ?? err}`);
    }
  }
  return ok;
}

if (loop) {
  console.log(`Worker en boucle (limite ${limit}/passe, poll 60s)…`);
  for (;;) {
    await pass();
    await new Promise((r) => setTimeout(r, 60_000));
  }
} else {
  await pass();
}
