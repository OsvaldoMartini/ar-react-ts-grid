import React from "react";
import { testStore, TestCase, rest, envStore, Environment, EnvTag, mockServerStore } from "./utils";
import { StatusBadge } from "./AtomComponents";
import { MockServerModal } from "./MockServerModal";

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
  bodyError: string | null;
  running: boolean;
  dirty: boolean;    // user has edited url or body
}

class TcRow extends React.Component<{ tc: TestCase; onRefresh: () => void; envAppliedKey?: string }, TcRowState> {
  constructor(props: { tc: TestCase; onRefresh: () => void; envAppliedKey?: string }) {
    super(props);
    const { tc } = props;
    this.state = {
      open: false,
      // Use the frozen URL stamped at generation/apply time — never read live envStore here.
      // This prevents pagination from silently updating URLs when env has changed.
      editUrl: tc.resolvedUrl ?? tc.path,
      editBody: tc.body ? JSON.stringify(tc.body, null, 2) : "",
      bodyError: null,
      running: false,
      dirty: false,
    };
  }

  componentDidUpdate(prev: { tc: TestCase; envAppliedKey?: string }) {
    // Only reset editUrl when "Apply to All" is explicitly clicked (envAppliedKey bumped)
    // and the user hasn't manually edited this row's URL.
    if (prev.envAppliedKey !== this.props.envAppliedKey && !this.state.dirty) {
      this.setState({ editUrl: this.props.tc.resolvedUrl ?? this.props.tc.path });
    }
  }

  private playOne = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { tc, onRefresh } = this.props;
    const { editUrl, editBody } = this.state;

    // Validate JSON body if present
    let parsedBody: Record<string, any> | null = null;
    if (editBody.trim()) {
      try { parsedBody = JSON.parse(editBody); }
      catch { this.setState({ bodyError: "Invalid JSON — fix before running" }); return; }
    }

    this.setState({ running: true, bodyError: null });
    tc.status = "running";
    onRefresh();

