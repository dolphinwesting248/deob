You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **Context**: Fingerprinting

## Architecture
- 11 functions (2 original, 9 extracted)
- Domain: **Fingerprinting**
- Max complexity: 8

- **String decoder**: `_0x18a0` (strings NOT decoded)
- **Entry point**: `_0x29fd` → _0x18a0, $3_if, $4_if, $5_else

- **Shared variables**: _0x29fd (5 functions), _0x18a0 (2 functions), _0x2a1f16 (2 functions), _0x1226e9 (2 functions)



## Start Here
1. `$9_fn` — [calls → decodeURIComponent]
2. `$6_loop_body` — [void, 3S; callback-driven]
3. `_0x29fd` — [returns arg]
4. `$4_if` — [void, 7S; side-effects]
5. `_0x18a0` — [calls → _0x18a0]

