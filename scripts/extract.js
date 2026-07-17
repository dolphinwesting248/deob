// Extraction module: split syntactic structures into independent sub-functions

const { t } = require("./config");
const { SKIP_KEYS } = require("./constants");
const { subName } = require("./naming");
const { createSubFn, safeParam } = require("./emit");
const { isIIFE, descIIFE, clone, hasBail, hasSuperCall, hasReturn, describeBody } = require("./ast-utils");
const { collectDefined, getExternalRefs } = require("./scope");

// ---- shouldSkipBody: don't extract trivial single-statement blocks without nested control flow ----
function hasNestedControlFlow(stmts) {
  for (const s of stmts) {
    if (t.isIfStatement(s) || t.isForStatement(s) || t.isWhileStatement(s) ||
        t.isTryStatement(s) || t.isSwitchStatement(s) || t.isDoWhileStatement(s) ||
        t.isForInStatement(s) || t.isForOfStatement(s)) return true;
  }
  return false;
}
function shouldSkipBody(stmts) {
  if (!stmts || stmts.length > 1) return false;
  if (stmts.length === 0) return true;
  return !hasNestedControlFlow(stmts);
}

// ---- mergeDefined: combine block-local defs with enclosing scope defs ----
function mergeDefined(blockDefined, parentDefs) {
  if (!parentDefs || parentDefs.size === 0) return blockDefined;
  const merged = new Set(blockDefined);
  for (const name of parentDefs) merged.add(name);
  return merged;
}

// ---- processBody: core transformation at statement level ----
function processBody(stmts, parentName, counter, processedBodiesRef, parentDefs) {
  const newBody = [];
  const subFns = [];
  const own = counter || { seq: 0 };

  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i];
    if (!s || typeof s !== "object") { newBody.push(s); continue; }
    own.seq++;
    const result = tryExtract(s, parentName, own.seq, stmts, i, parentDefs);
    if (result) { newBody.push(result.replacement); subFns.push(...result.subFns); }
    else { newBody.push(s); }
  }

  // Walk into nested blocks for deeper extract
  for (const stmt of newBody) {
    processNestedInStmt(stmt, parentName, subFns, own, processedBodiesRef, parentDefs);
  }

  return { newBody, subFns };
}

// ---- tryExtract: dispatch to the right extract rule ----
function tryExtract(stmt, parentName, seq, _allStmts, _idx, parentDefs) {
  // Rule 1: IIFE as expression statement
  if (t.isExpressionStatement(stmt) && isIIFE(stmt.expression)) return extractIIFE(stmt, parentName, seq, parentDefs);
  // Rule 2: try-catch
  if (t.isTryStatement(stmt)) return extractTryCatch(stmt, parentName, seq, parentDefs);
  // Rule 3: for/while loop
  if (t.isForStatement(stmt) || t.isForInStatement(stmt) || t.isForOfStatement(stmt) ||
      t.isWhileStatement(stmt) || t.isDoWhileStatement(stmt)) return extractLoop(stmt, parentName, seq, parentDefs);
  // Rule 4: if-else
  if (t.isIfStatement(stmt) && t.isBlockStatement(stmt.consequent)) return extractIfElse(stmt, parentName, seq, parentDefs);
  // Rule 5: switch-case
  if (t.isSwitchStatement(stmt)) return extractSwitch(stmt, parentName, seq, parentDefs);
  // Rule 6-8: callbacks
  if (t.isExpressionStatement(stmt)) { const cb = extractCallbacks(stmt, parentName, seq, parentDefs); if (cb) return cb; }
  // Rule 1 extended: IIFE in variable declarations
  if (t.isVariableDeclaration(stmt)) return extractVarIIFE(stmt, parentName, seq, parentDefs);
  return null;
}

// ---- Extraction implementations ----

