---
type: plan
title: "Timeline Second Brain — Execution Plan"
created: 2026-04-11
updated: 2026-04-12
status: ready-to-implement
spec_of_record: /Users/callumke/Projects/timeline/docs/plans/second-brain-plan.md
target_repo: /Users/callumke/Projects/timeline
target_remote: github.com/ckallum/timeline (private)
reference_repo: /Users/callumke/Projects/claude-obsidian
---

# Timeline Second Brain — Execution Plan

## Context

A detailed ~800-line spec exists at `docs/plans/second-brain-plan.md`. It covers the full vision: an Obsidian vault + Claude Code plugin at `~/Projects/timeline` that catalogues the user's life as a day-by-day timeline, with capture skills, a background ingest loop, and a local web viewer as the headline deliverable.

This file is the interview-driven execution layer. The spec stays authoritative for repo layout, skill specs, day-node schema, gitignore strategy, CLAUDE.md template, and phase structure. This file records 24 decisions taken in two planning interviews that narrow, override, or extend the spec. **Where the two disagree, this file wins.**

## Decisions — Scope & Strategy (Interview 1)

1. **Ship all 6 phases in order.** First usable cut at end of Phase 2; headline deliverable (web viewer) at Phase 4.
2. **Skip iCloud migration entirely.** Drop `scripts/migrate-from-icloud.ts`, all iCloud config entries, and the privacy-acknowledgement gate.
3. **Repo starts private.** Push is manual, only after Phase 1's clean commit is verified.
4. **Watched git repos: only `~/Projects/timeline`.** User will widen later.
5. **Text only across all phases.** No voice input, transcription, or voice-memos ingest. Out of scope.
6. **Timeline viewer: build as specced** — vertical spine, alternating cards, hover/click states.
7. **No stretch goals promoted.** Core build is P1–P5.

## Decisions — Runtime Semantics (Interview 2)

### Concurrency & State

8. **Concurrent writes: file lock + retry.** Each capture skill acquires an exclusive lock on the day-node file before writing. Other skills retry up to N times (recommend N=5 with 200ms backoff) then fail loudly. Implement via `flock` or a `.lock` sibling file per day node.
9. **Day boundary: strict calendar date, local timezone.** 00:30 on Saturday → Saturday's node. No cutoff. Matches Obsidian daily-note convention.
10. **Quicknote anchors: add seconds.** Format `## YYYY-MM-DD-HHMMSS`. Collision window shrinks to 1 second.
11. **Autoingest failure: skip failed, continue.** Log item error, mark in manifest as `{status: "failed", error: "..."}`, continue to next item. Next run retries failed items.

### Content Generation

12. **Summary one-liner: LLM-generated at end of autoingest.** After all ingest + capture actions settle, the skill reads the full day-node body and generates a one-liner. Costs one LLM call per autoingest run. If no autoingest runs on a given day, summary stays empty.
13. **Timeline data rebuild: every capture skill triggers it.** Every `/journal`, `/quicknote`, `/reminder`, `/autoingest`, `/promote` call runs `build-timeline-data.ts` at the end. Keeps viewer always fresh.
14. **Build script mtime check.** The script checks if any `journal/` file has mtime newer than `timeline.json`'s mtime. If none, exits immediately. Only walks + rebuilds when something changed.
15. **Wikilink resolution: build-time.** `build-timeline-data.ts` regex-replaces `[[Page Title]]` → `[Page Title](obsidian://open?vault=timeline&file=...)` before writing `timeline.json`. Viewer renders standard Markdown links.
16. **Image resolution: build-time relative paths.** `build-timeline-data.ts` converts `![[photo.jpg]]` → `![photo](../../_attachments/photo.jpg)` using paths relative to `timeline/dist/`.
17. **Vault name: hardcode 'timeline'.** Single constant in `build-timeline-data.ts`. User updates one line if they rename the vault.
18. **`/done` ambiguity: prompt if >1 match.** Show all matching reminders and ask which to complete.

### UX Edge Cases

19. **`/day` no entry: short message.** "No day node for YYYY-MM-DD." No auto-creation of past dates.
20. **`/promote` trace: note alongside.** Keep original Captures line. Add `→ promoted to [[Page Title]]` as a new line.
21. **`/superhuman` ranking: LLM-ranked relevance.** Search all sources (journal, wiki, inbox, reminders), then LLM ranks results by relevance to the query. Costs one LLM call per query.
22. **No-date reminder: ask for a date.** "When should I remind you?" Always get a due date. No undated reminders.

### Repo & Vault

