import { TestCase } from "./utils";

// ═══════════════════════════════════════════════════════════════
// EXECUTION SUMMARY — shared data shape
// ═══════════════════════════════════════════════════════════════
export interface ExecutionSummary {
  id:          string;   // "2026-03-17_14-35-22"
  startedAt:   string;   // ISO timestamp
  finishedAt:  string;
  mode:        "flow" | "independent";
  environment: string;
  baseUrl:     string;
  cases:       TestCase[];
}

// ─────────────────────────────────────────────────────────────
// CSV GENERATOR
// ─────────────────────────────────────────────────────────────
export function generateCSV(s: ExecutionSummary): string {
  const esc = (v: any): string => {
    const str = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    "seq", "runGroup", "apiTitle", "resourceName", "method",
    "path", "resolvedUrl", "body", "dataSource",
    "status", "httpStatus", "latency_ms", "res_body", "res_headers",
    "startedAt", "executionId", "mode", "environment",
  ];

  const rows = s.cases.map(tc => [
    tc.seq, tc.runGroup, tc.apiTitle, tc.resourceName, tc.method,
    tc.path, tc.resolvedUrl ?? "", tc.body ?? "", tc.dataSource,
    tc.status, tc.httpStatus ?? "", tc.latency ?? "",
    tc.result ?? "", tc.headers ?? "",
    s.startedAt, s.id, s.mode, s.environment,
  ].map(esc).join(","));

  return [headers.join(","), ...rows].join("\r\n");
}