function extractIIFE(stmt, parentName, seq, parentDefs) {
  const call = stmt.expression;
  const fn = call.callee;
  const body = fn.body.body;
  const name = subName(parentName, seq,descIIFE(body), fn);

  const iifeParamNames = new Set(fn.params.map((p) => (t.isIdentifier(p) ? p.name : null)).filter(Boolean));
  const defined = collectDefined(body);
  for (const n of iifeParamNames) defined.add(n);
  const refs = getExternalRefs({ type: "BlockStatement", body }, mergeDefined(defined, parentDefs));

  const proc = processBody(body, name, null, null, parentDefs);
  const allParams = [...fn.params.map((p) => clone(p)), ...refs.filter((r) => !iifeParamNames.has(r)).map((r) => t.identifier(safeParam(r)))];
  const allArgs = [...call.arguments.map((a) => clone(a)), ...refs.filter((r) => !iifeParamNames.has(r)).map((r) => t.identifier(safeParam(r)))];

  const subFn = createSubFn(name, allParams, proc.newBody, stmt);
  const repl = t.expressionStatement(t.callExpression(t.identifier(name), allArgs));
  if (stmt.loc) repl.loc = { ...stmt.loc };
  return { replacement: repl, subFns: [subFn, ...proc.subFns] };
}

function extractTryCatch(stmt, parentName, seq, parentDefs) {
  if (shouldSkipBody(stmt.block.body)) return null;
  if (hasBail(stmt.block) || hasSuperCall(stmt.block)) return null;
  if (stmt.handler && (hasBail(stmt.handler.body) || hasSuperCall(stmt.handler.body))) return null;

  const subFns = [];
  const tryDefined = collectDefined(stmt.block.body);
  const tryRefs = getExternalRefs(stmt.block, mergeDefined(tryDefined, parentDefs));
  const tryName = subName(parentName, seq,"try", stmt.block);
  const tryProc = processBody(stmt.block.body, tryName, null, null, parentDefs);
  const trySub = createSubFn(tryName, tryRefs.map((r) => t.identifier(safeParam(r))), tryProc.newBody, stmt.block);
  subFns.push(trySub, ...tryProc.subFns);

  let catchHandler = null;
  if (stmt.handler) {
    const param = stmt.handler.param;
    const catchDefined = collectDefined(stmt.handler.body.body);
    if (param && t.isIdentifier(param)) catchDefined.add(param.name);
    const catchRefs = getExternalRefs(stmt.handler.body, mergeDefined(catchDefined, parentDefs));
    const catchName = subName(parentName, seq,"catch", stmt.handler.body);
    const cProc = processBody(stmt.handler.body.body, catchName, null, null, parentDefs);
    const cSub = createSubFn(catchName, [...(param ? [clone(param)] : []), ...catchRefs.map((r) => t.identifier(safeParam(r)))], cProc.newBody, stmt.handler.body);
    subFns.push(cSub, ...cProc.subFns);

    catchHandler = t.catchClause(param ? clone(param) : null, t.blockStatement([t.expressionStatement(
      t.callExpression(t.identifier(catchName), [...(param ? [clone(param)] : []), ...catchRefs.map((r) => t.identifier(safeParam(r)))]))]));
  }

  const tryCall = t.blockStatement([t.expressionStatement(
    t.callExpression(t.identifier(tryName), tryRefs.map((r) => t.identifier(safeParam(r)))))]);
  const repl = t.tryStatement(tryCall, catchHandler, stmt.finalizer ? t.blockStatement(stmt.finalizer.body) : null);
  if (stmt.loc) repl.loc = { ...stmt.loc };
  return { replacement: repl, subFns };
}

