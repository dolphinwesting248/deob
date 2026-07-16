You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 38 functions (8 original, 30 extracted)
- Domain: **General JS**
- 0 flattened, 0 suspicious patterns, max complexity 8
- Code density: 86% active code, 14% data/other
- **String decoder**: `_0x_0x37c3` — self-modifying lookup, called by 2 functions. Strings are NOT yet decoded — you will see opaque calls like `_0x13f90f(0x1818)`.
- **Entry point**: `_0x_0x505e` → _0x_0x37c3, _S_0x_0x505e_04_if, _S_0x_0x505e_06_if, _S_0x_0x505e_06_else
- **Closure captures**: 38 variables captured by 8 functions
- **Shared variables**: _0x_0x505e (6 functions), _0x5e92de (4 functions), _0x_0x5eb9f7 (4 functions), _0x502610 (4 functions), _0x6c3dcb (4 functions)

## Alerts (0 significant)
_No significant security alerts detected._


## Start Here (top 5 by interest score)
1. `_S__0x183897_2_fn` [cc=8] — calls → decodeURIComponent
2. `_S__0x524609_3_fn` [core] — returns arg
3. `_S_0x42feef_02_else` [core] — calls → _S_return_1_fn_2; callback-driven
4. `_0x_0x505e` [core] — returns arg
5. `_0x_0x7b6cd4` [core] — void, 4S

## Skip
2 pass-through functions (zero logic). See `2-index.txt` for full function catalog.

## Reading Path
1. **This file** (0-prompt.md) — architecture, alerts, top 5 functions to start with
2. **1-structure.md** — call graph, hotspots, full alert traces, naming convention
3. **2-index.txt** — function catalog with line numbers → jump to `main.js`
