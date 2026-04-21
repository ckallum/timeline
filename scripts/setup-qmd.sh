#!/bin/bash
set -e

# NOTE: qmd 2.1.0's MCP HTTP server ignores the --index flag and always
# reads from the default index (~/.cache/qmd/index.sqlite). We therefore
# register collections against the default index so the timeline viewer's
# HTTP search works. See tracked upstream issue — if fixed, revisit and
# namespace with --index timeline across configs/skills/hooks.

# Install qmd if missing, then re-verify it's on PATH (nvm/volta/fnm setups
# often have a global npm dir that isn't on the current shell's PATH).
if ! command -v qmd >/dev/null 2>&1; then
  npm install -g @tobilu/qmd
  if ! command -v qmd >/dev/null 2>&1; then
    echo "qmd installed but not on PATH — add \$(npm prefix -g)/bin to PATH and re-run." >&2
    exit 1
  fi
fi

# Run an idempotent subcommand and only swallow the "already exists" case.
# Anything else (typo, permission error, renamed subcommand in a future qmd,
# disk full) surfaces with its real stderr and fails the script.
safe_add() {
  local label="$1"; shift
  local out
  if out=$("$@" 2>&1); then
    echo "  added: $label"
  elif echo "$out" | grep -qiE "already exists|duplicate"; then
    echo "  exists: $label"
  else
    echo "  FAILED: $label" >&2
    echo "$out" >&2
    return 1
  fi
}

safe_add "collection wiki"        qmd collection add wiki/ --name wiki
safe_add "collection journal"     qmd collection add journal/ --name journal
safe_add "collection inbox"       qmd collection add inbox/ --name inbox
safe_add "collection reminders"   qmd collection add reminders/ --name reminders
safe_add "collection raw-sources" qmd collection add .raw/articles/ --name raw-sources

safe_add "context wiki"        qmd context add qmd://wiki \
  "Curated knowledge base: concepts, entities, sources, and domain pages. Cross-referenced with wikilinks."
safe_add "context journal"     qmd context add qmd://journal \
  "Daily timeline entries with activity counts, summaries, and sections for captures, ingests, code, and reminders."
safe_add "context inbox"       qmd context add qmd://inbox \
  "Quick notes and unprocessed captures. Fragments waiting to be promoted to wiki pages."
safe_add "context reminders"   qmd context add qmd://reminders \
  "Active and completed reminders. Natural-language todos with due dates and completion markers."
safe_add "context raw-sources" qmd context add qmd://raw-sources \
  "Immutable source archive. Ingested articles, git summaries, and iCloud vault copies."

# Initial index + embed (no `|| true` here — if update/embed fails, we want to know).
qmd update
qmd embed

echo ""
echo "QMD setup complete."
qmd status | grep -E "^(Index:|  Total:|  Vectors:)" || true
