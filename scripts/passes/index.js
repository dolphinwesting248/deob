// Re-export all passes from sub-modules

const simplify = require("./simplify");
const deadCode = require("./dead-code");
const inline = require("./inline");
const declarations = require("./declarations");

module.exports = {
  ...simplify,
  ...deadCode,
  ...inline,
  ...declarations,
  resetInlineNames: inline.resetInlineNames,
};
