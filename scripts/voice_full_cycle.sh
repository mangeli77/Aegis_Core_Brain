#!/bin/bash
set -euo pipefail
trap 'echo "[fullcycle] aborted" >&2' INT TERM

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # /Users/Aegis/Aegis/scripts -> /Users/Aegis/Aegis
cd "$ROOT"

# --- PATH for launchd (no shell rc sourced) ---
# ...top of voice_full_cycle.sh (after PATH exports)
export VOICE_MODE=local
unset ELEVENLABS_API_KEY ELEVENLABS_VOICE_ID   # make sure we don't half-configure EL

mkdir -p logs/cron

stamp="$(date '+%Y-%m-%dT%H:%M:%S%z')"  # portable on macOS
echo "$stamp  starting voice full cycle" | tee -a logs/cron/voice_full_cycle.out.log

# 1) refresh manifests (safe if they already exist)
node core/voice/utils/build_styles_manifest.mjs      2>&1 | tee -a logs/cron/voice_full_cycle.out.log
# if you also want the non-styles set in the pool:
# node core/voice/utils/build_voice2_manifest.mjs   2>&1 | tee -a logs/cron/voice_full_cycle.out.log

# 2) generate new clips (batch size via BATCH env)
BATCH="${BATCH:-24}" MANIFEST="dataset/voice2_styles_manifest.jsonl" \
node jobs/voice_grow.mjs                             2>&1 | tee -a logs/cron/voice_full_cycle.out.log

echo "$(date '+%Y-%m-%dT%H:%M:%S%z')  cycle complete" | tee -a logs/cron/voice_full_cycle.out.log