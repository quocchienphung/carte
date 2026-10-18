#!/usr/bin/env node
// One command on macOS, Windows and Linux: (re)builds public/sites/roco-bank/iphone-duo/iPhone_Duo.glb,
// the Apple model the fold scene loads (FoldScene.tsx → MODEL_URL). The GLB is committed so deploys
// have it; the USDC + textures this leaves next to it stay gitignored.
//   npm run assets:iphone-duo             skip when the GLB already exists
//   npm run assets:iphone-duo -- --force  rebuild it
// Steps: Python venv in .venv-tools (bin/ on macOS/Linux, Scripts\ on Windows) + usd-core →
// scripts/assets/prepare_iphone_duo.py (download + flatten the USD) → Playwright Chromium →
// scripts/assets/usd_to_glb.mjs (USD → GLB) → gltf-transform meshopt.
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const win = process.platform === "win32";
const glb = join(root, "public/sites/roco-bank/iphone-duo/iPhone_Duo.glb");
const venv = join(root, ".venv-tools");
const venvPython = join(venv, win ? "Scripts/python.exe" : "bin/python");
const force = process.argv.includes("--force");

function run(cmd, args, label) {
  console.log(`\n> ${label}`);
  // .cmd shims (npx on Windows) only start through a shell
  const shell = cmd.endsWith(".cmd");
  const r = spawnSync(cmd, shell ? args.map((a) => (/\s/.test(a) ? `"${a}"` : a)) : args, { cwd: root, stdio: "inherit", shell });
  if (r.status !== 0) {
    console.error(`\n✗ ${label} failed (${r.error?.message ?? `exit ${r.status}`})`);
    process.exit(1);
  }
}

/** `npx <args>` without a shell when started through `npm run` (npm_execpath → npm-cli.js) */
function npx(args, label) {
  const npmCli = process.env.npm_execpath;
  if (npmCli?.endsWith(".js")) run(process.execPath, [npmCli, "exec", "--yes", "--", ...args], label);
  else run(win ? "npx.cmd" : "npx", ["--yes", ...args], label);
}

const ok = (cmd, args) => spawnSync(cmd, args, { cwd: root, stdio: "ignore" }).status === 0;

/** first Python ≥ 3.9 on PATH (Windows: the py launcher, then python; macOS/Linux: python3) */
function systemPython() {
  const candidates = win ? [["py", ["-3"]], ["python", []], ["python3", []]] : [["python3", []], ["python", []]];
  const check = ["-c", "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)"];
  for (const [cmd, pre] of candidates) if (ok(cmd, [...pre, ...check])) return [cmd, pre];
  console.error("✗ Python 3.9+ not found. Install it (python.org or `brew install python`) and re-run.");
  process.exit(1);
}

if (existsSync(glb) && !force) {
  console.log(`✓ ${glb} already exists (${(statSync(glb).size / 1e6).toFixed(1)} MB). Use --force to rebuild.`);
  process.exit(0);
}

if (!existsSync(venvPython)) {
  const [py, pre] = systemPython();
  run(py, [...pre, "-m", "venv", venv], "create Python venv (.venv-tools)");
}
if (!ok(venvPython, ["-c", "import pxr"])) {
  // same pin as the upstream asset tooling (jadon7/iphone-duo requirements-assets.txt)
  run(venvPython, ["-m", "pip", "install", "--disable-pip-version-check", "--timeout", "120", "--retries", "5", "usd-core==26.8"], "install usd-core");
}
run(venvPython, ["-I", join(root, "scripts/assets/prepare_iphone_duo.py")], "download + prepare the Apple USD model");
run(process.execPath, [join(root, "node_modules/playwright/cli.js"), "install", "chromium"], "ensure Playwright Chromium");
run(process.execPath, [join(root, "scripts/assets/usd_to_glb.mjs")], "convert USD → GLB");

if (!existsSync(glb)) {
  console.error(`✗ conversion finished but ${glb} is missing`);
  process.exit(1);
}
// meshopt + KHR_mesh_quantization: 11.9 → 5.5 MB, node names / hierarchy kept (engine.ts decodes
// it with MeshoptDecoder + toFloatGeometry). Compressed GLB is the one committed to git.
npx(["@gltf-transform/cli@4.5.1", "meshopt", glb, glb], "compress GLB (meshopt)");
console.log(`\n✓ ready: ${glb} (${(statSync(glb).size / 1e6).toFixed(1)} MB). Reload the page.`);
