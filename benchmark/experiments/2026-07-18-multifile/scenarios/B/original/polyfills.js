// polyfills.js — ES6 compatibility shims
// Provides Promise, Array.from, Object.assign, atob/btoa for older browsers.
// Only atob is actually used by the business logic (reporter.js for base64 decode).
// The rest are noise that the agent must distinguish from real dependencies.
(function () {
  "use strict";

  // ---- Promise polyfill (noise — not used by business logic) ----
  if (typeof Promise === "undefined") {
    function Promise(executor) {
      var self = this;
      self.status = "pending";
      self.value = undefined;
      self.onFulfilledCallbacks = [];
      self.onRejectedCallbacks = [];

      function resolve(value) {
        if (self.status === "pending") {
          self.status = "fulfilled";
          self.value = value;
          for (var i = 0; i < self.onFulfilledCallbacks.length; i++) {
            self.onFulfilledCallbacks[i](value);
          }
        }
      }
      function reject(reason) {
        if (self.status === "pending") {
          self.status = "rejected";
          self.value = reason;
          for (var i = 0; i < self.onRejectedCallbacks.length; i++) {
            self.onRejectedCallbacks[i](reason);
          }
        }
      }
      try { executor(resolve, reject); } catch (e) { reject(e); }
    }
    Promise.prototype.then = function (onFulfilled, onRejected) {
      var self = this;
      return new Promise(function (resolve, reject) {
        function handle() {
          var cb = self.status === "fulfilled" ? onFulfilled : onRejected;
          if (!cb) {
            (self.status === "fulfilled" ? resolve : reject)(self.value);
            return;
          }
          try { resolve(cb(self.value)); } catch (e) { reject(e); }
        }
        if (self.status === "pending") {
          self.onFulfilledCallbacks.push(handle);
          self.onRejectedCallbacks.push(handle);
        } else {
          setTimeout(handle, 0);
        }
      });
    };
    Promise.prototype.catch = function (onRejected) { return this.then(null, onRejected); };
    Promise.resolve = function (value) {
      return new Promise(function (resolve) { resolve(value); });
    };
    Promise.reject = function (reason) {
      return new Promise(function (_, reject) { reject(reason); });
    };
    Promise.all = function (promises) {
      return new Promise(function (resolve, reject) {
        var results = [], count = 0, total = promises.length;
        if (total === 0) { resolve(results); return; }
        for (var i = 0; i < total; i++) {
          (function (idx) {
            promises[idx].then(function (v) {
              results[idx] = v; count++;
              if (count === total) resolve(results);
            }, reject);
          })(i);
        }
      });
    };
    globalThis.Promise = Promise;
  }

  // ---- Array.from polyfill (noise) ----
  if (!Array.from) {
    Array.from = function (arrayLike, mapFn, thisArg) {
      var arr = [];
      if (arrayLike == null) throw new TypeError("Array.from requires an array-like object");
      var len = arrayLike.length >>> 0;
      var fn = typeof mapFn === "function" ? mapFn : null;
      for (var i = 0; i < len; i++) {
        var val = arrayLike[i];
        arr.push(fn ? fn.call(thisArg, val, i) : val);
      }
      return arr;
    };
  }

  // ---- Object.assign polyfill (noise) ----
  if (!Object.assign) {
    Object.assign = function (target) {
      if (target == null) throw new TypeError("Cannot convert undefined or null to object");
      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        if (source != null) {
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              to[key] = source[key];
            }
          }
        }
      }
      return to;
    };
  }

  // ---- atob polyfill (USED by reporter.js for base64 decode) ----
  if (typeof atob === "undefined") {
    globalThis.atob = function (str) {
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var output = "";
      var i = 0;
      str = String(str).replace(/[^A-Za-z0-9\+\/\=]/g, "");
      while (i < str.length) {
        var enc1 = chars.indexOf(str.charAt(i++));
        var enc2 = chars.indexOf(str.charAt(i++));
        var enc3 = chars.indexOf(str.charAt(i++));
        var enc4 = chars.indexOf(str.charAt(i++));
        var chr1 = (enc1 << 2) | (enc2 >> 4);
        var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        var chr3 = ((enc3 & 3) << 6) | enc4;
        output += String.fromCharCode(chr1);
        if (enc3 !== 64) output += String.fromCharCode(chr2);
        if (enc4 !== 64) output += String.fromCharCode(chr3);
      }
      return output;
    };
  }

  // ---- btoa polyfill (noise) ----
  if (typeof btoa === "undefined") {
    globalThis.btoa = function (str) {
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var output = "";
      var i = 0;
      str = String(str);
      while (i < str.length) {
        var chr1 = str.charCodeAt(i++);
        var chr2 = str.charCodeAt(i++);
        var chr3 = str.charCodeAt(i++);
        var enc1 = chr1 >> 2;
        var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        var enc4 = chr3 & 63;
        if (isNaN(chr2)) enc3 = enc4 = 64;
        if (isNaN(chr3)) enc4 = 64;
        output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
      }
      return output;
    };
  }

  globalThis.__POLYFILLS_READY__ = true;
})();
