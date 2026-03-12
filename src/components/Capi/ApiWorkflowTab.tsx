import React from "react";
import { useTheme } from "./ThemeContext";
import {
  ApiSpec, buildDynamicWorkflow,
  WfNode, WfEdge, WfFieldRow, WfStage, WfTransfer, DynamicWorkflow,
} from "./utils";

const MONO = "'JetBrains Mono','Fira Code',monospace";

function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
function EmptyWorkflow() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 340, gap: 16,
      color: "var(--cs-dim)", fontFamily: MONO,
    }}>
      <div style={{ fontSize: 52, opacity: 0.3 }}>⬡</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cs-muted)" }}>No API files loaded</div>
      <div style={{ fontSize: 12, opacity: 0.6, textAlign: "center", maxWidth: 380 }}>
        Load schema files (YAML, JSON, OpenAPI) via the <b>API Files</b> tab.<br />
        The workflow graph, field table and stage diagram will be built automatically.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SEARCHABLE API DROPDOWN  (replaces pills in SchemaFieldTable)
// ─────────────────────────────────────────────────────────────
interface ApiDropdownProps {
  apis: string[];
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
  apiColor: (name: string) => string;
}

function ApiDropdown({ apis, value, onChange, isDark, apiColor }: ApiDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  // close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = search
    ? apis.filter(a => a.toLowerCase().includes(search.toLowerCase()))
    : apis;

  const col = value !== "ALL" ? apiColor(value) : "var(--cs-accent)";

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--cs-surface-2)",
          border: `1.5px solid ${col}66`,
          borderRadius: 8, color: "var(--cs-text)",
          fontFamily: MONO, fontSize: 13, fontWeight: 600,
          padding: "9px 14px", cursor: "pointer", minWidth: 220,
          transition: "border-color .15s",
        }}
      >
        {value !== "ALL" && (
          <span style={{
            width: 10, height: 10, borderRadius: "50%",
            background: col, flexShrink: 0,
          }} />
        )}
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value === "ALL" ? "⊞  All APIs" : value}
        </span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          width: 360, maxWidth: "90vw",
          background: "var(--cs-surface)", border: "1px solid var(--cs-border)",
          borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,.35)",
          overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: 10, borderBottom: "1px solid var(--cs-border-sub)" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search API name…"
              style={{
                width: "100%", background: "var(--cs-input-bg)",
                border: "1px solid var(--cs-border)", borderRadius: 6,
                color: "var(--cs-text)", fontFamily: MONO, fontSize: 12,
                padding: "7px 10px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {/* ALL */}
            <div
              onClick={() => { onChange("ALL"); setOpen(false); setSearch(""); }}
              style={{
                padding: "9px 14px", cursor: "pointer", fontFamily: MONO, fontSize: 12,
                background: value === "ALL" ? "var(--cs-surface-2)" : "transparent",
                color: "var(--cs-text)", fontWeight: value === "ALL" ? 700 : 400,
                borderBottom: "1px solid var(--cs-border-sub)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--cs-accent)", flexShrink: 0 }} />
              All APIs ({apis.length})
            </div>

            {filtered.map(api => {
              const c = apiColor(api);
              const active = value === api;
              return (
                <div
                  key={api}
                  onClick={() => { onChange(api); setOpen(false); setSearch(""); }}
                  style={{
                    padding: "8px 14px", cursor: "pointer", fontFamily: MONO, fontSize: 12,
                    background: active ? c + "18" : "transparent",
                    color: active ? c : "var(--cs-text)",
                    fontWeight: active ? 700 : 400,
                    display: "flex", alignItems: "center", gap: 8,
                    borderLeft: active ? `3px solid ${c}` : "3px solid transparent",
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "var(--cs-surface-2)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{api}</span>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding: "16px", color: "var(--cs-dim)", textAlign: "center", fontFamily: MONO, fontSize: 12 }}>
                No APIs match "{search}"
              </div>
            )}
          </div>

          {/* Footer count */}
          <div style={{
            padding: "6px 14px", borderTop: "1px solid var(--cs-border-sub)",
            color: "var(--cs-dim)", fontSize: 11, fontFamily: MONO,
          }}>
            {filtered.length} of {apis.length} APIs
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 1 — DEPENDENCY GRAPH  (with search + pagination)
// ─────────────────────────────────────────────────────────────
const GRAPH_PAGE_SIZE = 8;

interface GraphProps { isDark: boolean; wf: DynamicWorkflow; }
interface GraphState { hovered: string | null; search: string; page: number; }

class DependencyGraph extends React.Component<GraphProps, GraphState> {
  state: GraphState = { hovered: null, search: "", page: 0 };

  private nc(id: string, nodes: WfNode[]) {
    const n = nodes.find(x => x.id === id);
    return n ? { x: n.x + 77, y: n.y + 28 } : null;
  }

  render() {
    const { hovered, search, page } = this.state;
    const { isDark, wf } = this.props;
    const { nodes: allNodes, edges: allEdges } = wf;

    // Filter by search
    const matchFn = (n: WfNode) =>
      !search ||
      n.resource.toLowerCase().includes(search.toLowerCase()) ||
      n.schema.toLowerCase().includes(search.toLowerCase()) ||
      n.label.toLowerCase().includes(search.toLowerCase());

    const filteredNodes = allNodes.filter(matchFn);

    // Unique resources on this page
    const allResources = [...new Set(filteredNodes.map(n => n.resource))];
    const totalPages = Math.ceil(allResources.length / GRAPH_PAGE_SIZE);
    const safePageArr = Math.min(page, Math.max(0, totalPages - 1));
    const visibleResources = allResources.slice(safePageArr * GRAPH_PAGE_SIZE, (safePageArr + 1) * GRAPH_PAGE_SIZE);
    const nodes = filteredNodes.filter(n => visibleResources.includes(n.resource));

    // Re-layout nodes into columns for the current page
    const laid: WfNode[] = nodes.map(n => {
      const col = visibleResources.indexOf(n.resource);
      const isPatch = ["PATCH", "PUT"].includes(n.method);
      return { ...n, x: col * 210 + 40, y: isPatch ? 200 : 80 };
    });

    // Edges for visible nodes
    const visibleIds = new Set(laid.map(n => n.id));
    const edges = allEdges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));

    const maxX = Math.max(...laid.map(n => n.x + 160), 600);
    const W = maxX + 40;
    const H = 320;

    const bg = "var(--cs-bg)";
    const surface = "var(--cs-surface-2)";
    const gridCol = isDark ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.04)";
    const accent = isDark ? "#00d4ff" : "#0a66c2";
    const dimEdge = isDark ? "rgba(55,143,233,.14)" : "rgba(10,102,194,.10)";
    const nodeBg = "var(--cs-surface)";

    return (
      <div>
        {/* ── Controls bar ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={e => this.setState({ search: e.target.value, page: 0 })}
            placeholder="🔍  filter resource / schema…"
            style={{
              flex: 1, minWidth: 200, background: "var(--cs-input-bg)",
              border: "1px solid var(--cs-border)", borderRadius: 8,
              color: "var(--cs-text)", fontFamily: MONO, fontSize: 13,
              padding: "9px 14px", outline: "none",
            }}
          />
          <span style={{ color: "var(--cs-dim)", fontSize: 12, fontFamily: MONO, whiteSpace: "nowrap" }}>
            {visibleResources.length} of {allResources.length} resources
            {totalPages > 1 && ` · page ${safePageArr + 1}/${totalPages}`}
          </span>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4 }}>
              <button
                disabled={safePageArr === 0}
                onClick={() => this.setState({ page: safePageArr - 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePageArr === 0 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "6px 12px", cursor: safePageArr === 0 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12,
                }}
              >◀ Prev</button>
              <button
                disabled={safePageArr >= totalPages - 1}
                onClick={() => this.setState({ page: safePageArr + 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePageArr >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "6px 12px", cursor: safePageArr >= totalPages - 1 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12,
                }}
              >Next ▶</button>
            </div>
          )}
        </div>

        {/* ── Page dots ── */}
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => this.setState({ page: i })}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: i === safePageArr ? accent : "var(--cs-surface-2)",
                  border: `1px solid ${i === safePageArr ? accent : "var(--cs-border)"}`,
                  color: i === safePageArr ? "#000" : "var(--cs-muted)",
                  fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", padding: 0,
                }}
              >{i + 1}</button>
            ))}
          </div>
        )}

        {/* ── SVG graph ── */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--cs-border)", boxShadow: "var(--cs-shadow-md)" }}>
          <svg width={W} height={H} style={{ background: bg, borderRadius: 10, display: "block" }}>
            {/* Grid */}
            {Array.from({ length: Math.ceil(W / 50) + 1 }, (_, i) => (
              <line key={`gv${i}`} x1={i * 50} y1={0} x2={i * 50} y2={H} stroke={gridCol} strokeWidth={1} />
            ))}
            {Array.from({ length: Math.ceil(H / 50) + 1 }, (_, i) => (
              <line key={`gh${i}`} x1={0} y1={i * 50} x2={W} y2={i * 50} stroke={gridCol} strokeWidth={1} />
            ))}

            <defs>
              <marker id="wf-arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L10,3 z" fill={accent} />
              </marker>
              <marker id="wf-arr-dim" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L10,3 z" fill={dimEdge} />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((e, i) => {
              const f = this.nc(e.from, laid);
              const t = this.nc(e.to, laid);
              if (!f || !t) return null;
              const isH = hovered === e.from || hovered === e.to;
              const midX = (f.x + t.x) / 2;
              const midY = (f.y + t.y) / 2 - 22;
              return (
                <g key={i}>
                  <path d={curvePath(f.x, f.y, t.x - 5, t.y)}
                    fill="none" stroke={isH ? accent : dimEdge}
                    strokeWidth={isH ? 2.5 : 1.2}
                    strokeDasharray={e.type === "array" ? "7,3" : undefined}
                    markerEnd={isH ? "url(#wf-arr)" : "url(#wf-arr-dim)"}
                  />
                  {isH && (
                    <>
                      <rect x={midX - 70} y={midY - 15} width={140} height={19} rx={5}
                        fill={surface} stroke="var(--cs-border)" />
                      <text x={midX} y={midY - 2} fill={accent} fontSize={11}
                        textAnchor="middle" fontFamily={MONO} fontWeight={600}>{e.field}</text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {laid.map(n => {
              const isH = hovered === n.id;
              return (
                <g key={n.id}
                  onMouseEnter={() => this.setState({ hovered: n.id })}
                  onMouseLeave={() => this.setState({ hovered: null })}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={n.x} y={n.y} width={155} height={58} rx={8}
                    fill={isH ? n.color + "18" : nodeBg}
                    stroke={isH ? n.color : n.color + "55"}
                    strokeWidth={isH ? 2.5 : 1.5}
                  />
                  <rect x={n.x} y={n.y} width={5} height={58} rx={3}
                    fill={n.color} opacity={isH ? 1 : 0.75} />
                  <text x={n.x + 14} y={n.y + 20} fill={n.color} fontSize={13}
                    fontWeight={700} fontFamily={MONO}>{n.label}</text>
                  <text x={n.x + 14} y={n.y + 36} fill="var(--cs-muted)" fontSize={11}
                    fontFamily={MONO}>{n.method}</text>
                  <text x={n.x + 14} y={n.y + 52} fill="var(--cs-dim)" fontSize={10}
                    fontFamily={MONO}>{n.schema.slice(0, 18)}</text>
                  {n.produces && (
                    <g>
                      <rect x={n.x + 88} y={n.y + 6} width={61} height={16} rx={4}
                        fill={isDark ? "rgba(0,212,255,.10)" : "rgba(10,102,194,.07)"}
                        stroke={isDark ? "rgba(0,212,255,.30)" : "rgba(10,102,194,.20)"} />
                      <text x={n.x + 118} y={n.y + 17} fill={accent} fontSize={9}
                        textAnchor="middle" fontFamily={MONO}>→ {n.produces}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Legend */}
            <g transform={`translate(14,${H - 28})`}>
              <text fill="var(--cs-dim)" fontSize={12} fontFamily={MONO}>LEGEND:</text>
              <line x1={78} y1={-5} x2={114} y2={-5} stroke={accent} strokeWidth={2} markerEnd="url(#wf-arr)" />
              <text x={120} y={-1} fill="var(--cs-muted)" fontSize={12} fontFamily={MONO}>object ref</text>
              <line x1={215} y1={-5} x2={251} y2={-5} stroke={accent} strokeWidth={2}
                strokeDasharray="6,3" markerEnd="url(#wf-arr)" />
              <text x={257} y={-1} fill="var(--cs-muted)" fontSize={12} fontFamily={MONO}>array ref</text>
              <text x={360} y={-1} fill="var(--cs-dim)" fontSize={12} fontFamily={MONO}>hover node to highlight edges</text>
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────
// VIEW 2 — SCHEMA FIELD TABLE  (with dropdown + pagination)
// ─────────────────────────────────────────────────────────────
const TABLE_PAGE_SIZE = 50;

interface TableProps { isDark: boolean; wf: DynamicWorkflow; }
interface TableState { filter: string; filterApi: string; page: number; }

const API_PALETTE = ["#818cf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6", "#60a5fa", "#f59e0b", "#e06c75", "#56b6c2", "#d19a66"];
const apiColor = (name: string): string =>
  API_PALETTE[Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % API_PALETTE.length];

const SCHEMA_COLORS: Record<string, string> = {
  "doc_ref": "#00d4ff", "doc_stex": "#34d399", "obj_ref": "#f59e0b",
  "code_tab_ref": "#a78bfa", "code_tab_ref_action": "#f472b6",
};
const schemaColor = (name: string): string =>
  SCHEMA_COLORS[name] ?? API_PALETTE[Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % API_PALETTE.length];

class SchemaFieldTable extends React.Component<TableProps, TableState> {
  state: TableState = { filter: "", filterApi: "ALL", page: 0 };

  render() {
    const { filter, filterApi, page } = this.state;
    const { schemaFields } = this.props.wf;

    const apis = [...new Set(schemaFields.map(r => r.sourceApi))].sort();

    const allRows = schemaFields.filter(r => {
      const txt = filter.toLowerCase();
      return (
        (!txt || r.field.includes(txt) || r.sourceSchema.includes(txt) || r.referencesSchema.includes(txt)) &&
        (filterApi === "ALL" || r.sourceApi === filterApi)
      );
    });

    const totalPages = Math.ceil(allRows.length / TABLE_PAGE_SIZE);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    const rows = allRows.slice(safePage * TABLE_PAGE_SIZE, (safePage + 1) * TABLE_PAGE_SIZE);

    const TH: React.CSSProperties = {
      padding: "11px 16px", background: "var(--cs-surface-2)",
      color: "var(--cs-muted)", fontSize: 12, fontFamily: MONO,
      textTransform: "uppercase", letterSpacing: 1,
      borderBottom: "2px solid var(--cs-border)", textAlign: "left",
      whiteSpace: "nowrap",
    };
    const TD: React.CSSProperties = {
      padding: "9px 14px", borderBottom: "1px solid var(--cs-border-sub)",
      fontSize: 12, fontFamily: MONO, verticalAlign: "middle",
    };

    return (
      <div>
        {/* ── Filter bar: text input + API dropdown ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={filter}
            onChange={e => this.setState({ filter: e.target.value, page: 0 })}
            placeholder="🔍  filter field / schema…"
            style={{
              flex: 1, minWidth: 200, background: "var(--cs-input-bg)",
              border: "1px solid var(--cs-border)", borderRadius: 8,
              color: "var(--cs-text)", fontFamily: MONO, fontSize: 13,
              padding: "9px 14px", outline: "none",
            }}
          />
          <ApiDropdown
            apis={apis}
            value={filterApi}
            onChange={v => this.setState({ filterApi: v, page: 0 })}
            isDark={this.props.isDark}
            apiColor={apiColor}
          />
          {filterApi !== "ALL" && (
            <button
              onClick={() => this.setState({ filterApi: "ALL", page: 0 })}
              style={{
                background: "transparent", border: "1px solid var(--cs-border)",
                color: "var(--cs-dim)", borderRadius: 6, padding: "6px 12px",
                fontFamily: MONO, fontSize: 12, cursor: "pointer",
              }}
            >✕ Clear</button>
          )}
        </div>

        {/* ── Active filter badge ── */}
        {filterApi !== "ALL" && (
          <div style={{
            marginBottom: 12, padding: "6px 14px",
            background: apiColor(filterApi) + "18",
            border: `1px solid ${apiColor(filterApi)}44`,
            borderRadius: 8, color: apiColor(filterApi),
            fontFamily: MONO, fontSize: 12, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: apiColor(filterApi) }} />
            {filterApi}
            <span style={{ opacity: 0.6, fontWeight: 400 }}>— {allRows.length} fields</span>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--cs-border)", boxShadow: "var(--cs-shadow-md)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--cs-bg)" }}>
            <thead>
              <tr>{["Source API", "Schema", "Field", "Type", "References"].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "var(--cs-bg)" : "var(--cs-surface)" }}>
                  <td style={TD}>
                    <span style={{
                      background: apiColor(r.sourceApi) + "22", color: apiColor(r.sourceApi),
                      border: `1.5px solid ${apiColor(r.sourceApi)}66`,
                      borderRadius: 5, padding: "3px 9px", fontSize: 11, fontFamily: MONO,
                      whiteSpace: "nowrap",
                    }}>{r.sourceApi}</span>
                  </td>
                  <td style={{ ...TD, color: "var(--cs-muted)" }}>{r.sourceSchema}</td>
                  <td style={{ ...TD, color: "var(--cs-text)", fontWeight: 600 }}>{r.field}</td>
                  <td style={TD}>
                    <span style={{ color: r.isArray ? "#fb923c" : "var(--cs-dim)" }}>
                      {r.isArray ? `${r.fieldType}[]` : r.fieldType}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{
                      background: schemaColor(r.referencesSchema) + "1a",
                      color: schemaColor(r.referencesSchema),
                      border: `1.5px solid ${schemaColor(r.referencesSchema)}55`,
                      borderRadius: 5, padding: "3px 9px", fontSize: 11, fontFamily: MONO,
                    }}>→ {r.referencesSchema}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ ...TD, color: "var(--cs-dim)", textAlign: "center", padding: 32 }}>
                  {schemaFields.length === 0
                    ? "No schema cross-references found. Load files with $ref fields."
                    : "No fields match this filter."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        <div style={{
          marginTop: 12, display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 10,
        }}>
          <span style={{ color: "var(--cs-dim)", fontSize: 12, fontFamily: MONO }}>
            {rows.length > 0
              ? `Showing ${safePage * TABLE_PAGE_SIZE + 1}–${Math.min((safePage + 1) * TABLE_PAGE_SIZE, allRows.length)} of ${allRows.length} fields`
              : "0 fields"}
          </span>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                disabled={safePage === 0}
                onClick={() => this.setState({ page: safePage - 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "5px 12px", cursor: safePage === 0 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12,
                }}
              >◀</button>
              {/* Page number pills — show max 7 */}
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => Math.abs(i - safePage) < 4 || i === 0 || i === totalPages - 1)
                .reduce<(number | "…")[]>((acc, i, idx, arr) => {
                  if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(i);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…"
                    ? <span key={`e${idx}`} style={{ color: "var(--cs-dim)", padding: "0 4px" }}>…</span>
                    : (
                      <button
                        key={item}
                        onClick={() => this.setState({ page: item as number })}
                        style={{
                          width: 30, height: 28, borderRadius: 6, padding: 0,
                          background: item === safePage ? "var(--cs-accent)" : "var(--cs-surface-2)",
                          border: `1px solid ${item === safePage ? "var(--cs-accent)" : "var(--cs-border)"}`,
                          color: item === safePage ? "#000" : "var(--cs-muted)",
                          fontFamily: MONO, fontSize: 11, fontWeight: item === safePage ? 700 : 400,
                          cursor: "pointer",
                        }}
                      >{(item as number) + 1}</button>
                    )
                )
              }
              <button
                disabled={safePage >= totalPages - 1}
                onClick={() => this.setState({ page: safePage + 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "5px 12px", cursor: safePage >= totalPages - 1 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12,
                }}
              >▶</button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────
// VIEW 3 — WORKFLOW DIAGRAM  (horizontal pipeline, no diagonal)
// ─────────────────────────────────────────────────────────────
interface WFProps { isDark: boolean; wf: DynamicWorkflow; }
interface WFState { hovered: string | null; page: number; }

const WF_PAGE = 8; // stages per page

class WorkflowDiagram extends React.Component<WFProps, WFState> {
  state: WFState = { hovered: null, page: 0 };

  render() {
    const { hovered, page } = this.state;
    const { isDark, wf } = this.props;
    const { stages: allStages, transfers: allTransfers } = wf;

    const totalPages = Math.ceil(allStages.length / WF_PAGE);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    const stages = allStages.slice(safePage * WF_PAGE, (safePage + 1) * WF_PAGE);

    // Remap step numbers for current page
    const remapped = stages.map((s, i) => ({ ...s, step: safePage * WF_PAGE + i + 1 }));

    // Only transfers between visible stages
    const visibleIds = new Set(stages.map(s => s.id));
    const transfers = allTransfers.filter(t => visibleIds.has(t.from) && visibleIds.has(t.to));

    const BOX_W = 172;
    const BOX_H = 80;
    const GAP = 44;
    const UNIT = BOX_W + GAP;
    const PAD_X = 40;
    const PAD_Y = 56;
    const W = Math.max(stages.length * UNIT + PAD_X * 2, 600);
    const H = PAD_Y + BOX_H + PAD_Y + 16;

    const bx = (i: number) => PAD_X + i * UNIT;
    const BY = PAD_Y;
    const midY = BY + BOX_H / 2;

    const accent = isDark ? "#f59e0b" : "#d97706";
    const infoCol = isDark ? "#00d4ff" : "#0a66c2";
    const bg = "var(--cs-bg)";
    const nodeBg = "var(--cs-surface-2)";
    const dimEdge = isDark ? "rgba(245,158,11,.25)" : "rgba(217,119,6,.20)";
    const gridCol = isDark ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.025)";

    return (
      <div>
        {/* ── Pagination controls (top) ── */}
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "var(--cs-dim)", fontSize: 12, fontFamily: MONO }}>
              Stages {safePage * WF_PAGE + 1}–{Math.min((safePage + 1) * WF_PAGE, allStages.length)} of {allStages.length}
            </span>
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              <button
                disabled={safePage === 0}
                onClick={() => this.setState({ page: safePage - 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "6px 14px", cursor: safePage === 0 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12,
                }}
              >◀ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => this.setState({ page: i })}
                  style={{
                    width: 30, height: 30, borderRadius: 6, padding: 0,
                    background: i === safePage ? accent : "var(--cs-surface-2)",
                    border: `1px solid ${i === safePage ? accent : "var(--cs-border)"}`,
                    color: i === safePage ? "#000" : "var(--cs-muted)",
                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >{i + 1}</button>
              ))}
              <button
                disabled={safePage >= totalPages - 1}
                onClick={() => this.setState({ page: safePage + 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "6px 14px", cursor: safePage >= totalPages - 1 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12,
                }}
              >Next ▶</button>
            </div>
          </div>
        )}

        {/* ── Horizontal pipeline SVG ── */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--cs-border)", boxShadow: "var(--cs-shadow-md)" }}>
          <svg width={W} height={H} style={{ background: bg, borderRadius: 10, display: "block" }}>
            <defs>
              <marker id="wfw-arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L10,3 z" fill={accent} />
              </marker>
              <marker id="wfw-dim" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L10,3 z" fill={dimEdge} />
              </marker>
            </defs>

            {/* Subtle horizontal grid */}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={i} x1={0} y1={BY + i * (BOX_H / 4)} x2={W} y2={BY + i * (BOX_H / 4)}
                stroke={gridCol} strokeWidth={1} />
            ))}

            {/* Title */}
            <text x={W / 2} y={20} fill="var(--cs-dim)" fontSize={11} textAnchor="middle"
              fontFamily={MONO} letterSpacing={2} opacity={0.5}>
              {allStages.length > 0
                ? `${allStages.length}-STAGE API WORKFLOW  ·  hover to inspect data transfers`
                : "No workflow stages"}
            </text>

            {/* Arrows between consecutive visible stages */}
            {remapped.map((s, i) => {
              if (i >= remapped.length - 1) return null;
              const x1 = bx(i) + BOX_W;
              const x2 = bx(i + 1) - 3;
              const isH = hovered === s.id || hovered === remapped[i + 1].id;
              // Find transfer for this pair
              const tr = transfers.find(t => t.from === s.id && t.to === remapped[i + 1].id);
              return (
                <g key={`arr${i}`}>
                  <line x1={x1} y1={midY} x2={x2} y2={midY}
                    stroke={isH ? accent : dimEdge}
                    strokeWidth={isH ? 2.5 : 1.5}
                    markerEnd={isH ? "url(#wfw-arr)" : "url(#wfw-dim)"}
                  />
                  {isH && tr && (
                    <>
                      <rect x={(x1 + x2) / 2 - 55} y={midY - 32} width={110} height={17} rx={4}
                        fill={nodeBg} stroke="var(--cs-border)" />
                      <text x={(x1 + x2) / 2} y={midY - 20} fill={accent} fontSize={10}
                        textAnchor="middle" fontFamily={MONO} fontWeight={700}>{tr.label}</text>
                      <rect x={(x1 + x2) / 2 - 68} y={midY - 12} width={136} height={14} rx={3}
                        fill="var(--cs-surface)" stroke="var(--cs-border-sub)" />
                      <text x={(x1 + x2) / 2} y={midY - 2} fill="var(--cs-muted)" fontSize={9.5}
                        textAnchor="middle" fontFamily={MONO}>{tr.via}</text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Stage boxes */}
            {remapped.map((s, i) => {
              const x = bx(i);
              const isH = hovered === s.id;
              return (
                <g key={s.id}
                  onMouseEnter={() => this.setState({ hovered: s.id })}
                  onMouseLeave={() => this.setState({ hovered: null })}
                  style={{ cursor: "pointer" }}
                >
                  {/* Box */}
                  <rect x={x} y={BY} width={BOX_W} height={BOX_H} rx={9}
                    fill={isH ? s.color + "18" : nodeBg}
                    stroke={s.color} strokeWidth={isH ? 2.5 : 1.5}
                  />
                  {/* Color bar */}
                  <rect x={x} y={BY} width={5} height={BOX_H} rx={3} fill={s.color} />

                  {/* Step badge (above box) */}
                  <circle cx={x + 14} cy={BY - 10} r={12} fill={s.color} />
                  <text x={x + 14} y={BY - 5} fill="#000" fontSize={12}
                    fontWeight={800} textAnchor="middle" fontFamily={MONO}>{s.step}</text>

                  {/* Labels inside box */}
                  <text x={x + 16} y={BY + 22} fill={s.color} fontSize={13}
                    fontWeight={700} fontFamily={MONO}
                    clipPath={`url(#clip${i})`}>{s.label}</text>
                  <text x={x + 16} y={BY + 38} fill="var(--cs-muted)" fontSize={10}
                    fontFamily={MONO}>{s.api.slice(0, 24)}</text>
                  {s.produces && (
                    <text x={x + 16} y={BY + 55} fill={infoCol} fontSize={10}
                      fontFamily={MONO}>→ {s.produces}</text>
                  )}

                  {/* Clip path so label doesn't overflow */}
                  <defs>
                    <clipPath id={`clip${i}`}>
                      <rect x={x + 12} y={BY} width={BOX_W - 20} height={BOX_H} />
                    </clipPath>
                  </defs>
                </g>
              );
            })}

            {/* Cross-transfers (non-consecutive, shown as arcs above) */}
            {transfers
              .filter(t => {
                const fi = remapped.findIndex(s => s.id === t.from);
                const ti = remapped.findIndex(s => s.id === t.to);
                return fi >= 0 && ti >= 0 && ti - fi > 1;
              })
              .map((t, idx) => {
                const fi = remapped.findIndex(s => s.id === t.from);
                const ti = remapped.findIndex(s => s.id === t.to);
                const x1 = bx(fi) + BOX_W / 2;
                const x2 = bx(ti) + BOX_W / 2;
                const cy = BY - 22;
                const isH = hovered === t.from || hovered === t.to;
                return (
                  <g key={`xt${idx}`}>
                    <path d={`M${x1},${BY} Q${(x1 + x2) / 2},${cy} ${x2},${BY}`}
                      fill="none"
                      stroke={isH ? accent : dimEdge}
                      strokeWidth={isH ? 2 : 1}
                      strokeDasharray="5,3"
                      markerEnd={isH ? "url(#wfw-arr)" : "url(#wfw-dim)"}
                    />
                    {isH && (
                      <text x={(x1 + x2) / 2} y={cy - 5} fill={accent} fontSize={10}
                        textAnchor="middle" fontFamily={MONO} fontWeight={700}>{t.label}</text>
                    )}
                  </g>
                );
              })
            }
          </svg>
        </div>

        {/* ── Stage list summary (below diagram) ── */}
        <div style={{
          marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {allStages.map((s, i) => (
            <span
              key={s.id}
              onClick={() => this.setState({ page: Math.floor(i / WF_PAGE) })}
              style={{
                background: s.color + "18",
                border: `1px solid ${s.color}55`,
                color: s.color,
                borderRadius: 6, padding: "4px 10px",
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                cursor: "pointer",
                opacity: Math.floor(i / WF_PAGE) === safePage ? 1 : 0.45,
              }}
              title={`${s.api} · ${s.produces || ""}`}
            >
              {i + 1}. {s.label}
            </span>
          ))}
        </div>
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────
// ROOT — ApiWorkflowTab
// ─────────────────────────────────────────────────────────────
interface ApiWorkflowTabProps { loadedSpecs?: ApiSpec[]; }

export function ApiWorkflowTab({ loadedSpecs = [] }: ApiWorkflowTabProps) {
  const { isDark } = useTheme();
  const [view, setView] = React.useState<"graph" | "table" | "workflow">("graph");
  const wf = React.useMemo(() => buildDynamicWorkflow(loadedSpecs), [loadedSpecs]);

  const VIEWS = [
    { id: "graph" as const, icon: "⬡", label: "Dependency Graph" },
    { id: "table" as const, icon: "⊞", label: "Schema Field References" },
    { id: "workflow" as const, icon: "↣", label: "API Workflow Diagram" },
  ];

  return (
    <div style={{ background: "var(--cs-body-bg)", minHeight: "100%", padding: "24px 28px", fontFamily: MONO }}>
      {/* Sub-tab bar */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 28,
        borderBottom: "2px solid var(--cs-border)", alignItems: "flex-end",
      }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            background: view === v.id ? "var(--cs-surface-2)" : "transparent",
            border: "none",
            borderBottom: view === v.id ? "3px solid var(--cs-accent)" : "3px solid transparent",
            color: view === v.id ? "var(--cs-text)" : "var(--cs-muted)",
            fontFamily: MONO, fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
            padding: "11px 22px", cursor: "pointer",
            transition: "all .15s", marginBottom: -2, borderRadius: "6px 6px 0 0",
          }}>
            <span style={{ marginRight: 8, opacity: 0.7 }}>{v.icon}</span>{v.label}
          </button>
        ))}

        {/* Stats badge */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingBottom: 6 }}>
          <span style={{
            background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
            color: "var(--cs-dim)", fontSize: 11, fontFamily: MONO,
            padding: "5px 11px", borderRadius: 6,
          }}>
            {wf.isEmpty
              ? "no specs loaded"
              : `${loadedSpecs.length} specs · ${wf.nodes.length} endpoints · ${wf.edges.length} deps · ${wf.schemaFields.length} fields`}
          </span>
        </div>
      </div>

      {wf.isEmpty
        ? <EmptyWorkflow />
        : (
          <>
            {view === "graph" && <DependencyGraph isDark={isDark} wf={wf} />}
            {view === "table" && <SchemaFieldTable isDark={isDark} wf={wf} />}
            {view === "workflow" && <WorkflowDiagram isDark={isDark} wf={wf} />}
          </>
        )
      }
    </div>
  );
}

export default ApiWorkflowTab;
