#!/usr/bin/env node
// Run deob on all obfuscated scenarios, generate structure reports
const { main } = require("../../../../scripts/pipeline");
const { runStructure, generatePromptFile, generateIndex } = require("../../../../scripts/structure");
const fs = require("fs");
const path = require("path");

const SCENARIOS = ["A", "B", "C"];
const BASE = path.join(__dirname, "..");
const SCENARIO_DIR = path.join(BASE, "scenarios");
const OUTPUT_DIR = path.join(BASE, "results", "deob-output");

if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const results = {};

for (const s of SCENARIOS) {
  const inputFile = path.join(SCENARIO_DIR, s, "obfuscated.js");
  const outName = `scenario_${s}_deob`;
  const outDir = path.join(OUTPUT_DIR, outName);
  const t0 = Date.now();

  console.log(`\n=== Scenario ${s} ===`);
  try {
    main({ input: inputFile, output: outDir, split: false });
    const elapsed = Date.now() - t0;
    const outputPath = path.join(outDir, "main.js");
    const outputSize = fs.statSync(outputPath).size;
    const inputSize = fs.statSync(inputFile).size;
    const ratio = ((outputSize / inputSize) * 100).toFixed(1);

    try {
      runStructure(inputFile, outDir, { denoise: [] });
      generatePromptFile(outDir);
      generateIndex(outDir, { denoise: [] });
    } catch (e) {
      console.log(`  Structure: ${e.message.split("\\n")[0]}`);
    }

    results[s] = { inputBytes: inputSize, outputBytes: outputSize, ratioPercent: parseFloat(ratio), timeMs: elapsed, error: null };
    console.log(`  ${ratio}% in ${elapsed}ms`);
  } catch (e) {
    results[s] = { error: e.message.split("\\n")[0] };
    console.log(`  ERROR: ${e.message.split("\\n")[0]}`);
  }
}

fs.writeFileSync(path.join(BASE, "results", "deob-metrics.json"), JSON.stringify(results, null, 2));
console.log(`\nDone. ${Object.values(results).filter(r => !r.error).length}/${SCENARIOS.length} OK`);
