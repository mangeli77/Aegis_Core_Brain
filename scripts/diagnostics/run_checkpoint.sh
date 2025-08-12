#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%dT%H%M%S)"
OUTDIR="checkpoints"
mkdir -p "$OUTDIR"

echo "== Validate =="
bash scripts/diagnostics/run_validate.sh

echo "== Manifest =="
MAN="$OUTDIR/.aegis_checkpoint_${STAMP}.json"
{
  echo '{'
  echo "  \"timestamp\": \"${STAMP}\","
  echo "  \"node\": \"$(node -v)\","
  echo "  \"npm\": \"$(npm -v)\","
  echo "  \"python\": \"$(python3 -V 2>&1)\""
  echo '}'
} > "$MAN"

echo "== Slim bundle =="
SLIM="$OUTDIR/aegis_slim_${STAMP}.zip"

# Zip only SOURCE + CONFIG + SCRIPTS (skip heavy deps & caches)
zip -rq "$SLIM" \
  Aegis voice cognition core logs scripts package.json package-lock.json .env \
  -x '*.git*' '*.DS_Store' '__pycache__/*' '*.pyc' \
  -x 'node_modules/*' 'aegis-tts-env/*' 'checkpoints/*' 'core/voice/output/**'

# include the manifest
zip -q "$SLIM" "$MAN"

echo "✓ Slim checkpoint created:"
echo "   $SLIM"