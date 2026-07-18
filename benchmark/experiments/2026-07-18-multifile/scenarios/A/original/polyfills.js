// polyfills.js — ES5 compatibility shims
// Provides baseline methods for older browsers. Not business logic.
(function () {
  "use strict";

  // Array.prototype.indexOf
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
      var k;
      if (this == null) throw new TypeError('"this" is null or undefined');
      var O = Object(this);
      var len = O.length >>> 0;
      if (len === 0) return -1;
      var n = +fromIndex || 0;
      if (Math.abs(n) === Infinity) n = 0;
      if (n >= len) return -1;
      k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
      while (k < len) {
        if (k in O && O[k] === searchElement) return k;
        k++;
      }
      return -1;
    };
  }

  // Object.keys
  if (!Object.keys) {
    Object.keys = (function () {
      var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !{ toString: null }.propertyIsEnumerable("toString"),
        dontEnums = [
          "toString", "toLocaleString", "valueOf", "hasOwnProperty",
          "isPrototypeOf", "propertyIsEnumerable", "constructor"
        ],
        dontEnumsLength = dontEnums.length;

      return function (obj) {
        if (typeof obj !== "function" && (typeof obj !== "object" || obj === null)) {
          throw new TypeError("Object.keys called on non-object");
        }
        var result = [], prop, i;
        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) result.push(prop);
        }
        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
          }
        }
        return result;
      };
    })();
  }

  // Date.now shim
  if (!Date.now) {
    Date.now = function () {
      return new Date().getTime();
    };
  }

  // String.prototype.trim
  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^[\s﻿\xA0]+|[\s﻿\xA0]+$/g, "");
    };
  }

  // Signal that polyfills are ready
  globalThis.__POLYFILLS_READY__ = true;
})();
