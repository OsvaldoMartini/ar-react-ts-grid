import React from "react";
import { testStore, TestCase, rest } from "./utils";
import { StatusBadge } from "./AtomComponents";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const MONO = "'JetBrains Mono','Fira Code',monospace";

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
// EXPANDABLE TEST CASE ROW
// ═══════════════════════════════════════════════════════════════
interface TcRowState { open: boolean; }
class TcRow extends React.Component<{ tc: TestCase; idx: number }, TcRowState> {
  state: TcRowState = { open: false };
  render() {
    const { tc, idx } = this.props;
    const { open } = this.state;
    const sc = STATUS_COLORS[tc.status];
    return (
      <div style={{
        borderRadius: 8, border: `1px solid ${sc.border}`,
        borderLeft: `3px solid ${sc.dot}`, background: sc.bg,
        overflow: "hidden", transition: "border .15s"
      }}>

        {/* ── Header row ── */}
        <div
          onClick={() => this.setState(s => ({ open: !s.open }))}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 13px",
            cursor: "pointer", userSelect: "none" as const
          }}>

          <StatusDot status={tc.status} />

          {/* Seq badge */}
          <span style={{
            fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
            background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
            borderRadius: 4, padding: "1px 6px", flexShrink: 0
          }}>
            #{tc.seq}
          </span>

