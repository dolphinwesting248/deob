You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **NOTE**: This is a webpack/rspack chunk — it likely contains only a subset of the application logic. Other chunks may contain the actual business logic, API calls, and security-relevant code. Check for additional chunk files.

> **Context**: webpack bundle — API Endpoint, API Path

## Architecture
- 27 functions (3 original, 24 extracted)
- Domain: **webpack bundle**
- 1 flattened, 0 suspicious patterns, max complexity 8

- **String decoder**: `_0x203e` (strings NOT decoded)
- **Entry point**: `_0x4eb0` → _0x203e, $3_if, $4_if, $6_else
- **Closure captures**: 91 variables captured by 7 functions
- **Shared variables**: _0x2994a9 (11 functions), _0x4eb0 (8 functions), _0x43eee8 (4 functions), _0x2064bc (3 functions), _0x235dd3 (3 functions)


## Alerts (2 significant)
- [high] **API Endpoint** in `$57_declare_fn`: https://track.example.com/api/v3/batch
- [medium] **API Path** in `$57_declare_fn`: /api/v3/batch

## Start Here
1. `$59_fn` — [calls → decodeURIComponent]
2. `$57_declare_fn` — [void, 15S; can throw] [alerts] [flat]
3. `$64_fn` — [returns via 2 paths]
4. `$56_loop_body` — [void, 3S; callback-driven]
5. `$60_fn` — [returns arg]

## Skip
2 pass-through functions (zero logic). See `2-index.txt` for full function catalog.
