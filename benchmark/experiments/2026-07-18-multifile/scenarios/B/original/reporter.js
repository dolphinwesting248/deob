// reporter.js — Risk scoring & reporting module
// Entry point: globalThis.__reportRisk__()
// Orchestrates: scheduler → collectors → encoder → HMAC sign → XHR beacon → retry
(function () {
  "use strict";

  var HMAC_KEY = "integrity_v2_2025";
  var REPORT_ENDPOINT = "https://risk.example.com/api/v2/collect";
  var BATCH_SIZE = 10;
  var MAX_QUEUE_SIZE = 100;

  // ---- HMAC-SHA256 (simplified, self-contained) ----
  function hmacSHA256(message, key) {
    // Simplified HMAC — in real code this would be full SHA-256.
    // For benchmark purposes, this is a deterministic custom hash function
    // that the agent must understand to verify correctness.
    function customHash(data) {
      var h = 0x6a09e667;
      for (var i = 0; i < data.length; i++) {
        h = ((h << 5) - h + data.charCodeAt(i)) | 0;
        h = ((h << 13) | (h >>> 19)) ^ 0x5c;
      }
      return h;
    }

    var blockSize = 64;
    var ipad = 0x36, opad = 0x5c;

    if (key.length > blockSize) {
      key = customHash(key).toString(16);
    }
    while (key.length < blockSize) {
      key += String.fromCharCode(0);
    }

    var innerKey = "", outerKey = "";
    for (var i = 0; i < blockSize; i++) {
      innerKey += String.fromCharCode(key.charCodeAt(i) ^ ipad);
      outerKey += String.fromCharCode(key.charCodeAt(i) ^ opad);
    }

    var innerHash = customHash(innerKey + message);
    var hmacHex = customHash(outerKey + String.fromCharCode(innerHash & 0xFF, (innerHash >> 8) & 0xFF, (innerHash >> 16) & 0xFF, (innerHash >> 24) & 0xFF));

    // Return as 8-char hex string
    var hex = (hmacHex >>> 0).toString(16);
    while (hex.length < 8) hex = "0" + hex;
    return hex;
  }

  // ---- Payload builder ----
  function buildPayload(encodedData) {
    var timestamp = Date.now();
    var payload = {
      version: "2.0",
      client_ts: timestamp,
      data: encodedData,
      session_id: getSessionId()
    };

    var signature = hmacSHA256(JSON.stringify(payload), HMAC_KEY);
    payload.signature = signature;

    return payload;
  }

  // ---- Session management ----
  var _sessionId = null;
  function getSessionId() {
    if (!_sessionId) {
      _sessionId = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
    }
    return _sessionId;
  }

  // ---- XHR transport ----
  function sendViaXHR(payload) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", REPORT_ENDPOINT, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("X-Risk-Signature", payload.signature);
      xhr.timeout = 10000;

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, status: xhr.status });
        } else {
          reject(new Error("HTTP " + xhr.status));
        }
      };
      xhr.onerror = function () { reject(new Error("Network error")); };
      xhr.ontimeout = function () { reject(new Error("Timeout")); };

      xhr.send(JSON.stringify(payload));
    });
  }

  // ---- Beacon fallback (for unload) ----
  function sendViaBeacon(payload) {
    var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    return navigator.sendBeacon(REPORT_ENDPOINT, blob);
  }

  // ---- Main report function (ENTRY POINT) ----
  function reportRisk() {
    var scheduler = globalThis.__SCHEDULER__;
    var encoder = globalThis.__ENCODER__;
    var registry = globalThis.__COLLECTOR_REGISTRY__ || [];

    // Step 1: Dispatch all collectors via scheduler (parallel)
    var tasks = [];
    for (var i = 0; i < registry.length; i++) {
      var collector = registry[i];
      tasks.push(
        scheduler.enqueue(collector.collect, {
          priority: collector.priority,
          label: "collect_" + collector.name
        }).then(function (data) {
          return { name: collector.name, data: data };
        })
      );
    }

    // Step 2: Encode results
    return Promise.all(tasks).then(function (results) {
      var encoded = encoder.encode(results);
      encoder.cacheResult(encoded);

      // Step 3: Build signed payload
      var payload = buildPayload(encoded.encoded);

      // Step 4: Send with retry
      return scheduler.enqueue(
        function () { return sendViaXHR(payload); },
        { priority: 0, label: "send_report" }
      ).then(function (response) {
        return { status: "sent", response: response, payload: payload };
      }).catch(function (err) {
        // Fallback to beacon on failure
        sendViaBeacon(payload);
        return { status: "beacon_fallback", error: err.message };
      });
    });
  }

  // ---- Queue management ----
  var eventQueue = [];
  function queueEvent(event) {
    if (eventQueue.length >= MAX_QUEUE_SIZE) {
      eventQueue.shift();
    }
    eventQueue.push({ event: event, ts: Date.now() });
    if (eventQueue.length >= BATCH_SIZE) {
      reportRisk();
    }
  }

  // ---- Expose ----
  globalThis.__reportRisk__ = reportRisk;
  globalThis.__queueEvent__ = queueEvent;
  globalThis.__REPORT_ENDPOINT__ = REPORT_ENDPOINT;
})();