function extractLoop(stmt, parentName, seq, parentDefs) {
  const body = stmt.body;
  if (!t.isBlockStatement(body) || body.body.length === 0) return null;
  if (shouldSkipBody(body.body)) return null;
  if (hasBail(body)) return null;

  const name = subName(parentName, seq, describeBody(body.body), body);
  const defined = collectDefined(body.body);
  const refs = getExternalRefs(body, mergeDefined(defined, parentDefs));
  const proc = processBody(body.body, name, null, null, parentDefs);
  const subFn = createSubFn(name, refs.map((r) => t.identifier(safeParam(r))), proc.newBody, body);
  const newBody = t.blockStatement([t.expressionStatement(t.callExpression(t.identifier(name), refs.map((r) => t.identifier(safeParam(r)))))]);

  let repl;
  if (t.isForStatement(stmt)) repl = t.forStatement(clone(stmt.init), clone(stmt.test), clone(stmt.update), newBody);
  else if (t.isWhileStatement(stmt)) repl = t.whileStatement(clone(stmt.test), newBody);
  else if (t.isDoWhileStatement(stmt)) repl = t.doWhileStatement(clone(stmt.test), newBody);
  else if (t.isForInStatement(stmt)) repl = t.forInStatement(clone(stmt.left), clone(stmt.right), newBody);
  else if (t.isForOfStatement(stmt)) repl = t.forOfStatement(clone(stmt.left), clone(stmt.right), newBody);
  else return null;
  if (stmt.loc) repl.loc = { ...stmt.loc };
  return { replacement: repl, subFns: [subFn, ...proc.subFns] };
}

function extractIfElse(stmt, parentName, seq, parentDefs) {
  const subFns = [];
  const cBlock = t.isBlockStatement(stmt.consequent) ? stmt.consequent : t.blockStatement([stmt.consequent]);
  if (shouldSkipBody(cBlock.body)) return null;
  if (hasBail(cBlock) || hasSuperCall(cBlock)) return null;
  const cStmts = cBlock.body;
  if (cStmts.length === 0) return null;

  const cHasReturn = hasReturn(cBlock);
  const cDefined = collectDefined(cStmts);
  const cRefs = getExternalRefs(cBlock, mergeDefined(cDefined, parentDefs));
  const ifName = subName(parentName, seq,"if", cBlock);
  const cProc = processBody(cStmts, ifName, null, null, parentDefs);
  const cFn = createSubFn(ifName, cRefs.map((r) => t.identifier(safeParam(r))), cProc.newBody, cBlock);
  subFns.push(cFn, ...cProc.subFns);

  let cCall = t.expressionStatement(t.callExpression(t.identifier(ifName), cRefs.map((r) => t.identifier(safeParam(r)))));
  if (cHasReturn) cCall = t.returnStatement(t.callExpression(t.identifier(ifName), cRefs.map((r) => t.identifier(safeParam(r)))));

  let newAlt = null;
  if (stmt.alternate) {
    const altBlock = t.isBlockStatement(stmt.alternate) ? stmt.alternate : t.isIfStatement(stmt.alternate) ? null : t.blockStatement([stmt.alternate]);
    if (t.isIfStatement(stmt.alternate)) {
      const ei = extractIfElse(stmt.alternate, parentName, seq + 1, parentDefs);
      if (ei) { subFns.push(...ei.subFns); newAlt = ei.replacement; }
      else { newAlt = clone(stmt.alternate); }
    } else if (altBlock && altBlock.body.length > 0 && !hasBail(altBlock) && !hasSuperCall(altBlock)) {
      const aStmts = altBlock.body;
      const aHasReturn = hasReturn(altBlock);
      const aDefined = collectDefined(aStmts);
      const aRefs = getExternalRefs(altBlock, mergeDefined(aDefined, parentDefs));
      const elseName = subName(parentName, seq,"else", altBlock);
      const aProc = processBody(aStmts, elseName, null, null, parentDefs);
      const aFn = createSubFn(elseName, aRefs.map((r) => t.identifier(safeParam(r))), aProc.newBody, altBlock);
      subFns.push(aFn, ...aProc.subFns);

      let aCall = t.expressionStatement(t.callExpression(t.identifier(elseName), aRefs.map((r) => t.identifier(safeParam(r)))));
      if (aHasReturn) aCall = t.returnStatement(t.callExpression(t.identifier(elseName), aRefs.map((r) => t.identifier(safeParam(r)))));
      newAlt = t.blockStatement([aCall]);
    } else if (altBlock) { newAlt = altBlock; }
  }

  const repl = t.ifStatement(clone(stmt.test), t.blockStatement([cCall]), newAlt);
  if (stmt.loc) repl.loc = { ...stmt.loc };
  return { replacement: repl, subFns };
}

