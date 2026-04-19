# QMD Integration — Tasks

## Phase 1: Foundation (30 min)

- [ ] Install QMD: `npm install -g @tobilu/qmd`
- [ ] Add `.qmd/` to `.gitignore`
- [ ] Create `scripts/setup-qmd.sh` with collection registration + context descriptions
- [ ] Run setup script — register 4 collections, build initial index + embeddings
- [ ] Verify: `qmd --db .qmd/index.sqlite status` shows all 4 collections
- [ ] Verify: `qmd --db .qmd/index.sqlite query "Verity compliance"` returns relevant results

## Phase 2: MCP Server (10 min)

- [ ] Add QMD MCP server to `.claude/settings.json`
- [ ] Verify: restart Claude session, confirm `qmd` MCP tools appear
- [ ] Test: use `query` tool directly in conversation to search the vault

## Phase 3: Skill Rewrites (1 hour)

- [ ] Update `/wiki-query` SKILL.md:
  - Add QMD query step in Standard mode (step 3)
  - Add QMD query step in Deep mode (step 3)
  - Add availability check + grep fallback
  - Preserve hot.md-first pattern and citation format
- [ ] Update `/superhuman` SKILL.md:
  - Replace grep step with QMD query
  - Add availability check + grep fallback
  - Preserve LLM-ranking and citation format
- [ ] Test `/wiki-query`: query about a known concept, verify QMD results used
- [ ] Test `/superhuman`: query across journal + wiki, verify cross-collection results
- [ ] Test fallback: temporarily rename .qmd/, verify skills fall back to grep

## Phase 4: Reindex Hooks (20 min)

- [ ] Add PostToolUse hook for Write/Edit → `qmd update` (FTS5 only)
- [ ] Add `qmd update && qmd embed` step to autoingest SKILL.md (after timeline rebuild)
- [ ] Add `qmd update && qmd embed` step to wiki-ingest SKILL.md (after log update)
- [ ] Test: create a quicknote, verify it appears in QMD search within seconds
- [ ] Test: run `/wiki-ingest` on a URL, verify new pages appear in QMD search

## Phase 5: Timeline Viewer Search (2-3 hours)

- [ ] Create or update serve script to start QMD HTTP server alongside Vite
- [ ] Create `timeline/src/components/Search.tsx` — search box + results
- [ ] Integrate Search into Timeline.tsx layout
- [ ] Style search results (snippet highlighting, score badges, click-to-navigate)
- [ ] Test: search for a term, verify results link to correct day nodes
- [ ] Test: search for a wiki concept, verify cross-collection results

## Verification

- [ ] End-to-end: write a new wiki page → qmd update hook fires → search finds it immediately (FTS5)
- [ ] End-to-end: run /autoingest → new files indexed + embedded → semantic search finds them
- [ ] End-to-end: /superhuman query returns QMD-ranked results with citations
- [ ] End-to-end: timeline viewer search returns results from all 4 collections
- [ ] Graceful degradation: uninstall QMD → all skills still work via grep fallback
