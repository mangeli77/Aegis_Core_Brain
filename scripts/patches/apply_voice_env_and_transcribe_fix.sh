#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "Repo root : $ROOT"
echo "ENV file  : $ROOT/.env"
echo

# 0) sanity
if [[ ! -f ".env" ]]; then
  echo "❌ No .env found at $ROOT/.env"; exit 1
fi

# 1) Ensure _env.mjs exists (you already have it, but keep it safe)
if [[ ! -f "_env.mjs" ]]; then
  cat > _env.mjs <<'EOF'
import dotenv from 'dotenv';
const result = dotenv.config();
const parsed = result.parsed || {};

// Prefer non-empty shell value, else take .env, and set process.env for this process
function preferNonEmpty(key) {
  const shellVal = process.env[key];
  if (shellVal && shellVal.trim() !== '') return shellVal;

  const fileVal = parsed[key];
  if (fileVal && fileVal.trim() !== '') {
    process.env[key] = fileVal;
    return fileVal;
  }
  return shellVal || '';
}

// Keys we care about
preferNonEmpty('OPENAI_API_KEY');
preferNonEmpty('ELEVENLABS_API_KEY');
preferNonEmpty('ELEVENLABS_KEY');       // legacy alias
preferNonEmpty('ELEVENLABS_VOICE_ID');

export {};
EOF
  echo "🧩 Wrote _env.mjs"
else
  echo "🧩 _env.mjs present"
fi

# 2) Make a compatibility bridge so both imports work (_env.js and _env.mjs)
if [[ ! -f "_env.js" ]]; then
  cat > _env.js <<'EOF'
import './_env.mjs';
EOF
  echo "🔗 Created _env.js shim -> _env.mjs"
else
  echo "🔗 _env.js shim already present"
fi

# 3) Run the import patcher (dedupe + correct relative import)
if [[ -x "scripts/patches/patch_env_imports.sh" ]]; then
  echo; echo "▶ Running env import patcher…"
  bash scripts/patches/patch_env_imports.sh
else
  echo "⚠️  scripts/patches/patch_env_imports.sh not found or not executable."
  echo "    (If you want I can generate one here.)"
fi

# 4) Best‑effort patch: transcribe_variation_files.mjs to strictly pick audio files
TRANSCRIBE="scripts/maintenance/transcribe_variation_files.mjs"
if [[ -f "$TRANSCRIBE" ]]; then
  echo; echo "▶ Patching $TRANSCRIBE to only process audio files (best‑effort)…"
  cp "$TRANSCRIBE" "${TRANSCRIBE}.bak.audiofilter.$(date +%Y%m%d%H%M%S)"

  # Insert a tiny helper after the first import block if not already present
  if ! grep -q "function __isAudioExt" "$TRANSCRIBE"; then
    # Put helper after the first import line
    awk '
      BEGIN{done=0}
      {
        print $0
        if(done==0 && $0 ~ /^import /){
          # keep printing imports; delay insertion until the end of import block
          nextline=$0
        }
      }
    ' "$TRANSCRIBE" >/dev/null 2>&1

    # Simpler: just prepend helper if not found
    tmp="$(mktemp)"
    cat > "$tmp" <<'EOF'
/* --- injected by apply_voice_env_and_transcribe_fix.sh --- */
function __isAudioExt(p) {
  const ext = (p.split('.').pop() || '').toLowerCase();
  return ['mp3','wav','m4a','flac','aac','ogg','webm'].includes(ext);
}
/* --- end injection --- */

EOF
    cat "$tmp" "$TRANSCRIBE" > "${TRANSCRIBE}.tmp" && mv "${TRANSCRIBE}.tmp" "$TRANSCRIBE"
    rm -f "$tmp"
  fi

  # Try to harden any naive file list usage (a few common patterns)
  #  - replace `files = files.filter(...` or just append a guard before loops
  if ! grep -q "__isAudioExt(" "$TRANSCRIBE"; then
    # append a guard just before the first for-of over files if present
    sed -i '' -e '0,/\(for\s*(const\s\+\w\+\s\+of\s\+\w\+\)\)/s//const __audioOnly = (arr) => arr.filter(p => __isAudioExt(p));\n\1/' "$TRANSCRIBE" || true
    # common variable names
    sed -i '' -e 's/\bfor (const f of files)/for (const f of __audioOnly(files))/g' "$TRANSCRIBE" || true
    sed -i '' -e 's/\bfor (const f of allFiles)/for (const f of __audioOnly(allFiles))/g' "$TRANSCRIBE" || true
  fi

  echo "   ✓ Backed up to ${TRANSCRIBE}.bak.audiofilter.*"
else
  echo "ℹ️  $TRANSCRIBE not found; skipping audio filter patch."
fi

# 5) Quick probe: confirm ELEVENLABS_API_KEY & voiceId in the same runtime
echo; echo "▶ Probing ElevenLabs env from tts_router.mjs…"
node -e "import('./voice/utils/tts_router.mjs').then(async m => { console.log('prov', process.env.TTS_PROVIDER||'(none)'); console.log('keyLen', (process.env.ELEVENLABS_API_KEY||'').length, 'keyHead', (process.env.ELEVENLABS_API_KEY||'').slice(0,6)); console.log('voiceId', process.env.ELEVENLABS_VOICE_ID); try { await m.speak('router tiny test', 'voice/output/variation_tests/line_001/test_router.mp3'); console.log('speak OK'); } catch(e){ console.error('speak ERR', e?.status||'', e?.message||e); } })" || true

# 6) Run the full pipeline test
if [[ -x "scripts/diagnostics/test_full_voice_pipeline.sh" ]]; then
  echo; echo "▶ Running full pipeline test…"
  bash scripts/diagnostics/test_full_voice_pipeline.sh
else
  echo; echo "ℹ️  scripts/diagnostics/test_full_voice_pipeline.sh not found; skipping."
fi

echo; echo "✅ Done."