#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
# Baseline builder: runs a fast system check, the full voice pipeline, and makes a checkpoint.
# Designed to print *live* logs (run this script with `bash -x` or via `npm run baseline` below).

set -Eeuo pipefail

# --------------- helpers ----------------
ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
section() { echo -e "\n== $1 =="; }
info() { echo "• $*"; }
ok()   { echo "✓ $*"; }
err()  { echo "✗ $*" >&2; }

# --------------- preflight --------------
section "Baseline: preflight"
info "project: $(pwd)"
info "node:    $(node -v | sed 's/^v//')"
info "npm:     $(npm -v)"

# --------------- quick health check -----
section "Baseline: quick health check"
# syscheck prints OpenAI/ElevenLabs/Ollama + tiny TTS smoke
if npm run -s syscheck; then
  ok "syscheck passed"
else
  err "syscheck failed"
  exit 1
fi

# --------------- full pipeline ----------
section "Baseline: full pipeline"
# Full voice pipeline: env probe, rebuild variations, local whisper transcribe, nightly audit, rotate logs
if npm run -s full:pipeline; then
  ok "full pipeline finished"
else
  err "full pipeline failed"
  exit 1
fi

# --------------- checkpoint -------------
section "Baseline: checkpoint"
if npm run -s checkpoint; then
  LATEST="$(ls -t checkpoints/*.zip 2>/dev/null | head -n 1 || true)"
  if [[ -n "${LATEST:-}" ]]; then
    ok "checkpoint created: ${LATEST}"
  else
    err "checkpoint step ran but no zip found in ./checkpoints"
    exit 1
  fi
else
  err "checkpoint step failed"
  exit 1
fi

# --------------- summary ----------------
section "Baseline: done"
ok "All steps completed successfully at $(ts)"