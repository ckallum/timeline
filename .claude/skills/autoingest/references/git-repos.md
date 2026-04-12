# git-repos source handler

Watches local git repositories for new commits since the last run.

## Config
```json
{ "type": "git-repos", "paths": ["~/Projects/timeline"], "since": "yesterday", "enabled": true }
```

## Behavior
1. For each repo path, run: `git -C <path> log --since=<last_run_or_since> --oneline --format="%h %s (%an, %ar)"`
2. If there are new commits:
   - Write summary to `.raw/git/<repo-name>-<YYYY-MM-DD>.md`:
     ```markdown
     ---
     source_type: git-log
     repo: <repo-name>
     repo_path: <full-path>
     date: YYYY-MM-DD
     commit_count: N
     ---
     # Git Activity: <repo-name> (YYYY-MM-DD)
     
     <commit list>
     ```
   - Add entries under `## Code` in today's day node:
     ```markdown
     - <repo-name>: N commits (<first-hash> → <last-hash>)
       - "commit message 1"
       - "commit message 2"
       - …
     ```
   - Bump `counts.git_commits` by N
3. Update manifest

## Note
Only watches repos listed in the config. The user can add more repos by editing `.claude/autoingest.config.json`.
