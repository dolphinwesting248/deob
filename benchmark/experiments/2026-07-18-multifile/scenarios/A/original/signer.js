// signer.js — Request signing engine
// Constructs sign string from params, nonce, timestamp, salt; produces MD5 signature.
(function () {
  "use strict";

  // Accesses CONFIG and MD5 from globalThis (set by config.js and crypto.js)
  function getConfig() { return globalThis.__CONFIG__; }
  function getMD5() { return globalThis.__MD5__; }

  function buildSignString(params, timestamp, nonce) {
    var cfg = getConfig();
    var keys = Object.keys(params).sort();
    var parts = [];
    for (var i = 0; i < keys.length; i++) {
      parts.push(keys[i] + "=" + params[keys[i]]);
    }
    var paramStr = parts.join("&");

    // Format: params|salt|timestamp|nonce
    return paramStr + cfg.SEPARATOR + cfg.API_SALT + cfg.SEPARATOR + timestamp + cfg.SEPARATOR + nonce;
  }

  function signRequest(params) {
    var md5Lib = getMD5();
    var timestamp = Date.now().toString();
    var nonce = md5Lib.generateNonce(16);
    var raw = buildSignString(params, timestamp, nonce);
    var signature = md5Lib.hash(raw);

    return {
      signature: signature,
      timestamp: timestamp,
      nonce: nonce,
      algorithm: "MD5",
      version: getConfig().API_VERSION
    };
  }

  function verifySignature(params, timestamp, nonce, expectedSignature) {
    var raw = buildSignString(params, timestamp, nonce);
    var computed = getMD5().hash(raw);
    return computed === expectedSignature;
  }

  globalThis.__signRequest__ = {
    sign: signRequest,
    buildSignString: buildSignString,
    verify: verifySignature
  };
})();
