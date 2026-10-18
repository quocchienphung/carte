#!/usr/bin/env node
// Extract exact reference frames from the source MP4 into references/keyframes/.
// Frame-accurate: uses ffmpeg's select filter on decoded frame index (n = round(t * 30)).
//
//   node tests/capture-reference.mjs            # default checkpoint list
//   node tests/capture-reference.mjs 0.4 5.4    # custom timestamps (seconds)
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const video = join(root, "references/roco-bank-reference.mp4");
const outDir = join(root, "references/keyframes");
const FPS = 30;

export const CHECKPOINTS = [
  0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 1.6, 2.0, 2.2, 2.5, 3.0, 3.5, 3.6, 3.8, 4.0,
  4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 4.9, 5.0, 5.2, 5.4, 5.8, 6.0, 6.2, 6.6, 7.0, 7.2, 7.5, 8.0, 8.5,
  9.0, 9.5,
];

const times = process.argv.length > 2 ? process.argv.slice(2).map(Number) : CHECKPOINTS;
const frames = [...new Set(times.map((t) => Math.min(293, Math.round(t * FPS))))].sort((a, b) => a - b);

mkdirSync(outDir, { recursive: true });
const tmp = join(outDir, ".tmp");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);

const select = frames.map((n) => `eq(n\\,${n})`).join("+");
execFileSync("ffmpeg", [
  "-v", "error", "-i", video, "-vf", `select='${select}'`, "-fps_mode", "passthrough", join(tmp, "%04d.png"),
]);

const produced = readdirSync(tmp).filter((f) => f.endsWith(".png")).sort();
if (produced.length !== frames.length) {
  throw new Error(`expected ${frames.length} frames, ffmpeg produced ${produced.length}`);
}
produced.forEach((file, i) => {
  const n = frames[i];
  const name = `ref_t${(n / FPS).toFixed(3)}_f${String(n).padStart(3, "0")}.png`;
  renameSync(join(tmp, file), join(outDir, name));
  console.log(join("references/keyframes", name));
});
rmSync(tmp, { recursive: true, force: true });
