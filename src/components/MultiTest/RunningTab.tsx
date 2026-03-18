import React from "react";
import { testStore, TestCase, executionHistory, rest, envStore } from "./utils";
import { StatusBadge } from "./AtomComponents";
import { mtT as t } from "./useMtT";

// ═══════════════════════════════════════════════════════════════
// RUNNING TAB  — live execution view (BizWizard-style)
// Polls testStore every 150ms so stat cards + case list update
// in real time while ReadyForTestTab is executing.
// ═══════════════════════════════════════════════════════════════

const MONO = "'JetBrains Mono','Fira Code',monospace";

const METHOD_COLORS: Record<string, string> = {
  POST: "#34d399", GET: "#60a5fa", PATCH: "#fb923c",
  PUT: "#f59e0b", DELETE: "#f87171", RPC: "#a78bfa",
};

// ── Small atoms ──────────────────────────────────────────────────
function MChip({ method }: { method: string }) {
  const c = METHOD_COLORS[method?.toUpperCase()] || "#8b949e";
  return (
    <span style={{
      background: c + "18", border: `1px solid ${c}40`, color: c,
      borderRadius: 4, padding: "1px 7px", fontFamily: MONO, fontSize: 10,
      fontWeight: 700, whiteSpace: "nowrap" as const, flexShrink: 0,
    }}>
      {method?.toUpperCase()}
    </span>
  );
}

