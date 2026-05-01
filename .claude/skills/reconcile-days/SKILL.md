---
name: reconcile-days
description: >
  Back-fill and gap-fill day nodes. Default is incremental: reconcile every
  day from the last reconciled date (read from wiki/log.md) through today.
  Diffs each day's existing day node against wiki/log.md entries plus git
  history of wiki/, then appends the gaps. Complements /autoingest, which is
  forward-only. Use after a multi-day strategic arc that produced wiki pages
  outside the daily ingest path, or as a weekly safety pass via
  /loop 7d /reconcile-days --last=7d.
  Triggers on: "reconcile-days", "/reconcile-days", "catch-up days",
  "fill day nodes", "backfill day nodes", "tidy day nodes".
allowed-tools: Read Write Edit Glob Grep Bash
---

# reconcile-days: Gap-fill day nodes

The "rear-view mirror" loop. Walk a date range, diff what each day node says happened against what `wiki/log.md` and `git log` say happened, append the gaps, regenerate the timeline.

This is the back-fill counterpart to `/autoingest`. /autoingest pulls forward (today's day node + new external sources). /reconcile-days fills backward (past day nodes whose Wiki Activity, Ingests, or counts drift from reality because pages got created mid-conversation rather than via raw-source ingest).

---

## When to invoke

- After a multi-day strategic conversation that produced wiki pages outside the normal autoingest path. The Verity pivot arc (2026-04-28 → 2026-05-01) is the prototype.
- As a weekly safety pass via `/loop 7d /reconcile-days --last=7d`. If there is no work, the skill exits clean.
- Before pointing anyone at the `/timeline` viewer for a demo, so the visible days look populated.

## Difference from /autoingest

| | /autoingest | /reconcile-days |
|---|---|---|
| Direction | Forward (today) | Backward (a date range) |
| Input | External feeds (`inbox/`, `.raw/`, RSS, screenshots, X bookmarks) | `wiki/log.md` + `git log` of `wiki/` + existing day-node frontmatter |
| Action | Ingest new sources, route through `/wiki-ingest`, roll into today's day | Diff existing day nodes against observed wiki activity, append gaps |
| Trigger | New raw input arrived | Wiki pages created mid-conversation that bypassed the daily rollup |
| Frequency | Daily | Post-arc, plus weekly safety pass |

If both apply (raw sources need ingesting AND past day nodes have gaps), run `/autoingest` first, then `/reconcile-days`.

## Arguments

| Form | Behaviour |
|---|---|
| `/reconcile-days` (no args) | **Default: incremental.** Reconcile every day from `last_reconciled_date + 1` through today, inclusive. See "Resolving the default range" below. |
| `/reconcile-days --last=Nd` | Reconcile the last N days regardless of last-reconciled marker (e.g. `--last=7d` for a weekly pass that re-checks the window). |
| `/reconcile-days --from=YYYY-MM-DD --to=YYYY-MM-DD` | Reconcile a specific date range, inclusive. Overrides the marker. |
| `/reconcile-days --since=YYYY-MM-DD` | Reconcile from the given date through today, inclusive. Useful for a one-shot back-fill that is bigger than the marker would suggest. |

If the default range resolves to "no days needed," exit clean with "Nothing to reconcile (last reconciled YYYY-MM-DD)."

### Resolving the default range

When invoked with no arguments, derive the start date in this order:

1. **Read `wiki/log.md`** and find the most recent entry whose header matches
   `## [YYYY-MM-DD] reconcile | ...`. The `to` date in that entry's body
   (`Days touched: ...` or the date range stated in the title) is the
   `last_reconciled_date`. Start at `last_reconciled_date + 1`.

2. **If no reconcile log entry exists** (first run on this vault, or the log
   was pruned), fall back to the marker-free scan: walk back day-by-day from
   today, checking each day node's frontmatter `pages_created` count against
   `git log --diff-filter=A --since=DATE --until=DATE+1 -- wiki/`. Stop at
   the first day where counts match exactly. That day becomes the implicit
   `last_reconciled_date`. Cap the back-scan at 30 days to avoid runaway
   walks; if no reconciled day is found within 30 days, stop and report
   "Marker-free scan exceeded 30 days. Provide `--since=YYYY-MM-DD` or
   `--last=Nd`."

3. **End date is always today** (current calendar date in local timezone).

The marker-driven default is the common case. The marker-free scan is a
safety net for first runs or pruned logs. Explicit `--last`, `--from/--to`,
or `--since` always override the default.

## Behaviour

For each date in the resolved range:

1. **Locate the day node** at `journal/YYYY/MM/YYYY-MM-DD.md`.

2. **If it does not exist**, create it from `_templates/day.md` following the same construction rules as `/journal` (parent directories, frontmatter fields, body heading, all counts at 0, link to prev/next day, link to `[[journal/_index]]`). Then proceed to step 4.

3. **If it exists**, read it in full. Identify which entries are already covered. Default to verify-only.

4. **Build the observed-activity set** for this date:
   - `wiki/log.md` entries whose date prefix matches `YYYY-MM-DD`
   - `git log --since=YYYY-MM-DD --until=YYYY-MM-DD+1 --name-only -- wiki/` for created or modified pages
   - `git log --since=YYYY-MM-DD --until=YYYY-MM-DD+1 --name-only -- viewer/ scripts/ .claude/` for code changes
   - `inbox/quicknotes.md` lines whose timestamp falls on this date
   - `reminders/active.md` and `reminders/completed.md` lines whose date matches

5. **Diff** the observed-activity set against the existing day-node body. An entry is "covered" if a wikilink to its slug appears in the day-node body, OR (for code changes) if the PR number appears.

6. **Append gaps** under the appropriate headings:
   - Wiki page creations / updates → `## Wiki Activity`
   - External-source ingests (anything from `.raw/` filed via `/wiki-ingest`) → `## Ingests`
   - PR merges, commits to `scripts/`, `viewer/`, `.claude/` → `## Code`
   - Quicknotes filed on this date → `## Captures`
   - Reminders set or completed → `## Reminders`

   Use Edit (not Write). Append-only. Do not rewrite existing content.

7. **Recompute frontmatter counts** by tallying actual entries in the day node after the append:
   - `journal_entries`: count of paragraphs under Morning / Afternoon / Evening / Night
   - `quicknotes`: count of `## Captures` bullets
   - `ingests`: count of `## Ingests` bullets
   - `pages_created`: count of new wiki pages traced to this date via git history (use `git log --diff-filter=A --since=... --until=... -- wiki/`)
   - `pages_updated`: count of modifications minus creations
   - `git_commits`: count of commits authored on this date in the repo
   - `reminders_set`, `reminders_completed`: tally from `reminders/`

   Update frontmatter only if observed counts differ from existing counts.

8. **Update `summary_one_liner`** if it is empty or clearly stale. Otherwise leave it.

9. After all dates are reconciled, **regenerate `timeline.json`**:
   ```bash
   npx tsx scripts/build-timeline-data.ts
   ```
   Verify the script exists before running. Do not start the dev server.

10. **Append a single entry to `wiki/log.md`** at the top:
    ```
    ## [YYYY-MM-DD] reconcile | Day-node reconciliation, range YYYY-MM-DD → YYYY-MM-DD
    - Days touched: [list]
    - Days created: [count]
    - Days appended: [count]
    - Days verified-only: [count]
    - Notable gaps filled: [one-line summary]
    ```

11. **Report back in chat** with one line per day touched, plus the timeline.json regen status.

## File locking

Use the same lock protocol as `/journal` (and the rest of the capture skills) for every day node touched:

1. Check for lock file at `journal/YYYY/MM/YYYY-MM-DD.md.lock`
2. If lock exists and is less than 30 seconds old, wait 200ms and retry (up to 5 retries)
3. If lock exists and older than 30 seconds, consider it stale and remove
4. Create lock with current timestamp
5. Perform the edit
6. Remove the lock

Reconcile-days touches multiple day nodes in one run. Acquire and release the lock per-file, not session-wide.

## Diff strategy: covered vs gap

An item is **covered** if any of:

- The exact wikilink `[[slug]]` appears in the day-node body (case-sensitive)
- For code changes, the PR number (`PR #N`) or commit short-SHA appears
- For quicknotes, the timestamped anchor (`#YYYY-MM-DD-HHMMSS`) appears

Otherwise it is a **gap** and should be appended.

When in doubt, prefer false-negative (treat as gap, append) over false-positive (skip). Duplicate appends are easier to clean up later than missed entries.

## Constraints

- Use Edit, never Write, on existing day nodes. Append-only.
- Do not edit past entries in `wiki/log.md`. Append-only at the top.
- Do not start the timeline web viewer. Only regenerate `timeline.json`.
- Do not auto-promote quicknotes. Just record their existence.
- Do not commit anything. Leave the working tree dirty for review.
- Style: no em dashes in any text written. Declarative present tense. Concise.
- Avoid the word "compliance" in any product-positioning copy added to day nodes; that word is reserved for buyer-conversation framing per [[know-your-workload]]. Use "decision," "review," "audit trail," "policy," or "examination."

## Stop conditions

- If `_templates/day.md` is missing, stop and report.
- If `scripts/build-timeline-data.ts` is missing, stop after the day-node work and report rather than guess at a regen command.
- If a day-node read reveals content you cannot reconcile with the expected gaps, stop and report. Do not edit.
- If `wiki/log.md` lacks entries dated within the requested range AND `git log -- wiki/` is empty for that range, exit clean with "Nothing to reconcile."

## Composability

- Run `/autoingest` first if there are pending raw sources. /reconcile-days does not pull external feeds; it only reconciles what is already filed.
- Run `/wiki-lint` after if you want to surface orphans the rapid creation may have left behind. /reconcile-days does not lint.
- Set up a weekly safety pass with `/loop 7d /reconcile-days --last=7d`.

## Examples

`/reconcile-days`
→ Default incremental run. Reads `wiki/log.md` for the last `## [DATE] reconcile | ...` entry, starts at the day after, ends today. If no reconcile entry exists, falls back to the marker-free scan (capped at 30 days).

`/reconcile-days --last=7d`
→ Reconcile the last seven days regardless of the marker. Typical weekly safety pass; re-checks the window even if part of it was reconciled earlier.

`/reconcile-days --since=2026-04-28`
→ Reconcile from 2026-04-28 through today. One-shot back-fill bigger than the marker.

`/reconcile-days --from=2026-04-28 --to=2026-05-01`
→ Reconcile the four days of the Verity pivot arc explicitly. Marker is ignored.

`/loop 7d /reconcile-days --last=7d`
→ Recurring weekly tidy-up. Uses `--last=7d` rather than the default so the rolling window always re-verifies, catching late-arriving wiki edits to recent days.

## See Also

- `/autoingest` — forward-rolling counterpart
- `/journal` — single-day write; shares the file-locking protocol
- `/wiki-lint` — orphan and dead-link detection, run after if needed
- `_templates/day.md` — the day-node template used for missing days
- [[codify-on-repeat]] — the principle that produced this skill
