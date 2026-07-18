You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **NOTE**: This is a webpack/rspack chunk — it likely contains only a subset of the application logic. Other chunks may contain the actual business logic, API calls, and security-relevant code. Check for additional chunk files.

> **Context**: webpack bundle

## Architecture
- 28 functions (3 original, 25 extracted)
- Domain: **webpack bundle**
- 1 flattened, 0 suspicious patterns, max complexity 8

- **String decoder**: `_0x4915` (strings NOT decoded)
- **Entry point**: `_0x4304` → _0x4915, $28_if, $29_if, $31_else
- **Closure captures**: 54 variables captured by 7 functions
- **Shared variables**: _0x320493 (12 functions), _0x4304 (10 functions), _0x131921 (4 functions), _0x27847e (4 functions), arguments (3 functions)



## Start Here
1. `$36_fn` — [calls → decodeURIComponent]
2. `$32_loop_body` — [void, 3S; callback-driven]
3. `$37_fn` — [returns arg]
4. `$1_try` — [returns via 2 paths]
5. `$40_fn` — [calls expr; callback-driven]

## Skip
2 pass-through functions (zero logic). See `2-index.txt` for full function catalog.
