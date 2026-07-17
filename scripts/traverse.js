// Innermost-first function collection & body traverse

const { t } = require("./config");
const { SKIP_KEYS } = require("./constants");
const { getFnName } = require("./naming");
const { processBody } = require("./extract");

function processAllFunctions(ast) {
  const processedBodies = new WeakSet();
  const allSubFns = [];

  // ---- Collect all function nodes (innermost-first via post-order) ----
  const fnNodes = [];
  // Track parent chain for scope accumulation
  const fnParent = new Map(); // fnNode -> parentFnNode
  function collectFns(node, parent) {
    if (!node || typeof node !== "object") return;
    const isFn = t.isFunctionDeclaration(node) || t.isFunctionExpression(node) ||
                 t.isArrowFunctionExpression(node) || t.isObjectMethod(node) ||
                 t.isClassMethod(node) || t.isClassPrivateMethod(node);
    if (isFn) {
      if (parent) fnParent.set(node, parent);
      for (const key of ["body", "params", "id", "key", "decorators"]) {
        const v = node[key];
        if (v && typeof v.type === "string") collectFns(v, node);
        else if (Array.isArray(v)) { for (const x of v) { if (x && typeof x.type === "string") collectFns(x, node); } }
      }
      if (t.isBlockStatement(node.body)) { for (const stmt of node.body.body) collectFns(stmt, node); }
      fnNodes.push(node);
    } else {
      for (const key of Object.keys(node)) {
        if (key === "start" || key === "end" || key === "loc" ||
            key === "leadingComments" || key === "trailingComments" || key === "innerComments") continue;
        const v = node[key];
        if (Array.isArray(v)) { for (const x of v) { if (x && typeof x.type === "string") collectFns(x, parent); } }
        else if (v && typeof v.type === "string") collectFns(v, parent);
      }
    }
  }
  collectFns(ast.program, null);
  console.log(`  Collected ${fnNodes.length} function nodes (innermost-first)`);

  // ---- Build accumulated scope defs for each function (chain up through parents) ----
  const scopeDefs = new Map(); // fnNode -> Set<name>
  function collectScopeDefs(fn) {
    const defs = new Set();
    for (const p of fn.params) { if (t.isIdentifier(p)) defs.add(p.name); }
    if (t.isBlockStatement(fn.body)) {
      for (const s of fn.body.body) {
        if (t.isVariableDeclaration(s)) {
          for (const d of s.declarations) { if (t.isIdentifier(d.id)) defs.add(d.id.name); }
        }
        if (t.isFunctionDeclaration(s) && s.id) defs.add(s.id.name);
      }
    }
    return defs;
  }
  function accumulatedDefs(fn) {
    if (scopeDefs.has(fn)) return scopeDefs.get(fn);
    const own = collectScopeDefs(fn);
    const parent = fnParent.get(fn);
    if (parent) {
      const parentDefs = accumulatedDefs(parent);
      for (const n of parentDefs) own.add(n);
    }
    scopeDefs.set(fn, own);
    return own;
  }

  // ---- Process each function body (direct + nested in one pass) ----
  for (let i = fnNodes.length - 1; i >= 0; i--) {
    const fn = fnNodes[i];
    if (!t.isBlockStatement(fn.body) || processedBodies.has(fn.body)) continue;
    processedBodies.add(fn.body);
    const name = getFnName(fn);
    const counter = { seq: 0 };
    const parentDefs = accumulatedDefs(fn);
    const result = processBody(fn.body.body, name, counter, processedBodies, parentDefs);
    fn.body.body = result.newBody;
    allSubFns.push(...result.subFns);
  }

  return allSubFns;
}

module.exports = { processAllFunctions };
