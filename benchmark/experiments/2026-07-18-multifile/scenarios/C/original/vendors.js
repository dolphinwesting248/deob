// vendors.js — Vendor chunk: 6 shared utility modules
// Module IDs: 0=event-emitter, 1=tiny-md5, 2=data-validator,
//             3=base64-codec, 4=debounce-throttle, 5=cookie-helper
(function () {
  "use strict";
  var r = globalThis.__webpack_register__;
  if (!r) throw new Error("runtime.js must load first");

  r({
    // ---- Module 0: Event Emitter ----
    "0": function (module, exports, __webpack_require__) {
      function EventEmitter() {
        this._events = {};
        this._maxListeners = 50;
      }

      EventEmitter.prototype.on = function (event, fn) {
        if (!this._events[event]) this._events[event] = [];
        if (this._events[event].length >= this._maxListeners) return this;
        this._events[event].push(fn);
        return this;
      };

      EventEmitter.prototype.off = function (event, fn) {
        if (!this._events[event]) return this;
        var idx = this._events[event].indexOf(fn);
        if (idx >= 0) this._events[event].splice(idx, 1);
        return this;
      };

      EventEmitter.prototype.emit = function (event) {
        if (!this._events[event]) return false;
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var listeners = this._events[event].slice();
        for (var j = 0; j < listeners.length; j++) {
          listeners[j].apply(this, args);
        }
        return listeners.length > 0;
      };

      EventEmitter.prototype.once = function (event, fn) {
        var self = this;
        function wrapper() { self.off(event, wrapper); fn.apply(self, arguments); }
        this.on(event, wrapper);
        return this;
      };

      module.exports = EventEmitter;
    },

    // ---- Module 1: Tiny MD5 (simplified, for request dedup) ----
    "1": function (module, exports, __webpack_require__) {
      function tinyMD5(str) {
        function rotl(x, n) { return (x << n) | (x >>> (32 - n)); }
        function add(a, b) { var lsw = (a & 0xFFFF) + (b & 0xFFFF); var msw = (a >> 16) + (b >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }
        function cmn(q, a, b, x, s, t) { return add(rotl(add(add(a, q), add(x, t)), s), b); }
        function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
        function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
        function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
        function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

        function core(x, len) {
          x[len >> 5] |= 0x80 << ((len) % 32);
          x[(((len + 64) >>> 9) << 4) + 14] = len;
          var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
          for (var i = 0; i < x.length; i += 16) {
            var olda = a, oldb = b, oldc = c, oldd = d;
            a = ff(a, b, c, d, x[i+0], 7, -680876936); d = ff(d, a, b, c, x[i+1], 12, -389564586);
            c = ff(c, d, a, b, x[i+2], 17, 606105819); b = ff(b, c, d, a, x[i+3], 22, -1044525330);
            a = ff(a, b, c, d, x[i+4], 7, -176418897); d = ff(d, a, b, c, x[i+5], 12, 1200080426);
            c = ff(c, d, a, b, x[i+6], 17, -1473231341); b = ff(b, c, d, a, x[i+7], 22, -45705983);
            a = ff(a, b, c, d, x[i+8], 7, 1770035416); d = ff(d, a, b, c, x[i+9], 12, -1958414417);
            c = ff(c, d, a, b, x[i+10], 17, -42063); b = ff(b, c, d, a, x[i+11], 22, -1990404162);
            a = ff(a, b, c, d, x[i+12], 7, 1804603682); d = ff(d, a, b, c, x[i+13], 12, -40341101);
            c = ff(c, d, a, b, x[i+14], 17, -1502002290); b = ff(b, c, d, a, x[i+15], 22, 1236535329);
            a = gg(a, b, c, d, x[i+1], 5, -165796510); d = gg(d, a, b, c, x[i+6], 9, -1069501632);
            c = gg(c, d, a, b, x[i+11], 14, 643717713); b = gg(b, c, d, a, x[i+0], 20, -373897302);
            a = gg(a, b, c, d, x[i+5], 5, -701558691); d = gg(d, a, b, c, x[i+10], 9, 38016083);
            c = gg(c, d, a, b, x[i+15], 14, -660478335); b = gg(b, c, d, a, x[i+4], 20, -405537848);
            a = gg(a, b, c, d, x[i+9], 5, 568446438); d = gg(d, a, b, c, x[i+14], 9, -1019803690);
            c = gg(c, d, a, b, x[i+3], 14, -187363961); b = gg(b, c, d, a, x[i+8], 20, 1163531501);
            a = gg(a, b, c, d, x[i+13], 5, -1444681467); d = gg(d, a, b, c, x[i+2], 9, -51403784);
            c = gg(c, d, a, b, x[i+7], 14, 1735328473); b = gg(b, c, d, a, x[i+12], 20, -1926607734);
            a = hh(a, b, c, d, x[i+5], 4, -378558); d = hh(d, a, b, c, x[i+8], 11, -2022574463);
            c = hh(c, d, a, b, x[i+11], 16, 1839030562); b = hh(b, c, d, a, x[i+14], 23, -35309556);
            a = hh(a, b, c, d, x[i+1], 4, -1530992060); d = hh(d, a, b, c, x[i+4], 11, 1272893353);
            c = hh(c, d, a, b, x[i+7], 16, -155497632); b = hh(b, c, d, a, x[i+10], 23, -1094730640);
            a = hh(a, b, c, d, x[i+13], 4, 681279174); d = hh(d, a, b, c, x[i+0], 11, -358537222);
            c = hh(c, d, a, b, x[i+3], 16, -722521979); b = hh(b, c, d, a, x[i+6], 23, 76029189);
            a = hh(a, b, c, d, x[i+9], 4, -640364487); d = hh(d, a, b, c, x[i+12], 11, -421815835);
            c = hh(c, d, a, b, x[i+15], 16, 530742520); b = hh(b, c, d, a, x[i+2], 23, -995338651);
            a = ii(a, b, c, d, x[i+0], 6, -198630844); d = ii(d, a, b, c, x[i+7], 10, 1126891415);
            c = ii(c, d, a, b, x[i+14], 15, -1416354905); b = ii(b, c, d, a, x[i+5], 21, -57434055);
            a = ii(a, b, c, d, x[i+12], 6, 1700485571); d = ii(d, a, b, c, x[i+3], 10, -1894986606);
            c = ii(c, d, a, b, x[i+10], 15, -1051523); b = ii(b, c, d, a, x[i+1], 21, -2054922799);
            a = ii(a, b, c, d, x[i+8], 6, 1873313359); d = ii(d, a, b, c, x[i+15], 10, -30611744);
            c = ii(c, d, a, b, x[i+6], 15, -1560198380); b = ii(b, c, d, a, x[i+13], 21, 1309151649);
            a = ii(a, b, c, d, x[i+4], 6, -145523070); d = ii(d, a, b, c, x[i+11], 10, -1120210379);
            c = ii(c, d, a, b, x[i+2], 15, 718787259); b = ii(b, c, d, a, x[i+9], 21, -343485551);
            a = add(a, olda); b = add(b, oldb); c = add(c, oldc); d = add(d, oldd);
          }
          return [a, b, c, d];
        }

        function binl2hex(binarray) {
          var hex = "0123456789abcdef", str = "";
          for (var i = 0; i < binarray.length * 4; i++) {
            str += hex.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) + hex.charAt((binarray[i>>2] >> ((i%4)*8)) & 0xF);
          }
          return str;
        }

        str = (function (s) { var r = ""; for (var i = 0; i < s.length; i++) r += s[i]; return r; })(str);
        return binl2hex(core(str2binl(str), str.length * 8));

        function str2binl(str) {
          var bin = []; var mask = (1 << 8) - 1;
          for (var i = 0; i < str.length * 8; i += 8)
            bin[i>>5] |= (str.charCodeAt(i / 8) & mask) << (i%32);
          return bin;
        }
      }

      module.exports = tinyMD5;
    },

    // ---- Module 2: Data Validator ----
    "2": function (module, exports, __webpack_require__) {
      module.exports = {
        isObject: function (v) { return v !== null && typeof v === "object" && !Array.isArray(v); },
        isArray: Array.isArray || function (v) { return Object.prototype.toString.call(v) === "[object Array]"; },
        isString: function (v) { return typeof v === "string"; },
        isNumber: function (v) { return typeof v === "number" && isFinite(v); },
        isFunction: function (v) { return typeof v === "function"; },
        deepEqual: function (a, b) {
          if (a === b) return true;
          if (a == null || b == null) return false;
          if (typeof a !== typeof b) return false;
          if (typeof a === "object") {
            var keysA = Object.keys(a), keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            for (var i = 0; i < keysA.length; i++) { if (!this.deepEqual(a[keysA[i]], b[keysA[i]])) return false; }
            return true;
          }
          return false;
        }
      };
    },

    // ---- Module 3: Base64 Codec ----
    "3": function (module, exports, __webpack_require__) {
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

      module.exports = {
        encode: function (input) {
          var str = String(input);
          var output = "";
          for (var i = 0; i < str.length; i += 3) {
            var a = str.charCodeAt(i);
            var b = str.charCodeAt(i + 1);
            var c = str.charCodeAt(i + 2);
            output += chars.charAt(a >> 2);
            output += chars.charAt(((a & 3) << 4) | (b >> 4));
            output += isNaN(b) ? "=" : chars.charAt(((b & 15) << 2) | (c >> 6));
            output += isNaN(c) ? "=" : chars.charAt(c & 63);
          }
          return output;
        },
        decode: function (input) {
          var str = String(input).replace(/[^A-Za-z0-9\+\/\=]/g, "");
          var output = "";
          for (var i = 0; i < str.length; i += 4) {
            var a = chars.indexOf(str[i]);
            var b = chars.indexOf(str[i + 1]);
            var c = chars.indexOf(str[i + 2]);
            var d = chars.indexOf(str[i + 3]);
            output += String.fromCharCode((a << 2) | (b >> 4));
            if (c !== 64) output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
            if (d !== 64) output += String.fromCharCode(((c & 3) << 6) | d);
          }
          return output;
        }
      };
    },

    // ---- Module 4: Debounce & Throttle ----
    "4": function (module, exports, __webpack_require__) {
      module.exports = {
        debounce: function (fn, delay) {
          var timer = null;
          return function () {
            var self = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(self, args); }, delay);
          };
        },
        throttle: function (fn, interval) {
          var lastTime = 0;
          return function () {
            var now = Date.now();
            if (now - lastTime >= interval) {
              lastTime = now;
              fn.apply(this, arguments);
            }
          };
        }
      };
    },

    // ---- Module 5: Cookie Helper ----
    "5": function (module, exports, __webpack_require__) {
      module.exports = {
        get: function (name) {
          var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
          return match ? decodeURIComponent(match[2]) : null;
        },
        set: function (name, value, days) {
          var expires = "";
          if (days) {
            var d = new Date();
            d.setTime(d.getTime() + days * 86400000);
            expires = "; expires=" + d.toUTCString();
          }
          document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
        },
        del: function (name) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        }
      };
    }
  });
})();
