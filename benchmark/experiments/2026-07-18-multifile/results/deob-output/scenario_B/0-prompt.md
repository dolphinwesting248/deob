You are analyzing deobfuscated JavaScript across **7 files**. The preprocessor already determined:

## Architecture
- 91 total functions across 7 files
- 2 total alerts across 1 files

## Files (priority order)

| # | File | Fns | Alerts | Action |
|---|------|-----|--------|--------|
| 1 | `fprint_canvas` (fprint\canvas.js) | 16 | 2 | **Read first** |
| 2 | `fprint_audio` (fprint\audio.js) | 17 | 0 | Optional |
| 3 | `polyfills` (polyfills.js) | 14 | 0 | Optional |
| 4 | `encoder` (encoder.js) | 11 | 0 | Optional |
| 5 | `fprint_device` (fprint\device.js) | 11 | 0 | Optional |
| 6 | `reporter` (reporter.js) | 11 | 0 | Optional |
| 7 | `scheduler` (scheduler.js) | 11 | 0 | Optional |

## Reading Path

1. Pick a file from the table above (start with **Read first** entries)
2. Enter its subdirectory
3. Read `0-prompt.md` → `1-structure.md` → `2-index.txt` → jump to `main.js`
4. Repeat for each file you need

*Data reference: see `summary.md` for cross-file hotspots and keyword index.*