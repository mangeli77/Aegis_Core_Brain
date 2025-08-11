#!/usr/bin/env bash
set -euo pipefail

echo "== Upgrade env_guard calls (varargs → array) =="

NODE_BIN="${NODE_BIN:-node}"
SCRIPT="scripts/patches/codemods/upgradeEnvGuardCalls.mjs"

if [[ "${DRY:-0}" == "1" ]]; then
  echo "Running in DRY mode (no files will be changed)..."
fi

# Ensure codemod exists
if [[ ! -f "$SCRIPT" ]]; then
  echo "ERROR: codemod not found at $SCRIPT"
  exit 1
fi

$NODE_BIN "$SCRIPT"

echo
echo "Tip:"
echo "  • Backups saved with suffix .bak.envimport"
echo "  • To review: git diff"
echo "  • To clean backups when satisfied: find . -name '*.bak.envimport' -delete"