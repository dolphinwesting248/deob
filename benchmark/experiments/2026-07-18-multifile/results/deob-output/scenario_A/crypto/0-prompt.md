You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 6 functions (2 original, 4 extracted)
- Domain: **General JS**
- Max complexity: 6

- **String decoder**: `_0x3199` (strings NOT decoded)
- **Entry point**: `_0xec8c` → _0x3199, $1_if

- **Shared variables**: _0x2daa87 (9 functions), _0x139789 (8 functions), _0x1e0e12 (6 functions), _0xec8c (4 functions), _0x25384d (4 functions)



## Start Here
1. `$4_fn` — [calls → decodeURIComponent]
2. `$2_loop_body` — [void, 3S; callback-driven]
3. `_0xec8c` — [returns arg]
4. `_0x3199` — [calls → _0x3199]
5. `$1_if` — [void, 4S; side-effects]

