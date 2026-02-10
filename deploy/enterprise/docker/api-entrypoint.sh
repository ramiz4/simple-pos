#!/usr/bin/env sh
set -eu

MAX_ATTEMPTS="${PRISMA_MIGRATE_MAX_ATTEMPTS:-10}"
SLEEP_SECONDS="${PRISMA_MIGRATE_RETRY_SECONDS:-2}"
ENABLE_DB_PUSH_FALLBACK="${PRISMA_DB_PUSH_FALLBACK:-false}"

run_with_retries() {
  TASK_NAME="$1"
  shift

  ATTEMPT=1
  echo "${TASK_NAME} (attempt ${ATTEMPT}/${MAX_ATTEMPTS})..."

  until "$@"; do
    if [ "${ATTEMPT}" -ge "${MAX_ATTEMPTS}" ]; then
      echo "${TASK_NAME} failed after ${MAX_ATTEMPTS} attempts." >&2
      return 1
    fi

    ATTEMPT=$((ATTEMPT + 1))
    echo "${TASK_NAME} failed, retrying in ${SLEEP_SECONDS}s (${ATTEMPT}/${MAX_ATTEMPTS})..."
    sleep "${SLEEP_SECONDS}"
  done

  return 0
}

if ! run_with_retries "Applying Prisma migrations" ./node_modules/.bin/prisma migrate deploy; then
  if [ "${ENABLE_DB_PUSH_FALLBACK}" = "true" ]; then
    echo "Falling back to Prisma schema sync (db push)."
    run_with_retries "Applying Prisma schema sync" ./node_modules/.bin/prisma db push --skip-generate
  else
    exit 1
  fi
fi

echo "Starting API server..."
exec node main.js
