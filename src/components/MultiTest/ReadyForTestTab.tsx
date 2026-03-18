import React from "react";
import { testStore, TestCase, rest, envStore, Environment, EnvTag, mockServerStore, executionHistory } from "./utils";
import { StatusBadge } from "./AtomComponents";
import { MockServerModal } from "./MockServerModal";
import "./mt-readytest.scss";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const MONO = "'JetBrains Mono','Fira Code',monospace";

// Inject spin keyframe once
if (typeof document !== "undefined" && !document.getElementById("tc-row-spin")) {
  const s = document.createElement("style");
  s.id = "tc-row-spin";
  s.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}

const METHOD_COLORS: Record<string, string> = {
  POST: "#34d399", GET: "#60a5fa", PATCH: "#fb923c",
  PUT: "#f59e0b", DELETE: "#f87171", RPC: "#a78bfa",
};

const STATUS_COLORS = {
  pending: { bg: "#8b949e15", border: "#8b949e30", text: "#8b949e", dot: "#8b949e" },
  running: { bg: "#f59e0b15", border: "#f59e0b44", text: "#f59e0b", dot: "#f59e0b" },
  passed: { bg: "#34d39915", border: "#34d39940", text: "#34d399", dot: "#34d399" },
  failed: { bg: "#f8717115", border: "#f8717140", text: "#f87171", dot: "#f87171" },
};

const SOURCE_META = {
  synthetic: { icon: "⚗", label: "Synthetic", color: "#34d399", bg: "#34d39915", border: "#34d39933" },
  file: { icon: "📄", label: "File", color: "#60a5fa", bg: "#60a5fa15", border: "#60a5fa33" },
};

const PAGE_SIZES = [10, 50, 100, 150] as const;

// ═══════════════════════════════════════════════════════════════
// SMALL SHARED UI
// ═══════════════════════════════════════════════════════════════
function SLbl({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)",
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 8
    }}>
      {children}
    </div>
  );
}

function MChip({ method }: { method: string }) {
  const c = METHOD_COLORS[method.toUpperCase()] || "#8b949e";
  return (
    <span style={{
      background: c + "18", border: `1px solid ${c}40`, color: c,
      borderRadius: 4, padding: "1px 6px", fontFamily: MONO, fontSize: 10,
      fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0
    }}>
      {method}
    </span>
  );
}

function SourceBadge({ source }: { source: "synthetic" | "file" }) {
  const m = SOURCE_META[source];
  return (
    <span style={{
      background: m.bg, border: `1px solid ${m.border}`, color: m.color,
      borderRadius: 5, padding: "1px 8px", fontFamily: MONO, fontSize: 9, fontWeight: 700,
      whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3
    }}>
      {m.icon} {m.label}
    </span>
  );
}

