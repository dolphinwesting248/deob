#!/usr/bin/env node
// 7-dimension scoring for multi-file reverse engineering benchmark
// 5 LLM-judged (80%) + 2 Rule-calculated (10%) + 1 Rule (10%)
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "..");
const SCENARIOS = ["A", "B", "C"];

function scoreMetric(agentVal, deobVal, rawVal) {
  if (!agentVal || !deobVal || !rawVal) return 0.5;
  const total = deobVal + rawVal;
  if (total === 0) return 0.5;
  return Math.max(0, Math.min(1, 1 - agentVal / total));
}

function loadAnswer(name) {
  const p = path.join(BASE, "results", "agent-answers", name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : null;
}

function loadTruth(s) {
  return JSON.parse(fs.readFileSync(path.join(BASE, "scenarios", s, "ground-truth.json"), "utf-8"));
}

// ---- LLM scores from llm-scores.json ----
let llmScores = {};
const llmPath = path.join(BASE, "results", "scores", "llm-scores.json");
if (fs.existsSync(llmPath)) llmScores = JSON.parse(fs.readFileSync(llmPath, "utf-8"));

function getLlmScore(scenario, agentType, dim) {
  try { return llmScores[scenario]?.[agentType]?.[dim] ?? null; }
  catch { return null; }
}

// ---- Rule-based scores ----
function scoreEntryPoint(answer, truth) {
  const expectedFile = truth.expectedAnswers?.entryFile || "";
  const expectedFn = truth.expectedAnswers?.entryFunction || "";
  if (!expectedFile && !expectedFn) return 0.5;

  let score = 0;
  const ansFile = (answer?.entryPoint?.file || "").toLowerCase();
  const ansFn = (answer?.entryPoint?.function || "").toLowerCase();

  if (expectedFile && ansFile.includes(expectedFile.toLowerCase())) score += 0.5;
  if (expectedFn && ansFn.includes(expectedFn.toLowerCase())) score += 0.5;

  return score;
}

function scoreEndpoints(answer, truth) {
  const expected = truth.expectedAnswers?.apiEndpoints || [];
  if (expected.length === 0) return 1;
  const found = answer?.endpoints || [];
  let matched = 0;
  for (const te of expected) {
    if (found.some(fe =>
      (fe.url || "").includes(te.url.replace(/^https?:\/\//, "").split("/")[0]) &&
      fe.method === te.method
    )) matched++;
  }
  return expected.length > 0 ? matched / expected.length : 1;
}

function computeScores(scenario, deobAnswer, rawAnswer) {
  const truth = loadTruth(scenario);
  const deobMeta = deobAnswer?._meta || {};
  const rawMeta = rawAnswer?._meta || {};

  const llmDims = ["filePurposes", "dependencies", "dataFlow", "sharedResources"];
  const dimLabels = {
    filePurposes: "File Purposes",
    dependencies: "Cross-File Dependencies",
    dataFlow: "Data Flow",
    sharedResources: "Shared Resources"
  };

  const deobScores = {}, rawScores = {};

  // LLM dimensions
  for (const dim of llmDims) {
    const dDeob = getLlmScore(scenario, "deob", dimLabels[dim]);
    const dRaw = getLlmScore(scenario, "raw", dimLabels[dim]);
    deobScores[dim] = dDeob !== null ? dDeob : 0;
    rawScores[dim] = dRaw !== null ? dRaw : 0;
  }

  // Rule dimensions
  const deobTime = deobMeta.timeMs || 0, rawTime = rawMeta.timeMs || 0;
  const deobTokens = deobMeta.tokensUsed || 0, rawTokens = rawMeta.tokensUsed || 0;

  deobScores.token = scoreMetric(deobTokens, deobTokens, rawTokens);
  rawScores.token = scoreMetric(rawTokens, deobTokens, rawTokens);
  deobScores.time = scoreMetric(deobTime, deobTime, rawTime);
  rawScores.time = scoreMetric(rawTime, deobTime, rawTime);
  deobScores.entry = scoreEntryPoint(deobAnswer, truth);
  rawScores.entry = scoreEntryPoint(rawAnswer, truth);

  // Weights: 4 LLM (80%) + 2 Rule (10%) + 1 Rule (10%)
  const weights = {
    filePurposes: 0.20,
    dependencies: 0.25,
    dataFlow: 0.20,
    sharedResources: 0.15,
    entry: 0.10,
    token: 0.05,
    time: 0.05
  };

  function total(scores) {
    return Object.entries(weights).reduce((s, [k, w]) => s + (scores[k] || 0) * w, 0);
  }

  return {
    scenario,
    deob: { dimensions: deobScores, total: total(deobScores), weights },
    raw: { dimensions: rawScores, total: total(rawScores), weights },
  };
}

// ---- Main ----
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node score.js --all          (score all scenarios using llm-scores.json)");
  process.exit(1);
}

if (args[0] === "--all") {
  const allScores = {};
  for (const s of SCENARIOS) {
    const deob = loadAnswer(`scenario_${s}_deob.json`);
    const raw = loadAnswer(`scenario_${s}_raw.json`);
    if (!deob && !raw) { console.log(`Scenario ${s}: NO ANSWERS`); continue; }
    allScores[s] = computeScores(s, deob, raw);
    console.log(`Scenario ${s}: deob=${(allScores[s].deob.total * 100).toFixed(0)}% raw=${(allScores[s].raw.total * 100).toFixed(0)}%`);
  }
  fs.writeFileSync(path.join(BASE, "results", "scores", "final-scores.json"), JSON.stringify(allScores, null, 2));
  console.log(`\nScores saved to results/scores/final-scores.json`);
}
