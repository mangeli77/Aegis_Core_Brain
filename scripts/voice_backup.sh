#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NVM_NODE="/Users/Aegis/.nvm/versions/node/v18.20.8/bin"
export PATH="$NVM_NODE:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

mkdir -p backups dataset logs/cron

# include all manifests and curated pairs
tar -czf "backups/voice_dataset_$(date '+%Y-%m-%d').tgz" \
  dataset/*.jsonl core/voice/output/voice2_pairs 2>/dev/null || true

echo "$(date '+%Y-%m-%dT%H:%M:%S%z') backup done" >> logs/cron/voice_backup.log