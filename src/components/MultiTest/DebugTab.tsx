import React, { createRef } from "react";
import { MethodBadge, StatusBadge, JsonBlock } from "./AtomComponents";
import "./mt-debug.scss";

// ═══════════════════════════════════════════════════════════════
// DEBUG TAB  — shows all REST + AI log entries
// ═══════════════════════════════════════════════════════════════
export interface LogEntry {
  ts?: string;
  type: string;
  content?: string;
  description?: string;
  method?: string;
  path?: string;
  status?: number | string;
  params?: Record<string, any>;
  body?: any;
  headers?: any;
  actions?: { method: string; path: string; description?: string }[];
}

interface DebugTabProps {
  log: LogEntry[];
  onClear: () => void;
}

export class DebugTab extends React.Component<DebugTabProps> {
  private endRef = createRef<HTMLDivElement>();

  componentDidUpdate() {
    this.endRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  private entryColor(type: string): string {
    if (type === "rest_request")  return "#e5c07b";
    if (type === "rest_response") return "#98c379";
    if (type.startsWith("ai"))   return "#61afef";
    if (type === "error")        return "#e06c75";
    if (type === "complete")     return "#3fb950";
    return "#c678dd";
  }

  render() {
    const { log, onClear } = this.props;
    return (
      <div className="mt-debug">
        {/* Toolbar */}
        <div className="mt-debug__toolbar">
          <span className="mt-debug__count">{log.length} entries</span>
          <button className="mt-debug__clear" onClick={onClear}>CLEAR</button>
        </div>

        {/* Body */}
        <div className="mt-debug__body">
          {log.length === 0 && (
            <div className="mt-debug__empty">Nessun log. Usa la Chat.</div>
          )}

          {log.map((e, i) => {
            const clr = this.entryColor(e.type);
            return (
              <div
                key={i}
                className="mt-debug__entry"
                style={{ borderLeftColor: clr }}
              >
                {/* Meta row */}
                <div className="mt-debug__entry-meta">
                  <span className="mt-debug__entry-ts">
                    {e.ts?.split("T")[1]?.split(".")[0]}
                  </span>
                  <span
                    className="mt-debug__entry-type"
                    style={{ color: clr }}
                  >
                    {e.type.toUpperCase().replace(/_/g, " ")}
                  </span>
                  {e.method && <MethodBadge method={e.method} />}
                  {e.path   && <span className="mt-debug__entry-path">{e.path}</span>}
                  {e.status !== undefined && <StatusBadge status={e.status} />}
                </div>

                {/* Content */}
                {e.content && (
                  <div className="mt-debug__entry-content">{e.content}</div>
                )}
                {e.description && (
                  <div className="mt-debug__entry-desc">{e.description}</div>
                )}

                {/* Params */}
                {e.params && Object.keys(e.params).length > 0 && (
                  <div className="mt-debug__section">
                    <div className="mt-debug__section-label">PARAMS</div>
                    <JsonBlock data={e.params} />
                  </div>
                )}

                {/* Body */}
                {e.body !== undefined && e.body !== null && (
                  <div className="mt-debug__section">
                    <div className="mt-debug__section-label">
                      {e.type === "rest_response" ? "RESPONSE" : "BODY"}
                    </div>
                    <JsonBlock data={e.body} />
                  </div>
                )}

                {/* Headers */}
                {e.headers && (
                  <div className="mt-debug__section">
                    <div className="mt-debug__section-label">HEADERS</div>
                    <JsonBlock data={e.headers} />
                  </div>
                )}

                {/* Planned actions */}
                {e.actions && (
                  <div>
                    <div className="mt-debug__planned-label">
                      PLANNED ({e.actions.length})
                    </div>
                    {e.actions.map((a, j) => (
                      <div key={j} className="mt-debug__action-row">
                        <span className="mt-debug__action-num">{j + 1}.</span>
                        <MethodBadge method={a.method} />
                        <span className="mt-debug__action-path">{a.path}</span>
                        {a.description && (
                          <span className="mt-debug__action-desc">— {a.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={this.endRef} />
        </div>
      </div>
    );
  }
}
