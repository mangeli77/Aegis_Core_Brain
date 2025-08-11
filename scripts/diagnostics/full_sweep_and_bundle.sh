#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_MJS="$ROOT/_env.mjs"
NODE_BIN="${NODE_BIN:-node}"

echo "== Preflight =="
# ensure our diag scripts are executable
chmod +x scripts/diagnostics/run_doctor.sh scripts/diagnostics/full_voice_pipeline_check.sh || true

echo "== Running doctor =="
scripts/diagnostics/run_doctor.sh

echo
echo "== Running full voice pipeline check =="
bash scripts/diagnostics/full_voice_pipeline_check.sh

echo
echo "== Building bundle =="
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="aegis_bundle_${STAMP}.zip"

# what we include/exclude:
#  - include code + scripts + voice assets + logs (keep for reference)
#  - exclude node_modules and .git (huge/noisy)
zip -r "$OUT" . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".DS_Store"

echo
echo "Bundle created: $OUT"
echo "Done."