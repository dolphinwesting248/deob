// config.js — API configuration center
// Stores API endpoints, salt, version, and feature flags.
// Two values are intentionally base64-encoded to add decoding challenge.
(function () {
  "use strict";

  // base64 decode helper (self-contained, no external dependency)
  function b64Decode(str) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var i = 0;
    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, "");
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
  }

  // Encoded values — agent must decode these
  var ENCODED_VERIFY_KEY = "VkVSSUZZX0tFWT1hYmMxMjNkZWY0NTY=";   // "VERIFY_KEY=abc123def456"
  var ENCODED_FEATURE_FLAG = "RkVBVFVSRV9FTkFCTEVE";              // "FEATURE_ENABLED"

  var CONFIG = {
    // Core API settings
    API_SALT: "x7k9m_2025",
    API_ENDPOINT: "https://api.example.com/v1/sign",
    API_VERSION: "2.1",

    // Decoded values
    VERIFY_KEY: b64Decode(ENCODED_VERIFY_KEY).split("=")[1],  // "abc123def456"
    FEATURE_ENABLED: b64Decode(ENCODED_FEATURE_FLAG) === "FEATURE_ENABLED",

    // Separator used in sign string construction
    SEPARATOR: "|",

    // Token settings
    TOKEN_REFRESH_BUFFER: 300,  // refresh 5 minutes before expiry
    MAX_RETRY_COUNT: 3,

    // Feature flags
    FEATURES: {
      ENABLE_CACHING: true,
      ENABLE_DEBUG_LOG: false,
      ENABLE_COMPRESSION: false,
      USE_NEW_SIGN_ALGO: true
    }
  };

  globalThis.__CONFIG__ = CONFIG;
})();
