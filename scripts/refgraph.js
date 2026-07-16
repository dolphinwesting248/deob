// Shared reference graph builder — built once, reused across passes
// Plan B: full scope analysis with closure capture detection

const { t } = require("./config");
const { SKIP_KEYS, GLOBALS } = require("./constants");

let _nextScopeId = 0;

function buildRefGraph(ast) {
  _nextScopeId = 0;

  const scopes = new Map(); // scopeId → { id, type, parent, fnName, node, declarations, references, children }

  // ── Phase 1: Build scope tree ──────────────────────────────────────

  function createScope(type, parent, node, fnName) {
    const scope = { id: _nextScopeId++, type, parent, fnName, node, declarations: new Map(), references: new Map(), children: [] };
    scopes.set(scope.id, scope);
    if (parent !== null) scopes.get(parent).children.push(scope.id);
    return scope;
  }

  function currentFnScope(scopeId) {
    let s = scopes.get(scopeId);
    while (s && s.type !== "function" && s.type !== "program") s = s.parent !== null ? scopes.get(s.parent) : null;
    return s;
  }

  function registerDecl(scopeId, name, kind, node) {
    const scope = scopes.get(scopeId);
    if (!scope.declarations.has(name)) scope.declarations.set(name, { kind, isConst: kind === "const" || kind === "function", node });
  }

  function registerVarDecl(scopeId, name, kind, node) {
    // var hoists to function scope; let/const stay in block
    if (kind === "var") {
      const fnScope = currentFnScope(scopeId);
      if (fnScope) registerDecl(fnScope.id, name, kind, node);
    } else {
      registerDecl(scopeId, name, kind, node);
    }
  }

  function buildScopes(node, scopeId, parent, parentKey) {
    if (!node || typeof node !== "object") return;

    // Function declaration: register name in CURRENT scope, params+body in NEW scope
    if (t.isFunctionDeclaration(node) && node.id) {
      registerDecl(scopeId, node.id.name, "function", node);
      const fnScope = createScope("function", scopeId, node, node.id.name);
      for (const p of node.params) registerParam(fnScope.id, p);
      buildScopes(node.body, fnScope.id, node, "body");
      return;
    }

    // Function expression / arrow: new scope (no name registration in parent)
    if ((t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) && parent && !t.isFunctionDeclaration(parent)) {
      const fnName = (node.id && node.id.name) || null;
      const fnScope = createScope("function", scopeId, node, fnName);
      for (const p of node.params) registerParam(fnScope.id, p);
      buildScopes(node.body, fnScope.id, node, "body");
      return;
    }

    // Block statement: new scope for let/const
    if (t.isBlockStatement(node) && parent && !t.isFunction(parent)) {
      const blockScope = createScope("block", scopeId, node, null);
      for (const stmt of node.body) buildScopes(stmt, blockScope.id, node, "body");
      return;
    }

    // Variable declaration
    if (t.isVariableDeclaration(node)) {
      for (const decl of node.declarations) {
        if (t.isIdentifier(decl.id)) registerVarDecl(scopeId, decl.id.name, node.kind, decl.init || null);
        if (decl.init) buildScopes(decl.init, scopeId, decl, "init");
      }
      return;
    }

    // For statement: new scope for init
    if (t.isForStatement(node)) {
      if (node.init && t.isVariableDeclaration(node.init)) {
        const forScope = createScope("block", scopeId, node, null);
        for (const d of node.init.declarations) {
          if (t.isIdentifier(d.id)) registerVarDecl(forScope.id, d.id.name, node.init.kind, d.init || null);
          if (d.init) buildScopes(d.init, forScope.id, d, "init");
        }
        if (node.test) buildScopes(node.test, forScope.id, node, "test");
        if (node.update) buildScopes(node.update, forScope.id, node, "update");
        buildScopes(node.body, forScope.id, node, "body");
        return;
      }
    }

    // For-in / For-of: new scope for left
    if (t.isForInStatement(node) || t.isForOfStatement(node)) {
      if (t.isVariableDeclaration(node.left)) {
        const forScope = createScope("block", scopeId, node, null);
        for (const d of node.left.declarations) {
          if (t.isIdentifier(d.id)) registerVarDecl(forScope.id, d.id.name, node.left.kind, null);
        }
        buildScopes(node.right, forScope.id, node, "right");
        buildScopes(node.body, forScope.id, node, "body");
        return;
      }
    }

    // Catch clause: new scope for param
    if (t.isCatchClause(node) && node.param) {
      const catchScope = createScope("block", scopeId, node, null);
      if (t.isIdentifier(node.param)) registerDecl(catchScope.id, node.param.name, "catch", null);
      buildScopes(node.body, catchScope.id, node, "body");
      return;
    }

    // Switch statement: new scope for cases with let/const
    if (t.isSwitchStatement(node)) {
      const switchScope = createScope("block", scopeId, node, null);
      for (const cs of node.cases) {
        for (const stmt of cs.consequent) buildScopes(stmt, switchScope.id, cs, "consequent");
      }
      return;
    }

    // Default: recurse into children
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) continue;
      const val = node[key];
      if (Array.isArray(val)) { for (const v of val) buildScopes(v, scopeId, node, key); }
      else if (val && typeof val.type === "string") buildScopes(val, scopeId, node, key);
    }
  }

  function registerParam(scopeId, pattern) {
    if (t.isIdentifier(pattern)) registerDecl(scopeId, pattern.name, "param", null);
    else if (t.isAssignmentPattern(pattern)) registerParam(scopeId, pattern.left);
    else if (t.isRestElement(pattern)) registerParam(scopeId, pattern.argument);
    else if (t.isObjectPattern(pattern)) { for (const p of pattern.properties) { if (t.isRestElement(p)) registerParam(scopeId, p.argument); else registerParam(scopeId, p.value); } }
    else if (t.isArrayPattern(pattern)) { for (const e of pattern.elements) { if (e) registerParam(scopeId, e); } }
  }

  // Create program scope and build
  const programScope = createScope("program", null, ast, null);
  for (const stmt of ast.program.body) buildScopes(stmt, programScope.id, ast, "body");

  // Tag all function nodes AND their body blocks with scope id (for collectRefs/resolveRefs)
  for (const [sid, scope] of scopes) {
    if (scope.type === "function" && scope.node) {
      scope.node.$$scopeId = sid;
      // Also tag the function body (BlockStatement) so resolveRefs uses the correct scope
      if (scope.node.body && typeof scope.node.body === "object") {
        scope.node.body.$$scopeId = sid;
      }
    }
  }

  // ── Phase 2: Detect mutations ──────────────────────────────────────

  const isMutated = new Set();

  function findDeclScope(name, fromScopeId) {
    let s = scopes.get(fromScopeId);
    while (s !== null) {
      if (s.declarations.has(name)) return s;
      s = s.parent !== null ? scopes.get(s.parent) : null;
    }
    return null;
  }

  function scanMutations(node, scopeId) {
    if (!node || typeof node !== "object") return;
    // cfg = newVal (direct reassignment, not cfg.prop = val)
    if (t.isAssignmentExpression(node) && t.isIdentifier(node.left)) {
      const declScope = findDeclScope(node.left.name, scopeId);
      if (declScope) isMutated.add(node.left.name);
    }
    // cfg++ / ++cfg
    if (t.isUpdateExpression(node) && t.isIdentifier(node.argument)) {
      const declScope = findDeclScope(node.argument.name, scopeId);
      if (declScope) isMutated.add(node.argument.name);
    }
    // delete cfg
    if (t.isUnaryExpression(node) && node.operator === "delete" && t.isIdentifier(node.argument)) {
      const declScope = findDeclScope(node.argument.name, scopeId);
      if (declScope) isMutated.add(node.argument.name);
    }
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) continue;
      const val = node[key];
      if (Array.isArray(val)) { for (const v of val) scanMutations(v, scopeId); }
      else if (val && typeof val.type === "string") scanMutations(val, scopeId);
    }
  }

  for (const [sid, scope] of scopes) {
    if (scope.type === "function" || scope.type === "program") {
      if (scope.type === "program") {
        for (const stmt of ast.program.body) scanMutations(stmt, sid);
      } else {
        scanMutations(scope.node.body, sid);
      }
    }
  }

  // ── Phase 3: Collect references (global set) ───────────────────────

  const referenced = new Set();

  function collectRefs(node, scopeId, parent, parentKey) {
    if (!node || typeof node !== "object") return;

    if (t.isIdentifier(node)) {
      // Skip declaration-site names
      const isDeclName = (parent && t.isFunctionDeclaration(parent) && parentKey === "id") ||
                         (parent && t.isVariableDeclarator(parent) && parentKey === "id");
      if (!isDeclName) {
        // Skip property access (obj.prop) and object keys ({prop: 1})
        const isMemberProp = parent && t.isMemberExpression(parent) && parentKey === "property" && !parent.computed;
        const isObjKey = parent && t.isObjectProperty(parent) && parentKey === "key" && !parent.computed;
        if (!isMemberProp && !isObjKey) referenced.add(node.name);
      }
    }

    // Recurse into children — function nodes use their OWN scope
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const v of val) {
          if (v && typeof v.type === "string") {
            const childScope = v.$$scopeId !== undefined ? v.$$scopeId : scopeId;
            collectRefs(v, childScope, node, key);
          }
        }
      } else if (val && typeof val.type === "string") {
        const childScope = val.$$scopeId !== undefined ? val.$$scopeId : scopeId;
        collectRefs(val, childScope, node, key);
      }
    }
  }

  // Collect from program level
  for (const stmt of ast.program.body) collectRefs(stmt, programScope.id, ast, "body");

  // ── Phase 4: Resolve references and build closure captures ─────────

  const fnRefs = new Map();       // fnName  → Set(varName)
  const varUsedBy = new Map();    // varName → Set(fnName)
  const closureCaptures = [];     // [{ fnName, varName, fromScopeId, toScopeId }]

  function resolveScopeForName(name, fromScopeId) {
    let s = scopes.get(fromScopeId);
    while (s !== null) {
      if (s.declarations.has(name)) return s;
      s = s.parent !== null ? scopes.get(s.parent) : null;
    }
    return null;
  }

  function enclosingFnScope(scopeId) {
    let s = scopes.get(scopeId);
    while (s !== null) {
      if (s.type === "function") return s;
      s = s.parent !== null ? scopes.get(s.parent) : null;
    }
    return null;
  }

  function enclosingFnOrProgram(scopeId) {
    let s = scopes.get(scopeId);
    while (s !== null) {
      if (s.type === "function" || s.type === "program") return s;
      s = s.parent !== null ? scopes.get(s.parent) : null;
    }
    return null;
  }

  function resolveRefs(node, scopeId, parent, parentKey) {
    if (!node || typeof node !== "object") return;

    if (t.isIdentifier(node)) {
      // Skip declaration-site names
      const isDeclName = (parent && t.isFunctionDeclaration(parent) && parentKey === "id") ||
                         (parent && t.isVariableDeclarator(parent) && parentKey === "id");
      if (!isDeclName) {
        // Skip property access
        const isProperty = parent && t.isMemberExpression(node) && parentKey === "property" && !parent.computed;
        if (!isProperty) {
          const declScope = resolveScopeForName(node.name, scopeId);
          if (declScope) {
            const fromFn = enclosingFnOrProgram(scopeId);
            // Track fnRefs / varUsedBy
            if (fromFn && fromFn.type === "function" && fromFn.fnName) {
              const fnName = fromFn.fnName;
              if (!fnRefs.has(fnName)) fnRefs.set(fnName, new Set());
              fnRefs.get(fnName).add(node.name);
              if (!varUsedBy.has(node.name)) varUsedBy.set(node.name, new Set());
              varUsedBy.get(node.name).add(fnName);
            }
            // Detect closure capture: function accesses a variable from an outer scope
            // Rule: fromFn must NOT be at program level (top-level fns calling each other is not a closure)
            // This handles: nested fn → outer fn, IIFE → program, but NOT: top-level fn → program
            if (fromFn && fromFn.type === "function") {
              const fromFnParent = fromFn.parent !== null ? scopes.get(fromFn.parent) : null;
              const isTopLevel = fromFnParent && fromFnParent.type === "program";
              if (!isTopLevel && declScope.id !== scopeId && declScope.id !== fromFn.id) {
                closureCaptures.push({ fnName: fromFn.fnName || "<anonymous>", varName: node.name, fromScopeId: declScope.id, toScopeId: scopeId });
              }
            }
          }
        }
      }
    }

    // Recurse into children — function declarations/expressions/arrows use their OWN scope
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const v of val) {
          if (v && typeof v.type === "string") {
            const childScope = v.$$scopeId !== undefined ? v.$$scopeId : scopeId;
            resolveRefs(v, childScope, node, key);
          }
        }
      } else if (val && typeof val.type === "string") {
        const childScope = val.$$scopeId !== undefined ? val.$$scopeId : scopeId;
        resolveRefs(val, childScope, node, key);
      }
    }
  }

  // Resolve from program level
  for (const stmt of ast.program.body) resolveRefs(stmt, programScope.id, ast, "body");

  // Build declarations map (all scopes, not just top-level)
  const declarations = new Map();
  for (const [sid, scope] of scopes) {
    for (const [name, info] of scope.declarations) {
      if (!declarations.has(name)) declarations.set(name, info);
    }
  }

  return { declarations, fnRefs, varUsedBy, isMutated, referenced, closureCaptures, scopes };
}

module.exports = { buildRefGraph };
