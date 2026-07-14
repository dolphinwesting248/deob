// Readability metrics: before/after comparison with HTML report
const { parser, t, fs, path } = require("./config");

function analyze(filepath) {
  const code = fs.readFileSync(filepath, "utf-8");
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "script",
      allowReturnOutsideFunction: true,
      allowUndeclaredExports: true,
      errorRecovery: true,
    });
  } catch (e) {
    return analyzeFallback(filepath, code);
  }

  const result = walkAST(ast);
  result.file = filepath;
  result.size = code.length;
  result.lines = code.split("\n").length;
  result.sizeMB = (result.size / 1024 / 1024);
  return result;
}

function walkAST(ast) {
  const m = { fnCount: 0, maxDepth: 0, maxBodyLen: 0, totalBodyLen: 0, totalParams: 0, fnWithComments: 0 };

  function walk(node, depth) {
    if (!node || typeof node !== "object") return;
    if (
      t.isFunctionDeclaration(node) || t.isFunctionExpression(node) ||
      t.isArrowFunctionExpression(node) || t.isObjectMethod(node)
    ) {
      m.fnCount++;
      const bl = t.isBlockStatement(node.body) ? node.body.body.length : 1;
      m.totalBodyLen += bl;
      m.totalParams += node.params.length;
      if (bl > m.maxBodyLen) m.maxBodyLen = bl;
      if (depth > m.maxDepth) m.maxDepth = depth;
      if (node.leadingComments && node.leadingComments.length > 0) m.fnWithComments++;
    }
    for (const k of Object.keys(node)) {
      if (k === "start" || k === "end" || k === "loc" ||
          k.startsWith("lead") || k.startsWith("trail") || k.startsWith("inner")) continue;
      const v = node[k];
      if (Array.isArray(v)) { for (const x of v) walk(x, depth + 1); }
      else if (v && typeof v.type === "string") walk(v, depth + 1);
    }
  }
  walk(ast, 0);
  m.avgBodyLen = (m.totalBodyLen / Math.max(1, m.fnCount));
  m.avgParams = (m.totalParams / Math.max(1, m.fnCount));
  return m;
}

function analyzeFallback(filepath, code) {
  const fnMatches = code.match(/\bfunction\s/g) || [];
  const commentMatches = code.match(/\/\/\s*Original lines/g) || [];
  const lines = code.split("\n");
  let maxIndent = 0;
  for (const line of lines) {
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent > maxIndent) maxIndent = Math.min(indent, 200);
  }
  return {
    file: filepath, size: code.length, sizeMB: code.length / 1024 / 1024,
    lines: lines.length, fnCount: fnMatches.length,
    maxDepth: Math.round(maxIndent / 2), maxBodyLen: 0, avgBodyLen: 0,
    avgParams: 0, fnWithComments: commentMatches.length,
    totalBodyLen: 0, totalParams: 0, fallback: true,
  };
}

