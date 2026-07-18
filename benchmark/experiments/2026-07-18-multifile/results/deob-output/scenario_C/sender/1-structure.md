# main.js · Structure Report

> 26 functions · (23 extracted sub-fns, 3 original) · 1 high, 1 medium alerts · 5 entry points

- Domain: **webpack bundle** · 26 functions · 23 sub-fns · max cc 8
- **Trace:** `$30_fn` → `$22_if` → `$36_fn`

## Hotspots

| — | Roots (5) | Entry points: `_0x95107a`, `_0x2ee4`, `$30_fn`, `$31_fn`, `$26_declare_fn` |

## Alerts

| Severity | Pattern | Function | Trace | Matches |
|----------|---------|----------|-------|---------|
| high | API Endpoint | `$26_declare_fn` | no callers | https://track.example.com/api/v3/batch |
| medium | API Path | `$26_declare_fn` | no callers | /api/v3/batch |
## Hot Groups

| Rank | Group | Edges |
|------|-------|-------|
| 1 | `top-level` | 9 |
| 2 | `26` | 4 |
| 3 | `22` | 2 |
| 4 | `1` | 1 |
| 5 | `2` | 1 |
| 6 | `4` | 1 |
| 7 | `5` | 1 |
| 8 | `6` | 1 |
| 9 | `19` | 1 |
| 10 | `30` | 1 |

