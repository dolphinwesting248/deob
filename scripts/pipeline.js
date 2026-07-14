// Main transformation pipeline
// Usage:
//   const { main } = require('./scripts/pipeline');
//   main({ input: 'obfuscated.js', output: 'clean.js' });
//
// Adding a new pass:
//   1. Create your pass function in a module
//   2. Require it here
//   3. Add a step in main() that calls it

const { parser, generate, t, fs } = require("./config");
const { processAllFunctions } = require("./traverse");
const { extractTopLevelIIFEs } = require("./wrapper");
const { hoistDeclarations, constantFold, simplifyBooleanObfuscation, simplifyStrings, expandSequences, eliminateDeadCode, inlineReadOnlyProperties, removeUnusedHelpers, simplifyRedundantConditions, inlinePureWrappers, sortByCallTree, inlineSingleCallerFns, normalizeSyntax, extractInlineFunctions } = require("./passes");

function main({ input, output, split } = {}) {
  if (!input) throw new Error("main() requires { input: '<path>' }");
  if (!output) throw new Error("main() requires { output: '<path>' }");

  console.log("Reading file...");
  const code = fs.readFileSync(input, "utf-8");
  console.log(`Size: ${(code.length / 1024 / 1024).toFixed(2)} MB`);

  console.log("Parsing AST...");
  const ast = parser.parse(code, {
    sourceType: "script",
    allowReturnOutsideFunction: true,
    allowUndeclaredExports: true,
    errorRecovery: true,
  });

  // ==================== Extraction Passes ====================
  console.log("Step 1: Processing all function bodies...");
  const t0 = Date.now();
  const subFns1 = processAllFunctions(ast);
  console.log(`  ${subFns1.length} sub-functions generated in ${Date.now() - t0}ms`);

  console.log("Step 2: Extracting top-level IIFEs from comma chain...");
  const t1 = Date.now();
  const subFns2 = extractTopLevelIIFEs(ast);
  console.log(`  ${subFns2.length} top-level sub-functions generated in ${Date.now() - t1}ms`);

  // ==================== Append & Organize ====================
  const allSubFns = [...subFns1, ...subFns2];
  console.log(`Total sub-functions: ${allSubFns.length}`);

  const groups = new Map();
  for (const sf of allSubFns) {
    if (!sf.id) continue;
    const match = sf.id.name.match(/^_sub_(.+?)_\d{2}_/);
    const parent = match ? match[1] : "misc";
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(sf);
  }
  for (const g of [...groups.keys()].sort()) {
    for (const sf of groups.get(g)) ast.program.body.push(sf);
  }

  // ==================== Post-Processing Passes ====================
  console.log("Step 3: Hoisting helper function declarations...");
  const t2 = Date.now();
  hoistDeclarations(ast);
  console.log(`  Done in ${Date.now() - t2}ms`);

  console.log("Step 4: Extracting inline function expressions...");
  const t3b = Date.now();
  extractInlineFunctions(ast);
  console.log(`  Done in ${Date.now() - t3b}ms`);

  console.log("Step 5: Simplifying string operations...");
  const t3 = Date.now();
  simplifyStrings(ast);
  console.log(`  Done in ${Date.now() - t3}ms`);

  console.log("Step 5: Expanding sequence expressions...");
  const t4 = Date.now();
  expandSequences(ast);
  console.log(`  Done in ${Date.now() - t4}ms`);

  console.log("Step 6: Constant folding (arithmetic, strings, logic)...");
  const t5 = Date.now();
  constantFold(ast);
  console.log(`  Done in ${Date.now() - t5}ms`);

  console.log("Step 7: Simplifying boolean obfuscation...");
  const t6 = Date.now();
  simplifyBooleanObfuscation(ast);
  console.log(`  Done in ${Date.now() - t6}ms`);

  console.log("Step 8: Eliminating dead code...");
  const t7 = Date.now();
  eliminateDeadCode(ast);
  console.log(`  Done in ${Date.now() - t7}ms`);

  console.log("Step 9: Inlining read-only property access...");
  const t8 = Date.now();
  inlineReadOnlyProperties(ast);
  console.log(`  Done in ${Date.now() - t8}ms`);

  console.log("Step 10: Removing unused helper functions...");
  const t9 = Date.now();
  removeUnusedHelpers(ast);
  console.log(`  Done in ${Date.now() - t9}ms`);

  console.log("Step 11: Simplifying redundant conditions...");
  const t10 = Date.now();
  simplifyRedundantConditions(ast);
  console.log(`  Done in ${Date.now() - t10}ms`);

  console.log("Step 12: Inlining pure wrapper functions...");
  const t11 = Date.now();
  inlinePureWrappers(ast);
  console.log(`  Done in ${Date.now() - t11}ms`);

  console.log("Step 13: Sorting functions by call tree...");
  const t12 = Date.now();
  sortByCallTree(ast);
  console.log(`  Done in ${Date.now() - t12}ms`);

  console.log("Step 14: Inlining single-caller functions...");
  const t13 = Date.now();
  inlineSingleCallerFns(ast);
  console.log(`  Done in ${Date.now() - t13}ms`);

  console.log("Step 15: Normalizing syntax patterns...");
  const t14 = Date.now();
  normalizeSyntax(ast);
  console.log(`  Done in ${Date.now() - t14}ms`);

  // ==================== Output ====================
  const { t } = require("./config");
  const path = require("path");

  if (split) {
    writeSplitOutput(ast, output, code);
    return null;
  } else {
    return writeSingleOutput(ast, output, code);
  }
}

