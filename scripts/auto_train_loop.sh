#!/usr/bin/env bash
set -euo pipefail

export N="${N:-40}"
export CONCURRENCY="${CONCURRENCY:-6}"
export WER_MAX="${WER_MAX:-0.15}"
export CER_MAX="${CER_MAX:-0.10}"

while : ; do
  npm run -s voice:auto
  COUNT=$(ls core/voice/output/train/high_confidence/*.wav 2>/dev/null | wc -l | tr -d " ")
  echo "✅ high_confidence count: $COUNT"
  if [ "$COUNT" -ge 20 ]; then
    npm run -s train:auto
    break
  fi
done
