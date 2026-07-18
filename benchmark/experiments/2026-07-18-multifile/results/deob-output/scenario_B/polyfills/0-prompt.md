You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 14 functions (2 original, 12 extracted)
- Domain: **General JS**
- Max complexity: 8

- **String decoder**: `_0x3ebb` (strings NOT decoded)
- **Entry point**: `_0x5ce5` → _0x3ebb, $11_if, $12_if, $13_else
- **Closure captures**: 48 variables captured by 3 functions
- **Shared variables**: _0x5ce5 (5 functions), _0xf693ca (4 functions), _0x2d5d37 (3 functions), _0x3ac9a0 (3 functions), _0x3ebb (2 functions)



## Start Here
1. `$17_fn` — [calls → decodeURIComponent]
2. `$15_iife_body` — [void, 12S; side-effects]
3. `$14_loop_body` — [void, 3S; callback-driven]
4. `_0x5ce5` — [returns arg]
5. `$9_if` — [void, 1S; side-effects]

