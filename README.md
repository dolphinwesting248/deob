# deob

Deob is an AST-based JavaScript deobfuscation framework, purpose-built as a **data preprocessing tool for LLM-driven reverse engineering**.

- **Universal.** No obfuscator detection, no signature matching. obfuscator.io, JSVMP, webpack bundles, custom obfuscators — all treated the same.
- **LLM-oriented.** Structure reports, call graphs, string alerts, compact index, function categorization — output designed for LLM consumption, not just human readability.

## Quick Start

```bash
npm install
npm link
deob init                    # create deob.config.js
# edit deob.config.js — set input path and options
deob                         # run with config
deob -c other.config.js      # explicit config path
```

## Configuration

`deob.config.js` format:

```javascript
module.exports = {
  input: "src/main.js",             // file, directory, or array
  // output: "out/",                // optional — auto-derived from input
  split: false,                     // per-function files
  metrics: false,                   // HTML readability report
  md: true,                         // 0-prompt.md + 1-structure.md
  index: true,                      // 2-index.txt
  tier: 3,                          // 1=alerts+hotspots, 2=+callees, 3=all
  fold: false,                      // collapse mechanical functions
  denoise: [                        // alert denoising rules (optional)
    { match: "regex-source", label: "Label", severity: "low" },
  ],
};
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `input` | `string \| string[]` | required | JS file(s) or directory |
| `output` | `string` | auto | Output directory |
| `split` | `boolean` | `false` | Write each function to separate file |
| `metrics` | `boolean` | `false` | Generate HTML before/after report |
| `md` | `boolean` | `true` | Generate 0-prompt.md + 1-structure.md |
| `index` | `boolean` | `true` | Generate 2-index.txt |
| `tier` | `1 \| 2 \| 3` | `3` | Output filtering level |
| `fold` | `boolean` | `false` | Collapse mechanical functions to comments |
| `denoise` | `DenoiseRule[]` | defaults | Alert denoising rules |

See [docs/llm-output-tuning.md](docs/llm-output-tuning.md) for detailed guidance on `tier` and `fold`.

## Output Files

All output goes into a directory. Files are numbered to guide LLM agents through a natural reading order:

```
output.deob/
├── 0-prompt.md       ← LLM analysis entry (architecture, alerts, top 5, reading path)
├── 1-structure.md    ← call graph, hotspots, alert traces, naming convention
├── 2-index.txt       ← function catalog with line numbers for jump-reading
├── main.js           ← deobfuscated code — jump-read only, do not read first
└── metrics.html      ← readability report (metrics: true)
```

**Directory input** recursively processes nested subdirectories. A top-level `0-prompt.md` provides the cross-file entry point. `summary.md` aggregates cross-file analysis.

## Agent-Oriented Navigation

Output files are designed for LLM agents (Claude Code, Codex, etc.) to discover and follow naturally:

| Step | File | Purpose |
|------|------|---------|
| 1 | `0-prompt.md` | "What to read and why" — architecture, alerts, top 5 functions, reading path |
| 2 | `1-structure.md` | "What this file contains" — domain, hotspots, alerts, call graph, naming |
| 3 | `2-index.txt` | "Where things are" — function catalog with line numbers for jump-reading |

**Single file**: Agent `ls` sees `0-`, `1-`, `2-` in sort order → reads in sequence → jump-reads `main.js` by line number.

**Directory**: Agent `ls` sees top-level `0-prompt.md` → picks interesting files → enters subdirectory → follows `0-` → `1-` → `2-` → jump-reads.

## Pipeline

| Step | Pass | Description |
|------|------|-------------|
| 0 | `sanitizeReservedWords` | Rename reserved-word identifiers (let, default, delete…) |
| 1 | `processAllFunctions` | Collect all function nodes, process innermost-first |
| 2 | `extractTopLevelIIFEs` | Extract top-level IIFEs from comma chains |
| 3 | `hoistDeclarations` | Import→top, export→bottom; var/let/const/fn to top of scope |
| 4 | `extractInlineFunctions` | Lift embedded function expressions to top level |
| 5 | `simplify` | Fold constants, simplify booleans, normalize hex strings |
| 6 | `normalizeShortCircuit` | Convert `A\|\|B` → `if (!A) { B }` |
| 7 | `expandSequences` | Break comma chains into independent statements |
| 8 | `normalizeShortCircuit` | Re-normalize after expansion |
| 9 | `eliminateDeadCode` | Remove unreachable code, `if(false)` branches |
| 10 | `inlineReadOnlyProperties` | Replace `cfg.PROP` with literal values |
| 10b | `inlineConstObjects` | Replace `cfg.timeout` with `5000` when cfg is const |
| 11 | `removeUnusedHelpers` | Delete unreferenced function declarations |
| 12 | `simplifyRedundantConditions` | `if(a) return true; return false` → `return !!a` |
| 13 | `inlinePureWrappers` | Remove functions that are just `return call(args)` |
| 14 | `sortByCallTree` | Topological sort: callees before callers |
| 15 | `inlineSingleCallerFns` | Inline functions called from exactly one place |
| 16 | `normalizeSyntax` | `~arr.indexOf` → `arr.includes`, `~~x` → `Math.trunc` |
| 17 | `extractInlineFunctions` | Re-extract exposed inline functions |
| 18 | `annotateAlerts` | Inject `[Label]` comments for security-relevant patterns |
| 19 | `sanitizeReservedWords` | Re-sanitize (pipeline may introduce new reserved words) |
| 20 | `pushDataToBottom` | Move DATA-heavy functions to end with separator |

## Alert System

Three detection layers:

1. **String-based** (`ALERT_PATTERNS`): regex scan of string literals — API endpoints, tokens, crypto, eval, storage, DOM sinks, network, fingerprints, cookies
2. **AST-based**: detect `debugger`, `eval()`, `new Function()` via AST node types
3. **Denoise**: configurable rules to downgrade false-positive alerts

Severity levels: `critical` > `high` > `medium` > `low` > `info`

## Function Categories

Functions are automatically categorized:

| Category | Detection | Example |
|----------|-----------|---------|
| `data` | Large hex string arrays | String lookup tables |
| `core` | Original function names | Entry points |
| `framework` | Vue/React/Regenerator patterns | Framework internals |
| `network` | fetch/xhr/axios patterns | HTTP client code |
| `crypto` | sign/encrypt/hash patterns | Cryptographic operations |
| `websocket` | WebSocket patterns | WS connection code |
| `polyfill` | core-js/ToPrimitive patterns | ES polyfills |
| `callback` | `_S_return_*` names | Extracted callbacks |
| `branch` | `_S_*_if/_try/_catch` | Extracted branches |
| `other` | None of the above | Uncategorized |

## Naming Convention

All extracted sub-functions follow: `_S_<parent>_<seq>_<hint>`

| Component | Meaning |
|-----------|---------|
| `_S_` | Prefix for extracted sub-functions |
| `<parent>` | Parent function name, method name, or `lXXXX` for anonymous |
| `<seq>` | Two-digit extraction order |
| `<hint>` | `if`, `else`, `try`, `catch`, `fn`, `iife_body`... |
| `_L<line>` | (Collision only) Source line disambiguator |

When two sub-functions share the same parent + seq + hint, `_L<source line>` is appended:

```
_S_l251_01_try          ← first try block (unique, no _L needed)
_S_l251_L1364_01_try    ← collision! disambiguated by source line 1364
_S_l251_L1548_01_try    ← another collision, source line 1548
```

## Output Examples

### Comma operator expansion + inline function extraction

```javascript
// Input
function a0_0x5465(_0x147aca,_0x1c469e){var _0x477d9d=a0_0x1cb6();return (a0_0x5465=function(_0x593f2d,_0x4d5e1e){var _0x2a8c=_0x477d9d[_0x593f2d];return _0x2a8c?_0x2a8c(_0x4d5e1e,_0x147aca):_0x4d5e1e}),a0_0x5465(_0x147aca,_0x1c469e)}

