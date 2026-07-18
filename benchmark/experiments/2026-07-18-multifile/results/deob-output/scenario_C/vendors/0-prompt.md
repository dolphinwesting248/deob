You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **NOTE**: This is a webpack/rspack chunk — it likely contains only a subset of the application logic. Other chunks may contain the actual business logic, API calls, and security-relevant code. Check for additional chunk files.

> **Context**: webpack bundle

## Architecture
- 35 functions (3 original, 32 extracted)
- Domain: **webpack bundle**
- 1 flattened, 0 suspicious patterns, max complexity 8

- **String decoder**: `_0x41d2` (strings NOT decoded)
- **Entry point**: `$39_iife_body` → $47_fn, $48_fn, $49_fn, $50_fn, $51_fn
- **Closure captures**: 68 variables captured by 10 functions
- **Shared variables**: _0x1a9f44 (11 functions), _0x1852 (9 functions), arguments (6 functions), _0x405e8d (5 functions), _0x45d75e (5 functions)



## Start Here
1. `$40_fn` — [calls → decodeURIComponent]
2. `$38_loop_body` — [void, 3S; callback-driven]
3. `$41_fn` — [returns arg]
4. `$32_else` — [returns value]
5. `$8_else` — [calls → $55_fn]

## Skip
2 pass-through functions (zero logic). See `2-index.txt` for full function catalog.
