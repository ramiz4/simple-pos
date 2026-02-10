#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.onprem.yml"
ENV_FILE="${ROOT_DIR}/.env.enterprise"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but not found in PATH" >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  cp "${SCRIPT_DIR}/.env.enterprise.example" "${ENV_FILE}"
  echo "Created ${ENV_FILE}. Update secrets before first production use." >&2
fi

ensure_image() {
  local image_name="$1"
  local dockerfile_path="$2"

  if docker image inspect "${image_name}" >/dev/null 2>&1; then
    echo "Image exists: ${image_name}"
    return
  fi

  echo "Building missing image: ${image_name}"
  docker build \
    --file "${ROOT_DIR}/${dockerfile_path}" \
    --tag "${image_name}" \
    "${ROOT_DIR}"
}

ensure_image "simplepos/pos:latest" "deploy/enterprise/docker/pos.Dockerfile"
ensure_image "simplepos/api:latest" "deploy/enterprise/docker/api.Dockerfile"

docker compose \
  --env-file "${ENV_FILE}" \
  --file "${COMPOSE_FILE}" \
  up -d

echo "Simple POS stack is running:"
echo "  POS: http://localhost:${POS_HTTP_PORT:-8080}"
echo "  API: http://localhost:${API_HTTP_PORT:-3000}/api/v1"