23. **`.obsidian/` tracked selectively.** Track `.obsidian/snippets/` (CSS customizations). Ignore everything else (workspace.json, plugins/, community-plugins.json). This is the Obsidian community convention.
24. **README.md: technical overview only.** Describe vault structure, skill list, installation. No personal domains or use cases. Safe to make public later.
25. **Repo creation: automate with `gh`.** `gh repo create ckallum/timeline --private --source=.` after first commit. Requires `gh` auth already configured.
26. **Backup: Time Machine.** Not the project's concern. No backup scripts or documentation.

### Domain Assignment

27. **Wiki-ingest adds `domain:` on creation.** When wiki-ingest creates a page, LLM picks the most likely domain from the nine starter domains and sets `domain: <slug>` in frontmatter. This requires modifying the copied wiki-ingest skill (not a verbatim copy for this one field).

### Error Handling

28. **Errors surface in chat only.** No log file, no day-node annotation. If the user misses it in chat, it's gone. Keeps things simple.

### Reminders Base

29. **`reminders/reminders.base` ships in Phase 2.** Single Obsidian Bases file querying `reminders/active.md` for a table/card view. Quick to scaffold.

## Decisions — Viewer UX (significant spec change)

30. **Default view: last 10 active days.** The viewer does NOT show all days at once. It loads the most recent 10 active days on initial render, reverse-chronologically. The user scrolls down to load more (infinite scroll). This makes the viewer feel like a reactive feed, not a static calendar. Days with no activity are skipped entirely (no dots for empty days). Gap markers ("... 12 days ...") appear between non-consecutive days.

This overrides the spec's "one dot per day, full page height" language. The visual spec (vertical spine, alternating cards, circular dots, hover tooltip, click-to-expand) still applies — just paginated.

Year nav rail becomes a "jump" feature: clicking a year scrolls to (and loads) that year's active days.

## What to drop from the spec

- `scripts/migrate-from-icloud.ts` — do not create.
- `obsidian-vault` autoingest config entry and `kind` handler — drop.
- `voice-memos` autoingest config entry — drop.
- Privacy-acknowledgement flow tied to iCloud — drop.
- Phase 6 migration script item — drop.
- `.claude/autoingest.log` in `.gitignore` — drop (errors go to chat only, no log file).

## What to keep from the spec (unchanged)

Everything not explicitly overridden above. In particular:

- Repo layout, folder skeleton, core `.gitignore` rules, force-added READMEs
- Day-node schema + templates (adjust quicknote anchor format to include seconds per decision 10)
- All 10 skills to copy from `claude-obsidian` (wiki-ingest gets a minor modification for domain assignment per decision 27)
- All 8 new skills to build
- 4 copied hooks (SessionStart, PostCompact, PostToolUse auto-commit, Stop)
- Scheduling via `/loop`, not launchd
- Domain scaffolding + lint extension
- Privacy & git rules (do not relax)
- CLAUDE.md template
- Phase 6 stretch goals (documented, not built)

## `.gitignore` addendum

The spec's `.gitignore` is missing `.obsidian/` rules. Add:

```gitignore
# Obsidian vault metadata
.obsidian/*
!.obsidian/snippets/
```

This goes alongside the existing rules. The full `.gitignore` is the spec's version + this block.

## Execution sequence

### Phase 1 — Scaffolding

Per spec, plus:
- **Do not** create `scripts/migrate-from-icloud.ts`.
- Add `.obsidian/` rules to `.gitignore` (see addendum above).
- Create the GitHub repo via `gh repo create ckallum/timeline --private --source=.` after first commit.
- Copy `.obsidian/snippets/vault-colors.css` from the reference repo.
- Initial commit must pass privacy audit.

### Phase 2 — Capture skills

Per spec, plus:
- **Quicknote anchor format**: `## YYYY-MM-DD-HHMMSS` (seconds, not minutes).
- **File locking**: every skill that writes to a day node acquires a lock first. Implement a shared locking utility that all capture skills reference.
- **Timeline rebuild trigger**: every capture skill calls `npx tsx scripts/build-timeline-data.ts` after writing. The script exits early if no journal files changed (mtime check).
- **`/reminder` always asks for a due date** when none is provided.
- **`/done` prompts on ambiguous match** (>1 reminder matching the substring).
- **`/promote` adds a promotion note** alongside the original Captures line in the day node.
- **`/day` shows "no entry" message** for dates without a day node. Does not create.
- **`/superhuman` uses LLM-ranked relevance** across all sources.
- **Build `reminders/reminders.base`** — Obsidian Bases file for table view of active reminders.
- No voice-related code paths.

### Phase 3 — Autoingest

