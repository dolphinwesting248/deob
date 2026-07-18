// encoder.js — Fingerprint encoding module
// Serializes fingerprint data: JSON → field filtering → base64 → XOR obfuscation.
// XOR key: 0xA3
(function () {
  "use strict";

  var XOR_KEY = 0xA3;
  var SKIP_FIELDS = { collectedAt: true, collector: true, error: true };

  function filterFields(obj) {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== "object") return obj;

    var result = {};
    for (var key in obj) {
      if (SKIP_FIELDS[key]) continue;
      if (obj[key] === null || obj[key] === undefined) continue;
      var val = obj[key];
      if (typeof val === "object" && !Array.isArray(val)) {
        val = filterFields(val);
      }
      result[key] = val;
    }
    return result;
  }

  function xorEncode(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ XOR_KEY);
    }
    return result;
  }

  function encode(results) {
    // results is array of { name, data } from each collector
    var filtered = {};
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      filtered[r.name] = filterFields(r.data);
    }

    var jsonStr = JSON.stringify(filtered);

    // Note: in production, we'd use btoa here, but for the analysis task
    // the XOR step adds an extra layer agents must understand
    var base64 = globalThis.btoa(jsonStr);

    // XOR the base64 output
    var encoded = xorEncode(base64);

    return {
      raw: filtered,
      base64: base64,
      encoded: encoded,
      encodingVersion: 2,
      xorKey: "0xA3"
    };
  }

  function getCache() {
    if (!globalThis.__FINGERPRINT_CACHE__) {
      globalThis.__FINGERPRINT_CACHE__ = {
        lastResult: null,
        lastEncoded: null,
        updatedAt: 0
      };
    }
    return globalThis.__FINGERPRINT_CACHE__;
  }

  function cacheResult(result) {
    var cache = getCache();
    cache.lastResult = result.raw;
    cache.lastEncoded = result.encoded;
    cache.updatedAt = Date.now();
  }

  globalThis.__ENCODER__ = {
    encode: encode,
    cacheResult: cacheResult,
    getCache: getCache
  };
})();
