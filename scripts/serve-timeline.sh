#!/bin/bash
set -e

cd "$(dirname "$0")/.."

QMD_PID=""
LOG_DIR=".claude/logs"
QMD_LOG="$LOG_DIR/qmd-mcp.log"

cleanup() {
  if [ -n "$QMD_PID" ] && kill -0 "$QMD_PID" 2>/dev/null; then
    kill -TERM "$QMD_PID" 2>/dev/null || true
    # Wait up to 2s for graceful shutdown so qmd can flush its SQLite WAL,
    # then SIGKILL to guarantee the wrapper exits even if qmd ignores SIGTERM.
    for _ in $(seq 1 20); do
      if ! kill -0 "$QMD_PID" 2>/dev/null; then
        wait "$QMD_PID" 2>/dev/null || true
        return
      fi
      sleep 0.1
    done
    kill -KILL "$QMD_PID" 2>/dev/null || true
    wait "$QMD_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if command -v qmd >/dev/null 2>&1; then
  mkdir -p "$LOG_DIR"

  # Pre-check port 3001: a stale qmd from another project (the shared-default-
  # index workaround makes this plausible) would otherwise cause our curl
  # probe to succeed against someone else's server. Bail if already bound.
  if command -v lsof >/dev/null 2>&1 && lsof -i :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "port 3001 is already in use. Stop the existing server (qmd mcp stop, or kill the process)." >&2
    exit 1
  fi

  # Append to the log with a run marker so crash history is retained.
  {
    echo ""
    echo "=== qmd mcp start: $(date -Iseconds) ==="
  } >> "$QMD_LOG"
  qmd mcp --http --port 3001 >>"$QMD_LOG" 2>&1 &
  QMD_PID=$!

  # On a fresh machine qmd's first run downloads ~2 GB of models before
  # binding the port. 5s was nowhere near enough — user saw Vite up but
  # search dead with the warning scrolled offscreen. Give 60s.
  ready=0
  for _ in $(seq 1 600); do
    if ! kill -0 "$QMD_PID" 2>/dev/null; then
      echo "qmd mcp exited during startup; see $QMD_LOG" >&2
      QMD_PID=""
      break
    fi
    if curl -sf -o /dev/null http://localhost:3001/mcp -X POST \
         -H "Content-Type: application/json" \
         -d '{"jsonrpc":"2.0","id":0,"method":"ping"}' 2>/dev/null \
       || curl -sf -o /dev/null http://localhost:3001/query -X POST \
         -H "Content-Type: application/json" \
         -d '{"searches":[{"type":"lex","query":"health"}]}' 2>/dev/null; then
      ready=1
      break
    fi
    sleep 0.1
  done
  if [ "$ready" = "1" ]; then
    echo "QMD HTTP server live on :3001 (pid $QMD_PID, log: $QMD_LOG)"
  elif [ -n "$QMD_PID" ]; then
    echo "qmd started but /query did not respond within 60s; viewer search may be unavailable. If this is a fresh install, models may still be downloading (see $QMD_LOG)." >&2
  fi
else
  echo "qmd not installed; viewer search will be unavailable. Run scripts/setup-qmd.sh to enable."
fi

cd timeline
npx vite
