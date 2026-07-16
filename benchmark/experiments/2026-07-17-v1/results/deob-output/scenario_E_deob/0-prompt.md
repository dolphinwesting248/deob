You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 51 functions (7 original, 44 extracted)
- Domain: **General JS**
- 1 flattened, 0 suspicious patterns, max complexity 10
- Code density: 78% active code, 22% data/other
- **String decoder**: `_0x_0x2352` — self-modifying lookup, called by 2 functions. Strings are NOT yet decoded — you will see opaque calls like `_0x13f90f(0x1818)`.
- **Entry point**: `_0x_0x4177` → _0x_0x2352, _S_0x_0x4177_04_if, _S_0x_0x4177_06_if, _S_0x_0x4177_06_else
- **Closure captures**: 31 variables captured by 10 functions
- **Shared variables**: _0x_0x4177 (5 functions), _0x_0x424453 (5 functions), _0x243c9a (5 functions), _0x3ce004 (5 functions), arguments (5 functions)

## Alerts (0 significant)
_No significant security alerts detected._


## Start Here (top 5 by interest score)
1. `_0x_0x10473d` [flattened, cc=10] — returns via 4 paths
2. `_S__0x5c84ee_5_fn` [cc=8] — calls → decodeURIComponent
3. `_S_0x1819b9_04_if` [core] — returns value; callback-driven
4. `_0x_0xfe6a92` [core] — returns via 2 paths
5. `_S__0x5a89d4_6_fn` [core] — returns arg

## Skip
3 pass-through functions (zero logic). See `2-index.txt` for full function catalog.

## Reading Path
1. **This file** (0-prompt.md) — architecture, alerts, top 5 functions to start with
2. **1-structure.md** — call graph, hotspots, full alert traces, naming convention
3. **2-index.txt** — function catalog with line numbers → jump to `main.js`
