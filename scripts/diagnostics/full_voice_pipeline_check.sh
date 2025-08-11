#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/logs/voice/full_pipeline"
mkdir -p "$LOG_DIR"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
LOG="$LOG_DIR/full_${STAMP}.log"

# nice colors
ok()    { printf "\033[32m✔\033[0m %s\n" "$*"; }
warn()  { printf "\033[33m⚠\033[0m %s\n" "$*"; }
err()   { printf "\033[31m✖\033[0m %s\n" "$*"; }

divider() { printf "\n\033[2m%s\033[0m\n" "────────────────────────────────────────────────────────"; }

# 0) Env probe (uses repo-root _env.mjs)
divider
echo "0) Env probe"
if node -e "import('./_env.mjs').then(()=>{const k=(process.env.ELEVENLABS_API_KEY||process.env.ELEVENLABS_KEY||''); console.log('env key head:', k.slice(0,6), 'len:', k.length);}).catch(e=>{console.error(e); process.exit(1);})"; then
  ok "env loaded"
else
  err "failed to load env"
  exit 2
fi

# 1) ElevenLabs auth probe (user / voices / tiny TTS)
divider
echo "1) ElevenLabs probe (user/voices/tts)…"
if node scripts/test/probe_elevenlabs_auth.mjs | tee -a "$LOG"; then
  ok "elevenlabs probe complete"
else
  err "elevenlabs probe failed (see $LOG)"
  exit 3
fi

# 2) Rebuild variation tests with verify+retry
divider
echo "2) Rebuild variation tests"
if node scripts/maintenance/rebuild_variation_tests.mjs --verify-retry | tee -a "$LOG"; then
  ok "variation rebuild step ran"
else
  err "variation rebuild failed (see $LOG)"
  exit 4
fi

# 3) Transcribe missing variation files (local Whisper)
divider
echo "3) Transcribe missing MP3s (local whisper)…"
if node scripts/maintenance/transcribe_variation_files.mjs | tee -a "$LOG"; then
  ok "transcription step ran"
else
  err "transcription step failed (see $LOG)"
  exit 5
fi

# 4) Nightly voice audit (sanity + cognition)
divider
echo "4) Nightly voice audit"
if bash scripts/maintenance/run_nightly_voice_audit.sh | tee -a "$LOG"; then
  ok "nightly voice audit ran"
else
  err "nightly voice audit failed (see $LOG)"
  exit 6
fi

divider
ok "Full voice pipeline test complete."
echo "Log file: $LOG"