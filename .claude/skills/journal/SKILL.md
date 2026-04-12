---
name: journal
description: >
  Open or write today's day node in the timeline vault. Creates the day note from template
  if it doesn't exist, appends entries under time-of-day headings, and bumps frontmatter counts.
  Triggers on: "journal", "/journal", "dear diary", "today I".
allowed-tools: Read Write Edit Glob Grep Bash
---

# journal: Write Today's Day Note

You maintain the daily timeline. Each day has exactly one note at `journal/YYYY/MM/YYYY-MM-DD.md`.

---

## Behavior

1. **Compute today's date** using the system clock (local timezone). Day boundary is strict calendar date — 00:30 on Saturday is Saturday's node.

2. **Locate the day note** at `journal/YYYY/MM/YYYY-MM-DD.md`.

3. **If it doesn't exist**, create it:
   - Create parent directories: `journal/YYYY/MM/`
   - Use the template at `_templates/day.md` as a reference, but fill in actual values:
     - `title`: the date in YYYY-MM-DD
     - `date`: YYYY-MM-DD
     - `day_of_week`: full day name (Monday, Tuesday, etc.)
     - All `counts` start at 0
     - `summary_one_liner`: empty string
     - `related`: link to `[[journal/_index]]` and previous/next day if they exist
   - The body heading should be: `# DayName, D Month YYYY` (e.g., `# Saturday, 12 April 2026`)
   - Sections: Morning, Afternoon, Evening, Captures, Reminders, Ingests, Wiki Activity, Code

4. **Determine time-of-day heading**:
   - Morning: hour < 12
   - Afternoon: 12 <= hour < 17
   - Evening: 17 <= hour < 22
   - Night: hour >= 22

5. **If text was provided** (e.g., `/journal Had a great lunch with Alex`):
   - Append the text under the appropriate `## <Time of day>` heading
   - Bump `counts.journal_entries` in frontmatter by 1

6. **If no text was provided**:
   - Ask one open question: "How's the day going?"
   - Wait for the response, then append it under the time-of-day heading
   - Bump `counts.journal_entries` by 1

7. **Update journal/_index.md**: add today's date entry if not already listed.

8. **Update wiki/hot.md**: update the "Last Updated" line.

9. **Trigger timeline rebuild**: run `npx tsx scripts/build-timeline-data.ts` (if the script exists). This is a no-op until Phase 4 builds the script.

## File Locking

Before writing to any day node, acquire an exclusive lock to prevent concurrent write corruption:

1. Check for lock file at `journal/YYYY/MM/YYYY-MM-DD.md.lock`
2. If lock exists and is less than 30 seconds old, wait 200ms and retry (up to 5 retries)
3. If lock exists and is older than 30 seconds, consider it stale and remove it
4. Create the lock file with the current timestamp
5. Perform the write
6. Remove the lock file

All capture skills (journal, quicknote, reminder, done, promote, autoingest) use this same locking protocol.

## Examples

User: `/journal`
→ Check if today's day note exists. If not, create it. Ask "How's the day going?" Append answer.

User: `/journal Had a productive morning. Shipped the auth refactor and reviewed two PRs.`
→ Create day note if needed. Append text under `## Morning` (or whatever time it is). Bump count.

User: `dear diary, feeling overwhelmed but making progress`
→ Same as above. Detect "dear diary" trigger.