function StatCard({ value, label, color, icon }: {
  value: string | number; label: string; color: string; icon: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 90, padding: "18px 14px", borderRadius: 12,
      textAlign: "center", background: color + "0c", border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{
        fontFamily: MONO, fontSize: 26, fontWeight: 800,
        color, lineHeight: 1, marginBottom: 5,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 700,
        color, opacity: 0.65, textTransform: "uppercase" as const, letterSpacing: 1,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Case row ─────────────────────────────────────────────────────
// ── Expandable case row (same design as ReadyForTestTab TcRow) ────

const STATUS_COLORS_RT = {
  pending: { bg: "#8b949e15", border: "#8b949e30", dot: "#8b949e" },
  running: { bg: "#f59e0b15", border: "#f59e0b44", dot: "#f59e0b" },
  passed: { bg: "#34d39915", border: "#34d39940", dot: "#34d399" },
  failed: { bg: "#f8717115", border: "#f8717140", dot: "#f87171" },
};

interface RtRowState {
  open: boolean;
  editUrl: string;
  editBody: string;
  editHeaders: string;
  bodyError: string | null;
  headersError: string | null;
  running: boolean;
  dirty: boolean;
}

class RtRow extends React.Component<{ tc: TestCase; onRefresh?: () => void }, RtRowState> {
  constructor(props: { tc: TestCase; onRefresh?: () => void }) {
    super(props);
    const { tc } = props;
    this.state = {
      open: false,
      editUrl: tc.resolvedUrl ?? tc.path,
      editBody: tc.body ? JSON.stringify(tc.body, null, 2) : "",
      editHeaders: JSON.stringify({ "Content-Type": "application/json", "Accept": "application/json" }, null, 2),
      bodyError: null,
      headersError: null,
      running: false,
      dirty: false,
    };
  }

  private playOne = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { tc, onRefresh } = this.props;
    const { editUrl, editBody, editHeaders } = this.state;

    let parsedBody: Record<string, any> | null = null;
    if (editBody.trim()) {
      try { parsedBody = JSON.parse(editBody); }
      catch { this.setState({ bodyError: "Invalid JSON — fix before running" }); return; }
    }
    let parsedHeaders: Record<string, string> = {};
    if (editHeaders.trim()) {
      try { parsedHeaders = JSON.parse(editHeaders); }
      catch { this.setState({ headersError: "Invalid JSON — fix headers before running" }); return; }
    }
    this.setState({ headersError: null, running: true, bodyError: null });
    tc.status = "running";
    onRefresh?.();

    const t0 = Date.now();
    try {
      await new Promise(r => setTimeout(r, 20 + Math.random() * 60));
      let path = tc.path;
      try { const u = new URL(editUrl); path = u.pathname + u.search; } catch { path = editUrl; }
      const r = await rest.req(tc.method, path, parsedBody || undefined);
      tc.status = r.status >= 200 && r.status < 300 ? "passed" : "failed";
      tc.httpStatus = r.status;
      tc.latency = Date.now() - t0;
      tc.result = r.body;
      tc.headers = r.headers;
      tc.resolvedUrl = editUrl;
      if (parsedBody) tc.body = parsedBody;
    } catch (err: any) {
      tc.status = "failed";
      tc.httpStatus = "ERR";
      tc.latency = Date.now() - t0;
      tc.result = { error: err.message };
    }
    this.setState({ running: false });
    onRefresh?.();
  };

  private resetEdits = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { tc } = this.props;
    this.setState({
      editUrl: tc.resolvedUrl ?? tc.path,
      editBody: tc.body ? JSON.stringify(tc.body, null, 2) : "",
      editHeaders: JSON.stringify({ "Content-Type": "application/json", "Accept": "application/json" }, null, 2),
      bodyError: null, headersError: null, dirty: false,
    });
  };

  render() {
    const { tc } = this.props;
    const { open, editUrl, editBody, editHeaders, bodyError, headersError, running, dirty } = this.state;

    const liveStatus = running ? "running" : tc.status;
    const sc = STATUS_COLORS_RT[liveStatus];
    const mc = METHOD_COLORS[tc.method?.toUpperCase()] || "#8b949e";
    const hasBody = ["POST", "PATCH", "PUT"].includes(tc.method?.toUpperCase());
    const isOk = tc.status === "passed";
    const isFail = tc.status === "failed";

    return (
      <div style={{
        borderRadius: 8, border: `1px solid ${sc.border}`,
        borderLeft: `3px solid ${sc.dot}`, background: sc.bg,
        transition: "border .15s", fontFamily: MONO,
        opacity: tc.status === "pending" ? 0.5 : 1,
      }}>

        {/* ══ HEADER ROW ══ */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px 9px 13px" }}>
          {/* Status dot / spinner */}
          <span style={{ fontFamily: MONO, fontSize: 13, color: sc.dot, flexShrink: 0, width: 16, textAlign: "center" as const, lineHeight: 1 }}>
            {liveStatus === "running"
              ? <span style={{ fontSize: 10, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              : liveStatus === "passed" ? "✓" : liveStatus === "failed" ? "✗" : "○"}
          </span>
          <span style={{
            fontSize: 10, color: "var(--cs-dim)",
            background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
            borderRadius: 4, padding: "1px 6px", flexShrink: 0,
          }}>#{tc.seq}</span>
          <span style={{ fontSize: 9, color: "var(--cs-dim)", flexShrink: 0, opacity: 0.7 }}>R{tc.runGroup}</span>
          {/* Method chip */}
          <span style={{
            background: mc + "18", border: `1px solid ${mc}40`, color: mc,
            borderRadius: 4, padding: "1px 6px", fontFamily: MONO, fontSize: 10,
            fontWeight: 700, whiteSpace: "nowrap" as const, flexShrink: 0,
          }}>{tc.method?.toUpperCase()}</span>
          {/* Title + path — click to expand */}
          <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            onClick={() => this.setState(s => ({ open: !s.open }))}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--cs-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {tc.apiTitle}
            </div>
            <div style={{ fontSize: 10, color: "var(--cs-dim)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {tc.path}
            </div>
          </div>
          {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
          {tc.latency != null && (
            <span style={{ fontSize: 10, color: "var(--cs-dim)", flexShrink: 0 }}>{tc.latency}ms</span>
          )}
          {dirty && (
            <span style={{
              fontSize: 9, color: "#f59e0b", background: "#f59e0b15",
              border: "1px solid #f59e0b33", borderRadius: 4, padding: "1px 6px",
              flexShrink: 0, fontWeight: 700,
            }}>EDITED</span>
          )}
          {/* Run button */}
          <button onClick={this.playOne} disabled={running} title="Re-run this request"
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 6,
              border: `1.5px solid ${running ? "var(--cs-border)" : mc + "88"}`,
              background: running ? "var(--cs-surface-2)" : mc + "18",
              color: running ? "var(--cs-dim)" : mc,
              cursor: running ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, transition: "all .15s",
            }}
            onMouseEnter={e => { if (!running) (e.currentTarget as HTMLButtonElement).style.background = mc + "35"; }}
            onMouseLeave={e => { if (!running) (e.currentTarget as HTMLButtonElement).style.background = mc + "18"; }}>
            {running
              ? <span style={{ fontSize: 10, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              : "▶"}
          </button>
          {/* Expand ▼ / ▲ */}
          <button onClick={() => this.setState(s => ({ open: !s.open }))}
            style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: 5,
              border: "1px solid var(--cs-border-sub)", background: "transparent",
              color: "var(--cs-dim)", cursor: "pointer", fontSize: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {open ? "▲" : "▼"}
          </button>
        </div>

        {/* ══ EXPANDED PANEL ══ */}
        {open && (
          <div style={{ borderTop: `1px solid ${sc.border}`, display: "flex", flexDirection: "column" as const }}>

            {/* ── REQUEST header bar ── */}
            <div style={{
              padding: "10px 14px 4px",
              borderBottom: "1px solid var(--cs-border-sub)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: mc + "08",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, color: mc, letterSpacing: 1, textTransform: "uppercase" as const }}>
                  ▶ REQUEST
                </span>
                <span style={{
                  background: mc + "18", border: `1px solid ${mc}40`, color: mc,
                  borderRadius: 4, padding: "1px 6px", fontFamily: MONO, fontSize: 10, fontWeight: 700,
                }}>{tc.method?.toUpperCase()}</span>
              </div>
              {dirty && (
                <button onClick={this.resetEdits} style={{
                  fontSize: 9, color: "#f59e0b", background: "transparent",
                  border: "1px solid #f59e0b33", borderRadius: 4, padding: "1px 7px",
                  cursor: "pointer", fontFamily: MONO,
                }}>↺ Reset edits</button>
              )}
            </div>

            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 10 }}>

              {/* Request URL */}
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5 }}>
                  🌐 Request URL
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: mc, background: mc + "18",
                    border: `1px solid ${mc}40`, borderRadius: 5, padding: "6px 10px", flexShrink: 0,
                  }}>{tc.method?.toUpperCase()}</span>
                  <input
                    value={editUrl}
                    onChange={e => this.setState({ editUrl: e.target.value, dirty: true })}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); this.playOne(e as any); } }}
                    spellCheck={false}
                    style={{
                      flex: 1, padding: "7px 12px", fontFamily: MONO, fontSize: 11,
                      background: "var(--cs-bg)", borderRadius: 7, color: "var(--cs-text)",
                      border: `1px solid ${dirty ? "#f59e0b66" : "var(--cs-border)"}`,
                      outline: "none", transition: "border-color .15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = mc + "88")}
                    onBlur={e => (e.target.style.borderColor = dirty ? "#f59e0b66" : "var(--cs-border)")}
                  />
                </div>
              </div>

              {/* Request Headers */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8, textTransform: "uppercase" as const }}>
                    📋 Headers <span style={{ opacity: 0.5, fontWeight: 400 }}>JSON</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {headersError && (
                      <span style={{ fontSize: 9, color: "#f87171", background: "#f8717115", border: "1px solid #f8717133", borderRadius: 4, padding: "2px 8px" }}>
                        ⚠ {headersError}
                      </span>
                    )}
                    <button onClick={e => {
                      e.stopPropagation();
                      try { this.setState({ editHeaders: JSON.stringify(JSON.parse(editHeaders), null, 2), headersError: null }); }
                      catch { this.setState({ headersError: "Cannot format — invalid JSON" }); }
                    }} style={{
                      fontSize: 9, color: "#60a5fa", background: "transparent",
                      border: "1px solid #60a5fa33", borderRadius: 4, padding: "1px 7px",
                      cursor: "pointer", fontFamily: MONO,
                    }}>{ } Format</button>
                  </div>
                </div>
                <textarea
                  value={editHeaders}
                  onChange={e => this.setState({ editHeaders: e.target.value, dirty: true, headersError: null })}
                  spellCheck={false}
                  rows={Math.min(10, Math.max(3, editHeaders.split("\n").length + 1))}
                  style={{
                    width: "100%", padding: "10px 12px", fontFamily: MONO, fontSize: 11,
                    background: "var(--cs-bg)", color: "var(--cs-text)",
                    border: `1px solid ${headersError ? "#f87171" : dirty ? "#f59e0b66" : "var(--cs-border)"}`,
                    borderRadius: 7, outline: "none", resize: "vertical" as const,
                    lineHeight: 1.6, transition: "border-color .15s", boxSizing: "border-box" as const,
                  }}
                  onFocus={e => (e.target.style.borderColor = mc + "88")}
                  onBlur={e => (e.target.style.borderColor = headersError ? "#f87171" : dirty ? "#f59e0b66" : "var(--cs-border)")}
                />
              </div>

              {/* Request Body — POST / PATCH / PUT only */}
              {hasBody && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8, textTransform: "uppercase" as const }}>
                      📦 Request Body <span style={{ opacity: 0.5, fontWeight: 400 }}>JSON</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {bodyError && (
                        <span style={{ fontSize: 9, color: "#f87171", background: "#f8717115", border: "1px solid #f8717133", borderRadius: 4, padding: "2px 8px" }}>
                          ⚠ {bodyError}
                        </span>
                      )}
                      <button onClick={e => {
                        e.stopPropagation();
                        try { this.setState({ editBody: JSON.stringify(JSON.parse(editBody), null, 2), bodyError: null }); }
                        catch { this.setState({ bodyError: "Cannot format — invalid JSON" }); }
                      }} style={{
                        fontSize: 9, color: "#60a5fa", background: "transparent",
                        border: "1px solid #60a5fa33", borderRadius: 4, padding: "1px 7px",
                        cursor: "pointer", fontFamily: MONO,
                      }}>{ } Format</button>
                    </div>
                  </div>
                  <textarea
                    value={editBody}
                    onChange={e => this.setState({ editBody: e.target.value, dirty: true, bodyError: null })}
                    spellCheck={false}
                    rows={Math.min(14, Math.max(4, editBody.split("\n").length + 1))}
                    style={{
                      width: "100%", padding: "10px 12px", fontFamily: MONO, fontSize: 11,
                      background: "var(--cs-bg)", color: "var(--cs-text)",
                      border: `1px solid ${bodyError ? "#f87171" : dirty ? "#f59e0b66" : "var(--cs-border)"}`,
                      borderRadius: 7, outline: "none", resize: "vertical" as const,
                      lineHeight: 1.6, transition: "border-color .15s", boxSizing: "border-box" as const,
                    }}
                    onFocus={e => (e.target.style.borderColor = mc + "88")}
                    onBlur={e => (e.target.style.borderColor = bodyError ? "#f87171" : dirty ? "#f59e0b66" : "var(--cs-border)")}
                  />
                </div>
              )}

              {/* Run button */}
              <button
                onClick={this.playOne}
                disabled={running || !!bodyError || !!headersError}
                style={{
                  alignSelf: "flex-start" as const,
                  padding: "8px 22px", borderRadius: 7,
                  cursor: running || !!bodyError || !!headersError ? "not-allowed" : "pointer",
                  background: running || !!bodyError || !!headersError
                    ? "var(--cs-surface-2)"
                    : `linear-gradient(135deg, ${mc}22, ${mc}44)`,
                  border: `1.5px solid ${running || !!bodyError || !!headersError ? "var(--cs-border)" : mc + "88"}`,
                  color: running || !!bodyError || !!headersError ? "var(--cs-dim)" : mc,
                  fontFamily: MONO, fontSize: 12, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 8,
                  opacity: running || !!bodyError || !!headersError ? 0.6 : 1,
                  transition: "all .15s",
                }}>
                {running ? "⟳  Running…" : `▶  Run  ${tc.method?.toUpperCase()}  ${tc.path}`}
              </button>
            </div>

            {/* ── RESPONSE SECTION — shown after any execution ── */}
            {tc.result != null && (() => {
              const resCol = isOk ? "#34d399" : isFail ? "#f87171" : "var(--cs-muted)";
              const resBg = isOk ? "#34d39908" : isFail ? "#f8717108" : "var(--cs-bg)";
              const resBrd = isOk ? "#34d39933" : isFail ? "#f8717133" : "var(--cs-border-sub)";
              return (
                <div style={{ borderTop: `1px solid ${resBrd}` }}>
                  {/* Response header bar */}
                  <div style={{
                    padding: "10px 14px 4px", borderBottom: `1px solid ${resBrd}`,
                    background: resBg, display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, color: resCol, letterSpacing: 1, textTransform: "uppercase" as const }}>
                      ◀ RESPONSE
                    </span>
                    {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
                    {tc.latency != null && (
                      <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>{tc.latency}ms</span>
                    )}
                    {tc.resolvedUrl && (
                      <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1 }}>
                        → {tc.resolvedUrl}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
                    {/* Response Headers */}
                    {tc.headers && Object.keys(tc.headers).length > 0 && (
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5 }}>
                          📋 Headers
                        </div>
                        <div style={{
                          fontFamily: MONO, fontSize: 10, borderRadius: 7, padding: "8px 12px",
                          background: "var(--cs-bg)", border: `1px solid ${resBrd}`,
                          color: "var(--cs-muted)", lineHeight: 1.7,
                        }}>
                          {Object.entries(tc.headers).map(([k, v]) => (
                            <div key={k}>
                              <span style={{ color: "#60a5fa" }}>{k}</span>
                              <span style={{ color: "var(--cs-dim)" }}>: </span>
                              <span>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Response Body */}
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5 }}>
                        📦 Body
                      </div>
                      <pre style={{
                        fontFamily: MONO, fontSize: 10, margin: 0,
                        background: resBg, border: `1px solid ${resBrd}`,
                        borderRadius: 7, padding: "10px 12px", overflowX: "auto" as const,
                        maxHeight: 300, color: resCol, lineHeight: 1.55,
                      }}>
                        {JSON.stringify(tc.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Meta footer ── */}
            <div style={{
              display: "flex", gap: 14, fontSize: 9, color: "var(--cs-dim)",
              flexWrap: "wrap" as const, padding: "8px 14px",
              borderTop: "1px solid var(--cs-border-sub)",
              background: "var(--cs-surface-2)",
            }}>
              <span>Created: {new Date(tc.createdAt).toLocaleTimeString()}</span>
              <span>Source: <strong style={{ color: "var(--cs-muted)" }}>{tc.dataSource}</strong></span>
              {tc.fileSource && <span>File: {tc.fileSource}</span>}
              {dirty && <span style={{ color: "#f59e0b" }}>⚠ Request has unsaved edits</span>}
            </div>
          </div>
        )}
      </div>
    );
  }
}


// ── Main component ────────────────────────────────────────────────
const PAGE_SIZES = [10, 50, 100, 150] as const;

interface LoadedExecution {
  id: string; startedAt: string; finishedAt: string;
  mode: "flow" | "independent"; environment: string; baseUrl: string;
  cases: TestCase[];
}

interface RunningTabState {
  tick: number;
  pageIndex: number;
  pageSize: typeof PAGE_SIZES[number];
  loadedExecution: LoadedExecution | null;
}

export class RunningTab extends React.Component<{}, RunningTabState> {
  state: RunningTabState = { tick: 0, pageIndex: 0, pageSize: 10, loadedExecution: null };
  private pollId: ReturnType<typeof setInterval> | null = null;
  private bottomRef = React.createRef<HTMLDivElement>();
  private fileRef = React.createRef<HTMLInputElement>();

  componentDidMount() {
    // Inject spin keyframe if needed
    if (typeof document !== "undefined" && !document.getElementById("rt-spin")) {
      const s = document.createElement("style");
      s.id = "rt-spin";
      s.textContent = `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
      document.head.appendChild(s);
    }
    // Poll every 150ms for live updates
    this.pollId = setInterval(() => this.setState(s => ({ tick: s.tick + 1 })), 150);
  }

  componentDidUpdate(_: {}, prev: RunningTabState) {
    // Auto-scroll to bottom only while actively running
    const isLive = testStore.cases.some(c => c.status === "running");
    if (isLive && prev.tick !== this.state.tick) {
      this.bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  componentWillUnmount() {
    if (this.pollId) clearInterval(this.pollId);
  }

  private loadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      import("./reportGenerator").then(({ parseCSVToSummary }) => {
        const summary = parseCSVToSummary(text);
        if (summary) {
          this.setState({ loadedExecution: summary as LoadedExecution, pageIndex: 0 });
        } else {
          alert(t("errors.csvParseFailed"));
        }
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  private downloadCurrent = () => {
    const { loadedExecution } = this.state;
    import("./reportGenerator").then(({ downloadExecution }) => {
      if (loadedExecution) {
        downloadExecution(loadedExecution);
        return;
      }
      const last = executionHistory.last;
      if (!last) return;
      const summary = { ...last, cases: [...testStore.cases] };
      downloadExecution(summary);
    });
  };

  render() {
    const { pageIndex, pageSize, loadedExecution } = this.state;
    const liveCases = testStore.cases;
    const isViewingLoaded = !!loadedExecution;
    const cases = isViewingLoaded ? loadedExecution.cases : liveCases;

    const isLiveMode = executionHistory.outputMode === "live";
    const hasLastExec = !!executionHistory.last || liveCases.length > 0;
    const liveRunning = liveCases.some(c => c.status === "running");

    // ── Action bar (always visible) ──
    const actionBar = (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const,
        padding: "14px 24px", background: "var(--cs-surface-2)",
        borderBottom: "1px solid var(--cs-border)", fontFamily: MONO,
      }}>
        {/* Output mode indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
          borderRadius: 6,
          background: isLiveMode ? "#34d39912" : "#f59e0b12",
          border: `1px solid ${isLiveMode ? "#34d39944" : "#f59e0b44"}`,
          fontSize: 11, fontWeight: 700,
          color: isLiveMode ? "#34d399" : "#f59e0b",
        }}>
          {isLiveMode ? "🔴 Live Mode" : "💾 Save Mode"}
        </div>

        {/* Folder info (Save mode only) */}
        {!isLiveMode && (
          <>
            {executionHistory.dirHandle ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
                borderRadius: 6, background: "#6366f112", border: "1px solid #6366f133",
                fontSize: 11, color: "#6366f1", fontFamily: MONO,
              }}>
                <span>📁</span>
                <span style={{ fontWeight: 700 }}>{executionHistory.dirHandle.name}</span>
                <span style={{ color: "var(--cs-dim)", fontSize: 10 }}>· {executionHistory.rowsPerFile} rows/file</span>
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
                borderRadius: 6, background: "#f8717112", border: "1px solid #f8717133",
                fontSize: 11, color: "#f87171", fontFamily: MONO, fontWeight: 700,
              }}>
                ⚠ No folder selected — go to Ready for Test to pick one
              </div>
            )}
          </>
        )}

        <div style={{ width: 1, height: 20, background: "var(--cs-border)" }} />

        {/* Download current / last execution */}
        {(hasLastExec || isViewingLoaded) && (
          <button
            onClick={this.downloadCurrent}
            style={{
              background: "#6366f118", border: "1.5px solid #6366f166",
              color: "#6366f1", borderRadius: 6, padding: "4px 14px",
              fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
            }}
            title="Download CSV + HTML report for the current execution"
          >
            ⬇ Download Report
          </button>
        )}

        {/* Load from CSV file */}
        <button
          onClick={() => this.fileRef.current?.click()}
          style={{
            background: "transparent", border: "1px solid var(--cs-border)",
            color: "var(--cs-muted)", borderRadius: 6, padding: "4px 14px",
            fontFamily: MONO, fontSize: 11, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
          }}
          title="Load a previous execution CSV file"
        >
          📂 Load Previous CSV
        </button>
        <input
          ref={this.fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={this.loadCSV}
        />

        {/* Clear loaded execution */}
        {isViewingLoaded && (
          <button
            onClick={() => this.setState({ loadedExecution: null, pageIndex: 0 })}
            style={{
              background: "transparent", border: "1px solid #f8717133",
              color: "#f87171", borderRadius: 6, padding: "4px 12px",
              fontFamily: MONO, fontSize: 11, cursor: "pointer",
            }}
          >
            ✕ Close Loaded
          </button>
        )}

        {isViewingLoaded && (
          <span style={{ fontSize: 11, color: "var(--cs-dim)", marginLeft: "auto" }}>
            📂 Viewing: <strong style={{ color: "var(--cs-muted)" }}>{loadedExecution!.id}</strong>
            {" · "}{loadedExecution!.environment} · {loadedExecution!.mode}
          </span>
        )}
      </div>
    );

    if (cases.length === 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column" as const }}>
          {actionBar}
          <div style={{
            display: "flex", flexDirection: "column" as const,
            alignItems: "center", justifyContent: "center",
            padding: "60px 24px", gap: 12, textAlign: "center" as const,
          }}>
            <span style={{ fontSize: 36 }}>🔍</span>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "var(--cs-muted)" }}>
              No execution yet
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-dim)", maxWidth: 320, lineHeight: 1.6 }}>
              Go to <strong>Ready for Test</strong>, load test cases and click
              <strong> ▶▶ Execute Flow</strong> or <strong>⚗ Execute Independent</strong>.
              Results will appear here in real time.
            </div>
          </div>
        </div>
      );
    }

    const total = cases.length;
    const pending = cases.filter(c => c.status === "pending").length;
    const passed = cases.filter(c => c.status === "passed").length;
    const failed = cases.filter(c => c.status === "failed").length;
    const running = cases.filter(c => c.status === "running").length;
    const executed = passed + failed;
    const avgLat = executed > 0
      ? Math.round(cases.filter(c => c.latency != null).reduce((a, c) => a + (c.latency || 0), 0) / executed)
      : 0;

    const isLive = running > 0;
    const pct = executed > 0 ? Math.round((passed / executed) * 100) : 0;
    const pctCol = pct === 100 ? "#34d399" : pct >= 70 ? "#f59e0b" : "#f87171";

    // Pagination
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(pageIndex, totalPages - 1);
    const pageStart = safePage * pageSize;
    const pageEnd = Math.min(pageStart + pageSize, total);
    const pageSlice = cases.slice(pageStart, pageEnd);

    // While live, only auto-advance if the currently-running case is NOT on the visible page
    const lastPage = totalPages - 1;
    if (!isViewingLoaded && isLive) {
      const runningCase = cases.findIndex(c => c.status === "running");
      const runningPage = runningCase >= 0 ? Math.floor(runningCase / pageSize) : -1;
      // Only jump if the running case is on a page the user can't see right now
      if (runningPage >= 0 && runningPage !== safePage && runningPage === lastPage) {
        setTimeout(() => this.setState({ pageIndex: runningPage }), 0);
      }
    }

    const btnBase: React.CSSProperties = {
      background: "transparent", border: "1px solid var(--cs-border-sub)",
      color: "var(--cs-muted)", borderRadius: 6, padding: "3px 10px",
      fontFamily: MONO, fontSize: 11, cursor: "pointer",
    };
    const dis: React.CSSProperties = { opacity: 0.4, cursor: "not-allowed" };

    return (
      <div style={{ display: "flex", flexDirection: "column" as const }}>
        {actionBar}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 16, padding: "20px 24px", fontFamily: MONO }}>

          {/* ── Live indicator + Stop button ── */}
          {isLive && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 8, background: "#f59e0b10", border: "1px solid #f59e0b33" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block", boxShadow: "0 0 6px #f59e0b", animation: "spin 2s linear infinite" }} />
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#f59e0b", flex: 1 }}>LIVE — execution in progress</span>
              <button
                onClick={() => { testStore.stopFlag = true; }}
                style={{
                  background: "#f8717118", border: "1.5px solid #f87171aa",
                  color: "#f87171", borderRadius: 7, padding: "5px 16px",
                  fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "all .15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f8717130"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f8717118"; }}
              >
                ■ Stop
              </button>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            <StatCard value={total} label="Total" color="#58a6ff" icon="📋" />
            <StatCard value={pending} label="Pending" color="#8b949e" icon="○" />
            <StatCard value={passed} label="Passed" color="#34d399" icon="✓" />
            <StatCard value={failed} label="Failed" color="#f87171" icon="✗" />
            <StatCard value={avgLat > 0 ? `${avgLat}ms` : "—"} label="Avg Lat" color="#f59e0b" icon="⚡" />
          </div>

          {/* ── Progress bar ── */}
          {(isLive || executed > 0) && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", marginBottom: 6 }}>
                <span>Execution progress ({executed} / {total} executed)</span>
                {executed > 0 && <span style={{ fontWeight: 700, color: pctCol }}>{pct}% pass</span>}
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--cs-surface-2)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${(executed / total) * 100}%`, background: `linear-gradient(90deg, #34d399, ${pctCol})`, transition: "width .3s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 6, fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
                {passed > 0 && <span style={{ color: "#34d399" }}>■ {passed} passed</span>}
                {failed > 0 && <span style={{ color: "#f87171" }}>■ {failed} failed</span>}
                {pending > 0 && <span>■ {pending} pending</span>}
              </div>
            </div>
          )}

          {/* ── Method breakdown (post-run) ── */}
          {!isLive && executed > 0 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 8 }}>By HTTP Method</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {(["POST", "GET", "PATCH", "PUT", "DELETE"] as const).map(m => {
                  const mCases = cases.filter(c => c.method.toUpperCase() === m && c.status !== "pending");
                  if (mCases.length === 0) return null;
                  const ok = mCases.filter(c => c.status === "passed").length;
                  const col = METHOD_COLORS[m];
                  const lat = mCases.filter(c => c.latency != null);
                  const avgM = lat.length > 0 ? Math.round(lat.reduce((a, c) => a + (c.latency || 0), 0) / lat.length) : 0;
                  return (
                    <div key={m} style={{ padding: "8px 13px", borderRadius: 8, background: col + "0a", border: `1px solid ${col}30` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <MChip method={m} />
                        <span style={{ fontFamily: MONO, fontSize: 10, color: col, fontWeight: 700 }}>{ok}/{mCases.length}</span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>{avgM}ms avg</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Pagination top ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--cs-dim)" }}>Cases per page:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {PAGE_SIZES.map(n => {
                  const active = pageSize === n;
                  return (
                    <button key={n} onClick={() => this.setState({ pageSize: n, pageIndex: 0 })} style={{
                      background: active ? "var(--cs-accent)20" : "var(--cs-surface-2)",
                      border: `1px solid ${active ? "var(--cs-accent)" : "var(--cs-border-sub)"}`,
                      color: active ? "var(--cs-accent)" : "var(--cs-muted)",
                      borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11,
                      fontWeight: active ? 700 : 400, cursor: "pointer",
                    }}>{n}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
              <button disabled={safePage === 0} onClick={() => this.setState({ pageIndex: 0 })} style={{ ...btnBase, ...(safePage === 0 ? dis : {}) }}>«</button>
              <button disabled={safePage === 0} onClick={() => this.setState({ pageIndex: safePage - 1 })} style={{ ...btnBase, ...(safePage === 0 ? dis : {}) }}>‹ Prev</button>
              {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                let start = Math.max(0, safePage - 4);
                const end = Math.min(totalPages, start + 9);
                start = Math.max(0, end - 9);
                const p = start + i;
                if (p >= totalPages) return null;
                const isCur = p === safePage;
                return (
                  <button key={p} onClick={() => this.setState({ pageIndex: p })} style={{
                    background: isCur ? "var(--cs-accent)" : "transparent",
                    border: `1px solid ${isCur ? "var(--cs-accent)" : "var(--cs-border-sub)"}`,
                    color: isCur ? "#0a0e1a" : "var(--cs-muted)",
                    borderRadius: 6, padding: "3px 9px", fontFamily: MONO, fontSize: 11,
                    fontWeight: isCur ? 800 : 400, cursor: "pointer", minWidth: 32,
                  }}>{p + 1}</button>
                );
              })}
              <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ pageIndex: safePage + 1 })} style={{ ...btnBase, ...(safePage >= totalPages - 1 ? dis : {}) }}>Next ›</button>
              <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ pageIndex: totalPages - 1 })} style={{ ...btnBase, ...(safePage >= totalPages - 1 ? dis : {}) }}>»</button>
            </div>
            <span style={{ fontSize: 11, color: "var(--cs-dim)" }}>
              {total > 0 ? `${pageStart + 1}–${pageEnd} of ${total.toLocaleString()} case${total !== 1 ? "s" : ""}` : "0 cases"}
            </span>
          </div>

          {/* ── Case list ── */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 8 }}>
              {isLive ? "Live Execution Stream" : "Results"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
              {pageSlice.map((tc, i) => (
                <RtRow key={tc.id} tc={tc} onRefresh={() => this.setState(s => ({ tick: s.tick + 1 }))} />
              ))}
            </div>
            <div ref={this.bottomRef} />
          </div>

          {/* ── Pagination bottom (full mirror of top) ── */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--cs-dim)" }}>Cases per page:</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {PAGE_SIZES.map(n => {
                    const active = pageSize === n;
                    return (
                      <button key={n} onClick={() => this.setState({ pageSize: n, pageIndex: 0 })} style={{
                        background: active ? "var(--cs-accent)20" : "var(--cs-surface-2)",
                        border: `1px solid ${active ? "var(--cs-accent)" : "var(--cs-border-sub)"}`,
                        color: active ? "var(--cs-accent)" : "var(--cs-muted)",
                        borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11,
                        fontWeight: active ? 700 : 400, cursor: "pointer",
                      }}>{n}</button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <button disabled={safePage === 0} onClick={() => this.setState({ pageIndex: 0 })} style={{ ...btnBase, ...(safePage === 0 ? dis : {}) }}>«</button>
                <button disabled={safePage === 0} onClick={() => this.setState({ pageIndex: safePage - 1 })} style={{ ...btnBase, ...(safePage === 0 ? dis : {}) }}>‹ Prev</button>
                {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                  let start = Math.max(0, safePage - 4);
                  const end = Math.min(totalPages, start + 9);
                  start = Math.max(0, end - 9);
                  const p = start + i;
                  if (p >= totalPages) return null;
                  const isCur = p === safePage;
                  return (
                    <button key={p} onClick={() => this.setState({ pageIndex: p })} style={{
                      background: isCur ? "var(--cs-accent)" : "transparent",
                      border: `1px solid ${isCur ? "var(--cs-accent)" : "var(--cs-border-sub)"}`,
                      color: isCur ? "#0a0e1a" : "var(--cs-muted)",
                      borderRadius: 6, padding: "3px 9px", fontFamily: MONO, fontSize: 11,
                      fontWeight: isCur ? 800 : 400, cursor: "pointer", minWidth: 32,
                    }}>{p + 1}</button>
                  );
                })}
                <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ pageIndex: safePage + 1 })} style={{ ...btnBase, ...(safePage >= totalPages - 1 ? dis : {}) }}>Next ›</button>
                <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ pageIndex: totalPages - 1 })} style={{ ...btnBase, ...(safePage >= totalPages - 1 ? dis : {}) }}>»</button>
              </div>
              <span style={{ fontSize: 11, color: "var(--cs-dim)" }}>
                {total > 0 ? `${pageStart + 1}–${pageEnd} of ${total.toLocaleString()} case${total !== 1 ? "s" : ""}` : "0 cases"}
              </span>
            </div>
          )}

        </div>
      </div>
    );
  }
}