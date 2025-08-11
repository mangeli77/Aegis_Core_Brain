#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail
echo "== Cleanup =="
rm -rf /tmp/aegis-* /tmp/el_probe.mp3 /tmp/doctor_tiny.mp3 2>/dev/null || true
echo "Cleanup done."