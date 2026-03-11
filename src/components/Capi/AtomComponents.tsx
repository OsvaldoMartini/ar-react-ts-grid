import React from "react";

// ═══════════════════════════════════════════════════════════════
// METHOD BADGE  (HTTP verb colored chip)
// ═══════════════════════════════════════════════════════════════
interface MBProps { method: string; }

export class MethodBadge extends React.Component<MBProps> {
  private color(): string {
    const { method } = this.props;
    if (method === "GET") return "#3fb950";
    if (method === "POST") return "#58a6ff";
    if (method === "PATCH" || method === "PUT") return "#d29922";
    if (method === "DELETE") return "#f85149";
    return "#8b949e";
  }

  render() {
    const { method } = this.props;
    const clr = this.color();
    return (
      <span style={{
        fontSize: 8, fontWeight: 700, letterSpacing: 1,
        background: `${clr}22`, border: `1px solid ${clr}66`,
        color: clr, borderRadius: 3, padding: "1px 5px", flexShrink: 0,
      }}>
        {method}
      </span>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE  (HTTP status code colored chip)
// ═══════════════════════════════════════════════════════════════
interface SBProps { status: number | string | undefined; }

export class StatusBadge extends React.Component<SBProps> {
  private color(): string {
    const { status } = this.props;
    const s = Number(status);
    if (s >= 200 && s < 300) return "#3fb950";
    if (s >= 400 && s < 500) return "#d29922";
    if (s >= 500) return "#f85149";
    return "#8b949e";
  }

  render() {
    const { status } = this.props;
    const clr = this.color();
    return (
      <span style={{
        fontSize: 9, fontWeight: 700,
        color: clr, background: `${clr}22`,
        border: `1px solid ${clr}44`,
        borderRadius: 3, padding: "1px 5px", flexShrink: 0,
      }}>
        {status}
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
      <pre style={{
        margin: 0, fontSize: 9, lineHeight: 1.6,
        color: "#98c379", background: "#070b12",
        border: "1px solid #21262d", borderRadius: 4,
        padding: "6px 8px", overflowX: "auto",
        maxHeight, overflowY: "auto",
        fontFamily: "'IBM Plex Mono','Courier New',monospace",
      }}>
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
  };
  i: number;
}

interface ResultRowState { open: boolean; }

export class ResultRow extends React.Component<ResultRowProps, ResultRowState> {
  state: ResultRowState = { open: false };

  render() {
    const { r } = this.props;
    const { open } = this.state;
    const clr = r.ok ? "#3fb950" : "#f85149";
    return (
      <div style={{
        background: "#0d1117", border: `1px solid ${clr}33`,
        borderRadius: 6, overflow: "hidden", borderLeft: `3px solid ${clr}`,
      }}>
        <div
          style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", cursor: "pointer" }}
          onClick={() => this.setState(s => ({ open: !s.open }))}
        >
          <span style={{ fontSize: 12 }}>{r.ok ? "✅" : "❌"}</span>
          <span style={{ fontSize: 9, color: "#555", width: 18 }}>{r.step}</span>
          <MethodBadge method={r.method.replace(/_BATCH|_LOAD|_EMPTY|_CONCURRENT/g, "")} />
          <span style={{ fontSize: 10, color: "#e6edf3", flex: 1 }}>{r.label}</span>
          <StatusBadge status={r.status} />
          <span style={{ fontSize: 9, color: "#555" }}>{r.latency}ms</span>
          <span style={{ fontSize: 9, color: "#30363d" }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div style={{ padding: "8px 10px", borderTop: "1px solid #21262d22" }}>
            {r.result && <JsonBlock data={r.result} />}
            {r.headers && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 8, color: "#555", marginBottom: 3 }}>HEADERS</div>
                <JsonBlock data={r.headers} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
