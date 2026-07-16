You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 21 functions (4 original, 17 extracted)
- Domain: **General JS**
- 0 flattened, 0 suspicious patterns, max complexity 6
- Code density: 86% active code, 14% data/other
- **String decoder**: `_0x_0x4025` — self-modifying lookup, called by 2 functions. Strings are NOT yet decoded — you will see opaque calls like `_0x13f90f(0x1818)`.
- **Entry point**: `_0x_0x5d7c` → _0x_0x4025, _S_0x_0x5d7c_04_if
- **Closure captures**: 19 variables captured by 4 functions
- **Shared variables**: _0x_0x5d7c (5 functions), _0x3a7bdc (3 functions), _0x420344 (3 functions), _0x318511 (3 functions), _0x1ca3d7 (3 functions)

## Alerts (0 significant)
_No significant security alerts detected._


## Start Here (top 5 by interest score)
1. `_S__0x402fc3_2_fn` [cc=6] — calls → decodeURIComponent
2. `_S_0x_0x8762fd_03_try` [core] — returns arg; callback-driven
3. `_0x_0x5d7c` [core] — returns arg
4. `_0x_0x8762fd` [core] — void, 4S
5. `_S_l1_L1_02_if` [core] — calls → _S_return_1_fn_2

## Skip
2 pass-through functions (zero logic). See `2-index.txt` for full function catalog.

## Reading Path
1. **This file** (0-prompt.md) — architecture, alerts, top 5 functions to start with
2. **1-structure.md** — call graph, hotspots, full alert traces, naming convention
3. **2-index.txt** — function catalog with line numbers → jump to `main.js`
