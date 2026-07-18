// fprint/canvas.js — Canvas + WebGL fingerprinting
// Renders text/WebGL to canvas, extracts pixel data, hashes to fingerprint.
// Registers into COLLECTOR_REGISTRY.
(function () {
  "use strict";

  function hashCanvasData(data) {
    var hash = 0;
    var len = Math.min(data.length, 2000); // first 2000 pixels
    for (var i = 0; i < len; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  function getCanvasFingerprint() {
    try {
      var canvas = document.createElement("canvas");
      canvas.width = 280;
      canvas.height = 60;
      var ctx = canvas.getContext("2d");

      // Draw text with specific font
      ctx.textBaseline = "top";
      ctx.font = '14px "Arial"';
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Cwm fjordbank glyphs vext quiz, 😃", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.font = '18px "Arial"';
      ctx.fillText("Fingerprint 🔒", 4, 45);

      var dataUrl = canvas.toDataURL();
      var pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      var hash = hashCanvasData(pixelData);

      return {
        type: "canvas2d",
        hash: hash,
        dataUrlLen: dataUrl.length,
        width: canvas.width,
        height: canvas.height
      };
    } catch (e) {
      return { type: "canvas2d", error: e.message };
    }
  }

  function getWebGLFingerprint() {
    try {
      var canvas = document.createElement("canvas");
      var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return { type: "webgl", supported: false };

      var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      var vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "unknown";
      var renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown";

      // Read renderer-specific parameters
      var params = {
        MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        MAX_VIEWPORT_DIMS: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        MAX_RENDERBUFFER_SIZE: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        VERSION: gl.getParameter(gl.VERSION),
        SHADING_LANGUAGE_VERSION: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        VENDOR: gl.getParameter(gl.VENDOR),
        RENDERER: gl.getParameter(gl.RENDERER)
      };

      // Generate hash from key parameters
      var fingerprint = [vendor, renderer, params.MAX_TEXTURE_SIZE, params.RENDERER].join("|");
      var hash = 0;
      for (var i = 0; i < fingerprint.length; i++) {
        hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
        hash |= 0;
      }

      return {
        type: "webgl",
        vendor: vendor,
        renderer: renderer,
        hash: Math.abs(hash).toString(16),
        gpuVendor: vendor,
        gpuModel: renderer
      };
    } catch (e) {
      return { type: "webgl", error: e.message };
    }
  }

  function collectCanvasFingerprint() {
    return {
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      collectedAt: Date.now(),
      collector: "canvas_v2"
    };
  }

  if (!globalThis.__COLLECTOR_REGISTRY__) {
    globalThis.__COLLECTOR_REGISTRY__ = [];
  }
  globalThis.__COLLECTOR_REGISTRY__.push({
    name: "canvas",
    priority: 8,
    collect: collectCanvasFingerprint
  });
})();
