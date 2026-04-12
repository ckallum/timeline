# timeline

Personal second brain vault — an Obsidian vault and Claude Code plugin.

## What it does

Catalogues daily life as a continuous timeline. Journals, captures quick notes, sets reminders, ingests sources from the web and local files, and rolls everything into one day node per day. A local web viewer visualizes the timeline.

## Vault Structure

```
journal/        one note per day (the timeline backbone)
inbox/          quicknotes and unprocessed captures
reminders/      active and completed reminders
wiki/           curated knowledge base (concepts, entities, sources, domains)
.raw/           immutable inbound sources
timeline/       local web viewer (React + Tailwind)
_templates/     Obsidian templater templates
_attachments/   images, PDFs, assets
scripts/        build scripts (timeline data generator)
```

## Skills

| Skill | What it does |
|-------|-------------|
| `/journal` | Write today's day note |
| `/quicknote` | Capture a fragment to inbox |
| `/reminder` | Set a reminder with due date |
| `/done` | Mark a reminder complete |
| `/autoingest` | Run the background ingest loop |
| `/promote` | Turn a quicknote into a wiki page |
| `/timeline` | Build and open the web viewer |
| `/day [date]` | View a specific day's node |
| `/superhuman` | Query across all vault content |
| `/wiki` | Wiki setup and routing |
| `/wiki-ingest` | Ingest sources into the wiki |
| `/wiki-query` | Answer questions from wiki content |
| `/wiki-lint` | Wiki health check |
| `/save` | Save conversation as a wiki note |
| `/autoresearch` | Autonomous research loop |
| `/canvas` | Visual canvas operations |

## Installation

1. Clone this repo to `~/Projects/timeline`
2. Open the folder in Obsidian as a vault
3. Open the folder in Claude Code: `cd ~/Projects/timeline && claude`
4. Run `/wiki` to verify the vault is healthy
5. Start the ingest loop: `/loop 24h /autoingest`

## Privacy Model

`.gitignore` tracks only scaffolding (skills, templates, scripts, viewer source, config files). All personal content (journal entries, quicknotes, reminders, ingested sources, wiki pages) is gitignored. The auto-commit hook commits locally only. Push is manual and intentional.

## Built with

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — the AI backbone
- [Obsidian](https://obsidian.md) — the vault UI
- [claude-obsidian](https://github.com/ckallum/claude-obsidian) — the LLM Wiki pattern this extends
