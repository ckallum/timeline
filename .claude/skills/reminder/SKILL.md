---
name: reminder
description: >
  Set a reminder with natural language due dates. Parses "remind me to X by/before Y",
  files in reminders/active.md, and adds a Reminders entry to today's day node.
  Triggers on: "reminder", "/reminder", "remind me".
allowed-tools: Read Write Edit Glob Grep Bash
---

# reminder: Set a Reminder

Parse natural language, file a structured reminder, link from today's day node.

---

## Behavior

1. **Parse the reminder text**. Accept natural language:
   - `remind me to buy flank steak before Thursday` → text: "buy flank steak", due: next Thursday
   - `reminder: call mum tomorrow` → text: "call mum", due: tomorrow
   - `/reminder dentist appointment 2026-05-01` → text: "dentist appointment", due: 2026-05-01
   - `/reminder reply to Alex's email next Monday` → text: "reply to Alex's email", due: next Monday

2. **Date parsing** (simple regex-based):
   - "tomorrow" → today + 1 day
   - "today" → today
   - "next week" → today + 7 days
   - "next Monday/Tuesday/..." → next occurrence of that weekday
   - "before Thursday" / "by Thursday" → that weekday (this week if not passed, next week if passed)
   - "in N days" → today + N days
   - "YYYY-MM-DD" → exact date
   - "5pm" / "3:30pm" → today at that time (or tomorrow if past)
   - If no date can be parsed: **ask "When should I remind you?"** (decision 22 — no undated reminders)

3. **Append to `reminders/active.md`** as a Markdown task list item with inline metadata:
   ```markdown
   - [ ] Buy flank steak <!-- due:2026-04-16 set:2026-04-12 source:journal/2026/04/2026-04-12.md -->
   ```

4. **Update today's day node** (create if needed):
   - Under `## Reminders`, add:
     ```markdown
     - [ ] Buy flank steak → due 2026-04-16
     ```
   - Bump `counts.reminders_set` in frontmatter by 1.

5. **Trigger timeline rebuild**: run `npx tsx scripts/build-timeline-data.ts` (if script exists).

## File Locking

Same protocol as /journal — acquire lock on the day node and on reminders/active.md before writing.

## Examples

User: `/reminder call mum tomorrow`
→ Parse: text="call mum", due=tomorrow's date. File in active.md. Update day node.

User: `remind me to review the PR before Friday`
→ Parse: text="review the PR", due=this Friday (or next if today is Friday+). File and update.

User: `/reminder buy groceries`
→ No date found. Ask: "When should I remind you?" Wait for response, then file.
