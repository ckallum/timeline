# rss source handler

Fetches RSS/Atom feeds and ingests new entries.

## Config
```json
{ "type": "rss", "feeds": ["https://example.com/feed.xml"], "enabled": false }
```

## Behavior
1. For each feed URL, fetch the XML
2. Parse entries (title, link, date, content/summary, GUID)
3. Check each entry's GUID against `.raw/.manifest.json`
4. For new entries:
   - Save to `.raw/articles/<slug>-<YYYY-MM-DD>.md` with frontmatter
   - Run wiki-ingest on the saved file
   - If entry has a link and content is a summary, also fetch the full page via wiki-ingest URL flow
5. Update manifest with GUIDs processed

## Ships disabled
RSS feeds are disabled by default. The user enables specific feeds by editing the config.
