import React, { createRef } from "react";
import { MethodBadge, StatusBadge, JsonBlock } from "./AtomComponents";

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
    if (type === "rest_request") return "#e5c07b";
    if (type === "rest_response") return "#98c379";
    if (type.startsWith("ai")) return "#61afef";
    if (type === "error") return "#e06c75";
    if (type === "complete") return "#3fb950";
    return "#c678dd";
  }

  render() {
    const { log, onClear } = this.props;
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          padding: "6px 18px", borderBottom: "1px solid #21262d",
          display: "flex", gap: 8, alignItems: "center", background: "#0d1117",
        }}>
          <span style={{ fontSize: 9, color: "#8b949e" }}>{log.length} entries</span>
          <button onClick={onClear} style={{
            background: "none", border: "1px solid #30363d", borderRadius: 4,
            color: "#8b949e", padding: "3px 8px", cursor: "pointer",
            fontSize: 9, fontFamily: "inherit",
          }}>
            CLEAR
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px" }}>
          {log.length === 0 && (
            <div style={{ color: "#30363d", textAlign: "center", padding: 36, fontSize: 11 }}>
              Nessun log. Usa la Chat.
            </div>
          )}
          {log.map((e, i) => {
            const clr = this.entryColor(e.type);
            return (
              <div key={i} style={{
                marginBottom: 7, borderLeft: `3px solid ${clr}`,
                paddingLeft: 9, paddingTop: 3, paddingBottom: 3,
              }}>
                <div style={{
                  display: "flex", gap: 7, alignItems: "center",
                  marginBottom: 2, flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: 8, color: "#555" }}>
                    {e.ts?.split("T")[1]?.split(".")[0]}
                  </span>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: 1, color: clr,
                  }}>
                    {e.type.toUpperCase().replace(/_/g, " ")}
                  </span>
                  {e.method && <MethodBadge method={e.method} />}
                  {e.path && (
                    <span style={{ fontSize: 9, color: "#8b949e", fontFamily: "monospace" }}>{e.path}</span>
                  )}
                  {e.status !== undefined && <StatusBadge status={e.status} />}
                </div>
                {e.content && (
                  <div style={{ fontSize: 10, color: "#c9d1d9", marginBottom: 3 }}>{e.content}</div>
                )}
                {e.description && (
                  <div style={{ fontSize: 9, color: "#8b949e", fontStyle: "italic", marginBottom: 3 }}>
                    {e.description}
                  </div>
                )}
                {e.params && Object.keys(e.params).length > 0 && (
                  <div style={{ marginBottom: 3 }}>
                    <div style={{ fontSize: 8, color: "#555", marginBottom: 2 }}>PARAMS</div>
                    <JsonBlock data={e.params} />
                  </div>
                )}
                {e.body !== undefined && e.body !== null && (
                  <div style={{ marginBottom: 3 }}>
                    <div style={{ fontSize: 8, color: "#555", marginBottom: 2 }}>
                      {e.type === "rest_response" ? "RESPONSE" : "BODY"}
                    </div>
                    <JsonBlock data={e.body} />
                  </div>
                )}
                {e.headers && (
                  <div style={{ marginBottom: 3 }}>
                    <div style={{ fontSize: 8, color: "#555", marginBottom: 2 }}>HEADERS</div>
                    <JsonBlock data={e.headers} />
                  </div>
                )}
                {e.actions && (
                  <div>
                    <div style={{ fontSize: 8, color: "#555", marginBottom: 3 }}>
                      PLANNED ({e.actions.length})
                    </div>
                    {e.actions.map((a, j) => (
                      <div key={j} style={{
                        display: "flex", gap: 6, alignItems: "center",
                        padding: "2px 0", fontSize: 10, color: "#8b949e",
                      }}>
                        <span style={{ color: "#444" }}>{j + 1}.</span>
                        <MethodBadge method={a.method} />
                        <span style={{ fontFamily: "monospace" }}>{a.path}</span>
                        {a.description && (
                          <span style={{ color: "#444", fontSize: 9 }}>— {a.description}</span>
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
