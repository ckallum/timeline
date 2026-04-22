# QMD Integration — Design

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│                    Claude Code Session                   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ /wiki-query  │  │ /superhuman  │  │  Direct MCP  │  │
│  │   (skill)    │  │   (skill)    │  │  tool calls  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └────────┬────────┴──────────────────┘          │
│                  │                                      │
│         ┌────────▼────────┐                             │
│         │   QMD MCP Server │ ← settings.json            │
│         │  query/get/...  │                             │
│         └────────┬────────┘                             │
│                  │ fallback if unavailable               │
│         ┌────────▼────────┐                             │
│         │   Grep + Read   │ ← existing approach          │
│         └─────────────────┘                             │
└─────────────────────────────────────────────────────────┘
                   │
          ┌────────▼────────┐
          │ .qmd/index.sqlite│ ← vault-local DB
          │  FTS5 + vectors  │
          └────────┬────────┘
                   │
    ┌──────────────┼──────────────┐──────────────┐
    │              │              │              │
 wiki/        journal/       inbox/      .raw/articles/
```

## Decision Record

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Collections | wiki + journal + inbox + reminders + .raw/articles | Covers all searchable content. _attachments binary. (Revised 2026-04-21: reminders was initially excluded as "too small" but `/superhuman`'s contract explicitly includes reminders — grep fallback covered this, QMD path did not. Added as 5th collection to prevent silent drop when qmd is available. See PR #7.) |
| 2 | Integration | MCP server + skill rewrites | MCP gives native tools; skill rewrites make /superhuman and /wiki-query semantically aware. |
| 3 | Reindex trigger | Hook for `update`, batch `embed` at ingest end | FTS5 stays current on every write. Vector embeds batch at natural breakpoints (end of ingest runs). |
| 4 | Viewer search | QMD HTTP server | Full hybrid search in browser. Requires QMD server running alongside dev server. |
| 5 | Fallback | Graceful degradation to grep | QMD is progressive enhancement. Skills always work. |
| 6 | Context metadata | Per-collection descriptions | Cheap to add, improves search quality. |
| 7 | DB location | Vault-local .qmd/index.sqlite | Scoped to this vault. No collision with other QMD uses. |
| 8 | Embedding model | Default (EmbeddingGemma-300M) | Vault is English-only. Qwen3-Embedding only needed for multilingual. |

## Component Design

### 1. QMD Setup Script

New script: `scripts/setup-qmd.sh`

```bash
#!/bin/bash
set -e

DB=".qmd/index.sqlite"

# Install if missing
command -v qmd >/dev/null || npm install -g @tobilu/qmd

# Create collections with vault-local DB
qmd --db "$DB" collection add wiki/ --name wiki
qmd --db "$DB" collection add journal/ --name journal
qmd --db "$DB" collection add inbox/ --name inbox
qmd --db "$DB" collection add .raw/articles/ --name raw-sources

# Add context descriptions
qmd --db "$DB" context add qmd://wiki "Curated knowledge base: concepts, entities, sources, and domain pages. Cross-referenced with wikilinks."
qmd --db "$DB" context add qmd://journal "Daily timeline entries with activity counts, summaries, and sections for captures, ingests, code, and reminders."
qmd --db "$DB" context add qmd://inbox "Quick notes and unprocessed captures. Fragments waiting to be promoted to wiki pages."
qmd --db "$DB" context add qmd://raw-sources "Immutable source archive. Ingested articles, git summaries, and iCloud vault copies."

# Initial index + embed
qmd --db "$DB" update
qmd --db "$DB" embed

echo "QMD setup complete. Index at $DB"
```

### 2. MCP Server Config

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "qmd": {
      "command": "qmd",
      "args": ["mcp", "--db", ".qmd/index.sqlite"]
    }
  }
}
```

### 3. Skill Rewrites

#### /wiki-query changes

Replace grep-based search in Standard and Deep modes with QMD:

```text
## Standard Query Workflow (updated)

1. Read wiki/hot.md first (unchanged)
2. Read wiki/index.md to orient (unchanged)
3. **NEW**: Run `qmd query --db .qmd/index.sqlite --json -n 10 "<query>"`
   - If QMD available: parse results, read top 3-5 matched pages
   - If QMD unavailable: fall back to grep across wiki/ (existing behavior)
4. Synthesize answer with citations (unchanged)
5. Offer to file (unchanged)
```

