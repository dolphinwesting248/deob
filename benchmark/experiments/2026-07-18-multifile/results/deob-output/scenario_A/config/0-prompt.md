You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 6 functions (2 original, 4 extracted)
- Domain: **General JS**
- Max complexity: 6

- **String decoder**: `_0x42fa` (strings NOT decoded)
- **Entry point**: `_0x1cc4` → _0x42fa, $1_if

- **Shared variables**: _0x1cc4 (4 functions), _0x42fa (2 functions), _0x430391 (2 functions), _0x2dbbfa (2 functions)



## Start Here
1. `$4_fn` — [calls → decodeURIComponent]
2. `$2_loop_body` — [void, 3S; callback-driven]
3. `_0x1cc4` — [returns arg]
4. `_0x42fa` — [calls → _0x42fa]
5. `$1_if` — [void, 4S; side-effects]

