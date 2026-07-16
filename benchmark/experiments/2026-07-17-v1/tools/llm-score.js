// LLM-based scoring for qualitative dimensions
// Outputs JSON prompts for manual agent execution
const fs = require("fs");
const path = require("path");

function buildPrompt(scenario) {
  const expDir = path.join(__dirname, "..");
  const gtPath = path.join(expDir, "scenarios", scenario, "ground-truth.json");
  const deobPath = path.join(expDir, "results", `scenario_${scenario}_deob.json`);
  const rawPath = path.join(expDir, "results", `scenario_${scenario}_raw.json`);

  if (!fs.existsSync(deobPath) || !fs.existsSync(rawPath)) return null;

  const gt = JSON.parse(fs.readFileSync(gtPath, "utf-8"));
  const deob = JSON.parse(fs.readFileSync(deobPath, "utf-8"));
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf-8"));

  // Strip _meta before sending to LLM
  delete deob._meta;
  delete raw._meta;

  return {
    scenario,
    prompt: `You are a benchmark judge. Score two agents' answers against the ground truth.
Return ONLY a JSON object (no markdown, no explanation outside JSON):

{
  "deob": {
    "purpose": {"score": 0.0, "why": "1 sentence"},
    "functions": {"score": 0.0, "why": "1 sentence"},
    "security": {"score": 0.0, "why": "1 sentence"},
    "dataFlow": {"score": 0.0, "why": "1 sentence"},
    "variables": {"score": 0.0, "why": "1 sentence"}
  },
  "raw": {
    "purpose": {"score": 0.0, "why": "1 sentence"},
    "functions": {"score": 0.0, "why": "1 sentence"},
    "security": {"score": 0.0, "why": "1 sentence"},
    "dataFlow": {"score": 0.0, "why": "1 sentence"},
    "variables": {"score": 0.0, "why": "1 sentence"}
  }
}

Scoring guidelines:
- purpose: Does the one-sentence summary capture the FULL functionality? Penalize missing major features (e.g. "login" only vs "login + profile fetch + update"). Reward accuracy over brevity.
- functions: How many functions were correctly identified (name + purpose + call relationships)? Count both precision and recall. Ignore naming differences if purpose matches.
- security: How many security issues were correctly identified (severity + description)? Full match = 1.0, partial (right issue wrong severity) = 0.5.
- dataFlow: Does the data flow description match the actual flow? Check key steps (input→processing→output). Missing major steps = lower score.
- variables: How many key variables were correctly identified (name/value/purpose)? Match meaning, not exact name.

Ground Truth:
${JSON.stringify(gt, null, 2)}

Agent A (deob) Answer:
${JSON.stringify(deob, null, 2)}

Agent B (raw) Answer:
${JSON.stringify(raw, null, 2)}`,
  };
}

// Generate prompts for all scenarios
const scenarios = process.argv.includes("--all") ? ["A","B","C","D","E"] : process.argv.slice(2);
for (const sc of scenarios) {
  const result = buildPrompt(sc);
  if (!result) { console.log(`${sc}: SKIP`); continue; }
  const outPath = path.join(__dirname, "..", "results", `scenario_${sc}_judge_prompt.txt`);
  fs.writeFileSync(outPath, result.prompt, "utf-8");
  console.log(`${sc}: prompt written to ${outPath} (${result.prompt.length} chars)`);
}
