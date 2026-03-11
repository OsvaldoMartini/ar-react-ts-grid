import React from "react";
import { ApiSpec } from "./utils";

// ═══════════════════════════════════════════════════════════════
// STATIC WORKFLOW DATA  (derived from the 6 Business Case JSONs)
// ═══════════════════════════════════════════════════════════════

interface EndpointNode {
  id: string;
  label: string;
  schema: string;
  resource: string;
  method: "POST" | "PATCH" | "GET" | "DELETE";
  path: string;
  group: "pool" | "placement" | "execution" | "allocation" | "billing" | "secevt";
  produces?: string;   // ID token it returns
  color: string;
  x: number;
  y: number;
}

interface SchemaEdge {
  from: string;
  to: string;
  field: string;
  type: string;
  label: string;
}

interface SchemaFieldRow {
  sourceSchema: string;
  field: string;
  fieldType: string;
  referencesSchema: string;
  sourceApi: string;
  isArray: boolean;
}

const NODES: EndpointNode[] = [
  { id: "pool", label: "Pool", schema: "doc_stex_pool", resource: "doc-stex-pools", method: "POST", path: "/doc-stex-pools", group: "pool", produces: "poolId", color: "#818cf8", x: 60, y: 200 },
  { id: "placement", label: "Placement", schema: "doc_stex_place", resource: "doc-stex-places", method: "POST", path: "/doc-stex-places", group: "placement", produces: "placeId", color: "#34d399", x: 260, y: 200 },
  { id: "execution", label: "Execution", schema: "doc_stex_exec", resource: "doc-stex-execs", method: "POST", path: "/doc-stex-execs", group: "execution", produces: "execId", color: "#fb923c", x: 460, y: 200 },
  { id: "allocation", label: "Allocation", schema: "doc_stex_alloc", resource: "doc-stex-allocs", method: "PATCH", path: "/doc-stex-allocs/{id}", group: "allocation", produces: "allocId", color: "#a78bfa", x: 660, y: 120 },
  { id: "billing", label: "Billing", schema: "doc_stex_bill", resource: "doc-stex-bills", method: "PATCH", path: "/doc-stex-bills/{id}", group: "billing", color: "#f472b6", x: 860, y: 200 },
  { id: "secevt", label: "SecEvent", schema: "doc_secevt2_pos", resource: "doc-secevt2-poss", method: "GET", path: "/doc-secevt2-poss", group: "secevt", color: "#64748b", x: 460, y: 370 },
  // PATCH variants
  { id: "pool_p", label: "Pool ✎", schema: "doc_stex_pool", resource: "doc-stex-pools", method: "PATCH", path: "/doc-stex-pools/{id}", group: "pool", color: "#818cf8", x: 60, y: 310 },
  { id: "placement_p", label: "Placement ✎", schema: "doc_stex_place", resource: "doc-stex-places", method: "PATCH", path: "/doc-stex-places/{id}", group: "placement", color: "#34d399", x: 260, y: 310 },
  { id: "execution_p", label: "Execution ✎", schema: "doc_stex_exec", resource: "doc-stex-execs", method: "PATCH", path: "/doc-stex-execs/{id}", group: "execution", color: "#fb923c", x: 460, y: 310 },
  { id: "secevt_p", label: "SecEvt ✎", schema: "doc_secevt2_pos", resource: "doc-secevt2-poss", method: "PATCH", path: "/doc-secevt2-poss/{id}", group: "secevt", color: "#64748b", x: 660, y: 370 },
];

const EDGES: SchemaEdge[] = [
  { from: "pool", to: "placement", field: "placePoolDocList", type: "array", label: "poolId → placePoolDocList[doc_ref]" },
  { from: "placement", to: "execution", field: "origDoc", type: "object", label: "placeId → origDoc[doc_ref]" },
  { from: "placement", to: "execution", field: "execMktDoc", type: "object", label: "placeId → execMktDoc[doc_stex]" },
  { from: "execution", to: "allocation", field: "allocAllocDocList", type: "array", label: "execId → allocAllocDocList[doc_ref]" },
  { from: "execution", to: "billing", field: "execWfcAction", type: "object", label: "execId → execWfcAction[code_tab_ref]" },
  { from: "allocation", to: "billing", field: "allocWfcAction", type: "object", label: "allocId → allocWfcAction[code_tab_ref]" },
];

