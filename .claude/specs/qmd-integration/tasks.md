# QMD Integration — Tasks

## Phase 1: Foundation (30 min)

- [x] Install QMD: `npm install -g @tobilu/qmd` → installed qmd 2.1.0
- [x] ~~Add `.qmd/` to `.gitignore`~~ *(reverted — qmd 2.1.0 stores the index at `~/.cache/qmd/`, not vault-local; see deviation #1)*
- [x] Create `scripts/setup-qmd.sh` with collection registration + context descriptions
- [x] Run setup script — registered 4 collections, built initial index + embeddings (272 files, 513 chunks, 25s)
- [x] Verify: `qmd status` shows all 4 collections (wiki, journal, inbox, raw-sources)
- [x] Verify: `qmd search "Verity compliance"` returns relevant results (Verity Platform Overview, Vanta, Oliver Wyman)

## Phase 2: MCP Server (10 min)

- [x] Add QMD MCP server via `.mcp.json` at project root *(see deviation #2: `.claude/settings.json` rejects `mcpServers`)*
- [ ] Verify: restart Claude session, confirm `qmd` MCP tools appear *(requires session restart — not something I can do from within the session)*
- [ ] Test: use `query` tool directly in conversation to search the vault *(requires session restart)*

## Phase 3: Skill Rewrites (1 hour)

- [x] Update `/wiki-query` SKILL.md: QMD step in Standard + Deep modes, availability check, grep fallback, hot.md-first preserved
- [x] Update `/superhuman` SKILL.md: QMD step replacing grep, availability check, grep fallback, LLM-ranking preserved
- [ ] Test `/wiki-query`: query about a known concept, verify QMD results used *(requires session restart for skills to pick up edits)*
- [ ] Test `/superhuman`: query across journal + wiki, verify cross-collection results *(requires session restart)*
- [ ] Test fallback: temporarily disable qmd, verify skills fall back to grep *(easy to verify once other tests pass)*

## Phase 4: Reindex Hooks (20 min)

- [x] Add PostToolUse hook for Write/Edit → `qmd update` *(in `.claude/hooks/hooks.json`; `command -v qmd` guard for graceful no-op)*
- [x] Add `qmd update && qmd embed` step 8 to autoingest SKILL.md (after timeline rebuild)
- [x] Add `qmd update && qmd embed` step 12 to wiki-ingest SKILL.md (after contradictions pass)
- [ ] Test: create a quicknote, verify it appears in QMD search within seconds *(hook only fires after session restart)*
- [ ] Test: run `/wiki-ingest` on a URL, verify new pages appear in QMD search

## Phase 5: Timeline Viewer Search (2-3 hours)

- [x] Create `scripts/serve-timeline.sh` — starts `qmd mcp --http --port 3001` if installed, then `npx vite`
- [x] Create `timeline/src/components/Search.tsx` — debounced search, hybrid lex+vec request, graceful degradation
- [x] Integrate Search into Timeline.tsx (fixed top bar, click → select day + scroll)
- [x] Style search results (safe React `<mark>` snippet highlighting, score badge, click-to-navigate)
- [x] Add Vite dev-server proxy `/api/qmd → localhost:3001` *(deviation #6: qmd 2.1.0 HTTP server emits no CORS headers)*
- [x] **Verified live end-to-end**: query "compliance" returned 7 ranked results (Compliance Program OS 0.93, technical--onedosh 0.51, Jhon, Peter, Bank-Readiness Scoring, PMR Peter, Verity Platform Overview — each 0.46) across wiki + raw-sources collections with correct `<mark>` highlighting

## Verification (live)

- [x] End-to-end: QMD daemon on :3001 + Vite viewer on :5173 → real results render in UI
- [ ] End-to-end: write a new wiki page → qmd update hook fires → search finds it immediately (FTS5) *(requires session restart for hook to be active)*
- [ ] End-to-end: run /autoingest → new files indexed + embedded → semantic search finds them
- [ ] End-to-end: /superhuman query returns QMD-ranked results with citations *(requires session restart)*
- [x] Graceful degradation path: with qmd daemon stopped, viewer shows "QMD server unavailable" message (verified during first preview run before install)

## Deviations from design.md

1. **QMD has no `--db` flag**: qmd 2.1.0 stores all indexes at `~/.cache/qmd/<name>.sqlite` (global user cache) and accepts only `--index <name>` for namespacing. The design's vault-local `.qmd/index.sqlite` isn't supported. Consequence: removed `.qmd/` from `.gitignore`; the index lives in the user cache.
2. **MCP config goes in `.mcp.json`, not `.claude/settings.json`** — the current Claude Code schema rejects `mcpServers` in settings.json.
3. **HTTP server ignores `--index`** (qmd 2.1.0 bug or undocumented behavior): even when started with `qmd --index timeline mcp --http`, the HTTP server reads from the default `~/.cache/qmd/index.sqlite`. Workaround: populate the default index and don't pass `--index` anywhere. All `qmd` invocations in configs/skills/hooks/serve-script use the default.
4. **Hook matcher style** uses `"Write|Edit"` (hooks.json convention) vs the `tool == "..."` style shown in the design snippet.
5. **Vite port 5173** (existing `strictPort: true`) — design said 5175.
6. **CORS**: qmd 2.1.0 HTTP server emits no CORS headers, so a browser on `localhost:5173` can't directly POST to `localhost:3001`. Added a Vite dev-server proxy at `/api/qmd → localhost:3001`; `Search.tsx` POSTs to `/api/qmd/query` (same-origin).
7. **QMD HTTP `/query` request shape**: requires `{"searches": [{"type": "lex", ...}, {"type": "vec", ...}], "limit": N}` — not the `{query, limit}` shape shown in the design.
8. **QMD HTTP `/query` response shape**: each hit has `file` (not `path`), `score`, `title`, `snippet`, `context`, `docid`. `Search.tsx` accepts both legacy and current shapes.
9. **Snippet highlighting**: used safe React `<mark>` elements instead of the raw HTML injection shown in the design example — XSS-safe and enforced by the repo's security hook.
10. **Hook guard**: PostToolUse hook prepends `command -v qmd >/dev/null &&` for stronger graceful degradation than the `2>/dev/null || true` pattern alone.

## Out-of-scope changes observed

The working tree at session start had uncommitted modifications to several timeline viewer files (`DayNode.tsx`, `DetailPanel.tsx`, `Timeline.tsx` layout tweaks, `format.ts`, `globals.css`, `tailwind.config.js`, `index.html`). These appear to be from an earlier refactor PR (#5 "harden timeline viewer from review findings"). They are unrelated to QMD integration and were left as-is.
