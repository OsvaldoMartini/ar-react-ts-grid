/**
 * MockServerModal
 * ───────────────
 * Draggable, non-blocking floating panel.
 * Controls the in-browser MockServerStore AND generates a
 * zero-dependency Node.js server script for real local use.
 *
 * NO extra npm packages required — the browser mock uses the
 * existing in-memory engine; the Node script uses only `http` (built-in).
 */

import React from "react";
import {
  mockServerStore, MockRoute,
  testStore, db as apiStore, envStore,
  MockServerStatus,
} from "./utils";

const MONO = "'JetBrains Mono','Fira Code','Cascadia Code',monospace";

// ── tiny helpers ──────────────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
  GET: "#34d399", POST: "#60a5fa", PUT: "#f59e0b",
  PATCH: "#a78bfa", DELETE: "#f87171", OPTIONS: "#8b949e",
};
const mc = (m: string) => METHOD_COLORS[m] || "#8b949e";

// ── types ─────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onEnvChanged: () => void;           // bubble up so EnvBar refreshes
}

interface State {
  port: number;
  portInput: string;
  portError: string;
  tab: "control" | "routes" | "logs" | "export";
  tick: number;
  // drag
  x: number; y: number;
  dragging: boolean; ox: number; oy: number;
  // export
  copied: boolean;
}

// ── component ─────────────────────────────────────────────────────────────────
export class MockServerModal extends React.Component<Props, State> {
  private logRef = React.createRef<HTMLDivElement>();
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  constructor(props: Props) {
    super(props);
    const initX = Math.max(40, window.innerWidth - 620);
    const initY = Math.max(40, window.innerHeight - 640);
    this.state = {
      port: mockServerStore.port, portInput: String(mockServerStore.port),
      portError: "", tab: "control", tick: 0,
      x: initX, y: initY, dragging: false, ox: 0, oy: 0,
      copied: false,
    };
  }

