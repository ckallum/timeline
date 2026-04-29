---
name: marp
description: >
  Generate a MARP presentation deck from wiki content, render to HTML and/or PDF,
  and register it with the timeline viewer so it shows up in the Decks picker.
  Triggers on: "marp", "/marp", "make a deck", "build a deck", "presentation",
  "slide deck", "turn this into slides".
allowed-tools: Read Write Edit Glob Grep Bash
---

# marp: Wiki → Deck

Turn anything in the vault — a person page, a concept, a project retro, a
question answer, a day note — into a MARP deck. The skill writes the `.marp.md`
source into `wiki/decks/`, renders the output into `viewer/public/decks/`
where Vite serves it over HTTP, and updates `viewer/data/decks.json` so the
timeline viewer's "Decks" picker lists it.

---

## Invocation

- `/marp <topic>` — write a deck on `<topic>` from what the vault knows.
- `/marp <topic> --pdf` — also render PDF.
- `/marp <topic> --html` — HTML only (this is the default; flag is explicit).
- `/marp <topic> --both` — render both HTML and PDF.
- `/marp` with no args — propose a topic based on the current conversation.

Default output is **HTML**. HTML is self-contained (one file, no assets) and
works in-browser with keyboard navigation, so it's the right default for the
timeline integration. PDF is for sharing.

---

## Workflow

### 1. Gather material
- Read the relevant wiki pages. Use `wiki/hot.md` and `wiki/index.md` as entry
  points. If the topic is a person or entity, read `wiki/entities/<name>.md`.
- Pull any domain or concept pages linked from that source.
- For topic-based decks, run a `Grep` across the vault for the topic slug and
  read the top 5–10 hits.

### 2. Draft the deck
Write the deck to `wiki/decks/<slug>.marp.md`. The slug is kebab-case of the
topic. Structure:

- **Slide 1** — title, tagline, provenance line (`Generated from the second brain · YYYY-MM-DD`).
- **Slide 2** — "the one-line read": a single-sentence distillation with a
  supporting blockquote.
- **Middle slides** — one idea per slide. Favour tables, lists, and small
  diagrams over paragraphs. Target 10–20 slides.
- **Final slide** — "where to go next": wiki page references, related work.

Use the frontmatter template below.

### 3. Render

Run these from the repo root (paths are relative to it).

HTML (default):
```bash
npx -y -p @marp-team/marp-cli@latest marp \
  wiki/decks/<slug>.marp.md \
  -o viewer/public/decks/<slug>.html \
  --html
```

PDF (when `--pdf` or `--both`):
```bash
npx -y -p @marp-team/marp-cli@latest marp \
  wiki/decks/<slug>.marp.md \
  -o viewer/public/decks/<slug>.pdf \
  --pdf --allow-local-files
```

First run downloads Chromium for `marp-cli` puppeteer. If that fails (offline
or sandboxed), fall back to `--html` and tell the user the PDF step was
skipped.

### 4. Update the decks index
Append/update an entry in `viewer/data/decks.json`. If the file doesn't
exist, create it. Schema:

```json
{
  "generated_at": "2026-04-22T12:34:56Z",
  "decks": [
    {
      "slug": "callum-ke-profile",
      "title": "Callum Ke",
      "subtitle": "Systems architect who happens to be starting a company",
      "source": "wiki/decks/callum-ke-profile.marp.md",
      "html": "decks/callum-ke-profile.html",
      "pdf": "decks/callum-ke-profile.pdf",
      "slides": 16,
      "created": "2026-04-22",
      "updated": "2026-04-22"
    }
  ]
}
```

If the slug already exists, update in place (bump `updated`, refresh slide count,
add `pdf` field if just-rendered). Otherwise prepend the new entry.

### 5. Report
One sentence: what was written, what was rendered, how to view it.
- Source file path
- Rendered HTML/PDF paths
- Hint: "Run the `/timeline` slash command and click the Decks button, or open
  `http://localhost:5173/` and click Decks, or jump straight to
  `http://localhost:5173/decks/<slug>.html`."

---

## Frontmatter Template

```markdown
---
marp: true
theme: default
paginate: true
class: lead
backgroundColor: #fafafa
color: #111
style: |
  section { font-family: 'Inter', -apple-system, sans-serif; padding: 60px; }
  h1 { color: #111; font-weight: 700; font-size: 56px; letter-spacing: -0.02em; }
  h2 { color: #111; font-weight: 600; font-size: 36px; letter-spacing: -0.01em; }
  h3 { color: #555; font-weight: 500; }
  strong { color: #0066cc; }
  em { color: #777; font-style: normal; }
  blockquote { border-left: 4px solid #0066cc; color: #333; font-style: italic; }
  code { background: #eee; padding: 2px 6px; border-radius: 4px; }
  ul, ol { line-height: 1.7; }
  .small { font-size: 0.75em; color: #666; }
  .tagline { font-size: 0.9em; color: #666; margin-top: -10px; }
---
```

The accent `#0066cc` is the house colour. Change per-deck if the topic calls
for it (dark theme for retros, warmer for journal decks).

---

## Content Rules

- **No filler slides.** Every slide earns its place; drop it if it doesn't.
- **One claim per slide.** Don't stack unrelated points.
- **Cite the vault.** Footer-small text with `wiki/<path>.md` provenance when
  a slide draws from a specific page.
- **Prefer tables for comparisons**, lists for sequences, blockquotes for
  pull-quotes.
- **Don't regurgitate.** Synthesize across pages. If the deck is just a wiki
  page reformatted, delete it — the wiki page is already the better artifact.

---

## Gotchas

- `marp-cli`'s HTML output uses `--html` to enable inline HTML like `<span
  class="tagline">`. Without it, tags are stripped.
- PDF rendering requires Chromium; first invocation downloads ~100MB.
- `viewer/public/decks/*.html` is served by Vite dev at
  `http://localhost:5173/decks/<slug>.html`. For production builds, `vite
  build` copies `public/` → `dist/` automatically.
- The `decks.json` file is NOT consumed by `build-timeline-data.ts`; it's a
  parallel artifact read directly by the viewer's Decks picker.
- Don't commit deck artefacts: `wiki/decks/`, `viewer/public/decks/`, and
  `viewer/data/decks.json` are all gitignored by the standard vault rules.

---

## Codify on Repeat

If the user keeps asking for decks on the same shape of topic (e.g. person
profiles, weekly retros), propose a template macro in this skill rather than
re-deriving structure each time.
