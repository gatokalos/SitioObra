#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_ENV_FILE="$SCRIPT_DIR/../../../backend/gato-enigmatico-api/.env"
ENV_FILE="${AUDIENCE_ADMIN_ENV_FILE:-$DEFAULT_ENV_FILE}"

usage() {
  cat <<'EOF'
Uso:
  tools/audience-perspectives-admin.sh status
  tools/audience-perspectives-admin.sh pending [limit]
  tools/audience-perspectives-admin.sh approved [limit]
  tools/audience-perspectives-admin.sh rejected [limit]
  tools/audience-perspectives-admin.sh approve <id> [id...]
  tools/audience-perspectives-admin.sh reject <id> [id...]
  tools/audience-perspectives-admin.sh preview [limit]

Variables opcionales:
  AUDIENCE_ADMIN_ENV_FILE   Ruta al .env con SB_URL y SB_SERVICE_ROLE_KEY
EOF
}

require_binary() {
  local bin="$1"
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Falta dependencia requerida: $bin" >&2
    exit 1
  fi
}

require_binary curl
require_binary jq

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe archivo de entorno: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

: "${SB_URL:?Define SB_URL en $ENV_FILE}"
: "${SB_SERVICE_ROLE_KEY:?Define SB_SERVICE_ROLE_KEY en $ENV_FILE}"

auth_headers=(
  -H "apikey: $SB_SERVICE_ROLE_KEY"
  -H "Authorization: Bearer $SB_SERVICE_ROLE_KEY"
)

count_by_status() {
  local status="$1"
  local headers_file
  headers_file="$(mktemp)"
  curl -sS -D "$headers_file" -o /dev/null "${auth_headers[@]}" -H "Prefer: count=exact" \
    "$SB_URL/rest/v1/audience_perspectives?select=id&status=eq.${status}&limit=1"

  local range total
  range="$(awk -F': ' 'tolower($1)=="content-range" {gsub("\r","",$2); print $2}' "$headers_file")"
  if [[ -z "$range" ]]; then
    total="0"
  else
    total="${range##*/}"
  fi
  rm -f "$headers_file"
  echo "$total"
}

print_status_summary() {
  echo "Estado actual de audience_perspectives"
  printf "  pending : %s\n" "$(count_by_status pending)"
  printf "  approved: %s\n" "$(count_by_status approved)"
  printf "  rejected: %s\n" "$(count_by_status rejected)"
}

list_rows() {
  local status="$1"
  local limit="${2:-20}"
  curl -sS "${auth_headers[@]}" \
    "$SB_URL/rest/v1/audience_perspectives?select=id,author_name,author_role,quote,created_at,status&status=eq.${status}&order=created_at.desc&limit=${limit}" \
    | jq -r --arg status "$status" '
      if type=="array" and length>0 then
        "Listado \($status) (" + (length|tostring) + "):",
        (.[] | "- [\(.id)] \(.author_name // "Voz del público") | \(.author_role // "-") | \(.created_at)\n  " + ((.quote // "" | tostring | gsub("[\\r\\n\\t]+"; " ") | .[0:160])))
      else
        "Listado \($status): sin resultados."
      end
    '
}

update_status() {
  local target_status="$1"
  shift
  if [[ "$#" -lt 1 ]]; then
    echo "Debes indicar al menos un ID." >&2
    exit 1
  fi

  local id
  for id in "$@"; do
    if [[ ! "$id" =~ ^[0-9]+$ ]]; then
      echo "ID inválido: $id" >&2
      continue
    fi

    local response updated
    response="$(
      curl -sS -X PATCH "${auth_headers[@]}" -H "Content-Type: application/json" -H "Prefer: return=representation" \
        "$SB_URL/rest/v1/audience_perspectives?id=eq.${id}&status=eq.pending" \
        -d "{\"status\":\"${target_status}\"}"
    )"
    updated="$(echo "$response" | jq 'if type=="array" then length else 0 end')"

    if [[ "$updated" == "1" ]]; then
      echo "OK: id=${id} -> ${target_status}"
    else
      echo "Sin cambio: id=${id} (quizá no existe o ya no está en pending)"
    fi
  done
}

preview_public() {
  local limit="${1:-6}"
  curl -sS "${auth_headers[@]}" -H "Content-Type: application/json" \
    "$SB_URL/rest/v1/rpc/get_audience_perspectives" \
    -d "{\"p_limit\":${limit}}" \
    | jq -r '
      if type=="array" and length>0 then
        "Vista pública RPC get_audience_perspectives:",
        (.[] | "- [\(.id)] \(.author_name // "Voz del público") | \(.author_role // "-") | \(.created_at)\n  " + ((.quote // "" | tostring | gsub("[\\r\\n\\t]+"; " ") | .[0:160])))
      else
        "Vista pública RPC get_audience_perspectives: sin resultados."
      end
    '
}

command="${1:-}"
case "$command" in
  status)
    print_status_summary
    ;;
  pending)
    list_rows pending "${2:-20}"
    ;;
  approved)
    list_rows approved "${2:-20}"
    ;;
  rejected)
    list_rows rejected "${2:-20}"
    ;;
  approve)
    shift
    update_status approved "$@"
    ;;
  reject)
    shift
    update_status rejected "$@"
    ;;
  preview)
    preview_public "${2:-6}"
    ;;
  -*|"")
    usage
    ;;
  *)
    echo "Comando desconocido: $command" >&2
    usage
    exit 1
    ;;
esac
