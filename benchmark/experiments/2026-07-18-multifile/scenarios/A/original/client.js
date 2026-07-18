// client.js — API client entry point
// Orchestrates the full signing pipeline: config → crypto → signer → storage → XHR.
(function () {
  "use strict";

  function getConfig() { return globalThis.__CONFIG__; }
  function getSigner() { return globalThis.__signRequest__; }
  function getStorage() { return globalThis.__STORAGE__; }

  function initSDK() {
    var cfg = getConfig();
    if (!globalThis.__POLYFILLS_READY__) {
      throw new Error("Polyfills not loaded — ensure polyfills.js loads first");
    }
    if (!cfg.FEATURE_ENABLED) {
      throw new Error("SDK feature is disabled");
    }
    globalThis.__sendSignedRequest__ = sendSignedRequest;
    return true;
  }

  function sendSignedRequest(params) {
    var cfg = getConfig();
    var signer = getSigner();
    var storage = getStorage();

    // Step 1: Check cached token
    var cachedToken = storage.getToken("auth_token");
    if (cachedToken) {
      params["_token"] = cachedToken;
    }

    // Step 2: Sign the request
    var signResult = signer.sign(params);

    // Step 3: Build request body
    var body = JSON.stringify({
      params: params,
      signature: signResult.signature,
      timestamp: signResult.timestamp,
      nonce: signResult.nonce,
      version: signResult.version
    });

    // Step 4: Send XHR
    var xhr = new XMLHttpRequest();
    xhr.open("POST", cfg.API_ENDPOINT, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-Signature", signResult.signature);
    xhr.setRequestHeader("X-Timestamp", signResult.timestamp);
    xhr.setRequestHeader("X-Nonce", signResult.nonce);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var resp = JSON.parse(xhr.responseText);
          // Step 5: Cache new token
          if (resp.auth_token) {
            storage.setToken("auth_token", resp.auth_token);
          }
          if (resp.refresh_token) {
            storage.setToken("refresh_token", resp.refresh_token);
          }
          if (resp.token_expiry) {
            storage.setToken("token_expiry", resp.token_expiry.toString());
          }
        }
      }
    };

    xhr.send(body);
    return signResult.signature;
  }

  function getCachedToken() {
    return getStorage().getToken("auth_token");
  }

  function clearSession() {
    getStorage().clearAll();
    delete globalThis.__sendSignedRequest__;
  }

  // Auto-init if polyfills are ready
  if (globalThis.__POLYFILLS_READY__) {
    initSDK();
  }
})();
