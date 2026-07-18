You are analyzing deobfuscated JavaScript from `main.js`. The preprocessor already determined:

> **NOTE**: This is a webpack/rspack chunk — it likely contains only a subset of the application logic. Other chunks may contain the actual business logic, API calls, and security-relevant code. Check for additional chunk files.

> **Context**: webpack bundle — API Endpoint, API Path

## Architecture
- 26 functions (3 original, 23 extracted)
- Domain: **webpack bundle**
- Max complexity: 8

- **String decoder**: `_0x630b` (strings NOT decoded)
- **Entry point**: `_0x2ee4` → _0x630b, $1_if, $2_if, $4_else
- **Closure captures**: 63 variables captured by 6 functions
- **Shared variables**: _0x2ee4 (6 functions), _0x4e3e0a (5 functions), _0x95107a (3 functions), arguments (3 functions), _0x15c991 (2 functions)


## Alerts (2 significant)
- [high] **API Endpoint** in `$26_declare_fn`: https://track.example.com/api/v3/batch
- [medium] **API Path** in `$26_declare_fn`: /api/v3/batch

## Start Here
1. `$28_fn` — [calls → decodeURIComponent]
2. `$26_declare_fn` — [void, 13S; can throw] [alerts]
3. `$35_fn` — [calls expr]
4. `$25_loop_body` — [void, 3S; callback-driven]
5. `$29_fn` — [returns arg]

## Skip
2 pass-through functions (zero logic). See `2-index.txt` for full function catalog.
