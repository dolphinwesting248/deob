#!/usr/bin/env node
// 8-dimension scoring: 5 LLM-judged (85%) + 3 Rule-calculated (15%)
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "..");
const SCENARIOS = ["A", "B", "C"];

// Normalize token/time bidirectionally: lower is better, 0..1 range
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
function scoreEndpoints(answer, truth) {
  const expected = truth.expectedAnswers?.endpoints || [];
  if (expected.length === 0) return 1;
  const found = answer?.endpoints || [];
  let matched = 0;
  for (const te of expected) {
    if (found.some(fe => (fe.url || "").includes(te.url) && fe.method === te.method)) matched++;
  }
  return expected.length > 0 ? matched / expected.length : 1;
}

function scoreEntryPoint(answer, truth) {
  const expected = truth.expectedAnswers?.entryFunction || "";
  if (!expected) return 0.5;
  const ans = (answer?.entryFunction || "").toLowerCase();
  return ans.includes(expected.toLowerCase()) ? 1 : 0;
}

function computeScores(scenario, deobAnswer, rawAnswer) {
  const truth = loadTruth(scenario);
  const deobMeta = deobAnswer?._meta || {};
  const rawMeta = rawAnswer?._meta || {};

  const llmDims = ["algorithm", "keyOrSalt", "parameters", "pseudoCode", "plaintextOrSignature"];
  const dimLabels = { algorithm: "Algorithm", keyOrSalt: "Key", parameters: "Parameters", pseudoCode: "PseudoCode", plaintextOrSignature: "Result" };

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

  deobScores.endpoints = scoreEndpoints(deobAnswer, truth);
  rawScores.endpoints = scoreEndpoints(rawAnswer, truth);
  deobScores.time = scoreMetric(deobTime, deobTime, rawTime); // deob's own time normalized
  rawScores.time = scoreMetric(rawTime, deobTime, rawTime);
  deobScores.token = scoreMetric(deobTokens, deobTokens, rawTokens);
  rawScores.token = scoreMetric(rawTokens, deobTokens, rawTokens);
  deobScores.entry = scoreEntryPoint(deobAnswer, truth);
  rawScores.entry = scoreEntryPoint(rawAnswer, truth);

  // Weights: 5 LLM (85%) + 3 Rule (15%)
  const weights = {
    algorithm: 0.20, keyOrSalt: 0.25, parameters: 0.20,
    pseudoCode: 0.10, plaintextOrSignature: 0.10,
    token: 0.05, time: 0.05, entry: 0.05,
  };

  function total(scores) {
    return Object.entries(weights).reduce((s, [k, w]) => s + (scores[k] || 0) * w, 0);
  }

  return {
    scenario,
    deob: { dimensionScores: deobScores, total: total(deobScores), weights },
    raw: { dimensionScores: rawScores, total: total(rawScores), weights },
  };
}

// ---- Main ----
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node score.js --all          (score all scenarios using llm-scores.json)");
  console.log("       node score.js <answer.json>  (quick single-answer check)");
  process.exit(1);
}

if (args[0] === "--all") {
  const allScores = {};
  for (const s of SCENARIOS) {
    const deob = loadAnswer(`scenario_${s}_deob.json`);
    const raw = loadAnswer(`scenario_${s}_raw.json`);
    if (!deob && !raw) { console.log(`Scenario ${s}: NO ANSWERS`); continue; }
    allScores[s] = computeScores(s, deob, raw);
    console.log(`Scenario ${s}: deob=${(allScores[s].deob.total*100).toFixed(0)}% raw=${(allScores[s].raw.total*100).toFixed(0)}%`);
  }
  fs.writeFileSync(path.join(BASE, "results", "scores", "final-scores.json"), JSON.stringify(allScores, null, 2));
  console.log(`\nScores saved to results/scores/final-scores.json`);
} else {
  const ans = JSON.parse(fs.readFileSync(args[0], "utf-8"));
  const s = ans.scenario || "A";
  // For single-answer, just compute raw (no deob comparison)
  const truth = loadTruth(s);
  console.log(JSON.stringify({ scenario: s, answer: ans }, null, 2));
}
