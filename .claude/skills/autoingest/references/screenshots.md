# screenshots source handler

Watches a directory for new screenshots and ingests them via vision.

## Config
```json
{ "type": "screenshots", "path": "~/Desktop", "match": "Screenshot*.png", "after": "yesterday", "enabled": false }
```

## Behavior
1. Glob `<path>/<match>` for files newer than `after`
2. For each new screenshot:
   - Copy to `_attachments/screenshots/<filename>`
   - Run wiki-ingest image flow (reads image, extracts text/content, creates wiki page)
   - Add entry under `## Captures` in today's day node
   - Bump `counts.photos`
3. Update manifest

## Ships disabled
Screenshot ingestion is disabled by default. High volume; enable only when actively capturing.
