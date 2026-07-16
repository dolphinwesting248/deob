You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **Context**: Network — Token/Key, Storage

## Architecture
- 13 functions (8 original, 5 extracted)
- Domain: **Network**
- 0 flattened, 0 suspicious patterns, max complexity 6
- Code density: 72% active code, 28% data/other
- **String decoder**: `_0x_0x4613` — self-modifying lookup, called by 2 functions. Strings are NOT yet decoded — you will see opaque calls like `_0x13f90f(0x1818)`.
- **Entry point**: `_0x_0x11ac` → _0x_0x4613, _S_0x_0x11ac_04_if
- **Closure captures**: 2 variables captured by 1 functions
- **Shared variables**: _0x_0x11ac (8 functions), _0x_0xbf9ba1 (3 functions), _0x_0x18670f (3 functions), _0x_0x4613 (2 functions), _0x5bd756 (2 functions)

## Alerts (3 significant)
- [high] **Token/Key** in `_0x_0x55d5c1`: Authorization
- [medium] **Storage** in `_0x_0x598566`: setItem
- [medium] **Storage** (×2) in _0x_0x141588, _0x_0x4f87af: getItem


## Start Here (top 5 by interest score)
1. `_0x_0xbf9ba1` [core] — calls expr; can throw
2. `_S__0x4c55c0_0_fn` [cc=6] — calls → decodeURIComponent
3. `_0x_0x55d5c1` [alerts] — factory
4. `_0x_0x141588` [alerts] — calls → _0x_0xbf9ba1; can throw
5. `_0x_0x598566` [alerts] — returns prop

## Skip
0 pass-through functions (zero logic). See `2-index.txt` for full function catalog.

## Reading Path
1. **This file** (0-prompt.md) — architecture, alerts, top 5 functions to start with
2. **1-structure.md** — call graph, hotspots, full alert traces, naming convention
3. **2-index.txt** — function catalog with line numbers → jump to `main.js`
