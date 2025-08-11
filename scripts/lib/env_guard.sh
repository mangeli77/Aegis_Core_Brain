# scripts/lib/env_guard.sh
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dotenv_file="${project_root}/.env"

if [[ -f "$dotenv_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$dotenv_file"
  set +a
fi

need() {
  local var="$1"
  if [[ -z "${!var:-}" ]]; then
    echo "[env_guard.sh] Missing required env var: $var" >&2
    exit 1
  fi
}

mask() {
  local v="$1"; local n=${#v}
  if (( n > 6 )); then printf "%s%s" "${v:0:6}" "$(printf '%*s' $((n-6)) '' | tr ' ' '*')"
  else printf "%s" "$v"; fi
}