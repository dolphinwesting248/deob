#!/usr/bin/env node
// Generate LLM scoring prompt for 5 qualitative encryption dimensions
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "..");
const SCENARIOS = ["A", "B", "C"];
const AGENT_TYPES = ["deob", "raw"];

const DIMENSIONS = [
  { key: "Algorithm", desc: "Correctly identified the encryption algorithm (MD5/AES-CBC/RC4+HMAC) and its mode of operation" },
  { key: "Key", desc: "Found the encryption key, salt, or secret — including its value, source, and storage location" },
  { key: "Parameters", desc: "Correctly identified IV generation, padding mode, encoding format (base64/hex), separators, and data format" },
  { key: "PseudoCode", desc: "Produced logically correct pseudo-code or Python that would work if executed" },
  { key: "Result", desc: "Successfully recovered the plaintext, signature, or HMAC — the ultimate verification" },
];

let prompt = `You are scoring LLM agents on their ability to reverse-engineer client-side encryption from obfuscated JavaScript.

For each scenario, you will see two agent answers:
- "deob": the agent used deobscura preprocessed output (main.js + 0-prompt + 1-structure + 2-index)
- "raw": the agent read the obfuscated JS directly

Score each agent on 5 dimensions from 0.0 (completely wrong) to 1.0 (perfect):

`;
for (const d of DIMENSIONS) {
  prompt += `- ${d.key} (${d.desc})\n`;
}
prompt += `\nOutput format: JSON object with structure:\n`;
prompt += `{ "A": { "deob": { "Algorithm": 0.X, "Key": 0.X, "Parameters": 0.X, "PseudoCode": 0.X, "Result": 0.X }, "raw": {...} }, "B": {...}, "C": {...} }\n\n`;

for (const s of SCENARIOS) {
  const truth = JSON.parse(fs.readFileSync(path.join(BASE, "scenarios", s, "ground-truth.json"), "utf-8"));
  prompt += `=== SCENARIO ${s}: ${truth.algorithm} — ${truth.difficulty} ===\n`;
  prompt += `Description: ${truth.description}\n`;
  prompt += `Expected: algorithm=${truth.expectedAnswers.algorithm}, key=${truth.expectedAnswers.keyOrSalt}, entry=${truth.expectedAnswers.entryFunction}\n\n`;

  for (const at of AGENT_TYPES) {
    const answerFile = path.join(BASE, "results", "agent-answers", `scenario_${s}_${at}.json`);
    if (fs.existsSync(answerFile)) {
      const ans = JSON.parse(fs.readFileSync(answerFile, "utf-8"));
      prompt += `--- Agent ${s}_${at} ---\n`;
      prompt += `Algorithm: ${ans.algorithm || "N/A"}\n`;
      prompt += `Key/Salt: ${ans.keyOrSalt || ans.keyHex || ans.rc4Key || "N/A"}\n`;
      prompt += `Separator: ${ans.separator || "N/A"}\n`;
      prompt += `Payload format: ${ans.paramFormat || ans.payloadFormat || "N/A"}\n`;
      prompt += `Entry function: ${ans.entryFunction || "N/A"}\n`;
      prompt += `PseudoCode: ${(ans.pseudoCode || "").substring(0, 300)}...\n`;
      prompt += `Plaintext/Signature: ${JSON.stringify(ans.plaintextOrSignature || ans.decryptedPlaintext || "N/A")}\n`;
      prompt += `_meta: time=${ans._meta?.timeMs || "?"}ms tokens=${ans._meta?.tokensUsed || "?"}\n\n`;
    }
  }
}

prompt += `\nReturn ONLY the JSON object. No explanation.\n`;

const outPath = path.join(BASE, "results", "scores", "llm-score-prompt.txt");
fs.writeFileSync(outPath, prompt);
console.log(`LLM scoring prompt written to ${outPath}`);
console.log(`  (${prompt.length} chars, ~${Math.round(prompt.length/4)} tokens estimated)`);
