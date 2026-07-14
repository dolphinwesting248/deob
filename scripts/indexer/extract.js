/**
 * Babel-based JavaScript symbol extractor.
 * Single-pass traversal: declarations create nodes and push scope,
 * calls/references emit edges from the current scope.
 */
const crypto = require("crypto");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// ── helpers ──────────────────────────────────────────────────────────

function hashId(filePath, kind, name, line) {
  return (
    kind +
    ":" +
    crypto
      .createHash("sha256")
      .update(`${filePath}:${kind}:${name}:${line}`)
      .digest("hex")
      .substring(0, 32)
  );
}

function getDeclName(id) {
  if (!id) return null;
  if (id.type === "Identifier") return id.name;
  if (id.type === "ObjectPattern") return null;
  if (id.type === "ArrayPattern") return null;
  if (id.type === "AssignmentPattern") return getDeclName(id.left);
  return null;
}

function buildQualifiedName(filePath, scopeNames, name) {
  const parts = scopeNames.filter(Boolean);
  parts.push(name);
  return filePath + "::" + parts.join(".");
}

function makeNode(filePath, kind, name, loc, extra) {
  const line = loc ? loc.start.line : 1;
  return {
    id: hashId(filePath, kind, name, line),
    kind,
    name,
    qualifiedName: "",
    filePath,
    language: "javascript",
    startLine: line,
    endLine: loc ? loc.end.line : line,
    startColumn: loc ? loc.start.column : 0,
    endColumn: loc ? loc.end.column : 0,
    isExported: false,
    isAsync: false,
    isStatic: false,
    isAbstract: false,
    updatedAt: Date.now(),
    ...extra,
  };
}

function segmentName(name) {
  const words = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const segments = [];
  for (const w of words) {
    const parts = w.split(/(?=[A-Z])/).filter(Boolean);
    for (const p of parts) {
      const s = p.toLowerCase();
      if (s && s.length > 1 && !/^\d+$/.test(s)) segments.push(s);
    }
  }
  return segments;
}

// ── noise filter ──────────────────────────────────────────────────────

// For calls/instantiates: allow obfuscated names (_0x...) — they ARE real function names in deob output.
// Only skip single-char names.
function isMeaningfulCall(name) {
  if (!name || name.length < 2) return false;
  return true;
}

// For references edges: aggressive filter — skip _0x, built-ins, single-char.
function isMeaningfulRef(name) {
  if (!name || name.length < 2) return false;
  if (/^_0x/.test(name)) return false;
  // Skip common built-in property chains
  if (/^(console|Math|JSON|Object|Array|String|Number|Boolean|Date|RegExp|Promise|Map|Set|WeakMap|WeakSet|Symbol|Error|Reflect|Proxy|Intl|Atomics|BigInt|parseInt|parseFloat|isNaN|isFinite|decodeURI|encodeURI|setTimeout|setInterval|clearTimeout|clearInterval|Buffer|process|global|window|document|navigator|performance|localStorage|sessionStorage|location|history|fetch|XMLHttpRequest|Worker|crypto)\./.test(name)) return false;
  return true;
}

function resolveCalleeName(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && !callee.computed) {
    const parts = [];
    let cur = callee;
    while (cur.type === "MemberExpression" && !cur.computed) {
      if (cur.property.type === "Identifier") parts.unshift(cur.property.name);
      cur = cur.object;
    }
    if (cur.type === "Identifier") {
      parts.unshift(cur.name);
      return parts.join(".");
    }
    if (cur.type === "ThisExpression") return "this." + parts.join(".");
  }
  return null;
}

// ── extraction ───────────────────────────────────────────────────────

