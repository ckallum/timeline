---
name: day
description: >
  Show a specific day's node in chat. Supports natural language dates: today, yesterday,
  last monday, YYYY-MM-DD. With --brief, produces a diarized analyst summary instead of raw content.
  Does not auto-create missing day nodes.
  Triggers on: "day", "/day", "show me today", "what happened on", "brief me on".
allowed-tools: Read Write Edit Glob Grep Bash
---

# day: View a Day Node

Display a day's timeline entry in chat, either verbatim or as a diarized analyst brief.

---

## Parameters

- `<date>` — the day to view. Default: today.
- `--brief` (or natural language: "brief me on", "summarize") — return a diarization instead of raw content.

---

## Behavior

1. **Parse the date** from the user's input:
   - `/day` (no arg) → today
   - `/day yesterday` → yesterday
   - `/day 2026-04-08` → that date
   - `/day last monday` → most recent past Monday
   - `/day last week` → 7 days ago
   - Same date parser as `/reminder`.

2. **Parse mode**:
   - Default → raw mode (show full content).
   - `--brief` present, OR user phrase includes "brief", "summarize", "synthesize" → diarization mode.

3. **Locate the day node** at `journal/YYYY/MM/YYYY-MM-DD.md`.

4. **If the file does not exist**: show a short message:
   > No day node for YYYY-MM-DD.

   Do NOT auto-create the day node for past dates. Only `/journal` and capture skills create day nodes.

5. **Raw mode**: read the file and display the full content in chat. Format the frontmatter as a summary header and render the body sections.

6. **Diarization mode**: read the file AND any quicknotes anchored to that date in `inbox/quicknotes.md`. Produce a structured one-paragraph analyst brief following the pattern from `wiki/concepts/diarization.md`:

   ```
   DATE: YYYY-MM-DD (Weekday)
   SHAPE: <one line characterizing the day's dominant mode — deep work / errands / social / rest / mixed>
   NOTABLE: <1-3 concrete things that actually happened, with timestamps or artifacts>
   GAPS: <what the counts suggest happened but the body doesn't describe, or vice versa>
   SIGNAL: <what this day hints about active threads — only if genuinely informative, otherwise omit>
   ```

   Rules for diarization:
   - Read both body and counts. Flag mismatches (e.g., "counts say 8 git_commits but body only mentions 2").
   - Hold contradictions in mind rather than smoothing them over.
   - Synthesize, don't summarize — the output should say something the raw file doesn't.
   - Cite specific wikilinks from the body where relevant.
   - Stay under 10 lines. A brief is an analyst artifact, not a newsletter.

## Examples

User: `/day`
→ Today's raw day node.

User: `/day yesterday --brief`
→ Diarized brief for yesterday.

User: `brief me on last monday`
→ Diarization of the most recent past Monday.

User: `what happened on 2026-04-08`
→ Raw content (no brief flag, no brief verb).
