import React from "react";
import { useTheme } from "./ThemeContext";
import { ApiSpec, buildDynamicWorkflow, WfNode, WfEdge, WfFieldRow, WfStage, WfTransfer, DynamicWorkflow } from "./utils";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const MONO = "'JetBrains Mono','Fira Code',monospace";

function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════
function EmptyWorkflow({ isDark }: { isDark: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 340, gap: 16, color: "var(--cs-dim)", fontFamily: MONO,
    }}>
      <div style={{ fontSize: 52, opacity: 0.3 }}>⬡</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cs-muted)" }}>No API files loaded</div>
      <div style={{ fontSize: 12, opacity: 0.6, textAlign: "center", maxWidth: 380 }}>
        Load schema files (YAML, JSON, OpenAPI) via the <b>API Files</b> tab.<br />
        The workflow graph, field table and stage diagram will be built automatically
        from the loaded specs and their <code>$ref</code> cross-references.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW 1 — DEPENDENCY GRAPH  (dynamic)
// ═══════════════════════════════════════════════════════════════
interface GraphProps { isDark: boolean; wf: DynamicWorkflow; }
interface GraphState { hovered: string | null; }

class DependencyGraph extends React.Component<GraphProps, GraphState> {
  state: GraphState = { hovered: null };

  private nc(id: string, nodes: WfNode[]) {
    const n = nodes.find(n => n.id === id);
    return n ? { x: n.x + 77, y: n.y + 28 } : null;
  }

  render() {
    const { hovered } = this.state;
    const { isDark, wf } = this.props;
    const { nodes, edges } = wf;

    // Auto-compute canvas size
    const maxX = Math.max(...nodes.map(n => n.x + 160), 800);
    const maxY = Math.max(...nodes.map(n => n.y + 80), 320);
    const W = maxX + 40, H = maxY + 60;

    const bg = "var(--cs-bg)";
    const surface = "var(--cs-surface-2)";
    const gridCol = isDark ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.04)";
    const accent = isDark ? "#00d4ff" : "#0a66c2";
    const dimEdge = isDark ? "rgba(55,143,233,.14)" : "rgba(10,102,194,.10)";
    const nodeBg = "var(--cs-surface)";