const SCHEMA_FIELDS: SchemaFieldRow[] = [
  // doc_stex_place
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
  // doc_stex_pool
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
  // doc_stex_exec
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
  // doc_stex_alloc
  { sourceSchema: "doc_stex_alloc", field: "allocAllocDocList", fieldType: "array", referencesSchema: "doc_ref", sourceApi: "Allocation", isArray: true },
  { sourceSchema: "doc_stex_alloc", field: "mktWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Allocation", isArray: false },
  { sourceSchema: "doc_stex_alloc", field: "allocWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Allocation", isArray: false },
  // doc_stex_bill
  { sourceSchema: "doc_stex_bill", field: "mktWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Billing", isArray: false },
  { sourceSchema: "doc_stex_bill", field: "execWfcAction", fieldType: "object", referencesSchema: "code_tab_ref_action", sourceApi: "Billing", isArray: false },
];

// ═══════════════════════════════════════════════════════════════
// WORKFLOW STAGES (for Swimlane diagram)
// ═══════════════════════════════════════════════════════════════
const WORKFLOW_STAGES = [
  { id: "pool", label: "Pool", api: "POST /doc-stex-pools", produces: "doc_stex_pool_id", color: "#818cf8", step: 1 },
  { id: "placement", label: "Placement", api: "POST /doc-stex-places", produces: "doc_stex_place_id", color: "#34d399", step: 2 },
  { id: "execution", label: "Execution", api: "POST /doc-stex-execs", produces: "trdMatchId", color: "#fb923c", step: 3 },
  { id: "allocation", label: "Allocation", api: "PATCH /doc-stex-allocs/{id}", produces: "allocId", color: "#a78bfa", step: 4 },
  { id: "billing", label: "Billing", api: "PATCH /doc-stex-bills/{id}", produces: null, color: "#f472b6", step: 5 },
];

const WORKFLOW_TRANSFERS = [
  { from: "pool", to: "placement", via: "placePoolDocList[doc_ref]", label: "poolId" },
  { from: "placement", to: "execution", via: "origDoc + execMktDoc", label: "placeId" },
  { from: "execution", to: "allocation", via: "allocAllocDocList[doc_ref]", label: "trdMatchId" },
  { from: "execution", to: "billing", via: "execWfcAction[code_tab_ref]", label: "executionId" },
  { from: "allocation", to: "billing", via: "allocWfcAction[code_tab_ref]", label: "allocationId" },
];

// ═══════════════════════════════════════════════════════════════
// HELPER: SVG curved path between two points
// ═══════════════════════════════════════════════════════════════
function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

// ═══════════════════════════════════════════════════════════════
// METHOD BADGE
// ═══════════════════════════════════════════════════════════════
const METHOD_COLORS: Record<string, string> = {
  GET: "#22c55e", POST: "#3b82f6", PATCH: "#f59e0b", DELETE: "#ef4444",
};

