# folder source handler

Watches a local directory for new files. Default: `inbox/unsorted/`.

## Config
```json
{ "type": "folder", "path": "inbox/unsorted/", "kind": "any", "enabled": true }
```

## Behavior
1. List all files in `path`
2. Check each against `.raw/.manifest.json`
3. For unprocessed files:
   - Copy to `.raw/` (articles/ for .md, images/ for images)
   - Run wiki-ingest single-source flow
   - If .md file contains URLs, extract and queue each as a child ingest (depth 1)
4. Update manifest with results

## "kind" options
- `any` — process any file type found
- Other kinds are reserved for future use
