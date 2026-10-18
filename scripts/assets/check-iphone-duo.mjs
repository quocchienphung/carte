#!/usr/bin/env node
// `predev` hook: the fold scene has no device without the iPhone Duo model (committed GLB, or a
// local rebuild). Warn here instead of the page failing silently.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dir = join(root, "public/sites/roco-bank/iphone-duo");
if (!existsSync(join(dir, "iPhone_Duo.glb")) && !existsSync(join(dir, "iPhone_Duo_Render.usdc"))) {
  console.warn(
    "\n\x1b[33m⚠ iPhone Duo model missing (public/sites/roco-bank/iphone-duo/iPhone_Duo.glb).\n" +
      "  The fold animation will not show the device. Build it once on this machine:\n" +
      "    npm run assets:iphone-duo\x1b[0m\n",
  );
}
