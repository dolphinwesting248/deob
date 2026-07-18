// fprint/device.js — Device info collector
// Collects navigator, screen, timezone, touch support, and plugin information.
// Registers itself into the global COLLECTOR_REGISTRY for the scheduler to dispatch.
(function () {
  "use strict";

  function collectDeviceInfo() {
    var nav = navigator;
    var screen = window.screen;

    var info = {
      // Navigator properties
      userAgent: nav.userAgent,
      platform: nav.platform,
      language: nav.language || nav.userLanguage,
      hardwareConcurrency: nav.hardwareConcurrency || 1,
      deviceMemory: nav.deviceMemory || "unknown",
      vendor: nav.vendor,
      vendorSub: nav.vendorSub,

      // Screen properties
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,

      // Timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      // Touch support
      maxTouchPoints: nav.maxTouchPoints || 0,
      touchSupport: "ontouchstart" in window,

      // Plugins
      pluginsCount: (nav.plugins && nav.plugins.length) || 0,
      mimeTypesCount: (nav.mimeTypes && nav.mimeTypes.length) || 0,

      // Collection metadata
      collectedAt: Date.now(),
      collector: "device_v2"
    };

    // Extract plugin names (first 10)
    var pluginNames = [];
    if (nav.plugins) {
      for (var i = 0; i < Math.min(nav.plugins.length, 10); i++) {
        var p = nav.plugins[i];
        pluginNames.push(p.name);
      }
    }
    info.pluginNames = pluginNames;

    return info;
  }

  // Initialize collector registry (shared with other collectors)
  if (!globalThis.__COLLECTOR_REGISTRY__) {
    globalThis.__COLLECTOR_REGISTRY__ = [];
  }
  globalThis.__COLLECTOR_REGISTRY__.push({
    name: "device",
    priority: 10,
    collect: collectDeviceInfo
  });
})();
