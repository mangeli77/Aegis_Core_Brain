#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TRANSCRIBE_JS="$ROOT/scripts/maintenance/transcribe_variation_files.mjs"
BACKUP_JS="$TRANSCRIBE_JS.bak.$(date +%Y%m%d%H%M%S)"

echo "🔧 Repo root: $ROOT"
echo "🔧 Target transcriber: $TRANSCRIBE_JS"
echo

# --------------------------------------------------------------------
# 1) Backup any existing transcribe_variation_files.mjs
# --------------------------------------------------------------------
if [[ -f "$TRANSCRIBE_JS" ]]; then
  cp -v "$TRANSCRIBE_JS" "$BACKUP_JS"
  echo "🗂️  Backed up current transcriber to: $BACKUP_JS"
fi

# --------------------------------------------------------------------
# 2) Write a robust, idempotent transcriber that:
#    - Walks voice/output/variation_tests/**
#    - Finds *_sample.mp3
#    - Creates *_sample.transcript.txt and *_sample.whisper.txt if missing
#    - Uses your local whisper transcriber module
# --------------------------------------------------------------------
cat > "$TRANSCRIBE_JS" <<'EOF'
// scripts/maintenance/transcribe_variation_files.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../../');
const VARIATIONS_ROOT = path.join(ROOT, 'voice', 'output', 'variation_tests');

// Try to dynamically load your existing local whisper transcriber
const TRANSCRIBER_PATH = path.join(ROOT, 'voice', 'utils', 'whisper_transcriber.mjs');

async function loadLocalTranscriber() {
  try {
    const mod = await import(pathToFileURLCompat(TRANSCRIBER_PATH));
    // Try a few typical exports:
    const fn =
      mod.transcribeFile ||
      mod.transcribe ||
      mod.transcribeWav ||
      mod.default;

    if (typeof fn !== 'function') {
      throw new Error('Local whisper_transcriber.mjs loaded but no callable export was found.');
    }
    return fn;
  } catch (err) {
    throw new Error(`Failed to load local transcriber at: ${TRANSCRIBER_PATH}\n${err?.stack || err}`);
  }
}

function pathToFileURLCompat(p) {
  // avoid import('file:///...') footguns on Windows; here we assume mac/linux
  const { pathToFileURL } = requireURL();
  return pathToFileURL(p).href;
}
function requireURL() {
  // late import node:url to avoid resolution issues
  return require('node:url');
}
function require(mod) {
  // little helper for dynamic commonjs import
  return (1, eval)('require')(mod); // eslint-disable-line no-eval
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function isVariationMp3(fullPath) {
  // matches .../line_0xx/<emotion>_sample.mp3
  const bn = path.basename(fullPath).toLowerCase();
  return bn.endsWith('_sample.mp3');
}

function transcriptTargets(mp3Path) {
  // we will create both names if missing
  const base = mp3Path.replace(/\.mp3$/i, '');
  return [
    `${base}.transcript.txt`,
    `${base}.whisper.txt`,
  ];
}

async function ensureDirFor(p) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function writeIfMissing(p, text) {
  if (!(await fileExists(p))) {
    await ensureDirFor(p);
    await fs.writeFile(p, text.trim() + '\n', 'utf8');
    return true;
  }
  return false;
}

async function main() {
  console.log(`[transcribe] Using local whisper transcriber: ${TRANSCRIBER_PATH}`);
  const transcribeFn = await loadLocalTranscriber();

  let scanned = 0, created = 0, skipped = 0;
  // Walk variations root
  try {
    await fs.access(VARIATIONS_ROOT);
  } catch {
    console.log(`[transcribe] No variations root present at: ${VARIATIONS_ROOT}`);
    return;
  }

  for await (const file of walk(VARIATIONS_ROOT)) {
    if (!isVariationMp3(file)) continue;
    scanned++;

    const targets = transcriptTargets(file);
    // If both already exist, skip
    const missingTargets = [];
    for (const t of targets) {
      if (!(await fileExists(t))) missingTargets.push(t);
    }
    if (missingTargets.length === 0) {
      skipped++;
      continue;
    }

    // Transcribe once per mp3, write to both targets that are missing
    let transcript;
    try {
      const out = await transcribeFn(file);
      transcript = (typeof out === 'string') ? out : (out?.text ?? '');
      if (!transcript || !transcript.trim()) {
        throw new Error('Empty transcript produced.');
      }
    } catch (err) {
      console.error(`❌ Whisper failed on ${file}\n${err?.stack || err}`);
      continue;
    }

    for (const t of missingTargets) {
      const wrote = await writeIfMissing(t, transcript);
      if (wrote) {
        created++;
        console.log(`📝 wrote ${path.relative(VARIATIONS_ROOT, t)}`);
      }
    }
  }

  console.log(`\n[transcribe] Done. mp3 scanned: ${scanned}, transcripts created: ${created}, already-present skipped: ${skipped}`);
}

await main().catch(e => {
  console.error('[transcribe] Fatal:', e?.stack || e);
  process.exit(1);
});
EOF

chmod +x "$TRANSCRIBE_JS"
echo "✅ Wrote patched transcriber: $TRANSCRIBE_JS"
echo

# --------------------------------------------------------------------
# 3) Run the transcriber (creates missing transcripts only)
# --------------------------------------------------------------------
echo "▶️  Generating any missing transcripts next to mp3s..."
node "$TRANSCRIBE_JS"
echo

# --------------------------------------------------------------------
# 4) If a full pipeline test exists, offer to run it
# --------------------------------------------------------------------
TEST_PIPE="$ROOT/scripts/maintenance/test_full_voice_pipeline.sh"
if [[ -x "$TEST_PIPE" ]]; then
  echo "▶️  Running full pipeline test (this may take a while)…"
  bash "$TEST_PIPE"
else
  echo "ℹ️  Full pipeline test script not found at:"
  echo "    $TEST_PIPE"
  echo "    (You can run cognition manually or create that test script.)"
fi

echo
echo "🎉 Patch complete."