          {/* Run group */}
          <span style={{
            fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)",
            flexShrink: 0, opacity: 0.7
          }}>
            R{tc.runGroup}
          </span>

          <MChip method={tc.method} />
          <SourceBadge source={tc.dataSource} />

          {/* API + path */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              color: "var(--cs-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {tc.apiTitle}
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {tc.path}
            </div>
          </div>

          {/* Status & latency */}
          {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
          {tc.latency != null && (
            <span style={{
              fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
              flexShrink: 0
            }}>{tc.latency}ms</span>
          )}

          <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", flexShrink: 0 }}>
            {open ? "▲" : "▼"}
          </span>
        </div>

        {/* ── Expanded detail ── */}
        {open && (
          <div style={{ padding: "0 13px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {tc.body && Object.keys(tc.body).length > 0 && (
              <div>
                <div style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4
                }}>Request Body</div>
                <pre style={{
                  fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)",
                  background: "var(--cs-bg)", border: "1px solid var(--cs-border-sub)",
                  borderRadius: 6, padding: "8px 10px", overflowX: "auto",
                  maxHeight: 180, margin: 0
                }}>
                  {JSON.stringify(tc.body, null, 2)}
                </pre>
              </div>
            )}
            {tc.result != null && (
              <div>
                <div style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "var(--cs-dim)",
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4
                }}>Response</div>
                <pre style={{
                  fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)",
                  background: "var(--cs-bg)", border: "1px solid var(--cs-border-sub)",
                  borderRadius: 6, padding: "8px 10px", overflowX: "auto",
                  maxHeight: 180, margin: 0
                }}>
                  {JSON.stringify(tc.result, null, 2)}
                </pre>
              </div>
            )}
            <div style={{ display: "flex", gap: 16, fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
              <span>Created: {new Date(tc.createdAt).toLocaleTimeString()}</span>
              {tc.fileSource && <span>File: {tc.fileSource}</span>}
            </div>
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
}

export class ReadyForTestTab extends React.Component<{ onClearAll?: () => void }, RftState> {
  state: RftState = {
    tick: 0, pageSize: 10, pageIndex: 0, running: false,
    runProgress: 0, filter: "all", methodFilter: "ALL",
    expandReport: false, showModal: false,
  };

  private scrollRef = React.createRef<HTMLDivElement>();

  // Refresh from store
  private refresh = () => this.setState(s => ({ tick: s.tick + 1 }));

  // ── EXECUTE a page of cases ──
  private executeBlock = async () => {
    const { pageSize, pageIndex } = this.state;
    const visible = this.getFiltered();
    const start = pageIndex * pageSize;
    const block = visible.slice(start, start + pageSize).filter(c => c.status === "pending");

    if (block.length === 0) return;
    this.setState({ running: true, runProgress: 0 });

    const ctx: Record<string, number> = {};

    for (let i = 0; i < block.length; i++) {
      const tc = block[i];
      tc.status = "running";
      this.refresh();

      const t0 = Date.now();
      try {
        await new Promise(r => setTimeout(r, 20 + Math.random() * 60));

        const res = tc.resourceName;
        const pid = ctx[res] || null;

        // Resolve path: replace {id} template or inject known ID
        let path = tc.path;
        if (path.includes("{id}") && pid) {
          path = path.replace("{id}", String(pid));
        } else if (["GET", "PATCH", "PUT", "DELETE"].includes(tc.method) && pid) {
          path = `/${res}/${pid}`;
        }

        const r = await rest.req(tc.method, path, tc.body || undefined);
        if (tc.method === "POST" && (r.body as any)?.id) ctx[res] = (r.body as any).id;

        tc.status = r.status >= 200 && r.status < 300 ? "passed" : "failed";
        tc.httpStatus = r.status;
        tc.latency = Date.now() - t0;
        tc.result = r.body;
        tc.headers = r.headers;
      } catch (e: any) {
        tc.status = "failed";
        tc.httpStatus = "ERR";
        tc.latency = Date.now() - t0;
        tc.result = { error: e.message };
      }

      this.setState(s => ({ runProgress: s.runProgress + 1 }));
      this.refresh();
    }

    this.setState({ running: false });
  };

  // ── EXECUTE ALL pending ──
  private executeAll = async () => {
    const pending = testStore.cases.filter(c => c.status === "pending");
    if (pending.length === 0) return;
    this.setState({ running: true, runProgress: 0 });

    const ctx: Record<string, number> = {};

    for (let i = 0; i < pending.length; i++) {
      const tc = pending[i];
      tc.status = "running";
      this.refresh();

      const t0 = Date.now();
      try {
        await new Promise(r => setTimeout(r, 20 + Math.random() * 60));
        const res = tc.resourceName;
        const pid = ctx[res] || null;
        let path = tc.path;
        if (path.includes("{id}") && pid) path = path.replace("{id}", String(pid));
        else if (["GET", "PATCH", "PUT", "DELETE"].includes(tc.method) && pid) path = `/${res}/${pid}`;

        const r = await rest.req(tc.method, path, tc.body || undefined);
        if (tc.method === "POST" && (r.body as any)?.id) ctx[res] = (r.body as any).id;

        tc.status = r.status >= 200 && r.status < 300 ? "passed" : "failed";
        tc.httpStatus = r.status;
        tc.latency = Date.now() - t0;
        tc.result = r.body;
        tc.headers = r.headers;
      } catch (e: any) {
        tc.status = "failed";
        tc.httpStatus = "ERR";
        tc.latency = Date.now() - t0;
        tc.result = { error: e.message };
      }

      this.setState(s => ({ runProgress: s.runProgress + 1 }));
      this.refresh();
    }

    this.setState({ running: false });
  };

  private getFiltered(): TestCase[] {
    const { filter, methodFilter } = this.state;
    let cases = testStore.cases;
    if (filter !== "all") cases = cases.filter(c => c.status === filter);
    if (methodFilter !== "ALL") cases = cases.filter(c => c.method === methodFilter);
    return cases;
  }

  render() {
    const { tick, pageSize, pageIndex, running, runProgress, filter, methodFilter, expandReport, showModal } = this.state;
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

        {/* ── Synthetic data modal ── */}
        {showModal && synthCases.length > 0 && (
          <SyntheticDataModal
            cases={synthCases}
            onClose={() => this.setState({ showModal: false })}
          />
        )}

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

        {/* ── Run buttons ── */}
        {pending > 0 && (
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
                : `▶ Execute Page  —  ${pendingInBlock} pending case${pendingInBlock !== 1 ? "s" : ""}`
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
              {running ? "⏳ Running…" : `▶▶ Execute All  —  ${pending.toLocaleString()} pending`}
            </button>
          </div>
        )}

        {/* Running progress bar */}
        {running && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "#f59e0b10", border: "1px solid #f59e0b33"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "#f59e0b", marginBottom: 6
            }}>
              <span>⏳ Executing…</span>
              <span>{runProgress} completed</span>
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

          <div style={{ marginLeft: "auto" }}>
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
            pageSlice.map((tc, i) => <TcRow key={tc.id} tc={tc} idx={pageStart + i} />)
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