    const t0 = Date.now();
    try {
      await new Promise(r => setTimeout(r, 20 + Math.random() * 60));

      // Extract just the path part from the full edited URL
      let path = tc.path;
      try {
        const u = new URL(editUrl);
        path = u.pathname + u.search;
      } catch {
        // not a full URL — treat as path directly
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
      bodyError: null,
      dirty: false,
    });
  };

  render() {
    const { tc } = this.props;
    const { open, editUrl, editBody, bodyError, running, dirty } = this.state;
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

          {/* Status dot */}
          <StatusDot status={running ? "running" : tc.status} />

          {/* Seq */}
          <span style={{
            fontSize: 10, color: "var(--cs-dim)",
            background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
            borderRadius: 4, padding: "1px 6px", flexShrink: 0
          }}>
            #{tc.seq}
          </span>

          {/* Run group */}
          <span style={{ fontSize: 9, color: "var(--cs-dim)", flexShrink: 0, opacity: 0.7 }}>
            R{tc.runGroup}
          </span>

          <MChip method={tc.method} />
          <SourceBadge source={tc.dataSource} />

          {/* API title + path */}
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

          {/* Status badge + latency */}
          {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
          {tc.latency != null && (
            <span style={{ fontSize: 10, color: "var(--cs-dim)", flexShrink: 0 }}>
              {tc.latency}ms
            </span>
          )}

          {/* Dirty indicator */}
          {dirty && (
            <span title="Edited — original values changed" style={{
              fontSize: 9, color: "#f59e0b", background: "#f59e0b15",
              border: "1px solid #f59e0b33", borderRadius: 4, padding: "1px 6px",
              flexShrink: 0, fontWeight: 700,
            }}>EDITED</span>
          )}

          {/* ▶ PLAY button */}
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

          {/* Expand toggle */}
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

        {/* ══ EXPANDED EDITOR PANEL ══ */}
        {open && (
          <div style={{
            borderTop: `1px solid ${sc.border}`, padding: "12px 14px",
            display: "flex", flexDirection: "column" as const, gap: 12
          }}>

            {/* ── URL editor ── */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 6
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                  textTransform: "uppercase" as const, letterSpacing: 0.8
                }}>
                  🌐 Request URL
                </span>
                {dirty && (
                  <button onClick={this.resetEdits} style={{
                    fontSize: 9, color: "#f59e0b", background: "transparent",
                    border: "1px solid #f59e0b33", borderRadius: 4, padding: "1px 7px",
                    cursor: "pointer", fontFamily: MONO,
                  }}>↺ Reset to original</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {/* Method badge */}
                <span style={{
                  fontSize: 10, fontWeight: 800, color: mc,
                  background: mc + "18", border: `1px solid ${mc}40`,
                  borderRadius: 5, padding: "6px 10px", flexShrink: 0
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
                    background: "var(--cs-bg)", border: `1px solid ${dirty ? "#f59e0b66" : "var(--cs-border)"}`,
                    borderRadius: 7, color: "var(--cs-text)", outline: "none",
                    transition: "border-color .15s",
                  }}
                  onFocus={e => (e.target.style.borderColor = mc + "88")}
                  onBlur={e => (e.target.style.borderColor = dirty ? "#f59e0b66" : "var(--cs-border)")}
                />
              </div>
            </div>

            {/* ── Body editor (only for POST/PATCH/PUT) ── */}
            {hasBody && (
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 6
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                    textTransform: "uppercase" as const, letterSpacing: 0.8
                  }}>
                    📦 Request Body <span style={{ opacity: 0.5, fontWeight: 400 }}>JSON</span>
                  </span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {bodyError && (
                      <span style={{
                        fontSize: 9, color: "#f87171",
                        background: "#f8717115", border: "1px solid #f8717133",
                        borderRadius: 4, padding: "2px 8px"
                      }}>
                        ⚠ {bodyError}
                      </span>
                    )}
                    <button onClick={e => {
                      e.stopPropagation();
                      try {
                        const pretty = JSON.stringify(JSON.parse(editBody), null, 2);
                        this.setState({ editBody: pretty, bodyError: null });
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
                  rows={Math.min(18, Math.max(4, editBody.split("\n").length + 1))}
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
              disabled={running || !!bodyError}
              style={{
                alignSelf: "flex-start" as const,
                padding: "8px 22px", borderRadius: 7, cursor: running || !!bodyError ? "not-allowed" : "pointer",
                background: running || !!bodyError
                  ? "var(--cs-surface-2)"
                  : `linear-gradient(135deg, ${mc}22, ${mc}44)`,
                border: `1.5px solid ${running || !!bodyError ? "var(--cs-border)" : mc + "88"}`,
                color: running || !!bodyError ? "var(--cs-dim)" : mc,
                fontFamily: MONO, fontSize: 12, fontWeight: 800,
                display: "flex", alignItems: "center", gap: 8,
                opacity: running || !!bodyError ? 0.6 : 1,
                transition: "all .15s",
              }}>
              {running ? "⟳  Running…" : `▶  Run  ${tc.method}  ${tc.path}`}
            </button>

            {/* ── Response panel ── */}
            {tc.result != null && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                    textTransform: "uppercase" as const, letterSpacing: 0.8
                  }}>Response</span>
                  {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
                  {tc.latency != null && (
                    <span style={{ fontSize: 10, color: "var(--cs-dim)" }}>{tc.latency}ms</span>
                  )}
                  {tc.resolvedUrl && (
                    <span style={{
                      fontSize: 9, color: "var(--cs-dim)", opacity: 0.6,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1
                    }}>
                      → {tc.resolvedUrl}
                    </span>
                  )}
                </div>
                <pre style={{
                  fontFamily: MONO, fontSize: 10, margin: 0,
                  background: isOk ? "#34d39908" : isFail ? "#f8717108" : "var(--cs-bg)",
                  border: `1px solid ${isOk ? "#34d39933" : isFail ? "#f8717133" : "var(--cs-border-sub)"}`,
                  borderRadius: 7, padding: "10px 12px", overflowX: "auto",
                  maxHeight: 260, color: isOk ? "#34d399" : isFail ? "#f87171" : "var(--cs-muted)",
                  lineHeight: 1.55,
                }}>
                  {JSON.stringify(tc.result, null, 2)}
                </pre>
              </div>
            )}

            {/* ── Meta footer ── */}
            <div style={{
              display: "flex", gap: 14, fontSize: 9, color: "var(--cs-dim)",
              flexWrap: "wrap" as const, paddingTop: 4, borderTop: "1px solid var(--cs-border-sub)"
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
  local: "LOCAL",
  development: "DEV",
  staging: "STAGING",
  production: "PROD",
  custom: "CUSTOM",
};

interface EnvBarState {
  open: boolean;
  editingId: string | null;
  editUrl: string;
  addingNew: boolean;
  newName: string;
  newUrl: string;
  envTick: number;
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
    this.setState({
      addingNew: false, newName: "", newUrl: "",
      open: false, envTick: this.state.envTick + 1
    });
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

          {/* Left: env label */}
          <div style={{
            padding: "10px 14px", borderRight: "1px solid var(--cs-border-sub)",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: sel.color,
              boxShadow: isProd ? `0 0 6px ${sel.color}` : "none",
              display: "inline-block",
            }} />
            <span style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 800,
              color: sel.color, letterSpacing: 0.8
            }}>
              {ENV_TAG_LABELS[sel.tag]}
            </span>
            <span style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              color: "var(--cs-text)"
            }}>{sel.name}</span>
          </div>

          {/* Middle: resolved URL */}
          <div style={{
            flex: 1, padding: "10px 16px", fontFamily: MONO, fontSize: 11,
            color: "var(--cs-muted)", overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", minWidth: 0
          }}>
            {sel.baseUrl}
            <span style={{ color: "var(--cs-dim)", opacity: 0.5 }}>/&lt;resource&gt;/&lt;id&gt;</span>
          </div>

          {/* Right: dropdown toggle */}
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
            {/* Header */}
            <div style={{
              padding: "10px 16px", borderBottom: "1px solid var(--cs-border-sub)",
              background: "var(--cs-surface-2)", fontFamily: MONO, fontSize: 10,
              fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8,
              textTransform: "uppercase" as const
            }}>
              Select Environment
            </div>

            {/* Env list */}
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
                  {/* Dot */}
                  <span style={{
                    width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                    background: env.color, boxShadow: isProdEnv ? `0 0 5px ${env.color}` : "none",
                    display: "inline-block"
                  }} />

                  {/* Tag */}
                  <span style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 800,
                    color: env.color, letterSpacing: 0.8, flexShrink: 0, width: 60
                  }}>
                    {ENV_TAG_LABELS[env.tag]}
                  </span>

                  {/* Name */}
                  <span style={{
                    fontFamily: MONO, fontSize: 12, fontWeight: 600,
                    color: isSelected ? "var(--cs-text)" : "var(--cs-muted)",
                    flexShrink: 0, width: 110
                  }}>
                    {env.name}
                  </span>

                  {/* URL (editable) */}
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

                  {/* Actions */}
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
                          }}
                            style={{
                              background: "transparent", border: "1px solid #f8717133",
                              color: "#f87171", borderRadius: 5, padding: "2px 6px",
                              fontFamily: MONO, fontSize: 10, cursor: "pointer"
                            }}>✕</button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Selected tick */}
                  {isSelected && !isEditing && (
                    <span style={{ color: env.color, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>✓</span>
                  )}
                </div>
              );
            })}

            {/* Add custom */}
            {addingNew ? (
              <div style={{
                padding: "12px 16px", borderTop: "1px solid var(--cs-border-sub)",
                display: "flex", flexDirection: "column" as const, gap: 8,
                background: "#a78bfa08"
              }}>
                <div style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 700,
                  color: "#a78bfa", letterSpacing: 0.8
                }}>ADD CUSTOM ENVIRONMENT</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Name (e.g. QA)"
                    value={newName}
                    onChange={e => this.setState({ newName: e.target.value })}
                    onKeyDown={e => e.stopPropagation()}
                    style={{
                      width: 130, padding: "6px 10px", fontFamily: MONO, fontSize: 11,
                      background: "var(--cs-input-bg)", border: "1px solid var(--cs-border)",
                      borderRadius: 6, color: "var(--cs-text)", outline: "none"
                    }} />
                  <input placeholder="https://api.example.com"
                    value={newUrl}
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