function generateReport(before, after) {
  const metrics = [
    { label: "Functions", before: before.fnCount, after: after.fnCount, fmt: 0, better: "higher" },
    { label: "Avg Function Body", before: before.avgBodyLen, after: after.avgBodyLen, fmt: 1, better: "lower", unit: "lines" },
    { label: "Max Nesting Depth", before: before.maxDepth, after: after.maxDepth, fmt: 0, better: "lower" },
    { label: "Functions w/ Comments", before: before.fnWithComments, after: after.fnWithComments, fmt: 0, better: "higher" },
    { label: "Avg Parameters", before: before.avgParams, after: after.avgParams, fmt: 1, better: "higher" },
    { label: "File Size", before: before.sizeMB, after: after.sizeMB, fmt: 2, better: "lower", unit: "MB" },
    { label: "Total Lines", before: before.lines, after: after.lines, fmt: 0, better: "higher" },
    { label: "Max Function Body", before: before.maxBodyLen, after: after.maxBodyLen, fmt: 0, better: "lower", unit: "lines" },
  ];

  const bars = metrics.map((m) => {
    const delta = m.after - m.before;
    const pct = m.before > 0 ? ((delta / m.before) * 100) : 0;
    const absPct = Math.abs(pct);
    const favorable = (m.better === "higher" && delta > 0) || (m.better === "lower" && delta < 0);
    const same = delta === 0;
    const bVal = m.before.toFixed(m.fmt);
    const aVal = m.after.toFixed(m.fmt);
    const unit = m.unit || "";
    const signStr = delta > 0 ? "+" : "";
    const pctStr = signStr + pct.toFixed(0);

    const clazz = same ? "eq" : favorable ? "up" : "down";
    const dirLabel = same ? "-- unchanged" : favorable ? "↓ decreased" : "↑ increased";

    return {
      label: m.label, bVal, aVal, unit, pctStr, absPct,
      direction: same ? "-- unchanged" : (Math.abs(pct) <= 1 ? "-- unchanged" : dirLabel),
      clazz, barW: Math.min(100, Math.max(2, Math.round(absPct))),
    };
  });

  const favorable = bars.filter((r) => r.clazz === "up").length;
  const same = bars.filter((r) => r.clazz === "eq").length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>deob · Readability Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
  .wrap{max-width:780px;margin:0 auto;padding:48px 24px}
  h1{font-size:26px;font-weight:700;letter-spacing:-.5px;margin-bottom:4px}
  h1 span{color:#6366f1}
  .path{color:#64748b;font-size:13px;font-family:ui-monospace,monospace}
  .header{margin-bottom:32px}
  .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:36px}
  .kpi-card{background:linear-gradient(135deg,#1e293b,#1a2332);border-radius:12px;padding:22px;border:1px solid #1e293b;text-align:center}
  .kpi-card .val{font-size:38px;font-weight:800;line-height:1}
  .val.g{color:#22c55e} .val.i{color:#6366f1} .val.w{color:#f59e0b}
  .kpi-card .lbl{font-size:12px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:.5px}
  .sec{font-size:11px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px}
  .chart{display:flex;flex-direction:column;gap:8px;margin-bottom:36px}
  .chart-row{display:flex;align-items:center;gap:12px}
  .chart-label{width:180px;font-size:13px;color:#cbd5e1;text-align:right;flex-shrink:0}
  .chart-track{flex:1;height:22px;background:#1e293b;border-radius:6px;overflow:hidden;position:relative}
  .chart-bar{height:100%;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;font-size:11px;font-weight:700;transition:width .6s ease}
  .chart-bar.up{background:linear-gradient(90deg,#166534,#22c55e)}
  .chart-bar.down{background:linear-gradient(90deg,#991b1b,#ef4444)}
  .chart-bar.eq{background:#334155}
  .chart-val{width:48px;font-size:12px;font-weight:600;text-align:left;flex-shrink:0}
  .chart-val.up{color:#22c55e} .chart-val.down{color:#ef4444} .chart-val.eq{color:#64748b}
  .chart-abs{width:130px;font-size:11px;color:#64748b;text-align:right;flex-shrink:0;font-variant-numeric:tabular-nums}
  .detail{display:flex;flex-direction:column;gap:6px}
  .d-row{display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #1e293b;font-size:13px}
  .d-label{flex:1;color:#cbd5e1}
  .d-vals{display:flex;align-items:center;gap:8px;font-variant-numeric:tabular-nums}
  .d-bf{color:#64748b} .d-arr{color:#475569} .d-af{color:#e2e8f0;font-weight:600}
  .d-tag{font-size:12px;font-weight:600;min-width:100px;text-align:right}
  .d-tag.up{color:#22c55e}.d-tag.down{color:#ef4444}.d-tag.eq{color:#64748b}
  .foot{text-align:center;color:#475569;font-size:12px;margin-top:40px}
  .foot a{color:#6366f1;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>deob <span>·</span> Readability Report</h1>
    <div class="path">${before.file} → ${after.file}${before.fallback ? "  (regex-based)" : ""}</div>
  </div>
  <div class="kpi">
    <div class="kpi-card"><div class="val g">${favorable}/${bars.length}</div><div class="lbl">Improved</div></div>
    <div class="kpi-card"><div class="val i">${after.fnCount}</div><div class="lbl">Functions</div></div>
    <div class="kpi-card"><div class="val w">${after.fnWithComments}</div><div class="lbl">With Comments</div></div>
  </div>
  <div class="sec">Change Rate (%)</div>
  <div class="chart">
${bars.map((b) => `
    <div class="chart-row">
      <div class="chart-label">${b.label}</div>
      <div class="chart-track">
        <div class="chart-bar ${b.clazz}" style="width:${b.barW}%">${b.absPct >= 10 ? b.pctStr + '%' : ''}</div>
      </div>
      <div class="chart-val ${b.clazz}">${b.pctStr}%</div>
      <div class="chart-abs">${b.bVal}${b.unit} → ${b.aVal}${b.unit}</div>
    </div>`).join("")}
  </div>
  <div class="sec">Details</div>
  <div class="detail">
${bars.map((b) => `
    <div class="d-row">
      <div class="d-label">${b.label}</div>
      <div class="d-vals">
        <span class="d-bf">${b.bVal}${b.unit}</span><span class="d-arr">→</span><span class="d-af">${b.aVal}${b.unit}</span>
      </div>
      <div class="d-tag ${b.clazz}">${b.direction}</div>
    </div>`).join("")}
  </div>
  <div class="foot">Generated by <a href="#">deob</a> · ${new Date().toISOString().slice(0, 10)}</div>
</div>
</body>
</html>`;
}

function runMetrics(input, output) {
  console.log("Analyzing before/after metrics...");
  const before = analyze(input);
  const after = analyze(output);
  const html = generateReport(before, after);
  const outPath = output.endsWith(".js")
    ? output.replace(/\.js$/, ".metrics.html")
    : output + "/metrics.html";
  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`  Report: ${outPath}`);
  return { before, after };
}

module.exports = { analyze, generateReport, runMetrics };
