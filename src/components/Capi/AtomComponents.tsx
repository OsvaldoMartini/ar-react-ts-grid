import React from "react";
import "./capi-atoms.scss";

// ═══════════════════════════════════════════════════════════════
// METHOD BADGE  (HTTP verb colored chip)
// ═══════════════════════════════════════════════════════════════
interface MBProps { method: string; }

export class MethodBadge extends React.Component<MBProps> {
  private modClass(): string {
    const m = this.props.method.toUpperCase();
    if (m === "GET")                    return "get";
    if (m === "POST")                   return "post";
    if (m === "PATCH" || m === "PUT")   return "patch";
    if (m === "DELETE")                 return "delete";
    if (m === "RPC")                    return "rpc";
    return "default";
  }

  render() {
    return (
      <span className={`capi-method-badge capi-method-badge--${this.modClass()}`}>
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
    if (s >= 500)             return "error";
    return "default";
  }

  render() {
    return (
      <span className={`capi-status-badge capi-status-badge--${this.modClass()}`}>
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
      <pre className="capi-json-block" style={{ maxHeight }}>
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
    return (
      <div className={`capi-result-row capi-result-row--${r.ok ? "ok" : "fail"}`}>
        <div
          className="capi-result-row__header"
          onClick={() => this.setState(s => ({ open: !s.open }))}
        >
          <span className="capi-result-row__icon">{r.ok ? "✅" : "❌"}</span>
          <span className="capi-result-row__step">{r.step}</span>
          <MethodBadge method={r.method.replace(/_BATCH|_LOAD|_EMPTY|_CONCURRENT/g, "")} />
          <span className="capi-result-row__label">{r.label}</span>
          <StatusBadge status={r.status} />
          <span className="capi-result-row__latency">{r.latency}ms</span>
          <span className="capi-result-row__chevron">{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div className="capi-result-row__body">
            {r.result && <JsonBlock data={r.result} />}
            {r.headers && (
              <div className="capi-result-row__section">
                <div className="capi-result-row__section-label">HEADERS</div>
                <JsonBlock data={r.headers} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