Availability check:
```bash
qmd --db .qmd/index.sqlite status 2>/dev/null && echo "qmd_available" || echo "qmd_unavailable"
```

#### /superhuman changes

Replace grep across all directories with QMD:

```text
## Search Strategy (updated)

1. Read wiki/hot.md for recent context (unchanged)
2. **NEW**: Run `qmd query --db .qmd/index.sqlite --json -n 15 "<query>"`
   - If QMD available: results span wiki + journal + inbox + .raw (all collections)
   - If QMD unavailable: fall back to grep across all directories (existing behavior)
3. Read top results (up to 10) (unchanged)
4. LLM-rank by relevance (unchanged — QMD pre-ranks, LLM re-ranks with full context)
5. Synthesize answer with citations (unchanged)
```

### 4. Reindex Hooks

Add a `PostToolUse` entry to `.claude/settings.json` under `hooks`:

**PostToolUse hook (Write/Edit):**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "tool == \"Write\" || tool == \"Edit\"",
        "hooks": [
          {
            "type": "command",
            "command": "qmd --db .qmd/index.sqlite update 2>/dev/null || true"
          }
        ],
        "description": "Update QMD FTS5 index after file changes"
      }
    ]
  }
}
```

**Autoingest / wiki-ingest epilogue:**

Add to end of autoingest SKILL.md execution flow (step 7, after timeline rebuild):
```text
8. **Reindex QMD**: run `qmd --db .qmd/index.sqlite update && qmd --db .qmd/index.sqlite embed` (if QMD installed).
```

Same for wiki-ingest SKILL.md (after step 10, update log):
```text
12. **Reindex QMD**: run `qmd --db .qmd/index.sqlite update && qmd --db .qmd/index.sqlite embed` (if QMD installed).
```

### 5. Timeline Viewer Search

#### Server changes

Update `scripts/serve-timeline.sh` (or create it) to start QMD HTTP server alongside Vite:

```bash
# Start QMD HTTP server on port 3001
qmd mcp --http --port 3001 --db .qmd/index.sqlite &
QMD_PID=$!

# Start Vite dev server on port 5175
npx vite --port 5175 timeline/

# Cleanup
kill $QMD_PID
```

#### Frontend changes

New component: `timeline/src/components/Search.tsx`

```typescript
// Calls QMD HTTP server at localhost:3001
async function search(query: string): Promise<SearchResult[]> {
  const res = await fetch('http://localhost:3001/query', {
    method: 'POST',
    body: JSON.stringify({ query, limit: 10 })
  })
  return res.json()
}
```

Search results render as cards with:
- Document title and path
- Matched snippet (highlighted)
- Score badge
- Click → navigates to the matching day node or opens in Obsidian

## Files Modified

| File | Change |
|------|--------|
| `scripts/setup-qmd.sh` | NEW — setup script |
| `.claude/settings.json` | Add QMD MCP server |
| `.claude/hooks/hooks.json` | Add PostToolUse qmd update hook |
| `.claude/skills/wiki-query/SKILL.md` | Add QMD query step with grep fallback |
| `.claude/skills/superhuman/SKILL.md` | Add QMD query step with grep fallback |
| `.claude/skills/autoingest/SKILL.md` | Add qmd update+embed at end of flow |
| `.claude/skills/wiki-ingest/SKILL.md` | Add qmd update+embed at end of flow |
| `.gitignore` | Add `.qmd/` |
| `timeline/src/components/Search.tsx` | NEW — search box component |
| `timeline/src/components/Timeline.tsx` | Integrate Search component |
| `scripts/serve-timeline.sh` | NEW or update — start QMD HTTP alongside Vite |

## NOT in Scope

| Item | Rationale | When |
|------|-----------|------|
| Custom embedding model (Qwen3) | Vault is English-only; default EmbeddingGemma is fine | If multilingual content added |
| Per-subfolder context metadata | Per-collection is sufficient for current vault size | If search quality degrades |
| QMD SDK integration (programmatic) | CLI + MCP is simpler; SDK adds a build dependency | If viewer search needs more control |
| Scheduled reindex cron | Hook-based reindex is sufficient while sessions are active | If using daemon-mode autoingest |