// Output
function a0_0x5465(_0x147aca, _0x1c469e) {
  var _0x477d9d = a0_0x1cb6();
  a0_0x5465 = _S_return_1_fn;
  return a0_0x5465(_0x147aca, _0x1c469e);
}
function _S_return_1_fn(_0x593f2d, _0x4d5e1e, _0x477d9d, _0x147aca) {
  var _0x2a8c = _0x477d9d[_0x593f2d];
  return _0x2a8c ? _0x2a8c(_0x4d5e1e, _0x147aca) : _0x4d5e1e;
}
```

↑ `return (a=fn, b)` → two statements; inline `function` lifted to `_S_return_1_fn` with external refs as params.

### Short-circuit polyfill → if block

```javascript
// Input
"undefined"==typeof Element||Element.prototype.addEventListener||(u=[],Ao=function(n,t){...})

// Output
if ("undefined" != typeof Element && !Element.prototype.addEventListener) {
  u = [];
  Ao = function (n, t) { ... };
}
```

↑ `A||B||(C,D)` → `if(!A&&!B){C;D;}`

### Hex string normalization

```javascript
// Input
var _0xa1b2 = ["\x68\x74\x74\x70\x73\x3a\x2f\x2f\x61\x70\x69"];

// Output
var _0xa1b2 = ["https://api"];
```

↑ `\x` escape sequences decoded to readable strings.

## Directory Structure

```
deob.js               ← CLI entry point, config parsing
scripts/
  config.js           ← User-facing config (parser, t, DEFAULT_DENOISE)
  constants.js        ← Internal constants (RESERVED, GLOBALS, ALERT_PATTERNS, SKIP_KEYS, etc.)
  ast-utils.js        ← AST walkers, pattern detectors, clone
  scope.js            ← Variable scope & external reference analysis
  naming.js           ← Sub-function naming (_S_ prefix, collision detection)
  emit.js             ← Sub-function AST node creation, safeParam
  extract.js          ← Syntactic extraction (IIFE, try/catch, loop, if/else, switch)
  traverse.js         ← Innermost-first function collection
  wrapper.js          ← Top-level IIFE extraction from comma chains
  pipeline.js         ← 20-step pipeline orchestration
  passes/
    simplify.js       ← Constant folding, boolean, string, hex, short-circuit, syntax
    dead-code.js      ← Dead code elimination, unused helpers, DATA separation
    inline.js         ← Property/wrapper/single-caller inlining
    declarations.js   ← Hoisting, sanitization, alert annotation, call-tree sorting
    index.js          ← Re-exports all pass modules
  structure/
    analyze.js        ← AST analysis, domain classification, function categorization
    report.js         ← Markdown/prompt generation, reading guide
    index-gen.js      ← Compact index.txt generation
    tier.js           ← Tier filtering (1=alerts, 2=+callees, 3=all)
    cross-file.js     ← Multi-file summary and cross-readme
    index.js          ← Re-exports all structure modules
  types/              ← TypeScript declarations (.d.ts) — no runtime code
    index.d.ts        ← Entry point
    config.d.ts       ← DeobConfig, DenoiseRule
    analysis.d.ts     ← FunctionMeta, Alert, StructureReport
    ast.d.ts          ← ASTNode, ExtractResult, PassFunction
    constants.d.ts    ← AlertPattern, Thresholds, OutputFiles
    passes.d.ts       ← Pass function signatures
  metrics.js          ← Before/after readability metrics, HTML report
  index.js            ← Public API re-export
```

## API

```javascript
const { main } = require("./scripts");
main({ input: "obfuscated.js", output: "out/", split: true });
```

## License

ISC
