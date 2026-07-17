# deob Crypto Cracking Benchmark Report

**2026-07-18** · 3 scenarios · 6 sub-agent runs · 8-dimension hybrid scoring

---

## 1. Executive Summary

> **Deob improves encryption algorithm reproduction accuracy, especially for exact signature/decryption verification. Raw agents are more token/time efficient on simpler algorithms.** The key advantage of deob is in scenarios requiring precise algorithm reproduction (MD5 implementation details, RC4 string decoding) where raw agents may identify the correct algorithm but fail to reproduce the exact output.

### Key Numbers

| Metric | deob | raw | Gain |
|--------|------|-----|------|
| Total score (avg) | 0.90 | 0.89 | **1.01x** |
| Algorithm ID (avg) | 0.97 | 0.87 | **1.11x** |
| Key/Salt found (avg) | 0.93 | 1.00 | 0.93x |
| Result correctness (avg) | **1.00** | 0.67 | **1.50x** |
| Time efficiency (avg) | 0.30 | 0.70 | 0.43x |
| Token efficiency (avg) | 0.42 | 0.58 | 0.72x |

### Score Comparison

![bar-total](imgs/bar-total.svg)

_Green = deob, orange = raw. deob wins A and C; raw wins B._

---

## 2. Experiment Design

**Goal**: Quantify deob's impact on LLM-driven client-side encryption analysis across difficulty levels.

**Method**: Two identical LLM agents analyze the same obfuscated code. One gets deob output (`0-prompt.md` + `1-structure.md` + `2-index.txt` + `main.js`), the other gets raw obfuscated code. Both answer a structured JSON with encryption parameters and verification output. Answers are scored against ground truth.

**Scoring**: 5 LLM-judged qualitative dimensions + 3 Rule-calculated efficiency dimensions. Each 0-1, weighted.

| Dimension | Weight | Method | Description |
|-----------|--------|--------|-------------|
| Algorithm | 20% | LLM | Correctly identified encryption algorithm and mode of operation |
| Key | 25% | LLM | Found salt/secret/key value, source, and storage location |
| Parameters | 20% | LLM | IV generation, padding, encoding format, separator, parameter format |
| PseudoCode | 10% | LLM | Produced logically correct pseudo-code or Python snippet |
| Result | 10% | LLM | Successfully recovered plaintext, signature, or HMAC (objective verification) |
| Token | 5% | Rule | $1 - \frac{k_{\text{agent}}}{k_{\text{deob}} + k_{\text{raw}}}$ |
| Time | 5% | Rule | $1 - \frac{t_{\text{agent}}}{t_{\text{deob}} + t_{\text{raw}}}$ |
| EntryPoint | 5% | Rule | $\begin{cases}1 & \text{if identified}\\0 & \text{otherwise}\end{cases}$ |

**Scenarios**: 3 encryption programs adapted from real production code, obfuscated via `javascript-obfuscator`:

| # | Algorithm | Difficulty | Adaptation Source | Obfuscation Techniques |
|---|-----------|------------|-------------------|----------------------|
| A | MD5 Request Signing | Medium | sina_ads.js + suning_da.js | stringArray(base64) + controlFlowFlattening(0.3) + deadCode(0.1) |
| B | AES-128-CBC Encryption | Hard | weibo_fp.js `We()` function | + selfDefending + deadCode(0.2) + flattening(0.5) |
| C | RC4 + HMAC-SHA256 | Extreme | tmall_security.js | + RC4 stringArray + debugProtection + flattening(0.75) |

---

## 3. Per-Scenario Results

### Scenario A — MD5 Request Signing (Medium)

**Adapted from**: sina_ads.js Signature alert + suning_da.js Eval/Signature patterns.
**Task**: Find salt `x7k9m_2025`, separator `|`, and reproduce MD5 signature.

![radar-A](imgs/radar-A.svg)