Per spec, with this trimmed default for `.claude/autoingest.config.json`:

```json
{
  "sources": [
    { "type": "folder", "path": "inbox/unsorted/", "kind": "any", "enabled": true },
    { "type": "git-repos", "paths": ["~/Projects/timeline"], "since": "yesterday", "enabled": true },
    { "type": "rss", "feeds": [], "enabled": false },
    { "type": "screenshots", "path": "~/Desktop", "match": "Screenshot*.png", "after": "yesterday", "enabled": false },
    { "type": "x-bookmarks", "enabled": false, "auth_method": "cookie", "since": "yesterday" }
  ]
}
```

Plus:
- **Skip-failed-continue**: on per-item failure, log error in manifest (`{status: "failed", error: "..."}`), continue to next item. Next run retries failed.
- **Summary one-liner**: LLM-generated at the end of each autoingest run. Read full day-node body, generate one-liner, write to frontmatter.
- **No `obsidian-vault` or `voice-memos` handler.** Grep the skill to verify absence.
- **Modify copied wiki-ingest**: add LLM-assisted `domain:` field assignment on page creation (decision 27).

### Phase 4 — Timeline web viewer

Per spec, with these overrides:
- **Infinite scroll, not full-page spine.** Default view: last 10 active days. Scroll down to load more. Gap markers between non-consecutive days.
- **Year nav rail = jump feature.** Clicking a year loads that year's active days.
- **Build-time wikilink conversion** in `build-timeline-data.ts`: `[[Page Title]]` → `[Page Title](obsidian://open?vault=timeline&file=...)`.
- **Build-time image resolution**: `![[photo.jpg]]` → `![photo](../../_attachments/photo.jpg)`.
- **Mtime-based skip** in `build-timeline-data.ts`: exit early if no journal files changed since last build.
- Vault name hardcoded as `'timeline'`.
- All other visual spec (vertical spine, circular dots, alternating cards, hover tooltip, click-to-expand 300ms transition, dominant-category color coding, sticky month/year header, empty state) applies unchanged.

### Phase 5 — Domains + lint

Per spec. Domain pages scaffolded with nine starter domains. Wiki-lint counts `page_count` per domain by reading `domain:` frontmatter.

### Phase 6 — Stretch

Per spec, minus migration script. Everything else stays as documented stretch.

## Critical files to create (updated)

**Phase 1**
- `~/Projects/timeline/CLAUDE.md`
- `~/Projects/timeline/README.md` (technical overview only)
- `~/Projects/timeline/.gitignore` (spec version + `.obsidian/` addendum)
- `~/Projects/timeline/wiki/README.md` (force-added)
- `~/Projects/timeline/.raw/README.md` (force-added)
- `~/Projects/timeline/.obsidian/snippets/vault-colors.css` (copied from reference)
- Empty folder skeleton: `journal/`, `inbox/`, `reminders/`, `_attachments/`, `timeline/`, `scripts/`, `wiki/domains/`

**Phase 2** (same as before + reminders.base)
- `.claude/skills/{journal,quicknote,reminder,done,promote,day,superhuman}/SKILL.md`
- `_templates/{day.md,quicknote.md,reminder.md}`
- `.claude/commands/*.md`
- `reminders/reminders.base`

**Phase 3**
- `.claude/skills/autoingest/SKILL.md`
- `.claude/skills/autoingest/references/{folder,git-repos,rss,screenshots,x-bookmarks,daemon-fallback}.md`
- `.claude/autoingest.config.json` (gitignored)
- Modification to copied `.claude/skills/wiki-ingest/` for `domain:` assignment

**Phase 4**
- `scripts/build-timeline-data.ts` (with mtime check, wikilink conversion, image resolution)
- `timeline/{package.json,vite.config.ts,tailwind.config.js,postcss.config.js,tsconfig.json,index.html}`
- `timeline/src/{main.tsx,App.tsx}`
- `timeline/src/components/{Timeline,DayNode,DetailPanel,YearNav,EmptyState}.tsx`
- `timeline/src/hooks/useTimelineData.ts` (with infinite-scroll loading)
- `timeline/src/lib/{colors,format}.ts`
- `timeline/src/styles/globals.css`
- `.claude/skills/timeline/SKILL.md`

**Phase 5**
- `wiki/domains/_index.md`
- `wiki/domains/{personal-health,relationships,creative,code,reading,recipes,finance,places,epistemics}.md`
- Extension to copied wiki-lint for domain counting

## Files to reuse from `~/Projects/claude-obsidian`

