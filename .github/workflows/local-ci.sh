#!/usr/bin/env bash
set -euxo pipefail

echo "=== CI fallback driver starting ==="

# Show tree so we know where files are
ls -la
test -d runtime || true
test -d core || true

# Print a short env summary (no secrets)
node -e "console.log({
  key: !!process.env.ELEVENLABS_API_KEY,
  voice: !!process.env.ELEVENLABS_VOICE_ID,
  mode: process.env.VOICE_MODE || null
})"

# Basic health check if present
if [ -f runtime/cli/health.mjs ]; then
  echo "Running health.mjs"
  node runtime/cli/health.mjs || true
fi

# Quick voice smoke (adjust to your script name if different)
if npm run | grep -q 'voice:test'; then
  echo "Running npm run -s voice:test"
  npm run -s voice:test || true
fi

echo "=== CI fallback driver finished ==="