  componentDidMount() {
    // live-tick for logs + status
    this.tickTimer = setInterval(() => this.setState(s => ({ tick: s.tick + 1 })), 800);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  componentWillUnmount() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  componentDidUpdate(_: Props, prev: State) {
    // auto-scroll logs
    if (this.state.tab === "logs" && this.logRef.current) {
      const el = this.logRef.current;
      if (prev.tick !== this.state.tick) el.scrollTop = el.scrollHeight;
    }
  }

  // ── drag ──────────────────────────────────────────────────────────────────
  private onHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    this.setState({ dragging: true, ox: e.clientX - this.state.x, oy: e.clientY - this.state.y });
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.state.dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - 580, e.clientX - this.state.ox));
    const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - this.state.oy));
    this.setState({ x, y });
  };

  private onMouseUp = () => this.setState({ dragging: false });

  // ── server control ────────────────────────────────────────────────────────
  private applyPort = (): boolean => {
    const n = parseInt(this.state.portInput, 10);
    if (isNaN(n) || n < 1024 || n > 65535) {
      this.setState({ portError: "Port must be 1024–65535" });
      return false;
    }
    mockServerStore.port = n;
    this.setState({ port: n, portError: "" });
    return true;
  };

  private startServer = () => {
    if (!this.applyPort()) return;
    // seed from specs first, fallback to test cases
    const specs = apiStore.specs.filter(s => s.resourceName);
    if (specs.length > 0) {
      mockServerStore.buildFromSpecs(specs);
    } else {
      mockServerStore.buildFromTestCases();
    }
    mockServerStore.start();
    this.props.onEnvChanged();
    this.setState({ tab: "routes", tick: this.state.tick + 1 });
  };

  private stopServer = () => {
    mockServerStore.stop();
    this.props.onEnvChanged();
    this.setState({ tick: this.state.tick + 1 });
  };

  private downloadScript = async () => {
    const text = mockServerStore.generateNodeScript();
    const fileName = "mock-server.js";

    if ("showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(text);
        await writable.close();
      } catch (err: any) {
        if (err?.name !== "AbortError") console.error("Mock server save error:", err);
      }
    } else {
      // Fallback for Firefox / Safari
      const blob = new Blob([text], { type: "text/javascript" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  private copyScript = () => {
    navigator.clipboard.writeText(mockServerStore.generateNodeScript()).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1800);
    });
  };

  // ── render ────────────────────────────────────────────────────────────────
  render() {
    const { x, y, dragging, tab, portInput, portError, tick, copied } = this.state;
    const status = mockServerStore.status;
    const routes = mockServerStore.routes;
    const logs = mockServerStore.logs;
    const byRes = mockServerStore._routesByResource();
    const running = status === "running";

    const STATUS_COLOR = {
      stopped: "#8b949e", starting: "#f59e0b", running: "#34d399", error: "#f87171",
    }[status];
    const STATUS_LABEL = {
      stopped: "Stopped", starting: "Starting…", running: "Running", error: "Error",
    }[status];

    const totalRecords = Array.from(byRes.values())
      .reduce((s, rs) => s + (rs[0]?.seedData.length || 0), 0);

    return (
      <div style={{
        position: "fixed",
        left: x, top: y,
        zIndex: 9500,
        width: 560,
        background: "var(--cs-surface)",
        border: `1.5px solid ${running ? "#a78bfa55" : "var(--cs-border)"}`,
        borderRadius: 14,
        boxShadow: running
          ? "0 0 0 1px #a78bfa22, 0 12px 48px #00000088"
          : "0 12px 48px #00000088",
        fontFamily: MONO,
        userSelect: dragging ? "none" : "auto",
        overflow: "hidden",
        transition: "border-color .3s, box-shadow .3s",
      }}>

        {/* ── Header / drag handle ─────────────────────────────────── */}
        <div
          onMouseDown={this.onHeaderMouseDown}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--cs-surface-2)",
            borderBottom: "1px solid var(--cs-border-sub)",
            cursor: dragging ? "grabbing" : "grab",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Status dot */}
            <span style={{
              width: 9, height: 9, borderRadius: "50%",
              background: STATUS_COLOR, display: "inline-block",
              boxShadow: running ? `0 0 6px ${STATUS_COLOR}` : "none",
              flexShrink: 0,
              animation: status === "starting" ? "pulse 1s infinite" : "none",
            }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--cs-text)", letterSpacing: 0.3 }}>
              Mock Server
            </span>
            <span style={{ fontSize: 10, color: STATUS_COLOR, fontWeight: 700 }}>
              {STATUS_LABEL}
            </span>
            {running && (
              <span style={{
                fontSize: 10, color: "#a78bfa",
                background: "#a78bfa15", border: "1px solid #a78bfa44",
                borderRadius: 4, padding: "1px 8px"
              }}>
                :{mockServerStore.port}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, color: "var(--cs-dim)", marginRight: 4, cursor: "default" }}>
              ⠿ drag
            </span>
            <button onClick={this.props.onClose} style={closeBtn}>✕</button>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--cs-border-sub)" }}>
          {(["control", "routes", "logs", "export"] as const).map(t => {
            const labels: Record<string, string> = {
              control: "⚙ Config",
              routes: `⚡ Routes${routes.length > 0 ? ` (${routes.length})` : ""}`,
              logs: `📋 Logs${logs.length > 0 ? ` (${logs.length})` : ""}`,
              export: "💾 Export",
            };
            const active = tab === t;
            return (
              <button key={t} onClick={() => this.setState({ tab: t })} style={{
                flex: 1, padding: "8px 4px", background: "transparent",
                border: "none", borderBottom: active ? "2px solid #a78bfa" : "2px solid transparent",
                color: active ? "#a78bfa" : "var(--cs-dim)",
                fontFamily: MONO, fontSize: 10, fontWeight: active ? 800 : 400,
                cursor: "pointer", transition: "all .12s",
              }}>
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Config ──────────────────────────────────────────── */}
        {tab === "control" && (
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Port row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 10, color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.5 }}>
                PORT
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number" min={1024} max={65535}
                  value={portInput}
                  disabled={running}
                  onChange={e => this.setState({ portInput: e.target.value, portError: "" })}
                  style={{
                    width: 100, padding: "7px 10px", borderRadius: 6,
                    background: running ? "var(--cs-surface-2)" : "var(--cs-bg)",
                    border: `1px solid ${portError ? "#f87171" : "var(--cs-border)"}`,
                    color: running ? "var(--cs-dim)" : "var(--cs-text)",
                    fontFamily: MONO, fontSize: 13, fontWeight: 700,
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 10, color: "var(--cs-dim)" }}>
                  http://localhost:<strong style={{ color: "var(--cs-muted)" }}>{portInput}</strong>
                </span>
              </div>
              {portError && (
                <span style={{ fontSize: 10, color: "#f87171" }}>{portError}</span>
              )}
            </div>

            {/* Source info */}
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
            }}>
              <div style={{ fontSize: 10, color: "var(--cs-dim)", marginBottom: 6, fontWeight: 700 }}>
                DATA SOURCE
              </div>
              {(() => {
                const specs = apiStore.specs.filter(s => s.resourceName);
                const cases = testStore.cases;
                if (specs.length > 0) {
                  return (
                    <div style={{ fontSize: 11, color: "var(--cs-text)" }}>
                      <span style={{ color: "#34d399" }}>✓</span>{" "}
                      {specs.length} API spec{specs.length !== 1 ? "s" : ""} loaded
                      <span style={{ color: "var(--cs-dim)", marginLeft: 8 }}>
                        · seed data auto-generated from schemas
                      </span>
                    </div>
                  );
                } else if (cases.length > 0) {
                  return (
                    <div style={{ fontSize: 11, color: "var(--cs-text)" }}>
                      <span style={{ color: "#f59e0b" }}>⚡</span>{" "}
                      {cases.length} test case{cases.length !== 1 ? "s" : ""} available
                      <span style={{ color: "var(--cs-dim)", marginLeft: 8 }}>
                        · routes derived from test definitions
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div style={{ fontSize: 11, color: "#f87171" }}>
                      ⚠ No specs or test cases loaded yet
                    </div>
                  );
                }
              })()}
              <div style={{ fontSize: 10, color: "var(--cs-dim)", marginTop: 6 }}>
                Each resource gets <strong style={{ color: "#a78bfa" }}>50 seed records</strong> with banking-domain synthetic data
              </div>
            </div>

            {/* Running: status card */}
            {running && (
              <div style={{
                padding: "12px 16px", borderRadius: 8,
                background: "#a78bfa10", border: "1px solid #a78bfa44",
              }}>
                <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 800, marginBottom: 4 }}>
                  ✓ Mock server active
                </div>
                <div style={{ fontSize: 10, color: "var(--cs-dim)", lineHeight: 1.7 }}>
                  <div>🌐 <code style={{ color: "#a78bfa" }}>http://localhost:{mockServerStore.port}</code></div>
                  <div>⚡ {routes.length} routes · {totalRecords} seed records</div>
                  <div>🔗 Environment <strong style={{ color: "#a78bfa" }}>Mock :{mockServerStore.port}</strong> added to dropdown</div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              {!running ? (
                <button onClick={this.startServer} style={{
                  flex: 1, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                  background: "linear-gradient(135deg, #2d1b69, #a78bfa)",
                  border: "1.5px solid #a78bfa",
                  color: "#fff", fontFamily: MONO, fontSize: 12, fontWeight: 800,
                }}>
                  ▶ Start Mock Server
                </button>
              ) : (
                <button onClick={this.stopServer} style={{
                  flex: 1, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                  background: "transparent",
                  border: "1.5px solid #f8717166",
                  color: "#f87171", fontFamily: MONO, fontSize: 12, fontWeight: 800,
                }}>
                  ■ Stop Server
                </button>
              )}
              <button onClick={this.downloadScript} style={{
                padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                color: "var(--cs-muted)", fontFamily: MONO, fontSize: 11, fontWeight: 700,
              }}
                title="Download zero-dependency Node.js server script">
                💾 .js
              </button>
            </div>

            {/* Node.js instructions */}
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
              fontSize: 10,
            }}>
              <div style={{ color: "var(--cs-dim)", marginBottom: 6, fontWeight: 700 }}>
                🖥 RUN AS REAL LOCAL SERVER (no npm install needed)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, color: "var(--cs-muted)" }}>
                <div><span style={{ color: "#8b949e" }}>$</span> <code>node mock-server.js</code></div>
                <div style={{ color: "var(--cs-dim)", marginTop: 4 }}>
                  Pure Node.js built-ins only — <strong>zero dependencies</strong>.
                  CORS headers included for cross-origin requests.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── Tab: Routes ──────────────────────────────────────────── */}
        {tab === "routes" && (
          <div style={{
            height: 380, overflowY: "auto", padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: 8
          }}>
            {routes.length === 0 ? (
              <div style={{ color: "var(--cs-dim)", fontSize: 11, textAlign: "center", marginTop: 60 }}>
                Start the server to generate routes
              </div>
            ) : (
              Array.from(byRes.entries()).map(([res, resRoutes]) => (
                <div key={res} style={{
                  borderRadius: 8, border: "1px solid var(--cs-border-sub)",
                  overflow: "hidden",
                }}>
                  {/* Resource header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "7px 12px",
                    background: "var(--cs-surface-2)",
                    borderBottom: "1px solid var(--cs-border-sub)",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--cs-text)" }}>
                      /{res}
                    </span>
                    <span style={{ fontSize: 10, color: "#a78bfa" }}>
                      {resRoutes[0].seedData.length} records · {resRoutes[0].apiTitle}
                    </span>
                  </div>
                  {/* Endpoint rows */}
                  {resRoutes.map((r, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "6px 12px",
                      background: i % 2 === 0 ? "transparent" : "var(--cs-surface-2)",
                      borderBottom: i < resRoutes.length - 1 ? "1px solid var(--cs-border-sub)" : "none",
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, width: 50, flexShrink: 0,
                        color: mc(r.method), textAlign: "center",
                        background: mc(r.method) + "18",
                        borderRadius: 3, padding: "2px 0",
                      }}>
                        {r.method}
                      </span>
                      <code style={{ fontSize: 10, color: "var(--cs-muted)", flex: 1 }}>
                        http://localhost:{mockServerStore.port}{r.path}
                      </code>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab: Logs ────────────────────────────────────────────── */}
        {tab === "logs" && (
          <div ref={this.logRef} style={{
            height: 380, overflowY: "auto", padding: "10px 14px",
            background: "#0d1117", fontFamily: MONO, fontSize: 10, lineHeight: 1.8,
            display: "flex", flexDirection: "column", gap: 0,
          }}>
            {logs.length === 0 ? (
              <span style={{ color: "#8b949e", marginTop: 20, textAlign: "center" }}>
                No logs yet
              </span>
            ) : (
              logs.map((l, i) => {
                const col = l.includes("200") || l.includes("201") || l.includes("204") || l.includes("✓")
                  ? "#34d399"
                  : l.includes("404") || l.includes("405") ? "#f87171"
                    : l.includes("started") || l.includes("Starting") ? "#a78bfa"
                      : "#8b949e";
                return (
                  <div key={i} style={{ color: col, whiteSpace: "pre-wrap" }}>{l}</div>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: Export ──────────────────────────────────────────── */}
        {tab === "export" && (
          <div style={{ height: 380, display: "flex", flexDirection: "column" }}>
            {/* Toolbar */}
            <div style={{
              display: "flex", gap: 8, padding: "10px 14px",
              borderBottom: "1px solid var(--cs-border-sub)",
              background: "var(--cs-surface-2)",
            }}>
              <button onClick={this.downloadScript} style={{
                padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                background: "linear-gradient(135deg, #2d1b69, #a78bfa)",
                border: "none", color: "#fff", fontFamily: MONO, fontSize: 11, fontWeight: 700,
              }}>
                ⬇ Download mock-server.js
              </button>
              <button onClick={this.copyScript} style={{
                padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                background: "var(--cs-surface)", border: "1px solid var(--cs-border)",
                color: copied ? "#34d399" : "var(--cs-muted)",
                fontFamily: MONO, fontSize: 11, fontWeight: 700,
              }}>
                {copied ? "✓ Copied!" : "⎘ Copy"}
              </button>
              <span style={{
                marginLeft: "auto", fontSize: 10, color: "var(--cs-dim)",
                display: "flex", alignItems: "center"
              }}>
                Node.js · no deps
              </span>
            </div>
            {/* Script preview */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <pre style={{
                margin: 0, padding: "12px 16px",
                background: "#0d1117", color: "#8b949e",
                fontFamily: MONO, fontSize: 9.5, lineHeight: 1.7,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {mockServerStore.generateNodeScript()}
              </pre>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 16px",
          background: "var(--cs-surface-2)",
          borderTop: "1px solid var(--cs-border-sub)",
          fontSize: 9,
        }}>
          <span style={{ color: "var(--cs-dim)" }}>
            Capi Mock Engine · in-browser + Node.js export
          </span>
          <span style={{ color: running ? "#34d399" : "var(--cs-dim)" }}>
            {running ? `● ${routes.length} routes active` : "○ inactive"}
          </span>
        </div>
      </div>
    );
  }
}

// ── style constants ────────────────────────────────────────────────────────────
const closeBtn: React.CSSProperties = {
  background: "transparent", border: "none",
  color: "var(--cs-dim)", cursor: "pointer",
  fontSize: 13, padding: "2px 6px", borderRadius: 4,
  fontFamily: MONO,
};