Copy at same relative paths:
- `.claude/skills/{wiki,wiki-query,wiki-lint,save,autoresearch,canvas,defuddle,obsidian-markdown,obsidian-bases}/` — verbatim
- `.claude/skills/wiki-ingest/` — copy then modify to add `domain:` field assignment
- `.claude/hooks/hooks.json`
- `.claude/commands/{wiki,save,autoresearch,canvas}.md`
- `.claude/agents/{wiki-ingest,wiki-lint}.md`
- `_templates/{source,concept,entity,comparison,question}.md`
- `wiki/{index,hot,log,overview}.md` — format reference, rewrite content
- `wiki/{concepts,entities,sources}/_index.md`
- `wiki/meta/dashboard.{md,base}`
- `.obsidian/snippets/vault-colors.css`

## Verification (updated)

**Phase 1**
- `cd ~/Projects/timeline && claude` opens cleanly.
- `/wiki` reports healthy vault.
- 4 copied hooks fire without error.
- `git log -p HEAD` shows only scaffolding. Zero personal content.
- `git status` clean.
- `git add wiki/index.md` → rejected. `git add wiki/README.md` → already tracked.
- `.obsidian/workspace.json` (if Obsidian created it) is gitignored. `.obsidian/snippets/vault-colors.css` is tracked.
- `gh repo view ckallum/timeline` confirms the repo exists and is private.

**Phase 2**
- `/journal "test"` creates today's day node, appends under correct time-of-day heading, bumps `counts.journal_entries`. Triggers timeline.json rebuild.
- `/quicknote "x"` appends with `## YYYY-MM-DD-HHMMSS` anchor (seconds, not minutes). Adds Captures entry. Bumps count.
- `/reminder remind me to test this tomorrow` parses correctly, files in `reminders/active.md`. `/reminder call mum` (no date) prompts "When should I remind you?".
- `/done test this` with one match → completes it. With multiple matches → prompts which one.
- `/day yesterday` → "No day node for YYYY-MM-DD."
- `/promote <anchor>` creates wiki page and adds "→ promoted to [[Page Title]]" alongside original Captures line.
- `reminders/reminders.base` exists and renders in Obsidian.
- Two concurrent writes: second session retries and succeeds (or fails loudly after N retries). No silent data loss.

**Phase 3**
- `/autoingest` against empty `inbox/unsorted/` → "0 new items".
- Drop test.md with URL → ingest → wiki/sources/ page + fetched child page. Day node Ingests entries. `summary_one_liner` populated by LLM.
- Simulate failure on one item → logged in manifest as failed, other items continue. Next `/autoingest` retries the failed item.
- `/loop 24h /autoingest` starts recurring run.
- No `obsidian-vault` or `voice-memos` code paths exist.
- New wiki pages have `domain:` in frontmatter.

**Phase 4**
- With ≥3 day notes, `/timeline` opens working viewer.
- Initial view shows last 10 active days. Scrolling down loads older days.
- Gap markers appear between non-consecutive days.
- Hover shows tooltip (date + summary + counts). Click expands detail panel (300ms transition).
- Wikilinks in detail panel are clickable `obsidian://` links. Images render inline.
- Year nav jumps to specific year's content.
- Empty state shows "No day notes yet" message.

**Phase 5**
- `lint the wiki` produces per-domain breakdown. Each domain page has accurate `page_count`.

**Final privacy audit**
- `git status` after full session shows no tracked changes under `wiki/`, `.raw/`, `journal/`, `inbox/`, `reminders/`, `_attachments/`, `timeline/data/`, `.obsidian/` (except snippets/).
- `git log --all --full-history --source -- journal/ inbox/ reminders/ _attachments/` returns nothing.

## Out of scope

- iCloud vault migration
- Voice input/transcription
- Watching external repos for git-repos autoingest
- Public repo
- Phase 6 stretch goals in core build
- Backup automation
- Error logging to files

## Notes for the implementing Claude

- Read `docs/plans/second-brain-plan.md` top to bottom first. This file is the lens, not the full spec.
- Privacy rules are the highest-stakes part. When in doubt, gitignore.
- Auto-commit is local-only. Never push without user confirmation.
- Scheduling is `/loop`, never launchd.
- The viewer is an **infinite-scroll feed**, not a static full-page timeline. Last 10 days by default, load more on scroll. This is a significant departure from the spec's language — follow this file.
- Every capture skill triggers `build-timeline-data.ts`, but the script has an mtime-based early exit so it's cheap when nothing changed.
- Wiki-ingest is NOT a verbatim copy — modify it to add LLM-assisted `domain:` assignment.
- File locking on day-node writes is required. Implement once, reuse across all capture skills.
