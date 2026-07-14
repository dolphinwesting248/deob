#!/usr/bin/env node
const path = require("path");
const { main } = require("./scripts/pipeline");
const { runMetrics } = require("./scripts/metrics");

const args = process.argv.slice(2);
const splitFlag = args.includes("--split");
const metricsFlag = args.includes("--metrics");
const filtered = args.filter((a) => a !== "--split" && a !== "--metrics");
const inputPath = filtered[0];

if (!inputPath || inputPath === "--help" || inputPath === "-h") {
  console.log("deob — universal JS deobfuscation pipeline\n");
  console.log("Usage: deob <input> [output] [options]\n");
  console.log("  input     — path to the obfuscated JavaScript file");
  console.log("  output    — path for output (default: <input>.deob.js)");
  console.log("  --split   — split output into per-function files");
  console.log("  --metrics — generate HTML metrics report\n");
  console.log("Examples:");
  console.log("  deob main.js");
  console.log("  deob main.js --split");
  console.log("  deob main.js --split --metrics");
  process.exit(0);
}

const defaultOut = splitFlag
  ? inputPath.replace(/\.js$/, ".deob")
  : inputPath.replace(/\.js$/, ".deob.js");
const outputPath = filtered[1] || defaultOut;

console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputPath}${splitFlag ? " (split mode)" : ""}`);
if (metricsFlag) console.log("        + metrics report");
console.log("");

main({ input: inputPath, output: outputPath, split: splitFlag });

if (metricsFlag) {
  runMetrics(inputPath, outputPath);
}
