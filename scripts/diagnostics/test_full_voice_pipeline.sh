#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Paths & logging
# ──────────────────────────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT/logs/voice/full_pipeline"
mkdir -p "$LOG_DIR"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
LOG="$LOG_DIR/full_${STAMP}.log"

echo "Full Voice Pipeline Test • $(date)"
echo "Repo: $ROOT"
echo "Log : $LOG"
echo "──────────────────────────────────────────────────────────────────────────────" | tee -a "$LOG"

# ──────────────────────────────────────────────────────────────────────────────
# 0) Env probe (runs as ESM, so 'import' is valid)
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "0) Env probe" | tee -a "$LOG"
TMP_ENV_MJS="$(mktemp "$ROOT/.tmp_env_probe.XXXXXX.mjs")"
cat > "$TMP_ENV_MJS" <<EOF
import '${ROOT}/_env.mjs';
console.log('_env.mjs load: OK');
console.log('ELEVENLABS key present:', !!process.env.ELEVENLABS_API_KEY);
console.log('ELEVENLABS voice id:', process.env.ELEVENLABS_VOICE_ID || '(not set)');
EOF
node "$TMP_ENV_MJS" | tee -a "$LOG"
rm -f "$TMP_ENV_MJS"

# ──────────────────────────────────────────────────────────────────────────────
# 1) Rebuild variation tests (synthesize + verify + retry)
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "1) Rebuild variation tests (verify+retry)" | tee -a "$LOG"
node "$ROOT/scripts/maintenance/rebuild_variation_tests.mjs" --verify-retry | tee -a "$LOG"

# ──────────────────────────────────────────────────────────────────────────────
# 2) Transcribe any missing text from mp3s (local Whisper)
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "2) Transcribe missing variation files (local Whisper)" | tee -a "$LOG"
node "$ROOT/scripts/maintenance/transcribe_variation_files.mjs" | tee -a "$LOG"

# ──────────────────────────────────────────────────────────────────────────────
# 3) Nightly-style audit (sanity check + cognition scan)
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "3) Nightly voice audit (sanity & cognition scan)" | tee -a "$LOG"
bash "$ROOT/scripts/maintenance/run_nightly_voice_audit.sh" | tee -a "$LOG"

# ──────────────────────────────────────────────────────────────────────────────
# 4) Done
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "✅ Full voice pipeline test complete." | tee -a "$LOG"
echo "Log file: $LOG"