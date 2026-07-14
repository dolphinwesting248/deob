// Parser & generator provided to all modules
const parser = require("@babel/parser");
const generate = require("@babel/generator").default;
const t = require("@babel/types");
const fs = require("fs");
const path = require("path");

// ---- Globals not requiring parameter passing ----
const GLOBALS = new Set([
  "Object", "Array", "String", "Number", "Boolean", "Function", "Symbol",
  "Map", "Set", "WeakMap", "WeakSet", "Promise", "Proxy", "Reflect",
  "Math", "Date", "RegExp", "Error", "TypeError", "RangeError",
  "SyntaxError", "ReferenceError", "parseInt", "parseFloat", "isNaN", "isFinite",
  "NaN", "Infinity", "undefined", "null", "true", "false",
  "console", "window", "global", "globalThis", "process", "Buffer",
  "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "decodeURI", "encodeURI", "decodeURIComponent", "encodeURIComponent",
  "JSON", "Intl", "ArrayBuffer", "DataView",
  "Uint8Array", "Int8Array", "Uint16Array", "Int16Array",
  "Uint32Array", "Int32Array", "Float32Array", "Float64Array",
  "eval", "require", "module", "__dirname", "__filename", "exports", "fetch",
  "document", "location", "navigator", "history", "localStorage", "sessionStorage",
]);

module.exports = { parser, generate, t, fs, path, GLOBALS };
