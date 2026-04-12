---
name: done
description: >
  Mark a reminder as complete. Moves the matching line from reminders/active.md to
  reminders/completed.md and bumps today's day node reminders_completed count.
  Triggers on: "done", "/done", "completed", "finished".
allowed-tools: Read Write Edit Glob Grep Bash
---

# done: Complete a Reminder

Find the reminder, mark it done, move it to completed.

---

## Behavior

1. **Read `reminders/active.md`** and search for task items matching the user's substring.

2. **Match logic**:
   - Case-insensitive substring match against the reminder text (the part before `<!--`)
   - If **exactly 1 match**: proceed to complete it.
   - If **multiple matches** (decision 18): show all matching reminders and ask "Which one?"
     ```
     Multiple reminders match "call":
     1. Call mum (due 2026-04-13)
     2. Call dentist to reschedule (due 2026-04-15)
     Which one? (1/2)
     ```
   - If **no matches**: "No active reminder matching '[substring]'."

3. **Complete the reminder**:
   - Remove the line from `reminders/active.md`
   - Append to `reminders/completed.md` with completion date:
     ```markdown
     - [x] Buy flank steak <!-- due:2026-04-16 set:2026-04-12 completed:2026-04-12 -->
     ```
   - Change `- [ ]` to `- [x]`

4. **Update today's day node**:
   - Under `## Reminders`, add or update:
     ```markdown
     - [x] Buy flank steak (completed)
     ```
   - Bump `counts.reminders_completed` in frontmatter by 1.

5. **Trigger timeline rebuild** (if script exists).

## File Locking

Lock both `reminders/active.md` and `reminders/completed.md` during the move operation, plus the day node.

## Examples

User: `/done flank steak`
→ Find "flank steak" in active.md. One match. Move to completed. Update day node.

User: `/done call`
→ Two matches: "Call mum", "Call dentist". Ask which one.

User: `finished reviewing the PR`
→ Search for "reviewing the PR" in active.md. Complete if found.
