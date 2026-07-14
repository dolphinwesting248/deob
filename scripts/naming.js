const { t } = require("./config");

function cleanName(name) {
  let cleaned = name.replace(/^_sub_/, "").replace(/^_+/, "");
  if (cleaned.length > 40) cleaned = cleaned.slice(-40);
  return cleaned;
}

function subName(parentName, seq, hint) {
  const s = String(seq).padStart(2, "0");
  const clean = cleanName(parentName);
  return `_sub_${clean}_${s}_${hint || "fn"}`;
}

function getFnName(node) {
  if (!node) return "anon";
  if (t.isFunctionDeclaration(node) && node.id) return node.id.name;
  if (t.isFunctionExpression(node) && node.id) return node.id.name;
  if ((t.isObjectMethod(node) || t.isClassMethod(node) || t.isClassPrivateMethod(node)) && node.key) {
    if (t.isIdentifier(node.key)) return node.key.name;
    if (t.isStringLiteral(node.key)) return node.key.value;
    if (node.key.loc) return `ln${node.key.loc.start.line}`;
  }
  if (node.loc) return `ln${node.loc.start.line}`;
  return "anon";
}

module.exports = { cleanName, subName, getFnName };
