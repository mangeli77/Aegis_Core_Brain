#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ ! -d "_attic" ]]; then
  echo "❌ No _attic directory found at: $ROOT/_attic"
  exit 1
fi

# pick the newest deprecated bucket inside _attic (what the move script created)
SRC_DIR="$(ls -dt _attic/deprecated_* 2>/dev/null | head -n1 || true)"
if [[ -z "${SRC_DIR}" || ! -d "${SRC_DIR}" ]]; then
  echo "❌ No _attic/deprecated_* folder found to restore from."
  exit 1
fi

echo "🔎 Restore source: ${SRC_DIR}"
mkdir -p logs/attic
STAMP="$(date +"%Y%m%d_%H%M%S")"

# 1) safety backup of current working tree (lightweight, excludes node_modules & _attic)
echo "📦 Backing up current tree -> logs/attic/working_backup_${STAMP}.zip"
zip -qry "logs/attic/working_backup_${STAMP}.zip" \
  . -x "node_modules/**" "_attic/**" ".git/**" "logs/**"

# 2) restore
MODE="${1:-}"
if [[ "${MODE}" == "--force" ]]; then
  echo "⚠️  FORCE mode: will overwrite files when attic has a copy."
  echo "   Making overwrite backup dir: logs/attic/overwrites_${STAMP}"
  mkdir -p "logs/attic/overwrites_${STAMP}"

  rsync -av \
    --backup \
    --backup-dir="logs/attic/overwrites_${STAMP}" \
    "${SRC_DIR}/" "./"
else
  echo "ℹ️  Default mode: restore missing files only (no overwrite)."
  rsync -av --ignore-existing "${SRC_DIR}/" "./"
fi

echo "🧹 (Optional) To delete the attic after confirming restore, run:"
echo "    rm -rf _attic"
echo "✅ Done. Review changes, then re-run your path audit if needed:"
echo "    npm run audit:paths"