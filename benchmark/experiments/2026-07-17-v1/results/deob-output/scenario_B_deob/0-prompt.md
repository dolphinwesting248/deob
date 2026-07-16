You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **Context**: Token/Key

## Architecture
- 32 functions (12 original, 20 extracted)
- Domain: **General JS**
- 0 flattened, 0 suspicious patterns, max complexity 8
- Code density: 84% active code, 16% data/other
- **String decoder**: `_0x_0x3df4` — self-modifying lookup, called by 2 functions. Strings are NOT yet decoded — you will see opaque calls like `_0x13f90f(0x1818)`.
- **Entry point**: `_0x_0x18478c` → _0x_0x3870ec, _0x_0x17f877, _0x_0x2567f8, _S_0x_0x18478c_07_if, _0x_0x5da060
- **Closure captures**: 8 variables captured by 3 functions
- **Shared variables**: _0x_0x353b (6 functions), _0x53f029 (4 functions), _0x5df138 (4 functions), _0x2975a9 (4 functions), _0xf19544 (4 functions)

## Alerts (1 significant)
- [high] **Token/Key** in `_0x_0x18478c`: token


## Start Here (top 5 by interest score)
1. `_0x_0x18478c` [alerts] — returns via 5 paths
2. `_S__0x1d8fe5_1_fn` [cc=8] — calls → decodeURIComponent
3. `_S__0x2f041a_2_fn` [core] — returns arg
4. `_S_0x_0x18478c_07_if` [core] — returns via 2 paths; callback-driven
5. `_S_return_3_fn` [core] — returns via 2 paths; callback-driven

## Skip
3 pass-through functions (zero logic). See `2-index.txt` for full function catalog.

## Reading Path
1. **This file** (0-prompt.md) — architecture, alerts, top 5 functions to start with
2. **1-structure.md** — call graph, hotspots, full alert traces, naming convention
3. **2-index.txt** — function catalog with line numbers → jump to `main.js`
