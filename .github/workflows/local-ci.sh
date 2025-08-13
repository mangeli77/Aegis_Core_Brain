#!/usr/bin/env bash
set -euo pipefail

echo "== Aegis CI driver =="
echo "Node: $(node -v)"
echo "NPM : $(npm -v)"

# Warn (don’t leak values)
if [[ -z "${ELEVENLABS_API_KEY:-}" || -z "${ELEVENLABS_VOICE_ID:-}" ]]; then
  echo "::warning:: ELEVENLABS_API_KEY and/or ELEVENLABS_VOICE_ID are not set (voice steps will be skipped or run in headless mode)."
fi

echo "::group::Install deps (no lifecycle)"
if [[ -f package-lock.json ]]; then
  npm ci --ignore-scripts
elif [[ -f package.json ]]; then
  npm i  --ignore-scripts
fi
echo "::endgroup::"

# 1) Static / invariants (soft)
if [[ -f tools/audits/runtime_invariants.mjs ]]; then
  echo "::group::Invariants (soft)"
  node tools/audits/runtime_invariants.mjs || true
  echo "::endgroup::"
fi

# 2) Health (soft unless you want to enforce)
if [[ -f runtime/cli/health.mjs ]]; then
  echo "::group::Health (soft)"
  node runtime/cli/health.mjs || true
  echo "::endgroup::"
fi

# 3) Headless voice check (soft)
if [[ -f runtime/cli/say.mjs ]]; then
  echo "::group::Say (headless, soft)"
  node runtime/cli/say.mjs "CI hello from Aegis (headless)" || true
  echo "::endgroup::"
fi

# 4) Repo-level CI hook (hard fail)
if npm run | grep -qE '^  ci'; then
  echo "::group::npm run ci"
  npm run -s ci    # <- fail the job if this fails
  echo "::endgroup::"
fi

echo "== CI driver complete =="