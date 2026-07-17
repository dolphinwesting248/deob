# deob Crypto Cracking Benchmark

Quantify deob's impact on LLM-driven client-side encryption analysis. Adapted from real production encryption code.

## Quick Start

```bash
# 1. Prepare scenarios: write original.js + ground-truth.json
# 2. Generate obfuscated code
node tools/obfuscate.js

# 3. Run deob on all scenarios
node tools/runner.js

# 4. Spawn sub-agents (deob vs raw)
#    Save answers to results/agent-answers/scenario_<X>_deob.json and **_raw.json

# 5. Embed token/time metadata (_meta) into answer JSONs

# 6. Generate LLM scoring prompt
node tools/score-llm.js

# 7. Send prompt to LLM → save response as results/scores/llm-scores.json

# 8. Compute final scores
node tools/score.js --all

# 9. Generate charts
node tools/gen-charts.js
```

## Scoring (8 dimensions)

| # | Dimension | Weight | Type | Description |
|---|-----------|--------|------|-------------|
| 1 | Algorithm | 20% | LLM | Correctly identified encryption algorithm and mode |
| 2 | Key | 25% | LLM | Found salt/key/secret value and source |
| 3 | Parameters | 20% | LLM | IV, padding, encoding, separator, data format |
| 4 | PseudoCode | 10% | LLM | Pseudo-code is logically executable |
| 5 | Result | 10% | LLM | Recovered correct plaintext/signature/HMAC |
| 6 | Token | 5% | Rule | Bidirectional normalization |
| 7 | Time | 5% | Rule | Bidirectional normalization |
| 8 | EntryPoint | 5% | Rule | Correctly identified encryption entry function |

## Scenarios

| Scenario | Algorithm | Difficulty | Source |
|----------|-----------|------------|--------|
| A | MD5 Request Signing | Medium | sina_ads + suning_da |
| B | AES-128-CBC Encryption | Hard | weibo_fp.js |
| C | RC4 + HMAC-SHA256 | Extreme | tmall_security.js |

## Agent Answer Format

```json
{
  "scenario": "B",
  "agentType": "deob",
  "algorithm": "AES-128-CBC with PKCS#7 and random IV",
  "keyOrSalt": "2b7e151628aed2a6abf7158809cf4f3c",
  "separator": ".",
  "payloadFormat": "base64(iv).base64(ciphertext)",
  "entryFunction": "encryptPayload",
  "pseudoCode": "def decrypt(payload): ...",
  "plaintextOrSignature": {"user":"test_user",...},
  "endpoints": [],
  "_meta": { "timeMs": 85000, "tokensUsed": 4200 }
}
```

## File Structure

```
experiments/2026-07-18-crypto/
  README.md
  imgs/
    bar-total.svg
    radar-A.svg, radar-B.svg, radar-C.svg
  tools/
    obfuscate.js, runner.js, score.js, score-llm.js, gen-charts.js
  scenarios/
    A/  original.js  obfuscated.js  ground-truth.json
    B/  ...
    C/  ...
  results/
    deob-output/      scenario_A_deob/  scenario_B_deob/  scenario_C_deob/
    agent-answers/    scenario_A_deob.json  scenario_A_raw.json  ...
    agent-prompts/    (optional)
    scores/           llm-score-prompt.txt  llm-scores.json  final-scores.json
```
