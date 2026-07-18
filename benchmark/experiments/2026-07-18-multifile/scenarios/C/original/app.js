// app.js — App chunk: 9 tracker modules using the event bus
// Module IDs: 0=tracker-init, 1=page-view, 2=click-heatmap, 3=scroll-depth,
//             4=form-watcher, 5=cart-tracker, 6=session-manager,
//             7=error-catcher, 8=user-identity
(function () {
  "use strict";
  var r = globalThis.__webpack_register__;
  if (!r) throw new Error("runtime.js must load first");

  // Cross-chunk module references (from vendors chunk)
  function getEventEmitter() { return globalThis.__webpack_get_module__("0"); }
  function getValidator() { return globalThis.__webpack_get_module__("2"); }
  function getDebounce() { return globalThis.__webpack_get_module__("4"); }
  function getThrottle() { return globalThis.__webpack_get_module__("4"); }
  function getCookie() { return globalThis.__webpack_get_module__("5"); }

  r({
    // ---- Module 0: Tracker Init (ENTRY POINT) ----
    "10": function (module, exports, __webpack_require__) {
      var EventEmitter = getEventEmitter();
      var eventBus = new EventEmitter();
      eventBus.setMaxListeners = function (n) { this._maxListeners = n; };
      eventBus.setMaxListeners(100);

      globalThis.__TRACKER_EVENT_BUS__ = eventBus;
      globalThis.__TRACKER_CONFIG__ = {
        appId: "tracker_demo_v3",
        samplingRate: 0.1,
        endpoint: "https://track.example.com/api/v3/batch",
        debug: false,
        maxBatchSize: 50,
        flushInterval: 5000,
        enabledTrackers: ["page_view", "click", "scroll", "form", "cart", "error", "session"]
      };

      // Mark tracker as ready
      globalThis.__TRACKER_READY__ = true;
      module.exports = { eventBus: eventBus, config: globalThis.__TRACKER_CONFIG__ };
    },

    // ---- Module 1: Page View Tracker ----
    "11": function (module, exports, __webpack_require__) {
      var bus = globalThis.__TRACKER_EVENT_BUS__;
      var prevUrl = "";

      function trackPageView() {
        var data = {
          url: location.href,
          referrer: document.referrer,
          title: document.title,
          loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : -1,
          timestamp: Date.now()
        };
        bus.emit("page_view", data);
        prevUrl = location.href;
      }

      trackPageView();

      // SPA navigation detection
      var historyPush = history.pushState;
      history.pushState = function () {
        historyPush.apply(history, arguments);
        setTimeout(trackPageView, 100);
      };

      // Visibility change
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible" && location.href !== prevUrl) {
          trackPageView();
        }
      });

      module.exports = { trackPageView: trackPageView };
    },

    // ---- Module 2: Click Heatmap Tracker ----
    "12": function (module, exports, __webpack_require__) {
      var bus = globalThis.__TRACKER_EVENT_BUS__;
      var throttle = getThrottle().throttle;

      function getXPath(el) {
        if (el.id) return '//*[@id="' + el.id + '"]';
        var parts = [];
        while (el && el.nodeType === 1) {
          var idx = 1, sib = el.previousSibling;
          while (sib) { if (sib.nodeType === 1 && sib.nodeName === el.nodeName) idx++; sib = sib.previousSibling; }
          parts.unshift(el.nodeName.toLowerCase() + (idx > 1 ? "[" + idx + "]" : ""));
          el = el.parentNode;
        }
        return "/" + parts.join("/");
      }

      function handleClick(e) {
        var data = {
          x: e.clientX,
          y: e.clientY,
          offsetX: e.offsetX,
          offsetY: e.offsetY,
          target: e.target.tagName,
          xpath: getXPath(e.target),
          text: (e.target.innerText || "").substring(0, 100),
          timestamp: Date.now()
        };
        bus.emit("click", data);
      }

      document.addEventListener("click", throttle(handleClick, 500));
      module.exports = {};
    },

    // ---- Module 3: Scroll Depth Tracker ----
    "13": function (module, exports, __webpack_require__) {
      var bus = globalThis.__TRACKER_EVENT_BUS__;
      var throttle = getThrottle().throttle;
      var milestones = { 25: false, 50: false, 75: false, 100: false };

      function getScrollDepth() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (docHeight <= 0) return 0;
        return Math.round((scrollTop / docHeight) * 100);
      }

      function checkScroll() {
        var depth = getScrollDepth();
        for (var m in milestones) {
          if (depth >= parseInt(m) && !milestones[m]) {
            milestones[m] = true;
            bus.emit("scroll", { depth: parseInt(m), timestamp: Date.now() });
          }
        }
      }

      window.addEventListener("scroll", throttle(checkScroll, 200));
      module.exports = {};
    },

    // ---- Module 4: Form Watcher ----
    "14": function (module, exports, __webpack_require__) {
      var bus = globalThis.__TRACKER_EVENT_BUS__;
      var formTimers = {};

      function getFormId(form) {
        return form.id || form.name || form.action || "unknown_form";
      }

      document.addEventListener("focusin", function (e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
          var form = e.target.form;
          if (form) {
            var fid = getFormId(form);
            if (!formTimers[fid]) {
              formTimers[fid] = { startTime: Date.now(), fields: {} };
            }
            formTimers[fid].fields[e.target.name || "unnamed"] = Date.now();
          }
        }
      }, true);

      document.addEventListener("focusout", function (e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
          var form = e.target.form;
          if (form && e.target.name) {
            var fid = getFormId(form);
            var timer = formTimers[fid];
            if (timer && timer.fields[e.target.name]) {
              var duration = Date.now() - timer.fields[e.target.name];
              bus.emit("form", {
                formId: fid,
                field: e.target.name,
                duration: duration,
                abandoned: !e.target.value,
                timestamp: Date.now()
              });
            }
          }
        }
      }, true);

      module.exports = {};
    },

    // ---- Module 5: Cart Tracker ----
    "15": function (module, exports, __webpack_require__) {
      var bus = globalThis.__TRACKER_EVENT_BUS__;
      var validator = getValidator();
      var cartState = { items: [], total: 0, updatedAt: 0 };

      function trackCartEvent(action, item, quantity) {
        var event = {
          action: action,       // "add", "remove", "update", "view"
          itemId: item.id || "unknown",
          itemName: item.name || "",
          price: item.price || 0,
          quantity: quantity || 1,
          cartTotal: cartState.total,
          cartSize: cartState.items.length,
          timestamp: Date.now()
        };

        // Update local state
        if (action === "add") {
          cartState.items.push(item);
          cartState.total += (item.price || 0) * (quantity || 1);
        } else if (action === "remove") {
          cartState.total = Math.max(0, cartState.total - (item.price || 0));
        }
        cartState.updatedAt = Date.now();

        bus.emit("cart", event);
      }

      module.exports = { trackCartEvent: trackCartEvent, getCartState: function () { return cartState; } };
    },

    // ---- Module 6: Session Manager ----
    "16": function (module, exports, __webpack_require__) {
      var bus = globalThis.__TRACKER_EVENT_BUS__;
      var sessionId = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
      var startTime = Date.now();
      var lastActivity = startTime;
      var heartbeatInterval = 30000;

      function getSessionDuration() {
        return Date.now() - startTime;
      }

      function updateActivity() {
        lastActivity = Date.now();
      }

      // Heartbeat
      setInterval(function () {
        bus.emit("heartbeat", {
          sessionId: sessionId,
          duration: getSessionDuration(),
          idleTime: Date.now() - lastActivity,
          timestamp: Date.now()
        });
      }, heartbeatInterval);

      // Track activity
      ["click", "scroll", "keydown", "mousemove"].forEach(function (ev) {
        document.addEventListener(ev, updateActivity, { passive: true });
      });

      module.exports = {
        getSessionId: function () { return sessionId; },
        getDuration: getSessionDuration,
        getIdleTime: function () { return Date.now() - lastActivity; }
      };
    },

    // ---- Module 7: Error Catcher ----
    "17": function (module, exports, __webpack_require__) {
      var bus = globalThis.__TRACKER_EVENT_BUS__;

      window.addEventListener("error", function (e) {
        bus.emit("error", {
          type: "runtime",
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          stack: e.error ? e.error.stack : "N/A",
          timestamp: Date.now()
        });
      });

      window.addEventListener("unhandledrejection", function (e) {
        bus.emit("error", {
          type: "promise",
          message: e.reason ? e.reason.message : "Unknown rejection",
          stack: e.reason && e.reason.stack ? e.reason.stack : "N/A",
          timestamp: Date.now()
        });
      });

      module.exports = {};
    },

    // ---- Module 8: User Identity ----
    "18": function (module, exports, __webpack_require__) {
      var cookie = getCookie();
      var USER_ID_COOKIE = "_tracker_uid";

      function getUserId() {
        var uid = cookie.get(USER_ID_COOKIE);
        if (!uid) {
          uid = "uid_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 8);
          cookie.set(USER_ID_COOKIE, uid, 365);
        }
        return uid;
      }

      function getFirstVisit() {
        var ts = cookie.get("_tracker_first_visit");
        if (!ts) {
          ts = String(Date.now());
          cookie.set("_tracker_first_visit", ts, 365);
        }
        return parseInt(ts);
      }

      var userId = getUserId();
      module.exports = {
        getUserId: function () { return userId; },
        getFirstVisit: getFirstVisit
      };
    }
  });
})();
