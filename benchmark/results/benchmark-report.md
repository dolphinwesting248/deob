# deob Benchmark Report

Generated: 2026-07-16

## Obfuscation Levels

| Scenario | Description | Obfuscation Techniques | Obfuscated Size | Deob Size | Ratio |
|----------|-------------|----------------------|-----------------|-----------|-------|
| A (API Client) | easy | renameGlobals, stringArray (base64), rotateStringArray | 4.5 KB | 6.4 KB | 140% |
| B (Auth Flow) | medium | controlFlowFlattening (75%), deadCode (30%), stringArray (rc4), selfDefending, numbersToExpressions, splitStrings | 14.0 KB | 19.0 KB | 135% |
| C (Data Pipeline) | medium | controlFlowFlattening (50%), deadCode (20%), stringArray (base64), debugProtection, splitStrings, transformObjectKeys, numbersToExpressions | 10.3 KB | 14.6 KB | 141% |
| D (Webpack Bundle) | hard | ALL at 100%: stringArray (rc4), selfDefending, deadCode, controlFlowFlattening, debugProtection, numbersToExpressions, splitStrings, transformObjectKeys, unicodeEscape  (webpack bundle) | 42.0 KB | 35.1 KB | 84% |
| E (Payment Processing) | hard | ALL at MAX: renameProperties, stringArray (rc4), selfDefending, deadCode (40%), controlFlowFlattening (75%), debugProtection, numbersToExpressions, splitStrings (3 char), transformObjectKeys, unicodeEscape, disableConsoleOutput | 63.0 KB | 53.8 KB | 85% |

## Deob Output Quality

| Scenario | Main.js Lines | Sub-Fns | Banners | Alerts | Shared Vars | Domain | Entry |
|----------|--------------|---------|---------|--------|-------------|--------|-------|
| A | 144 | 5 | 5 | 3 | 10 | Network | _0x_0x11ac |
| B | 409 | 20 | 20 | 1 | 20 | General JS | _0x_0x18478c |
| C | 310 | 17 | 17 | 0 | 20 | General JS | _0x_0x5d7c |
| D | 595 | 30 | 30 | 0 | 19 | General JS | _0x_0x505e |
| E | 938 | 44 | 44 | 0 | 19 | General JS | _0x_0x4177 |

## Ground Truth Comparison

| Scenario | Difficulty | GT Functions | Deob Functions | Match Rate | Domain Accuracy |
|----------|-----------|--------------|----------------|------------|-----------------|
| A | easy | 6 | 5 | 83% | Network |
| B | medium | 10 | 20 | 200% | General JS |
| C | medium | 5 | 17 | 340% | General JS |
| D | hard | 5 | 30 | 600% | General JS |
| E | hard | 4 | 44 | 1100% | General JS |