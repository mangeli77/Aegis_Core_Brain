#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NVM_NODE="/Users/Aegis/.nvm/versions/node/v18.20.8/bin"
export PATH="$NVM_NODE:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

mkdir -p logs/cron

# prune whisper scratch older than 14 days
find core/voice/output -type f -name "*_whisper.txt" -mtime +14 -delete 2>/dev/null || true
# rotate ffmpeg/tmp leftovers older than 7 days
find core/voice/output -type f -name "*.tmp" -mtime +7 -delete 2>/dev/null || true

echo "$(date '+%Y-%m-%dT%H:%M:%S%z') housekeeping ok" >> logs/cron/voice_housekeeping.log