You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

## Architecture
- 8 functions (2 original, 6 extracted)
- Domain: **General JS**
- Max complexity: 6

- **String decoder**: `_0x3e54` (strings NOT decoded)
- **Entry point**: `_0x4a67` → _0x3e54, $1_if

- **Shared variables**: _0x4a67 (4 functions), _0x3db6a6 (4 functions), _0x1c2baa (3 functions), _0x3e54 (2 functions), _0x14f703 (2 functions)



## Start Here
1. `$6_fn` — [calls → decodeURIComponent]
2. `$4_loop_body` — [void, 3S; callback-driven]
3. `_0x4a67` — [returns arg]
4. `$5_declare_fn` — [void, 7S; side-effects]
5. `$2_if` — [void, 1S]

