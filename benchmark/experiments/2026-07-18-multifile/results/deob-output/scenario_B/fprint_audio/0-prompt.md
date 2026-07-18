You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 17 functions (2 original, 15 extracted)
- Domain: **General JS**
- Max complexity: 8

- **String decoder**: `_0x2363` (strings NOT decoded)
- **Entry point**: `_0x1b59` → _0x2363, $14_if, $15_if, $16_else

- **Shared variables**: _0x1b59 (5 functions), _0x559c44 (5 functions), _0x4fefe1 (3 functions), _0x2363 (2 functions), $20_fn (2 functions)



## Start Here
1. `$19_fn` — [calls → decodeURIComponent]
2. `$17_loop_body` — [void, 3S; callback-driven]
3. `_0x1b59` — [returns arg]
4. `$11_if` — [returns via 2 paths]
5. `$15_if` — [void, 7S; side-effects]