function extractSwitch(stmt, parentName, seq, parentDefs) {
  const subFns = [];
  const newCases = [];
  let ci = 0;
  for (const c of stmt.cases) {
    ci++;
    if (c.consequent.length === 0) { newCases.push(t.switchCase(clone(c.test), [])); continue; }
    if (hasBail(c)) { newCases.push(clone(c)); continue; }
    if (shouldSkipBody(c.consequent)) { newCases.push(clone(c)); continue; }
    const cName = subName(parentName, `${seq}_${String(ci).padStart(2, "0")}`, "case", c);
    const defined = collectDefined(c.consequent);
    const refs = getExternalRefs(c, mergeDefined(defined, parentDefs));
    const cProc = processBody(c.consequent, cName, null, null, parentDefs);
    const cFn = createSubFn(cName, refs.map((r) => t.identifier(safeParam(r))), cProc.newBody, c);
    subFns.push(cFn, ...cProc.subFns);
    newCases.push(t.switchCase(clone(c.test), [t.expressionStatement(t.callExpression(t.identifier(cName), refs.map((r) => t.identifier(safeParam(r)))))]));
  }
  const repl = t.switchStatement(clone(stmt.discriminant), newCases);
  if (stmt.loc) repl.loc = { ...stmt.loc };
  return { replacement: repl, subFns };
}

function extractCallbacks(stmt, parentName, seq, parentDefs) {
  const infos = [];
  findCallbacks(stmt.expression, infos);
  if (infos.length === 0) return null;
  const subFns = [];
  for (let i = infos.length - 1; i >= 0; i--) {
    const info = infos[i];
    const cbName = subName(parentName, seq,info.hint || "cb", info.fn);
    const fn = info.fn;
    let stmts = t.isBlockStatement(fn.body) ? fn.body.body : [t.returnStatement(fn.body)];
    const proc = processBody(stmts, cbName, null, null, parentDefs);
    const subFn = createSubFn(cbName, fn.params.map((p) => clone(p)), proc.newBody, fn);
    subFns.push(subFn, ...proc.subFns);
    info.replace(t.identifier(cbName));
  }
  return { replacement: stmt, subFns };
}

function findCallbacks(node, infos) {
  if (!node || typeof node !== "object") return;
  if (t.isCallExpression(node) && t.isIdentifier(node.callee) && (node.callee.name === "setTimeout" || node.callee.name === "setInterval") &&
      node.arguments.length > 0 && (t.isFunctionExpression(node.arguments[0]) || t.isArrowFunctionExpression(node.arguments[0]))) {
    infos.push({ fn: node.arguments[0], hint: node.callee.name, replace: (r) => { node.arguments[0] = r; } }); return;
  }
  if (t.isCallExpression(node) && t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property) &&
      (node.callee.property.name === "then" || node.callee.property.name === "catch") && node.arguments.length > 0 &&
      (t.isFunctionExpression(node.arguments[0]) || t.isArrowFunctionExpression(node.arguments[0]))) {
    infos.push({ fn: node.arguments[0], hint: node.callee.property.name, replace: (r) => { node.arguments[0] = r; } });
    if (node.callee.property.name === "then" && node.arguments.length > 1 &&
        (t.isFunctionExpression(node.arguments[1]) || t.isArrowFunctionExpression(node.arguments[1])))
      infos.push({ fn: node.arguments[1], hint: "catch", replace: (r) => { node.arguments[1] = r; } });
    return;
  }
  if (t.isCallExpression(node) && t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property) &&
      node.callee.property.name === "addEventListener" && node.arguments.length > 1 &&
      (t.isFunctionExpression(node.arguments[1]) || t.isArrowFunctionExpression(node.arguments[1]))) {
    infos.push({ fn: node.arguments[1], hint: "listener", replace: (r) => { node.arguments[1] = r; } }); return;
  }
  if (t.isFunction(node)) return;
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const val = node[key];
    if (Array.isArray(val)) { for (const v of val) findCallbacks(v, infos); }
    else if (val && typeof val.type === "string") findCallbacks(val, infos);
  }
}

