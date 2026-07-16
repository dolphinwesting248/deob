// Parser & generator provided to all modules
const parser = require("@babel/parser");
const generate = require("@babel/generator").default;
const t = require("@babel/types");
const fs = require("fs");
const path = require("path");

// ---- Reserved words that cannot be parameter/identifier names ----
const RESERVED = new Set([
  "break", "case", "catch", "continue", "debugger", "default", "delete",
  "do", "else", "finally", "for", "function", "if", "in", "instanceof",
  "new", "return", "switch", "this", "throw", "try", "typeof", "var",
  "void", "while", "with", "class", "const", "enum", "export", "extends",
  "import", "super", "implements", "interface", "let", "package",
  "private", "protected", "public", "static", "yield", "await", "async",
]);

// ---- Globals not requiring parameter passing ----
const GLOBALS = new Set([
  // Built-in objects
  "Object", "Array", "String", "Number", "Boolean", "Function", "Symbol",
  "Map", "Set", "WeakMap", "WeakSet", "Promise", "Proxy", "Reflect",
  "Math", "Date", "RegExp", "Error", "TypeError", "RangeError",
  "SyntaxError", "ReferenceError", "URIError", "EvalError", "AggregateError",
  "parseInt", "parseFloat", "isNaN", "isFinite",
  "NaN", "Infinity", "undefined", "null", "true", "false",
  // Runtime
  "console", "window", "global", "globalThis", "self", "process", "Buffer",
  "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "requestAnimationFrame", "cancelAnimationFrame", "queueMicrotask",
  // Encoding
  "decodeURI", "encodeURI", "decodeURIComponent", "encodeURIComponent",
  "atob", "btoa", "TextEncoder", "TextDecoder",
  // Collections & buffers
  "JSON", "Intl", "ArrayBuffer", "DataView", "SharedArrayBuffer",
  "Uint8Array", "Int8Array", "Uint16Array", "Int16Array",
  "Uint32Array", "Int32Array", "Float32Array", "Float64Array",
  "BigInt64Array", "BigUint64Array", "BigInt",
  // Module system
  "eval", "require", "module", "__dirname", "__filename", "exports",
  // Web APIs
  "fetch", "XMLHttpRequest", "WebSocket", "AbortController", "AbortSignal",
  "Headers", "Request", "Response", "URL", "URLSearchParams",
  "document", "location", "navigator", "history", "localStorage", "sessionStorage",
  "indexedDB", "crypto", "SubtleCrypto",
  "Image", "Canvas", "HTMLCanvasElement", "OffscreenCanvas",
  "MutationObserver", "IntersectionObserver", "PerformanceObserver",
  "Worker", "SharedWorker", "ServiceWorker",
  "MessageChannel", "MessagePort", "BroadcastChannel",
  "EventSource", "FormData", "Blob", "File", "FileReader",
  "ReadableStream", "WritableStream", "TransformStream",
  // Node.js specific
  "Buffer", "URL", "URLSearchParams", "TextEncoder", "TextDecoder",
  "AbortController", "EventTarget", "Event",
  // Crypto
  "crypto", "SubtleCrypto", "CryptoKey",
]);

// String alert patterns for reverse-engineering (shared with structure.js + passes.js)
const ALERT_PATTERNS = [
  { label: "API Endpoint", regex: /https?:\/\/[^\s"'`,;{}[\]]+/gi, severity: "high" },
  { label: "API Path", regex: /\/(?:api|v\d+|rest|graphql|rpc)\/[^\s"'`,;{}[\]]*/gi, severity: "medium" },
  { label: "Token/Key", regex: /\b(?:token|secret|apikey|api_key|accessKey|privateKey|passwd|password|authorization)\b/gi, severity: "high" },
  { label: "Signature", regex: /\b(?:sign|signature|hmac|md5|sha(?:1|256|384|512)|encrypt|decrypt|encodeURIComponent)\b/gi, severity: "high" },
  { label: "Crypto", regex: /\b(?:aes|des|rsa|xor|cipher|createHash|createCipher|createHmac|pbkdf2|randomBytes|createDecipher|subtle)\b/gi, severity: "high" },
  { label: "Eval/Dynamic", regex: /\b(?:eval|Function\s*\(|new\s+Function)\b/gi, severity: "critical" },
  { label: "Storage", regex: /\b(?:localStorage|sessionStorage|indexedDB|setItem|getItem|removeItem|clear\s*\(\))\b/gi, severity: "medium" },
  { label: "DOM Sink", regex: /\b(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write|document\.domain|location\s*=)\b/gi, severity: "medium" },
  { label: "Network", regex: /\b(?:XMLHttpRequest|fetch|axios|WebSocket|EventSource|navigator\.sendBeacon|open\s*\(\s*["'][A-Z]+)\b/gi, severity: "medium" },
  { label: "Config Field", regex: /\b(?:baseURL|baseUrl|timeout|maxRetries|maxSize|maxLength|maxConcurrency|maxConnections)\b/gi, severity: "low" },
  // Attack surface extensions
  { label: "Cross-Context", regex: /\b(?:postMessage|BroadcastChannel|MessagePort|SharedWorker)\b/gi, severity: "high" },
  { label: "Extension API", regex: /\b(?:chrome\.(?:storage|runtime|tabs|cookies|webRequest|scripting|downloads|notifications|alarms)|browser\.(?:storage|runtime|tabs|scripting))\b/gi, severity: "high" },
  { label: "React XSS", regex: /\b(?:dangerouslySetInnerHTML|__html|createDangerousString)\b/gi, severity: "high" },
  { label: "Prototype Pollute", regex: /\b(?:__proto__|constructor\s*\[|prototype\s*\[|constructor\.prototype)\b/gi, severity: "high" },
  { label: "Fingerprint", regex: /\b(?:toDataURL|getParameter|WEBGL_debug_renderer_info|canvas.*hash|fingerprint|fp_risk|buvid_fp)\b/gi, severity: "high" },
  { label: "Cookie", regex: /\b(?:document\.cookie|\.cookie\b.*=|cookieEnabled|setCookie|getCookie)\b/gi, severity: "medium" },
  { label: "Anti-Tamper", regex: /\bdebugger\b/gi, severity: "high" },
];

// ── Default denoise rules ───────────────────────────────────────────
const DEFAULT_DENOISE = [
  { match: "https?://[a-zA-Z](/|$)",     label: "Test URL",       severity: "low" },
  { match: "github\\.io|mozilla\\.org",   label: "Doc URL",        severity: "low" },
  { match: "localhost|127\\.0\\.0\\.1",   label: "Local URL",      severity: "low" },
  { match: "example\\.com|test\\.com",    label: "Placeholder URL", severity: "low" },
  { match: "w3\\.org/|schema\\.org/|xmlns\\.com/", label: "Namespace URI", severity: "info" },
  { match: "\\.(js|css|svg|png|jpg|woff2?|ttf|exe|dmg|zip|map|wasm)([?#]|$)", label: "Static File", severity: "low" },
  { match: "Math\\.sign|CreateMethodProperty.*sign", label: "Polyfill", severity: "info" },
  { match: "https?://[^/]+/$",           label: "Self-domain URL", severity: "info" },
];

module.exports = { parser, generate, t, fs, path, GLOBALS, ALERT_PATTERNS, RESERVED, DEFAULT_DENOISE };
