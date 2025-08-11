#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ZIP="${1:-checkpoints/baseline_latest.zip}"

if [ ! -f "$ZIP" ]; then
  echo "Baseline zip not found: $ZIP"
  exit 1
fi

echo "== Restore baseline =="
echo "Using: $ZIP"
bash scripts/diagnostics/restore_checkpoint.sh "$ZIP"

echo ""
echo "== Re-run quick health check =="
spm run syscheck