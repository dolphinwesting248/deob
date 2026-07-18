// runtime.js — Webpack 5 runtime bootstrap
// Provides __webpack_require__ and chunk loader infrastructure.
// All other chunks use this shared module system.
(function () {
  "use strict";

  // Module cache — shared across all chunks via globalThis
  var modules = {};
  var installedModules = globalThis.__webpack_require__c || {};
  if (!globalThis.__webpack_require__c) {
    globalThis.__webpack_require__c = installedModules;
  }

  function __webpack_require__(moduleId) {
    // Check cache first
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    // Create new module
    var module = installedModules[moduleId] = {
      id: moduleId,
      loaded: false,
      exports: {}
    };

    // Execute module function
    var fn = modules[moduleId];
    if (fn) {
      fn.call(module.exports, module, module.exports, __webpack_require__);
      module.loaded = true;
    }

    return module.exports;
  }

  // Register modules (called by each chunk)
  function __webpack_register__(chunkModules) {
    for (var id in chunkModules) {
      if (chunkModules.hasOwnProperty(id)) {
        modules[id] = chunkModules[id];
      }
    }
  }

  // Chunk loader (JSONP-based)
  var installedChunks = { main: 1 };

  function __webpack_chunk_load__(chunkId) {
    return new Promise(function (resolve, reject) {
      if (installedChunks[chunkId]) {
        resolve();
        return;
      }

      var script = document.createElement("script");
      script.src = __webpack_public_path__ + chunkId + ".js";
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error("Chunk load failed: " + chunkId)); };
      document.head.appendChild(script);
    });
  }

  // Public path
  var __webpack_public_path__ = globalThis.__WEBPACK_PUBLIC_PATH__ || "./";

  // Global module getter — used by cross-chunk references
  function __webpack_get_module__(moduleId) {
    return installedModules[moduleId] ? installedModules[moduleId].exports : undefined;
  }

  // Expose webpack runtime
  globalThis.__webpack_require__ = __webpack_require__;
  globalThis.__webpack_register__ = __webpack_register__;
  globalThis.__webpack_chunk_load__ = __webpack_chunk_load__;
  globalThis.__webpack_public_path__ = __webpack_public_path__;
  globalThis.__webpack_get_module__ = __webpack_get_module__;
})();
