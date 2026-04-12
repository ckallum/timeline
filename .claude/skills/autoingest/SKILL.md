---
name: autoingest
description: >
  Background ingest loop. Walks configured sources (inbox, git repos, RSS, screenshots, X bookmarks),
  routes new items to wiki-ingest, rolls up everything into today's day node, and generates
  a summary one-liner. Run manually or recurring via /loop 24h /autoingest.
  Triggers on: "autoingest", "/autoingest".
allowed-tools: Read Write Edit Glob Grep Bash Agent WebFetch WebSearch
---

# autoingest: Background Ingest Loop

The "infinite memory" loop. Walk every configured source, ingest new items, roll up into today's day node.

---

## Configuration

Read `.claude/autoingest.config.json` for the source list. Each source has:
- `type`: folder | git-repos | rss | screenshots | x-bookmarks
- `enabled`: boolean — skip disabled sources entirely
- Source-specific fields (path, feeds, since, etc.)

If the config file doesn't exist, create it with the default (see below).

## Execution Flow

1. **Read config**. For each **enabled** source, list new items since last run.

2. **Delta tracking**: use `.raw/.manifest.json` (same as wiki-ingest) for source-level tracking. For git-repos, use `git log --since=...` with the last run date.

3. **For each new item**, dispatch to the appropriate handler:

   ### folder handler
   - Walk all files in the configured path
   - For each unprocessed file: copy to `.raw/`, then run wiki-ingest single-source flow
   - Handle any file type: .md files are ingested as sources, images via vision flow, URLs extracted from .md files are fetched as child pages
   
   ### git-repos handler
   - For each configured repo path, run `git log --since=<last_run> --oneline --format="%h %s"`
   - Write a summary to `.raw/git/<repo-name>-<date>.md`
   - Add commit entries under `## Code` in today's day node
   - Bump `counts.git_commits` with the count of new commits
   
   ### rss handler
   - Fetch each feed URL
   - Parse entries, identify new items by GUID
   - Save each new entry to `.raw/articles/<slug>-<date>.md`
   - Run wiki-ingest on each
   
   ### screenshots handler
   - Glob for files matching the pattern in the configured path
   - Filter by date (after configured threshold)
   - Copy each to `_attachments/screenshots/`
   - Run wiki-ingest image flow on each
   
   ### x-bookmarks handler
   - See `references/x-bookmarks.md` for implementation details
   - Default: disabled. Manual export via folder handler.

4. **Roll up into today's day node**:
   - Create day node if it doesn't exist (same logic as /journal)
   - Append entries to the appropriate sections (Ingests, Code, Wiki Activity)
   - Bump all relevant `counts` fields

5. **Generate summary one-liner** (decision 12):
   - Read the full day-node body
   - Use LLM to generate a one-sentence summary
   - Write to `summary_one_liner` in frontmatter
   - This costs one LLM call per autoingest run

6. **Update wiki/log.md and wiki/hot.md**.

7. **Trigger timeline rebuild**: run `npx tsx scripts/build-timeline-data.ts` (if script exists).

## Error Handling (decision 11)

- On per-item failure: log error, mark in manifest as `{status: "failed", error: "..."}`, continue to next item
- Next run retries failed items automatically
- Errors surface in chat only (decision 28) — no log file, no day-node annotation

## Concurrency

- Process enabled sources sequentially (sources may share the day node)
- Within a source, process items sequentially to keep manifest writes safe
- Acquire file lock on day node before each write

## Scheduling

This skill is designed to run via `/loop`:
```
/loop 24h /autoingest          # daily
/loop 6h /autoingest           # more frequent during active days
```

The loop only runs while the Claude session is open. When the session closes, the loop stops cleanly. For daemon behavior, see `references/daemon-fallback.md`.

## Report

After each run, report:
```
Autoingest complete:
  Sources checked: N (M enabled)
  New items: N
  Failed: N (will retry next run)
  Day node: journal/YYYY/MM/YYYY-MM-DD.md updated
  Summary: "<generated one-liner>"
```

If no new items: "0 new items across N enabled sources."
