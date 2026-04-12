---
name: quicknote
description: >
  Capture a quick note fragment to the inbox. Appends to inbox/quicknotes.md with a
  timestamped anchor and adds a Captures entry to today's day node. Does not create wiki pages.
  Triggers on: "quicknote", "/quicknote", "qn", "note this", "remember that".
allowed-tools: Read Write Edit Glob Grep Bash
---

# quicknote: Capture a Fragment

Fast capture. Append to inbox, link from today's day node, move on. No wiki page creation — that's `/promote`.

---

## Behavior

1. **Get the captured text** from the user's message (everything after the trigger word).

2. **Generate the anchor**: `## YYYY-MM-DD-HHmmss` (date + 24h time with seconds, hyphenated). Example: `## 2026-04-12-143022`. The seconds resolution (per decision 10) shrinks the collision window to 1 second.

3. **Append to `inbox/quicknotes.md`**:
   ```markdown
   ## 2026-04-12-143022

   [captured text here]
   ```
   Append at the end of the file, after a blank line.

4. **Update today's day node** (create it first if it doesn't exist, using the same logic as `/journal`):
   - Under `## Captures`, add:
     ```markdown
     - [[quicknotes#2026-04-12-143022]] — "[first ~60 chars of captured text]"
     ```
   - Bump `counts.quicknotes` in frontmatter by 1.

5. **Trigger timeline rebuild**: run `npx tsx scripts/build-timeline-data.ts` (if script exists).

## File Locking

Same protocol as /journal — acquire lock on the day node before writing. See the journal skill for the full locking spec.

For `inbox/quicknotes.md`, use a separate lock file at `inbox/quicknotes.md.lock` with the same protocol.

## Examples

User: `/quicknote interesting pattern: retry with exponential backoff + jitter`
→ Append to quicknotes.md with anchor. Add Captures line to today's day node. Bump count.

User: `qn remember to ask Alex about the deployment pipeline`
→ Same flow. "qn" is a trigger.

User: `note this: the café on Rue Mouffetard does amazing croissants`
→ Same flow. "note this" is a trigger.
