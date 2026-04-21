# timeline

Personal second brain vault — an Obsidian vault and Claude Code plugin.

## /layman

Imagine a notebook that never forgets anything. You scribble a quick thought, paste a link you want to read later, dictate what you did today, or drop a PDF into a folder — and without any extra effort the notebook **files it, cross-references it, summarises it, and makes it searchable forever**.

That's what this repo is. Specifically:

- **One page per day.** Everything that happens — notes, reminders, articles you read, code you pushed, conversations you want to remember — rolls up into a single diary entry for that day.
- **A wiki that writes itself.** When you ingest an article or a meeting transcript, the vault automatically creates pages for the people, companies, ideas, and sources mentioned, and links them together like Wikipedia.
- **A search that understands meaning.** You can ask "what do I know about compliance automation?" and get answers pulled from every note, not just keyword matches. (Powered by on-device AI search — nothing leaves your machine.)
- **A visual timeline.** A small local webpage shows your life as a scrollable timeline, with a search box that instantly jumps to any day, person, concept, or source in your vault.
- **An AI copilot that files things for you.** You give Claude Code a URL, an image, a voice memo, a bookmark — it reads, understands, creates/updates wiki pages, and writes an entry in today's diary. You curate; it does the clerical work.

Think of it as: your journal + your reading list + your contacts + your project notes + your "I'll remember this later" pile — merged into one place that **gets smarter every day you use it**, entirely on your own laptop.

---

## What it is (for builders)

Catalogues daily life as a continuous timeline. Journals, captures quick notes, sets reminders, ingests sources from the web and local files, and rolls everything into one day node per day. A local web viewer visualizes the timeline. [QMD](https://github.com/tobi/qmd) provides on-device hybrid search (BM25 + vector + LLM rerank) over everything.

## Vault Structure

```
journal/        one note per day (the timeline backbone)
inbox/          quicknotes and unprocessed captures
reminders/      active and completed reminders
wiki/           curated knowledge base (concepts, entities, sources, domains)
.raw/           immutable inbound sources
timeline/       local web viewer (React + Tailwind + Vite)
_templates/     Obsidian templater templates
_attachments/   images, PDFs, assets
scripts/        setup-qmd.sh, serve-timeline.sh, build-timeline-data.ts
```

## Skills

| Skill | What it does |
|-------|-------------|
| `/journal` | Write today's day note |
| `/quicknote` | Capture a fragment to inbox |
| `/reminder` | Set a reminder with due date |
| `/done` | Mark a reminder complete |
| `/autoingest` | Run the background ingest loop (also re-embeds QMD at end of run) |
| `/promote` | Turn a quicknote into a wiki page |
| `/timeline` | Build and open the web viewer |
| `/day [date]` | View a specific day's node |
| `/superhuman` | Query across all vault content (QMD hybrid search → grep fallback) |
| `/wiki` | Wiki setup and routing |
| `/wiki-ingest` | Ingest sources into the wiki (also re-embeds QMD) |
| `/wiki-query` | Answer questions from wiki content (QMD hybrid search → grep fallback) |
| `/wiki-lint` | Wiki health check |
| `/save` | Save conversation as a wiki note |
| `/autoresearch` | Autonomous research loop |
| `/canvas` | Visual canvas operations |

## Installation

1. Clone this repo to `~/Projects/timeline`
2. Open the folder in Obsidian as a vault
3. Open the folder in Claude Code: `cd ~/Projects/timeline && claude`
4. **Set up on-device search** (recommended):
   ```bash
   bash scripts/setup-qmd.sh
   ```
   Installs [QMD](https://github.com/tobi/qmd), registers the 5 collections (`wiki`, `journal`, `inbox`, `reminders`, `raw-sources`), and builds the initial FTS5 + vector index. Downloads ~2 GB of GGUF models on first run — one-time cost. Everything runs locally; nothing is uploaded anywhere.
5. Run `/wiki` to verify the vault is healthy
6. Start the ingest loop: `/loop 24h /autoingest`

If you skip step 4, the vault still works — `/wiki-query`, `/superhuman`, and the viewer search all fall back to grep automatically. You lose semantic search and the viewer's search box will show "QMD server unavailable".

## Searching the Vault

Three entry points:

- **In Claude Code conversation** — `/wiki-query` and `/superhuman` run hybrid search first (BM25 + vector + LLM rerank via QMD) and fall back to grep if QMD isn't running. Same skill flow, better recall.
- **MCP tools** — with QMD set up, `.mcp.json` exposes `query`, `get`, `multi_get`, and `status` as native Claude Code tools. Restart your Claude session after running `setup-qmd.sh` to see them.
- **Timeline viewer** — start with `bash scripts/serve-timeline.sh` to launch both the QMD HTTP server (port 3001) and Vite (port 5173) together. Type in the search box to search the whole vault; click a result to jump to the day node in-app (or open a wiki page in Obsidian).

## Viewer

Open the viewer three ways:

```bash
# Viewer + search (recommended when QMD is installed)
bash scripts/serve-timeline.sh       # Vite dev on :5173 + QMD HTTP on :3001

# Viewer only (no search)
cd timeline && npm run dev           # http://localhost:5173
cd timeline && npm run build && npm run preview  # http://localhost:4173
```

The viewer itself is a React + Tailwind app in `timeline/`. Data comes from `timeline/data/timeline.json`, generated by `scripts/build-timeline-data.ts` (auto-rebuilt on each Claude session Stop hook).

## Auto-reindex

QMD stays in sync with your vault automatically:

- **PostToolUse hook** — every `Write`/`Edit` triggers `qmd update` (fast FTS5 rescan). Graceful no-op when QMD isn't installed.
- **End of `/autoingest` and `/wiki-ingest`** — runs `qmd update && qmd embed` so newly ingested files are both indexed and vectorised.

## Privacy Model

- **On-device by default.** QMD runs entirely on your machine. No queries, no index data, no embeddings leave your laptop.
- `.gitignore` tracks only scaffolding (skills, templates, scripts, viewer source, config files). All personal content (journal entries, quicknotes, reminders, ingested sources, wiki pages) is gitignored.
- The auto-commit hook commits locally only. Push is manual and intentional.

## Known Limitations

- **Shared QMD index across projects.** qmd 2.1.0's MCP HTTP server ignores the `--index` flag, so the vault currently shares `~/.cache/qmd/index.sqlite` with any other qmd project on your machine. See `CLAUDE.md` for the workaround; tracked in [#13](https://github.com/ckallum/timeline/issues/13).
- **First `qmd query` is slow.** QMD downloads the ~1.3 GB query-expansion model on first use. Subsequent queries are fast (<500 ms on an M2). Use `qmd search` (BM25-only, no LLM) to skip the model load.

## Built with

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — the AI backbone
- [Obsidian](https://obsidian.md) — the vault UI
- [QMD](https://github.com/tobi/qmd) — on-device hybrid search
- [claude-obsidian](https://github.com/ckallum/claude-obsidian) — the LLM Wiki pattern this extends
