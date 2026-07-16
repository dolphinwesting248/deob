// Shared call graph builder — built once, reused across passes

const { t } = require("./config");
const { SKIP_KEYS } = require("./constants");

/**
 * Build a bidirectional call graph from the AST.
 * Returns { forward, reverse, allNames }
 *   forward: Map<callerName, Set<calleeName>>
 *   reverse: Map<calleeName, Set<callerName>>
 *   allNames: Set<functionName>
 */
function buildCallGraph(ast) {
  const forward = new Map(); // caller -> Set(callee)
  const reverse = new Map(); // callee -> Set(caller)
  const allNames = new Set();

  // Phase 1: collect all function declaration names
  for (const stmt of ast.program.body) {
    if (t.isFunctionDeclaration(stmt) && stmt.id) {
      allNames.add(stmt.id.name);
    }
  }

  // Phase 2: walk each function body, collect call edges
  function collectEdges(node, enclosingFn) {
    if (!node || typeof node !== "object") return;
    if (t.isCallExpression(node) && t.isIdentifier(node.callee) && enclosingFn) {
      const callee = node.callee.name;
      if (!forward.has(enclosingFn)) forward.set(enclosingFn, new Set());
      forward.get(enclosingFn).add(callee);
      if (!reverse.has(callee)) reverse.set(callee, new Set());
      reverse.get(callee).add(enclosingFn);
    }
    for (const k of Object.keys(node)) {
      if (SKIP_KEYS.has(k)) continue;
      const v = node[k];
      if (Array.isArray(v)) { for (const x of v) collectEdges(x, enclosingFn); }
      else if (v && typeof v.type === "string") collectEdges(v, enclosingFn);
    }
  }

  for (const stmt of ast.program.body) {
    if (t.isFunctionDeclaration(stmt) && stmt.id) {
      collectEdges(stmt.body, stmt.id.name);
    }
  }

  return { forward, reverse, allNames };
}

module.exports = { buildCallGraph };
