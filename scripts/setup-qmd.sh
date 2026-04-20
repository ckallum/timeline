#!/bin/bash
set -e

# NOTE: qmd 2.1.0's MCP HTTP server ignores the --index flag and always
# reads from the default index (~/.cache/qmd/index.sqlite). We therefore
# register collections against the default index so the timeline viewer's
# HTTP search works. (Upstream bug / undocumented behavior — see tasks.md.)

# Install if missing
command -v qmd >/dev/null || npm install -g @tobilu/qmd

# Create collections (idempotent — `|| true` skips "already exists")
qmd collection add wiki/ --name wiki || true
qmd collection add journal/ --name journal || true
qmd collection add inbox/ --name inbox || true
qmd collection add .raw/articles/ --name raw-sources || true

# Add context descriptions
qmd context add qmd://wiki "Curated knowledge base: concepts, entities, sources, and domain pages. Cross-referenced with wikilinks." || true
qmd context add qmd://journal "Daily timeline entries with activity counts, summaries, and sections for captures, ingests, code, and reminders." || true
qmd context add qmd://inbox "Quick notes and unprocessed captures. Fragments waiting to be promoted to wiki pages." || true
qmd context add qmd://raw-sources "Immutable source archive. Ingested articles, git summaries, and iCloud vault copies." || true

# Initial index + embed
qmd update
qmd embed

echo ""
echo "QMD setup complete."
qmd status | grep -E "^(Index:|  Total:|  Vectors:)"
