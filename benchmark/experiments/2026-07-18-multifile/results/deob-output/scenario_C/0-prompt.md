You are analyzing deobfuscated JavaScript across **5 files**. The preprocessor already determined:

## Architecture
- 143 total functions across 5 files
- 4 total alerts across 2 files

## Files (priority order)

| # | File | Fns | Alerts | Action |
|---|------|-----|--------|--------|
| 1 | `vendors` (vendors.js) | 35 | 0 | Read |
| 2 | `app` (app.js) | 27 | 2 | **Read first** |
| 3 | `sender` (sender.js) | 26 | 2 | **Read first** |
| 4 | `analytics` (analytics.js) | 28 | 0 | Read |
| 5 | `runtime` (runtime.js) | 27 | 0 | Read |

## Reading Path

1. Pick a file from the table above (start with **Read first** entries)
2. Enter its subdirectory
3. Read `0-prompt.md` → `1-structure.md` → `2-index.txt` → jump to `main.js`
4. Repeat for each file you need

*Data reference: see `summary.md` for cross-file hotspots and keyword index.*