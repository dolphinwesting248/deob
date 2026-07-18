// sender.js — Network chunk: 4 transport modules
// Module IDs: 0=transport-xhr, 1=transport-beacon, 2=retry-queue,
//             3=payload-builder (HMAC signing: key=tracker_prod_2025_v2)
(function () {
  "use strict";
  var r = globalThis.__webpack_register__;
  if (!r) throw new Error("runtime.js must load first");

  function getMD5() { return globalThis.__webpack_get_module__("1"); }
  function getBase64() { return globalThis.__webpack_get_module__("3"); }

  r({
    // ---- Module 0: Transport XHR ----
    "30": function (module, exports, __webpack_require__) {
      var ENDPOINT = "https://track.example.com/api/v3/batch";
      var TIMEOUT = 10000;

      function send(payload) {
        return new Promise(function (resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", ENDPOINT, true);
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.timeout = TIMEOUT;

          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ status: xhr.status, body: xhr.responseText });
            } else {
              reject(new Error("HTTP " + xhr.status));
            }
          };
          xhr.onerror = function () { reject(new Error("Network error")); };
          xhr.ontimeout = function () { reject(new Error("Timeout")); };

          xhr.send(JSON.stringify(payload));
        });
      }

      module.exports = { send: send, endpoint: ENDPOINT };
    },

    // ---- Module 1: Transport Beacon ----
    "31": function (module, exports, __webpack_require__) {
      var ENDPOINT = "https://track.example.com/api/v3/batch";

      function sendBeacon(payload) {
        var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        return navigator.sendBeacon(ENDPOINT, blob);
      }

      module.exports = { sendBeacon: sendBeacon, endpoint: ENDPOINT };
    },

    // ---- Module 2: Retry Queue ----
    "32": function (module, exports, __webpack_require__) {
      var MAX_RETRIES = 5;
      var BASE_DELAY = 1000;
      var queue = [];

      function enqueue(payload, transportFn) {
        return new Promise(function (resolve, reject) {
          queue.push({
            payload: payload,
            transportFn: transportFn,
            attempts: 0,
            resolve: resolve,
            reject: reject,
            nextRetry: Date.now()
          });
          globalThis.__RETRY_QUEUE__ = queue;
          processQueue();
        });
      }

      function processQueue() {
        if (queue.length === 0) return;

        var item = queue.shift();
        if (Date.now() < item.nextRetry) {
          queue.unshift(item);
          return;
        }

        item.attempts++;
        item.transportFn(item.payload).then(item.resolve, function (err) {
          if (item.attempts < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            item.nextRetry = Date.now() + BASE_DELAY * Math.pow(2, item.attempts - 1);
            queue.unshift(item);
          } else {
            item.reject(new Error("Max retries exceeded: " + err.message));
          }
        });
      }

      // Process queue periodically
      setInterval(processQueue, 1000);

      module.exports = { enqueue: enqueue, getQueue: function () { return queue; } };
    },

    // ---- Module 3: Payload Builder (with HMAC signing) ----
    "33": function (module, exports, __webpack_require__) {
      var md5 = getMD5();
      var base64 = getBase64();
      var HMAC_KEY = "tracker_prod_2025_v2";

      function hmacSign(message, key) {
        // Simplified HMAC for benchmark — agent must understand this
        function hash(data) {
          var h = 0x67452301;
          for (var i = 0; i < data.length; i++) {
            h = ((h << 5) - h + data.charCodeAt(i)) | 0;
            h ^= 0x5c;
          }
          return h;
        }

        var blockSize = 64;
        var ipad = 0x36, opad = 0x5c;
        var k = key;

        if (k.length > blockSize) k = String(hash(k));
        while (k.length < blockSize) k += String.fromCharCode(0);

        var ik = "", ok = "";
        for (var i = 0; i < blockSize; i++) {
          ik += String.fromCharCode(k.charCodeAt(i) ^ ipad);
          ok += String.fromCharCode(k.charCodeAt(i) ^ opad);
        }

        var inner = hash(ik + message);
        return (hash(ok + String(inner)) >>> 0).toString(16);
      }

      function buildPayload(batches, dimensions) {
        var timestamp = Date.now();

        var body = {
          version: "3.0.0",
          client_ts: timestamp,
          dimensions: dimensions || {},
          batches: batches,
          batch_count: batches ? batches.length : 0,
          total_events: batches ? batches.reduce(function (s, b) { return s + (b.count || b.events.length); }, 0) : 0
        };

        var checksum = md5(JSON.stringify(body));
        var signature = hmacSign(JSON.stringify(body), HMAC_KEY);

        return {
          payload: base64.encode(JSON.stringify(body)),
          checksum: checksum,
          signature: signature,
          timestamp: timestamp
        };
      }

      module.exports = { buildPayload: buildPayload, HMAC_KEY: HMAC_KEY };
    }
  });
})();
