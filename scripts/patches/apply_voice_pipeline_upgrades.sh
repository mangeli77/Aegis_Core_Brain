#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "== Aegis voice pipeline upgrade =="
echo "Project root: $ROOT_DIR"

mkdir -p scripts/diagnostics scripts/patches scripts/test voice/output logs/voice

# ---------------------------
# 1) Write upgraded run_doctor.sh
# ---------------------------
cat > scripts/diagnostics/run_doctor.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

# Flags (export to override):
#   QUIET=1        -> compact output
#   FAIL_FAST=1    -> exit immediately on any failure
#   KEEP_OUTPUT=1  -> do not delete old _smoke/batch_* before run
QUIET="${QUIET:-0}"
FAIL_FAST="${FAIL_FAST:-0}"
KEEP_OUTPUT="${KEEP_OUTPUT:-0}"

# Helpers
say()  { printf "%s\n" "$*"; }
hr()   { printf "%s\n" "--------------------------------------------"; }
ok()   { [ "$QUIET" = "1" ] || printf "✓ %s\n" "$*"; }
info() { [ "$QUIET" = "1" ] || printf "%s\n" "$*"; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }

section() { [ "$QUIET" = "1" ] || { echo; hr; printf "== %s ==\n" "$*"; hr; }; }
step()    { [ "$QUIET" = "1" ] || { echo; printf "0) %s\n" "$*"; }; }

# Fail-fast handler
ff() { if [ "$FAIL_FAST" = "1" ]; then die "$1"; else say "❌ $1"; fi; }

# Disk preflight (~200MB)
section "Preflight"
FREE_MB="$(df -Pm . | awk 'NR==2{print $4}')"
if [ -z "$FREE_MB" ] || [ "$FREE_MB" -lt 200 ]; then
  die "Low disk space (<200MB). Free some space and retry."
fi
ok "Disk space OK (${FREE_MB}MB free)"

# Optional cleanup
if [ "$KEEP_OUTPUT" != "1" ]; then
  rm -rf voice/output/_smoke voice/output/batch_*
  ok "Old outputs cleaned"
else
  info "KEEP_OUTPUT=1 -> old outputs preserved"
fi

# Utility one-liners
env_ok() {
  node --input-type=module -e "import('./_env.mjs').then(()=>console.log('env OK')).catch(e=>{console.error(e);process.exit(1)})" >/dev/null
}

run_node() {
  node --input-type=module -e "$1"
}

# 1) Env probe
section "Doctor"
step "Env probe"
if env_ok; then
  ok "env loaded"
else
  ff "Failed to load ./_env.mjs"
fi

# 2) ElevenLabs auth probe (requires scripts/test/probe_elevenlabs_auth.mjs)
step "ElevenLabs auth probe"
if node scripts/test/probe_elevenlabs_auth.mjs >/dev/null 2>&1; then
  ok "elevenlabs auth probe OK"
else
  ff "ElevenLabs probe failed"
fi

# 3) Tiny TTS (skip if no voice id)
step "Tiny TTS (skips if no VOICE_ID)"
VOICE_ID="$(node --input-type=module -e "import('./_env.mjs').then(()=>console.log(process.env.ELEVENLABS_VOICE_ID||''))")"
if [ -n "$VOICE_ID" ]; then
  if node scripts/test/tts_router_smoke.mjs >/dev/null 2>&1; then
    ok "tiny saved: voice/output/_smoke/el_test.mp3"
  else
    ff "Tiny TTS failed"
  fi
else
  ok "skipped (no ELEVENLABS_VOICE_ID)"
fi

# 4) Batch smoke (requires scripts/test/tts_router_batch.mjs)
step "Batch test"
if node scripts/test/tts_router_batch.mjs >/dev/null 2>&1; then
  latest_batch="$(ls -dt voice/output/batch_* 2>/dev/null | head -n1 || true)"
  if [ -n "$latest_batch" ]; then
    ok "batch test OK"
    [ "$QUIET" = "1" ] || {
      echo "Done. Output folder: ${latest_batch}"
      ls -lh "${latest_batch}"/sample_*.mp3 || true
    }
  else
    ff "Batch folder not found"
  fi
else
  ff "Batch test failed"
fi

[ "$QUIET" = "1" ] || {
  echo
  echo "Doctor finished."
  echo "📁 Latest batch folder: $(ls -dt voice/output/batch_* 2>/dev/null | head -n1 || echo '<none>')"
}
BASH

chmod +x scripts/diagnostics/run_doctor.sh
echo "✓ wrote scripts/diagnostics/run_doctor.sh"

# ---------------------------
# 2) Merge npm scripts into package.json (safe)
# ---------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js required to patch package.json"; exit 1
fi

node <<'NODE'
const fs = require('fs');

const path = 'package.json';
if (!fs.existsSync(path)) {
  console.error('package.json not found');
  process.exit(1);
}
const json = JSON.parse(fs.readFileSync(path, 'utf8'));
json.scripts = json.scripts || {};

const add = (k,v) => { json.scripts[k] = v; };

// keep existing doctor/full:pipeline if present; add/overwrite the new helpers
add('doctor', 'bash scripts/diagnostics/run_doctor.sh');
add('doctor:ci', 'QUIET=1 FAIL_FAST=1 bash scripts/diagnostics/run_doctor.sh');

add('clean:smoke', 'rm -rf voice/output/_smoke');
add('clean:batch', 'rm -rf voice/output/batch_*');
add('clean:all', 'npm run clean:smoke && npm run clean:batch');

add('validate-and-checkpoint', 'npm run full:pipeline && npm run checkpoint');

fs.writeFileSync(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log('✓ patched package.json scripts');
NODE

# ---------------------------
# 3) Final notes
# ---------------------------
echo "== Done =="
echo "Try:"
echo "  npm run doctor            # verbose doctor"
echo "  npm run doctor:ci         # quiet, fail-fast (CI/cron)"
echo "  npm run clean:all         # clear outputs"
echo "  npm run validate-and-checkpoint"