#!/bin/bash
. ./scripts/lib/env_guard.sh
# scripts/maintenance/set-latest-checkpoint.sh
# Marks the most recent checkpoint as the "LATEST" save point

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

CHECKPOINT_DIR="$ROOT_DIR/checkpoints"

# Find latest .zip in checkpoints
LATEST_FILE=$(ls -t "$CHECKPOINT_DIR"/*.zip | head -1)

if [[ -z "$LATEST_FILE" ]]; then
    echo "❌ No checkpoint .zip found in $CHECKPOINT_DIR"
    exit 1
fi

# Create/overwrite the symlink
ln -sfn "$(basename "$LATEST_FILE")" "$CHECKPOINT_DIR/LATEST.zip"

# Create/overwrite checksum
shasum -a 256 "$LATEST_FILE" | tee "$CHECKPOINT_DIR/LATEST.sha256" >/dev/null

echo "✅ Latest checkpoint set:"
ls -l "$CHECKPOINT_DIR/LATEST.zip" "$CHECKPOINT_DIR/LATEST.sha256"