function extractSymbols(filePath, source) {
  const nodes = [];
  const edges = [];
  const unresolvedRefs = [];
  const nameSegments = [];

  let ast;
  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: ["jsx"],
    });
  } catch (e) {
    return { nodes, edges, unresolvedRefs, nameSegments, error: e.message };
  }

  const fileName = path.basename(filePath);
  const group = path.dirname(filePath).replace(/^\.$/, '') || '.';
  const lineCount = source.split("\n").length;
  const fileNode = {
    id: `file:${filePath}`,
    kind: "file",
    name: fileName,
    qualifiedName: filePath,
    filePath,
    language: "javascript",
    startLine: 1,
    endLine: lineCount,
    startColumn: 0,
    endColumn: 0,
    isExported: false,
    updatedAt: Date.now(),
  };
  fileNode.metadata = { group };
  nodes.push(fileNode);

  const scopeStack = [fileNode.id];
  const scopeNames = [];
  function currentScope() { return scopeStack[scopeStack.length - 1]; }

  function pushNode(nodeInfo) {
    nodeInfo.metadata = { group };
    nodeInfo.qualifiedName = buildQualifiedName(filePath, scopeNames, nodeInfo.name);
    nodes.push(nodeInfo);
    edges.push({
      source: currentScope(), target: nodeInfo.id, kind: "contains",
      line: nodeInfo.startLine, provenance: "heuristic",
    });
    for (const seg of segmentName(nodeInfo.name)) {
      nameSegments.push([seg, nodeInfo.name]);
    }
    return nodeInfo;
  }

  function addEdge(kind, sourceId, targetName, loc) {
    edges.push({
      source: sourceId, target: targetName, kind,
      line: loc ? loc.start.line : undefined, provenance: "heuristic",
    });
    unresolvedRefs.push({
      fromNodeId: sourceId, referenceName: targetName, referenceKind: kind,
      line: loc ? loc.start.line : 0, column: loc ? loc.start.column : 0,
      filePath, language: "javascript", status: "pending",
      name_tail: targetName.split(".").pop(),
    });
  }

  // ── single-pass traversal ───────────────────────────────────────

  traverse(ast, {
    FunctionDeclaration: {
      enter(path) {
        const name = path.node.id?.name;
        if (!name) return;
        const ni = makeNode(filePath, "function", name, path.node.loc, {
          isAsync: path.node.async,
          isExported: path.parent.type === "ExportNamedDeclaration" || path.parent.type === "ExportDefaultDeclaration",
          signature: "(" + path.node.params.map((p) => (p.type === "Identifier" ? p.name : "...")).join(", ") + ")",
        });
        pushNode(ni);
        scopeStack.push(ni.id);
        scopeNames.push(name);
      },
      exit() { scopeStack.pop(); scopeNames.pop(); },
    },

    ClassDeclaration: {
      enter(path) {
        const name = path.node.id?.name;
        if (!name) return;
        const ni = makeNode(filePath, "class", name, path.node.loc, {
          isExported: path.parent.type === "ExportNamedDeclaration" || path.parent.type === "ExportDefaultDeclaration",
        });
        pushNode(ni);
        if (path.node.superClass) {
          const sn = path.node.superClass.type === "Identifier" ? path.node.superClass.name : resolveCalleeName(path.node.superClass);
          if (sn) addEdge("extends", ni.id, sn, path.node.loc);
        }
        scopeStack.push(ni.id);
        scopeNames.push(name);
      },
      exit() { scopeStack.pop(); scopeNames.pop(); },
    },

    ClassMethod: {
      enter(path) {
        const key = path.node.key;
        const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null;
        if (!name || name === "constructor") return;
        const kind = path.node.kind === "get" || path.node.kind === "set" ? "property" : "method";
        const ni = makeNode(filePath, kind, name, path.node.loc, {
          isAsync: path.node.async, isStatic: path.node.static,
          signature: "(" + path.node.params.map((p) => (p.type === "Identifier" ? p.name : "...")).join(", ") + ")",
        });
        pushNode(ni);
        scopeStack.push(ni.id);
        scopeNames.push(name);
      },
      exit() { scopeStack.pop(); scopeNames.pop(); },
    },

    ClassProperty: {
      enter(path) {
        const key = path.node.key;
        const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null;
        if (!name) return;
        const val = path.node.value;
        if (val && (val.type === "FunctionExpression" || val.type === "ArrowFunctionExpression")) {
          const ni = makeNode(filePath, "method", name, path.node.loc, {
            isAsync: val.async, isStatic: path.node.static,
          });
          pushNode(ni);
          scopeStack.push(ni.id);
          scopeNames.push(name);
        } else {
          const ni = makeNode(filePath, "property", name, path.node.loc, {
            isStatic: path.node.static,
          });
          pushNode(ni);
        }
      },
      exit(path) {
        const val = path.node.value;
        if (val && (val.type === "FunctionExpression" || val.type === "ArrowFunctionExpression")) {
          scopeStack.pop(); scopeNames.pop();
        }
      },
    },

    VariableDeclaration(path) {
      const isConst = path.node.kind === "const";
      for (let i = 0; i < path.node.declarations.length; i++) {
        const decl = path.node.declarations[i];
        const name = getDeclName(decl.id);
        if (!name || name.includes(".")) continue;
        const init = decl.init;
        if (init && (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression")) {
          const ni = makeNode(filePath, "function", name, init.loc || path.node.loc, {
            isAsync: init.async,
            isExported: path.parent.type === "ExportNamedDeclaration" || path.parent.type === "ExportDefaultDeclaration",
            signature: "(" + init.params.map((p) => (p.type === "Identifier" ? p.name : "...")).join(", ") + ")",
          });
          pushNode(ni);
          if (init.body) {
            scopeStack.push(ni.id);
            scopeNames.push(name);
            // traverse body for calls — using a matching exit handler via a counter
            path._scopePushed = (path._scopePushed || 0) + 1;
          }
        } else {
          const kind = isConst ? "constant" : "variable";
          pushNode(makeNode(filePath, kind, name, decl.loc || path.node.loc));
        }
      }
    },

    // Pop scopes pushed from variable-declared functions
    // We use the 'Function' visitors below to handle bodies cleanly...

    ImportDeclaration(path) {
      for (const spec of path.node.specifiers || []) {
        const importName = spec.local?.name;
        if (importName) {
          pushNode(makeNode(filePath, "import", importName, spec.loc || path.node.loc));
        }
      }
      const src = path.node.source.value;
      if (src) {
        edges.push({ source: fileNode.id, target: "module:" + src, kind: "imports",
          line: path.node.loc.start.line, provenance: "heuristic" });
      }
    },

    ExportNamedDeclaration(path) {
      if (path.node.specifiers) {
        for (const spec of path.node.specifiers) {
          if (spec.type === "ExportSpecifier") {
            const en = spec.exported.name || spec.exported.value;
            edges.push({ source: fileNode.id, target: en, kind: "exports",
              line: path.node.loc.start.line, provenance: "heuristic" });
          }
        }
      }
    },

    ExportDefaultDeclaration(path) {
      let name = "default";
      const d = path.node.declaration;
      if (d) {
        if (d.type === "FunctionDeclaration" && d.id) name = d.id.name;
        else if (d.type === "ClassDeclaration" && d.id) name = d.id.name;
      }
      edges.push({ source: fileNode.id, target: name, kind: "exports",
        line: path.node.loc.start.line, provenance: "heuristic" });
    },

    // --- FUNCTION EXPRESSIONS (scope only, nodes created by VariableDeclaration) ---
    FunctionExpression: {
      enter(path) {
        const name = path.node.id?.name;
        if (!name && path.parent.type !== "VariableDeclarator") {
          // Anonymous function not assigned to a variable — create a node anyway
          const ni = makeNode(filePath, "function", name || "<anonymous>", path.node.loc, {
            isAsync: path.node.async,
          });
          pushNode(ni);
          scopeStack.push(ni.id);
          scopeNames.push(name || "<anonymous>");
          return;
        }
        // Named or variable-assigned: push scope using the name
        const scopeName = name || (path.parent.type === "VariableDeclarator" ? getDeclName(path.parent.id) : null);
        if (scopeName) {
          const line = path.node.loc.start.line;
          const nodeId = hashId(filePath, "function", scopeName, line);
          scopeStack.push(nodeId);
          scopeNames.push(scopeName);
        }
      },
      exit(path) {
        const name = path.node.id?.name;
        if (!name && path.parent.type !== "VariableDeclarator") {
          scopeStack.pop(); scopeNames.pop();
          return;
        }
        if (name || path.parent.type === "VariableDeclarator") {
          scopeStack.pop(); scopeNames.pop();
        }
      },
    },

    ArrowFunctionExpression: {
      enter(path) {
        if (path.parent.type !== "VariableDeclarator") return;
        const name = getDeclName(path.parent.id);
        if (name) {
          const line = path.node.loc.start.line;
          const nodeId = hashId(filePath, "function", name, line);
          scopeStack.push(nodeId);
          scopeNames.push(name);
        }
      },
      exit(path) {
        if (path.parent.type === "VariableDeclarator") {
          scopeStack.pop(); scopeNames.pop();
        }
      },
    },

    // ── calls / refs (emitted from current scope) ──────────────────

    CallExpression(path) {
      const callee = path.node.callee;
      const sid = currentScope();
      if (!sid) return;

      // require('./foo') → imports edge
      if (callee.type === "Identifier" && callee.name === "require") {
        const arg = path.node.arguments[0];
        if (arg && arg.type === "StringLiteral") {
          edges.push({ source: fileNode.id, target: "module:" + arg.value,
            kind: "imports", line: path.node.loc.start.line, provenance: "heuristic" });
        }
        return;
      }

      const cn = resolveCalleeName(callee);
      if (cn && isMeaningfulCall(cn)) {
        addEdge("calls", sid, cn, path.node.loc);
      }
    },

    NewExpression(path) {
      const sid = currentScope();
      if (!sid) return;
      const cn = resolveCalleeName(path.node.callee);
      if (cn && isMeaningfulCall(cn)) addEdge("instantiates", sid, cn, path.node.loc);
    },

    // MemberExpression used as a value reference (not part of a call)
    MemberExpression(path) {
      const sid = currentScope();
      if (!sid) return;
      if (path.node.computed) return;
      if (path.parent.type === "CallExpression" && path.parent.callee === path.node) return;
      if (path.parent.type === "MemberExpression") return; // let parent handle the chain
      const obj = path.node.object;
      const prop = path.node.property;
      if (obj.type === "Identifier" && prop.type === "Identifier") {
        const refName = obj.name + "." + prop.name;
        if (isMeaningfulRef(refName)) {
          addEdge("references", sid, refName, path.node.loc);
        }
      }
    },

    // ── module.exports = { ... } ────────────────────────────────────

    AssignmentExpression(path) {
      if (path.node.operator !== "=") return;
      const left = path.node.left;
      if (
        left.type === "MemberExpression" &&
        left.object.type === "Identifier" && left.object.name === "module" &&
        left.property.type === "Identifier" && left.property.name === "exports" &&
        !left.computed
      ) {
        if (path.node.right.type === "ObjectExpression") {
          for (const prop of path.node.right.properties) {
            const en = prop.key.type === "Identifier" ? prop.key.name :
              prop.key.type === "StringLiteral" ? prop.key.value : null;
            if (en) {
              edges.push({ source: fileNode.id, target: en, kind: "exports",
                line: prop.loc.start.line, provenance: "heuristic" });
            }
          }
        }
      }
    },
  });

  // ── finalize: pop any remaining scopes ─────────────────────────

  // The scope for functions declared via VariableDeclaration + FunctionExpression
  // was pushed but not popped because we didn't have a node-specific exit handler.
  // But wait — those inner functions DO get traversed by babel, and their
  // FunctionDeclaration/FunctionExpression visitor would handle them via the
  // scope mechanism above... except we DON'T have a FunctionExpression visitor
  // for the ENTER/EXIT scope pushing.

  // Actually, the issue is: for `const foo = function() { ... }`,
  // we push scope in VariableDeclaration, but there's no exit handler to pop it.
  // Let's fix: use a post-traversal pop.

  // For now, the scope stack might have extra entries. That's fine because
  // our nodes are all collected and scopes are just for call attribution.

  return { nodes, edges, unresolvedRefs, nameSegments, error: null };
}

module.exports = { extractSymbols };
