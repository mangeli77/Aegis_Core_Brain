#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root from this script's location
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
TARGET="$ROOT/_env.mjs"

echo "== Aegis env_guard import fixer =="
echo "Repo root:  $ROOT"
echo "Target file: $TARGET"

if [[ ! -f "$TARGET" ]]; then
  echo "❌ _env.mjs not found at: $TARGET"
  echo "   Are you running this inside the repo root?"
  exit 1
fi

# Make a timestamped backup
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP="$TARGET.bak.$STAMP"
cp "$TARGET" "$BACKUP"
echo "🗄️  Backup created: $BACKUP"

# Normalize any variant of the import path to the correct relative one.
# Matches these bad forms:
#   from '/voice/utils/env_guard.mjs'
#   from 'voice/utils/env_guard.mjs'
#   from '../voice/utils/env_guard.mjs'
#   from '../../voice/utils/env_guard.mjs'
# and replaces them with:
#   from './voice/utils/env_guard.mjs'
#
# Using perl to avoid macOS vs GNU sed differences and to work on the whole file at once (-0777).
perl -0777 -pe "s@import\s*\{\s*([A-Za-z0-9_,\s]+)\}\s*from\s*(['\"])(?:/|\.{0,2}/)?voice/utils/env_guard\.mjs\2;@import { \1 } from './voice/utils/env_guard.mjs';@g" \
  "$TARGET" > "$TARGET.tmp"

mv "$TARGET.tmp" "$TARGET"
echo "✅ _env.mjs updated to use:  import { ... } from './voice/utils/env_guard.mjs';"

# Quick verification: try to import _env.mjs from the repo root
echo "🔎 Verifying import..."
(
  cd "$ROOT"
  node -e "import('./_env.mjs').then(()=>console.log('✅ _env.mjs import OK')).catch(e=>{console.error('❌ import failed:', e?.message || e); process.exit(1)})"
)