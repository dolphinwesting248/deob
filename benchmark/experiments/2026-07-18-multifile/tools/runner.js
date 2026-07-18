#!/usr/bin/env node
// Run deob on all obfuscated scenarios in directory mode (one subdir per input file).
// Generates: per-file 0-prompt.md, 1-structure.md, 2-index.txt, main.js + cross-file summary.md
const { main } = require("../../../../scripts/pipeline");
const { runStructure, generatePromptFile, generateIndex, generateCrossSummary, writeCrossReadme } = require("../../../../scripts/structure");
const fs = require("fs");
const path = require("path");

const SCENARIOS = ["A", "B", "C"];
const BASE = path.join(__dirname, "..");
const SCENARIO_DIR = path.join(BASE, "scenarios");
const OUTPUT_DIR = path.join(BASE, "results", "deob-output");

if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function collectJsFiles(dir) {
  const files = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(full); }
      else if (entry.name.endsWith(".js")) { files.push(full); }
    }
  }
  walk(dir);
  return files;
}

const results = {};

for (const s of SCENARIOS) {
  const obfDir = path.join(SCENARIO_DIR, s, "obfuscated");
  const outBase = path.join(OUTPUT_DIR, `scenario_${s}`);

  console.log(`\n=== Scenario ${s} (directory mode) ===`);
  const files = collectJsFiles(obfDir);
  console.log(`  Found ${files.length} files`);

  const allReports = [];
  const scenarioResults = { files: [], totalTimeMs: 0, totalOutputBytes: 0, totalInputBytes: 0 };

  for (const f of files) {
    const relPath = path.relative(obfDir, f);
    const baseName = relPath.replace(/\.js$/, "").replace(/[\/\\]/g, "_");
    const outDir = path.join(outBase, baseName);
    const t0 = Date.now();

    console.log(`  Processing ${relPath}...`);
    try {
      main({ input: f, output: outDir, split: false, agent: true, banner: false });

      const elapsed = Date.now() - t0;
      const mainJs = path.join(outDir, "main.js");
      const outSize = fs.existsSync(mainJs) ? fs.statSync(mainJs).size : 0;
      const inSize = fs.statSync(f).size;
      const ratio = inSize > 0 ? ((outSize / inSize) * 100).toFixed(1) : "N/A";

      try {
        const report = runStructure(f, outDir, { denoise: [] });
        generatePromptFile(outDir);
        generateIndex(outDir, { denoise: [] });

        // Capture report from runStructure return value (not report.json — doesn't exist)
        if (report) {
          allReports.push({ file: baseName, srcPath: relPath, report: report });
        }
      } catch (e) {
        console.log(`    Structure: ${e.message.split("\n")[0]}`);
      }

      scenarioResults.files.push({
        file: relPath,
        baseName: baseName,
        inputBytes: inSize,
        outputBytes: outSize,
        ratioPercent: parseFloat(ratio),
        timeMs: elapsed,
        error: null
      });

      scenarioResults.totalTimeMs += elapsed;
      scenarioResults.totalOutputBytes += outSize;
      scenarioResults.totalInputBytes += inSize;
      console.log(`    ${ratio}% in ${elapsed}ms`);
    } catch (e) {
      scenarioResults.files.push({ file: relPath, error: e.message.split("\n")[0] });
      console.log(`    ERROR: ${e.message.split("\n")[0]}`);
    }
  }

  // Generate cross-file summaries
  if (allReports.length > 0) {
    try {
      const summaryContent = generateCrossSummary(allReports);
      fs.writeFileSync(path.join(outBase, "summary.md"), summaryContent, "utf-8");
      writeCrossReadme(outBase, allReports);
      console.log("  Cross-file summary generated");
    } catch (e) {
      console.log(`  Cross-file summary: ${e.message.split("\n")[0]}`);
    }
  }

  results[s] = scenarioResults;
  const okCount = scenarioResults.files.filter(r => !r.error).length;
  console.log(`  Scenario ${s}: ${okCount}/${files.length} OK, ${scenarioResults.totalTimeMs}ms total`);
}

// Write metrics
fs.writeFileSync(path.join(BASE, "results", "deob-metrics.json"), JSON.stringify(results, null, 2));
const totalOk = Object.values(results).reduce((s, r) => s + r.files.filter(f => !f.error).length, 0);
const totalFiles = Object.values(results).reduce((s, r) => s + r.files.length, 0);
console.log(`\nDone. ${totalOk}/${totalFiles} files processed across ${SCENARIOS.length} scenarios.`);
