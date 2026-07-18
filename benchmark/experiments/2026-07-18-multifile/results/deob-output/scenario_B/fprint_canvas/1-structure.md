# main.js · Structure Report

> 16 functions · (14 extracted sub-fns, 2 original) · 2 high alerts · 3 entry points

- Domain: **Graphics + Fingerprinting + DOM manipulation** · 16 functions · 14 sub-fns · max cc 8
- **Trace:** `$14_fn` → `$6_if` → `$17_fn`

## Hotspots

| — | Roots (3) | Entry points: `_0x464f`, `$13_declare_fn`, `$14_fn` |

## Alerts

| Severity | Pattern | Function | Trace | Matches |
|----------|---------|----------|-------|---------|
| high | Fingerprint | `$13_declare_fn` | no callers | WEBGL_debug_renderer_info |
| high | Fingerprint | `$16_fn` | $13_declare_fn → $16_fn | getParameter |
## Hot Groups

| Rank | Group | Edges |
|------|-------|-------|
| 1 | `top-level` | 7 |
| 2 | `6` | 2 |
| 3 | `9` | 1 |
| 4 | `10` | 1 |
| 5 | `11` | 1 |
| 6 | `13` | 1 |
| 7 | `14` | 1 |
| 8 | `16` | 1 |
| 9 | `17` | 1 |

