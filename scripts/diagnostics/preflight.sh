#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

echo "== Preflight =="
command -v node >/dev/null || { echo "Node not found"; exit 1; }
command -v curl >/dev/null || { echo "curl not found"; exit 1; }

# key/voice sanity
KEY="${ELEVENLABS_API_KEY:-${ELEVENLABS_KEY:-}}"
VID="${ELEVENLABS_VOICE_ID:-}"
[[ -z "$KEY" ]] && echo "⚠️  ELEVENLABS_API_KEY missing" && exit 2
[[ ${#KEY} -lt 40 ]] && echo "⚠️  API key too short (${#KEY})" && exit 2
[[ -z "$VID" ]] && echo "⚠️  ELEVENLABS_VOICE_ID missing (doctor will still pass, tiny TTS will fallback)" || true

# disk space (>= 200MB)
FREE=$(df -Pm . | awk 'NR==2{print $4}')
[[ "$FREE" -lt 200 ]] && { echo "⚠️  Low disk space (${FREE}MB)"; exit 3; }

echo "Preflight OK."