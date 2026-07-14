#!/usr/bin/env node
// CLI entry point for the deobfuscation pipeline.
//
// Usage:
//   node transform.js <input> [output] [--split]
//
//   node transform.js obfuscated.js
//     → writes obfuscated.deob.js
//
//   node transform.js obfuscated.js clean.js
//     → writes clean.js
//
//   node transform.js obfuscated.js --split
//     → writes obfuscated.deob/ directory (split by parent function)
//
//   node transform.js obfuscated.js clean/ --split
//     → writes clean/ directory
//
// From code:
//   const { main } = require('./scripts/pipeline');
//   main({ input: 'obfuscated.js', output: 'clean.js', split: true });

const path = require("path");
const { main } = require("./scripts/pipeline");

const args = process.argv.slice(2);
const splitFlag = args.includes("--split");
const filtered = args.filter((a) => a !== "--split");
const inputPath = filtered[0];

if (!inputPath) {
  console.error("Usage: node transform.js <input> [output] [--split]");
  console.error("  input   — path to the obfuscated JavaScript file");
  console.error("  output  — path for output (default: <input>.deob.js");
  console.error("  --split — split output into per-function files in a directory");
  process.exit(1);
}

const defaultOut = splitFlag
  ? inputPath.replace(/\.js$/, ".deob")
  : inputPath.replace(/\.js$/, ".deob.js");
const outputPath = filtered[1] || defaultOut;

console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputPath}${splitFlag ? " (split mode)" : ""}`);
console.log("");

main({ input: inputPath, output: outputPath, split: splitFlag });
