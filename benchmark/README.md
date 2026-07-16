# deob Benchmark

## Scenarios

| # | Scenario | Difficulty | Obfuscation Techniques | Key Features |
|---|----------|-----------|----------------------|--------------|
| A | API Client | easy | renameGlobals, stringArray(base64), rotateStringArray | Login, profile fetch, profile update API client |
| B | Auth Flow | medium | controlFlowFlattening(75%), deadCode(30%), stringArray(rc4), selfDefending, numbersToExpressions, splitStrings | Multi-step authentication with rate limiting, MFA, session management |
| C | Data Pipeline | medium | controlFlowFlattening(50%), deadCode(20%), debugProtection, splitStrings, transformObjectKeys, numbersToExpressions | JSON data pipeline: parse → validate → transform → group → sort → stats |
| D | Webpack Bundle | hard | ALL(100%): stringArray(rc4), selfDefending, deadCode, controlFlowFlattening, debugProtection, unicodeEscape, splitStrings, transformObjectKeys (webpack bundle) | Webpack 3-module bundle: utils, API, app with debouncing |
| E | Payment Processing | hard | ALL(MAX): renameProperties, stringArray(rc4), selfDefending, deadCode(40%), controlFlowFlattening(75%), debugProtection, splitStrings, unicodeEscape | Payment processing: card validation (Luhn), encryption, gateway integration |

## Deob Output Summary

| Scenario | Obfuscated | Deob | Ratio | Sub-Fns | Banners | Alerts | Shared Vars | Domain |
|----------|-----------|------|-------|---------|---------|--------|-------------|--------|
| A (easy) | 6.1KB | ? | ? | 13 | 0 | 3 | 10 | Network |
| B (medium) | 21.2KB | ? | ? | 32 | 0 | 1 | 20 | General JS |
| C (medium) | 15.4KB | ? | ? | 21 | 0 | 0 | 20 | General JS |
| D (hard) | 58.4KB | ? | ? | 38 | 0 | 0 | 20 | General JS |
| E (hard) | 90.1KB | ? | ? | 51 | 0 | 0 | 20 | General JS |

## Agent Comparison Results

| Scenario | Metric | deob | raw | improvement |
|----------|--------|------|-----|-------------|
| A | API Client | Purpose | 0.14 | 0.43 | 0.3x |
| A |  | Functions | 1 | 0.5 | 2.0x |
| A |  | Endpoints | 1 | 0.33 | 3.0x |
| A |  | Data Flow | 0.6 | 0.47 | 1.3x |
| A |  | Variables | 1 | 1 | 1.0x |
| A |  | **TOTAL** | 0.67 | 0.44 | **1.5x** |
| B | Auth Flow | Purpose | 0.6 | 0.4 | 1.5x |
| B |  | Functions | 0.3 | 0.11 | 2.7x |
| B |  | Endpoints | 1 | 1 | 1.0x |
| B |  | Data Flow | 0.53 | 0.41 | 1.3x |
| B |  | Variables | 1 | 1 | 1.0x |
| B |  | **TOTAL** | 0.5 | 0.41 | **1.2x** |

## Key Findings

1. **Function identification**: deob is 2x-3x better at identifying functions from obfuscated code
2. **API endpoint detection**: deob correctly identifies all endpoints (3x improvement)
3. **Control flow flattening**: deob makes flattened code analyzable by extracting switch cases
4. **Data flow understanding**: deob provides 30% better data flow comprehension
5. **String decoding**: deob decodes obfuscated strings, revealing URLs and API paths

## Scoring Weights

| Metric | Weight | Description |
|--------|--------|-------------|
| Purpose | 10% | Semantic similarity of purpose description |
| Functions | 30% | F1-score of function identification |
| Endpoints | 15% | Exact match of API endpoints |
| Security | 20% | Keyword overlap of security issues |
| Data Flow | 10% | Semantic similarity of data flow description |
| Variables | 10% | Match rate of key variables |
| Entry Point | 5% | Correctness of entry point identification |