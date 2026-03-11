import React from "react";
import { useTheme } from "./ThemeContext";
import { ApiSpec } from "./utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface EndpointNode {
  id: string; label: string; schema: string; resource: string;
  method: "POST" | "PATCH" | "GET" | "DELETE"; path: string;
  group: string; produces?: string; color: string; x: number; y: number;
}
interface SchemaEdge { from: string; to: string; field: string; type: string; label: string; }
interface SchemaFieldRow {
  sourceSchema: string; field: string; fieldType: string;
  referencesSchema: string; sourceApi: string; isArray: boolean;
}
interface WorkflowStage {
  id: string; label: string; api: string; produces: string | null; color: string; step: number;
}
interface WorkflowTransfer { from: string; to: string; via: string; label: string; }

// ═══════════════════════════════════════════════════════════════
// STATIC DATA  (derived from the 6 Business Case JSONs)
// ═══════════════════════════════════════════════════════════════
const NODES: EndpointNode[] = [
  { id: "pool", label: "Pool", schema: "doc_stex_pool", resource: "doc-stex-pools", method: "POST", path: "/doc-stex-pools", group: "pool", produces: "poolId", color: "#818cf8", x: 40, y: 180 },
  { id: "placement", label: "Placement", schema: "doc_stex_place", resource: "doc-stex-places", method: "POST", path: "/doc-stex-places", group: "placement", produces: "placeId", color: "#34d399", x: 240, y: 180 },
  { id: "execution", label: "Execution", schema: "doc_stex_exec", resource: "doc-stex-execs", method: "POST", path: "/doc-stex-execs", group: "execution", produces: "execId", color: "#fb923c", x: 440, y: 180 },
  { id: "allocation", label: "Allocation", schema: "doc_stex_alloc", resource: "doc-stex-allocs", method: "PATCH", path: "/doc-stex-allocs/{id}", group: "allocation", produces: "allocId", color: "#a78bfa", x: 640, y: 100 },
  { id: "billing", label: "Billing", schema: "doc_stex_bill", resource: "doc-stex-bills", method: "PATCH", path: "/doc-stex-bills/{id}", group: "billing", color: "#f472b6", x: 840, y: 180 },
  { id: "secevt", label: "SecEvent", schema: "doc_secevt2_pos", resource: "doc-secevt2-poss", method: "GET", path: "/doc-secevt2-poss", group: "secevt", color: "#64748b", x: 440, y: 360 },
  { id: "pool_p", label: "Pool \u270e", schema: "doc_stex_pool", resource: "doc-stex-pools", method: "PATCH", path: "/doc-stex-pools/{id}", group: "pool", color: "#818cf8", x: 40, y: 290 },
  { id: "placement_p", label: "Placement \u270e", schema: "doc_stex_place", resource: "doc-stex-places", method: "PATCH", path: "/doc-stex-places/{id}", group: "placement", color: "#34d399", x: 240, y: 290 },
  { id: "execution_p", label: "Execution \u270e", schema: "doc_stex_exec", resource: "doc-stex-execs", method: "PATCH", path: "/doc-stex-execs/{id}", group: "execution", color: "#fb923c", x: 440, y: 290 },
  { id: "secevt_p", label: "SecEvt \u270e", schema: "doc_secevt2_pos", resource: "doc-secevt2-poss", method: "PATCH", path: "/doc-secevt2-poss/{id}", group: "secevt", color: "#64748b", x: 640, y: 360 },
];

const EDGES: SchemaEdge[] = [
  { from: "pool", to: "placement", field: "placePoolDocList", type: "array", label: "poolId \u2192 placePoolDocList[doc_ref]" },
  { from: "placement", to: "execution", field: "origDoc", type: "object", label: "placeId \u2192 origDoc[doc_ref]" },
  { from: "placement", to: "execution", field: "execMktDoc", type: "object", label: "placeId \u2192 execMktDoc[doc_stex]" },
  { from: "execution", to: "allocation", field: "allocAllocDocList", type: "array", label: "execId \u2192 allocAllocDocList[doc_ref]" },
  { from: "execution", to: "billing", field: "execWfcAction", type: "object", label: "execId \u2192 execWfcAction[code_tab_ref]" },
  { from: "allocation", to: "billing", field: "allocWfcAction", type: "object", label: "allocId \u2192 allocWfcAction[code_tab_ref]" },
];