function StatusDot({ status }: { status: TestCase["status"] }) {
  const col = STATUS_COLORS[status].dot;
  const label = status === "running" ? "●" : status === "passed" ? "✓" : status === "failed" ? "✗" : "○";
  return (
    <span style={{
      fontFamily: MONO, fontSize: 13, color: col, flexShrink: 0, width: 16,
      textAlign: "center", lineHeight: 1
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
function StatCard({ value, label, color, icon }: {
  value: string | number; label: string; color: string; icon: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 80, padding: "14px 12px", borderRadius: 10, textAlign: "center",
      background: color + "0c", border: `1px solid ${color}30`
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 700, color,
        opacity: 0.65, textTransform: "uppercase", letterSpacing: 0.8
      }}>
        {label}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPANDABLE + EDITABLE TEST CASE ROW
// ═══════════════════════════════════════════════════════════════
interface TcRowState {
  open: boolean;
  editUrl: string;
  editBody: string;
  editHeaders: string;
  bodyError: string | null;
  headersError: string | null;
  running: boolean;
  dirty: boolean;
}

class TcRow extends React.Component<{ tc: TestCase; onRefresh: () => void; envAppliedKey?: string }, TcRowState> {
  constructor(props: { tc: TestCase; onRefresh: () => void; envAppliedKey?: string }) {
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

  componentDidUpdate(prev: { tc: TestCase; envAppliedKey?: string }) {
    if (prev.envAppliedKey !== this.props.envAppliedKey && !this.state.dirty) {
      this.setState({ editUrl: this.props.tc.resolvedUrl ?? this.props.tc.path });
    }
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
    this.setState({ headersError: null });

    this.setState({ running: true, bodyError: null });
    tc.status = "running";
    onRefresh();

    const t0 = Date.now();
    try {
      await new Promise(r => setTimeout(r, 20 + Math.random() * 60));

      let path = tc.path;
      try {
        const u = new URL(editUrl);
        path = u.pathname + u.search;
      } catch {
        path = editUrl;
      }

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
    onRefresh();
  };

  private resetEdits = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { tc } = this.props;
    this.setState({
      editUrl: tc.resolvedUrl ?? tc.path,
      editBody: tc.body ? JSON.stringify(tc.body, null, 2) : "",
      editHeaders: JSON.stringify({ "Content-Type": "application/json", "Accept": "application/json" }, null, 2),
      bodyError: null,
      headersError: null,
      dirty: false,
    });
  };

  render() {
    const { tc } = this.props;
    const { open, editUrl, editBody, editHeaders, bodyError, headersError, running, dirty } = this.state;
    const sc = STATUS_COLORS[running ? "running" : tc.status];
    const mc = METHOD_COLORS[tc.method.toUpperCase()] || "#8b949e";
    const hasBody = ["POST", "PATCH", "PUT"].includes(tc.method.toUpperCase());
    const isOk = tc.status === "passed";
    const isFail = tc.status === "failed";

    return (
      <div style={{
        borderRadius: 8, border: `1px solid ${sc.border}`,
        borderLeft: `3px solid ${sc.dot}`, background: sc.bg,
        transition: "border .15s", fontFamily: MONO,
      }}>

        {/* ══ HEADER ROW ══ */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px 9px 13px" }}>
          <StatusDot status={running ? "running" : tc.status} />
          <span style={{
            fontSize: 10, color: "var(--cs-dim)",
            background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
            borderRadius: 4, padding: "1px 6px", flexShrink: 0
          }}>
            #{tc.seq}
          </span>
          <span style={{ fontSize: 9, color: "var(--cs-dim)", flexShrink: 0, opacity: 0.7 }}>
            R{tc.runGroup}
          </span>
          <MChip method={tc.method} />
          <SourceBadge source={tc.dataSource} />
          <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            onClick={() => this.setState(s => ({ open: !s.open }))}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "var(--cs-text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {tc.apiTitle}
            </div>
            <div style={{
              fontSize: 10, color: "var(--cs-dim)", marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {tc.path}
            </div>
          </div>
          {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
          {tc.latency != null && (
            <span style={{ fontSize: 10, color: "var(--cs-dim)", flexShrink: 0 }}>
              {tc.latency}ms
            </span>
          )}
          {dirty && (
            <span title="Edited — original values changed" style={{
              fontSize: 9, color: "#f59e0b", background: "#f59e0b15",
              border: "1px solid #f59e0b33", borderRadius: 4, padding: "1px 6px",
              flexShrink: 0, fontWeight: 700,
            }}>EDITED</span>
          )}
          <button
            onClick={this.playOne}
            disabled={running}
            title="Run this request individually"
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
            onMouseLeave={e => { if (!running) (e.currentTarget as HTMLButtonElement).style.background = mc + "18"; }}
          >
            {running ? (
              <span style={{ fontSize: 10, animation: "spin 1s linear infinite" }}>⟳</span>
            ) : "▶"}
          </button>
          <button
            onClick={() => this.setState(s => ({ open: !s.open }))}
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
          <div style={{
            borderTop: `1px solid ${sc.border}`,
            display: "flex", flexDirection: "column" as const,
          }}>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                REQUEST SECTION
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div style={{
              padding: "10px 14px 4px",
              borderBottom: "1px solid var(--cs-border-sub)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: mc + "08",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 800,
                  color: mc, letterSpacing: 1, textTransform: "uppercase" as const,
                }}>
                  ▶ REQUEST
                </span>
                <MChip method={tc.method} />
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

              {/* ── Request URL ── */}
              <div>
                <div style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 700,
                  color: "var(--cs-dim)", letterSpacing: 0.8,
                  textTransform: "uppercase" as const, marginBottom: 5,
                }}>
                  🌐 Request URL
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: mc,
                    background: mc + "18", border: `1px solid ${mc}40`,
                    borderRadius: 5, padding: "6px 10px", flexShrink: 0,
                  }}>
                    {tc.method}
                  </span>
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

              {/* ── Request Headers ── */}
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5,
                }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                    letterSpacing: 0.8, textTransform: "uppercase" as const,
                  }}>
                    📋 Headers <span style={{ opacity: 0.5, fontWeight: 400 }}>JSON</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {headersError && (
                      <span style={{
                        fontSize: 9, color: "#f87171", background: "#f8717115",
                        border: "1px solid #f8717133", borderRadius: 4, padding: "2px 8px",
                      }}>
                        ⚠ {headersError}
                      </span>
                    )}
                    <button onClick={e => {
                      e.stopPropagation();
                      try {
                        this.setState({ editHeaders: JSON.stringify(JSON.parse(editHeaders), null, 2), headersError: null });
                      } catch { this.setState({ headersError: "Cannot format — invalid JSON" }); }
                    }} style={{
                      fontSize: 9, color: "#60a5fa", background: "transparent",
                      border: "1px solid #60a5fa33", borderRadius: 4,
                      padding: "1px 7px", cursor: "pointer", fontFamily: MONO,
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

              {/* ── Request Body (POST / PATCH / PUT) ── */}
              {hasBody && (
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5,
                  }}>
                    <div style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                      letterSpacing: 0.8, textTransform: "uppercase" as const,
                    }}>
                      📦 Request Body <span style={{ opacity: 0.5, fontWeight: 400 }}>JSON</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {bodyError && (
                        <span style={{
                          fontSize: 9, color: "#f87171", background: "#f8717115",
                          border: "1px solid #f8717133", borderRadius: 4, padding: "2px 8px",
                        }}>
                          ⚠ {bodyError}
                        </span>
                      )}
                      <button onClick={e => {
                        e.stopPropagation();
                        try {
                          this.setState({ editBody: JSON.stringify(JSON.parse(editBody), null, 2), bodyError: null });
                        } catch { this.setState({ bodyError: "Cannot format — invalid JSON" }); }
                      }} style={{
                        fontSize: 9, color: "#60a5fa", background: "transparent",
                        border: "1px solid #60a5fa33", borderRadius: 4,
                        padding: "1px 7px", cursor: "pointer", fontFamily: MONO,
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

              {/* ── Run button ── */}
              <button
                onClick={this.playOne}
                disabled={running || !!bodyError || !!headersError}
                style={{
                  alignSelf: "flex-start" as const,
                  padding: "8px 22px", borderRadius: 7,
                  cursor: running || !!bodyError || !!headersError ? "not-allowed" : "pointer",
                  background: running || !!bodyError || !!headersError ? "var(--cs-surface-2)" : `linear-gradient(135deg, ${mc}22, ${mc}44)`,
                  border: `1.5px solid ${running || !!bodyError || !!headersError ? "var(--cs-border)" : mc + "88"}`,
                  color: running || !!bodyError || !!headersError ? "var(--cs-dim)" : mc,
                  fontFamily: MONO, fontSize: 12, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 8,
                  opacity: running || !!bodyError || !!headersError ? 0.6 : 1,
                  transition: "all .15s",
                }}>
                {running ? "⟳  Running…" : `▶  Run  ${tc.method}  ${tc.path}`}
              </button>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                RESPONSE SECTION — only after execution
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {tc.result != null && (() => {
              const resCol = isOk ? "#34d399" : isFail ? "#f87171" : "var(--cs-muted)";
              const resBg = isOk ? "#34d39908" : isFail ? "#f8717108" : "var(--cs-bg)";
              const resBrd = isOk ? "#34d39933" : isFail ? "#f8717133" : "var(--cs-border-sub)";
              return (
                <div style={{ borderTop: `1px solid ${resBrd}` }}>

                  {/* Response section header */}
                  <div style={{
                    padding: "10px 14px 4px",
                    borderBottom: `1px solid ${resBrd}`,
                    background: resBg,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 800,
                      color: resCol, letterSpacing: 1, textTransform: "uppercase" as const,
                    }}>
                      ◀ RESPONSE
                    </span>
                    {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
                    {tc.latency != null && (
                      <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
                        {tc.latency}ms
                      </span>
                    )}
                    {tc.resolvedUrl && (
                      <span style={{
                        fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", opacity: 0.6,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                      }}>
                        → {tc.resolvedUrl}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 10 }}>

                    {/* ── Response Headers ── */}
                    {tc.headers && Object.keys(tc.headers).length > 0 && (
                      <div>
                        <div style={{
                          fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                          letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5,
                        }}>
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

                    {/* ── Response Body ── */}
                    <div>
                      <div style={{
                        fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                        letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5,
                      }}>
                        📦 Body
                      </div>
                      <pre style={{
                        fontFamily: MONO, fontSize: 10, margin: 0,
                        background: resBg, border: `1px solid ${resBrd}`,
                        borderRadius: 7, padding: "10px 12px", overflowX: "auto",
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

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT SELECTOR BAR
// ═══════════════════════════════════════════════════════════════
const ENV_TAG_LABELS: Record<EnvTag, string> = {
  local: "LOCAL", development: "DEV", staging: "STAGING",
  production: "PROD", custom: "CUSTOM",
};

interface EnvBarState {
  open: boolean; editingId: string | null; editUrl: string;
  addingNew: boolean; newName: string; newUrl: string; envTick: number;
}

export class EnvBar extends React.Component<{ onChange?: () => void }, EnvBarState> {
  state: EnvBarState = {
    open: false, editingId: null, editUrl: "",
    addingNew: false, newName: "", newUrl: "", envTick: 0,
  };

  private dropRef = React.createRef<HTMLDivElement>();

  componentDidMount() { document.addEventListener("mousedown", this.handleOutside); }
  componentWillUnmount() { document.removeEventListener("mousedown", this.handleOutside); }

  private handleOutside = (e: MouseEvent) => {
    if (this.dropRef.current && !this.dropRef.current.contains(e.target as Node)) {
      this.setState({ open: false, editingId: null, addingNew: false });
    }
  };

  private selectEnv = (id: string) => {
    envStore.select(id);
    this.setState({ open: false, editingId: null, envTick: this.state.envTick + 1 });
    this.props.onChange?.();
  };

  private startEdit = (e: React.MouseEvent, env: Environment) => {
    e.stopPropagation();
    this.setState({ editingId: env.id, editUrl: env.baseUrl });
  };

  private commitEdit = (id: string) => {
    envStore.updateUrl(id, this.state.editUrl.trim());
    this.setState({ editingId: null, envTick: this.state.envTick + 1 });
    this.props.onChange?.();
  };

  private addCustom = () => {
    const { newName, newUrl } = this.state;
    if (!newName.trim() || !newUrl.trim()) return;
    const e = envStore.addCustom(newName.trim(), newUrl.trim());
    envStore.select(e.id);
    this.setState({ addingNew: false, newName: "", newUrl: "", open: false, envTick: this.state.envTick + 1 });
    this.props.onChange?.();
  };

  render() {
    const { open, editingId, editUrl, addingNew, newName, newUrl } = this.state;
    const sel = envStore.selected;
    const isProd = sel.tag === "production";

    return (
      <div ref={this.dropRef} style={{ position: "relative" as const }}>
        {/* ── Trigger bar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          borderRadius: 10, border: `1.5px solid ${isProd ? "#f8717155" : "var(--cs-border)"}`,
          background: isProd ? "#f8717108" : "var(--cs-surface-2)",
          transition: "border-color .15s",
        }}>
          <div style={{
            padding: "10px 14px", borderRight: "1px solid var(--cs-border-sub)",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: sel.color, boxShadow: isProd ? `0 0 6px ${sel.color}` : "none",
              display: "inline-block",
            }} />
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: sel.color, letterSpacing: 0.8 }}>
              {ENV_TAG_LABELS[sel.tag]}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: "var(--cs-text)" }}>
              {sel.name}
            </span>
          </div>
          <div style={{
            flex: 1, padding: "10px 16px", fontFamily: MONO, fontSize: 11,
            color: "var(--cs-muted)", overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", minWidth: 0
          }}>
            {sel.baseUrl}
            <span style={{ color: "var(--cs-dim)", opacity: 0.5 }}>/&lt;resource&gt;/&lt;id&gt;</span>
          </div>
          <button
            onClick={() => this.setState(s => ({ open: !s.open, editingId: null }))}
            style={{
              padding: "10px 16px", background: "transparent",
              border: "none", borderLeft: "1px solid var(--cs-border-sub)",
              color: "var(--cs-muted)", cursor: "pointer", fontFamily: MONO,
              fontSize: 13, flexShrink: 0, display: "flex", alignItems: "center", gap: 6
            }}>
            <span style={{ fontSize: 10 }}>▼ Switch</span>
          </button>
        </div>

        {/* PROD warning strip */}
        {isProd && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 6,
            padding: "6px 12px", borderRadius: 7, background: "#f8717110",
            border: "1px solid #f8717133"
          }}>
            <span style={{ fontSize: 13 }}>⚠️</span>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#f87171" }}>
              PRODUCTION endpoint selected — test execution will hit live data
            </span>
          </div>
        )}

        {/* ── Dropdown ── */}
        {open && (
          <div style={{
            position: "absolute" as const, top: "calc(100% + 6px)", left: 0, right: 0,
            zIndex: 9000, background: "var(--cs-surface)", border: "1px solid var(--cs-border)",
            borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
          }}>
            <div style={{
              padding: "10px 16px", borderBottom: "1px solid var(--cs-border-sub)",
              background: "var(--cs-surface-2)", fontFamily: MONO, fontSize: 10,
              fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8,
              textTransform: "uppercase" as const
            }}>
              Select Environment
            </div>

            {envStore.envs.map(env => {
              const isSelected = env.id === envStore.selectedId;
              const isEditing = editingId === env.id;
              const isProdEnv = env.tag === "production";
              return (
                <div key={env.id}
                  onClick={() => !isEditing && this.selectEnv(env.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", cursor: isEditing ? "default" : "pointer",
                    borderBottom: "1px solid var(--cs-border-sub)",
                    background: isSelected ? env.color + "0c" : "transparent",
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.background = env.color + "0c"; }}
                  onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.background = isSelected ? env.color + "0c" : "transparent"; }}
                >
                  <span style={{
                    width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                    background: env.color, boxShadow: isProdEnv ? `0 0 5px ${env.color}` : "none",
                    display: "inline-block"
                  }} />
                  <span style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 800,
                    color: env.color, letterSpacing: 0.8, flexShrink: 0, width: 60
                  }}>
                    {ENV_TAG_LABELS[env.tag]}
                  </span>
                  <span style={{
                    fontFamily: MONO, fontSize: 12, fontWeight: 600,
                    color: isSelected ? "var(--cs-text)" : "var(--cs-muted)",
                    flexShrink: 0, width: 110
                  }}>
                    {env.name}
                  </span>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editUrl}
                      onChange={e => this.setState({ editUrl: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === "Enter") this.commitEdit(env.id);
                        if (e.key === "Escape") this.setState({ editingId: null });
                        e.stopPropagation();
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        flex: 1, padding: "4px 8px", fontFamily: MONO, fontSize: 11,
                        background: "var(--cs-input-bg)", border: `1px solid ${env.color}`,
                        borderRadius: 5, color: "var(--cs-text)", outline: "none"
                      }}
                    />
                  ) : (
                    <span style={{
                      flex: 1, fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const
                    }}>
                      {env.baseUrl}
                    </span>
                  )}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                      <>
                        <button onClick={() => this.commitEdit(env.id)} style={{
                          background: env.color + "20", border: `1px solid ${env.color}`,
                          color: env.color, borderRadius: 5, padding: "2px 8px",
                          fontFamily: MONO, fontSize: 10, cursor: "pointer", fontWeight: 700
                        }}>✓ Save</button>
                        <button onClick={() => this.setState({ editingId: null })} style={{
                          background: "transparent", border: "1px solid var(--cs-border-sub)",
                          color: "var(--cs-dim)", borderRadius: 5, padding: "2px 8px",
                          fontFamily: MONO, fontSize: 10, cursor: "pointer"
                        }}>✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={e => this.startEdit(e, env)} style={{
                          background: "transparent", border: "1px solid var(--cs-border-sub)",
                          color: "var(--cs-dim)", borderRadius: 5, padding: "2px 8px",
                          fontFamily: MONO, fontSize: 10, cursor: "pointer"
                        }}>✎</button>
                        {!env.builtIn && (
                          <button onClick={e => {
                            e.stopPropagation(); envStore.remove(env.id);
                            this.setState(s => ({ envTick: s.envTick + 1 })); this.props.onChange?.();
                          }} style={{
                            background: "transparent", border: "1px solid #f8717133",
                            color: "#f87171", borderRadius: 5, padding: "2px 6px",
                            fontFamily: MONO, fontSize: 10, cursor: "pointer"
                          }}>✕</button>
                        )}
                      </>
                    )}
                  </div>
                  {isSelected && !isEditing && (
                    <span style={{ color: env.color, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>✓</span>
                  )}
                </div>
              );
            })}

            {addingNew ? (
              <div style={{
                padding: "12px 16px", borderTop: "1px solid var(--cs-border-sub)",
                display: "flex", flexDirection: "column" as const, gap: 8,
                background: "#a78bfa08"
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: 0.8 }}>
                  ADD CUSTOM ENVIRONMENT
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Name (e.g. QA)" value={newName}
                    onChange={e => this.setState({ newName: e.target.value })}
                    onKeyDown={e => e.stopPropagation()}
                    style={{
                      width: 130, padding: "6px 10px", fontFamily: MONO, fontSize: 11,
                      background: "var(--cs-input-bg)", border: "1px solid var(--cs-border)",
                      borderRadius: 6, color: "var(--cs-text)", outline: "none"
                    }} />
                  <input placeholder="https://api.example.com" value={newUrl}
                    onChange={e => this.setState({ newUrl: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") this.addCustom(); e.stopPropagation(); }}
                    style={{
                      flex: 1, padding: "6px 10px", fontFamily: MONO, fontSize: 11,
                      background: "var(--cs-input-bg)", border: "1px solid var(--cs-border)",
                      borderRadius: 6, color: "var(--cs-text)", outline: "none"
                    }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={this.addCustom} disabled={!newName.trim() || !newUrl.trim()}
                    style={{
                      padding: "6px 16px", borderRadius: 6, cursor: "pointer",
                      background: newName.trim() && newUrl.trim() ? "#a78bfa20" : "var(--cs-surface-2)",
                      border: `1px solid ${newName.trim() && newUrl.trim() ? "#a78bfa" : "var(--cs-border)"}`,
                      color: newName.trim() && newUrl.trim() ? "#a78bfa" : "var(--cs-dim)",
                      fontFamily: MONO, fontSize: 11, fontWeight: 700
                    }}>+ Add</button>
                  <button onClick={() => this.setState({ addingNew: false, newName: "", newUrl: "" })}
                    style={{
                      padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                      background: "transparent", border: "1px solid var(--cs-border-sub)",
                      color: "var(--cs-dim)", fontFamily: MONO, fontSize: 11
                    }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); this.setState({ addingNew: true }); }}
                style={{
                  width: "100%", padding: "10px 16px", background: "transparent",
                  border: "none", borderTop: "1px solid var(--cs-border-sub)",
                  color: "#a78bfa", fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", textAlign: "left" as const, display: "flex",
                  alignItems: "center", gap: 8
                }}>
                <span style={{ fontSize: 14 }}>+</span> Add custom environment
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// SYNTHETIC DATA MODAL
// ═══════════════════════════════════════════════════════════════
const MODAL_PAGE_SIZES = [50, 100] as const;

function getBodyColumns(cases: TestCase[]): string[] {
  const keys = new Set<string>();
  for (const tc of cases) {
    if (tc.body && typeof tc.body === "object") {
      Object.keys(tc.body).forEach(k => keys.add(k));
    }
  }
  return ["#", "run", "method", "api", "path", ...Array.from(keys)];
}

function flatCell(v: any): string {
  if (v == null) return "";
  if (typeof v === "object") return (v as any).ident ?? (v as any).id ?? JSON.stringify(v);
  return String(v);
}

interface ModalState { page: number; pageSize: typeof MODAL_PAGE_SIZES[number]; }

class SyntheticDataModal extends React.Component<{ cases: TestCase[]; onClose: () => void }, ModalState> {
  state: ModalState = { page: 0, pageSize: 50 };

  private downloadCSV = () => {
    const { cases } = this.props;
    const cols = getBodyColumns(cases);
    const header = cols.join(",");
    const rows = cases.map(tc => {
      return cols.map(col => {
        let val = "";
        if (col === "#") val = String(tc.seq);
        else if (col === "run") val = String(tc.runGroup);
        else if (col === "method") val = tc.method;
        else if (col === "api") val = tc.apiTitle;
        else if (col === "path") val = tc.path;
        else if (tc.body) val = flatCell((tc.body as any)[col]);
        if (/[",\n\r]/.test(val)) val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synthetic-test-data-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  render() {
    const { cases, onClose } = this.props;
    const { page, pageSize } = this.state;
    const cols = getBodyColumns(cases);
    const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * pageSize;
    const slice = cases.slice(start, start + pageSize);
    const metaCols = ["#", "run", "method", "api", "path"];
    const bodyCols = cols.filter(c => !metaCols.includes(c));

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          width: "min(1200px, 96vw)", maxHeight: "92vh",
          background: "var(--cs-surface)", border: "1px solid var(--cs-border)",
          borderRadius: 14, display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid var(--cs-border)",
            background: "var(--cs-surface-2)", flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: "#34d399", marginBottom: 4 }}>
                ⚗ Synthetic Test Data
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)" }}>
                {cases.length.toLocaleString()} cases · {bodyCols.length} body field{bodyCols.length !== 1 ? "s" : ""}
                · {cols.length} total columns
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={this.downloadCSV} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 8, cursor: "pointer",
                background: "linear-gradient(135deg, #1a4a2a, #34d399)",
                border: "1.5px solid #34d399", color: "#0a1f15",
                fontFamily: MONO, fontSize: 12, fontWeight: 800,
              }}>
                ↓ Save as CSV
              </button>
              <button onClick={onClose} style={{
                width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                background: "transparent", border: "1px solid var(--cs-border)",
                color: "var(--cs-muted)", fontFamily: MONO, fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          </div>

          {/* Pagination controls */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 20px",
            borderBottom: "1px solid var(--cs-border-sub)", flexShrink: 0,
            background: "var(--cs-bg)", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-dim)" }}>Rows per page:</span>
              {MODAL_PAGE_SIZES.map(n => {
                const active = pageSize === n;
                return (
                  <button key={n} onClick={() => this.setState({ pageSize: n, page: 0 })} style={{
                    background: active ? "#34d39920" : "var(--cs-surface-2)",
                    border: `1px solid ${active ? "#34d399" : "var(--cs-border-sub)"}`,
                    color: active ? "#34d399" : "var(--cs-muted)",
                    borderRadius: 6, padding: "3px 12px", fontFamily: MONO, fontSize: 11,
                    fontWeight: active ? 700 : 400, cursor: "pointer",
                  }}>{n}</button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
              {[
                { label: "«", disabled: safePage === 0, onClick: () => this.setState({ page: 0 }) },
                { label: "‹ Prev", disabled: safePage === 0, onClick: () => this.setState({ page: safePage - 1 }) },
              ].map(({ label, disabled, onClick }) => (
                <button key={label} disabled={disabled} onClick={onClick} style={{
                  background: "transparent", border: "1px solid var(--cs-border-sub)",
                  color: "var(--cs-muted)", borderRadius: 6, padding: "3px 10px",
                  fontFamily: MONO, fontSize: 11, cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1
                }}>{label}</button>
              ))}
              <span style={{
                fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)",
                padding: "3px 10px", background: "var(--cs-surface-2)",
                border: "1px solid var(--cs-border-sub)", borderRadius: 6
              }}>
                {start + 1}–{Math.min(start + pageSize, cases.length)} of {cases.length.toLocaleString()}
              </span>
              {[
                { label: "Next ›", disabled: safePage >= totalPages - 1, onClick: () => this.setState({ page: safePage + 1 }) },
                { label: "»", disabled: safePage >= totalPages - 1, onClick: () => this.setState({ page: totalPages - 1 }) },
              ].map(({ label, disabled, onClick }) => (
                <button key={label} disabled={disabled} onClick={onClick} style={{
                  background: "transparent", border: "1px solid var(--cs-border-sub)",
                  color: "var(--cs-muted)", borderRadius: 6, padding: "3px 10px",
                  fontFamily: MONO, fontSize: 11, cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1
                }}>{label}</button>
              ))}
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
              Page {safePage + 1} / {totalPages}
            </span>
          </div>

          {/* Grid */}
          <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--cs-bg)", tableLayout: "auto" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr>
                  {metaCols.map(col => (
                    <th key={col} style={{
                      padding: "9px 12px", background: "var(--cs-surface-2)",
                      borderBottom: "2px solid var(--cs-border)",
                      borderRight: col === "path" ? "2px solid var(--cs-border)" : "1px solid var(--cs-border-sub)",
                      fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                      textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left",
                      whiteSpace: "nowrap", position: "sticky", top: 0,
                    }}>{col}</th>
                  ))}
                  {bodyCols.map(col => (
                    <th key={col} style={{
                      padding: "9px 12px", background: "#34d39908",
                      borderBottom: "2px solid var(--cs-border)",
                      borderRight: "1px solid var(--cs-border-sub)",
                      fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#34d399",
                      textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left",
                      whiteSpace: "nowrap", position: "sticky", top: 0,
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((tc, ri) => {
                  const isEven = ri % 2 === 0;
                  return (
                    <tr key={tc.id} style={{ background: isEven ? "var(--cs-bg)" : "var(--cs-surface)" }}>
                      <td style={{ padding: "7px 12px", fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", borderBottom: "1px solid var(--cs-border-sub)", borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap" }}>{tc.seq}</td>
                      <td style={{ padding: "7px 12px", fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", borderBottom: "1px solid var(--cs-border-sub)", borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap" }}>R{tc.runGroup}</td>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--cs-border-sub)", borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap" }}><MChip method={tc.method} /></td>
                      <td style={{ padding: "7px 12px", fontFamily: MONO, fontSize: 11, color: "var(--cs-text)", fontWeight: 600, borderBottom: "1px solid var(--cs-border-sub)", borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{tc.apiTitle}</td>
                      <td style={{ padding: "7px 12px", fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)", borderBottom: "1px solid var(--cs-border-sub)", borderRight: "2px solid var(--cs-border)", whiteSpace: "nowrap" }}>{tc.path}</td>
                      {bodyCols.map(col => {
                        const raw = tc.body ? (tc.body as any)[col] : undefined;
                        const val = raw == null ? "" : flatCell(raw);
                        const isEmpty = val === "";
                        return (
                          <td key={col} title={val} style={{
                            padding: "7px 12px", fontFamily: MONO, fontSize: 11,
                            color: isEmpty ? "var(--cs-border)" : "var(--cs-text)",
                            borderBottom: "1px solid var(--cs-border-sub)",
                            borderRight: "1px solid var(--cs-border-sub)",
                            maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {isEmpty ? "—" : val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{
            padding: "12px 20px", borderTop: "1px solid var(--cs-border)",
            background: "var(--cs-surface-2)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
              {bodyCols.length} fields: {bodyCols.slice(0, 8).join(" · ")}{bodyCols.length > 8 ? ` · +${bodyCols.length - 8} more` : ""}
            </span>
            <button onClick={this.downloadCSV} style={{
              padding: "7px 16px", borderRadius: 7, cursor: "pointer",
              background: "transparent", border: "1px solid #34d39944",
              color: "#34d399", fontFamily: MONO, fontSize: 11, fontWeight: 700,
            }}>↓ Save as CSV</button>
          </div>
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// RFT STATE
// ═══════════════════════════════════════════════════════════════
interface RftState {
  tick: number;
  pageSize: typeof PAGE_SIZES[number];
  pageIndex: number;
  running: boolean;
  runProgress: number;
  filter: "all" | "pending" | "passed" | "failed";
  methodFilter: string;
  expandReport: boolean;
  showModal: boolean;
  showMockModal: boolean;
  showBashConfirm: boolean;
  envTick: number;
  lastAppliedEnvId: string;
  envAppliedKey: string;
  currentExecUrl: string | null;
  executionMode: "flow" | "independent";
  flowTimeoutSec: number;
}

export class ReadyForTestTab extends React.Component<{ onClearAll?: () => void; onExecutionStart?: () => void }, RftState> {
  state: RftState = {
    tick: 0, pageSize: 10, pageIndex: 0, running: false,
    runProgress: 0, filter: "all", methodFilter: "ALL",
    expandReport: false, showModal: false, showMockModal: false,
    showBashConfirm: false,
    envTick: 0,
    lastAppliedEnvId: envStore.selectedId,
    envAppliedKey: envStore.selectedId,
    currentExecUrl: null,
    executionMode: "flow",
    flowTimeoutSec: 15,
  };

  private scrollRef = React.createRef<HTMLDivElement>();
  private csvImportRef = React.createRef<HTMLInputElement>();
  private jsonImportRef = React.createRef<HTMLInputElement>();
  private refresh = () => this.setState(s => ({ tick: s.tick + 1 }));

  // ─── CSV / JSON IMPORT ───────────────────────────────────────
  private parseCSVImportLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
      } else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };

  private doImportCSV = (content: string, fileName: string) => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const rawH = this.parseCSVImportLine(lines[0]);
    const headers = rawH.map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
    const col = (row: string[], name: string): string => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? (row[idx] || "").replace(/^"|"$/g, "").trim() : "";
    };
    const runGroup = testStore.cases.length > 0
      ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1 : 1;
    let added = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVImportLine(lines[i]);
      const method = (col(row, "method") || "GET").toUpperCase();
      const path   = col(row, "path");
      if (!path) continue;
      let body: Record<string, any> | null = null;
      const rawBody = col(row, "body");
      if (rawBody && rawBody !== "null" && rawBody !== '""') {
        try { body = JSON.parse(rawBody); } catch {}
      }
      const rg = parseInt(col(row, "rungroup") || col(row, "run_group") || col(row, "run")) || runGroup;
      testStore.add({
        apiTitle:     col(row, "apititle") || col(row, "api") || col(row, "name") || "Imported",
        resourceName: col(row, "resourcename") || col(row, "resource")
          || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "") || "resource",
        method, path, body, dataSource: "file", fileSource: fileName, runGroup: rg,
      });
      added++;
    }
    for (const tc of testStore.cases) {
      if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path);
    }
    this.refresh();
    this.props.onClearAll?.();
  };

  private doImportJSON = (content: string, fileName: string) => {
    let json: any;
    try { json = JSON.parse(content); } catch { return; }
    const arr: any[] = Array.isArray(json)
      ? json : (json.testCases || json.cases || json.tests || [json]);
    if (!arr.length) return;
    const runGroup = testStore.cases.length > 0
      ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1 : 1;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const method = ((item.method as string) || "GET").toUpperCase();
      const path   = (item.path as string) || "/";
      if (!path) continue;
      testStore.add({
        apiTitle:     (item.testName || item.name || item.apiTitle || "Imported") as string,
        resourceName: (item.resourceName || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "") || "resource") as string,
        method, path,
        body:       (item.body || item.parameters || null) as Record<string, any> | null,
        dataSource: "file", fileSource: fileName,
        runGroup:   typeof item.runGroup === "number" ? item.runGroup : runGroup,
      });
    }
    for (const tc of testStore.cases) {
      if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path);
    }
    this.refresh();
    this.props.onClearAll?.();
  };

  private handleImportFile = (e: React.ChangeEvent<HTMLInputElement>, type: "csv" | "json") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (type === "csv") this.doImportCSV(content, file.name);
      else this.doImportJSON(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  private applyEnvToAll = () => {
    for (const tc of testStore.cases) {
      tc.resolvedUrl = envStore.resolve(tc.path);
    }
    const key = `${envStore.selectedId}-${Date.now()}`;
    this.setState(s => ({ lastAppliedEnvId: envStore.selectedId, envAppliedKey: key, tick: s.tick + 1 }));
  };

  private resetToPending = () => {
    for (const tc of testStore.cases) {
      if (tc.status === "passed" || tc.status === "failed" || tc.status === "running") {
        tc.status = "pending";
        tc.httpStatus = undefined;
        tc.latency = undefined;
        tc.result = undefined;
        tc.headers = undefined;
      }
    }
    this.setState(s => ({ tick: s.tick + 1, runProgress: 0 }));
  };

  private getSafeFlowTimeoutSec = () => {
    const n = Number(this.state.flowTimeoutSec);
    if (!Number.isFinite(n)) return 15;
    return Math.min(120, Math.max(1, Math.round(n)));
  };

  private executeCases = async (cases: TestCase[]) => {
    if (cases.length === 0) return;
    const { executionMode } = this.state;
    const isFlow = executionMode === "flow";
    const timeoutMs = this.getSafeFlowTimeoutSec() * 1000;

    // Switch to Running tab immediately
    this.props.onExecutionStart?.();

    testStore.stopFlag = false;
    // Record execution start
    const execStart = new Date().toISOString();
    executionHistory.currentStartedAt = execStart;

    this.setState({ running: true, runProgress: 0 });
    const ctx: Record<string, number> = {};

    for (let i = 0; i < cases.length; i++) {
      // Honour stop request
      if (testStore.stopFlag) {
        // Mark remaining running cases back to pending
        cases.slice(i).forEach(tc => { if (tc.status === "running" || tc.status === "pending") tc.status = "pending"; });
        break;
      }

      const tc = cases[i];
      tc.status = "running";
      this.setState({ currentExecUrl: tc.resolvedUrl || tc.path });
      this.refresh();

      const t0 = Date.now();
      try {
        await new Promise(r => setTimeout(r, 20 + Math.random() * 60));

        const res = tc.resourceName;
        const pid = isFlow ? (ctx[res] || null) : null;
        let path = tc.path;

        if (isFlow) {
          if (path.includes("{id}") && pid) path = path.replace("{id}", String(pid));
          else if (["GET", "PATCH", "PUT", "DELETE"].includes(tc.method) && pid) path = `/${res}/${pid}`;
        }

        const execPath = (() => {
          if (!tc.resolvedUrl) return path;
          try {
            const url = new URL(tc.resolvedUrl);
            return url.pathname + url.search;
          } catch { return tc.resolvedUrl; }
        })();

        const request = rest.req(tc.method, execPath, tc.body || undefined);
        const r = isFlow
          ? await Promise.race([
            request,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Flow timeout after ${this.getSafeFlowTimeoutSec()}s`)), timeoutMs)
            ),
          ])
          : await request;

        if (isFlow && tc.method === "POST" && (r.body as any)?.id) ctx[res] = (r.body as any).id;

        tc.status = r.status >= 200 && r.status < 300 ? "passed" : "failed";
        tc.httpStatus = r.status;
        tc.latency = Date.now() - t0;
        tc.result = r.body;
        tc.headers = r.headers;
      } catch (e: any) {
        tc.status = "failed";
        tc.httpStatus = "ERR";
        tc.latency = Date.now() - t0;
        tc.result = { error: e.message, mode: executionMode };
      }

      this.setState(s => ({ runProgress: s.runProgress + 1 }));
      this.refresh();
    }

    this.setState({ running: false, currentExecUrl: null });
    testStore.stopFlag = false;

    // Build and store execution summary
    const execEnd = new Date().toISOString();
    const ts = execStart.slice(0, 19).replace(/T/, "_").replace(/:/g, "-");
    const sel = envStore.selected;
    const summary = {
      id: ts,
      startedAt: execStart,
      finishedAt: execEnd,
      mode: this.state.executionMode as "flow" | "independent",
      environment: sel.name,
      baseUrl: sel.baseUrl,
      cases: [...testStore.cases],
    };
    executionHistory.last = {
      id: summary.id, startedAt: summary.startedAt, finishedAt: summary.finishedAt,
      mode: summary.mode, environment: summary.environment, baseUrl: summary.baseUrl,
    };
    executionHistory.currentStartedAt = null;

    if (executionHistory.outputMode === "save") {
      if (executionHistory.dirHandle) {
        import("./reportGenerator").then(({ saveToFolder }) => {
          saveToFolder(executionHistory.dirHandle!, summary, executionHistory.rowsPerFile)
            .then(files => console.info("Saved execution files:", files))
            .catch(err => console.error("Save error:", err));
        });
      } else {
        // No folder selected — fall back to browser download
        import("./reportGenerator").then(({ downloadExecution }) => {
          downloadExecution(summary);
        });
      }
    }
  };

  private saveCsv = () => {
    const cases = testStore.cases;
    if (!cases.length) return;

    const escape = (v: any): string => {
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = [
      "seq", "runGroup", "apiTitle", "resourceName", "method",
      "path", "resolvedUrl", "body", "dataSource",
      "status", "httpStatus", "latency_ms",
      "res_body", "res_headers",
    ];

    const rows = cases.map((tc: TestCase) => [
      tc.seq,
      tc.runGroup,
      tc.apiTitle,
      tc.resourceName,
      tc.method,
      tc.path,
      tc.resolvedUrl ?? "",
      tc.body ?? "",
      tc.dataSource,
      tc.status,
      tc.httpStatus ?? "",
      tc.latency ?? "",
      tc.result ?? "",
      tc.headers ?? "",
    ].map(escape).join(","));

    const csv = [headers.join(","), ...rows].join("\r\n");
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-").replace(/--/g, "-");
    const hasResults = cases.some(c => c.status !== "pending");
    const tag = hasResults ? "executed" : "pending";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    if ("showSaveFilePicker" in window) {
      (window as any).showSaveFilePicker({
        suggestedName: `capi_test_cases_${tag}_${ts}.csv`,
        types: [{ description: "CSV file", accept: { "text/csv": [".csv"] } }],
      }).then(async (fh: any) => {
        const w = await fh.createWritable();
        await w.write(csv);
        await w.close();
      }).catch((err: any) => {
        if (err?.name !== "AbortError") console.error("CSV save error:", err);
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `capi_test_cases_${tag}_${ts}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  private generateBash = () => {
    const cases = testStore.cases;
    if (!cases.length) return;
    const hasUnresolved = cases.some(tc =>
      (tc.resolvedUrl ?? tc.path).includes("{id}")
    );
    if (hasUnresolved) {
      this.setState({ showBashConfirm: true });
    } else {
      this.doGenerateBash(false);
    }
  };

  private doGenerateBash = async (saveCsvToo: boolean) => {
    this.setState({ showBashConfirm: false });
    const { executionMode, flowTimeoutSec } = this.state;
    const cases = testStore.cases;
    if (!cases.length) return;

    const isMockRunning = mockServerStore.status === "running";
    const baseUrl = (isMockRunning
      ? `http://localhost:${mockServerStore.port}`
      : envStore.selected.baseUrl
    ).replace(/\/$/, "");
    const isFlow = executionMode === "flow";
    const safeTimeout = Math.max(1, Math.min(120, Math.round(Number(flowTimeoutSec) || 15)));
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-").replace(/--/g, "-");
    const modeTag = isFlow ? "flow_execution" : "independent_execution";
    const MAX_PER_CHUNK = 200;

    // ── Build resolved test case list ──────────────────────────
    const groups = isFlow
      ? cases.reduce((acc, tc) => {
        const g = tc.runGroup ?? 1;
        if (!acc[g]) acc[g] = [];
        acc[g].push(tc);
        return acc;
      }, {} as Record<number, TestCase[]>)
      : { 1: cases };

    interface ResolvedCase {
      tc: TestCase;
      urlExpr: string;
      bodyExpr: string;
      label: string;
      resVar: string | null;
    }

    const allResolved: ResolvedCase[] = [];
    Object.entries(groups).forEach(([, groupCases]) => {
      groupCases.forEach((tc) => {
        const resVar = isFlow
          ? `ID_${(tc.resourceName || "obj").toUpperCase().replace(/[^A-Z0-9]/g, "_")}`
          : null;
        let urlExpr = tc.resolvedUrl ? tc.resolvedUrl : `${baseUrl}${tc.path}`;
        if (tc.path.includes("{id}")) {
          if (isFlow && resVar) {
            urlExpr = urlExpr.replace(/\{id\}/g, `$${resVar}`);
          } else {
            urlExpr = urlExpr.replace(/\{id\}/g, String(Math.floor(Math.random() * 50) + 1));
          }
        }
        const bodyExpr = tc.body ? JSON.stringify(JSON.stringify(tc.body)) : "";
        const label = `[${tc.seq}] ${tc.method} ${tc.path} — ${tc.apiTitle}`;
        allResolved.push({ tc, urlExpr, bodyExpr, label, resVar });
      });
    });

    // ── Split into chunks ──────────────────────────────────────
    const chunks: ResolvedCase[][] = [];
    for (let i = 0; i < allResolved.length; i += MAX_PER_CHUNK) {
      chunks.push(allResolved.slice(i, i + MAX_PER_CHUNK));
    }
    const isMultiChunk = chunks.length > 1;

    // ── Helper: build a single script content ─────────────────
    const buildScript = (chunk: ResolvedCase[], chunkIdx: number, reportFile: string): string => {
      const partSuffix = isMultiChunk ? `_part${chunkIdx + 1}` : "";
      const lines: string[] = [];

      lines.push("#!/usr/bin/env bash");
      lines.push("# =============================================================");
      lines.push(`# MultiTest Runner — ${isFlow ? "FLOW" : "INDEPENDENT"} Execution${isMultiChunk ? ` (Part ${chunkIdx + 1}/${chunks.length})` : ""}`);
      lines.push(`# Generated: ${new Date().toISOString()}`);
      lines.push(`# Cases:     ${chunk[0].tc.seq}–${chunk[chunk.length - 1].tc.seq} of ${cases.length}`);
      if (isFlow) lines.push(`# Timeout:   ${safeTimeout}s per request`);
      lines.push("# =============================================================");
      lines.push("");
      lines.push("# ── CONFIGURE ──────────────────────────────────────────────");
      lines.push(`BASE_URL="${baseUrl}"   # ${isMockRunning ? `Mock Server :${mockServerStore.port}` : `Env: ${envStore.selected.name}`}`);
      if (isFlow) lines.push(`TIMEOUT=${safeTimeout}             # Per-request timeout in seconds`);
      lines.push(`REPORT_FILE="${reportFile}"`);
      if (saveCsvToo) lines.push(`DATA_FILE="capi_${modeTag}_${ts}_data.csv"`);
      lines.push("");

      // ── Helpers ──
      lines.push("GREEN='\\033[0;32m'; RED='\\033[0;31m'; CYAN='\\033[0;36m'; YELLOW='\\033[0;33m'; RESET='\\033[0m'");
      lines.push("PASS=0; FAIL=0; TOTAL=0");
      lines.push("REPORT_ROWS=\"\"");
      lines.push("");
      lines.push("run_request() {");
      lines.push("  local label=\"$1\" method=\"$2\" url=\"$3\" body=\"$4\"");
      lines.push("  local start_ms=$(date +%s%3N)");
      lines.push("  echo -e \"${CYAN}▶ ${label}${RESET}\"");
      if (isFlow) {
        lines.push("  if [ -n \"$body\" ]; then");
        lines.push(`    RESPONSE=$(curl -s -w "\\n%{http_code}" --max-time $TIMEOUT -X "$method" "$url" -H 'Content-Type: application/json' -H 'Accept: application/json' -d "$body")`);
        lines.push("  else");
        lines.push(`    RESPONSE=$(curl -s -w "\\n%{http_code}" --max-time $TIMEOUT -X "$method" "$url" -H 'Accept: application/json')`);
        lines.push("  fi");
      } else {
        lines.push("  if [ -n \"$body\" ]; then");
        lines.push(`    RESPONSE=$(curl -s -w "\\n%{http_code}" -X "$method" "$url" -H 'Content-Type: application/json' -H 'Accept: application/json' -d "$body")`);
        lines.push("  else");
        lines.push(`    RESPONSE=$(curl -s -w "\\n%{http_code}" -X "$method" "$url" -H 'Accept: application/json')`);
        lines.push("  fi");
      }
      lines.push("  local end_ms=$(date +%s%3N)");
      lines.push("  local latency=$((end_ms - start_ms))");
      lines.push("  HTTP_CODE=$(echo \"$RESPONSE\" | tail -1)");
      lines.push("  BODY=$(echo \"$RESPONSE\" | sed '$d')");
      lines.push("  TOTAL=$((TOTAL+1))");
      lines.push("  if [[ \"$HTTP_CODE\" =~ ^2 ]]; then");
      lines.push("    echo -e \"  ${GREEN}✓ $HTTP_CODE  ${latency}ms${RESET}\"");
      lines.push("    PASS=$((PASS+1))");
      lines.push("    local status_class=\"pass\"; local status_icon=\"✓\"");
      lines.push("  else");
      lines.push("    echo -e \"  ${RED}✗ $HTTP_CODE  ${latency}ms${RESET}\"");
      lines.push("    FAIL=$((FAIL+1))");
      lines.push("    local status_class=\"fail\"; local status_icon=\"✗\"");
      lines.push("  fi");
      // escape body for HTML injection
      lines.push("  local esc_body=$(echo \"$BODY\" | sed 's/&/\\&amp;/g; s/</\\&lt;/g; s/>/\\&gt;/g')");
      lines.push("  local esc_url=$(echo \"$url\" | sed 's/&/\\&amp;/g; s/</\\&lt;/g; s/>/\\&gt;/g')");
      lines.push("  local esc_body_in=$(echo \"$body\" | sed 's/&/\\&amp;/g; s/</\\&lt;/g; s/>/\\&gt;/g')");
      lines.push("  REPORT_ROWS+=\"<tr class=\\\"$status_class\\\"><td class=\\\"icon\\\">$status_icon</td><td class=\\\"code\\\">$HTTP_CODE</td><td class=\\\"ms\\\">$(echo ${latency})ms</td><td class=\\\"lbl\\\">$label</td><td class=\\\"url\\\"><code>$method $esc_url</code></td><td class=\\\"body\\\"><pre>$esc_body</pre></td></tr>\\n\"");
      lines.push("}");
      lines.push("");

      // ── ID chain vars ──
      if (isFlow) {
        const resources = [...new Set(chunk.map(r => r.tc.resourceName).filter(Boolean))];
        if (resources.length) {
          lines.push("# ── ID CHAIN MAP ──────────────────────────────────────────");
          resources.forEach(r => lines.push(`ID_${r.toUpperCase().replace(/[^A-Z0-9]/g, "_")}=""`));
          lines.push("");
        }
      }

      // ── Init report file ──
      lines.push("# ── INIT HTML REPORT ─────────────────────────────────────────");
      lines.push(`echo "Starting ${chunk.length} test(s)..."`);
      lines.push("");

      // ── Test cases ──
      lines.push("# ── TEST CASES ───────────────────────────────────────────────");
      chunk.forEach(({ tc, urlExpr, bodyExpr, label, resVar }) => {
        lines.push(`# ${label}`);
        lines.push(`run_request ${JSON.stringify(label)} ${tc.method} "${urlExpr}" ${bodyExpr || "''"}`);
        if (isFlow && tc.method === "POST" && resVar) {
          lines.push(`if [[ "$HTTP_CODE" =~ ^2 ]] && command -v jq &>/dev/null; then`);
          lines.push(`  ${resVar}=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null || echo "")`);
          lines.push(`fi`);
        }
        lines.push("");
      });

      // ── Summary + write HTML ──
      lines.push("# ── SUMMARY + HTML REPORT ────────────────────────────────────");
      lines.push("TOTAL_CALC=$((PASS+FAIL))");
      lines.push(`echo ""`);
      lines.push("echo -e \"Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL_CALC} total\"");
      lines.push("");
      lines.push("PCT=0");
      lines.push("[ $TOTAL_CALC -gt 0 ] && PCT=$(( PASS * 100 / TOTAL_CALC ))");
      lines.push("");
      lines.push("# ── Write HTML report ──────────────────────────────────────");
      lines.push("cat > \"$REPORT_FILE\" << HTMLEOF");
      lines.push("<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>");
      lines.push(`<title>MultiTest Report${isMultiChunk ? ` · Part ${chunkIdx + 1}` : ""}</title>`);
      lines.push("<style>");
      lines.push("*{box-sizing:border-box;margin:0;padding:0}");
      lines.push("body{font-family:'Segoe UI',system-ui,sans-serif;background:#0d1117;color:#c9d1d9;min-height:100vh;padding:24px}");
      lines.push(".shell{max-width:1100px;margin:0 auto}");
      lines.push("h1{font-size:20px;font-weight:700;color:#e6edf3;margin-bottom:4px}");
      lines.push(".meta{font-size:12px;color:#8b949e;margin-bottom:24px;font-family:monospace}");
      lines.push(".stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}");
      lines.push(".stat{padding:14px 22px;border-radius:10px;min-width:110px}");
      lines.push(".stat .val{font-size:28px;font-weight:800;font-family:monospace}");
      lines.push(".stat .lbl{font-size:11px;opacity:.7;margin-top:2px;text-transform:uppercase;letter-spacing:.6px}");
      lines.push(".stat.pass{background:#1a3a2a;border:1px solid #2ea04326}.stat.pass .val{color:#3fb950}");
      lines.push(".stat.fail{background:#3a1a1a;border:1px solid #f8514926}.stat.fail .val{color:#f85149}");
      lines.push(".stat.total{background:#1c2128;border:1px solid #30363d}.stat.total .val{color:#8b949e}");
      lines.push(".stat.pct{background:#1a2a3a;border:1px solid #388bfd26}.stat.pct .val{color:#58a6ff}");
      lines.push(".bar-wrap{background:#21262d;border-radius:6px;height:8px;margin-bottom:24px;overflow:hidden}");
      lines.push(".bar-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,#3fb950,#58a6ff);transition:width .6s}");
      lines.push("table{width:100%;border-collapse:collapse;font-size:13px}");
      lines.push("thead th{background:#161b22;color:#8b949e;font-weight:600;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #30363d;position:sticky;top:0}");
      lines.push("tr.pass{background:#0d1117}tr.pass:hover{background:#1a3a2a22}");
      lines.push("tr.fail{background:#1a0a0a}tr.fail:hover{background:#3a1a1a33}");
      lines.push("td{padding:9px 12px;border-bottom:1px solid #21262d;vertical-align:top}");
      lines.push("td.icon{font-size:15px;width:32px;text-align:center}");
      lines.push("tr.pass td.icon{color:#3fb950}tr.fail td.icon{color:#f85149}");
      lines.push("td.code{font-family:monospace;font-weight:700;width:52px}");
      lines.push("tr.pass td.code{color:#3fb950}tr.fail td.code{color:#f85149}");
      lines.push("td.ms{font-family:monospace;font-size:11px;color:#8b949e;width:68px}");
      lines.push("td.lbl{color:#8b949e;font-size:11px;width:200px}");
      lines.push("td.url code{color:#79c0ff;font-family:monospace;font-size:12px;word-break:break-all}");
      lines.push("td.body pre{font-family:monospace;font-size:11px;color:#adbac7;white-space:pre-wrap;word-break:break-all;max-height:120px;overflow-y:auto;background:#161b22;padding:6px 8px;border-radius:5px;border:1px solid #30363d}");
      lines.push("</style></head><body><div class='shell'>");
      lines.push(`<h1>🧪 MultiTest Report${isMultiChunk ? ` <span style='color:#8b949e;font-size:14px'>Part ${chunkIdx + 1} / ${chunks.length}</span>` : ""}</h1>`);
      lines.push(`<div class='meta'>Mode: ${isFlow ? "FLOW" : "INDEPENDENT"} &nbsp;·&nbsp; Generated: $(date) &nbsp;·&nbsp; Base: ${baseUrl}</div>`);
      lines.push("<div class='stats'>");
      lines.push("<div class='stat pass'><div class='val'>$PASS</div><div class='lbl'>Passed</div></div>");
      lines.push("<div class='stat fail'><div class='val'>$FAIL</div><div class='lbl'>Failed</div></div>");
      lines.push("<div class='stat total'><div class='val'>$TOTAL_CALC</div><div class='lbl'>Total</div></div>");
      lines.push("<div class='stat pct'><div class='val'>${PCT}%</div><div class='lbl'>Success</div></div>");
      lines.push("</div>");
      lines.push("<div class='bar-wrap'><div class='bar-fill' style='width:${PCT}%'></div></div>");
      lines.push("<table><thead><tr><th></th><th>HTTP</th><th>Time</th><th>Test</th><th>Endpoint</th><th>Response</th></tr></thead><tbody>");
      lines.push("HTMLEOF");
      lines.push("printf '%b' \"$REPORT_ROWS\" >> \"$REPORT_FILE\"");
      lines.push("cat >> \"$REPORT_FILE\" << HTMLEOF2");
      lines.push("</tbody></table></div></body></html>");
      lines.push("HTMLEOF2");
      lines.push(`echo "📄 Report saved: $REPORT_FILE"`);
      lines.push("[ $FAIL -eq 0 ] && exit 0 || exit 1");

      return lines.join("\n");
    };

    // ── Build CSV ─────────────────────────────────────────────
    const escCsv = (v: any): string => {
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csvHeaders = ["seq", "runGroup", "apiTitle", "resourceName", "method", "path", "resolvedUrl", "body", "dataSource", "status", "httpStatus", "latency_ms", "res_body", "res_headers"];
    const csvRows = cases.map((tc: TestCase) => [
      tc.seq, tc.runGroup, tc.apiTitle, tc.resourceName, tc.method,
      tc.path, tc.resolvedUrl ?? "", tc.body ?? "", tc.dataSource,
      tc.status, tc.httpStatus ?? "", tc.latency ?? "",
      tc.result ?? "", tc.headers ?? "",
    ].map(escCsv).join(","));
    const csvContent = [csvHeaders.join(","), ...csvRows].join("\r\n");
    const csvFileName = `capi_${modeTag}_${ts}_data.csv`;

    // ── Write all files ───────────────────────────────────────
    if ("showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });

        for (let i = 0; i < chunks.length; i++) {
          const partSuffix = isMultiChunk ? `_part${i + 1}` : "";
          const shName = `capi_${modeTag}_${ts}${partSuffix}.sh`;
          const reportName = `capi_${modeTag}_${ts}${partSuffix}_report.html`;
          const script = buildScript(chunks[i], i, reportName);

          const shHandle = await dirHandle.getFileHandle(shName, { create: true });
          const shW = await shHandle.createWritable();
          await shW.write(script); await shW.close();
        }

        if (saveCsvToo) {
          const csvHandle = await dirHandle.getFileHandle(csvFileName, { create: true });
          const csvW = await csvHandle.createWritable();
          await csvW.write(csvContent); await csvW.close();
        }

        const fileList = chunks.map((_, i) => {
          const partSuffix = isMultiChunk ? `_part${i + 1}` : "";
          return `capi_${modeTag}_${ts}${partSuffix}.sh`;
        }).join(", ");
        console.info(`Saved: ${fileList}${saveCsvToo ? `, ${csvFileName}` : ""}`);

      } catch (err: any) {
        if (err?.name !== "AbortError") console.error("Bash save error:", err);
      }
    } else {
      const dlBlob = (content: string, name: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = name; a.click();
        URL.revokeObjectURL(url);
      };
      for (let i = 0; i < chunks.length; i++) {
        const partSuffix = isMultiChunk ? `_part${i + 1}` : "";
        const reportName = `capi_${modeTag}_${ts}${partSuffix}_report.html`;
        dlBlob(buildScript(chunks[i], i, reportName), `capi_${modeTag}_${ts}${partSuffix}.sh`, "application/x-sh");
      }
      if (saveCsvToo) dlBlob(csvContent, csvFileName, "text/csv;charset=utf-8;");
    }
  };


  private pickFolder = async (): Promise<boolean> => {
    if (!("showDirectoryPicker" in window)) {
      // Browser doesn't support File System Access API — fall back to download mode
      executionHistory.outputMode = "live";
      return true;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      executionHistory.dirHandle = handle;
      if (executionHistory.outputMode === "live") executionHistory.outputMode = "save";
      this.refresh();
      return true;
    } catch (err: any) {
      if (err?.name !== "AbortError") console.error("Folder pick error:", err);
      return false; // user cancelled
    }
  };

  private executeBlock = async () => {
    if (executionHistory.outputMode === "save" && !executionHistory.dirHandle) {
      const ok = await this.pickFolder();
      if (!ok) return;
    }
    const { pageSize, pageIndex } = this.state;
    const visible = this.getFiltered();
    const start = pageIndex * pageSize;
    const block = visible.slice(start, start + pageSize).filter(c => c.status === "pending");
    await this.executeCases(block);
  };

  private executeAll = async () => {
    if (executionHistory.outputMode === "save" && !executionHistory.dirHandle) {
      const ok = await this.pickFolder();
      if (!ok) return;
    }
    const pending = testStore.cases.filter(c => c.status === "pending");
    await this.executeCases(pending);
  };

  private getFiltered(): TestCase[] {
    const { filter, methodFilter } = this.state;
    let cases = testStore.cases;
    if (filter !== "all") cases = cases.filter(c => c.status === filter);
    if (methodFilter !== "ALL") cases = cases.filter(c => c.method === methodFilter);
    return cases;
  }

  render() {
    const {
      tick, pageSize, pageIndex, running, runProgress, filter, methodFilter,
      expandReport, showModal, showMockModal, showBashConfirm, envTick, lastAppliedEnvId,
      envAppliedKey, currentExecUrl, executionMode, flowTimeoutSec
    } = this.state;

    const allCases = testStore.cases;
    const total = allCases.length;
    const pending = allCases.filter(c => c.status === "pending").length;
    const passed = allCases.filter(c => c.status === "passed").length;
    const failed = allCases.filter(c => c.status === "failed").length;
    const running_n = allCases.filter(c => c.status === "running").length;
    const avgLat = passed + failed > 0
      ? Math.round(allCases.filter(c => c.latency != null).reduce((a, c) => a + (c.latency || 0), 0) / (passed + failed))
      : 0;
    const pct = total - pending > 0 ? Math.round((passed / (total - pending - running_n)) * 100) : 0;
    const pctCol = pct === 100 ? "#34d399" : pct >= 70 ? "#f59e0b" : "#f87171";

    const synthCount = allCases.filter(c => c.dataSource === "synthetic").length;
    const fileCount = allCases.filter(c => c.dataSource === "file").length;
    const methods = ["ALL", ...new Set(allCases.map(c => c.method))];

    const filtered = this.getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(pageIndex, totalPages - 1);
    const pageStart = safePage * pageSize;
    const pageEnd = Math.min(pageStart + pageSize, filtered.length);
    const pageSlice = filtered.slice(pageStart, pageEnd);
    const pendingInBlock = pageSlice.filter(c => c.status === "pending").length;

    if (total === 0) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 400, gap: 16,
          color: "var(--cs-dim)", fontFamily: MONO
        }}>
          <div style={{ fontSize: 52, opacity: 0.25 }}>🧪</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cs-muted)" }}>No test cases queued</div>
          <div style={{ fontSize: 11, opacity: 0.6, textAlign: "center", maxWidth: 380, lineHeight: 1.7 }}>
            Go to <strong style={{ color: "var(--cs-text)" }}>⚗ Data Generator</strong> to select APIs
            and generate synthetic test cases, or import test data from a file.
          </div>
        </div>
      );
    }

    const synthCases = allCases.filter(c => c.dataSource === "synthetic");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: MONO }}>

        {/* ── Modals ── */}
        {showMockModal && (
          <MockServerModal
            onClose={() => this.setState({ showMockModal: false })}
            onEnvChanged={() => this.setState(s => ({ envTick: s.envTick + 1 }))}
          />
        )}
        {showModal && synthCases.length > 0 && (
          <SyntheticDataModal cases={synthCases} onClose={() => this.setState({ showModal: false })} />
        )}

        {/* ══ BASH CONFIRM MODAL ══ */}
        {showBashConfirm && (
          <div style={{
            position: "fixed" as const, inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "var(--cs-surface)", border: "1.5px solid #f59e0b66",
              borderRadius: 14, padding: "28px 32px", maxWidth: 480, width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}>
              {/* Warning header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>⚠️</span>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: "#f59e0b", marginBottom: 6 }}>
                    Unresolved IDs detected
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.7 }}>
                    Some test cases still contain <code style={{ color: "#f87171", background: "#f8717115", padding: "1px 5px", borderRadius: 3 }}>{"{id}"}</code> placeholders — real IDs are only available after a flow execution run.
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.7, marginTop: 8 }}>
                    The script will use random seed IDs (1–50) for those calls.
                  </div>
                </div>
              </div>

              {/* CSV question */}
              <div style={{
                background: "#60a5fa0a", border: "1px solid #60a5fa33",
                borderRadius: 8, padding: "12px 16px", marginBottom: 20,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>
                  📄 Save test data CSV alongside the script?
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", lineHeight: 1.6 }}>
                  A <strong>{`capi_..._data.csv`}</strong> file will be written to the same folder, containing all test case fields. The script will reference it via <code style={{ color: "#60a5fa" }}>$DATA_FILE</code>.
                </div>
              </div>

              {/* YES / NO / Cancel */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => this.doGenerateBash(true)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
                    background: "linear-gradient(135deg, #1a4a2a, #34d399)",
                    border: "1.5px solid #34d399",
                    color: "#0a1f15", fontFamily: MONO, fontSize: 12, fontWeight: 800,
                  }}>
                  ✓ YES — Save script + CSV
                </button>
                <button
                  onClick={() => this.doGenerateBash(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
                    background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                    color: "var(--cs-muted)", fontFamily: MONO, fontSize: 12, fontWeight: 700,
                  }}>
                  ✗ NO — Script only
                </button>
                <button
                  onClick={() => this.setState({ showBashConfirm: false })}
                  style={{
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    background: "transparent", border: "1px solid #f8717133",
                    color: "#f87171", fontFamily: MONO, fontSize: 12, fontWeight: 700,
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ ENVIRONMENT ENDPOINT SELECTOR ══ */}
        <div style={{ borderRadius: 12, border: "1px solid var(--cs-border)", position: "relative" as const }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", background: "var(--cs-surface-2)",
            borderBottom: "1px solid var(--cs-border-sub)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🌐</span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: "var(--cs-text)", letterSpacing: 0.3 }}>
                Environment Endpoint
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
                background: "var(--cs-bg)", border: "1px solid var(--cs-border-sub)",
                borderRadius: 4, padding: "1px 7px"
              }}>
                Target for test execution
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
              All REST calls will be sent to the selected base URL
            </div>
          </div>
          <div style={{ padding: "12px 16px", background: "var(--cs-bg)" }}>
            <EnvBar onChange={() => this.setState(s => ({ envTick: s.envTick + 1 }))} />
          </div>
          {(() => {
            const sel = envStore.selected;
            const isStale = lastAppliedEnvId !== sel.id;
            const count = testStore.total;
            return (
              <div style={{
                padding: "8px 16px", borderTop: "1px solid var(--cs-border-sub)",
                background: isStale ? "#f59e0b08" : "var(--cs-surface-2)",
                display: "flex", alignItems: "center", gap: 10, transition: "background .2s",
              }}>
                {isStale ? (
                  <span className="rft-sync-badge rft-sync-badge--stale">
                    ⚠ {count.toLocaleString()} test{count !== 1 ? "s" : ""} use old endpoint
                  </span>
                ) : count > 0 ? (
                  <span className="rft-sync-badge rft-sync-badge--ok">
                    ✓ {count.toLocaleString()} tests synced
                  </span>
                ) : null}
                <code style={{
                  fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)",
                  background: "var(--cs-bg)", border: "1px solid var(--cs-border-sub)",
                  borderRadius: 5, padding: "3px 10px", flex: 1, minWidth: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const
                }}>
                  {sel.baseUrl}<span style={{ opacity: 0.4 }}>/<em>resource</em></span>
                </code>
                {count > 0 && (
                  <button
                    onClick={this.applyEnvToAll}
                    className={`rft-apply-btn${isStale ? " rft-apply-btn--stale" : ""}`}
                    style={{
                      background: isStale ? "linear-gradient(135deg, #7a4a00, #f59e0b)" : sel.color + "18",
                      border: `1.5px solid ${isStale ? "#f59e0b" : sel.color + "55"}`,
                      color: isStale ? "#0a0800" : sel.color,
                      boxShadow: isStale ? "0 0 12px #f59e0b44" : "none",
                    }}
                  >
                    {isStale ? `⟳ Apply to all ${count.toLocaleString()} tests` : `✓ Re-apply ${sel.name}`}
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Header banner ── */}
        <div style={{
          padding: "14px 18px", borderRadius: 12,
          background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--cs-text)", marginBottom: 5, fontFamily: MONO }}>
                🧪 Ready for Test
              </div>
              <div style={{ fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.6, fontFamily: MONO }}>
                {total.toLocaleString()} test case{total !== 1 ? "s" : ""} queued
                <span style={{ marginLeft: 10, opacity: 0.5 }}>·</span>
                <span style={{ marginLeft: 10 }}>
                  {synthCount > 0 && <span style={{ color: "#34d399", marginRight: 8 }}>⚗ {synthCount.toLocaleString()} Synthetic</span>}
                  {fileCount > 0 && <span style={{ color: "#60a5fa" }}>📄 {fileCount.toLocaleString()} File</span>}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {synthCount > 0 && (
                <button onClick={() => this.setState({ showModal: true })} className="rft-source-btn rft-source-btn--synth">
                  ⚗ Synthetic · auto-generated banking data
                  <span style={{ opacity: 0.6, fontSize: 10 }}>↗ View data</span>
                </button>
              )}
              {fileCount > 0 && (
                <div className="rft-source-badge rft-source-badge--file">
                  📄 File · imported from upload
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ EXECUTION MODE ══ */}
        <div className="rft-exec-wrapper">

          {/* ── Header: label left, active badge right ── */}
          <div className="rft-exec-header">
            <span className="rft-exec-header__label">Execution Mode</span>
            <span className="rft-exec-header__badge">
              {executionMode === "flow" ? "▶ Execution Flow" : "⊞ Independent"}
            </span>
          </div>

          {/* ── Cards grid ── */}
          <div className="rft-exec-grid">

            {/* ── Flow card ── */}
            <button
              type="button"
              disabled={running}
              onClick={() => this.setState({ executionMode: "flow" })}
              className={`rft-exec-card${executionMode === "flow" ? " rft-exec-card--active" : " rft-exec-card--inactive"}`}
            >
              <div className="rft-exec-card__header">
                <span className="rft-exec-card__title">
                  ▶ Execution Flow {executionMode === "flow" ? "· Default" : ""}
                </span>
                <span className={`rft-exec-badge${executionMode === "flow" ? " rft-exec-badge--active" : " rft-exec-badge--select"}`}>
                  {executionMode === "flow" ? "ACTIVE" : "Select"}
                </span>
              </div>
              <div className="rft-exec-card__desc">
                10 API calls executed according to the dependency graph and HTTP method order
                (POST → GET → PATCH → DELETE).
                <br /><br />
                IDs generated by each POST request are automatically propagated and reused in subsequent API calls.
                <br /><br />
                In this mode, each request waits for the previous response before executing the next one.
              </div>
            </button>

            {/* ── Independent card ── */}
            <button
              type="button"
              disabled={running}
              onClick={() => this.setState({ executionMode: "independent" })}
              className={`rft-exec-card${executionMode === "independent" ? " rft-exec-card--active" : " rft-exec-card--inactive"}`}
            >
              <div className="rft-exec-card__header">
                <span className="rft-exec-card__title">⚗ Independent Execution</span>
                <span className={`rft-exec-badge${executionMode === "independent" ? " rft-exec-badge--active" : " rft-exec-badge--select"}`}>
                  {executionMode === "independent" ? "ACTIVE" : "Select"}
                </span>
              </div>
              <div className="rft-exec-card__desc">
                Executes each API independently, without dependency chaining.
                <br /><br />
                Synthetic data generated by the system is attached directly to each request.
                <br /><br />
                No previous response is required before the next API request can be executed.
              </div>
            </button>
          </div>

        </div>

        {/* ── Status + timeout strip ── */}
        <div className="rft-exec-strip rft-exec-strip--flow">
          <div style={{ minWidth: 260 }}>
            <div className="rft-exec-strip__label rft-exec-strip__label--flow">
              {executionMode === "flow" ? "Flow execution is active" : "Independent execution is active"}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: "#0d3733", lineHeight: 1.6 }}>
              {executionMode === "flow"
                ? "Each API call waits for the previous response. Timeout applies per request in the dependency chain."
                : "Each request runs with its own generated payload and does not depend on IDs or responses from previous calls."}
            </div>
          </div>
          <label className={`rft-timeout-label${executionMode === "flow" ? "" : " rft-timeout-label--disabled"}`}>
            <span className="rft-timeout-label__text">FLOW TIMEOUT</span>
            <input
              type="number" min={1} max={120} step={1}
              value={flowTimeoutSec}
              disabled={running || executionMode !== "flow"}
              onChange={e => {
                const next = Number(e.target.value);
                this.setState({ flowTimeoutSec: Number.isFinite(next) ? next : 15 });
              }}
              onBlur={() => this.setState({ flowTimeoutSec: this.getSafeFlowTimeoutSec() })}
              className={`rft-timeout-input${executionMode === "flow" ? " rft-timeout-input--flow" : ""}`}
            />
            <span className={`rft-timeout-unit${executionMode === "flow" ? " rft-timeout-unit--flow" : ""}`}>sec</span>
          </label>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatCard value={total.toLocaleString()} label="Total" color="#8b949e" icon="📋" />
          <StatCard value={pending} label="Pending" color="#8b949e" icon="○" />
          <StatCard value={passed} label="Passed" color="#34d399" icon="✓" />
          <StatCard value={failed} label="Failed" color="#f87171" icon="✗" />
          <StatCard value={avgLat > 0 ? avgLat + "ms" : "—"} label="Avg Lat" color="#60a5fa" icon="⚡" />
        </div>

        {/* ── Progress bar ── */}
        {(passed + failed) > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--cs-muted)", marginBottom: 5 }}>
              <span>Execution progress ({passed + failed} / {total - running_n} executed)</span>
              <span style={{ fontWeight: 700, color: pctCol }}>{pct}% pass</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "var(--cs-surface-2)", overflow: "hidden", display: "flex" }}>
              {passed > 0 && <div style={{ height: "100%", background: "#34d399", width: `${(passed / total) * 100}%`, transition: "width .4s ease" }} />}
              {failed > 0 && <div style={{ height: "100%", background: "#f87171", width: `${(failed / total) * 100}%`, transition: "width .4s ease" }} />}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 10, color: "var(--cs-dim)", marginTop: 4 }}>
              <span style={{ color: "#34d399" }}>■ {passed} passed</span>
              <span style={{ color: "#f87171" }}>■ {failed} failed</span>
              <span>■ {pending} pending</span>
            </div>
          </div>
        )}

        {/* ── Run buttons / Completion panel ── */}
        {!running && pending === 0 && (passed + failed) > 0 ? (
          <div style={{
            borderRadius: 10,
            border: `1px solid ${failed > 0 ? "#f8717133" : "#34d39933"}`,
            background: failed > 0 ? "#f8717108" : "#34d39908",
            padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: failed > 0 ? "#f87171" : "#34d399", marginBottom: 4 }}>
                {failed > 0 ? "⚠ Execution complete with failures" : "✓ All tests passed"}
              </div>
              <div style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", flexWrap: "wrap" as const }}>
                <span style={{ color: "#34d399" }}>✓ {passed} passed</span>
                {failed > 0 && <span style={{ color: "#f87171" }}>✗ {failed} failed</span>}
                <span>⚡ avg {avgLat > 0 ? avgLat + "ms" : "—"}</span>
                <span style={{ opacity: 0.6 }}>Results are preserved</span>
              </div>
            </div>
            <button
              onClick={this.resetToPending}
              title="Reset all results back to pending — test cases are preserved, only execution state is cleared"
              style={{
                padding: "9px 20px", borderRadius: 8, cursor: "pointer",
                background: "var(--cs-surface-2)",
                border: "1.5px solid var(--cs-border)",
                color: "var(--cs-muted)", fontFamily: MONO, fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                transition: "all .15s",
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#60a5fa88"; b.style.color = "#60a5fa"; b.style.background = "#60a5fa10"; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--cs-border)"; b.style.color = "var(--cs-muted)"; b.style.background = "var(--cs-surface-2)"; }}
            >
              ↺ Reset to Pending
            </button>
            <button
              onClick={this.executeAll}
              title="Re-run all tests from scratch using stored URLs"
              style={{
                padding: "9px 20px", borderRadius: 8, cursor: "pointer",
                background: "linear-gradient(135deg, #1a4a7a, #34d399)",
                border: "1.5px solid #34d399",
                color: "#0a1f15", fontFamily: MONO, fontSize: 12, fontWeight: 800,
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                transition: "all .15s",
              }}>
              ▶▶ Re-run All — {total.toLocaleString()} tests
            </button>
          </div>
        ) : pending > 0 ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={running || pendingInBlock === 0}
              onClick={this.executeBlock}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 8,
                cursor: running || pendingInBlock === 0 ? "not-allowed" : "pointer",
                background: running || pendingInBlock === 0
                  ? "var(--cs-surface-2)"
                  : "linear-gradient(135deg, #1a3a5a, #60a5fa)",
                border: `1.5px solid ${running || pendingInBlock === 0 ? "var(--cs-border)" : "#60a5fa"}`,
                color: running || pendingInBlock === 0 ? "var(--cs-dim)" : "#fff",
                fontFamily: MONO, fontSize: 12, fontWeight: 800, transition: "all .15s",
                opacity: running || pendingInBlock === 0 ? 0.5 : 1,
              }}>
              {running
                ? `⏳ Running… (${runProgress})`
                : `${executionMode === "flow" ? "▶ Execute Flow Page" : "⚗ Execute Independent Page"}  —  ${pendingInBlock} pending case${pendingInBlock !== 1 ? "s" : ""}`
              }
            </button>
            <button
              disabled={running}
              onClick={this.executeAll}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 8,
                cursor: running ? "not-allowed" : "pointer",
                background: running ? "var(--cs-surface-2)" : "linear-gradient(135deg, #1a4a7a, #34d399)",
                border: `1.5px solid ${running ? "var(--cs-border)" : "#34d399"}`,
                color: running ? "var(--cs-dim)" : "#ffffff",
                fontFamily: MONO, fontSize: 12, fontWeight: 800, transition: "all .15s",
                opacity: running ? 0.5 : 1,
              }}>
              {running ? "⏳ Running…" : `${executionMode === "flow" ? "▶▶ Execute Flow" : "⚗ Execute Independent"}  —  ${pending.toLocaleString()} pending`}
            </button>
          </div>
        ) : null}

        {/* ── Running progress bar ── */}
        {running && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f59e0b10", border: "1px solid #f59e0b33" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#f59e0b", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>⏳ Executing {executionMode === "flow" ? "flow" : "independent mode"}…</span>
                {(() => {
                  const url = this.state.currentExecUrl;
                  if (!url) return null;
                  const matchedEnv = envStore.envs.find(e => url.startsWith(e.baseUrl)) || null;
                  const color = matchedEnv?.color || "#8b949e";
                  const label = matchedEnv?.name || (() => { try { return new URL(url).hostname; } catch { return url; } })();
                  const isProd = matchedEnv?.tag === "production";
                  return (
                    <span style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: color + "18", border: `1px solid ${color}44`,
                      borderRadius: 4, padding: "1px 8px", color, fontSize: 10, fontWeight: 700
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", boxShadow: isProd ? `0 0 4px ${color}` : "none" }} />
                      {label}
                    </span>
                  );
                })()}
              </div>
              <span>{runProgress} completed{executionMode === "flow" ? ` · timeout ${this.getSafeFlowTimeoutSec()}s` : ""}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "var(--cs-surface-2)", overflow: "hidden" }}>
              <div style={{
                height: "100%", background: "#f59e0b", borderRadius: 2,
                width: `${runProgress > 0 ? Math.min(100, (runProgress / pageSize) * 100) : 5}%`,
                transition: "width .2s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── Filters + mode toggle + action buttons ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" as const }}>

          {/* LEFT: status + method filters */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const }}>
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "pending", "passed", "failed"] as const).map(f => {
                const active = filter === f;
                const cols = f === "passed" ? "#34d399" : f === "failed" ? "#f87171" : f === "pending" ? "#8b949e" : "var(--cs-accent)";
                const cnt = f === "all" ? total : allCases.filter(c => c.status === f).length;
                return (
                  <button key={f} onClick={() => this.setState({ filter: f, pageIndex: 0 })} style={{
                    background: active ? cols + "20" : "transparent",
                    border: `1px solid ${active ? cols : "var(--cs-border-sub)"}`,
                    color: active ? cols : "var(--cs-muted)",
                    borderRadius: 6, padding: "4px 11px", fontFamily: MONO, fontSize: 11,
                    fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all .12s",
                  }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({cnt})
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {methods.map(m => {
                const active = methodFilter === m;
                const col = m === "ALL" ? "var(--cs-accent)" : (METHOD_COLORS[m] || "#8b949e");
                return (
                  <button key={m} onClick={() => this.setState({ methodFilter: m, pageIndex: 0 })} style={{
                    background: active ? col + "20" : "transparent",
                    border: `1px solid ${active ? col : "var(--cs-border-sub)"}`,
                    color: active ? col : "var(--cs-muted)",
                    borderRadius: 6, padding: "4px 10px", fontFamily: MONO, fontSize: 10,
                    fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all .12s",
                  }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: LIVE / SAVE mode toggle (absolutely centred in available space) */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
            {/* LIVE LOADING REPORT */}
            <button
              onClick={() => { executionHistory.outputMode = "live"; this.refresh(); }}
              style={{
                background: executionHistory.outputMode === "live" ? "#f8717122" : "transparent",
                border: `1px solid ${executionHistory.outputMode === "live" ? "#f87171aa" : "#8b949e44"}`,
                color: executionHistory.outputMode === "live" ? "#f87171" : "var(--cs-dim)",
                borderRadius: 6, padding: "4px 12px", fontFamily: MONO, fontSize: 11,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontWeight: executionHistory.outputMode === "live" ? 700 : 400, transition: "all .15s",
              }}>
              {executionHistory.outputMode === "live" && (
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", display: "inline-block", boxShadow: "0 0 5px #f87171" }} />
              )}
              Live Loading Report
            </button>

            {/* SAVE REPORT */}
            <button
              onClick={async () => {
                executionHistory.outputMode = "save";
                this.refresh();
                if (!executionHistory.dirHandle) await this.pickFolder();
              }}
              style={{
                background: executionHistory.outputMode === "save" ? "#6366f122" : "transparent",
                border: `1px solid ${executionHistory.outputMode === "save" ? "#6366f1aa" : "#8b949e44"}`,
                color: executionHistory.outputMode === "save" ? "#6366f1" : "var(--cs-dim)",
                borderRadius: 6, padding: "4px 12px", fontFamily: MONO, fontSize: 11,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontWeight: executionHistory.outputMode === "save" ? 700 : 400, transition: "all .15s",
              }}>
              💾 Save Report
            </button>

            {/* Folder name + Change + rows/file — only in save mode */}
            {executionHistory.outputMode === "save" && (
              <>
                <button
                  onClick={this.pickFolder}
                  style={{
                    background: executionHistory.dirHandle ? "#6366f112" : "#f8717112",
                    border: `1px solid ${executionHistory.dirHandle ? "#6366f144" : "#f8717144"}`,
                    color: executionHistory.dirHandle ? "#6366f1" : "#f87171",
                    borderRadius: 6, padding: "4px 10px", fontFamily: MONO, fontSize: 11,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    fontWeight: 600, transition: "all .15s",
                  }}
                  title="Select or change output folder">
                  📁 {executionHistory.dirHandle?.name ?? "Pick folder"}
                </button>
                <input
                  type="number" min={10} max={10000} step={10}
                  value={executionHistory.rowsPerFile}
                  title="Rows per CSV file"
                  onChange={e => {
                    executionHistory.rowsPerFile = Math.max(10, Math.min(10000, parseInt(e.target.value) || 100));
                    this.refresh();
                  }}
                  style={{
                    width: 58, padding: "4px 6px", fontFamily: MONO, fontSize: 11,
                    background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                    borderRadius: 5, color: "var(--cs-text)", textAlign: "center",
                  }}
                />
              </>
            )}
          </div>

          {/* RIGHT: action buttons — left-aligned */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {(() => {
              const hasIds = testStore.cases.length > 0 && testStore.cases.some(tc => (tc.resolvedUrl ?? tc.path).includes("{id}"));
              const disabled = testStore.cases.length === 0;
              return (
                <button
                  onClick={this.generateBash}
                  disabled={disabled}
                  title={hasIds ? "⚠ Some test cases have unresolved {id} placeholders — click to review" : `Generate curl shell script for ${this.state.executionMode === "flow" ? "flow" : "independent"} execution`}
                  style={{
                    background: disabled ? "transparent" : hasIds ? "#f59e0b18" : "#a78bfa22",
                    border: `1px solid ${disabled ? "#a78bfa22" : hasIds ? "#f59e0b66" : "#a78bfa44"}`,
                    color: disabled ? "var(--cs-dim)" : hasIds ? "#f59e0b" : "var(--cs-muted)",
                    borderRadius: 6, padding: "4px 12px", fontFamily: MONO, fontSize: 11,
                    cursor: disabled ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
                    opacity: disabled ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { if (!disabled) { const b = e.currentTarget as HTMLButtonElement; b.style.background = hasIds ? "#f59e0b28" : "#a78bfa33"; b.style.color = hasIds ? "#f59e0b" : "#a78bfa"; } }}
                  onMouseLeave={e => { if (!disabled) { const b = e.currentTarget as HTMLButtonElement; b.style.background = hasIds ? "#f59e0b18" : "#a78bfa22"; b.style.color = hasIds ? "#f59e0b" : "var(--cs-muted)"; } }}
                >
                  {hasIds && <span style={{ fontSize: 10 }}>⚠</span>}
                  <span style={{ fontSize: 11 }}>$_</span>
                  Generate BASH
                </button>
              );
            })()}
            <button
              onClick={this.saveCsv}
              disabled={testStore.cases.length === 0}
              title={
                testStore.cases.some(c => c.status !== "pending")
                  ? "Save executed test cases with results (resolvedUrl, status, body, headers)"
                  : "Save pending test cases as CSV"
              }
              style={{
                background: testStore.cases.length === 0 ? "transparent" : "#a78bfa22",
                border: `1px solid ${testStore.cases.length === 0 ? "#a78bfa22" : "#a78bfa44"}`,
                color: testStore.cases.length === 0 ? "var(--cs-dim)" : "var(--cs-muted)",
                borderRadius: 6, padding: "4px 12px", fontFamily: MONO, fontSize: 11,
                cursor: testStore.cases.length === 0 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
                opacity: testStore.cases.length === 0 ? 0.45 : 1,
              }}
              onMouseEnter={e => { if (testStore.cases.length > 0) { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#a78bfa33"; b.style.color = "#a78bfa"; } }}
              onMouseLeave={e => { if (testStore.cases.length > 0) { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#a78bfa22"; b.style.color = "var(--cs-muted)"; } }}
            >
              ⬇ Save CSV
            </button>
            {/* ── Import CSV / JSON ── */}
            <input
              ref={this.csvImportRef} type="file" accept=".csv" style={{ display: "none" }}
              onChange={e => this.handleImportFile(e, "csv")}
            />
            <input
              ref={this.jsonImportRef} type="file" accept=".json" style={{ display: "none" }}
              onChange={e => this.handleImportFile(e, "json")}
            />
            <button
              onClick={() => this.csvImportRef.current?.click()}
              title="Import test cases from CSV (app export format)"
              style={{
                background: "#60a5fa18", border: "1px solid #60a5fa44",
                color: "#60a5fa", borderRadius: 6, padding: "4px 12px",
                fontFamily: MONO, fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              📥 Import CSV
            </button>
            <button
              onClick={() => this.jsonImportRef.current?.click()}
              title="Import test cases from JSON"
              style={{
                background: "#f59e0b18", border: "1px solid #f59e0b44",
                color: "#f59e0b", borderRadius: 6, padding: "4px 12px",
                fontFamily: MONO, fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              {"{ }"} Import JSON
            </button>
            <button
              onClick={() => this.setState(s => ({ showMockModal: !s.showMockModal }))}
              style={{
                background: showMockModal || mockServerStore.status === "running" ? "#a78bfa22" : "transparent",
                border: `1px solid ${mockServerStore.status === "running" ? "#a78bfa88" : "#a78bfa44"}`,
                color: mockServerStore.status === "running" ? "#a78bfa" : "var(--cs-muted)",
                borderRadius: 6, padding: "4px 12px", fontFamily: MONO, fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
              }}>
              {mockServerStore.status === "running" && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block", boxShadow: "0 0 5px #a78bfa" }} />
              )}
              ⚡ Mock Server
            </button>
            {(passed + failed) > 0 && (
              <button onClick={this.resetToPending} style={{
                background: "transparent", border: "1px solid #60a5fa33",
                color: "#60a5fa", borderRadius: 6, padding: "4px 12px",
                fontFamily: MONO, fontSize: 11, cursor: "pointer"
              }}>
                ↺ Reset
              </button>
            )}
            <button onClick={() => { testStore.clear(); this.refresh(); this.props.onClearAll?.(); }} style={{
              background: "transparent", border: "1px solid #f8717133",
              color: "#f87171", borderRadius: 6, padding: "4px 12px",
              fontFamily: MONO, fontSize: 11, cursor: "pointer"
            }}>
              🗑 Clear all
            </button>
          </div>  {/* right */}
        </div>  {/* toolbar outer */}

        {/* ── Pagination controls ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
            <button disabled={safePage === 0} onClick={() => this.setState({ pageIndex: 0 })} style={{ background: "transparent", border: "1px solid var(--cs-border-sub)", color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-muted)", borderRadius: 6, padding: "3px 8px", fontFamily: MONO, fontSize: 11, cursor: safePage === 0 ? "not-allowed" : "pointer", opacity: safePage === 0 ? 0.4 : 1 }}>«</button>
            <button disabled={safePage === 0} onClick={() => this.setState({ pageIndex: safePage - 1 })} style={{ background: "transparent", border: "1px solid var(--cs-border-sub)", color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-muted)", borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11, cursor: safePage === 0 ? "not-allowed" : "pointer", opacity: safePage === 0 ? 0.4 : 1 }}>‹ Prev</button>
            {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
              const half = 4;
              let start = Math.max(0, safePage - half);
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
                }}>
                  {p + 1}
                </button>
              );
            })}
            <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ pageIndex: safePage + 1 })} style={{ background: "transparent", border: "1px solid var(--cs-border-sub)", color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-muted)", borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11, cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer", opacity: safePage >= totalPages - 1 ? 0.4 : 1 }}>Next ›</button>
            <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ pageIndex: totalPages - 1 })} style={{ background: "transparent", border: "1px solid var(--cs-border-sub)", color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-muted)", borderRadius: 6, padding: "3px 8px", fontFamily: MONO, fontSize: 11, cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer", opacity: safePage >= totalPages - 1 ? 0.4 : 1 }}>»</button>
          </div>
          <span style={{ fontSize: 11, color: "var(--cs-dim)" }}>
            {filtered.length > 0
              ? `${pageStart + 1}–${pageEnd} of ${filtered.length.toLocaleString()} case${filtered.length !== 1 ? "s" : ""}`
              : "0 cases"}
          </span>
        </div>

        {/* ── Case list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {pageSlice.length === 0 ? (
            <div style={{
              padding: "30px", textAlign: "center", fontSize: 12,
              color: "var(--cs-dim)", border: "1px dashed var(--cs-border)", borderRadius: 8
            }}>
              No cases match the current filter
            </div>
          ) : (
            pageSlice.map(tc => <TcRow key={tc.id} tc={tc} onRefresh={this.refresh} envAppliedKey={this.state.envAppliedKey} />)
          )}
        </div>

        {/* ── Bottom pagination ── */}
        {
          filtered.length > pageSize && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <button disabled={safePage === 0} onClick={() => this.setState({ pageIndex: safePage - 1 })} style={{ background: "transparent", border: "1px solid var(--cs-border-sub)", color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-muted)", borderRadius: 6, padding: "5px 14px", fontFamily: MONO, fontSize: 12, cursor: safePage === 0 ? "not-allowed" : "pointer", opacity: safePage === 0 ? 0.4 : 1 }}>‹ Prev</button>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-dim)" }}>Page {safePage + 1} / {totalPages}</span>
              <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ pageIndex: safePage + 1 })} style={{ background: "transparent", border: "1px solid var(--cs-border-sub)", color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-muted)", borderRadius: 6, padding: "5px 14px", fontFamily: MONO, fontSize: 12, cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer", opacity: safePage >= totalPages - 1 ? 0.4 : 1 }}>Next ›</button>
            </div>
          )
        }

        <div ref={this.scrollRef} />
      </div >
    );
  }
}

export default ReadyForTestTab;
