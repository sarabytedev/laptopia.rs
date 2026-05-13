#!/bin/bash
# Instalira frontend zavisnosti da bi Claude alati (grep, lint, type-check)
# radili u remote sesiji. Build se ne radi ovde — Dockerfile sam pravi build
# pri deploy-u (multi-stage: node → nginx).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}/frontend"

if [ ! -d node_modules ] || [ ! -d node_modules/.bin ]; then
  echo "[session-start] Installing yarn deps..."
  yarn install --frozen-lockfile --silent
else
  echo "[session-start] node_modules already present, skipping install."
fi
