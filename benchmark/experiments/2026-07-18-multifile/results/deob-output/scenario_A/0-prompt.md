You are analyzing deobfuscated JavaScript across **6 files**. The preprocessor already determined:

## Architecture
- 43 total functions across 6 files
- 1 total alerts across 1 files

## Files (priority order)

| # | File | Fns | Alerts | Action |
|---|------|-----|--------|--------|
| 1 | `storage` (storage.js) | 9 | 0 | Optional |
| 2 | `client` (client.js) | 8 | 0 | Optional |
| 3 | `polyfills` (polyfills.js) | 8 | 0 | Optional |
| 4 | `signer` (signer.js) | 6 | 1 | **Read first** |
| 5 | `config` (config.js) | 6 | 0 | Optional |
| 6 | `crypto` (crypto.js) | 6 | 0 | Optional |

## Reading Path

1. Pick a file from the table above (start with **Read first** entries)
2. Enter its subdirectory
3. Read `0-prompt.md` → `1-structure.md` → `2-index.txt` → jump to `main.js`
4. Repeat for each file you need

*Data reference: see `summary.md` for cross-file hotspots and keyword index.*