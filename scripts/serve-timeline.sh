#!/bin/bash
set -e

cd "$(dirname "$0")/.."

QMD_PID=""

if command -v qmd >/dev/null 2>&1; then
  qmd mcp --http --port 3001 &
  QMD_PID=$!
  echo "QMD HTTP server started on :3001 (pid $QMD_PID)"
else
  echo "qmd not installed; viewer search will be unavailable. Run scripts/setup-qmd.sh to enable."
fi

trap '[ -n "$QMD_PID" ] && kill $QMD_PID 2>/dev/null || true' EXIT

cd timeline
npx vite
