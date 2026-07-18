You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 8 functions (2 original, 6 extracted)
- Domain: **General JS**
- Max complexity: 7

- **String decoder**: `_0x595d` (strings NOT decoded)
- **Entry point**: `_0x41fd` → _0x595d, $5_if

- **Shared variables**: _0x41fd (4 functions), _0x595d (2 functions)



## Start Here
1. `$9_fn` — [returns arg; callback-driven, can throw]
2. `$8_fn` — [calls → decodeURIComponent]
3. `$7_iife_body` — [void, 6S; side-effects]
4. `$6_loop_body` — [void, 3S; callback-driven]
5. `_0x41fd` — [returns arg]