    return (
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
            const f = this.nc(e.from, nodes);
            const t = this.nc(e.to, nodes);
            if (!f || !t) return null;
            const isH = hovered === e.from || hovered === e.to;
            const midX = (f.x + t.x) / 2;
            const midY = (f.y + t.y) / 2 - 22;
            return (
              <g key={i}>
                <path
                  d={curvePath(f.x, f.y, t.x - 5, t.y)}
                  fill="none"
                  stroke={isH ? accent : dimEdge}
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
          {nodes.map(n => {
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
                      textAnchor="middle" fontFamily={MONO}>{"\u2192"}{n.produces}</text>
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
// VIEW 2 — SCHEMA FIELD TABLE  (dynamic)
// ═══════════════════════════════════════════════════════════════
interface TableProps { isDark: boolean; wf: DynamicWorkflow; }
interface TableState { filter: string; filterApi: string; }

class SchemaFieldTable extends React.Component<TableProps, TableState> {
  state: TableState = { filter: "", filterApi: "ALL" };

  render() {
    const { filter, filterApi } = this.state;
    const { schemaFields } = this.props.wf;

    // Available API filter pills
    const apis = ["ALL", ...Array.from(new Set(schemaFields.map(r => r.sourceApi)))];

    const rows = schemaFields.filter(r => {
      const txt = filter.toLowerCase();
      return (
        (!txt || r.field.includes(txt) || r.sourceSchema.includes(txt) || r.referencesSchema.includes(txt)) &&
        (filterApi === "ALL" || r.sourceApi === filterApi)
      );
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

    // Deterministic color per API name
    const API_PALETTE = ["#818cf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6", "#60a5fa", "#f59e0b", "#e06c75"];
    const apiColor = (name: string): string =>
      API_PALETTE[Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % API_PALETTE.length];

    const SCHEMA_COLORS: Record<string, string> = {
      "doc_ref": "#00d4ff", "doc_stex": "#34d399", "obj_ref": "#f59e0b",
      "code_tab_ref": "#a78bfa", "code_tab_ref_action": "#f472b6",
    };
    const schemaColor = (name: string): string =>
      SCHEMA_COLORS[name] ?? API_PALETTE[Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % API_PALETTE.length];

    return (
      <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={filter}
            onChange={e => this.setState({ filter: e.target.value })}
            placeholder="🔍  filter field / schema…"
            style={{
              background: "var(--cs-input-bg)", border: "1px solid var(--cs-border)",
              borderRadius: 8, color: "var(--cs-text)", fontFamily: MONO,
              fontSize: 13, padding: "9px 14px", outline: "none", flex: 1, minWidth: 220,
            }}
          />
          {apis.map(api => {
            const active = filterApi === api;
            const col = api === "ALL" ? "var(--cs-accent)" : apiColor(api);
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
                      background: apiColor(r.sourceApi) + "22",
                      color: apiColor(r.sourceApi),
                      border: `1.5px solid ${apiColor(r.sourceApi) + "66"}`,
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
                      background: schemaColor(r.referencesSchema) + "1a",
                      color: schemaColor(r.referencesSchema),
                      border: `1.5px solid ${schemaColor(r.referencesSchema) + "55"}`,
                      borderRadius: 5, padding: "3px 9px", fontSize: 11, fontFamily: MONO,
                    }}>{"\u2192"} {r.referencesSchema}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ ...TD, color: "var(--cs-dim)", textAlign: "center", padding: 32 }}>
                  {schemaFields.length === 0
                    ? "No schema cross-references found. Load files with $ref fields to populate this table."
                    : "No fields match this filter"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, color: "var(--cs-dim)", fontSize: 12, fontFamily: MONO }}>
          {rows.length} of {schemaFields.length} field references shown
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// VIEW 3 — WORKFLOW DIAGRAM (swimlane, dynamic)
// ═══════════════════════════════════════════════════════════════
interface WFProps { isDark: boolean; wf: DynamicWorkflow; }
interface WFState { hovered: string | null; }

class WorkflowDiagram extends React.Component<WFProps, WFState> {
  state: WFState = { hovered: null };

  render() {
    const { hovered } = this.state;
    const { isDark, wf } = this.props;
    const { stages, transfers } = wf;

    const W = Math.max(1000, stages.length * 200 + 80);
    const LH = 100;
    const PAD = 46;
    const SW = 165;
    const H = stages.length * LH + PAD * 2 + 40;

    const sx = (step: number) =>
      PAD + (step - 1) * ((W - PAD * 2 - SW) / Math.max(stages.length - 1, 1));

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
          {stages.map((s, i) => (
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
          {stages.map((s, i) => {
            const bx = sx(s.step);
            const by = PAD + i * LH + (LH - 60) / 2;
            const midY = PAD + i * LH + LH / 2;
            const isH = hovered === s.id;
            return (
              <g key={s.id}
                onMouseEnter={() => this.setState({ hovered: s.id })}
                onMouseLeave={() => this.setState({ hovered: null })}
                style={{ cursor: "pointer" }}
              >
                <line x1={0} y1={midY} x2={bx} y2={midY} stroke={gridCol} strokeWidth={1} strokeDasharray="3,6" />
                <line x1={bx + SW} y1={midY} x2={W} y2={midY} stroke={gridCol} strokeWidth={1} strokeDasharray="3,6" />
                <rect x={bx} y={by} width={SW} height={60} rx={9}
                  fill={isH ? s.color + "18" : nodeBox}
                  stroke={s.color} strokeWidth={isH ? 2.5 : 1.5} />
                <rect x={bx} y={by} width={5} height={60} rx={3} fill={s.color} />
                <text x={bx + 14} y={by + 22} fill={s.color} fontSize={15} fontWeight={700} fontFamily={MONO}>{s.label}</text>
                <text x={bx + 14} y={by + 38} fill="var(--cs-muted)" fontSize={11} fontFamily={MONO}>{s.api}</text>
                {s.produces && (
                  <text x={bx + 14} y={by + 53} fill={infoCol} fontSize={11} fontFamily={MONO}>{"\u2192"} {s.produces}</text>
                )}
              </g>
            );
          })}

          {/* Transfer arrows */}
          {transfers.map((t, i) => {
            const fS = stages.find(s => s.id === t.from);
            const tS = stages.find(s => s.id === t.to);
            if (!fS || !tS) return null;
            const fx = sx(fS.step) + SW;
            const fy = PAD + (fS.step - 1) * LH + LH / 2;
            const tx = sx(tS.step);
            const ty = PAD + (tS.step - 1) * LH + LH / 2;
            const mx = (fx + tx) / 2;
            const my = (fy + ty) / 2;
            const isH = hovered === t.from || hovered === t.to;
            return (
              <g key={i}>
                <path
                  d={fy === ty
                    ? `M${fx},${fy} L${tx - 5},${ty}`
                    : `M${fx},${fy} C${fx + 44},${fy} ${tx - 44},${ty} ${tx - 5},${ty}`}
                  fill="none"
                  stroke={isH ? accent : dimEdge}
                  strokeWidth={isH ? 2.5 : 1.2}
                  markerEnd={isH ? "url(#wfw-arr)" : "url(#wfw-arr-dim)"}
                />
                {isH && (
                  <>
                    <rect x={mx - 52} y={my - 26} width={104} height={18} rx={5}
                      fill="var(--cs-surface-2)" stroke="var(--cs-border)" />
                    <text x={mx} y={my - 13} fill={accent} fontSize={12} textAnchor="middle"
                      fontFamily={MONO} fontWeight={700}>{t.label}</text>
                    <rect x={mx - 80} y={my - 4} width={160} height={15} rx={4}
                      fill="var(--cs-surface)" stroke="var(--cs-border-sub)" />
                    <text x={mx} y={my + 6} fill="var(--cs-muted)" fontSize={10}
                      textAnchor="middle" fontFamily={MONO}>{t.via}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Step badges */}
          {stages.map((s, i) => (
            <g key={`step${i}`}>
              <circle cx={sx(s.step) + 14} cy={PAD + i * LH - 9} r={12} fill={s.color} />
              <text x={sx(s.step) + 14} y={PAD + i * LH - 4} fill="#000" fontSize={13}
                fontWeight={800} textAnchor="middle" fontFamily={MONO}>{s.step}</text>
            </g>
          ))}

          {/* Title */}
          <text x={W / 2} y={24} fill="var(--cs-dim)" fontSize={12} textAnchor="middle"
            fontFamily={MONO} letterSpacing={2} opacity={0.5}>
            {stages.length > 0
              ? `${stages.length.toString().toUpperCase()}-STAGE WORKFLOW  ·  hover steps to inspect ID transfers`
              : "No workflow stages detected"}
          </text>
        </svg>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// ROOT — ApiWorkflowTab
// Builds ALL visualization data dynamically from loadedSpecs.
// Falls back to EmptyWorkflow when no specs are loaded.
// ═══════════════════════════════════════════════════════════════
interface ApiWorkflowTabProps { loadedSpecs?: ApiSpec[]; }

export function ApiWorkflowTab({ loadedSpecs = [] }: ApiWorkflowTabProps) {
  const { isDark } = useTheme();
  const [view, setView] = React.useState<"graph" | "table" | "workflow">("graph");

  // Re-derive workflow data whenever the specs list changes
  const wf = React.useMemo(() => buildDynamicWorkflow(loadedSpecs), [loadedSpecs]);

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

        {/* Live stats badge */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingBottom: 6 }}>
          <span style={{
            background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
            color: "var(--cs-dim)", fontSize: 11, fontFamily: MONO,
            padding: "5px 11px", borderRadius: 6,
          }}>
            {wf.isEmpty
              ? "no specs loaded"
              : `${loadedSpecs.length} spec${loadedSpecs.length !== 1 ? "s" : ""} · ${wf.nodes.length} endpoints · ${wf.edges.length} deps · ${wf.schemaFields.length} fields`}
          </span>
        </div>
      </div>

      {/* Content: empty state or views */}
      {wf.isEmpty
        ? <EmptyWorkflow isDark={isDark} />
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
