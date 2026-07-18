// storage.js — Token persistence layer
// Reads/writes auth tokens via localStorage with cookie fallback.
(function () {
  "use strict";

  var STORAGE_PREFIX = "__sdk_";

  function isLocalStorageAvailable() {
    try {
      var test = "__ls_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + d.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
  }

  function removeCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }

  var Storage = {
    getToken: function (key) {
      var k = STORAGE_PREFIX + key;
      if (isLocalStorageAvailable()) {
        return localStorage.getItem(k);
      }
      return getCookie(k);
    },

    setToken: function (key, value) {
      var k = STORAGE_PREFIX + key;
      if (isLocalStorageAvailable()) {
        localStorage.setItem(k, value);
      } else {
        setCookie(k, value, 30);
      }
    },

    removeToken: function (key) {
      var k = STORAGE_PREFIX + key;
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(k);
      } else {
        removeCookie(k);
      }
    },

    hasToken: function (key) {
      return this.getToken(key) !== null;
    },

    clearAll: function () {
      var keys = ["auth_token", "refresh_token", "token_expiry"];
      for (var i = 0; i < keys.length; i++) {
        this.removeToken(keys[i]);
      }
    }
  };

  globalThis.__STORAGE__ = Storage;
})();
