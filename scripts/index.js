// Public API for the deobfuscation pipeline.
//
// Quick start:
//   const { main } = require('./scripts');
//   main({ input: 'obfuscated.js', output: 'clean.js' });
//
// Internal modules (require these when adding new passes):
//   config     — parser, t, generate, fs, path, GLOBALS
//   naming     — cleanName, subName, getFnName
//   ast-utils  — isIIFE, describeBody, descIIFE, clone, hasBail, hasReturn, hasSuperCall, containsAwait
//   scope   — collectDefined, collectBindingNames, getExternalRefs
//   emit     — createSubFn, addLineComment
//   extract — processBody, tryExtract, processNestedInStmt, tryExtractVarIIFE
//   traverse — processAllFunctions
//   wrapper   — extractTopLevelIIFEs
//   passes     — hoistDeclarations, constantFold, simplifyBooleanObfuscation
//   pipeline   — main(options)

const { main } = require("./pipeline");
module.exports = { main };
