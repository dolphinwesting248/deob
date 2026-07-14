# deob

Universal JavaScript deobfuscation pipeline — splits obfuscated code into readable sub-functions by syntactic structure.

Zero configuration. Works on any obfuscated JavaScript: **obfuscator.io**, **JSVMP**, **webpack bundles**, **minified code**.

## Quick Start

```bash
npm install
npm link

# Single file
deob main.js                         # → main.deob/main.js
deob main.js --split                 # → main.deob/ (per-function files)
deob main.js --metrics               # → main.deob/ + metrics.html
deob main.js --md --json             # → main.deob/ + structure reports
deob main.js --index                 # → main.deob/ + code index

# Directory (cross-file summary)
deob src/ --md --json                # → src.deob/ + summary.md

# Config-driven (auto-detect deob.config.js)
deob init                            # generate config template
deob                                 # run with ./deob.config.js
deob --config path/to/config.js      # explicit config path
```

All output goes into a directory:

```
main.deob/
├── main.js           ← deobfuscated code
├── metrics.html      ← readability report (--metrics)
├── structure.md      ← function inventory + hotspots + alerts (--md)
├── structure.json    ← machine-readable (--json)
└── .index/           ← code intelligence index (--index)
```

## CLI Reference

```
deob                            auto-detect deob.config.js in cwd
deob <input> [output-dir] [options]
deob --config <path>
deob init [--force]
```

| Flag | Output | Description |
|------|--------|-------------|
| (default) | `main.js` | Single deobfuscated file |
| `--split` | per-function files | Each `_sub_` function in its own file, grouped by parent |
| `--metrics` | `metrics.html` | Before/after readability comparison with Chart.js |
| `--md` | `structure.md` | Function inventory, call graph, hotspots, alerts, lookup index |
| `--json` | `structure.json` | Same as `--md` in machine-readable JSON |
| `--index` | `.index/` | SQLite knowledge graph for AI-assisted exploration |
| `--config <path>` | — | Load options from config file, ignore other flags |
| `init` | `deob.config.js` | Generate config template in current directory |

**Directory input:** processes each `.js` file independently, then generates a `summary.md` / `summary.json` with cross-file hotspots, merged alerts, and combined lookup index.

**Config format** (`deob init` generates a template):

```javascript
module.exports = {
  input: "src/main.js",             // file, directory, or array
  // input: ["a.js", "b.js", "sub/"],
  // output: "out/",                // optional
  split: false,
  metrics: false,
  md: true,
  json: false,
  index: false,
};
```

## Structure Report Sections

| Section | Content |
|---------|---------|
| Summary | Total functions, sub/original breakdown, max nesting depth, extraction types |
| Hotspots | Most-called functions, root entry points, leaf terminals, hot groups |
| Hot Groups | Directories with most cross-function call edges |
| Quick Lookup | Word → function index (splits `_sub_program_init_vars` → `program` · `init` · `vars`) |
| String Alerts | Security-relevant patterns: API endpoints, tokens, crypto, eval, storage, DOM sinks |
| Call Graph | Mermaid diagram of cross-function calls |
| Function Inventory | Full table with name, lines, params, calls, called-by |

## Code Index 

Builds a SQLite knowledge graph using `node:sqlite` + `@babel/traverse`.

**Schema:** `nodes` (functions, classes, variables), `edges` (calls, contains, references), FTS5 search.

**Optimizations for deob output:**
- Skips `index.js` glue files
- Tags every node with `metadata.group` (parent directory)
- Filters noise `MemberExpression` references from obfuscated identifiers

**Example query:**
```sql
SELECT name, file_path FROM nodes
WHERE json_extract(metadata, '$.group') = 'misc' AND kind = 'function';

SELECT target, COUNT(*) as c FROM edges
WHERE kind = 'calls' GROUP BY target ORDER BY c DESC LIMIT 10;
```

## Pipeline 

