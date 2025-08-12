#!/usr/bin/env bash
set -euo pipefail

# repo root = this script's parent dir's parent
cd "$(dirname "$0")/.."

# Load only the EL secrets from .env (ignore comments/blank lines)
if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(ELEVENLABS_API_KEY|ELEVENLABS_VOICE_ID)=' .env | sed 's/#.*//' | xargs)
fi

# Force ElevenLabs mode for this run
export VOICE_MODE=elevenlabs

# Run the full cycle; it already does the right things
exec /Users/Aegis/Aegis/scripts/voice_full_cycle.sh
