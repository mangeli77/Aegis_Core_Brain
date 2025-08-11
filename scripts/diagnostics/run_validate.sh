#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

# 0) Ensure env loads once (same way your working setup does)
node --input-type=module -e "import('./_env.mjs').then(()=>console.log('env OK')).catch(e=>{console.error(e);process.exit(1)})"

# 1) Your existing doctor (already green)
scripts/diagnostics/run_doctor.sh

# 2) Your existing full pipeline check (already green)
bash scripts/diagnostics/full_voice_pipeline_check.sh

echo "✓ Validation complete."