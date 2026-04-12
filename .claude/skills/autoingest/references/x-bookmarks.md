# x-bookmarks source handler (stretch goal)

Ingests bookmarks from X (Twitter). Two implementation paths:

## Option 1: Manual export (recommended first)
User exports bookmarks via a browser extension (Dewey, etc.) as JSON or CSV into `inbox/unsorted/`. The folder handler recognizes the file format, splits into individual bookmark files in `.raw/bookmarks/<tweet-id>.md`, and ingests each via wiki-ingest.

Expected export format per bookmark:
```markdown
---
source_type: x-bookmark
tweet_id: "1234567890"
author: "@handle"
url: "https://x.com/handle/status/1234567890"
text: "the tweet text"
date: YYYY-MM-DD
media: []
---

[tweet text]
```

## Option 2: Cookie-based scraper (stretch)
The user exports their `auth_token` cookie from a logged-in X session and stores it at `~/.config/timeline/x-cookie` (outside the repo). The ingester hits `https://x.com/i/api/graphql/<id>/Bookmarks` with that cookie.

This is brittle: X rotates GraphQL endpoint IDs. When it breaks, fall back to Option 1.

## Config
```json
{ "type": "x-bookmarks", "enabled": false, "auth_method": "cookie", "since": "yesterday" }
```

## Ships disabled
X bookmarks ingestion is disabled by default. Enable only after setting up one of the two paths.
