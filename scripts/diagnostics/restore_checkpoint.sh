#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
# scripts/diagnostics/restore_checkpoint.sh
set -euo pipefail

ZIP="${1:-}"
if [[ -z "$ZIP" || ! -f "$ZIP" ]]; then
  echo "Usage: $0 checkpoints/<aegis_checkpoint_...>.zip"
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "⚠️  This will overwrite files in: $ROOT"
read -r -p "Proceed restoring from '$ZIP'? [y/N] " ans
[[ "${ans:-}" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

unzip -qo "$ZIP" -d "$ROOT"
echo "✅ Restored from $ZIP"

echo "Tip: if you tagged that checkpoint, you can also switch code with:"
echo "     git checkout <tag>"