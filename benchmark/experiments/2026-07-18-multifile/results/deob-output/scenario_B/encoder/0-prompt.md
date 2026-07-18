You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 11 functions (2 original, 9 extracted)
- Domain: **General JS**
- Max complexity: 8

- **String decoder**: `_0x297a` (strings NOT decoded)
- **Entry point**: `_0x2622` → _0x297a, $1_if, $2_if, $3_else

- **Shared variables**: _0x2622 (8 functions), _0x45c95b (4 functions), _0x297a (2 functions), _0xef121f (2 functions), _0x2720ba (2 functions)



## Start Here
1. `$11_fn` — [calls → decodeURIComponent]
2. `$9_loop_body` — [void, 3S; callback-driven]
3. `_0x2622` — [returns arg]
4. `$2_if` — [void, 7S; side-effects]
5. `_0x297a` — [calls → _0x297a]

