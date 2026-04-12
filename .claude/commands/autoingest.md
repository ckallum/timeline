---
description: Run the background ingest loop across all configured sources. Use with /loop for recurring runs.
---

Read the `autoingest` skill. Then run the ingest loop.

Usage:
- `/autoingest` — run once, process all enabled sources
- `/loop 24h /autoingest` — run every 24 hours in the current session
- `/loop 6h /autoingest` — run every 6 hours for more active days

Configure sources in `.claude/autoingest.config.json`.
