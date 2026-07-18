You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **Context**: Graphics + Fingerprinting + DOM manipulation — Fingerprint

## Architecture
- 16 functions (2 original, 14 extracted)
- Domain: **Graphics + Fingerprinting + DOM manipulation**
- Max complexity: 8

- **String decoder**: `_0x2c99` (strings NOT decoded)
- **Entry point**: `_0x464f` → _0x2c99, $9_if, $10_if, $11_else

- **Shared variables**: _0x464f (5 functions), _0x2806db (5 functions), _0x3768f0 (5 functions), _0x2c99 (2 functions), arguments (2 functions)


## Alerts (2 significant)
- [high] **Fingerprint** in `$13_declare_fn`: WEBGL_debug_renderer_info
- [high] **Fingerprint** (×4) in $16_fn: getParameter

## Start Here
1. `$16_fn` — [returns via 2 paths] [alerts]
2. `$15_fn` — [calls → decodeURIComponent]
3. `$13_declare_fn` — [void, 12S; side-effects] [alerts]
4. `$12_loop_body` — [void, 3S; callback-driven]
5. `_0x464f` — [returns arg]

