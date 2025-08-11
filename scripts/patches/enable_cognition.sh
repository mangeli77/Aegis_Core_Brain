#!/bin/bash
set -e

echo "🧠 Enabling Aegis cognition pipeline..."

# 1) Add cognition scripts to package.json
echo "🔧 Updating package.json scripts..."
npx json -I -f package.json -e '
this.scripts["think"]="node core/cognition/loops/voice_cognition_core.mjs";
this.scripts["think:dry"]="DRY_RUN=1 node core/cognition/loops/voice_cognition_core.mjs";
this.scripts["think:watch"]="NODE_OPTIONS=--watch node core/cognition/loops/voice_cognition_core.mjs";
this.scripts["brain:route"]="node core/routing/llm-router.mjs";
'

# 2) Ensure logs directory exists
COG_LOG_DIR="logs/cognition"
mkdir -p "$COG_LOG_DIR"
touch "$COG_LOG_DIR/.gitkeep"

# 3) Patch cognition loop to use llm-router + env_guard
COG_LOOP="core/cognition/loops/voice_cognition_core.mjs"
if ! grep -q "env_guard" "$COG_LOOP"; then
  echo "🔧 Patching $COG_LOOP for env_guard + router..."
  sed -i.bak '1i\
import { requireEnv } from "../../../voice/utils/env_guard.mjs";\
import { routeLLM } from "../../routing/llm-router.mjs";\
requireEnv(["OLLAMA_HOST","OLLAMA_MODEL","OPENAI_API_KEY"]);\
' "$COG_LOOP"
  echo "✅ Patched $COG_LOOP"
fi

# 4) Ensure .env contains needed vars
if ! grep -q "OLLAMA_HOST" .env; then
  cat <<EOF >> .env

# --- Cognition Defaults ---
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama2:latest
SPEAK_ON_THOUGHT=false
THOUGHT_LOG_DIR=logs/cognition
EOF
  echo "✅ Added cognition defaults to .env"
fi

echo "🎯 Cognition pipeline enabled. Test it with:"
echo "   npm run think:dry    # Log only"
echo "   npm run think        # Log + (optional) speech"