| Dimension | Weight | deob | raw |
|-----------|--------|------|-----|
| Algorithm | 20% | **1.00** | 0.80 |
| Key | 25% | **1.00** | **1.00** |
| Parameters | 20% | **1.00** | **1.00** |
| PseudoCode | 10% | **1.00** | 0.80 |
| Result | 10% | **1.00** | **0.00** |
| Token | 5% | 0.46 | 0.54 |
| Time | 5% | 0.38 | 0.62 |
| EntryPoint | 5% | **1.00** | **1.00** |
| **Total** | | **94%** | 80% |

> **deob +14%**. Raw agent correctly identified MD5 and found the salt, but computed the **wrong signature** (`e6bffa...` vs expected `f35292...`). The deob agent read the extracted MD5 implementation and produced the correct output. This shows deob's value when algorithm reproduction precision matters.

**Agent metadata**:

| Agent | Time | Tokens | Files Read |
|-------|------|--------|------------|
| deob | 1,143s | 75,410 | 0-prompt + main.js (70.2% of original) |
| raw | 716s | 65,174 | obfuscated.js (single line, 45KB) |

---

### Scenario B — AES-128-CBC Encryption (Hard)

**Adapted from**: weibo_fp.js `We()` function (line 924-949), AES-CBC encryption with hardcoded key.
**Task**: Extract key `2b7e151628aed2a6abf7158809cf4f3c`, understand IV+ciphertext format, decrypt test payload.

![radar-B](imgs/radar-B.svg)

| Dimension | Weight | deob | raw |
|-----------|--------|------|-----|
| Algorithm | 20% | 0.90 | 0.90 |
| Key | 25% | 0.80 | **1.00** |
| Parameters | 20% | 0.80 | **1.00** |
| PseudoCode | 10% | 0.90 | 0.90 |
| Result | 10% | **1.00** | **1.00** |
| Token | 5% | 0.38 | 0.62 |
| Time | 5% | 0.18 | 0.82 |
| EntryPoint | 5% | **1.00** | **1.00** |
| **Total** | | 81% | **94%** |

> **raw +13%**. Both agents correctly decrypted the payload. The raw agent was faster (141s vs 658s) and more token-efficient because the obfuscated code is compact (26KB single line). The deob output (95.5% expansion, 13 functions) caused the agent to spend more time navigating structure when the core algorithm was simple XOR-CBC. Both agents correctly identified this is NOT real AES but a simplified XOR-based block cipher.

**Agent metadata**:

| Agent | Time | Tokens | Files Read |
|-------|------|--------|------------|
| deob | 658s | 58,884 | 0-prompt + main.js (95.5% of original) |
| raw | 141s | 36,033 | obfuscated.js (single line, 26KB) |

---

### Scenario C — RC4 + HMAC-SHA256 (Extreme)

**Adapted from**: tmall_security.js `a0_0x3411` RC4 string table + `_S_l1_04_if_2` integrity check.
**Task**: Decode 20 RC4-encrypted strings, find HMAC key `integrity_key_2025`, compute test HMAC.

![radar-C](imgs/radar-C.svg)

| Dimension | Weight | deob | raw |
|-----------|--------|------|-----|
| Algorithm | 20% | **1.00** | 0.90 |
| Key | 25% | **1.00** | **1.00** |
| Parameters | 20% | **1.00** | **1.00** |
| PseudoCode | 10% | **1.00** | 0.90 |
| Result | 10% | **1.00** | **1.00** |
| Token | 5% | 0.41 | 0.59 |
| Time | 5% | 0.35 | 0.65 |
| EntryPoint | 5% | **1.00** | **1.00** |
| **Total** | | **94%** | 93% |

> **deob +1% — essentially tied**. Both agents decoded all 20 RC4 strings correctly and computed the matching HMAC. The deob agent produced more complete pseudo-code. Both correctly identified the hash as a custom 32-bit function (not real SHA-256 despite the "sha256" label in decoded strings). At extreme difficulty, deob's structural clarity compensates for its larger output size.

**Agent metadata**:

| Agent | Time | Tokens | Files Read |
|-------|------|--------|------------|
| deob | 488s | 76,336 | 0-prompt + main.js (90.1% of original) |
| raw | 260s | 52,450 | obfuscated.js (single line, 40KB, RC4+debugProtection) |

