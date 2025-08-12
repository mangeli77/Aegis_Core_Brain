import { requireEnv } from "#voice-utils/env_guard.mjs";
import '../../_env.mjs';

// scripts/maintenance/rebuild_variation_tests.mjs
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { speak } from "#voice-utils/tts_router.mjs";

const ROOT = path.resolve("core/voice/output/variation_tests");
const EMOTIONS = [
  "neutral","reflective","assertive","technical","bonding",
  "confident","defensive","compassionate","humorous",
  "sarcastic","charismatic","frustrated","apologetic",
];

const MAX_RETRY = 3;             // verify+retry
const MIN_BYTES = 1200;          // consider smaller as "short file"

async function ensureText(lineDir, name, text) {
  const p = path.join(lineDir, `${name}_sample.txt`);
  await fs.writeFile(p, `${text.trim()}\n`, "utf8");
  return p;
}
async function renderMp3(lineDir, name, text) {
  const outMp3 = path.join(lineDir, `${name}_sample.mp3`);
  await speak(text, outMp3);
  return outMp3;
}
async function statOrNull(p) {
  try { return await fs.stat(p); } catch { return null; }
}

async function rebuildLine(lineDir) {
  const promptMd = path.join(lineDir, "prompt.md");
  let baseLine = "This is a placeholder line for emotional variation.";
  try {
    baseLine = (await fs.readFile(promptMd, "utf8")).trim() || baseLine;
  } catch {}

  for (const emotion of EMOTIONS) {
    const txtPath = path.join(lineDir, `${emotion}_sample.txt`);
    let line = baseLine;

    // If you’ve manually put per‑emotion lines, prefer them
    try {
      const maybe = (await fs.readFile(txtPath, "utf8")).trim();
      if (maybe) line = maybe;
    } catch {}

    // Always (re)write the text file so what we synth is visible
    await ensureText(lineDir, emotion, line);

    // Verify + retry synthesis
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      process.stdout.write(
        `\r  • ${path.basename(lineDir)}/${emotion} – attempt ${attempt}/${MAX_RETRY}…`
      );
      const mp3 = await renderMp3(lineDir, emotion, line);
      const s = await statOrNull(mp3);
      if (s && s.size >= MIN_BYTES) {
        process.stdout.write(` ✅\n`);
        break;
      } else {
        process.stdout.write(` ❌ (short file)\n`);
        if (attempt === MAX_RETRY) {
          console.warn(
            `  ↪︎ giving up on ${path.basename(lineDir)}/${emotion} after ${MAX_RETRY} attempts`
          );
        }
      }
    }
  }
}

async function main() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const lines = entries.filter(d => d.isDirectory() && d.name.startsWith("line_"))
                       .map(d => path.join(ROOT, d.name))
                       .sort();

  console.log(`\n🔁 Rebuilding variation tests with verify+retry`);
  console.log(`   root: ${ROOT}\n`);

  for (const dir of lines) {
    console.log(`▶ ${path.basename(dir)}`);
    await rebuildLine(dir);
  }
  console.log(`\n✅ Variation rebuild complete.\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