const SCHEMA_FIELDS: SchemaFieldRow[] = [
  { sourceSchema: "doc_stex_place", field: "placeMktDoc", fieldType: "object", referencesSchema: "doc_stex", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "placePoolDocList", fieldType: "array", referencesSchema: "doc_ref", sourceApi: "Placement", isArray: true },
  { sourceSchema: "doc_stex_place", field: "mkt", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "asset", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "tradeCurry", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "execType", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "stexValidConstr", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "discdReason", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "mktWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_place", field: "poolWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Placement", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "poolPoolDoc", fieldType: "object", referencesSchema: "doc_stex", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "poolMbrDocList", fieldType: "array", referencesSchema: "doc_ref", sourceApi: "Pool", isArray: true },
  { sourceSchema: "doc_stex_pool", field: "mkt", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "asset", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "tradeCurry", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "execType", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "stexValidConstr", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "stexExecRestr", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "stexTradeRestr", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "stexTrlAmountType", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "discdReason", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "poolWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_pool", field: "mbrWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Pool", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "origDoc", fieldType: "object", referencesSchema: "doc_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "execMktDoc", fieldType: "object", referencesSchema: "doc_stex", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "execExecDocList", fieldType: "array", referencesSchema: "doc_ref", sourceApi: "Execution", isArray: true },
  { sourceSchema: "doc_stex_exec", field: "mkt", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "asset", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "tradeCurry", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "execType", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "stexValidConstr", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "discdReason", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "docRevsCause", fieldType: "object", referencesSchema: "code_tab_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "revsOriginUser", fieldType: "object", referencesSchema: "obj_ref", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "mktWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_exec", field: "execWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Execution", isArray: false },
  { sourceSchema: "doc_stex_alloc", field: "allocAllocDocList", fieldType: "array", referencesSchema: "doc_ref", sourceApi: "Allocation", isArray: true },
  { sourceSchema: "doc_stex_alloc", field: "mktWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Allocation", isArray: false },
  { sourceSchema: "doc_stex_alloc", field: "allocWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Allocation", isArray: false },
  { sourceSchema: "doc_stex_bill", field: "mktWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Billing", isArray: false },
  { sourceSchema: "doc_stex_bill", field: "execWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Billing", isArray: false },
];

const WORKFLOW_STAGES: WorkflowStage[] = [
  { id: "pool", label: "Pool", api: "POST /doc-stex-pools", produces: "doc_stex_pool_id", color: "#818cf8", step: 1 },
  { id: "placement", label: "Placement", api: "POST /doc-stex-places", produces: "doc_stex_place_id", color: "#34d399", step: 2 },
  { id: "execution", label: "Execution", api: "POST /doc-stex-execs", produces: "trdMatchId", color: "#fb923c", step: 3 },
  { id: "allocation", label: "Allocation", api: "PATCH /doc-stex-allocs/{id}", produces: "allocId", color: "#a78bfa", step: 4 },
  { id: "billing", label: "Billing", api: "PATCH /doc-stex-bills/{id}", produces: null, color: "#f472b6", step: 5 },
];

const WORKFLOW_TRANSFERS: WorkflowTransfer[] = [
  { from: "pool", to: "placement", via: "placePoolDocList[doc_ref]", label: "poolId" },
  { from: "placement", to: "execution", via: "origDoc + execMktDoc", label: "placeId" },
  { from: "execution", to: "allocation", via: "allocAllocDocList[doc_ref]", label: "trdMatchId" },
  { from: "execution", to: "billing", via: "execWfcAction[code_tab_ref]", label: "executionId" },
  { from: "allocation", to: "billing", via: "allocWfcAction[code_tab_ref]", label: "allocationId" },
];

const SCHEMA_COLORS: Record<string, string> = {
  "doc_ref": "#00d4ff",
  "doc_stex": "#34d399",
  "obj_ref": "#f59e0b",
  "code_tab_ref": "#a78bfa",
  "code_tab_ref_action": "#f472b6",
};
const API_COLORS: Record<string, string> = {
  "Pool": "#818cf8", "Placement": "#34d399", "Execution": "#fb923c",
  "Allocation": "#a78bfa", "Billing": "#f472b6",
};

function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}
const MONO = "'JetBrains Mono','Fira Code',monospace";

// ═══════════════════════════════════════════════════════════════
// VIEW 1 — DEPENDENCY GRAPH
// ═══════════════════════════════════════════════════════════════
interface GraphProps { isDark: boolean; }
interface GraphState { hovered: string | null; }

class DependencyGraph extends React.Component<GraphProps, GraphState> {
  state: GraphState = { hovered: null };

  private nc(id: string) {
    const n = NODES.find(n => n.id === id);
    return n ? { x: n.x + 75, y: n.y + 26 } : null;
  }

  render() {
    const { hovered } = this.state;
    const { isDark } = this.props;
    const W = 1000, H = 490;

    const bg = "var(--cs-bg)";
    const surface = "var(--cs-surface-2)";
    const gridCol = isDark ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.04)";
    const accent = isDark ? "#00d4ff" : "#0a66c2";
    const dimEdge = isDark ? "rgba(55,143,233,.14)" : "rgba(10,102,194,.10)";
    const nodeBg = "var(--cs-surface)";

    return (
      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--cs-border)", boxShadow: "var(--cs-shadow-md)" }}>
        <svg width={W} height={H} style={{ background: bg, borderRadius: 10, display: "block" }}>
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`gv${i}`} x1={i * 50} y1={0} x2={i * 50} y2={H} stroke={gridCol} strokeWidth={1} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
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

          {EDGES.map((e, i) => {
            const f = this.nc(e.from), t = this.nc(e.to);
            if (!f || !t) return null;
            const isH = hovered === e.from || hovered === e.to;
            const midX = (f.x + t.x) / 2, midY = (f.y + t.y) / 2 - 22;
            return (
              <g key={i}>
                <path d={curvePath(f.x + 75, f.y, t.x - 5, t.y)}
                  fill="none" stroke={isH ? accent : dimEdge}
                  strokeWidth={isH ? 2.5 : 1.2}
                  strokeDasharray={e.type === "array" ? "7,3" : undefined}
                  markerEnd={isH ? "url(#wf-arr)" : "url(#wf-arr-dim)"}
                />
                {isH && (
                  <>
                    <rect x={midX - 62} y={midY - 15} width={124} height={19} rx={5}
                      fill={surface} stroke="var(--cs-border)" />
                    <text x={midX} y={midY - 2} fill={accent} fontSize={11.5}
                      textAnchor="middle" fontFamily={MONO} fontWeight={600}>{e.field}</text>
                  </>
                )}
              </g>
            );
          })}

          {NODES.map(n => {
            const isH = hovered === n.id;
            return (
              <g key={n.id}
                onMouseEnter={() => this.setState({ hovered: n.id })}
                onMouseLeave={() => this.setState({ hovered: null })}
                style={{ cursor: "pointer" }}
              >
                <rect x={n.x} y={n.y} width={155} height={56} rx={8}
                  fill={isH ? n.color + "18" : nodeBg}
                  stroke={isH ? n.color : n.color + "55"}
                  strokeWidth={isH ? 2.5 : 1.5}
                />
                <rect x={n.x} y={n.y} width={5} height={56} rx={3}
                  fill={n.color} opacity={isH ? 1 : 0.75} />
                <text x={n.x + 14} y={n.y + 21} fill={n.color} fontSize={14}
                  fontWeight={700} fontFamily={MONO}>{n.label}</text>
                <text x={n.x + 14} y={n.y + 36} fill="var(--cs-muted)" fontSize={11}
                  fontFamily={MONO}>{n.method}</text>
                <text x={n.x + 14} y={n.y + 50} fill="var(--cs-dim)" fontSize={10}
                  fontFamily={MONO}>{n.schema}</text>
                {n.produces && (
                  <g>
                    <rect x={n.x + 92} y={n.y + 6} width={57} height={16} rx={4}
                      fill={isDark ? "rgba(0,212,255,.10)" : "rgba(10,102,194,.07)"}
                      stroke={isDark ? "rgba(0,212,255,.30)" : "rgba(10,102,194,.20)"} />
                    <text x={n.x + 120} y={n.y + 17} fill={accent} fontSize={9}
                      textAnchor="middle" fontFamily={MONO}>
                      {"\u2192"}{n.produces}
                    </text>
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
            <text x={360} y={-1} fill="var(--cs-dim)" fontSize={12} fontFamily={MONO}>
              hover node to highlight edges
            </text>
          </g>
        </svg>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// VIEW 2 — SCHEMA FIELD TABLE
// ═══════════════════════════════════════════════════════════════
interface TableProps { isDark: boolean; }
interface TableState { filter: string; filterApi: string; }

class SchemaFieldTable extends React.Component<TableProps, TableState> {
  state: TableState = { filter: "", filterApi: "ALL" };

  render() {
    const { filter, filterApi } = this.state;
    const rows = SCHEMA_FIELDS.filter(r => {
      const txt = filter.toLowerCase();
      return (!txt || r.field.includes(txt) || r.sourceSchema.includes(txt) || r.referencesSchema.includes(txt))
        && (filterApi === "ALL" || r.sourceApi === filterApi);
    });

    const TH: React.CSSProperties = {
      padding: "11px 16px", background: "var(--cs-surface-2)",
      color: "var(--cs-muted)", fontSize: 12, fontFamily: MONO,
      textTransform: "uppercase", letterSpacing: 1,
      borderBottom: "2px solid var(--cs-border)", textAlign: "left",
      whiteSpace: "nowrap",
    };
    const TD: React.CSSProperties = {
      padding: "10px 16px", borderBottom: "1px solid var(--cs-border-sub)",
      fontSize: 13, fontFamily: MONO, verticalAlign: "middle",
    };

    return (
      <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input value={filter} onChange={e => this.setState({ filter: e.target.value })}
            placeholder="🔍  filter field / schema…"
            style={{
              background: "var(--cs-input-bg)", border: "1px solid var(--cs-border)",
              borderRadius: 8, color: "var(--cs-text)", fontFamily: MONO,
              fontSize: 13, padding: "9px 14px", outline: "none", flex: 1, minWidth: 220,
              boxShadow: "var(--cs-shadow-sm)",
            }}
          />
          {["ALL", "Pool", "Placement", "Execution", "Allocation", "Billing"].map(api => {
            const active = filterApi === api;
            const col = API_COLORS[api] || "var(--cs-accent)";
            return (
              <button key={api} onClick={() => this.setState({ filterApi: api })} style={{
                background: active ? col : "var(--cs-surface-2)",
                border: `1.5px solid ${active ? col : "var(--cs-border)"}`,
                color: active ? "#000" : "var(--cs-muted)",
                borderRadius: 7, fontSize: 12, fontFamily: MONO,
                padding: "7px 14px", cursor: "pointer", fontWeight: 600,
                transition: "all .15s",
              }}>{api}</button>
            );
          })}
        </div>

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
                      background: (API_COLORS[r.sourceApi] || "var(--cs-accent)") + "22",
                      color: API_COLORS[r.sourceApi] || "var(--cs-accent)",
                      border: `1.5px solid ${(API_COLORS[r.sourceApi] || "var(--cs-accent)") + "66"}`,
                      borderRadius: 5, padding: "3px 9px", fontSize: 11, fontFamily: MONO,
                    }}>{r.sourceApi}</span>
                  </td>
                  <td style={{ ...TD, color: "var(--cs-muted)" }}>{r.sourceSchema}</td>
                  <td style={{ ...TD, color: "var(--cs-text)", fontWeight: 600 }}>{r.field}</td>
                  <td style={TD}>
                    <span style={{ color: r.isArray ? "#fb923c" : "var(--cs-dim)", fontFamily: MONO }}>
                      {r.isArray ? `${r.fieldType}[]` : r.fieldType}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{
                      background: (SCHEMA_COLORS[r.referencesSchema] || "var(--cs-accent)") + "1a",
                      color: SCHEMA_COLORS[r.referencesSchema] || "var(--cs-accent)",
                      border: `1.5px solid ${(SCHEMA_COLORS[r.referencesSchema] || "var(--cs-accent)") + "55"}`,
                      borderRadius: 5, padding: "3px 9px", fontSize: 11, fontFamily: MONO,
                    }}>{"\u2192"} {r.referencesSchema}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ ...TD, color: "var(--cs-dim)", textAlign: "center", padding: 32 }}>
                  No fields match this filter
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, color: "var(--cs-dim)", fontSize: 12, fontFamily: MONO }}>
          {rows.length} of {SCHEMA_FIELDS.length} field references shown
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// VIEW 3 — WORKFLOW DIAGRAM (swimlane)
// ═══════════════════════════════════════════════════════════════
interface WFProps { isDark: boolean; }
interface WFState { hovered: string | null; }

class WorkflowDiagram extends React.Component<WFProps, WFState> {
  state: WFState = { hovered: null };

  render() {
    const { hovered } = this.state;
    const { isDark } = this.props;
    const W = 1000, LH = 100, PAD = 46, SW = 165;
    const sx = (step: number) => PAD + (step - 1) * ((W - PAD * 2 - SW) / 4);
    const secEvtY = WORKFLOW_STAGES.length * LH + PAD + 28;
    const H = secEvtY + LH + PAD;

    const bg = "var(--cs-bg)";
    const rowAlt = "var(--cs-surface)";
    const rowBase = "var(--cs-bg)";
    const gridCol = isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.03)";
    const accent = isDark ? "#f59e0b" : "#d97706";
    const dimEdge = isDark ? "rgba(55,143,233,.12)" : "rgba(10,102,194,.09)";
    const infoCol = isDark ? "#00d4ff" : "#0a66c2";
    const nodeBox = "var(--cs-surface-2)";

    return (
      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--cs-border)", boxShadow: "var(--cs-shadow-md)" }}>
        <svg width={W} height={H} style={{ background: bg, borderRadius: 10, display: "block" }}>
          <defs>
            <marker id="wfw-arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L10,3 z" fill={accent} />
            </marker>
            <marker id="wfw-arr-dim" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L10,3 z" fill={dimEdge} />
            </marker>
          </defs>

          {/* Swimlane rows */}
          {WORKFLOW_STAGES.map((s, i) => (
            <g key={s.id}>
              <rect x={0} y={PAD + i * LH} width={W} height={LH}
                fill={i % 2 === 0 ? rowBase : rowAlt} />
              <line x1={0} y1={PAD + i * LH} x2={W} y2={PAD + i * LH}
                stroke={gridCol} strokeWidth={1} />
              <text x={W - 12} y={PAD + i * LH + 20} fill={s.color + "55"} fontSize={11}
                fontFamily={MONO} style={{ textTransform: "uppercase" }}
                textAnchor="end">{s.label}</text>
            </g>
          ))}

          {/* Stage boxes */}
          {WORKFLOW_STAGES.map((s, i) => {
            const bx = sx(s.step), by = PAD + i * LH + (LH - 60) / 2;
            const midY = PAD + i * LH + LH / 2;
            const isH = hovered === s.id;
            return (
              <g key={s.id}
                onMouseEnter={() => this.setState({ hovered: s.id })}
                onMouseLeave={() => this.setState({ hovered: null })}
                style={{ cursor: "pointer" }}
              >
                <line x1={0} y1={midY} x2={bx} y2={midY}
                  stroke={gridCol} strokeWidth={1} strokeDasharray="3,6" />
                <line x1={bx + SW} y1={midY} x2={W} y2={midY}
                  stroke={gridCol} strokeWidth={1} strokeDasharray="3,6" />

                <rect x={bx} y={by} width={SW} height={60} rx={9}
                  fill={isH ? s.color + "18" : nodeBox}
                  stroke={s.color} strokeWidth={isH ? 2.5 : 1.5} />
                <rect x={bx} y={by} width={5} height={60} rx={3} fill={s.color} />

                <text x={bx + 14} y={by + 22} fill={s.color} fontSize={15} fontWeight={700}
                  fontFamily={MONO}>{s.label}</text>
                <text x={bx + 14} y={by + 38} fill="var(--cs-muted)" fontSize={11}
                  fontFamily={MONO}>{s.api}</text>
                {s.produces && (
                  <text x={bx + 14} y={by + 53} fill={infoCol} fontSize={11}
                    fontFamily={MONO}>{"\u2192"} {s.produces}</text>
                )}
              </g>
            );
          })}

          {/* Transfer arrows */}
          {WORKFLOW_TRANSFERS.map((t, i) => {
            const fS = WORKFLOW_STAGES.find(s => s.id === t.from)!;
            const tS = WORKFLOW_STAGES.find(s => s.id === t.to)!;
            const fx = sx(fS.step) + SW, fy = PAD + (fS.step - 1) * LH + LH / 2;
            const tx = sx(tS.step), ty = PAD + (tS.step - 1) * LH + LH / 2;
            const mx = (fx + tx) / 2, my = (fy + ty) / 2;
            const isH = hovered === t.from || hovered === t.to;
            return (
              <g key={i}>
                <path
                  d={fy === ty ? `M${fx},${fy} L${tx - 5},${ty}`
                    : `M${fx},${fy} C${fx + 44},${fy} ${tx - 44},${ty} ${tx - 5},${ty}`}
                  fill="none" stroke={isH ? accent : dimEdge}
                  strokeWidth={isH ? 2.5 : 1.2}
                  markerEnd={isH ? "url(#wfw-arr)" : "url(#wfw-arr-dim)"}
                />
                {isH && (
                  <>
                    <rect x={mx - 52} y={my - 26} width={104} height={18} rx={5}
                      fill="var(--cs-surface-2)" stroke="var(--cs-border)" />
                    <text x={mx} y={my - 13} fill={accent} fontSize={12} textAnchor="middle"
                      fontFamily={MONO} fontWeight={700}>{t.label}</text>
                    <rect x={mx - 74} y={my - 4} width={148} height={15} rx={4}
                      fill="var(--cs-surface)" stroke="var(--cs-border-sub)" />
                    <text x={mx} y={my + 6} fill="var(--cs-muted)" fontSize={10}
                      textAnchor="middle" fontFamily={MONO}>{t.via}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Step badges */}
          {WORKFLOW_STAGES.map((s, i) => (
            <g key={`step${i}`}>
              <circle cx={sx(s.step) + 14} cy={PAD + i * LH - 9} r={12} fill={s.color} />
              <text x={sx(s.step) + 14} y={PAD + i * LH - 4} fill="#000" fontSize={13}
                fontWeight={800} textAnchor="middle" fontFamily={MONO}>{s.step}</text>
            </g>
          ))}

          {/* SecEvent lane */}
          <g>
            <rect x={0} y={secEvtY} width={W} height={LH} fill={rowAlt} />
            <line x1={0} y1={secEvtY} x2={W} y2={secEvtY}
              stroke="var(--cs-border)" strokeWidth={1.5} strokeDasharray="8,5" />
            <text x={14} y={secEvtY + 18} fill="var(--cs-dim)" fontSize={12} fontFamily={MONO}>
              PARALLEL  ·  Security Event Position  (independent trigger)
            </text>
            {[
              { m: "GET", p: "/doc-secevt2-poss", x: 60 },
              { m: "GET", p: "/doc-secevt2-poss/{id}", x: 310 },
              { m: "PATCH", p: "/doc-secevt2-poss/{id}", x: 560 },
            ].map((ep, idx) => (
              <g key={idx}>
                <rect x={ep.x} y={secEvtY + 26} width={210} height={50} rx={8}
                  fill={nodeBox} stroke="var(--cs-border)" strokeWidth={1} />
                <text x={ep.x + 12} y={secEvtY + 46} fill="var(--cs-green)" fontSize={13}
                  fontWeight={700} fontFamily={MONO}>{ep.m}</text>
                <text x={ep.x + 12} y={secEvtY + 63} fill="var(--cs-muted)" fontSize={11}
                  fontFamily={MONO}>{ep.p}</text>
                {idx < 2 && (
                  <path d={`M${ep.x + 210},${secEvtY + 51} L${ep.x + 248},${secEvtY + 51}`}
                    fill="none" stroke={dimEdge} strokeWidth={1.5} markerEnd="url(#wfw-arr-dim)" />
                )}
              </g>
            ))}
          </g>

          {/* Title */}
          <text x={W / 2} y={24} fill="var(--cs-dim)" fontSize={12} textAnchor="middle"
            fontFamily={MONO} letterSpacing={2} opacity={0.5}>
            STOCK EXCHANGE TRADING WORKFLOW  ·  hover steps to inspect ID transfers
          </text>
        </svg>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// ROOT — ApiWorkflowTab
// Functional so useTheme() works; sub-views are class components
// matching the existing Capi class-component style.
// ═══════════════════════════════════════════════════════════════
interface ApiWorkflowTabProps { loadedSpecs?: ApiSpec[]; }

export function ApiWorkflowTab({ loadedSpecs }: ApiWorkflowTabProps) {
  const { isDark } = useTheme();
  const [view, setView] = React.useState<"graph" | "table" | "workflow">("graph");

  const VIEWS = [
    { id: "graph" as const, icon: "\u2B21", label: "Dependency Graph" },
    { id: "table" as const, icon: "\u229E", label: "Schema Field References" },
    { id: "workflow" as const, icon: "\u21A3", label: "API Workflow Diagram" },
  ];

  return (
    <div style={{
      background: "var(--cs-body-bg)",
      minHeight: "100%",
      padding: "24px 28px",
      fontFamily: MONO,
    }}>
      {/* Sub-tab bar */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 28,
        borderBottom: "2px solid var(--cs-border)",
        alignItems: "flex-end",
      }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            background: view === v.id ? "var(--cs-surface-2)" : "transparent",
            border: "none",
            borderBottom: view === v.id ? "3px solid var(--cs-accent)" : "3px solid transparent",
            color: view === v.id ? "var(--cs-text)" : "var(--cs-muted)",
            fontFamily: MONO, fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
            padding: "11px 22px", cursor: "pointer",
            transition: "all .15s", marginBottom: -2,
            borderRadius: "6px 6px 0 0",
          }}>
            <span style={{ marginRight: 8, opacity: 0.7 }}>{v.icon}</span>{v.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingBottom: 6 }}>
          <span style={{
            background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
            color: "var(--cs-dim)", fontSize: 11, fontFamily: MONO,
            padding: "5px 11px", borderRadius: 6,
          }}>
            6 schemas · {NODES.length} endpoints · {EDGES.length} deps
          </span>
        </div>
      </div>

      {view === "graph" && <DependencyGraph isDark={isDark} />}
      {view === "table" && <SchemaFieldTable isDark={isDark} />}
      {view === "workflow" && <WorkflowDiagram isDark={isDark} />}
    </div>
  );
}

export default ApiWorkflowTab;
