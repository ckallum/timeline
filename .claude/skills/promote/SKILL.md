---
name: promote
description: >
  Turn a quicknote into a full wiki page. Reads the quicknote by anchor, asks for page type
  (concept, entity, source, or question), creates the wiki page, and adds a promotion trace
  to the day node. Triggers on: "promote", "/promote".
allowed-tools: Read Write Edit Glob Grep Bash
---

# promote: Turn a Quicknote into a Wiki Page

Elevate a captured fragment into a structured wiki page.

---

## Behavior

1. **Parse the anchor** from the user's input. The anchor is a quicknote timestamp like `2026-04-12-143022`.
   - If no anchor provided, read `inbox/quicknotes.md` and show the last 5 entries for the user to pick from.

2. **Read the quicknote** from `inbox/quicknotes.md` by finding the heading `## <anchor>` and reading the content below it until the next `##` heading or end of file.

3. **Ask for page type**: "What kind of page should this become? (concept / entity / source / question)"
   - If the content makes the type obvious (e.g., it's about a person → entity), suggest it but still confirm.

4. **Create the wiki page**:
   - Use the appropriate template from `_templates/` (concept.md, entity.md, source.md, question.md)
   - Title: derive from the quicknote content (ask user to confirm or adjust)
   - File location: `wiki/<type>/<title>.md` (e.g., `wiki/concepts/Exponential Backoff.md`)
   - Fill in the template with content from the quicknote
   - Set `status: seed` in frontmatter

5. **Update the quicknote** in `inbox/quicknotes.md`:
   - Keep the original entry intact (decision 20 — keep original Captures line)
   - Add a new line below the content: `→ promoted to [[Page Title]]`

6. **Update today's day node**:
   - Under `## Captures`, find the original quicknote reference line and add alongside it:
     `→ promoted to [[Page Title]]`
   - Under `## Wiki Activity`, add: `- Created: [[Page Title]]`
   - Bump `counts.pages_created` in frontmatter by 1.

7. **Update wiki/index.md**: add the new page under the appropriate section.

8. **Trigger timeline rebuild** (if script exists).

## File Locking

Lock the day node during updates. Lock quicknotes.md during the promotion annotation.

## Examples

User: `/promote 2026-04-12-143022`
→ Read that quicknote. Ask type. Create wiki page. Annotate quicknote. Update day node.

User: `/promote`
→ Show last 5 quicknotes. User picks one. Proceed as above.
