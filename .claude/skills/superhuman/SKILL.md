---
name: superhuman
description: >
  Query the entire second brain — journal, wiki, inbox, and reminders. Like wiki-query but
  searches ALL vault content, not just wiki/. Results are LLM-ranked by relevance.
  Triggers on: "superhuman", "/superhuman", "what do I know about", "search everything".
allowed-tools: Read Write Edit Glob Grep Bash Agent WebSearch WebFetch
---

# superhuman: Talk to Your Second Brain

The "superhuman version of yourself with infinite memory" entry point. Searches everything, ranks by relevance, cites sources.

---

## Behavior

1. **Receive the user's question** or query.

2. **Search ALL vault content** (not just wiki/):
   - `wiki/` — all concept, entity, source, question pages
   - `journal/` — all day nodes
   - `inbox/quicknotes.md` — captured fragments
   - `reminders/active.md` and `reminders/completed.md`
   - `wiki/hot.md` — recent context

3. **Search strategy**:
   - Start with `wiki/hot.md` for recent context
   - Read `wiki/index.md` for the full page list
   - **QMD hybrid search** (BM25 + vector, all collections):
     - Availability check: `qmd status 2>/dev/null && echo qmd_available || echo qmd_unavailable`
     - If `qmd_available`: run `qmd query --json -n 15 "<query>"`. Results span wiki + journal + inbox + .raw/articles.
     - If `qmd_unavailable`: fall back to grep across all directories (existing behavior).
   - Read the most relevant files (up to 10)

4. **LLM-rank results by relevance** (decision 21):
   - After gathering all matching content, rank the results by how relevant they are to the query
   - This costs one LLM reasoning step — it's the "superhuman" part
   - Surface the top results with clear citations

5. **Respond with citations**:
   - Synthesize an answer from the ranked results
   - Cite specific day nodes, wiki pages, quicknotes, and reminders
   - Use wikilink format: [[page name]] for wiki pages, [[journal/2026/04/2026-04-12]] for day nodes

6. **If the answer would make a good wiki page**, suggest: "Want me to `/save` this as a wiki page?"

## Examples

User: `/superhuman what do I know about exponential backoff?`
→ Search wiki concepts, journal entries, quicknotes. Rank. Synthesize answer with citations.

User: `search everything for conversations about deployment`
→ Search all sources. Rank by relevance. Present findings.

User: `what happened last week?`
→ Read last 7 day nodes. Summarize the week. Cite specific entries.
