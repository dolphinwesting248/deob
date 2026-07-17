#!/usr/bin/env node
// Generate obfuscated.js from original.js for each scenario
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SCENARIOS = [
  { id: "A", opts: "--compact true --string-array true --string-array-encoding base64 --string-array-threshold 0.5 --control-flow-flattening true --control-flow-flattening-threshold 0.3 --dead-code-injection true --dead-code-injection-threshold 0.1 --self-defending false --debug-protection false --rename-globals false --rename-properties false" },
  { id: "B", opts: "--compact true --string-array true --string-array-encoding base64 --string-array-threshold 0.5 --control-flow-flattening true --control-flow-flattening-threshold 0.5 --dead-code-injection true --dead-code-injection-threshold 0.2 --self-defending true --debug-protection false --rename-globals false --rename-properties false" },
  { id: "C", opts: "--compact true --string-array true --string-array-encoding rc4 --string-array-threshold 0.5 --control-flow-flattening true --control-flow-flattening-threshold 0.75 --dead-code-injection true --dead-code-injection-threshold 0.3 --self-defending true --debug-protection true --rename-globals false --rename-properties false" },
];

const BASE = path.join(__dirname, "..");

for (const s of SCENARIOS) {
  const src = path.join(BASE, "scenarios", s.id, "original.js");
  const out = path.join(BASE, "scenarios", s.id, "obfuscated.js");
  console.log(`Obfuscating scenario ${s.id}...`);
  try {
    execSync(`npx --yes javascript-obfuscator "${src}" --output "${out}" ${s.opts}`, { stdio: "pipe" });
    const size = fs.statSync(out).size;
    console.log(`  Scenario ${s.id}: ${(size / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.error(`  Scenario ${s.id} FAILED: ${e.message.split("\n")[0]}`);
  }
}
console.log("Done.");
