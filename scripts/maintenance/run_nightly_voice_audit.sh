. ./scripts/lib/env_guard.sh
# File: scripts/maintenance/run_nightly_voice_audit.sh
#!/usr/bin/env bash
set -euo pipefail

# --- project root ---
cd "$(dirname "$0")/../.."

# --- make sure node is available (works with or without nvm) ---
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
  nvm use 18 >/dev/null 2>&1 || true
fi

export NODE_ENV=production

# --- logs ---
mkdir -p logs/voice
LOG="logs/voice/nightly_$(date +%F).log"

echo "[$(date)] Nightly voice audit starting..." >> "$LOG"
node scripts/maintenance/nightly_voice_audit.mjs >> "$LOG" 2>&1
echo "[$(date)] Nightly voice audit finished." >> "$LOG"