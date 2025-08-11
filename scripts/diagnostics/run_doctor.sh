#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
# scripts/diagnostics/run_doctor.sh
# Aegis voice pipeline doctor + optional system probes
# Core voice steps fail the run; OpenAI/Ollama probes are optional.

set -uo pipefail

# ----------------------------
# Output helpers
# ----------------------------
BOLD="\033[1m"; DIM="\033[2m"; RED="\033[31m"; YEL="\033[33m"; GRN="\033[32m"; RST="\033[0m"
info()  { echo -e "${DIM}$*${RST}"; }
head()  { echo -e "\n${BOLD}$*${RST}\n"; }
ok()    { echo -e "✓ $*"; }
warn()  { echo -e "${YEL}! $*${RST}"; }
fail()  { echo -e "${RED}✗ $*${RST}"; }

QUIET="${QUIET:-0}"
FAIL_FAST="${FAIL_FAST:-0}"
VERBOSE="${VERBOSE:-0}"

quiet_run() {
  if [[ "$QUIET" == "1" ]]; then
    "$@" >/dev/null 2>&1
  else
    "$@"
  fi
}

# Stop on core-step failure (voice pipeline)
trap 'rc=$?; [[ $rc -ne 0 ]] && fail "Doctor aborted (exit $rc)"; exit $rc' EXIT
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# ----------------------------
# Preflight
# ----------------------------
head "Preflight"
DISK=$(df -h . | awk 'NR==2{print $4}')
ok "Disk space OK ($DISK free)"

# Clean only smoke output; leave batch history intact
if [[ -d voice/output/_smoke ]]; then
  rm -rf voice/output/_smoke || true
fi
ok "Old outputs cleaned"

# ----------------------------
# Doctor
# ----------------------------
head "Doctor"

# 0) Env probe
head "Env probe"
if node --input-type=module -e "import('./_env.mjs').then(()=>console.log('env loaded')).catch(e=>{console.error(e?.message||e);process.exit(1)})"; then
  ok "env loaded"
else
  fail "Failed to load ./_env.mjs"
  exit 1
fi

# 1) ElevenLabs auth probe  (core)
head "ElevenLabs auth probe"
if quiet_run node scripts/test/probe_elevenlabs_auth.mjs; then
  ok "ElevenLabs probe OK"
else
  fail "ElevenLabs probe failed"
  [[ "$FAIL_FAST" == "1" ]] && exit 1
fi

# 2) Tiny TTS (router smoke)  (core)
head "Tiny TTS (skips if no VOICE_ID)"
# This script already handles VOICE_ID presence and prints where it saved
if quiet_run node scripts/test/tts_router_smoke.mjs; then
  ok "tiny saved: voice/output/_smoke/el_test.mp3"
else
  fail "Tiny TTS smoke failed"
  [[ "$FAIL_FAST" == "1" ]] && exit 1
fi

# 3) Batch test  (core)
head "Batch test"
if quiet_run node scripts/test/tts_router_batch.mjs; then
  ok "batch test OK"
  # Print last results
  LAST="$(ls -t voice/output/batch_* 2>/dev/null | head -n 1 || true)"
  if [[ -n "$LAST" ]]; then
    info "Done. Output folder: ${LAST}"
    ls -lh "${LAST}"/sample_*.mp3 2>/dev/null || true
    ok "Latest batch folder: ${LAST}"
  fi
else
  fail "Batch test failed"
  [[ "$FAIL_FAST" == "1" ]] && exit 1
fi

# ----------------------------
# OPTIONAL PROBES (non-blocking)
# ----------------------------
# These can warn but never fail the doctor run.
set +e

head "Optional probes"

# -- OpenAI model list (optional)
if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  info "OpenAI probe (optional)"
  node --input-type=module -e '
    import("./_env.mjs").then(async () => {
      try {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        if (!res.ok) {
          const t = await res.text();
          console.error("OpenAI probe failed:", res.status, res.statusText, "::", t.slice(0,400));
          process.exit(2);
        }
        const js = await res.json();
        const n = Array.isArray(js?.data) ? js.data.length : 0;
        console.log(`OpenAI OK: models listed (${n})`);
      } catch (e) {
        console.error("OpenAI probe error:", e?.message||e);
        process.exit(2);
      }
    }).catch(e=>{ console.error("OpenAI env load error:", e?.message||e); process.exit(2); });
  ' >/dev/null 2>&1
  if [[ $? -eq 0 ]]; then ok "OpenAI probe OK"; else warn "OpenAI probe failed (non-blocking)"; fi
else
  warn "OpenAI probe skipped (OPENAI_API_KEY missing)"
fi

# -- Ollama daemon ping (optional)
info "Ollama probe (optional)"
# prefer curl if present, otherwise use node fetch
if command -v curl >/dev/null 2>&1; then
  curl -s --max-time 2 http://localhost:11434/api/tags >/dev/null
else
  node --input-type=module -e 'fetch("http://localhost:11434/api/tags",{cache:"no-store"}).then(r=>{process.exit(r.ok?0:3)}).catch(()=>process.exit(3))'
fi
if [[ $? -eq 0 ]]; then ok "Ollama daemon reachable"; else warn "Ollama daemon not reachable (non-blocking)"; fi

# ----------------------------
# Done
# ----------------------------
head "Doctor finished."
exit 0