// Build a flat union of all field keys across all test case bodies
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

    // Build CSV rows
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
        // Escape CSV: wrap in quotes if contains comma/newline/quote
        if (/[",\n\r]/.test(val)) val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Trigger browser save-as dialog via <a download>
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

    // Fixed columns (meta) vs body columns
    const metaCols = ["#", "run", "method", "api", "path"];
    const bodyCols = cols.filter(c => !metaCols.includes(c));

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          width: "min(1200px, 96vw)", maxHeight: "92vh",
          background: "var(--cs-surface)", border: "1px solid var(--cs-border)",
          borderRadius: 14, display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}>

          {/* ── Modal header ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid var(--cs-border)",
            background: "var(--cs-surface-2)", flexShrink: 0,
          }}>
            <div>
              <div style={{
                fontFamily: MONO, fontSize: 14, fontWeight: 800,
                color: "#34d399", marginBottom: 4
              }}>
                ⚗ Synthetic Test Data
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)" }}>
                {cases.length.toLocaleString()} cases · {bodyCols.length} body field{bodyCols.length !== 1 ? "s" : ""}
                · {cols.length} total columns
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* CSV download */}
              <button onClick={this.downloadCSV} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 8, cursor: "pointer",
                background: "linear-gradient(135deg, #1a4a2a, #34d399)",
                border: "1.5px solid #34d399", color: "#0a1f15",
                fontFamily: MONO, fontSize: 12, fontWeight: 800,
              }}>
                ↓ Save as CSV
              </button>

              {/* Close */}
              <button onClick={onClose} style={{
                width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                background: "transparent", border: "1px solid var(--cs-border)",
                color: "var(--cs-muted)", fontFamily: MONO, fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          </div>

          {/* ── Pagination controls ── */}
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
              <button disabled={safePage === 0}
                onClick={() => this.setState({ page: 0 })}
                style={{
                  background: "transparent", border: "1px solid var(--cs-border-sub)",
                  color: "var(--cs-muted)", borderRadius: 6, padding: "3px 8px",
                  fontFamily: MONO, fontSize: 11, cursor: safePage === 0 ? "not-allowed" : "pointer",
                  opacity: safePage === 0 ? 0.4 : 1
                }}>«</button>
              <button disabled={safePage === 0}
                onClick={() => this.setState({ page: safePage - 1 })}
                style={{
                  background: "transparent", border: "1px solid var(--cs-border-sub)",
                  color: "var(--cs-muted)", borderRadius: 6, padding: "3px 10px",
                  fontFamily: MONO, fontSize: 11, cursor: safePage === 0 ? "not-allowed" : "pointer",
                  opacity: safePage === 0 ? 0.4 : 1
                }}>‹ Prev</button>

              <span style={{
                fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)",
                padding: "3px 10px", background: "var(--cs-surface-2)",
                border: "1px solid var(--cs-border-sub)", borderRadius: 6
              }}>
                {start + 1}–{Math.min(start + pageSize, cases.length)} of {cases.length.toLocaleString()}
              </span>

              <button disabled={safePage >= totalPages - 1}
                onClick={() => this.setState({ page: safePage + 1 })}
                style={{
                  background: "transparent", border: "1px solid var(--cs-border-sub)",
                  color: "var(--cs-muted)", borderRadius: 6, padding: "3px 10px",
                  fontFamily: MONO, fontSize: 11,
                  cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                  opacity: safePage >= totalPages - 1 ? 0.4 : 1
                }}>Next ›</button>
              <button disabled={safePage >= totalPages - 1}
                onClick={() => this.setState({ page: totalPages - 1 })}
                style={{
                  background: "transparent", border: "1px solid var(--cs-border-sub)",
                  color: "var(--cs-muted)", borderRadius: 6, padding: "3px 8px",
                  fontFamily: MONO, fontSize: 11,
                  cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                  opacity: safePage >= totalPages - 1 ? 0.4 : 1
                }}>»</button>
            </div>

            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
              Page {safePage + 1} / {totalPages}
            </span>
          </div>

          {/* ── Grid ── */}
          <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              background: "var(--cs-bg)", tableLayout: "auto"
            }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr>
                  {/* Meta columns */}
                  {metaCols.map(col => (
                    <th key={col} style={{
                      padding: "9px 12px", background: "var(--cs-surface-2)",
                      borderBottom: "2px solid var(--cs-border)",
                      borderRight: col === "path" ? "2px solid var(--cs-border)" : "1px solid var(--cs-border-sub)",
                      fontFamily: MONO, fontSize: 9, fontWeight: 700,
                      color: "var(--cs-dim)", textTransform: "uppercase",
                      letterSpacing: 0.8, textAlign: "left", whiteSpace: "nowrap",
                      position: "sticky", top: 0,
                    }}>{col}</th>
                  ))}
                  {/* Body field columns */}
                  {bodyCols.map(col => (
                    <th key={col} style={{
                      padding: "9px 12px", background: "#34d39908",
                      borderBottom: "2px solid var(--cs-border)",
                      borderRight: "1px solid var(--cs-border-sub)",
                      fontFamily: MONO, fontSize: 9, fontWeight: 700,
                      color: "#34d399", textTransform: "uppercase",
                      letterSpacing: 0.8, textAlign: "left", whiteSpace: "nowrap",
                      position: "sticky", top: 0,
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((tc, ri) => {
                  const isEven = ri % 2 === 0;
                  const mc = METHOD_COLORS[tc.method] || "#8b949e";
                  return (
                    <tr key={tc.id} style={{
                      background: isEven ? "var(--cs-bg)" : "var(--cs-surface)",
                    }}>
                      {/* # */}
                      <td style={{
                        padding: "7px 12px", fontFamily: MONO, fontSize: 10,
                        color: "var(--cs-dim)", borderBottom: "1px solid var(--cs-border-sub)",
                        borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap"
                      }}>
                        {tc.seq}
                      </td>
                      {/* run */}
                      <td style={{
                        padding: "7px 12px", fontFamily: MONO, fontSize: 10,
                        color: "var(--cs-dim)", borderBottom: "1px solid var(--cs-border-sub)",
                        borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap"
                      }}>
                        R{tc.runGroup}
                      </td>
                      {/* method */}
                      <td style={{
                        padding: "7px 12px", borderBottom: "1px solid var(--cs-border-sub)",
                        borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap"
                      }}>
                        <MChip method={tc.method} />
                      </td>
                      {/* api */}
                      <td style={{
                        padding: "7px 12px", fontFamily: MONO, fontSize: 11,
                        color: "var(--cs-text)", fontWeight: 600,
                        borderBottom: "1px solid var(--cs-border-sub)",
                        borderRight: "1px solid var(--cs-border-sub)", whiteSpace: "nowrap",
                        maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {tc.apiTitle}
                      </td>
                      {/* path */}
                      <td style={{
                        padding: "7px 12px", fontFamily: MONO, fontSize: 10,
                        color: "var(--cs-muted)", borderBottom: "1px solid var(--cs-border-sub)",
                        borderRight: "2px solid var(--cs-border)", whiteSpace: "nowrap"
                      }}>
                        {tc.path}
                      </td>
                      {/* body field cells */}
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
                            maxWidth: 160, overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
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

          {/* ── Modal footer ── */}
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
  envTick: number;
  lastAppliedEnvId: string;
  envAppliedKey: string;
  currentExecUrl: string | null;
  executionMode: "flow" | "independent";
  flowTimeoutSec: number;
}

export class ReadyForTestTab extends React.Component<{ onClearAll?: () => void }, RftState> {
  state: RftState = {
    tick: 0, pageSize: 10, pageIndex: 0, running: false,
    runProgress: 0, filter: "all", methodFilter: "ALL",
    expandReport: false, showModal: false, showMockModal: false,
    envTick: 0,
    lastAppliedEnvId: envStore.selectedId,
    envAppliedKey: envStore.selectedId,
    currentExecUrl: null,
    executionMode: "flow",
    flowTimeoutSec: 15,
  };

  private scrollRef = React.createRef<HTMLDivElement>();

  // Refresh from store
  private refresh = () => this.setState(s => ({ tick: s.tick + 1 }));

  // Re-resolve all test case URLs to the currently selected environment
  private applyEnvToAll = () => {
    const newBase = envStore.selected.baseUrl;
    let updated = 0;
    for (const tc of testStore.cases) {
      tc.resolvedUrl = envStore.resolve(tc.path);
      updated++;
    }
    const key = `${envStore.selectedId}-${Date.now()}`;
    this.setState(s => ({
      lastAppliedEnvId: envStore.selectedId,
      envAppliedKey: key,
      tick: s.tick + 1,
    }));
  };

  // Reset all executed cases back to pending — preserves test cases, clears results only
  private resetToPending = () => {
    for (const tc of testStore.cases) {
      if (tc.status === "passed" || tc.status === "failed" || tc.status === "running") {
        tc.status = "pending";
        tc.httpStatus = undefined;
        tc.latency = undefined;
        tc.result = undefined;
        tc.headers = undefined;
        // resolvedUrl intentionally preserved — URL ownership doesn't change on reset
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

    this.setState({ running: true, runProgress: 0 });
    const ctx: Record<string, number> = {};

    for (let i = 0; i < cases.length; i++) {
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
          } catch {
            return tc.resolvedUrl;
          }
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
  };

  // ── EXECUTE a page of cases ──
  private executeBlock = async () => {
    const { pageSize, pageIndex } = this.state;
    const visible = this.getFiltered();
    const start = pageIndex * pageSize;
    const block = visible.slice(start, start + pageSize).filter(c => c.status === "pending");
    await this.executeCases(block);
  };

  // ── EXECUTE ALL pending ──
  private executeAll = async () => {
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
    const { tick, pageSize, pageIndex, running, runProgress, filter, methodFilter, expandReport, showModal, showMockModal, envTick, lastAppliedEnvId, envAppliedKey, currentExecUrl, executionMode, flowTimeoutSec } = this.state;
    const allCases = testStore.cases;
    const total = allCases.length;
    const pending = allCases.filter(c => c.status === "pending").length;
    const passed = allCases.filter(c => c.status === "passed").length;
    const failed = allCases.filter(c => c.status === "failed").length;
    const running_n = allCases.filter(c => c.status === "running").length;
    const avgLat = passed + failed > 0
      ? Math.round(allCases.filter(c => c.latency != null)
        .reduce((a, c) => a + (c.latency || 0), 0) / (passed + failed))
      : 0;
    const pct = total - pending > 0
      ? Math.round((passed / (total - pending - running_n)) * 100)
      : 0;
    const pctCol = pct === 100 ? "#34d399" : pct >= 70 ? "#f59e0b" : "#f87171";

    // Source breakdown
    const synthCount = allCases.filter(c => c.dataSource === "synthetic").length;
    const fileCount = allCases.filter(c => c.dataSource === "file").length;

    // Method list for filter
    const methods = ["ALL", ...new Set(allCases.map(c => c.method))];

    // Filtered + paginated
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cs-muted)" }}>
            No test cases queued
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, textAlign: "center", maxWidth: 380, lineHeight: 1.7 }}>
            Go to <strong style={{ color: "var(--cs-text)" }}>⚗ Data Generator</strong> to select APIs
            and generate synthetic test cases,<br />or import test data from a file.
          </div>
        </div>
      );
    }

    const synthCases = allCases.filter(c => c.dataSource === "synthetic");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: MONO }}>

        {/* ── Mock Server Modal (floating, non-blocking) ── */}
        {showMockModal && (
          <MockServerModal
            onClose={() => this.setState({ showMockModal: false })}
            onEnvChanged={() => this.setState(s => ({ envTick: s.envTick + 1 }))}
          />
        )}

        {/* ── Synthetic data modal ── */}
        {showModal && synthCases.length > 0 && (
          <SyntheticDataModal
            cases={synthCases}
            onClose={() => this.setState({ showModal: false })}
          />
        )}

        {/* ══════════════════════════════════════════════════════
            ENVIRONMENT ENDPOINT SELECTOR
            Select target environment before executing tests
        ══════════════════════════════════════════════════════ */}
        <div style={{
          borderRadius: 12,
          border: "1px solid var(--cs-border)",
          position: "relative" as const,
        }}>
          {/* Section label */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px",
            background: "var(--cs-surface-2)",
            borderBottom: "1px solid var(--cs-border-sub)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🌐</span>
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 800,
                color: "var(--cs-text)", letterSpacing: 0.3
              }}>
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

          {/* EnvBar */}
          <div style={{ padding: "12px 16px", background: "var(--cs-bg)" }}>
            <EnvBar onChange={() => this.setState(s => ({ envTick: s.envTick + 1 }))} />
          </div>

          {/* Apply env to all tests — action strip */}
          {(() => {
            const { lastAppliedEnvId, envAppliedKey } = this.state;
            const sel = envStore.selected;
            const isStale = lastAppliedEnvId !== sel.id;
            const count = testStore.total;
            return (
              <div style={{
                padding: "8px 16px",
                borderTop: "1px solid var(--cs-border-sub)",
                background: isStale ? "#f59e0b08" : "var(--cs-surface-2)",
                display: "flex", alignItems: "center", gap: 10,
                transition: "background .2s",
              }}>
                {/* Status badge */}
                {isStale ? (
                  <span style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700,
                    color: "#f59e0b", background: "#f59e0b15",
                    border: "1px solid #f59e0b44", borderRadius: 4,
                    padding: "2px 8px", flexShrink: 0, whiteSpace: "nowrap" as const
                  }}>
                    ⚠ {count.toLocaleString()} test{count !== 1 ? "s" : ""} use old endpoint
                  </span>
                ) : count > 0 ? (
                  <span style={{
                    fontFamily: MONO, fontSize: 9, color: "#34d399",
                    background: "#34d39912", border: "1px solid #34d39930",
                    borderRadius: 4, padding: "2px 8px", flexShrink: 0, whiteSpace: "nowrap" as const
                  }}>
                    ✓ {count.toLocaleString()} tests synced
                  </span>
                ) : null}

                {/* URL */}
                <code style={{
                  fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)",
                  background: "var(--cs-bg)", border: "1px solid var(--cs-border-sub)",
                  borderRadius: 5, padding: "3px 10px", flex: 1, minWidth: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const
                }}>
                  {sel.baseUrl}<span style={{ opacity: 0.4 }}>/<em>resource</em></span>
                </code>

                {/* Apply button */}
                {count > 0 && (
                  <button
                    onClick={this.applyEnvToAll}
                    style={{
                      flexShrink: 0, padding: "5px 13px", borderRadius: 6,
                      cursor: "pointer", fontFamily: MONO, fontSize: 10, fontWeight: 800,
                      transition: "all .15s",
                      background: isStale
                        ? "linear-gradient(135deg, #7a4a00, #f59e0b)"
                        : sel.color + "18",
                      border: `1.5px solid ${isStale ? "#f59e0b" : sel.color + "55"}`,
                      color: isStale ? "#0a0800" : sel.color,
                      boxShadow: isStale ? "0 0 12px #f59e0b44" : "none",
                    }}
                    onMouseEnter={e => {
                      if (isStale) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px #f59e0b66";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = isStale ? "0 0 12px #f59e0b44" : "none";
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
          background: "var(--cs-surface-2)",
          border: "1px solid var(--cs-border)"
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 10
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--cs-text)", marginBottom: 5, fontFamily: MONO }}>
                🧪 Ready for Test
              </div>
              <div style={{ fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.6, fontFamily: MONO }}>
                {total.toLocaleString()} test case{total !== 1 ? "s" : ""} queued
                <span style={{ marginLeft: 10, opacity: 0.5 }}>·</span>
                <span style={{ marginLeft: 10 }}>
                  {synthCount > 0 && (
                    <span style={{ color: "#34d399", marginRight: 8 }}>⚗ {synthCount.toLocaleString()} Synthetic</span>
                  )}
                  {fileCount > 0 && (
                    <span style={{ color: "#60a5fa" }}>📄 {fileCount.toLocaleString()} File</span>
                  )}
                </span>
              </div>
            </div>

            {/* Data source legend / buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {synthCount > 0 && (
                <button
                  onClick={() => this.setState({ showModal: true })}
                  style={{
                    padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                    background: "#34d39912", border: "1px solid #34d39944",
                    fontSize: 11, color: "#34d399", fontFamily: MONO, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#34d39922";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#34d399";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#34d39912";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#34d39944";
                  }}
                >
                  ⚗ Synthetic · auto-generated banking data
                  <span style={{ opacity: 0.6, fontSize: 10 }}>↗ View data</span>
                </button>
              )}
              {fileCount > 0 && (
                <div style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "#60a5fa12", border: "1px solid #60a5fa33",
                  fontSize: 11, color: "#60a5fa", fontFamily: MONO
                }}>
                  📄 File · imported from upload
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Execution mode ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
        }}>
          <button
            type="button"
            disabled={running}
            onClick={() => this.setState({ executionMode: "flow" })}
            style={{
              textAlign: "left",
              padding: "16px 18px",
              borderRadius: 12,
              cursor: running ? "not-allowed" : "pointer",
              background: executionMode === "flow"
                ? "linear-gradient(135deg, #7a4a00, #f59e0b)"
                : "var(--cs-surface-2)",
              border: `1.5px solid ${executionMode === "flow" ? "#f59e0b" : "var(--cs-border)"}`,
              color: executionMode === "flow" ? "#1b1200" : "var(--cs-text)",
              boxShadow: executionMode === "flow" ? "0 0 18px #f59e0b33" : "none",
              opacity: running ? 0.75 : 1,
              transition: "all .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800 }}>
                ▶ Execution Flow {executionMode === "flow" ? "· Default" : ""}
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 800,
                borderRadius: 999, padding: "3px 9px",
                background: executionMode === "flow" ? "#fff3" : "#f59e0b15",
                color: executionMode === "flow" ? "#fff" : "#f59e0b",
                border: `1px solid ${executionMode === "flow" ? "#fff4" : "#f59e0b33"}`,
              }}>
                {executionMode === "flow" ? "ACTIVE" : "Select"}
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.65, color: executionMode === "flow" ? "#fff8" : "var(--cs-muted)" }}>
              10 API calls executed according to the dependency graph and HTTP method order
              (POST → GET → PATCH → DELETE).
              <br /><br />
              IDs generated by each POST request are automatically propagated and reused in subsequent API calls.
              <br /><br />
              In this mode, each request waits for the previous response before executing the next one.
            </div>
          </button>

          <button
            type="button"
            disabled={running}
            onClick={() => this.setState({ executionMode: "independent" })}
            style={{
              textAlign: "left",
              padding: "16px 18px",
              borderRadius: 12,
              cursor: running ? "not-allowed" : "pointer",
              background: executionMode === "independent"
                ? "linear-gradient(135deg, #dff7f4, #95d7d1)"
                : "var(--cs-surface-2)",
              border: `1.5px solid ${executionMode === "independent" ? "#95d7d1" : "var(--cs-border)"}`,
              color: executionMode === "independent" ? "#0d3733" : "var(--cs-text)",
              boxShadow: executionMode === "independent" ? "0 0 18px rgba(149, 215, 209, .28)" : "none",
              opacity: running ? 0.75 : 1,
              transition: "all .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800 }}>
                ⚗ Independent Execution
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 800,
                borderRadius: 999, padding: "3px 9px",
                background: executionMode === "independent" ? "#ffffff55" : "rgba(149, 215, 209, .14)",
                color: executionMode === "independent" ? "#0d3733" : "#95d7d1",
                border: `1px solid ${executionMode === "independent" ? "#ffffff66" : "rgba(149, 215, 209, .35)"}`,
              }}>
                {executionMode === "independent" ? "ACTIVE" : "Select"}
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.65, color: executionMode === "independent" ? "#0d3733" : "var(--cs-muted)" }}>
              Executes each API independently, without dependency chaining.
              <br /><br />
              Synthetic data generated by the system is attached directly to each request.
              <br /><br />
              No previous response is required before the next API request can be executed.
            </div>
          </button>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
          padding: "12px 14px", borderRadius: 10,
          background: executionMode === "flow" ? "#f59e0b0d" : "#95d7d112",
          border: `1px solid ${executionMode === "flow" ? "#f59e0b2f" : "rgba(149, 215, 209, .32)"}`,
        }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: executionMode === "flow" ? "#f59e0b" : "#95d7d1", marginBottom: 4 }}>
              {executionMode === "flow" ? "Flow execution is active" : "Independent execution is active"}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)", lineHeight: 1.6 }}>
              {executionMode === "flow"
                ? "Each API call waits for the previous response. Timeout applies per request in the dependency chain."
                : "Each request runs with its own generated payload and does not depend on IDs or responses from previous calls."}
            </div>
          </div>

          <label style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
            opacity: executionMode === "flow" ? 1 : 0.55,
          }}>
            <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>FLOW TIMEOUT</span>
            <input
              type="number"
              min={1}
              max={120}
              step={1}
              value={flowTimeoutSec}
              disabled={running || executionMode !== "flow"}
              onChange={e => {
                const next = Number(e.target.value);
                this.setState({ flowTimeoutSec: Number.isFinite(next) ? next : 15 });
              }}
              onBlur={() => this.setState({ flowTimeoutSec: this.getSafeFlowTimeoutSec() })}
              style={{
                width: 72,
                padding: "7px 10px",
                borderRadius: 8,
                border: `1px solid ${executionMode === "flow" ? "#f59e0b55" : "var(--cs-border)"}`,
                background: "var(--cs-bg)",
                color: "var(--cs-text)",
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 700,
                outline: "none",
              }}
            />
            <span style={{ fontSize: 11, color: executionMode === "flow" ? "#f59e0b" : "var(--cs-dim)" }}>sec</span>
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
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "var(--cs-muted)", marginBottom: 5
            }}>
              <span>Execution progress ({passed + failed} / {total - running_n} executed)</span>
              <span style={{ fontWeight: 700, color: pctCol }}>{pct}% pass</span>
            </div>
            <div style={{
              height: 10, borderRadius: 5, background: "var(--cs-surface-2)",
              overflow: "hidden", display: "flex"
            }}>
              {passed > 0 && (
                <div style={{
                  height: "100%", background: "#34d399",
                  width: `${(passed / total) * 100}%`, transition: "width .4s ease"
                }} />
              )}
              {failed > 0 && (
                <div style={{
                  height: "100%", background: "#f87171",
                  width: `${(failed / total) * 100}%`, transition: "width .4s ease"
                }} />
              )}
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
          /* ── All done — show summary + reset option ── */
          <div style={{
            borderRadius: 10, border: `1px solid ${failed > 0 ? "#f8717133" : "#34d39933"}`,
            background: failed > 0 ? "#f8717108" : "#34d39908",
            padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const,
          }}>
            {/* Result summary */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: MONO, fontSize: 13, fontWeight: 800,
                color: failed > 0 ? "#f87171" : "#34d399", marginBottom: 4
              }}>
                {failed > 0 ? "⚠ Execution complete with failures" : "✓ All tests passed"}
              </div>
              <div style={{
                display: "flex", gap: 14, fontFamily: MONO, fontSize: 10,
                color: "var(--cs-dim)", flexWrap: "wrap" as const
              }}>
                <span style={{ color: "#34d399" }}>✓ {passed} passed</span>
                {failed > 0 && <span style={{ color: "#f87171" }}>✗ {failed} failed</span>}
                <span>⚡ avg {avgLat > 0 ? avgLat + "ms" : "—"}</span>
                <span style={{ opacity: 0.6 }}>Results are preserved</span>
              </div>
            </div>

            {/* Reset to Pending */}
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
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "#60a5fa88";
                b.style.color = "#60a5fa";
                b.style.background = "#60a5fa10";
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "var(--cs-border)";
                b.style.color = "var(--cs-muted)";
                b.style.background = "var(--cs-surface-2)";
              }}
            >
              ↺ Reset to Pending
            </button>

            {/* Re-run All */}
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
          /* ── Pending tests exist — show execute buttons ── */
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
                color: running ? "var(--cs-dim)" : "#0a1f15",
                fontFamily: MONO, fontSize: 12, fontWeight: 800, transition: "all .15s",
                opacity: running ? 0.5 : 1,
              }}>
              {running ? "⏳ Running…" : `${executionMode === "flow" ? "▶▶ Execute Flow" : "⚗ Execute Independent"}  —  ${pending.toLocaleString()} pending`}
            </button>
          </div>
        ) : null}

        {/* Running progress bar */}
        {running && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "#f59e0b10", border: "1px solid #f59e0b33"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "#f59e0b", marginBottom: 6, flexWrap: "wrap", gap: 6
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>⏳ Executing {executionMode === "flow" ? "flow" : "independent mode"}…</span>
                {(() => {
                  // Resolve env from the current test case's frozen URL
                  const url = this.state.currentExecUrl;
                  if (!url) return null;
                  const matchedEnv = envStore.envs.find(e =>
                    url.startsWith(e.baseUrl)
                  ) || null;
                  const color = matchedEnv?.color || "#8b949e";
                  const label = matchedEnv?.name || (() => {
                    try { return new URL(url).hostname; } catch { return url; }
                  })();
                  const isProd = matchedEnv?.tag === "production";
                  return (
                    <span style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: color + "18", border: `1px solid ${color}44`,
                      borderRadius: 4, padding: "1px 8px",
                      color, fontSize: 10, fontWeight: 700
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: color, display: "inline-block",
                        boxShadow: isProd ? `0 0 4px ${color}` : "none"
                      }} />
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

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Status filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "pending", "passed", "failed"] as const).map(f => {
              const active = filter === f;
              const cols = f === "passed" ? "#34d399" : f === "failed" ? "#f87171"
                : f === "pending" ? "#8b949e" : "var(--cs-accent)";
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

          {/* Method filter */}
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

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {/* Mock Server button */}
            <button
              onClick={() => this.setState(s => ({ showMockModal: !s.showMockModal }))}
              title="Open Mock Server panel — start a local in-browser mock and download a Node.js server script"
              style={{
                background: showMockModal || mockServerStore.status === "running"
                  ? "#a78bfa22" : "transparent",
                border: `1px solid ${mockServerStore.status === "running" ? "#a78bfa88" : "#a78bfa44"}`,
                color: mockServerStore.status === "running" ? "#a78bfa" : "var(--cs-muted)",
                borderRadius: 6, padding: "4px 12px",
                fontFamily: MONO, fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                transition: "all .15s",
              }}>
              {mockServerStore.status === "running" && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#a78bfa", display: "inline-block",
                  boxShadow: "0 0 5px #a78bfa",
                }} />
              )}
              ⚡ Mock Server
            </button>

            {(passed + failed) > 0 && (
              <button
                onClick={this.resetToPending}
                title="Reset execution results — test cases stay, only status/results are cleared"
                style={{
                  background: "transparent", border: "1px solid #60a5fa33",
                  color: "#60a5fa", borderRadius: 6, padding: "4px 12px",
                  fontFamily: MONO, fontSize: 11, cursor: "pointer"
                }}>
                ↺ Reset
              </button>
            )}
            <button onClick={() => { testStore.clear(); this.refresh(); this.props.onClearAll?.(); }}
              style={{
                background: "transparent", border: "1px solid #f8717133",
                color: "#f87171", borderRadius: 6, padding: "4px 12px",
                fontFamily: MONO, fontSize: 11, cursor: "pointer"
              }}>
              🗑 Clear all
            </button>
          </div>
        </div>

        {/* ── Pagination controls ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Page size */}
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

          {/* Page nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <button
              disabled={safePage === 0}
              onClick={() => this.setState({ pageIndex: 0 })}
              style={{
                background: "transparent", border: "1px solid var(--cs-border-sub)",
                color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-muted)",
                borderRadius: 6, padding: "3px 8px", fontFamily: MONO, fontSize: 11,
                cursor: safePage === 0 ? "not-allowed" : "pointer", opacity: safePage === 0 ? 0.4 : 1
              }}>
              «
            </button>
            <button
              disabled={safePage === 0}
              onClick={() => this.setState({ pageIndex: safePage - 1 })}
              style={{
                background: "transparent", border: "1px solid var(--cs-border-sub)",
                color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-muted)",
                borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11,
                cursor: safePage === 0 ? "not-allowed" : "pointer", opacity: safePage === 0 ? 0.4 : 1
              }}>
              ‹ Prev
            </button>

            {/* Page number chips */}
            {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
              // Window of pages around current
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

            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => this.setState({ pageIndex: safePage + 1 })}
              style={{
                background: "transparent", border: "1px solid var(--cs-border-sub)",
                color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-muted)",
                borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11,
                cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                opacity: safePage >= totalPages - 1 ? 0.4 : 1
              }}>
              Next ›
            </button>
            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => this.setState({ pageIndex: totalPages - 1 })}
              style={{
                background: "transparent", border: "1px solid var(--cs-border-sub)",
                color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-muted)",
                borderRadius: 6, padding: "3px 8px", fontFamily: MONO, fontSize: 11,
                cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                opacity: safePage >= totalPages - 1 ? 0.4 : 1
              }}>
              »
            </button>
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
            pageSlice.map((tc, i) => <TcRow key={tc.id} tc={tc} onRefresh={this.refresh} envAppliedKey={this.state.envAppliedKey} />)
          )}
        </div>

        {/* ── Bottom pagination repeat ── */}
        {filtered.length > pageSize && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <button disabled={safePage === 0}
              onClick={() => this.setState({ pageIndex: safePage - 1 })} style={{
                background: "transparent", border: "1px solid var(--cs-border-sub)",
                color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-muted)",
                borderRadius: 6, padding: "5px 14px", fontFamily: MONO, fontSize: 12,
                cursor: safePage === 0 ? "not-allowed" : "pointer", opacity: safePage === 0 ? 0.4 : 1
              }}>
              ‹ Prev
            </button>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-dim)" }}>
              Page {safePage + 1} / {totalPages}
            </span>
            <button disabled={safePage >= totalPages - 1}
              onClick={() => this.setState({ pageIndex: safePage + 1 })} style={{
                background: "transparent", border: "1px solid var(--cs-border-sub)",
                color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-muted)",
                borderRadius: 6, padding: "5px 14px", fontFamily: MONO, fontSize: 12,
                cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                opacity: safePage >= totalPages - 1 ? 0.4 : 1
              }}>
              Next ›
            </button>
          </div>
        )}

        <div ref={this.scrollRef} />
      </div>
    );
  }
}

export default ReadyForTestTab;