function writeSingleOutput(ast, output, code) {
  console.log("Generating output...");
  const g0 = Date.now();
  const generated = generate(ast, {
    retainLines: false, retainFunctionParens: false,
    comments: true, compact: false,
  }).code;
  console.log(`Generated in ${Date.now() - g0}ms`);

  console.log("Writing output...");
  fs.writeFileSync(output, generated, "utf-8");

  formatFile(output);

  const finalSize = fs.statSync(output).size;
  const ratio = ((finalSize / code.length) * 100).toFixed(1);
  console.log(`Done! Output: ${(finalSize / 1024 / 1024).toFixed(2)} MB (${ratio}% of original)`);

  const fnCount = fs.readFileSync(output, "utf-8").split("\n").filter((l) => l.includes("function _sub_")).length;
  console.log(`_sub_ function declarations in output: ${fnCount}`);
  return generated;
}

function writeSplitOutput(ast, output, code) {
  const path = require("path");
  console.log("Splitting into per-function files...");

  // Ensure output directory
  const outDir = output;
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Group _sub_ functions by parent name
  const groups = new Map(); // parentName -> [functionNode]
  const otherStmts = []; // non-_sub_ statements (original functions, etc.)

  for (const stmt of ast.program.body) {
    if (t.isFunctionDeclaration(stmt) && stmt.id && stmt.id.name.startsWith("_sub_")) {
      // Extract parent name: _sub_PARENT_SEQ_desc → PARENT
      const match = stmt.id.name.match(/^_sub_(.+?)_\d{2}_/);
      const parent = match ? match[1] : "misc";
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(stmt);
    } else {
      otherStmts.push(stmt);
    }
  }

  // Write original function to main.js
  const mainAst = { ...ast, program: { ...ast.program, body: otherStmts } };
  const mainCode = generate(mainAst, {
    retainLines: false, retainFunctionParens: false,
    comments: true, compact: false,
  }).code;
  fs.writeFileSync(path.join(outDir, "main.js"), mainCode, "utf-8");
  formatFile(path.join(outDir, "main.js"));

  // Write each group to its own folder
  let totalFiles = 1;
  let processed = 0;
  const groupEntries = [...groups.entries()];
  const barWidth = 30;

  for (const [parentName, fns] of groupEntries) {
    const dir = path.join(outDir, parentName);
    fs.mkdirSync(dir, { recursive: true });

    // index.js: re-export all sub-functions in this group
    const exports = fns.map((fn) => `  "${fn.id.name}": require("./${fn.id.name}"),`).join("\n");
    const indexContent = `// Group: ${parentName} (${fns.length} functions)\nmodule.exports = {\n${exports}\n};\n`;
    fs.writeFileSync(path.join(dir, "index.js"), indexContent, "utf-8");
    totalFiles++;

    // Each function in its own file
    for (const fn of fns) {
      const fnAst = { ...ast, program: { ...ast.program, body: [fn] } };
      let fnCode = generate(fnAst, {
        retainLines: false, retainFunctionParens: false,
        comments: true, compact: false,
      }).code;

      // Add require() calls for external sub-function references
      const imports = new Set();
      walkCalls(fn.body, imports);
      const importLines = [];
      for (const name of imports) {
        if (name.startsWith("_sub_")) {
          const match = name.match(/^_sub_(.+?)_\d{2}_/);
          const parent = match ? match[1] : "misc";
          importLines.push(`const ${name} = require("../${parent}/${name}");`);
        }
      }

      if (importLines.length > 0) {
        fnCode = importLines.join("\n") + "\n\n" + fnCode;
      }

      fs.writeFileSync(path.join(dir, `${fn.id.name}.js`), fnCode, "utf-8");
      formatFile(path.join(dir, `${fn.id.name}.js`));
      totalFiles++;
    }

    processed++;
    const pct = Math.round((processed / groupEntries.length) * 100);
    const filled = Math.round((processed / groupEntries.length) * barWidth);
    const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
    process.stdout.write(`\r  [${bar}] ${pct}%  ${processed}/${groupEntries.length} groups`);
  }
  process.stdout.write("\n");

  // Write assembly index.js at root
  const rootEntries = [...groups.keys()].map((g) => `  "${g}": require("./${g}"),`).join("\n");
  const rootIndex = `// Assembly — all sub-function groups\n// Original functions are in main.js\nmodule.exports = {\n${rootEntries}\n};\n`;
  fs.writeFileSync(path.join(outDir, "index.js"), rootIndex, "utf-8");
  formatFile(path.join(outDir, "index.js"));

  console.log(`  Wrote ${totalFiles} files to ${outDir}/`);
  console.log(`  ${Object.keys(groups).length} groups, each in its own folder`);
}

function walkCalls(node, collected) {
  if (!node || typeof node !== "object") return;
  if (t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name.startsWith("_sub_")) {
    collected.add(node.callee.name);
  }
  for (const k of Object.keys(node)) {
    if (k === "start" || k === "end" || k === "loc" ||
        k === "leadingComments" || k === "trailingComments" || k === "innerComments") continue;
    const val = node[k];
    if (Array.isArray(val)) { for (const v of val) walkCalls(v, collected); }
    else if (val && typeof val.type === "string") walkCalls(val, collected);
  }
}

function formatFile(filepath) {
  const { execSync } = require("child_process");
  try {
    execSync(`npx --yes prettier --write "${filepath}"`, { stdio: "pipe", timeout: 60000 });
  } catch (_) { /* prettier not available */ }
}

module.exports = { main };
