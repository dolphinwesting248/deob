You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 9 functions (2 original, 7 extracted)
- Domain: **General JS**
- Max complexity: 6

- **String decoder**: `_0x2e96` (strings NOT decoded)
- **Entry point**: `_0x20a6` → _0x2e96, $1_if

- **Shared variables**: _0x1d5e67 (5 functions), _0x20a6 (4 functions), _0x2e96 (2 functions), _0x473da2 (2 functions)



## Start Here
1. `$11_fn` — [calls → decodeURIComponent]
2. `$9_loop_body` — [void, 3S; callback-driven]
3. `_0x20a6` — [returns arg]
4. `$12_fn` — [returns conditional]
5. `$13_fn` — [returns conditional]