// ---- Nested block traverse ----
function processNestedInStmt(node, parentName, subFns, counter, skipBody, parentDefs) {
  if (!node || typeof node !== "object") return;
  if (skipBody && t.isBlockStatement(node) && skipBody.has(node)) return;

  if (t.isBlockStatement(node) && Array.isArray(node.body)) {
    for (let i = 0; i < node.body.length; i++) {
      const s = node.body[i];
      if (!s || typeof s !== "object") continue;
      counter.seq++;
      let extracted = null;
      if (t.isTryStatement(s)) extracted = extractTryCatch(s, parentName, counter.seq, parentDefs);
      else if (t.isForStatement(s) || t.isForInStatement(s) || t.isForOfStatement(s) || t.isWhileStatement(s) || t.isDoWhileStatement(s)) extracted = extractLoop(s, parentName, counter.seq, parentDefs);
      else if (t.isIfStatement(s) && t.isBlockStatement(s.consequent)) extracted = extractIfElse(s, parentName, counter.seq, parentDefs);
      else if (t.isSwitchStatement(s)) extracted = extractSwitch(s, parentName, counter.seq, parentDefs);
      else if (t.isExpressionStatement(s)) extracted = extractCallbacks(s, parentName, counter.seq, parentDefs);
      else if (t.isVariableDeclaration(s)) {
        const varR = tryExtractVarIIFE(s, parentName, counter.seq, parentDefs);
        if (varR) { node.body[i] = varR.replacement; subFns.push(...varR.subFns); continue; }
      }
      if (extracted) { node.body[i] = extracted.replacement; subFns.push(...extracted.subFns); }
    }
    for (const s of node.body) processNestedInStmt(s, parentName, subFns, counter, skipBody, parentDefs);
  }

  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key) || key === "body") continue;
    const val = node[key];
    if (Array.isArray(val)) { for (const v of val) processNestedInStmt(v, parentName, subFns, counter, skipBody, parentDefs); }
    else if (val && typeof val.type === "string") processNestedInStmt(val, parentName, subFns, counter, skipBody, parentDefs);
  }
}

// ---- Variable declaration IIFE extractor ----
function extractVarIIFE(stmt, parentName, seq, parentDefs) {
  const result = tryExtractVarIIFE(stmt, parentName, seq, parentDefs);
  return result; // adapt single-return interface
}

function tryExtractVarIIFE(stmt, parentName, seq, parentDefs) {
  if (!t.isVariableDeclaration(stmt)) return null;
  let changed = false;
  const newDecls = [];
  const extraSubs = [];
  for (const decl of stmt.declarations) {
    if (decl.init && isIIFE(decl.init) && t.isFunctionExpression(decl.init.callee)) {
      changed = true;
      const hint = descIIFE(decl.init.callee.body.body);
      const fnName = subName(parentName, seq,hint, decl.init.callee);
      const initProc = processBody(decl.init.callee.body.body, fnName, null, null, parentDefs);
      const subFn = createSubFn(fnName, decl.init.callee.params.map((p) => clone(p)), initProc.newBody, decl.init);
      extraSubs.push(subFn, ...initProc.subFns);
      newDecls.push(t.variableDeclarator(clone(decl.id), t.callExpression(t.identifier(fnName), decl.init.arguments.map((a) => clone(a)))));
    } else { newDecls.push(clone(decl)); }
  }
  if (changed) {
    const newDecl = t.variableDeclaration(stmt.kind, newDecls);
    if (stmt.loc) newDecl.loc = { ...stmt.loc };
    return { replacement: newDecl, subFns: extraSubs };
  }
  return null;
}

module.exports = { processBody, tryExtract, processNestedInStmt, tryExtractVarIIFE };
