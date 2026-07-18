#!/usr/bin/env node
// Generate LLM scoring prompt for 4 qualitative architecture understanding dimensions
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "..");
const SCENARIOS = ["A", "B", "C"];
const AGENT_TYPES = ["deob", "raw"];

const DIMENSIONS = [
  { key: "File Purposes", desc: "Correctly identified the purpose/role of each file. Score 1.0 if all file purposes match ground truth semantically, 0.5 if about half are correct, 0.0 if mostly wrong." },
  { key: "Cross-File Dependencies", desc: "Correctly traced dependencies between files — which file depends on which, and through what mechanism (globalThis/window/import). Consider both direct and indirect dependencies." },
  { key: "Data Flow", desc: "Correctly traced the complete data flow path from entry point through all intermediate files to the final output/network request. Semantic equivalence is acceptable." },
  { key: "Shared Resources", desc: "Correctly identified variables/objects shared across files via globalThis, including where they are defined and which files use them." },
];

let prompt = `You are scoring LLM agents on their ability to understand the architecture of multi-file obfuscated JavaScript projects.

Each scenario has multiple obfuscated JS files. The agent must:
1. Identify what each file does
2. Trace cross-file dependencies
3. Map the complete data flow
4. Find shared resources (globalThis variables)

Score each agent on 4 dimensions from 0.0 (completely wrong) to 1.0 (perfect):

`;
for (const d of DIMENSIONS) {
  prompt += `- ${d.key} (${d.desc})\n`;
}
prompt += `\nOutput format: JSON object with structure:\n`;
prompt += `{ "A": { "deob": { "File Purposes": 0.X, "Cross-File Dependencies": 0.X, "Data Flow": 0.X, "Shared Resources": 0.X }, "raw": {...} }, "B": {...}, "C": {...} }\n\n`;

for (const s of SCENARIOS) {
  const truth = JSON.parse(fs.readFileSync(path.join(BASE, "scenarios", s, "ground-truth.json"), "utf-8"));
  prompt += `=== SCENARIO ${s}: ${truth.difficulty.toUpperCase()} ===\n`;
  prompt += `Description: ${truth.description}\n`;
  prompt += `Files: ${truth.files.map(f => f.name).join(", ")}\n`;
  prompt += `Entry: ${truth.expectedAnswers.entryFile}:${truth.expectedAnswers.entryFunction}\n\n`;

  for (const at of AGENT_TYPES) {
    const answerFile = path.join(BASE, "results", "agent-answers", `scenario_${s}_${at}.json`);
    if (fs.existsSync(answerFile)) {
      const ans = JSON.parse(fs.readFileSync(answerFile, "utf-8"));
      prompt += `--- Agent ${s}_${at} ---\n`;
      prompt += `File Purposes: ${JSON.stringify(ans.filePurposes || "N/A")}\n`;
      prompt += `Dependencies: ${JSON.stringify((ans.dependencies || []).slice(0, 5))}${(ans.dependencies || []).length > 5 ? " ...+" + (ans.dependencies.length - 5) + " more" : ""}\n`;
      prompt += `Data Flow: ${(ans.dataFlow || "N/A").substring(0, 400)}\n`;
      prompt += `Shared Resources: ${JSON.stringify((ans.sharedResources || []).slice(0, 5))}${(ans.sharedResources || []).length > 5 ? " ...+" + (ans.sharedResources.length - 5) + " more" : ""}\n`;
      prompt += `Entry Point: ${JSON.stringify(ans.entryPoint || "N/A")}\n`;
      prompt += `Endpoints: ${JSON.stringify(ans.endpoints || [])}\n`;
      prompt += `_meta: time=${ans._meta?.timeMs || "?"}ms tokens=${ans._meta?.tokensUsed || "?"}\n\n`;
    }
  }
}

prompt += `\nReturn ONLY the JSON object. No explanation.\n`;

const outPath = path.join(BASE, "results", "scores", "llm-score-prompt.txt");
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, prompt);
console.log(`LLM scoring prompt written to ${outPath}`);
console.log(`  (${prompt.length} chars, ~${Math.round(prompt.length / 4)} tokens estimated)`);
