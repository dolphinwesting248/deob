You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **NOTE**: This is a webpack/rspack chunk — it likely contains only a subset of the application logic. Other chunks may contain the actual business logic, API calls, and security-relevant code. Check for additional chunk files.

> **Context**: webpack bundle + DOM manipulation

## Architecture
- 27 functions (3 original, 24 extracted)
- Domain: **webpack bundle + DOM manipulation**
- Max complexity: 8

- **String decoder**: `_0x16a5` (strings NOT decoded)
- **Entry point**: `_0xf2f4` → _0x16a5, $5_if, $6_if, $8_else
- **Closure captures**: 38 variables captured by 6 functions
- **Shared variables**: _0xf2f4 (6 functions), _0xd6895c (5 functions), _0x1878e8 (5 functions), _0x2d6cdf (3 functions), _0x59ba16 (3 functions)



## Start Here
1. `$28_fn` — [calls → decodeURIComponent]
2. `$22_loop_body` — [void, 3S; callback-driven]
3. `$29_fn` — [returns arg]
4. `$15_if` — [void, 4S]
5. `$23_declare_fn` — [void, 22S; side-effects]

## Skip
3 pass-through functions (zero logic). See `2-index.txt` for full function catalog.
