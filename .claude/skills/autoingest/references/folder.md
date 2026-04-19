# folder source handler

Watches a local directory for new files. Default: `inbox/unsorted/`.

## Config
```json
{ "type": "folder", "path": "inbox/unsorted/", "kind": "any", "enabled": true }
```

### Optional fields

- **`recursive`** (bool, default `false`) — walk subdirectories recursively instead of listing only top-level files.
- **`match`** (glob string, optional) — only process files matching this pattern (e.g. `"*.md"`).
- **`exclude`** (string[], optional) — top-level subfolder names to skip entirely during walking. Only matches the first path component relative to `path` (e.g. `"Notion"` skips `Notion/` but not `Technical/Notion/`).

Example with all optional fields:
```json
{
  "type": "folder",
  "path": "~/Library/Mobile Documents/iCloud~md~obsidian/Documents/callum/",
  "kind": "any",
  "recursive": true,
  "match": "*.md",
  "exclude": ["Notion", ".obsidian", ".trash"],
  "enabled": true
}
```

## Behavior
1. List files in `path`:
   - If `recursive` is false (default): flat listing of `path`
   - If `recursive` is true: `find "$path" -type f` with:
     - `-not -path "$path/<name>/*"` for each entry in `exclude` (anchored to base path, matches top-level only)
     - `-name "$match"` if `match` is set
   - Always quote `"$path"` in shell commands (handles spaces in iCloud paths etc.)
2. Check each against `.raw/.manifest.json`
3. For unprocessed files:
   - Copy to `.raw/` (articles/ for .md, images/ for images)
   - Run wiki-ingest single-source flow
   - If .md file contains URLs, extract and queue each as a child ingest (depth 1)
4. Update manifest with results

## "kind" options
- `any` — process any file type found
- Other kinds are reserved for future use
