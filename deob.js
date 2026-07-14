#!/usr/bin/env node
const path = require("path");
const { main } = require("./scripts/pipeline");
const { runMetrics } = require("./scripts/metrics");
const { runStructure } = require("./scripts/structure");
const { indexDirectory } = require("./scripts/indexer");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const splitFlag = flags.has("--split");
const metricsFlag = flags.has("--metrics");
const mdFlag = flags.has("--md");
const jsonFlag = flags.has("--json");
const indexFlag = flags.has("--index");
const filtered = args.filter((a) => !a.startsWith("--"));
const inputPath = filtered[0];

if (!inputPath || flags.has("--help") || flags.has("-h")) {
  console.log("deob — universal JS deobfuscation pipeline\n");
  console.log("Usage: deob <input> [output-dir] [options]\n");
  console.log("  --split      split output into per-function files");
  console.log("  --metrics    generate HTML readability metrics report");
  console.log("  --md         generate Markdown structure report");
  console.log("  --json       generate JSON structure report");
  console.log("  --index      build code index for AI-assisted exploration\n");
  console.log("Examples:");
  console.log("  deob main.js                    → main.deob/");
  console.log("  deob main.js --split            → main.deob/ (per-function files)");
  console.log("  deob main.js out/ --metrics     → out/");
  process.exit(0);
}

const outputDir = filtered[1] || inputPath.replace(/\.js$/i, ".deob");

console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputDir}/`);
if (splitFlag) console.log("        (split mode)");
if (metricsFlag) console.log("        + metrics report");
if (mdFlag) console.log("        + structure report (.md)");
if (jsonFlag) console.log("        + structure report (.json)");
if (indexFlag) console.log("        + code index");
console.log("");

main({ input: inputPath, output: outputDir, split: splitFlag });

if (metricsFlag) runMetrics(inputPath, outputDir);
if (mdFlag) runStructure(inputPath, outputDir, "md");
if (jsonFlag) runStructure(inputPath, outputDir, "json");

// Clean up internal file used for report analysis
const allPath = path.join(outputDir, "_all.js");
if (require("fs").existsSync(allPath)) require("fs").unlinkSync(allPath);

// Build code index for AI-assisted exploration
if (indexFlag) {
  console.log("Indexing output directory...");
  const stats = indexDirectory(outputDir);
  if (stats) {
    console.log(`  ${stats.nodes} nodes, ${stats.edges} edges across ${stats.files} files (${stats.durationMs}ms)`);
  }
}
