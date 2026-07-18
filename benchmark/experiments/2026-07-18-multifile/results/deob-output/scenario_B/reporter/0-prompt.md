You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 11 functions (2 original, 9 extracted)
- Domain: **General JS**
- Max complexity: 8

- **String decoder**: `_0x1402` (strings NOT decoded)
- **Entry point**: `_0x4b42` → _0x1402, $4_if, $5_if, $6_else
- **Closure captures**: 39 variables captured by 3 functions
- **Shared variables**: _0x325499 (8 functions), _0x3517c9 (8 functions), _0x4b42 (5 functions), _0x1402 (2 functions), _0x16ff49 (2 functions)



## Start Here
1. `$10_fn` — [calls → decodeURIComponent]
2. `$7_loop_body` — [void, 3S; callback-driven]
3. `_0x4b42` — [returns arg]
4. `$5_if` — [void, 7S; side-effects]
5. `_0x1402` — [calls → _0x1402]