| Step | Pass | Description |
|------|------|-------------|
| 1 | `traverse` | Collect all function nodes, process innermost-first |
| 2 | `wrapper` | Extract top-level IIFEs from comma chains |
| 3 | `hoist` | Move var/let/const/function to top of every scope |
| 4 | `extract-inline` | Lift embedded function expressions (return, assignment, IIFE, MemberExpression) |
| 5 | `simplify` | Fold constants, simplify booleans, fold string ops, normalize AST |
| 6 | `short-circuit` | Convert `A\|\|B\|\|(C,D)` → `if(!A&&!B){C;D;}`, ternary → if/else, `var x=cond?a:b` → if/else |
| 7 | `expand-seq` | Break comma chains into independent statements |
| 8 | `short-circuit` | Second pass — catch LogicalExpressions exposed by comma splitting |
| 9 | `dead-code` | Remove if(false), unreachable code after return, empty catch |
| 10 | `inline-props` | Replace config.PROP with literal values |
| 11 | `unused` | Remove helper functions never referenced |
| 12 | `conditions` | Simplify `a?true:false→!!a`, if/return patterns |
| 13 | `wrappers` | Inline pure wrapper functions |
| 14 | `call-tree` | Topological sort: callees before callers |
| 15 | `single-caller` | Inline functions called from exactly one place |
| 16 | `normalize` | Multi-decl split, chained assignment split, for(;;)→while(true) |
| 17 | `extract-inline` | Second pass — catch patterns exposed by restructuring |

## Output Example

```javascript
// Before: obfuscated
function a0_0x5465(_0x147aca,_0x1c469e){const _0x477d9d=a0_0x1cb6();return (a0_0x5465=function(...){...}),a0_0x5465(...)}

// After: deobfuscated
function a0_0x5465(_0x147aca, _0x1c469e) {
  const _0x477d9d = a0_0x1cb6();
  return (
    (a0_0x5465 = _sub_return_fn1),
    a0_0x5465(_0x147aca, _0x1c469e)
  );
}

// Original lines 1-170
function _sub_return_fn1(_0x4d3a42, _0x55eff5, _0x477d9d, _0x147aca, a0_0x5465) {
  _0x4d3a42 = _0x4d3a42 - 295;
  let _0x5711d9 = _0x477d9d[_0x4d3a42];
  // ...
}
```

## Naming Convention

All extracted sub-functions follow: `_sub_<parent>_<seq>_<description>`

| Component | Meaning |
|-----------|---------|
| `_sub_` | Prefix for extracted sub-functions |
| `<parent>` | Parent function name, method name, or `lnXXXX` for anonymous |
| `<seq>` | Two-digit extraction order |
| `<description>` | `if`, `else`, `try`, `catch`, `init_vars`, `iife_body`... |

## API

```javascript
const { main } = require("./scripts");
main({ input: "obfuscated.js", output: "out/", split: true });
```

## Directory Structure

```
deob.js               ← CLI entry point
scripts/
├── pipeline.js       ← Main orchestration (17 passes)
├── extract.js        ← Syntactic splitting (IIFE, try-catch, if-else, switch, …)
├── passes.js         ← All post-processing passes
├── traverse.js       ← Innermost-first function collection
├── metrics.js        ← Readability analysis + HTML Chart.js report
├── structure.js      ← Function inventory, hotspots, alerts, lookup index
├── ast-utils.js      ← AST walker, detectors, clone
├── scope.js          ← Variable scope & external reference analysis
├── emit.js           ← Sub-function declaration builder
├── naming.js         ← Naming convention helpers
├── wrapper.js        ← Top-level IIFE extraction
├── config.js         ← Parser, generator, globals
├── index.js          ← Public API exports
└── indexer/          ← Code intelligence indexer
    ├── index.js      ← Orchestration: scan → extract → store → resolve
    ├── extract.js    ← Babel-based JS symbol & call-graph extractor
    ├── schema.js     ← SQLite schema
    └── store.js      ← node:sqlite database operations
```

## License

ISC
