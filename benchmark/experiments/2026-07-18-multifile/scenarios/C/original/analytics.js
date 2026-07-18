// analytics.js — Analytics chunk: 5 event processing modules
// Module IDs: 0=event-aggregator, 1=sampling-engine, 2=batch-builder,
//             3=dimension-builder, 4=throttle-controller
(function () {
  "use strict";
  var r = globalThis.__webpack_register__;
  if (!r) throw new Error("runtime.js must load first");

  function getEventEmitter() { return globalThis.__webpack_get_module__("0"); }
  function getMD5() { return globalThis.__webpack_get_module__("1"); }
  function getValidator() { return globalThis.__webpack_get_module__("2"); }

  r({
    // ---- Module 0: Event Aggregator ----
    "20": function (module, exports, __webpack_require__) {
      var EventEmitter = getEventEmitter();
      var validator = getValidator();
      var MAX_EVENTS = 100;

      function EventAggregator() {
        EventEmitter.call(this);
        this._eventCache = [];
        this._seenIds = {};
      }

      EventAggregator.prototype = Object.create(EventEmitter.prototype);
      EventAggregator.prototype.constructor = EventAggregator;

      EventAggregator.prototype.push = function (eventType, data) {
        var dedupKey = eventType + "_" + (data.timestamp || Date.now());
        if (this._seenIds[dedupKey]) return;
        this._seenIds[dedupKey] = true;

        if (this._eventCache.length >= MAX_EVENTS) {
          this._eventCache.shift();
        }

        var event = {
          type: eventType,
          data: data,
          id: dedupKey,
          ingestedAt: Date.now()
        };
        this._eventCache.push(event);
        this.emit("event_ingested", event);

        // Forward to batch builder when we have enough
        if (this._eventCache.length >= 10) {
          this.emit("batch_ready", this._eventCache.splice(0));
        }
      };

      module.exports = new EventAggregator();
    },

    // ---- Module 1: Sampling Engine ----
    "21": function (module, exports, __webpack_require__) {
      var config = globalThis.__TRACKER_CONFIG__;
      var DEFAULT_RATE = 0.1; // 10% sampling

      function shouldSample(userId) {
        var rate = config ? config.samplingRate : DEFAULT_RATE;

        // Check whitelist/blacklist via config
        if (config && config.whitelistUsers) {
          if (config.whitelistUsers.indexOf(userId) >= 0) return true;
        }
        if (config && config.blacklistUsers) {
          if (config.blacklistUsers.indexOf(userId) >= 0) return false;
        }

        // Deterministic sampling based on user ID hash
        var hash = 0;
        var id = String(userId || "unknown");
        for (var i = 0; i < id.length; i++) {
          hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
        }
        return (Math.abs(hash) % 10000) / 10000 < rate;
      }

      module.exports = { shouldSample: shouldSample, getRate: function () { return config ? config.samplingRate : DEFAULT_RATE; } };
    },

    // ---- Module 2: Batch Builder ----
    "22": function (module, exports, __webpack_require__) {
      var md5 = getMD5();
      var MAX_BATCH = 50;
      var batches = [];
      var currentBatch = [];

      function addToBatch(event) {
        currentBatch.push(event);

        if (currentBatch.length >= MAX_BATCH) {
          flushBatch();
        }
      }

      function flushBatch() {
        if (currentBatch.length === 0) return null;

        var batch = currentBatch.splice(0);
        var payload = JSON.stringify(batch);

        // Create batch ID via MD5
        var batchId = md5(payload + Date.now());

        var batchObj = {
          id: batchId,
          events: batch,
          count: batch.length,
          createdAt: Date.now()
        };

        batches.push(batchObj);

        // Store in global queue for sender
        if (!globalThis.__BATCH_QUEUE__) {
          globalThis.__BATCH_QUEUE__ = [];
        }
        globalThis.__BATCH_QUEUE__.push(batchObj);

        return batchObj;
      }

      // Auto-flush every 5 seconds
      setInterval(flushBatch, 5000);

      module.exports = {
        addToBatch: addToBatch,
        flushBatch: flushBatch,
        getBatches: function () { return batches; },
        getQueue: function () { return globalThis.__BATCH_QUEUE__ || []; }
      };
    },

    // ---- Module 3: Dimension Builder ----
    "23": function (module, exports, __webpack_require__) {
      function buildDimensions(event, sessionMeta) {
        return {
          uid: sessionMeta.userId || "anonymous",
          sid: sessionMeta.sessionId || "",
          page_url: sessionMeta.url || "",
          page_title: sessionMeta.title || "",
          device_type: getDeviceType(),
          client_ts: event.ingestedAt || Date.now(),
          event_type: event.type,
          app_version: "3.0.0"
        };
      }

      function getDeviceType() {
        var ua = navigator.userAgent;
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) return "mobile";
        if (/Tablet|iPad/i.test(ua)) return "tablet";
        return "desktop";
      }

      module.exports = { buildDimensions: buildDimensions };
    },

    // ---- Module 4: Throttle Controller (Token Bucket) ----
    "24": function (module, exports, __webpack_require__) {
      var MAX_TOKENS = 30;
      var REFILL_RATE = 3; // tokens per second
      var tokens = MAX_TOKENS;
      var lastRefill = Date.now();

      function refillTokens() {
        var now = Date.now();
        var elapsed = (now - lastRefill) / 1000;
        tokens = Math.min(MAX_TOKENS, tokens + elapsed * REFILL_RATE);
        lastRefill = now;
      }

      function tryConsume() {
        refillTokens();
        if (tokens >= 1) {
          tokens -= 1;
          return true;
        }
        return false;
      }

      function getTokens() {
        refillTokens();
        return tokens;
      }

      module.exports = { tryConsume: tryConsume, getTokens: getTokens, maxTokens: MAX_TOKENS };
    }
  });
})();