---

## 4. Aggregate Analysis

### Dimension Performance

| Dimension | deob Avg | raw Avg | Delta |
|-----------|----------|---------|-------|
| Algorithm | 0.97 | 0.87 | **+0.10** |
| Key | 0.93 | 1.00 | -0.07 |
| Parameters | 0.93 | 1.00 | -0.07 |
| PseudoCode | 0.97 | 0.87 | **+0.10** |
| Result | **1.00** | 0.67 | **+0.33** |
| Token | 0.42 | 0.58 | -0.16 |
| Time | 0.30 | 0.70 | -0.40 |
| EntryPoint | 1.00 | 1.00 | 0.00 |

### Time/Token Efficiency

| Scenario | deob Time | raw Time | deob Tokens | raw Tokens |
|----------|-----------|----------|-------------|------------|
| A | 1,143s | 716s | 75,410 | 65,174 |
| B | 658s | 141s | 58,884 | 36,033 |
| C | 488s | 260s | 76,336 | 52,450 |

Raw agents are consistently faster (avg 2.1x) and use fewer tokens (avg 1.5x). Deob's expanded output incurs a reading cost that the structural benefits must overcome.

---

## 5. Key Findings

### 5.1 When deob wins

- **Exact algorithm reproduction** (Scenario A): Raw agents may understand the algorithm conceptually but fail to reproduce exact output. Deob extracts the complete algorithm implementation.
- **Complex nested logic** (Scenario C): When code contains multiple interacting systems (RC4 decoder + HMAC verifier), deob's function extraction helps navigation.

### 5.2 When raw wins

- **Simple algorithms in noise** (Scenario B): When the core algorithm is simple (XOR-CBC = 3 lines of logic), deob's structural overhead outweighs its benefits.
- **Compact single-line code**: Reading 26KB directly is faster than navigating 13 extracted functions with metadata banners.

### 5.3 The output size trade-off

| Scenario | Obfuscated Size | Deob Output | Expansion | deob Win? |
|----------|----------------|-------------|-----------|-----------|
| A | 45KB | 31KB (70%) | **-30%** | Yes (+14%) |
| B | 26KB | 25KB (96%) | -4% | No (-13%) |
| C | 40KB | 36KB (90%) | -10% | Tie (+1%) |

Deob won most when output was smallest relative to input. Higher expansion correlates with lower deob advantage.

---

## 6. Limitations

1. **Small sample size** (3 scenarios): Statistical significance is limited. More scenarios would strengthen conclusions.
2. **Single obfuscator**: All scenarios used `javascript-obfuscator`. Results may differ for other obfuscation tools.
3. **Custom encryption implementations**: Scenarios B and C use simplified algorithms (XOR-CBC, custom hash). Real-world code uses Web Crypto API which deob cannot currently decode.
4. **String decoder not utilized**: All scenarios had detected string decoders that were NOT evaluated by deob. If string decoding were implemented (RC4/base64 evaluation), deob's advantage would likely increase.
5. **Agent variability**: Each scenario used a single agent run. Multiple runs would reduce noise.

---

## 7. Conclusions

1. **Deob is most valuable when algorithm precision matters.** In Scenario A, deob enabled the correct MD5 signature while raw failed entirely (Result dimension: 1.00 vs 0.00).

2. **Deob's structural overhead is real.** Deob agents used 1.5x more tokens and 2.1x more time on average. This cost must be weighed against accuracy gains.

3. **At extreme difficulty, deob and raw converge.** Scenario C showed both approaches achieving near-identical results (94% vs 93%), suggesting that for sufficiently complex code, the obfuscation itself is the bottleneck, not the analysis approach.

4. **The output size sweet spot matters.** Deob performed best when output was 70% of input (Scenario A) and worst at 96% (Scenario B). Future work could target the remaining ~26% gap — further reducing expansion in webpack/bundler-style code.

5. **String decoder evaluation is the next frontier.** All scenarios had detected-but-not-evaluated string decoders. Implementing RC4/base64 string decoding would directly improve deob's utility for encryption analysis.
