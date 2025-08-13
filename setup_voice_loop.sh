#!/usr/bin/env bash
# setup_voice_loop.sh
# One-shot setup for say+play CLI and push-to-talk loop.
# Idempotent and macOS/Linux friendly.

set -euo pipefail

### ────────────────────────────────────────────────────────────────────────────
### Helpers
### ────────────────────────────────────────────────────────────────────────────
RED=$'\e[31m'; GRN=$'\e[32m'; CYA=$'\e[36m'; BLD=$'\e[1m'; RST=$'\e[0m'
log() { printf "${CYA}%s${RST}\n" "==> $*"; }
ok()  { printf "${GRN}%s${RST}\n" "✓ $*"; }
die() { printf "${RED}%s${RST}\n" "✗ $*" >&2; exit 1; }

# Choose sed -i flavor (GNU vs BSD)
sedi() {
  if sed --version >/dev/null 2>&1; then sed -i "$@"; else sed -i '' "$@"; fi
}

project_root="$(pwd)"
cli_dir="runtime/cli"
mkdir -p "$cli_dir"

### ────────────────────────────────────────────────────────────────────────────
### Sanity checks
### ────────────────────────────────────────────────────────────────────────────
log "Sanity checks"
command -v node >/dev/null || die "Node.js is required"
command -v npm  >/dev/null || die "npm is required"
command -v afplay >/dev/null 2>&1 || command -v ffplay >/dev/null 2>&1 || \
  log "Note: 'afplay' (macOS) or 'ffplay' (ffmpeg) not found — we'll still write mp3; playback step will be skipped."

# Ensure package.json exists
[ -f package.json ] || die "package.json not found in $project_root"

# Normalize CRLFs in our repo (safe and idempotent)
if command -v perl >/dev/null 2>&1; then
  log "Normalizing line endings in repo (*.sh, *.mjs)"
  find . -type f \( -name '*.sh' -o -name '*.mjs' \) -print0 | xargs -0 perl -pi -e 's/\r$//'
fi

### ────────────────────────────────────────────────────────────────────────────
### Create say+play CLI: runtime/cli/play_one.mjs
### ────────────────────────────────────────────────────────────────────────────
log "Creating CLI say+play"
cat > "$cli_dir/play_one.mjs" <<'MJS'
#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// Import your synth entrypoint (already present in your repo)
import { synth as tts } from '../../core/voice/synth/index.mjs';

// Text to say; output file
const text = process.argv.slice(2).join(' ') || 'Aegis online.';
const out  = '/tmp/aegis_one.mp3';

try {
  const buf = await tts(text, { output_format: 'mp3_44100_128' });
  fs.writeFileSync(out, buf);
  console.log(JSON.stringify({ ok: true, bytes: buf?.length ?? 0, out }, null, 2));

  // Best-effort playback (macOS 'afplay' or ffmpeg 'ffplay')
  try {
    execSync(`afplay "${out}"`, { stdio: 'ignore' });
  } catch {
    try {
      execSync(`ffplay -nodisp -autoexit "${out}"`, { stdio: 'ignore' });
    } catch {}
  }
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: String(e?.message || e) }, null, 2));
  process.exit(1);
}
MJS
chmod +x "$cli_dir/play_one.mjs"

### ────────────────────────────────────────────────────────────────────────────
### Create push‑to‑talk loop scaffold: runtime/cli/voice_turn.mjs
### (Non-fatal if whisper is not configured yet.)
### ────────────────────────────────────────────────────────────────────────────
log "Creating push‑to‑talk loop (scaffold)"
cat > "$cli_dir/voice_turn.mjs" <<'MJS'
#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { synth as tts } from '../../core/voice/synth/index.mjs';

const REC_WAV = '/tmp/aegis_turn.wav';
const TTS_MP3 = '/tmp/aegis_turn.mp3';

// Optional environment hints
const WHISPER_BIN   = process.env.WHISPER_BIN || 'whisper';
const WHISPER_MODEL = process.env.WHISPER_MODEL_PATH;

