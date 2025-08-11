#!/bin/bash
. ./scripts/lib/env_guard.sh
set -euo pipefail
DIR="${1:-logs/voice/full_pipeline}"
KEEP="${2:-10}"

# nothing to do if directory missing
[ -d "$DIR" ] || exit 0

# keep newest $KEEP, delete the rest
# shellcheck disable=SC2012
FILES=$(ls -1t "$DIR"/* 2>/dev/null || true)
COUNT=0
for f in $FILES; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -le "$KEEP" ]; then
    continue
  fi
  rm -f -- "$f" || true
done