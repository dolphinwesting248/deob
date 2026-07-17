// Regression test harness — captures pipeline metrics for baseline comparison
const { parser } = require("../scripts/config");
const passes = require("../scripts/passes");
const { processAllFunctions } = require("../scripts/traverse");
const { extractTopLevelIIFEs } = require("../scripts/wrapper");
const { buildCallGraph } = require("../scripts/callgraph");
const { buildRefGraph } = require("../scripts/refgraph");
const fs = require("fs");
const path = require("path");

function runPipeline(filepath) {
  const code = fs.readFileSync(filepath, "utf8");
  const ast = parser.parse(code, { sourceType: "script", errorRecovery: true });

  // Suppress console.log during capture
  const origLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(" "));

  let error = null;
  const result = {};
  const t0 = Date.now();

  try {
    passes.sanitizeReservedWords(ast);
    const fns1 = processAllFunctions(ast);
    ast.program.body.push(...fns1);
    result.subFnsStep1 = fns1.length;

    const fns2 = extractTopLevelIIFEs(ast);
    ast.program.body.push(...fns2);
    result.subFnsStep2 = fns2.length;

    const cg = buildCallGraph(ast);
    const rg = buildRefGraph(ast);

    passes.hoistDeclarations(ast);
    passes.extractInlineFunctions(ast);
    passes.simplify(ast);
    passes.normalizeShortCircuit(ast);
    passes.expandSequences(ast);
    passes.normalizeShortCircuit(ast);
    passes.eliminateDeadCode(ast);
    passes.inlineReadOnlyProperties(ast, rg);
    passes.inlineConstObjects(ast, rg);
    passes.removeUnusedHelpers(ast, rg);
    passes.simplifyRedundantConditions(ast);
    passes.inlinePureWrappers(ast);
    passes.inlineArithmeticWrappers(ast);
    passes.sortByCallTree(ast, cg);
    passes.inlineSingleCallerFns(ast, cg);
    passes.normalizeSyntax(ast);
    passes.extractInlineFunctions(ast);
    passes.annotateAlerts(ast, cg, rg);
    passes.sanitizeReservedWords(ast);
    passes.pushDataToBottom(ast);

    // Parse metrics from logs
    for (const l of logs) {
      if (l.includes("Fold:")) {
        const m = l.match(/Fold:(\d+) Bool:(\d+) Str:(\d+) Norm:(\d+)/);
        if (m) result.simplify = { fold: +m[1], bool: +m[2], str: +m[3], norm: +m[4] };
      }
      if (l.includes("Converted") && l.includes("logical")) {
        result.shortCircuit1 = +l.match(/Converted (\d+)/)[1];
      } else if (l.includes("Converted") && l.includes("logical") && !result.shortCircuit2) {
        // second shortCircuit pass
      }
      if (l.includes("Expanded") && l.includes("sequence")) {
        result.expandedSeqs = +l.match(/Expanded (\d+)/)[1];
      }
      if (l.includes("Inlined") && l.includes("read-only")) {
        result.readOnlyProps = +l.match(/Inlined (\d+)/)[1];
      }
      if (l.includes("Inlined") && l.includes("const object")) {
        result.constObjProps = +l.match(/Inlined (\d+)/)[1];
      }
      if (l.includes("Removed") && l.includes("unused helper")) {
        result.removedHelpers = +l.match(/Removed (\d+)/)[1];
      }
      if (l.includes("Simplified") && l.includes("redundant")) {
        result.redundantCond = +l.match(/Simplified (\d+)/)[1];
      }
      if (l.includes("Inlined") && l.includes("single-caller")) {
        result.singleCaller = +l.match(/Inlined (\d+)/)[1];
      }
      if (l.includes("Normalized") && l.includes("syntax")) {
        result.normalizedSyntax = +l.match(/Normalized (\d+)/)[1];
      }
      if (l.includes("Extracted") && l.includes("inline function")) {
        if (!result.extractedInline1) result.extractedInline1 = +l.match(/Extracted (\d+)/)[1];
        else result.extractedInline2 = +l.match(/Extracted (\d+)/)[1];
      }
      if (l.includes("Annotated")) {
        const m = l.match(/Annotated (\d+).*?(\d+) with metadata/);
        if (m) { result.alertsAnnotated = +m[1]; result.bannersAnnotated = +m[2]; }
      }
    }
  } catch (e) {
    error = e.message.split("\n")[0];
  }

  console.log = origLog;
  result.timeMs = Date.now() - t0;
  result.error = error;
  result.inputSize = code.length;

  return result;
}

// Collect test files
const testFiles = [];
function collect(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collect(full);
    else if (name.endsWith(".js")) testFiles.push(full);
  }
}

const testDirs = [
  "E:/deobscura/test/samples/jd",
  "E:/deobscura/test/samples/taobao",
  "E:/deobscura/test/samples/live-obfuscated",
  "E:/deobscura/test/samples/batch2",
  "E:/deobscura/test/samples/real-obfuscated",
];
for (const d of testDirs) {
  if (fs.existsSync(d)) collect(d);
}

// Also add examples
const examples = ["examples/main.js", "examples/vendor.js", "examples/preload.js", "examples/br.js"];
for (const e of examples) {
  if (fs.existsSync("E:/deobscura/" + e)) testFiles.push("E:/deobscura/" + e);
}

console.log(`Running regression on ${testFiles.length} files...`);
const results = {};
for (const f of testFiles) {
  const rel = path.relative("E:/deobscura", f);
  process.stdout.write(`  ${rel}... `);
  const r = runPipeline(f);
  results[rel] = r;
  console.log(r.error ? `ERROR: ${r.error}` : `OK (${r.timeMs}ms, ${r.subFnsStep1 || 0} sub-fns)`);
}

// Save baseline
const baselinePath = "E:/deobscura/test/regression-baseline.json";
fs.writeFileSync(baselinePath, JSON.stringify({
  timestamp: new Date().toISOString(),
  fileCount: testFiles.length,
  results,
}, null, 2));
console.log(`\nBaseline saved to ${baselinePath}`);
console.log(`Files: ${testFiles.length}, Errors: ${Object.values(results).filter(r => r.error).length}`);
