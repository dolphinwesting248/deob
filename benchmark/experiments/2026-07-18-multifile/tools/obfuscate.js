#!/usr/bin/env node
// Multi-file independent obfuscation using the Node API (avoids CLI shell escaping issues).
const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const BASE = path.join(__dirname, "..");

const SCENARIOS = {
  A: {
    reservedNames: ["__POLYFILLS_READY__", "__CONFIG__", "__MD5__", "__signRequest__", "__STORAGE__", "__sendSignedRequest__"],
    options: {
      compact: true,
      stringArray: true,
      stringArrayEncoding: ["base64"],
      stringArrayThreshold: 0.5,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.3,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.1,
      selfDefending: false,
      debugProtection: false,
      renameGlobals: false,
      renameProperties: false,
    }
  },
  B: {
    reservedNames: ["__POLYFILLS_READY__", "__SCHEDULER__", "__COLLECTOR_REGISTRY__", "__ENCODER__", "__FINGERPRINT_CACHE__", "__reportRisk__", "__queueEvent__", "__REPORT_ENDPOINT__"],
    options: {
      compact: true,
      stringArray: true,
      stringArrayEncoding: ["base64"],
      stringArrayThreshold: 0.5,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.5,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.2,
      selfDefending: true,
      debugProtection: false,
      renameGlobals: false,
      renameProperties: false,
    }
  },
  C: {
    reservedNames: ["__webpack_require__", "__webpack_register__", "__webpack_chunk_load__", "__webpack_get_module__", "__webpack_public_path__", "__webpack_require__c", "__TRACKER_EVENT_BUS__", "__TRACKER_CONFIG__", "__TRACKER_READY__", "__BATCH_QUEUE__", "__RETRY_QUEUE__", "__WEBPACK_PUBLIC_PATH__"],
    options: {
      compact: true,
      stringArray: true,
      stringArrayEncoding: ["rc4"],
      stringArrayThreshold: 0.5,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.3,
      selfDefending: true,
      debugProtection: true,
      renameGlobals: false,
      renameProperties: false,
    }
  },
};

function collectJsFiles(dir) {
  const files = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(full); }
      else if (entry.name.endsWith(".js")) { files.push(full); }
    }
  }
  walk(dir);
  return files;
}

for (const scenarioId of Object.keys(SCENARIOS)) {
  const sc = SCENARIOS[scenarioId];
  const srcDir = path.join(BASE, "scenarios", scenarioId, "original");
  const outDir = path.join(BASE, "scenarios", scenarioId, "obfuscated");
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const files = collectJsFiles(srcDir);
  console.log(`\n=== Scenario ${scenarioId} (${files.length} files) ===`);

  for (const f of files) {
    const relPath = path.relative(srcDir, f);
    const outFile = path.join(outDir, relPath);
    const outFileDir = path.dirname(outFile);
    if (!fs.existsSync(outFileDir)) fs.mkdirSync(outFileDir, { recursive: true });

    console.log(`  Obfuscating ${relPath}...`);
    try {
      const code = fs.readFileSync(f, "utf-8");
      const opts = {
        ...sc.options,
        reservedNames: (sc.options.reservedNames || []).concat(sc.reservedNames || []),
      };
      const result = JavaScriptObfuscator.obfuscate(code, opts);
      fs.writeFileSync(outFile, result.getObfuscatedCode(), "utf-8");
      const size = fs.statSync(outFile).size;
      console.log(`    -> ${(size / 1024).toFixed(1)} KB`);
    } catch (e) {
      console.error(`    FAILED: ${e.message.split("\n")[0]}`);
    }
  }
}
console.log("\nDone.");
