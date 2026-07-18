You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **Context**: Signature

## Architecture
- 6 functions (2 original, 4 extracted)
- Domain: **General JS**
- Max complexity: 6

- **String decoder**: `_0xadbb` (strings NOT decoded)
- **Entry point**: `_0x20ef` → _0xadbb, $1_if

- **Shared variables**: _0x3a3b3a (5 functions), _0x20ef (4 functions), _0x450c47 (3 functions), _0xadbb (2 functions), _0x13eedc (2 functions)


## Alerts (1 significant)
- [high] **Signature** in `$3_declare_fn`: sign

## Start Here
1. `$4_fn` — [calls → decodeURIComponent]
2. `$2_loop_body` — [void, 3S; callback-driven]
3. `$3_declare_fn` — [void, 7S; side-effects] [alerts]
4. `_0x20ef` — [returns arg]
5. `_0xadbb` — [calls → _0xadbb]

