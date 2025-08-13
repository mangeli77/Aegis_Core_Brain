#!/usr/bin/env bash
set -euo pipefail
log(){ printf "\033[36m==> %s\033[0m\n" "$*"; }
warn(){ printf "\033[33m[warn]\033[0m %s\n" "$*"; }
fail(){ printf "\033[31m[fail]\033[0m %s\n" "$*"; exit 1; }

log "CI driver start"

# Use CI-friendly install
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  log "npm ci"
  npm ci
else
  log "npm install"
  npm install
fi

# Build (if you have it)
if npm run -s | grep -qE '^  build'; then
  log "npm run -s build"
  npm run -s build
else
  warn "no build script; skipping"
fi

# Audits (if present)
if [ -f tools/audits/runtime_invariants.mjs ]; then
  log "node tools/audits/runtime_invariants.mjs"
  node tools/audits/runtime_invariants.mjs
else
  warn "no invariants; skipping"
fi

# Health
if npm run -s | grep -qE '^  health:ci'; then
  log "npm run -s health:ci"
  npm run -s health:ci || fail "health:ci failed"
elif [ -f runtime/cli/health.mjs ]; then
  log "node runtime/cli/health.mjs"
  node runtime/cli/health.mjs || fail "health.mjs failed"
else
  warn "no health script; skipping"
fi

# Optional voice smoke (only if secrets are present and script exists)
if [[ -n "${ELEVENLABS_API_KEY:-}" && -n "${ELEVENLABS_VOICE_ID:-}" ]] \
   && npm run -s | grep -qE '^  voice:play:one'; then
  log "voice smoke test"
  npm run -s voice:play:one -- "CI smoke: Aegis is online." > /tmp/voice_smoke.json
  BYTES=$(node -e "try{const o=JSON.parse(require('fs').readFileSync('/tmp/voice_smoke.json','utf8'));console.log(o.bytes||0)}catch(e){console.log(0)}")
  [[ "$BYTES" -gt 0 ]] || fail "voice smoke produced 0 bytes"
  log "voice smoke OK (bytes=$BYTES)"
else
  warn "voice smoke skipped (no secrets or script)"
fi

log "CI driver finished successfully"
