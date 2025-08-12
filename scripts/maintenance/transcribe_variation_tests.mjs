import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/transcribe_variation_tests.mjs
// Transcribes any .mp3 in variation_tests to .txt via the `whisper` CLI (local).
// Skips files that already have a .txt next to them.
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ROOT = path.resolve("core/voice/output/variation_tests");
const EMOTIONS = [
  "neutral","reflective","assertive","technical","bonding",
  "confident","defensive","compassionate","humorous",
  "sarcastic","charismatic","frustrated","apologetic",
];
const ex = promisify(execFile);

async function transcribeOne(mp3Path) {
  const txtPath = mp3Path.replace(/\.mp3$/i, ".txt");
  // If already there, skip
  try { await fs.access(txtPath); return; } catch {}

  const cwd = path.dirname(mp3Path);
  const base = path.basename(mp3Path);
  // Use whisper CLI (installed via `pip install openai-whisper`)
  // Output is txt next to the mp3
  try {
    await ex("whisper", [base, "--model", "base", "--output_format", "txt", "--language", "en"], { cwd, stdio: "ignore" });
  } catch (err) {
    console.warn(`⚠️  Whisper failed for ${mp3Path}:`, err?.message || err);
  }
}

async function main() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const lineDirs = entries.filter(d => d.isDirectory() && d.name.startsWith("line_"))
                          .map(d => path.join(ROOT, d.name))
                          .sort();

  for (const dir of lineDirs) {
    console.log(`\n▶ Transcribing: ${dir}`);
    for (const emotion of EMOTIONS) {
      const mp3 = path.join(dir, `${emotion}_sample.mp3`);
      try { await fs.access(mp3); } catch { continue; }
      await transcribeOne(mp3);
    }
  }
  console.log("\n✅ All variation samples transcribed.\n");
}

main().catch(e => { console.error(e); process.exit(1); });