#!/usr/bin/env node
import fs from "node:fs";
import { execSync } from "node:child_process";
import { synth } from "../core/voice/synth/index.mjs";

const out = process.env.SMOKE_OUT || "/tmp/aegis_smoke.mp3";
const text = process.argv.slice(2).join(" ") || "Smoke test: pipeline voice is green.";

try {
  const r = await synth(text, { out });
  const ok = !!(r && r.bytes > 0 && fs.existsSync(out));
  const outMsg = { ok, stage: "smoke", bytes: r?.bytes ?? 0, out };
  console.log(JSON.stringify(outMsg, null, 2));
  // best-effort local playback (macOS)
  try { execSync(`afplay "${out}"`, { stdio: "ignore" }); } catch {}
  process.exit(ok ? 0 : 1);
} catch (err) {
  console.log(JSON.stringify({ ok:false, stage:"smoke", error: String(err?.message || err) }, null, 2));
  process.exit(1);
}
