#!/bin/bash
# Installs npm dependencies so lint, typecheck and tests work in Claude Code cloud sessions.
# Skips the install when node_modules already matches package-lock.json, and prints one line
# only, because hook output lands in the session's context.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
stamp=node_modules/.install-stamp
lock_hash=$(sha256sum package-lock.json | cut -d' ' -f1)

if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$lock_hash" ]; then
  echo "Dependencies up to date."
  exit 0
fi

start=$(date +%s)
if ! npm ci --prefer-offline --no-audit --no-fund --loglevel=error > /tmp/heliotrope-npm-ci.log 2>&1; then
  tail -20 /tmp/heliotrope-npm-ci.log
  exit 1
fi
echo "$lock_hash" > "$stamp"
echo "Dependencies installed in $(($(date +%s) - start))s."
