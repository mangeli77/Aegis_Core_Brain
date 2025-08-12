#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

start_ts=$(date +%s)
log_dir="logs/voice/full_pipeline"
mkdir -p "$log_dir"
log_file="$log_dir/full_$(date -u +%Y-%m-%dT%H-%M-%SZ).log"

echo "🔄 Starting full voice pipeline test @ $(date -u +"%F %T") UTC"
echo "Repo: $ROOT_DIR"
echo "Log:  $log_file"
echo "-----------------------------------------------" | tee -a "$log_file"

# Quick env sanity (don’t fail if you’re only using local TTS)
if [[ "${ENABLE_ELEVENLABS_TTS:-}" == "true" ]]; then
  if [[ -z "${ELEVENLABS_API_KEY:-}" ]]; then
    echo "⚠️  ENABLE_ELEVENLABS_TTS=true but ELEVENLABS_API_KEY is empty." | tee -a "$log_file"
    echo "    Add it to .env or export it before running." | tee -a "$log_file"
  fi
fi

run() {
  echo "" | tee -a "$log_file"
  echo "▶ $*" | tee -a "$log_file"
  echo "-----------------------------------------------" | tee -a "$log_file"
  "$@" 2>&1 | tee -a "$log_file"
}

# 1) Synthesis (rebuild + verify + retry)
run node scripts/maintenance/rebuild_variation_tests.mjs --verify-retry

# 2) Transcribe missing pairs (local Whisper or remote—your util picks the backend)
run node scripts/maintenance/transcribe_variation_files.mjs

# 3) Audit + self-heal (pairs, short files, etc.)
run bash scripts/maintenance/run_nightly_voice_audit.sh

# 4) Cognition pass (doesn’t fail the pipeline if you prefer—set -e keeps it strict)
run node cognition/loops/voice_cognition_core.mjs

# 5) Pair sanity: every category in every line has mp3+txt
echo "" | tee -a "$log_file"
echo "🔎 Pair sanity check (mp3 ↔ txt)" | tee -a "$log_file"
bash -lc '
ROOT="core/voice/output/variation_tests"
missing=0
for d in $(find "$ROOT" -type d -maxdepth 1 -name "line_*" | sort); do
  for b in apologetic assertive bonding charismatic compassionate confident defensive frustrated humorous neutral reflective sarcastic technical; do
    mp3="$d/${b}_sample.mp3"
    txt="$d/${b}_sample.txt"
    if [[ -f "$mp3" && ! -f "$txt" ]]; then
      echo "⚠️  Missing .txt for: ${mp3#"$ROOT/"}"
      ((missing++)) || true
    fi
    if [[ -f "$txt" && ! -f "$mp3" ]]; then
      echo "⚠️  Missing .mp3 for: ${txt#"$ROOT/"}"
      ((missing++)) || true
    fi
  done
done
if [[ $missing -eq 0 ]]; then
  echo "✅ All pairs present."
else
  echo "❌ Pair issues found: $missing"
  exit 1
fi
' 2>&1 | tee -a "$log_file"

end_ts=$(date +%s)
echo "" | tee -a "$log_file"
echo "✅ Full voice pipeline test complete in $((end_ts - start_ts))s" | tee -a "$log_file"
echo "📄 Log file: $log_file" | tee -a "$log_file"