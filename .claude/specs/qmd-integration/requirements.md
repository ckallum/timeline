# QMD Integration — Requirements

## Goal

Replace the vault's grep-based search with QMD hybrid search (BM25 + vector + LLM reranking). QMD runs entirely on-device. Integration touches: MCP server config, skill rewrites, reindex hooks, and the timeline web viewer.

## Functional Requirements

### FR-1: QMD Installation & Index Setup
- Install QMD globally (`npm install -g @tobilu/qmd`)
- Create vault-local SQLite database at `.qmd/index.sqlite`
- Register 4 collections: `wiki/`, `journal/`, `inbox/`, `.raw/articles/`
- Add per-collection context descriptions for improved relevance
- Initial index build: `qmd update && qmd embed`
- Add `.qmd/` to `.gitignore`

### FR-2: MCP Server Integration
- Configure QMD as an MCP server in `.claude/settings.json`
- Exposes `query`, `get`, `multi_get`, `status` as native Claude Code tools
- Uses vault-local DB path via `--db` flag
- Available in every Claude session automatically

### FR-3: Skill Rewrites
- `/wiki-query`: try QMD first, fall back to grep if QMD unavailable
- `/superhuman`: try QMD first, fall back to grep if QMD unavailable
- Both skills preserve existing behavior (hot.md first, citations, filing answers)
- QMD replaces the grep + manual file read step, not the synthesis step

### FR-4: Reindex Hooks
- PostToolUse hook on Write/Edit: run `qmd update` (FTS5 only, fast)
- End of `/autoingest`: run `qmd update && qmd embed` (batch vector computation)
- End of `/wiki-ingest`: run `qmd update && qmd embed`
- Hooks are no-ops if QMD is not installed (graceful degradation)

### FR-5: Timeline Web Viewer Search
- Add search box to the timeline viewer UI
- Search queries hit QMD's HTTP transport server (localhost)
- Results link to matching day nodes / wiki pages
- QMD HTTP server starts alongside the dev/preview server

## Non-Functional Requirements

### NFR-1: Progressive Enhancement
- QMD is never a hard dependency. All skills fall back to grep if QMD is unavailable.
- Missing models, unbuilt index, or crashed server must not break any existing workflow.

### NFR-2: Performance
- `qmd update` (FTS5 rescan) should complete in <2s for the current vault size
- `qmd embed` for a single new file should complete in <10s
- Full embed for ~200 files: expect 5-15 minutes (one-time cost)
- Viewer search latency: <500ms per query

### NFR-3: Storage
- Models: ~2.1GB in `~/.cache/qmd/models/` (shared across projects)
- Index: vault-local `.qmd/index.sqlite` (estimated <50MB for current vault)
- Both excluded from git
