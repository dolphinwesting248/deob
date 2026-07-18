You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 11 functions (2 original, 9 extracted)
- Domain: **General JS**
- Max complexity: 8

- **String decoder**: `_0x102f` (strings NOT decoded)
- **Entry point**: `_0x38ff` → _0x102f, $6_if, $7_if, $8_else
- **Closure captures**: 24 variables captured by 3 functions
- **Shared variables**: _0x3189f3 (8 functions), _0x11d4f0 (7 functions), _0x38ff (5 functions), _0x5c48ec (5 functions), _0x4d1e6e (4 functions)



## Start Here
1. `$12_fn` — [calls → decodeURIComponent]
2. `$9_loop_body` — [void, 3S; callback-driven]
3. `_0x38ff` — [returns arg]
4. `$7_if` — [void, 7S; side-effects]
5. `_0x102f` — [calls → _0x102f]

