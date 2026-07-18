// fprint/audio.js — AudioContext fingerprinting
// Uses OscillatorNode → DynamicsCompressor → AnalyserNode → FFT spectrum → hash.
// Contains 3 sub-functions for oscillator generation, compression, and FFT analysis.
(function () {
  "use strict";

  function createOscillator(ctx, type, frequency) {
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    return osc;
  }

  function createCompressor(ctx) {
    var compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    return compressor;
  }

  function analyzeFFT(ctx, source, compressor) {
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(compressor);
    compressor.connect(analyser);
    return analyser;
  }

  function collectAudioFingerprint() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return { type: "audio", supported: false };

      var ctx = new AudioContext();
      var oscTri = createOscillator(ctx, "triangle", 440);
      var oscSaw = createOscillator(ctx, "sawtooth", 220);
      var compressor = createCompressor(ctx);
      var analyser = analyzeFFT(ctx, oscTri, compressor);

      // Connect oscillators through analyser
      oscTri.connect(analyser);
      oscSaw.connect(analyser);
      analyser.connect(ctx.destination);

      // Get frequency data
      var freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      // Build hash from frequency bins
      var hashParts = [];
      for (var i = 0; i < Math.min(freqData.length, 30); i++) {
        hashParts.push(freqData[i].toString(16));
      }
      var hash = hashParts.join("");

      // Cleanup
      oscTri.disconnect();
      oscSaw.disconnect();
      compressor.disconnect();
      analyser.disconnect();
      ctx.close();

      return {
        type: "audio",
        hash: hash.substring(0, 40),
        sampleRate: ctx.sampleRate,
        channels: ctx.destination.channelCount,
        fftSize: analyser.fftSize,
        oscTypes: ["triangle", "sawtooth"],
        collectedAt: Date.now(),
        collector: "audio_v2"
      };
    } catch (e) {
      return { type: "audio", error: e.message };
    }
  }

  if (!globalThis.__COLLECTOR_REGISTRY__) {
    globalThis.__COLLECTOR_REGISTRY__ = [];
  }
  globalThis.__COLLECTOR_REGISTRY__.push({
    name: "audio",
    priority: 5,
    collect: collectAudioFingerprint
  });
})();