// 1) Record a short utterance (macOS: sox or ffmpeg; you may adapt to your setup)
function record() {
  // Try sox first
  try { execFileSync('rec', ['-q', REC_WAV, 'trim', '0', '5']); return; } catch {}
  // Fallback: ffmpeg 5s from default device (tweak as needed)
  try { execFileSync('ffmpeg', ['-y', '-f', 'avfoundation', '-i', ':0', '-t', '5', REC_WAV], { stdio: 'ignore' }); return; } catch {}
  console.error('Recording tool not found (rec/sox or ffmpeg). Skipping record step.');
}

// 2) Transcribe via whisper.cpp (if available)
function transcribe() {
  if (!WHISPER_MODEL) {
    console.error('WHISPER_MODEL_PATH not set; skipping ASR.');
    return '';
  }
  try {
    const out = execFileSync(WHISPER_BIN, ['-m', WHISPER_MODEL, '-f', REC_WAV, '-otxt'], { encoding: 'utf8' });
    // whisper.cpp writes .txt alongside or stdout; attempt to read stdout text
    const txt = out?.toString?.().trim() || '';
    return txt;
  } catch (e) {
    console.error('Whisper ASR failed:', e?.message || e);
    return '';
  }
}

async function main() {
  record();
  const text = transcribe() || 'Acknowledged.';
  const buf = await tts(text, { output_format: 'mp3_44100_128' });
  fs.writeFileSync(TTS_MP3, buf);
  try { execFileSync('afplay', [TTS_MP3], { stdio: 'ignore' }); } catch {
    try { execFileSync('ffplay', ['-nodisp', '-autoexit', TTS_MP3], { stdio: 'ignore' }); } catch {}
  }
  console.log(JSON.stringify({ ok: true, said: text, out: TTS_MP3, bytes: buf?.length ?? 0 }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
MJS
chmod +x "$cli_dir/voice_turn.mjs"

### ────────────────────────────────────────────────────────────────────────────
### Patch package.json safely (via Node)
### ────────────────────────────────────────────────────────────────────────────
log "Updating package.json scripts"
node <<'NODE'
const fs = require('fs');
const p = 'package.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));

j.scripts ??= {};
// Keep your existing health/voice:test, etc., intact.
// Add or overwrite our two helpers:
j.scripts['voice:play:one'] = 'node runtime/cli/play_one.mjs';
j.scripts['voice:turn']     = 'node runtime/cli/voice_turn.mjs';

// Convenience full check (if you want it):
j.scripts['fullcheck'] = j.scripts['fullcheck'] ||
  'npm run -s voice:test && npm run -s health && npm run -s voice:play:one -- "System green."';

fs.writeFileSync(p, JSON.stringify(j, null, 2));
console.log('package.json updated');
NODE

### ────────────────────────────────────────────────────────────────────────────
### Clean stray heredoc markers & CRLF in this script (if any), then smoke test
### ────────────────────────────────────────────────────────────────────────────
# Remove any literal 'EOF' lines that might linger (the error you saw)
sedi '/^[[:space:]]*EOF[[:space:]]*$/d' "$0" || true
# Normalize CRLF inside this file
if command -v perl >/dev/null 2>&1; then perl -pi -e 's/\r$//' "$0" || true; fi

### ────────────────────────────────────────────────────────────────────────────
### Smoke: say+play
### ────────────────────────────────────────────────────────────────────────────
log "Smoke: CLI say+play"
npm run -s voice:play:one -- "Mission check complete."

### ────────────────────────────────────────────────────────────────────────────
### Finish
### ────────────────────────────────────────────────────────────────────────────
ok "Done"
cat <<'TXT'

You now have:
  npm run voice:play:one    # synth + play, e.g.:
    npm run voice:play:one -- "Aegis is online."

  npm run voice:turn        # push-to-talk loop (record → whisper.cpp → speak)
    # Optional env in .env:
    #   WHISPER_MODEL_PATH=/absolute/path/to/ggml-base.en.bin
    #   WHISPER_BIN=/absolute/path/to/whisper.cpp/main

If playback is silent but the JSON shows bytes > 0, your mp3 is at /tmp/aegis_one.mp3
You can play it manually with:
  afplay /tmp/aegis_one.mp3     # macOS
  ffplay -nodisp -autoexit /tmp/aegis_one.mp3

TXT