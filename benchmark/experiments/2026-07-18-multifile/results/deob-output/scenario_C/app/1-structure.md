# main.js · Structure Report

> 27 functions · (24 extracted sub-fns, 3 original) · 1 high, 1 medium alerts · 1 flattened (while+switch) · 5 entry points

- Domain: **webpack bundle** · 27 functions · 24 sub-fns · max cc 8
- **Trace:** `$62_fn` → `$52_if` → `$66_fn`

## Hotspots

| — | Roots (5) | Entry points: `_0x4eb0`, `_0x2064bc`, `$61_fn`, `$62_fn`, `$57_declare_fn` |

## Alerts

| Severity | Pattern | Function | Trace | Matches |
|----------|---------|----------|-------|---------|
| high | API Endpoint | `$57_declare_fn` | no callers | https://track.example.com/api/v3/batch |
| medium | API Path | `$57_declare_fn` | no callers | /api/v3/batch |
## Hot Groups

| Rank | Group | Edges |
|------|-------|-------|
| 1 | `top-level` | 9 |
| 2 | `57` | 3 |
| 3 | `52` | 2 |
| 4 | `62` | 2 |
| 5 | `1` | 1 |
| 6 | `2` | 1 |
| 7 | `3` | 1 |
| 8 | `4` | 1 |
| 9 | `6` | 1 |
| 10 | `53` | 1 |

