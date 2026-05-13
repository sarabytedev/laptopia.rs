#!/bin/bash
# Ensures the frontend build artifacts are in sync with source before each Claude
# session starts. The production Dockerfile copies `frontend/build/` directly into
# the nginx image — there is no build step on the VPS — so a stale bundle results
# in broken deploys (e.g. compiled JS referencing files that no longer exist in
# `frontend/public/`).
set -euo pipefail

# Only run in the Claude Code on the web sandbox.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}/frontend"

log() { echo "[session-start] $*"; }

if [ ! -d node_modules ] || [ ! -d node_modules/.bin ]; then
  log "Installing yarn deps..."
  yarn install --frozen-lockfile --silent
else
  log "node_modules already present, skipping install."
fi

bundle="$(ls -1 build/static/js/main.*.js 2>/dev/null | head -n 1 || true)"

needs_build=0
if [ -z "$bundle" ]; then
  needs_build=1
  log "No compiled bundle found in build/static/js/, will build."
else
  newer="$(find src public -type f -newer "$bundle" -print -quit 2>/dev/null || true)"
  if [ -n "$newer" ]; then
    needs_build=1
    log "Source newer than bundle ($newer), will rebuild."
  else
    log "Bundle is up to date."
  fi
fi

if [ "$needs_build" = "1" ]; then
  log "Running yarn build..."
  REACT_APP_BACKEND_URL=https://laptopia.rs yarn build
  log "Build complete."
fi
