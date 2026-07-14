// Innermost-first function collection & body traverse

const { t } = require("./config");
const { getFnName } = require("./naming");
const { processBody } = require("./extract");

function processAllFunctions(ast) {
  const processedBodies = new WeakSet();
  const allSubFns = [];

  // ---- Collect all function nodes (innermost-first via post-order) ----
  const fnNodes = [];
  function collectFns(node) {
    if (!node || typeof node !== "object") return;
    const isFn = t.isFunctionDeclaration(node) || t.isFunctionExpression(node) ||
                 t.isArrowFunctionExpression(node) || t.isObjectMethod(node) ||
                 t.isClassMethod(node) || t.isClassPrivateMethod(node);
    if (isFn) {
      for (const key of ["body", "params", "id", "key", "decorators"]) {
        const v = node[key];
        if (v && typeof v.type === "string") collectFns(v);
        else if (Array.isArray(v)) { for (const x of v) { if (x && typeof x.type === "string") collectFns(x); } }
      }
      if (t.isBlockStatement(node.body)) { for (const stmt of node.body.body) collectFns(stmt); }
      fnNodes.push(node);
    } else {
      for (const key of Object.keys(node)) {
        if (key === "start" || key === "end" || key === "loc" ||
            key === "leadingComments" || key === "trailingComments" || key === "innerComments") continue;
        const v = node[key];
        if (Array.isArray(v)) { for (const x of v) { if (x && typeof x.type === "string") collectFns(x); } }
        else if (v && typeof v.type === "string") collectFns(v);
      }
    }
  }
  collectFns(ast.program);
  console.log(`  Collected ${fnNodes.length} function nodes (innermost-first)`);

  // ---- Process each function body (direct + nested in one pass) ----
  for (let i = fnNodes.length - 1; i >= 0; i--) {
    const fn = fnNodes[i];
    if (!t.isBlockStatement(fn.body) || processedBodies.has(fn.body)) continue;
    processedBodies.add(fn.body);
    const name = getFnName(fn);
    const counter = { seq: 0 };
    const result = processBody(fn.body.body, name, counter, processedBodies);
    fn.body.body = result.newBody;
    allSubFns.push(...result.subFns);
  }

  return allSubFns;
}

module.exports = { processAllFunctions };
