import React from "react";
import "./mt-atoms.scss";

// ═══════════════════════════════════════════════════════════════
// METHOD BADGE  (HTTP verb colored chip)
// ═══════════════════════════════════════════════════════════════
interface MBProps { method: string; }

export class MethodBadge extends React.Component<MBProps> {
  private modClass(): string {
    const m = this.props.method.toUpperCase();
    if (m === "GET") return "get";
    if (m === "POST") return "post";
    if (m === "PATCH" || m === "PUT") return "patch";
    if (m === "DELETE") return "delete";
    if (m === "RPC") return "rpc";
    return "default";
  }

  render() {
    return (
      <span className={`mt-method-badge mt-method-badge--${this.modClass()}`}>
        {this.props.method}
      </span>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE  (HTTP status code colored chip)
// ═══════════════════════════════════════════════════════════════
interface SBProps { status: number | string | undefined; }

export class StatusBadge extends React.Component<SBProps> {
  private modClass(): string {
    const s = Number(this.props.status);
    if (s >= 200 && s < 300) return "ok";
    if (s >= 400 && s < 500) return "warn";
    if (s >= 500) return "error";
    return "default";
  }

  render() {
    return (
      <span className={`mt-status-badge mt-status-badge--${this.modClass()}`}>
        {this.props.status}
      </span>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// JSON BLOCK  (syntax-highlighted JSON display)
// ═══════════════════════════════════════════════════════════════
interface JBProps { data: any; maxHeight?: number; }

export class JsonBlock extends React.Component<JBProps> {
  render() {
    const { data, maxHeight = 200 } = this.props;
    return (
      <pre className="mt-json-block" style={{ maxHeight }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// RESULT ROW  (expandable test step result)
// ═══════════════════════════════════════════════════════════════
interface ResultRowProps {
  r: {
    ok: boolean;
    step: number;
    method: string;
    label: string;
    status: number | string;
    latency: number;
    result?: any;
    headers?: any;
    // Request snapshot
    reqUrl?: string;
    reqHeaders?: Record<string, string>;
    reqBody?: any;
  };
  i: number;
}

interface ResultRowState { open: boolean; }

export class ResultRow extends React.Component<ResultRowProps, ResultRowState> {
  state: ResultRowState = { open: false };

  render() {
    const { r } = this.props;
    const { open } = this.state;

    const MONO = "'JetBrains Mono','Fira Mono',monospace";
    const mc = ({
      POST: "#34d399", GET: "#60a5fa", PATCH: "#fb923c",
      PUT: "#f59e0b", DELETE: "#f87171", RPC: "#a78bfa",
    } as Record<string, string>)[r.method.toUpperCase()] || "#8b949e";

    const resCol = r.ok ? "#34d399" : "#f87171";
    const resBg = r.ok ? "#34d39908" : "#f8717108";
    const resBrd = r.ok ? "#34d39933" : "#f8717133";

    const hasReqBody = r.reqBody != null;

    return (
      <div className={`mt-result-row mt-result-row--${r.ok ? "ok" : "fail"}`}>

        {/* ── Row header (click to expand) ── */}
        <div
          className="mt-result-row__header"
          onClick={() => this.setState(s => ({ open: !s.open }))}
        >
          <span className="mt-result-row__icon">{r.ok ? "✅" : "❌"}</span>
          <span className="mt-result-row__step">{r.step}</span>
          <MethodBadge method={r.method.replace(/_BATCH|_LOAD|_EMPTY|_CONCURRENT/g, "")} />
          <span className="mt-result-row__label">{r.label}</span>
          <StatusBadge status={r.status} />
          <span className="mt-result-row__latency">{r.latency}ms</span>
          <span className="mt-result-row__chevron">{open ? "▲" : "▼"}</span>
        </div>

        {/* ── Expanded panel ── */}
        {open && (
          <div style={{ borderTop: `1px solid ${mc}33` }}>

            {/* ━━ REQUEST section header ━━ */}
            <div style={{
              padding: "8px 14px 6px",
              borderBottom: "1px solid var(--cs-border-sub)",
              background: mc + "08",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 800,
                color: mc, letterSpacing: 1, textTransform: "uppercase" as const,
              }}>▶ REQUEST</span>
              <span style={{
                background: mc + "18", border: `1px solid ${mc}40`, color: mc,
                borderRadius: 4, padding: "1px 6px", fontFamily: MONO,
                fontSize: 10, fontWeight: 700,
              }}>{r.method}</span>
            </div>

            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 10 }}>

              {/* ── Request URL ── */}
              {r.reqUrl && (
                <div>
                  <div style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                    letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5,
                  }}>🌐 Request URL</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: mc,
                      background: mc + "18", border: `1px solid ${mc}40`,
                      borderRadius: 5, padding: "6px 10px", flexShrink: 0,
                    }}>{r.method}</span>
                    <div style={{
                      flex: 1, padding: "7px 12px", fontFamily: MONO, fontSize: 11,
                      background: "var(--cs-bg)", borderRadius: 7, color: "var(--cs-text)",
                      border: "1px solid var(--cs-border)", lineHeight: 1.4,
                      wordBreak: "break-all" as const,
                    }}>{r.reqUrl}</div>
                  </div>
                </div>
              )}

              {/* ── Request Headers ── */}
              {r.reqHeaders && Object.keys(r.reqHeaders).length > 0 && (
                <div>
                  <div style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                    letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5,
                  }}>📋 Headers <span style={{ opacity: 0.5, fontWeight: 400 }}>JSON</span></div>
                  <pre style={{
                    fontFamily: MONO, fontSize: 10, margin: 0,
                    background: "var(--cs-bg)", border: "1px solid var(--cs-border)",
                    borderRadius: 7, padding: "10px 12px", overflowX: "auto" as const,
                    color: "var(--cs-muted)", lineHeight: 1.55,
                  }}>
                    {JSON.stringify(r.reqHeaders, null, 2)}
                  </pre>
                </div>
              )}

              {/* ── Request Body ── */}
              {hasReqBody && (
                <div>
                  <div style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                    letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5,
                  }}>📦 Request Body <span style={{ opacity: 0.5, fontWeight: 400 }}>JSON</span></div>
                  <pre style={{
                    fontFamily: MONO, fontSize: 10, margin: 0,
                    background: "var(--cs-bg)", border: "1px solid var(--cs-border)",
                    borderRadius: 7, padding: "10px 12px", overflowX: "auto" as const,
                    maxHeight: 200, color: "var(--cs-text)", lineHeight: 1.55,
                  }}>
                    {JSON.stringify(r.reqBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* ━━ RESPONSE section ━━ */}
            <div style={{ borderTop: `1px solid ${resBrd}` }}>

              {/* Response section header */}
              <div style={{
                padding: "8px 14px 6px",
                borderBottom: `1px solid ${resBrd}`,
                background: resBg,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 800,
                  color: resCol, letterSpacing: 1, textTransform: "uppercase" as const,
                }}>◀ RESPONSE</span>
                <StatusBadge status={r.status} />
                <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
                  {r.latency}ms
                </span>
              </div>

              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 10 }}>

                {/* Response Headers */}
                {r.headers && Object.keys(r.headers).length > 0 && (
                  <div>
                    <div style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                      letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5,
                    }}>📋 Headers</div>
                    <div style={{
                      fontFamily: MONO, fontSize: 10, borderRadius: 7, padding: "8px 12px",
                      background: "var(--cs-bg)", border: `1px solid ${resBrd}`,
                      color: "var(--cs-muted)", lineHeight: 1.7,
                    }}>
                      {Object.entries(r.headers).map(([k, v]) => (
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
                  <div style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                    letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 5,
                  }}>📦 Body</div>
                  <pre style={{
                    fontFamily: MONO, fontSize: 10, margin: 0,
                    background: resBg, border: `1px solid ${resBrd}`,
                    borderRadius: 7, padding: "10px 12px", overflowX: "auto" as const,
                    maxHeight: 300, color: resCol, lineHeight: 1.55,
                  }}>
                    {JSON.stringify(r.result, null, 2)}
                  </pre>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    );
  }
}