// ─────────────────────────────────────────────────────────────
// HTML REPORT GENERATOR  (Allure / Playwright inspired)
// ─────────────────────────────────────────────────────────────
export function generateHTML(s: ExecutionSummary): string {
  const passed  = s.cases.filter(c => c.status === "passed").length;
  const failed  = s.cases.filter(c => c.status === "failed").length;
  const pending = s.cases.filter(c => c.status === "pending").length;
  const total   = s.cases.length;
  const executed = passed + failed;
  const pct = executed > 0 ? ((passed / executed) * 100).toFixed(1) : "0.0";
  const avgLat = executed > 0
    ? Math.round(s.cases.filter(c => c.latency != null).reduce((a, c) => a + (c.latency || 0), 0) / executed)
    : 0;
  const totalMs = s.cases.filter(c => c.latency != null).reduce((a, c) => a + (c.latency || 0), 0);
  const durationSec = ((new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 1000).toFixed(1);

  // SVG donut chart
  const r = 54;
  const circ = 2 * Math.PI * r;
  const passArc = executed > 0 ? (passed / executed) * circ : 0;
  const failArc = circ - passArc;
  const pctNum = parseFloat(pct);

  // Method breakdown
  const methods = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;
  type Meth = typeof methods[number];
  const methodStats: Record<string, { ok: number; total: number; avgMs: number }> = {};
  methods.forEach(m => {
    const mc = s.cases.filter(c => c.method.toUpperCase() === m && c.status !== "pending");
    if (mc.length === 0) return;
    const ok = mc.filter(c => c.status === "passed").length;
    const lats = mc.filter(c => c.latency != null);
    methodStats[m] = {
      ok, total: mc.length,
      avgMs: lats.length > 0 ? Math.round(lats.reduce((a, c) => a + (c.latency || 0), 0) / lats.length) : 0,
    };
  });

  // Timeline dots (max 200, color by status)
  const dotCases = s.cases.slice(0, 200);
  const timelineDots = dotCases.map(tc => {
    const col = tc.status === "passed" ? "#22c55e" : tc.status === "failed" ? "#ef4444" : "#94a3b8";
    const label = `#${tc.seq} ${tc.method} ${tc.apiTitle} — ${tc.status}${tc.latency ? ` (${tc.latency}ms)` : ""}`;
    return `<span class="tl-dot" style="background:${col}" title="${label.replace(/"/g, "&quot;")}"></span>`;
  }).join("");

  // Test rows
  const testRows = s.cases.map(tc => {
    const isPassed = tc.status === "passed";
    const isFailed = tc.status === "failed";
    const statusClass = isPassed ? "row-pass" : isFailed ? "row-fail" : "row-pending";
    const icon = isPassed ? "✓" : isFailed ? "✗" : "○";
    const methodClass = `badge-${tc.method.toLowerCase()}`;
    const reqBodyStr = tc.body ? JSON.stringify(tc.body, null, 2) : null;
    const resBodyStr = tc.result ? JSON.stringify(tc.result, null, 2) : null;
    const resHeaderStr = tc.headers ? JSON.stringify(tc.headers, null, 2) : null;
    const url = tc.resolvedUrl ?? tc.path;

    return `
      <details class="test-row ${statusClass}">
        <summary class="test-summary">
          <span class="ts-icon">${icon}</span>
          <span class="ts-seq">#${tc.seq}</span>
          <span class="ts-run">R${tc.runGroup}</span>
          <span class="badge ${methodClass}">${tc.method}</span>
          <span class="ts-title" title="${tc.apiTitle}">${tc.apiTitle}</span>
          <span class="ts-path" title="${url}">${url}</span>
          <span class="ts-spacer"></span>
          ${tc.httpStatus != null ? `<span class="ts-http ${Number(tc.httpStatus) >= 400 ? "http-err" : "http-ok"}">${tc.httpStatus}</span>` : ""}
          ${tc.latency != null ? `<span class="ts-lat">${tc.latency}ms</span>` : ""}
          <span class="ts-chevron">▸</span>
        </summary>
        <div class="test-detail">
          <div class="detail-row">
            <div class="detail-section">
              <div class="detail-label">▶ REQUEST</div>
              <div class="detail-method-url">
                <span class="badge ${methodClass}">${tc.method}</span>
                <code class="detail-url">${url}</code>
              </div>
              ${reqBodyStr ? `<div class="detail-sub-label">Request Body</div><pre class="detail-code">${reqBodyStr.replace(/</g, "&lt;")}</pre>` : ""}
            </div>
            <div class="detail-section">
              <div class="detail-label ${isFailed ? "detail-label--err" : ""}">◀ RESPONSE ${tc.httpStatus != null ? `· ${tc.httpStatus}` : ""}${tc.latency != null ? ` · ${tc.latency}ms` : ""}</div>
              ${resBodyStr ? `<div class="detail-sub-label">Response Body</div><pre class="detail-code ${isFailed ? "detail-code--err" : ""}">${resBodyStr.replace(/</g, "&lt;")}</pre>` : ""}
              ${resHeaderStr ? `<div class="detail-sub-label">Headers</div><pre class="detail-code detail-code--headers">${resHeaderStr.replace(/</g, "&lt;")}</pre>` : ""}
            </div>
          </div>
        </div>
      </details>`;
  }).join("\n");

  // Method breakdown rows
  const methodRows = Object.entries(methodStats).map(([m, st]) => {
    const rate = st.total > 0 ? ((st.ok / st.total) * 100).toFixed(0) : "0";
    return `
      <div class="meth-row">
        <span class="badge badge-${m.toLowerCase()}">${m}</span>
        <span class="meth-frac">${st.ok}/${st.total}</span>
        <div class="meth-bar-wrap">
          <div class="meth-bar" style="width:${rate}%;background:${st.ok === st.total ? "#22c55e" : "#f97316"}"></div>
        </div>
        <span class="meth-pct">${rate}%</span>
        <span class="meth-lat">${st.avgMs}ms avg</span>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CAPI Test Report · ${s.id}</title>
<style>
:root {
  --bg:         #f1f5f9;
  --surface:    #ffffff;
  --surface-2:  #f8fafc;
  --border:     #e2e8f0;
  --border-2:   #cbd5e1;
  --text:       #0f172a;
  --muted:      #475569;
  --dim:        #94a3b8;
  --green:      #16a34a;
  --green-bg:   #f0fdf4;
  --green-bd:   #bbf7d0;
  --red:        #dc2626;
  --red-bg:     #fef2f2;
  --red-bd:     #fecaca;
  --blue:       #2563eb;
  --mono:       'Consolas','Monaco','Courier New',monospace;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:var(--bg); color:var(--text); line-height:1.5; font-size:14px; }

/* ── Header ── */
.header { background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%); color:#f8fafc; padding:28px 40px 24px; }
.header-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.header-brand { display:flex; align-items:center; gap:12px; }
.header-icon { width:44px; height:44px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:22px; }
.header-title { font-size:24px; font-weight:800; letter-spacing:-0.5px; }
.header-sub { font-size:13px; color:#94a3b8; margin-top:2px; }
.header-meta { display:flex; gap:20px; flex-wrap:wrap; margin-top:18px; }
.meta-chip { background:#ffffff14; border:1px solid #ffffff22; border-radius:6px; padding:5px 12px; font-size:12px; font-family:var(--mono); }
.meta-chip strong { color:#a5f3fc; }
.badge-status { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
.badge-status--pass { background:#16a34a; color:#fff; }
.badge-status--fail { background:#dc2626; color:#fff; }
.badge-status--partial { background:#f97316; color:#fff; }

/* ── Stats ── */
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; padding:24px 40px; }
.stat-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; text-align:center; }
.stat-value { font-size:32px; font-weight:800; line-height:1.1; margin-bottom:4px; }
.stat-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; opacity:.6; }
.stat-card--total .stat-value  { color:#3b82f6; }
.stat-card--pass .stat-value   { color:#16a34a; }
.stat-card--fail .stat-value   { color:#dc2626; }
.stat-card--rate .stat-value   { color:#7c3aed; }
.stat-card--lat .stat-value    { color:#ea580c; }
.stat-card--dur .stat-value    { color:#0891b2; }

/* ── Charts section ── */
.charts { display:grid; grid-template-columns:220px 1fr; gap:20px; padding:0 40px 24px; }
.chart-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; }
.chart-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--dim); margin-bottom:16px; }
.donut-wrap { display:flex; align-items:center; gap:20px; }
.donut-svg { width:120px; height:120px; flex-shrink:0; }
.donut-legend { display:flex; flex-direction:column; gap:8px; }
.legend-item { display:flex; align-items:center; gap:8px; font-size:12px; }
.legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.legend-num { font-weight:700; margin-left:auto; min-width:30px; text-align:right; }
.meth-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:12px; }
.meth-frac { font-weight:700; min-width:40px; font-family:var(--mono); }
.meth-bar-wrap { flex:1; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden; }
.meth-bar { height:100%; border-radius:3px; transition:width .4s; }
.meth-pct { min-width:36px; text-align:right; color:var(--muted); font-family:var(--mono); }
.meth-lat { min-width:58px; text-align:right; color:var(--dim); font-family:var(--mono); font-size:11px; }

/* ── Timeline ── */
.timeline-section { padding:0 40px 24px; }
.timeline-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 20px; }
.tl-strip { display:flex; flex-wrap:wrap; gap:2px; margin-top:10px; }
.tl-dot { width:8px; height:8px; border-radius:2px; cursor:default; transition:transform .1s; flex-shrink:0; }
.tl-dot:hover { transform:scale(1.8); z-index:1; }

/* ── Toolbar ── */
.toolbar { display:flex; align-items:center; gap:12px; padding:16px 40px; background:var(--surface); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
.toolbar-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--dim); }
.tb-filter { display:flex; gap:4px; }
.tb-btn { background:var(--surface-2); border:1px solid var(--border); color:var(--muted); border-radius:6px; padding:5px 14px; font-size:12px; cursor:pointer; font-weight:600; transition:all .15s; }
.tb-btn:hover { border-color:var(--border-2); color:var(--text); }
.tb-btn.active { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
.tb-btn.active-fail { background:#fef2f2; border-color:#fca5a5; color:#b91c1c; }
.tb-search { flex:1; max-width:280px; padding:6px 12px; border:1px solid var(--border); border-radius:6px; font-size:12px; outline:none; background:var(--surface-2); color:var(--text); }
.tb-search:focus { border-color:#6366f1; background:#fff; }
.tb-count { margin-left:auto; font-size:12px; color:var(--dim); font-family:var(--mono); }
.tb-collapse { background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:6px; padding:5px 12px; font-size:11px; cursor:pointer; }

/* ── Test rows ── */
.results { padding:0 40px 40px; display:flex; flex-direction:column; gap:4px; }
.test-row { border-radius:8px; border:1px solid var(--border); overflow:hidden; }
.test-row.row-pass { border-left:4px solid #22c55e; }
.test-row.row-fail { border-left:4px solid #ef4444; }
.test-row.row-pending { border-left:4px solid #94a3b8; opacity:.6; }
.test-row[open] { box-shadow:0 4px 12px rgba(0,0,0,.08); }
.test-summary { display:flex; align-items:center; gap:8px; padding:10px 14px; cursor:pointer; background:var(--surface); list-style:none; user-select:none; }
.test-summary::-webkit-details-marker { display:none; }
.test-summary:hover { background:var(--surface-2); }
.row-pass .test-summary { background:#f0fdf4; }
.row-pass .test-summary:hover { background:#dcfce7; }
.row-fail .test-summary { background:#fef2f2; }
.row-fail .test-summary:hover { background:#fee2e2; }
.ts-icon { font-size:14px; width:18px; text-align:center; flex-shrink:0; font-weight:700; }
.row-pass .ts-icon { color:#16a34a; }
.row-fail .ts-icon { color:#dc2626; }
.ts-seq { font-family:var(--mono); font-size:10px; color:var(--dim); background:var(--surface-2); border:1px solid var(--border); border-radius:4px; padding:1px 6px; flex-shrink:0; }
.ts-run { font-family:var(--mono); font-size:9px; color:var(--dim); flex-shrink:0; }
.ts-title { font-size:12px; font-weight:600; flex-shrink:0; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ts-path { font-family:var(--mono); font-size:10px; color:var(--dim); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ts-spacer { flex:1; }
.ts-http { font-family:var(--mono); font-size:11px; font-weight:700; padding:2px 7px; border-radius:5px; flex-shrink:0; }
.http-ok  { background:#dcfce7; color:#16a34a; }
.http-err { background:#fee2e2; color:#dc2626; }
.ts-lat { font-family:var(--mono); font-size:11px; color:var(--dim); flex-shrink:0; min-width:52px; text-align:right; }
.ts-chevron { color:var(--dim); font-size:10px; flex-shrink:0; transition:transform .2s; }
details[open] .ts-chevron { transform:rotate(90deg); }

/* ── Test detail ── */
.test-detail { padding:14px 18px; background:var(--surface-2); border-top:1px solid var(--border); }
.detail-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.detail-section {}
.detail-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--dim); margin-bottom:8px; }
.detail-label--err { color:#dc2626; }
.detail-method-url { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
.detail-url { font-family:var(--mono); font-size:11px; color:var(--muted); word-break:break-all; }
.detail-sub-label { font-size:10px; font-weight:600; color:var(--dim); margin-bottom:4px; margin-top:8px; }
.detail-code { font-family:var(--mono); font-size:11px; background:#1e293b; color:#e2e8f0; padding:10px 12px; border-radius:6px; overflow-x:auto; white-space:pre; max-height:200px; overflow-y:auto; }
.detail-code--err { background:#450a0a; color:#fca5a5; }
.detail-code--headers { background:#0c1a2e; color:#93c5fd; }

/* ── Method badges ── */
.badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; flex-shrink:0; border:1px solid transparent; }
.badge-get    { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
.badge-post   { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; }
.badge-patch  { background:#fff7ed; color:#c2410c; border-color:#fed7aa; }
.badge-put    { background:#fefce8; color:#854d0e; border-color:#fde68a; }
.badge-delete { background:#fef2f2; color:#b91c1c; border-color:#fecaca; }

/* ── Footer ── */
.footer { text-align:center; padding:24px; color:var(--dim); font-size:12px; border-top:1px solid var(--border); background:var(--surface); }

@media print {
  .toolbar { position:static; }
  details { break-inside:avoid; }
}
</style>
</head>
<body>

<!-- HEADER -->
<header class="header">
  <div class="header-top">
    <div class="header-brand">
      <div class="header-icon">🔬</div>
      <div>
        <div class="header-title">CAPI API Test Report</div>
        <div class="header-sub">Avaloq API Test Simulator — Automated Execution Report</div>
      </div>
    </div>
    <span class="badge-status ${parseFloat(pct) === 100 ? "badge-status--pass" : parseFloat(pct) >= 80 ? "badge-status--partial" : "badge-status--fail"}">
      ${pct}% Pass Rate
    </span>
  </div>
  <div class="header-meta">
    <div class="meta-chip">🗓 <strong>Started:</strong> ${new Date(s.startedAt).toLocaleString()}</div>
    <div class="meta-chip">🏁 <strong>Finished:</strong> ${new Date(s.finishedAt).toLocaleString()}</div>
    <div class="meta-chip">⏱ <strong>Duration:</strong> ${durationSec}s</div>
    <div class="meta-chip">⬡ <strong>Mode:</strong> ${s.mode === "flow" ? "Execution Flow" : "Independent"}</div>
    <div class="meta-chip">🌐 <strong>Environment:</strong> ${s.environment}</div>
    <div class="meta-chip">🔗 <strong>Base URL:</strong> ${s.baseUrl}</div>
    <div class="meta-chip">🆔 <strong>Execution ID:</strong> ${s.id}</div>
  </div>
</header>

<!-- STATS -->
<div class="stats-grid">
  <div class="stat-card stat-card--total"><div class="stat-value">${total}</div><div class="stat-label">Total</div></div>
  <div class="stat-card stat-card--pass"><div class="stat-value">${passed}</div><div class="stat-label">Passed</div></div>
  <div class="stat-card stat-card--fail"><div class="stat-value">${failed}</div><div class="stat-label">Failed</div></div>
  <div class="stat-card stat-card--rate"><div class="stat-value">${pct}%</div><div class="stat-label">Pass Rate</div></div>
  <div class="stat-card stat-card--lat"><div class="stat-value">${avgLat}ms</div><div class="stat-label">Avg Latency</div></div>
  <div class="stat-card stat-card--dur"><div class="stat-value">${durationSec}s</div><div class="stat-label">Duration</div></div>
</div>

<!-- CHARTS -->
<div class="charts">
  <!-- Donut -->
  <div class="chart-card">
    <div class="chart-title">Pass / Fail Breakdown</div>
    <div class="donut-wrap">
      <svg class="donut-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="#fee2e2" stroke-width="18"/>
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="#22c55e" stroke-width="18"
          stroke-dasharray="${passArc.toFixed(2)} ${failArc.toFixed(2)}"
          stroke-dashoffset="${(circ * 0.25).toFixed(2)}"
          stroke-linecap="round"/>
        <text x="60" y="56" text-anchor="middle" font-size="18" font-weight="800" fill="#0f172a">${pct}%</text>
        <text x="60" y="70" text-anchor="middle" font-size="9" fill="#94a3b8">pass rate</text>
      </svg>
      <div class="donut-legend">
        <div class="legend-item"><span class="legend-dot" style="background:#22c55e"></span> Passed <span class="legend-num" style="color:#16a34a">${passed}</span></div>
        <div class="legend-item"><span class="legend-dot" style="background:#ef4444"></span> Failed <span class="legend-num" style="color:#dc2626">${failed}</span></div>
        ${pending > 0 ? `<div class="legend-item"><span class="legend-dot" style="background:#94a3b8"></span> Pending <span class="legend-num">${pending}</span></div>` : ""}
      </div>
    </div>
  </div>

  <!-- Method breakdown -->
  <div class="chart-card">
    <div class="chart-title">By HTTP Method</div>
    ${methodRows || '<div style="color:var(--dim);font-size:12px">No executed cases</div>'}
  </div>
</div>

<!-- TIMELINE -->
<div class="timeline-section">
  <div class="timeline-card">
    <div class="chart-title">Execution Timeline (${Math.min(s.cases.length, 200)} cases${s.cases.length > 200 ? ` of ${s.cases.length}` : ""})</div>
    <div class="tl-strip">${timelineDots}</div>
    <div style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--dim)">
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#22c55e;margin-right:4px"></span>Pass</span>
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#ef4444;margin-right:4px"></span>Fail</span>
      ${pending > 0 ? '<span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#94a3b8;margin-right:4px"></span>Pending</span>' : ""}
    </div>
  </div>
</div>

<!-- TOOLBAR -->
<div class="toolbar">
  <span class="toolbar-title">Test Results</span>
  <div class="tb-filter">
    <button class="tb-btn active" id="btn-all" onclick="filter('all')">All (${total})</button>
    <button class="tb-btn" id="btn-pass" onclick="filter('pass')">✓ Pass (${passed})</button>
    <button class="tb-btn" id="btn-fail" onclick="filter('fail')">✗ Fail (${failed})</button>
  </div>
  <input class="tb-search" type="search" placeholder="🔍 Search test name…" oninput="search(this.value)" />
  <span class="tb-count" id="visible-count">${total} of ${total}</span>
  <button class="tb-collapse" onclick="collapseAll()">Collapse All</button>
</div>

<!-- RESULTS -->
<div class="results" id="results">
${testRows}
</div>

<!-- FOOTER -->
<footer class="footer">
  Generated by <strong>CAPI API Test Simulator</strong> · Execution ID: ${s.id} · ${new Date(s.finishedAt).toLocaleString()}
</footer>

<script>
var allRows = Array.from(document.querySelectorAll('.test-row'));
var currentFilter = 'all';
var currentSearch = '';

function applyFilters() {
  var visible = 0;
  allRows.forEach(function(row) {
    var matchFilter = currentFilter === 'all'
      || (currentFilter === 'pass' && row.classList.contains('row-pass'))
      || (currentFilter === 'fail' && row.classList.contains('row-fail'));
    var title = row.querySelector('.ts-title');
    var path  = row.querySelector('.ts-path');
    var text  = ((title ? title.textContent : '') + ' ' + (path ? path.textContent : '')).toLowerCase();
    var matchSearch = !currentSearch || text.includes(currentSearch.toLowerCase());
    var show = matchFilter && matchSearch;
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  document.getElementById('visible-count').textContent = visible + ' of ' + allRows.length;
}

function filter(f) {
  currentFilter = f;
  document.getElementById('btn-all').className  = 'tb-btn' + (f === 'all'  ? ' active' : '');
  document.getElementById('btn-pass').className = 'tb-btn' + (f === 'pass' ? ' active' : '');
  document.getElementById('btn-fail').className = 'tb-btn' + (f === 'fail' ? ' active-fail' : '');
  applyFilters();
}

function search(v) { currentSearch = v; applyFilters(); }

function collapseAll() {
  document.querySelectorAll('details[open]').forEach(function(d) { d.removeAttribute('open'); });
}
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// DOWNLOAD BOTH FILES
// ─────────────────────────────────────────────────────────────
function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadExecution(s: ExecutionSummary) {
  const prefix = `capi_exec_${s.id}`;
  triggerDownload(generateCSV(s),  `${prefix}_results.csv`,  "text/csv;charset=utf-8;");
  // small delay so both downloads don't collide in some browsers
  setTimeout(() => {
    triggerDownload(generateHTML(s), `${prefix}_report.html`, "text/html;charset=utf-8;");
  }, 300);
}

// ─────────────────────────────────────────────────────────────
// PARSE CSV BACK (for "Load Previous" feature)
// ─────────────────────────────────────────────────────────────
export function parseCSVToSummary(csvText: string): ExecutionSummary | null {
  try {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return null;

    const unquote = (s: string) => s.replace(/^"|"$/g, "").replace(/""/g, '"');
    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (line[i] === "," && !inQ) {
          result.push(cur); cur = "";
        } else {
          cur += line[i];
        }
      }
      result.push(cur);
      return result;
    };

    const headers = parseRow(lines[0]);
    const rows    = lines.slice(1).map(parseRow);

    const col = (row: string[], h: string) => unquote(row[headers.indexOf(h)] ?? "");

    // Extract execution metadata from first row
    const first = rows[0];
    const execId  = col(first, "executionId")  || `loaded_${Date.now()}`;
    const started = col(first, "startedAt")    || new Date().toISOString();
    const mode    = (col(first, "mode") as "flow" | "independent") || "flow";
    const env     = col(first, "environment")  || "Unknown";

    const cases: TestCase[] = rows.map((row, i) => {
      const status = col(row, "status") as TestCase["status"];
      return {
        id:          `loaded-${i}`,
        seq:         parseInt(col(row, "seq")) || i + 1,
        runGroup:    parseInt(col(row, "runGroup")) || 1,
        apiTitle:    col(row, "apiTitle"),
        resourceName: col(row, "resourceName"),
        method:      col(row, "method"),
        path:        col(row, "path"),
        body:        null,
        dataSource:  "file" as const,
        createdAt:   started,
        status,
        httpStatus:  col(row, "httpStatus") ? (parseInt(col(row, "httpStatus")) || col(row, "httpStatus")) : undefined,
        latency:     col(row, "latency_ms") ? parseInt(col(row, "latency_ms")) || undefined : undefined,
        resolvedUrl: col(row, "resolvedUrl") || undefined,
        result:      (() => { try { return JSON.parse(col(row, "res_body")); } catch { return col(row, "res_body") || undefined; } })(),
      } as TestCase;
    });

    return {
      id: execId,
      startedAt: started,
      finishedAt: started,
      mode,
      environment: env,
      baseUrl: "",
      cases,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// SAVE TO FOLDER  (File System Access API)
// Creates a timestamped sub-folder and writes chunked CSV files
// + a single HTML report into it.
// Falls back to browser downloads if the API is unavailable.
// ─────────────────────────────────────────────────────────────
async function writeFile(
  dir: FileSystemDirectoryHandle,
  name: string,
  content: string,
): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const w  = await (fh as any).createWritable();
  await w.write(content);
  await w.close();
}

export async function saveToFolder(
  dirHandle: FileSystemDirectoryHandle,
  s: ExecutionSummary,
  rowsPerFile: number = 100,
): Promise<string[]> {
  // Create a sub-folder named after the execution ID
  const subDir = await dirHandle.getDirectoryHandle(s.id, { create: true });

  const savedFiles: string[] = [];

  // ── Chunked CSVs ──────────────────────────────────────────
  const csvHeaders = [
    "seq","runGroup","apiTitle","resourceName","method",
    "path","resolvedUrl","body","dataSource",
    "status","httpStatus","latency_ms","res_body","res_headers",
    "startedAt","executionId","mode","environment",
  ];

  const esc = (v: any): string => {
    const str = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const totalChunks = Math.max(1, Math.ceil(s.cases.length / rowsPerFile));
  const multiChunk  = totalChunks > 1;

  for (let ci = 0; ci < totalChunks; ci++) {
    const slice = s.cases.slice(ci * rowsPerFile, (ci + 1) * rowsPerFile);
    const rows  = slice.map(tc => [
      tc.seq, tc.runGroup, tc.apiTitle, tc.resourceName, tc.method,
      tc.path, tc.resolvedUrl ?? "", tc.body ?? "", tc.dataSource,
      tc.status, tc.httpStatus ?? "", tc.latency ?? "",
      tc.result ?? "", tc.headers ?? "",
      s.startedAt, s.id, s.mode, s.environment,
    ].map(esc).join(","));

    const csvContent = [csvHeaders.join(","), ...rows].join("\r\n");
    const partTag    = multiChunk ? `_part${String(ci + 1).padStart(3, "0")}` : "";
    const csvName    = `results${partTag}.csv`;

    await writeFile(subDir, csvName, csvContent);
    savedFiles.push(`${s.id}/${csvName}`);
  }

  // ── HTML report (single file, all cases) ─────────────────
  const htmlName = "report.html";
  await writeFile(subDir, htmlName, generateHTML(s));
  savedFiles.push(`${s.id}/${htmlName}`);

  return savedFiles;
}
