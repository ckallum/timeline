---
name: day
description: >
  Show a specific day's node in chat. Supports natural language dates: today, yesterday,
  last monday, YYYY-MM-DD. Shows "no entry" for dates without a day node — does not auto-create.
  Triggers on: "day", "/day", "show me today", "what happened on".
allowed-tools: Read Write Edit Glob Grep Bash
---

# day: View a Day Node

Display a day's timeline entry in chat.

---

## Behavior

1. **Parse the date** from the user's input:
   - `/day` (no arg) → today
   - `/day yesterday` → yesterday
   - `/day 2026-04-08` → that date
   - `/day last monday` → most recent past Monday
   - `/day last week` → 7 days ago
   - Same date parser as `/reminder`.

2. **Locate the day node** at `journal/YYYY/MM/YYYY-MM-DD.md`.

3. **If the file exists**: read it and display the full content in chat. Format the frontmatter as a summary header and render the body sections.

4. **If the file does not exist** (decision 19): show a short message:
   > No day node for YYYY-MM-DD.
   
   Do NOT auto-create the day node for past dates. Only `/journal` and capture skills create day nodes.

## Examples

User: `/day`
→ Show today's day node (or "No day node for 2026-04-12" if none exists).

User: `/day yesterday`
→ Show yesterday's day node.

User: `what happened on 2026-04-08`
→ Parse date, show that day's node.
