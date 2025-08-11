#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

# --- locate repo root (directory that contains this script, then go up) ------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_MJS="${ROOT}/_env.mjs"

if [[ ! -f "${ENV_MJS}" ]]; then
  echo "❌ _env.mjs not found at ${ENV_MJS}"
  exit 1
fi

echo "Repo root : ${ROOT}"
echo "ENV file  : ${ENV_MJS}"
echo

# --- helper: compute rel import to _env.mjs based on known buckets -----------
# We keep this simple and explicit (no fragile realpath gymnastics).
rel_to_env() {
  local abs="$1"
  case "$abs" in
    "${ROOT}/voice/utils/"*)
      printf '%s' '../../../_env.mjs'
      ;;
    "${ROOT}/cognition/loops/"*)
      printf '%s' '../../_env.mjs'
      ;;
    "${ROOT}/scripts/maintenance/"*|\
    "${ROOT}/scripts/test/"*|\
    "${ROOT}/scripts/diagnostics/"*)
      printf '%s' '../../_env.mjs'
      ;;
    *)
      # Fallback: assume file lives 1 level below root
      printf '%s' '../_env.mjs'
      ;;
  esac
}

# --- files we patch ----------------------------------------------------------
FILES=(
  # cognition / voice loops
  "${ROOT}/cognition/loops/voice_cognition_core.mjs"

  # maintenance
  "${ROOT}/scripts/maintenance/rebuild_variation_tests.mjs"
  "${ROOT}/scripts/maintenance/transcribe_variation_files.mjs"
  "${ROOT}/scripts/maintenance/transcribe_defensive_only.mjs"
  "${ROOT}/scripts/maintenance/synthesize_variation_batches.mjs"

  # test
  "${ROOT}/scripts/test/test_api_keys.mjs"
  "${ROOT}/scripts/test/test_elevenlabs_direct.mjs"
  "${ROOT}/scripts/test/test_elevenlabs_tts_direct.mjs"
  "${ROOT}/scripts/test/test_openai.mjs"

  # voice utils
  "${ROOT}/voice/utils/tts_router.mjs"
  "${ROOT}/voice/utils/elevenlabs_tts.mjs"
  "${ROOT}/voice/utils/whisper_transcriber.mjs"
  "${ROOT}/voice/utils/local_tts.mjs"
  "${ROOT}/voice/utils/local_tts_setup.mjs"
  "${ROOT}/voice/utils/emotion_weights.mjs"
)

# --- helper: patch a single file --------------------------------------------
patch_one() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  local rel; rel="$(rel_to_env "$file")"
  local importLine="import '${rel}';"
  local tmp; tmp="$(mktemp)"

  # Strip any existing _env.mjs import first (avoid duplicates)
  # Matches: import '.../_env.mjs';
  sed -E "/^[[:space:]]*import[[:space:]]+['\"][^'\"]*\/_env\.mjs['\"][[:space:]]*;[[:space:]]*$/d" "$file" > "$tmp"

  # Insert our import at line 2 if file has a shebang, else at line 1
  if head -n 1 "$tmp" | grep -q '^#!'; then
    # Keep shebang on line 1
    { head -n 1 "$tmp"; echo "$importLine"; tail -n +2 "$tmp"; } > "${tmp}.ins"
  else
    # No shebang, place at top
    { echo "$importLine"; cat "$tmp"; } > "${tmp}.ins"
  fi

  mv "${tmp}.ins" "$file"
  rm -f "$tmp"

  # backup a copy for safety
  cp "$file" "${file}.bak.envimport"

  echo "patched: $file  (import '${rel}')"
}

# --- run patching ------------------------------------------------------------
patched_count=0
for f in "${FILES[@]}"; do
  if [[ -f "$f" ]]; then
    patch_one "$f"
    ((patched_count+=1))
  fi
done

echo
echo "✅ Patching complete. Backups kept as *.bak.envimport"
echo "   Files patched: ${patched_count}"
echo

# --- tiny verify (no secrets printed) ----------------------------------------
# Single-quoted heredoc prevents the shell from interpreting any quotes inside.
node - <<'JS'
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

try {
  const root = process.cwd();
  const envPath = path.join(root, '_env.mjs');
  if (!fs.existsSync(envPath)) {
    console.log('[verify] _env.mjs not found at', envPath);
  } else {
    await import(pathToFileURL(envPath).href);
    const k = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY || '';
    console.log('[verify] _env.mjs import: OK');
    console.log('[verify] elevenlabs head:', k ? k.slice(0,6) : '(empty)', 'len:', k.length);
  }
} catch (e) {
  console.error('[verify] env loader import: FAIL');
  console.error(e?.message || e);
  // do not fail the patch step
}
JS