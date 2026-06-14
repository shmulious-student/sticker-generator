#!/usr/bin/env bash
# Ensures a web/CI session can run lint, typecheck and tests for this project.
# Idempotent: safe to run on every session start.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "Installing dependencies…"
  npm install --no-audit --no-fund
else
  echo "Dependencies already installed."
fi