function MBadge({ method }: { method: string }) {
  return (
    <span style={{
      background: METHOD_COLORS[method] || "#64748b",
      color: "#000",
      fontFamily: "monospace",
      fontWeight: 700,
      fontSize: 10,
      padding: "1px 5px",
      borderRadius: 3,
      letterSpacing: 0.5,
    }}>{method}</span>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW 1: DEPENDENCY GRAPH
// ═══════════════════════════════════════════════════════════════
interface DepGraphState { hovered: string | null; }

class DependencyGraph extends React.Component<{}, DepGraphState> {
  state: DepGraphState = { hovered: null };

  // Map node id → centre position on SVG canvas
  private nodePos(id: string): { x: number; y: number } | null {
    const n = NODES.find(n => n.id === id);
    return n ? { x: n.x + 70, y: n.y + 22 } : null;
  }

  render() {
    const { hovered } = this.state;
    const W = 980, H = 460;

    return (
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: "#0d1117", borderRadius: 8, display: "block" }}>
          {/* Grid */}
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`gv${i}`} x1={i * 50} y1={0} x2={i * 50} y2={H} stroke="#1e293b" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`gh${i}`} x1={0} y1={i * 50} x2={W} y2={i * 50} stroke="#1e293b" strokeWidth={0.5} />
          ))}

          {/* Arrowhead marker */}
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#00d4ff" />
            </marker>
            <marker id="arr-dim" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Edges */}
          {EDGES.map((e, i) => {
            const from = this.nodePos(e.from);
            const to = this.nodePos(e.to);
            if (!from || !to) return null;
            const isHovered = hovered === e.from || hovered === e.to;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 18;
            return (
              <g key={i}>
                <path
                  d={curvePath(from.x + 70, from.y, to.x - 4, to.y)}
                  fill="none"
                  stroke={isHovered ? "#00d4ff" : "#1e4a6e"}
                  strokeWidth={isHovered ? 2 : 1}
                  markerEnd={isHovered ? "url(#arr)" : "url(#arr-dim)"}
                  strokeDasharray={e.type === "array" ? "5,3" : undefined}
                />
                {isHovered && (
                  <text x={midX} y={midY} fill="#00d4ff" fontSize={9} textAnchor="middle"
                    fontFamily="monospace" style={{ pointerEvents: "none" }}>
                    {e.field}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map(n => {
            const isH = hovered === n.id;
            return (
              <g key={n.id}
                onMouseEnter={() => this.setState({ hovered: n.id })}
                onMouseLeave={() => this.setState({ hovered: null })}
                style={{ cursor: "pointer" }}
              >
                <rect x={n.x} y={n.y} width={140} height={44}
                  rx={6}
                  fill={isH ? n.color + "22" : "#0f172a"}
                  stroke={isH ? n.color : n.color + "55"}
                  strokeWidth={isH ? 2 : 1}
                />
                {isH && (
                  <rect x={n.x} y={n.y} width={4} height={44} rx={2} fill={n.color} />
                )}
                <text x={n.x + 12} y={n.y + 15} fill={n.color} fontSize={11} fontWeight={700}
                  fontFamily="monospace">{n.label}</text>
                <text x={n.x + 12} y={n.y + 28} fill="#64748b" fontSize={9} fontFamily="monospace">
                  {n.method}
                </text>
                <text x={n.x + 12} y={n.y + 39} fill="#334155" fontSize={8} fontFamily="monospace">
                  {n.schema}
                </text>
                {n.produces && (
                  <g>
                    <rect x={n.x + 88} y={n.y + 5} width={46} height={12} rx={3} fill="#0c2d3a" />
                    <text x={n.x + 111} y={n.y + 14} fill="#00d4ff" fontSize={7} textAnchor="middle"
                      fontFamily="monospace">→ {n.produces}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(10,415)">
            <text fill="#475569" fontSize={9} fontFamily="monospace">LEGEND:</text>
            <line x1={70} y1={-4} x2={100} y2={-4} stroke="#00d4ff" strokeWidth={1.5} markerEnd="url(#arr)" />
            <text x={105} y={-1} fill="#64748b" fontSize={9} fontFamily="monospace">object ref</text>
            <line x1={175} y1={-4} x2={205} y2={-4} stroke="#00d4ff" strokeWidth={1.5} strokeDasharray="4,2" markerEnd="url(#arr)" />
            <text x={210} y={-1} fill="#64748b" fontSize={9} fontFamily="monospace">array ref</text>
            <text x={280} y={-1} fill="#475569" fontSize={9} fontFamily="monospace">hover node to highlight edges</text>
          </g>
        </svg>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// VIEW 2: SCHEMA FIELD REFERENCE TABLE
// ═══════════════════════════════════════════════════════════════
const SCHEMA_COLORS: Record<string, string> = {
  "doc_ref": "#00d4ff",
  "doc_stex": "#34d399",
  "obj_ref": "#f59e0b",
  "code_tab_ref": "#a78bfa",
  "code_tab_ref_action": "#f472b6",
};

const API_COLORS: Record<string, string> = {
  "Pool": "#818cf8",
  "Placement": "#34d399",
  "Execution": "#fb923c",
  "Allocation": "#a78bfa",
  "Billing": "#f472b6",
};

interface FieldTableState { filter: string; filterApi: string; }
class SchemaFieldTable extends React.Component<{}, FieldTableState> {
  state: FieldTableState = { filter: "", filterApi: "ALL" };

  render() {
    const { filter, filterApi } = this.state;
    const rows = SCHEMA_FIELDS.filter(r => {
      const txt = filter.toLowerCase();
      const matchText = !txt || r.field.includes(txt) || r.sourceSchema.includes(txt) || r.referencesSchema.includes(txt);
      const matchApi = filterApi === "ALL" || r.sourceApi === filterApi;
      return matchText && matchApi;
    });

    const TH: React.CSSProperties = {
      padding: "8px 12px", background: "#0f172a", color: "#64748b",
      fontSize: 10, fontFamily: "monospace", textTransform: "uppercase",
      letterSpacing: 1, borderBottom: "1px solid #1e293b", textAlign: "left", whiteSpace: "nowrap",
    };
    const TD: React.CSSProperties = {
      padding: "7px 12px", borderBottom: "1px solid #0f172a",
      fontSize: 11, fontFamily: "monospace", verticalAlign: "middle",
    };

    return (
      <div>
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={filter}
            onChange={e => this.setState({ filter: e.target.value })}
            placeholder="🔍 filter field / schema…"
            style={{
              background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6,
              color: "#94a3b8", fontFamily: "monospace", fontSize: 12, padding: "6px 10px",
              outline: "none", flex: 1, minWidth: 180,
            }}
          />
          {["ALL", "Pool", "Placement", "Execution", "Allocation", "Billing"].map(api => (
            <button
              key={api}
              onClick={() => this.setState({ filterApi: api })}
              style={{
                background: filterApi === api ? (API_COLORS[api] || "#334155") : "#0f172a",
                border: `1px solid ${filterApi === api ? (API_COLORS[api] || "#334155") : "#1e293b"}`,
                color: filterApi === api ? "#000" : "#64748b",
                borderRadius: 5, fontSize: 11, fontFamily: "monospace",
                padding: "4px 10px", cursor: "pointer", fontWeight: 600,
              }}
            >{api}</button>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#0d1117", borderRadius: 8, overflow: "hidden" }}>
            <thead>
              <tr>
                <th style={TH}>Source API</th>
                <th style={TH}>Schema</th>
                <th style={TH}>Field</th>
                <th style={TH}>Type</th>
                <th style={TH}>References</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#0d1117" : "#0f172a" }}>
                  <td style={TD}>
                    <span style={{
                      background: (API_COLORS[r.sourceApi] || "#334155") + "22",
                      color: API_COLORS[r.sourceApi] || "#64748b",
                      border: `1px solid ${(API_COLORS[r.sourceApi] || "#334155") + "55"}`,
                      borderRadius: 4, padding: "1px 6px", fontSize: 10, fontFamily: "monospace",
                    }}>{r.sourceApi}</span>
                  </td>
                  <td style={{ ...TD, color: "#94a3b8" }}>{r.sourceSchema}</td>
                  <td style={{ ...TD, color: "#e2e8f0", fontWeight: 600 }}>{r.field}</td>
                  <td style={TD}>
                    <span style={{ color: r.isArray ? "#fb923c" : "#64748b", fontFamily: "monospace" }}>
                      {r.isArray ? `${r.fieldType}[]` : r.fieldType}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{
                      background: (SCHEMA_COLORS[r.referencesSchema] || "#334155") + "22",
                      color: SCHEMA_COLORS[r.referencesSchema] || "#94a3b8",
                      border: `1px solid ${(SCHEMA_COLORS[r.referencesSchema] || "#334155") + "44"}`,
                      borderRadius: 4, padding: "2px 7px", fontSize: 10, fontFamily: "monospace",
                    }}>→ {r.referencesSchema}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...TD, color: "#334155", textAlign: "center", padding: 24 }}>
                    No fields match this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, color: "#334155", fontSize: 10, fontFamily: "monospace" }}>
          {rows.length} of {SCHEMA_FIELDS.length} field references
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// VIEW 3: WORKFLOW DIAGRAM (swimlane)
// ═══════════════════════════════════════════════════════════════
class WorkflowDiagram extends React.Component<{}, { hovered: string | null }> {
  state = { hovered: null as string | null };

  render() {
    const { hovered } = this.state;
    const W = 980, LH = 90, PAD = 40, STAGE_W = 150;
    const stageX = (step: number) => PAD + (step - 1) * ((W - PAD * 2 - STAGE_W) / 4);
    const secEvtY = WORKFLOW_STAGES.length * LH + PAD + 20;
    const H = secEvtY + LH + PAD;

    return (
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: "#0d1117", borderRadius: 8, display: "block" }}>
          <defs>
            <marker id="warr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
            </marker>
            <marker id="garr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
            </marker>
          </defs>

          {/* Swimlane backgrounds */}
          {WORKFLOW_STAGES.map((s, i) => (
            <g key={s.id}>
              <rect x={0} y={PAD + i * LH} width={W} height={LH}
                fill={i % 2 === 0 ? "#0a0f1a" : "#0d1117"} />
              <line x1={0} y1={PAD + i * LH} x2={W} y2={PAD + i * LH} stroke="#1e293b" strokeWidth={0.5} />
              {/* Lane label */}
              <text x={10} y={PAD + i * LH + 20} fill={s.color + "88"} fontSize={8}
                fontFamily="monospace" style={{ textTransform: "uppercase" }}>{s.label}</text>
            </g>
          ))}

          {/* Step boxes */}
          {WORKFLOW_STAGES.map((s, i) => {
            const sx = stageX(s.step);
            const sy = PAD + i * LH + (LH - 52) / 2;
            const isH = hovered === s.id;
            return (
              <g key={s.id}
                onMouseEnter={() => this.setState({ hovered: s.id })}
                onMouseLeave={() => this.setState({ hovered: null })}
                style={{ cursor: "pointer" }}
              >
                {/* Connecting line across swimlane */}
                <line x1={0} y1={PAD + i * LH + LH / 2} x2={sx} y2={PAD + i * LH + LH / 2}
                  stroke="#1e293b" strokeWidth={1} strokeDasharray="2,4" />
                <line x1={sx + STAGE_W} y1={PAD + i * LH + LH / 2} x2={W} y2={PAD + i * LH + LH / 2}
                  stroke="#1e293b" strokeWidth={1} strokeDasharray="2,4" />

                <rect x={sx} y={sy} width={STAGE_W} height={52} rx={6}
                  fill={isH ? s.color + "22" : "#0f172a"}
                  stroke={s.color}
                  strokeWidth={isH ? 2 : 1}
                />
                <rect x={sx} y={sy} width={4} height={52} rx={2} fill={s.color} />
                <text x={sx + 12} y={sy + 17} fill={s.color} fontSize={12} fontWeight={700}
                  fontFamily="monospace">
                  {s.label}
                </text>
                <text x={sx + 12} y={sy + 30} fill="#64748b" fontSize={8} fontFamily="monospace">
                  {s.api}
                </text>
                {s.produces && (
                  <text x={sx + 12} y={sy + 44} fill="#00d4ff" fontSize={8} fontFamily="monospace">
                    → {s.produces}
                  </text>
                )}
              </g>
            );
          })}

          {/* Transfer arrows */}
          {WORKFLOW_TRANSFERS.map((t, i) => {
            const fromStage = WORKFLOW_STAGES.find(s => s.id === t.from);
            const toStage = WORKFLOW_STAGES.find(s => s.id === t.to);
            if (!fromStage || !toStage) return null;
            const fromX = stageX(fromStage.step) + STAGE_W;
            const fromY = PAD + (fromStage.step - 1) * LH + LH / 2;
            const toX = stageX(toStage.step);
            const toY = PAD + (toStage.step - 1) * LH + LH / 2;
            const isSameLane = fromStage.step !== toStage.step;
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const isH = hovered === t.from || hovered === t.to;

            return (
              <g key={i}>
                {/* Straight horizontal or curved cross-lane */}
                <path
                  d={fromY === toY
                    ? `M${fromX},${fromY} L${toX - 4},${toY}`
                    : `M${fromX},${fromY} C${fromX + 40},${fromY} ${toX - 40},${toY} ${toX - 4},${toY}`}
                  fill="none"
                  stroke={isH ? "#f59e0b" : "#1e4a2a"}
                  strokeWidth={isH ? 2 : 1}
                  markerEnd={isH ? "url(#warr)" : "url(#garr)"}
                />
                {isH && (
                  <>
                    <rect x={midX - 36} y={midY - 22} width={72} height={14} rx={3} fill="#0d1117" />
                    <text x={midX} y={midY - 12} fill="#f59e0b" fontSize={8} textAnchor="middle"
                      fontFamily="monospace">{t.label}</text>
                    <rect x={midX - 60} y={midY - 6} width={120} height={12} rx={2} fill="#0f172a" />
                    <text x={midX} y={midY + 3} fill="#475569" fontSize={7} textAnchor="middle"
                      fontFamily="monospace">{t.via}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* SecEvent separate lane */}
          <g>
            <rect x={0} y={secEvtY} width={W} height={LH} fill="#0a0f1a" />
            <line x1={0} y1={secEvtY} x2={W} y2={secEvtY} stroke="#1e293b" strokeWidth={1} strokeDasharray="6,3" />
            <text x={10} y={secEvtY + 18} fill="#64748b88" fontSize={8} fontFamily="monospace">
              PARALLEL  ·  Security Event Position  (independent trigger)
            </text>
            {[
              { m: "GET", p: "/doc-secevt2-poss", x: 80 },
              { m: "GET", p: "/doc-secevt2-poss/{id}", x: 290 },
              { m: "PATCH", p: "/doc-secevt2-poss/{id}", x: 500 },
            ].map((ep, idx) => (
              <g key={idx}>
                <rect x={ep.x} y={secEvtY + 25} width={180} height={40} rx={5}
                  fill="#0f172a" stroke="#64748b44" />
                <text x={ep.x + 8} y={secEvtY + 42} fill="#22c55e" fontSize={10} fontWeight={700}
                  fontFamily="monospace">{ep.m}</text>
                <text x={ep.x + 8} y={secEvtY + 56} fill="#475569" fontSize={9} fontFamily="monospace">
                  {ep.p}
                </text>
                {idx < 2 && (
                  <path d={`M${ep.x + 180},${secEvtY + 45} L${ep.x + 210},${secEvtY + 45}`}
                    fill="none" stroke="#334155" strokeWidth={1} markerEnd="url(#garr)" />
                )}
              </g>
            ))}
          </g>

          {/* Step counters */}
          {WORKFLOW_STAGES.map((s, i) => (
            <g key={`step_${i}`}>
              <circle cx={stageX(s.step) + 14} cy={PAD + i * LH - 8} r={9} fill={s.color} />
              <text x={stageX(s.step) + 14} y={PAD + i * LH - 4}
                fill="#000" fontSize={10} fontWeight={800} textAnchor="middle" fontFamily="monospace">
                {s.step}
              </text>
            </g>
          ))}

          {/* Title */}
          <text x={W / 2} y={20} fill="#1e293b" fontSize={9} textAnchor="middle"
            fontFamily="monospace" letterSpacing={2}>
            STOCK EXCHANGE TRADING WORKFLOW · hover steps to inspect ID transfers
          </text>
        </svg>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN: ApiWorkflowTab
// ═══════════════════════════════════════════════════════════════

interface ApiWorkflowTabProps {
  loadedSpecs?: ApiSpec[];
}

interface ApiWorkflowTabState {
  view: "graph" | "table" | "workflow";
}

export class ApiWorkflowTab extends React.Component<ApiWorkflowTabProps, ApiWorkflowTabState> {
  state: ApiWorkflowTabState = { view: "graph" };

  render() {
    const { view } = this.state;

    const VIEWS = [
      { id: "graph", icon: "⬡", label: "Dependency Graph" },
      { id: "table", icon: "⊞", label: "Schema Field References" },
      { id: "workflow", icon: "⇢", label: "API Workflow Diagram" },
    ] as const;

    const baseStyle: React.CSSProperties = {
      background: "#0d1117",
      minHeight: "100%",
      padding: "20px 24px",
      fontFamily: "monospace",
      color: "#94a3b8",
    };

    const tabBtn = (id: typeof view): React.CSSProperties => ({
      background: view === id ? "#1e293b" : "transparent",
      border: "none",
      borderBottom: view === id ? "2px solid #00d4ff" : "2px solid transparent",
      color: view === id ? "#e2e8f0" : "#475569",
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.5,
      padding: "10px 18px",
      cursor: "pointer",
      transition: "all 0.15s",
    });

    return (
      <div style={baseStyle}>
        {/* Sub-tab bar */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 24,
          borderBottom: "1px solid #1e293b", paddingBottom: 0,
        }}>
          {VIEWS.map(v => (
            <button key={v.id} style={tabBtn(v.id)}
              onClick={() => this.setState({ view: v.id as typeof view })}>
              <span style={{ marginRight: 6, opacity: 0.7 }}>{v.icon}</span>
              {v.label}
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              background: "#0f172a", border: "1px solid #1e293b",
              color: "#334155", fontSize: 9, fontFamily: "monospace",
              padding: "3px 8px", borderRadius: 4,
            }}>6 schemas · {NODES.length} endpoints · {EDGES.length} dependencies</span>
          </div>
        </div>

        {/* Active view */}
        {view === "graph" && <DependencyGraph />}
        {view === "table" && <SchemaFieldTable />}
        {view === "workflow" && <WorkflowDiagram />}
      </div>
    );
  }
}

export default ApiWorkflowTab;
