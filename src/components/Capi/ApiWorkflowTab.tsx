import React from "react";
import { useTheme } from "./ThemeContext";
import {
  ApiSpec, buildDynamicWorkflow, rest, SYNTH,
  rndInt, rndFloat, rndPick, isoDate,
  testStore, TestCase, envStore, Environment, EnvTag,
  WfNode, WfEdge, WfFieldRow, WfStage, WfTransfer, DynamicWorkflow,
} from "./utils";
import { StatusBadge, ResultRow } from "./AtomComponents";
import { EnvBar } from "./ReadyForTestTab";

// Local re-exports of classification types (also exported from utils)
// These are re-declared locally to avoid import chain issues

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
// SEARCHABLE MULTI-SELECT API DROPDOWN
// ─────────────────────────────────────────────────────────────
interface ApiDropdownProps {
  apis: string[];
  selected: string[];           // empty = ALL selected
  onChange: (v: string[]) => void;
  isDark: boolean;
  apiColor: (name: string) => string;
}

function Checkbox({ checked, indeterminate, color }: { checked: boolean; indeterminate?: boolean; color: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const bg = checked || indeterminate ? color : "transparent";
  return (
    <div ref={ref} style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
      border: `2px solid ${checked || indeterminate ? color : "var(--cs-border)"}`,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all .1s",
    }}>
      {indeterminate && !checked && (
        <div style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }} />
      )}
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function ApiDropdown({ apis, selected, onChange, isDark, apiColor }: ApiDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  const isAll = selected.length === 0;
  const isNone = selected.length === 0;
  const allChecked = isAll;
  const someChecked = !isAll && selected.length < apis.length;

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = search ? apis.filter(a => a.toLowerCase().includes(search.toLowerCase())) : apis;

  const toggle = (api: string) => {
    if (selected.includes(api)) {
      const next = selected.filter(x => x !== api);
      onChange(next.length === apis.length ? [] : next);
    } else {
      const next = [...selected, api];
      onChange(next.length === apis.length ? [] : next);
    }
  };

  const toggleAll = () => {
    if (isAll) {
      // all → deselect all (show none — shouldn't happen, so instead select none means "all")
      // Do nothing or reset to all
    } else {
      onChange([]); // back to all
    }
  };

  const toggleFiltered = () => {
    // Select only filtered subset
    const allFilteredSelected = filtered.every(a => selected.includes(a) || isAll);
    if (allFilteredSelected && !isAll) {
      // deselect all filtered
      const next = selected.filter(x => !filtered.includes(x));
      onChange(next.length === 0 || next.length === apis.length ? [] : next);
    } else {
      // select all filtered (merge)
      const merged = [...new Set([...selected, ...filtered])];
      onChange(merged.length === apis.length ? [] : merged);
    }
  };

  // Trigger label
  let triggerLabel: React.ReactNode;
  let triggerColor = "var(--cs-accent)";
  if (isAll) {
    triggerLabel = <span>⊞&nbsp;&nbsp;All APIs <span style={{ opacity: 0.5, fontWeight: 400 }}>({apis.length})</span></span>;
  } else if (selected.length === 1) {
    triggerColor = apiColor(selected[0]);
    triggerLabel = (
      <>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: triggerColor, flexShrink: 0, display: "inline-block" }} />
        &nbsp;{selected[0]}
      </>
    );
  } else {
    triggerLabel = (
      <span>
        <span style={{
          background: "var(--cs-accent)", color: "#000", borderRadius: 5,
          padding: "1px 7px", fontSize: 11, fontWeight: 800, marginRight: 6,
        }}>{selected.length}</span>
        APIs selected
      </span>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--cs-surface-2)",
          border: `1.5px solid ${isAll ? "var(--cs-border)" : triggerColor + "88"}`,
          borderRadius: 8, color: "var(--cs-text)",
          fontFamily: MONO, fontSize: 13, fontWeight: 600,
          padding: "9px 14px", cursor: "pointer", minWidth: 240,
          transition: "border-color .15s",
        }}
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {triggerLabel}
        </span>
        <span style={{ opacity: 0.45, fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 300,
          width: 380, maxWidth: "92vw",
          background: "var(--cs-surface)", border: "1px solid var(--cs-border)",
          borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.42)",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>

          {/* Search bar */}
          <div style={{ padding: 10, borderBottom: "1px solid var(--cs-border-sub)", flexShrink: 0 }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search API name…"
              style={{
                width: "100%", background: "var(--cs-input-bg)",
                border: "1px solid var(--cs-border)", borderRadius: 7,
                color: "var(--cs-text)", fontFamily: MONO, fontSize: 12,
                padding: "8px 12px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Select-all row */}
          <div
            onClick={() => { if (isAll) { /* already all, do nothing */ } else onChange([]); }}
            style={{
              padding: "10px 14px", cursor: "pointer", fontFamily: MONO, fontSize: 12,
              borderBottom: "1px solid var(--cs-border-sub)",
              display: "flex", alignItems: "center", gap: 10,
              background: isAll ? "var(--cs-accent)0d" : "transparent",
              transition: "background .1s",
            }}
            onMouseEnter={e => { if (!isAll) (e.currentTarget as HTMLDivElement).style.background = "var(--cs-surface-2)"; }}
            onMouseLeave={e => { if (!isAll) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <Checkbox checked={isAll} indeterminate={someChecked} color="var(--cs-accent)" />
            <span style={{ color: isAll ? "var(--cs-accent)" : "var(--cs-text)", fontWeight: isAll ? 700 : 500 }}>
              All APIs
            </span>
            <span style={{ marginLeft: "auto", color: "var(--cs-dim)", fontSize: 11 }}>
              {apis.length} total
            </span>
          </div>

          {/* "Select visible" shortcut when search is active */}
          {search && filtered.length > 0 && (
            <div
              onClick={toggleFiltered}
              style={{
                padding: "7px 14px", cursor: "pointer", fontFamily: MONO, fontSize: 11,
                borderBottom: "1px solid var(--cs-border-sub)",
                color: "var(--cs-accent)", background: "var(--cs-accent)08",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span>⊞</span>
              <span>Select all matching "{search}" ({filtered.length})</span>
            </div>
          )}

          {/* API list */}
          <div style={{ maxHeight: 310, overflowY: "auto" }}>
            {filtered.map(api => {
              const c = apiColor(api);
              const active = isAll || selected.includes(api);
              return (
                <div
                  key={api}
                  onClick={() => toggle(api)}
                  style={{
                    padding: "8px 14px", cursor: "pointer", fontFamily: MONO, fontSize: 12,
                    display: "flex", alignItems: "center", gap: 10,
                    background: active && !isAll ? c + "10" : "transparent",
                    borderLeft: active && !isAll ? `3px solid ${c}` : "3px solid transparent",
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = active && !isAll ? c + "1a" : "var(--cs-surface-2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = active && !isAll ? c + "10" : "transparent"; }}
                >
                  <Checkbox checked={active} color={c} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                  <span style={{
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    color: active && !isAll ? c : "var(--cs-text)",
                    fontWeight: active && !isAll ? 600 : 400,
                  }}>{api}</span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: 20, color: "var(--cs-dim)", textAlign: "center", fontFamily: MONO, fontSize: 12 }}>
                No APIs match "{search}"
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 14px", borderTop: "1px solid var(--cs-border-sub)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0,
          }}>
            <span style={{ color: "var(--cs-dim)", fontSize: 11, fontFamily: MONO }}>
              {isAll ? `All ${apis.length} APIs shown` : `${selected.length} of ${apis.length} selected`}
            </span>
            {!isAll && (
              <button
                onClick={() => onChange([])}
                style={{
                  background: "transparent", border: "1px solid var(--cs-border)",
                  color: "var(--cs-muted)", borderRadius: 5, padding: "3px 10px",
                  fontFamily: MONO, fontSize: 11, cursor: "pointer",
                }}
              >Reset to All</button>
            )}
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
// FIELD CLASSIFICATION  —  Direction + Kind badges with hints
// ─────────────────────────────────────────────────────────────

// Import types (they come from utils via WfFieldRow, but we define local meta here)
type FieldDirection = "OUT" | "IN" | "IN_OUT" | "PARAM";
type FieldKind = "REF" | "ARR_REF" | "ARR_VAL" | "VAL" | "OBJ";

const DIR_META: Record<FieldDirection, {
  label: string; color: string; bg: string; border: string;
  title: string; detail: string; example: string;
}> = {
  OUT: {
    label: "OUT", color: "#f87171", bg: "#f8717118", border: "#f8717166",
    title: "Output — Server-generated, never send this in requests",
    detail: "Marked readOnly in OpenAPI. The server computes or resolves this field. Sending it in a POST/PATCH body will be ignored or rejected.",
    example: "e.g. grossAmount, agingId, bankBp, outpayDoc",
  },
  IN: {
    label: "IN", color: "#34d399", bg: "#34d39918", border: "#34d39966",
    title: "Input — Client-only, never returned in responses",
    detail: "Marked writeOnly in OpenAPI. You send this to trigger behaviour (actions, passwords). It will never appear in a GET response.",
    example: "e.g. action (PATCH trigger), password, confirmPin",
  },
  IN_OUT: {
    label: "IN·OUT", color: "#60a5fa", bg: "#60a5fa18", border: "#60a5fa66",
    title: "Bidirectional — You set it, server echoes it back",
    detail: "No readOnly/writeOnly marker. This is a normal settable field. Include it in POST/PATCH bodies to set a value, and it will appear in GET responses.",
    example: "e.g. invcDate, advNr, extlRefNr, intlRefNr",
  },
  PARAM: {
    label: "PARAM", color: "#f59e0b", bg: "#f59e0b18", border: "#f59e0b66",
    title: "Path Parameter — URL routing key",
    detail: "Appears in the URL path as {paramName}. Used to identify a specific resource. Never goes in the request body.",
    example: "e.g. doc_accpay_id in GET /doc-accpays/{doc_accpay_id}",
  },
};

const KIND_META: Record<FieldKind, {
  label: string; color: string; bg: string; border: string;
  title: string; detail: string; example: string;
}> = {
  REF: {
    label: "REF", color: "#a78bfa", bg: "#a78bfa18", border: "#a78bfa66",
    title: "Object Reference — $ref link to another schema",
    detail: "This field holds a reference to a complex object from another schema. It is a foreign key / object link. It drives the dependency graph edges.",
    example: "e.g. benefBp → doc_bp, bank → doc_bank_account",
  },
  ARR_REF: {
    label: "ARR[]", color: "#c084fc", bg: "#c084fc18", border: "#c084fc66",
    title: "Array Reference — collection of $ref objects",
    detail: "An array of references to another schema. Represents one-to-many relationships. Each element is a linked object.",
    example: "e.g. workItemList → DocTabWorkItem[], addList → doc_add[]",
  },
  ARR_VAL: {
    label: "ARR", color: "#fb923c", bg: "#fb923c18", border: "#fb923c66",
    title: "Array of Scalars — list of plain values",
    detail: "An array of primitive values (strings, integers). No cross-schema reference involved.",
    example: "e.g. tags[], allowedValues[], errorCodes[]",
  },
  VAL: {
    label: "VAL", color: "#94a3b8", bg: "#94a3b818", border: "#94a3b866",
    title: "Scalar Value — plain data field",
    detail: "A simple primitive: string, integer, number, or boolean. No foreign key, no schema link.",
    example: "e.g. invcDate (string), advNr (integer), grossAmount (number)",
  },
  OBJ: {
    label: "OBJ", color: "#64748b", bg: "#64748b18", border: "#64748b66",
    title: "Inline Object — nested structure without $ref",
    detail: "A nested object defined inline, without a named $ref. Often used for freeform extension blocks.",
    example: "e.g. extn (extension object), metadata",
  },
};

// Tooltip-enhanced badge component
function FieldBadge({ meta, small }: {
  meta: { label: string; color: string; bg: string; border: string; title: string; detail: string; example: string };
  small?: boolean;
}) {
  const [hover, setHover] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const showTip = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
    setHover(true);
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={showTip}
        onMouseLeave={() => setHover(false)}
        style={{
          background: meta.bg,
          border: `1.5px solid ${meta.border}`,
          color: meta.color,
          borderRadius: 5,
          padding: small ? "1px 6px" : "2px 8px",
          fontSize: small ? 9 : 10,
          fontFamily: MONO, fontWeight: 800,
          letterSpacing: 0.5, whiteSpace: "nowrap",
          cursor: "help", userSelect: "none",
        }}
      >
        {meta.label}
      </span>

      {hover && pos && (
        <div style={{
          position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
          width: 320, background: "var(--cs-surface)",
          border: `1.5px solid ${meta.border}`,
          borderRadius: 10, padding: "12px 16px",
          boxShadow: `0 8px 32px rgba(0,0,0,.45), 0 0 0 1px ${meta.border}`,
          pointerEvents: "none",
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 12, fontWeight: 800,
            color: meta.color, marginBottom: 6,
          }}>
            <span style={{
              background: meta.bg, border: `1.5px solid ${meta.border}`,
              borderRadius: 5, padding: "2px 8px", marginRight: 8,
            }}>{meta.label}</span>
            {meta.title}
          </div>
          <div style={{
            fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)",
            lineHeight: 1.6, marginBottom: 8,
          }}>
            {meta.detail}
          </div>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
            background: "var(--cs-surface-2)", borderRadius: 5,
            padding: "5px 9px", fontStyle: "italic",
          }}>
            {meta.example}
          </div>
        </div>
      )}
    </>
  );
}

// Combined direction + kind cell
function ClassificationCell({ direction, kind, required }: {
  direction: FieldDirection; kind: FieldKind; required: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
      <FieldBadge meta={DIR_META[direction]} />
      <FieldBadge meta={KIND_META[kind]} />
      {required && (
        <span title="Required field — must be provided in request body" style={{
          color: "#f87171", fontSize: 13, fontWeight: 900, lineHeight: 1,
          cursor: "help",
        }}>*</span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 2 — SCHEMA FIELD TABLE  (with dropdown + pagination)
// ─────────────────────────────────────────────────────────────
const TABLE_PAGE_SIZE = 50;

type DirFilter = "ALL" | "OUT" | "IN" | "IN_OUT" | "PARAM";
type KindFilter = "ALL" | "REF" | "ARR_REF" | "ARR_VAL" | "VAL" | "OBJ";

interface TableProps { isDark: boolean; wf: DynamicWorkflow; }
interface TableState {
  filter: string; filterApis: string[];
  dirFilter: DirFilter; kindFilter: KindFilter;
  page: number;
}

const API_PALETTE = ["#818cf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6", "#60a5fa", "#f59e0b", "#e06c75", "#56b6c2", "#d19a66"];
const apiColor = (name: string): string =>
  API_PALETTE[Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % API_PALETTE.length];

const schemaColor = (name: string): string =>
  API_PALETTE[Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % API_PALETTE.length];

class SchemaFieldTable extends React.Component<TableProps, TableState> {
  state: TableState = { filter: "", filterApis: [], dirFilter: "ALL", kindFilter: "ALL", page: 0 };

  render() {
    const { filter, filterApis, dirFilter, kindFilter, page } = this.state;
    const { schemaFields } = this.props.wf;
    const isAll = filterApis.length === 0;

    const apis = [...new Set(schemaFields.map(r => r.sourceApi))].sort();

    const allRows = schemaFields.filter(r => {
      const txt = filter.toLowerCase();
      return (
        (!txt || r.field.toLowerCase().includes(txt)
          || r.sourceSchema.toLowerCase().includes(txt)
          || r.referencesSchema.toLowerCase().includes(txt)
          || r.description?.toLowerCase().includes(txt)) &&
        (isAll || filterApis.includes(r.sourceApi)) &&
        (dirFilter === "ALL" || r.direction === dirFilter) &&
        (kindFilter === "ALL" || r.kind === kindFilter)
      );
    });

    // Counts for filter tabs
    const dirCounts: Record<string, number> = {};
    const kindCounts: Record<string, number> = {};
    schemaFields.forEach(r => {
      dirCounts[r.direction] = (dirCounts[r.direction] || 0) + 1;
      kindCounts[r.kind] = (kindCounts[r.kind] || 0) + 1;
    });

    const totalPages = Math.ceil(allRows.length / TABLE_PAGE_SIZE);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    const rows = allRows.slice(safePage * TABLE_PAGE_SIZE, (safePage + 1) * TABLE_PAGE_SIZE);

    const TH: React.CSSProperties = {
      padding: "10px 14px", background: "var(--cs-surface-2)",
      color: "var(--cs-muted)", fontSize: 11, fontFamily: MONO,
      textTransform: "uppercase", letterSpacing: 1,
      borderBottom: "2px solid var(--cs-border)", textAlign: "left",
      whiteSpace: "nowrap",
    };
    const TD: React.CSSProperties = {
      padding: "7px 12px", borderBottom: "1px solid var(--cs-border-sub)",
      fontSize: 12, fontFamily: MONO, verticalAlign: "middle",
    };

    // Quick filter tab renderer
    const FilterTab = ({ val, label, count, meta }: {
      val: string; label: string; count: number;
      meta?: { color: string; bg: string; border: string; title: string };
    }) => {
      const isActive = (dirFilter === val || kindFilter === val);
      return (
        <button
          title={meta?.title}
          onClick={() => {
            // Determine which axis this belongs to
            if (["ALL", "OUT", "IN", "IN_OUT", "PARAM"].includes(val)) {
              this.setState({ dirFilter: val as DirFilter, page: 0 });
            } else {
              this.setState({ kindFilter: val as KindFilter, page: 0 });
            }
          }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: isActive ? (meta?.bg ?? "var(--cs-accent)18") : "var(--cs-surface-2)",
            border: `1.5px solid ${isActive ? (meta?.border ?? "var(--cs-accent)") : "var(--cs-border)"}`,
            color: isActive ? (meta?.color ?? "var(--cs-accent)") : "var(--cs-muted)",
            borderRadius: 7, padding: "5px 11px", cursor: "pointer",
            fontFamily: MONO, fontSize: 11, fontWeight: isActive ? 700 : 400,
            transition: "all .12s",
          }}
        >
          {label}
          <span style={{
            background: isActive ? (meta?.border ?? "var(--cs-accent)") : "var(--cs-border)",
            color: "#fff", borderRadius: 10, padding: "0px 5px",
            fontSize: 9, fontWeight: 800,
          }}>{count}</span>
        </button>
      );
    };

    return (
      <div>
        {/* ── LEGEND PANEL ── */}
        <div style={{
          marginBottom: 16, padding: "12px 16px",
          background: "var(--cs-surface)", border: "1px solid var(--cs-border)",
          borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 18,
        }}>
          {/* Direction legend */}
          <div>
            <div style={{
              color: "var(--cs-dim)", fontSize: 10, fontFamily: MONO, fontWeight: 700,
              letterSpacing: 1, marginBottom: 6, textTransform: "uppercase"
            }}>Direction</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(Object.keys(DIR_META) as FieldDirection[]).map(d => (
                <FieldBadge key={d} meta={DIR_META[d]} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: "var(--cs-border)", alignSelf: "stretch" }} />
          {/* Kind legend */}
          <div>
            <div style={{
              color: "var(--cs-dim)", fontSize: 10, fontFamily: MONO, fontWeight: 700,
              letterSpacing: 1, marginBottom: 6, textTransform: "uppercase"
            }}>Kind</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(Object.keys(KIND_META) as FieldKind[]).map(k => (
                <FieldBadge key={k} meta={KIND_META[k]} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: "var(--cs-border)", alignSelf: "stretch" }} />
          {/* Required hint */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "var(--cs-dim)", fontFamily: MONO, fontSize: 11
          }}>
            <span style={{ color: "#f87171", fontSize: 14, fontWeight: 900 }}>*</span>
            Required field
          </div>
        </div>

        {/* ── DIRECTION filter row ── */}
        <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{
            color: "var(--cs-dim)", fontSize: 10, fontFamily: MONO,
            fontWeight: 700, letterSpacing: 1, marginRight: 4, textTransform: "uppercase"
          }}>
            Direction:
          </span>
          <FilterTab val="ALL" label="⊞ All" count={schemaFields.length} />
          {(Object.keys(DIR_META) as FieldDirection[]).map(d => (
            <FilterTab key={d} val={d} label={DIR_META[d].label}
              count={dirCounts[d] || 0} meta={DIR_META[d]} />
          ))}
        </div>

        {/* ── KIND filter row ── */}
        <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{
            color: "var(--cs-dim)", fontSize: 10, fontFamily: MONO,
            fontWeight: 700, letterSpacing: 1, marginRight: 4, textTransform: "uppercase"
          }}>
            Kind:
          </span>
          <button
            onClick={() => this.setState({ kindFilter: "ALL", page: 0 })}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: kindFilter === "ALL" ? "var(--cs-accent)18" : "var(--cs-surface-2)",
              border: `1.5px solid ${kindFilter === "ALL" ? "var(--cs-accent)" : "var(--cs-border)"}`,
              color: kindFilter === "ALL" ? "var(--cs-accent)" : "var(--cs-muted)",
              borderRadius: 7, padding: "5px 11px", cursor: "pointer",
              fontFamily: MONO, fontSize: 11, fontWeight: kindFilter === "ALL" ? 700 : 400,
            }}
          >
            ⊞ All
            <span style={{ background: "var(--cs-border)", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 9, fontWeight: 800 }}>
              {schemaFields.length}
            </span>
          </button>
          {(Object.keys(KIND_META) as FieldKind[]).map(k => (
            <FilterTab key={k} val={k} label={KIND_META[k].label}
              count={kindCounts[k] || 0} meta={KIND_META[k]} />
          ))}
        </div>

        {/* ── Search + API dropdown ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={filter}
            onChange={e => this.setState({ filter: e.target.value, page: 0 })}
            placeholder="🔍  filter field / schema / description…"
            style={{
              flex: 1, minWidth: 200, background: "var(--cs-input-bg)",
              border: "1px solid var(--cs-border)", borderRadius: 8,
              color: "var(--cs-text)", fontFamily: MONO, fontSize: 13,
              padding: "9px 14px", outline: "none",
            }}
          />
          <ApiDropdown
            apis={apis}
            selected={filterApis}
            onChange={v => this.setState({ filterApis: v, page: 0 })}
            isDark={this.props.isDark}
            apiColor={apiColor}
          />
          {(!isAll || dirFilter !== "ALL" || kindFilter !== "ALL") && (
            <button
              onClick={() => this.setState({ filterApis: [], dirFilter: "ALL", kindFilter: "ALL", page: 0 })}
              style={{
                background: "transparent", border: "1px solid var(--cs-border)",
                color: "var(--cs-dim)", borderRadius: 6, padding: "6px 12px",
                fontFamily: MONO, fontSize: 12, cursor: "pointer",
              }}
            >✕ Reset all</button>
          )}
        </div>

        {/* ── Active API filter chips ── */}
        {!isAll && (
          <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {filterApis.map(api => (
              <span key={api} onClick={() => this.setState({ filterApis: filterApis.filter(x => x !== api), page: 0 })}
                title="Click to remove"
                style={{
                  background: apiColor(api) + "18", border: `1px solid ${apiColor(api)}44`,
                  color: apiColor(api), borderRadius: 6, padding: "4px 10px",
                  fontFamily: MONO, fontSize: 11, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: apiColor(api) }} />
                {api}
                <span style={{ opacity: 0.5, fontSize: 10 }}>✕</span>
              </span>
            ))}
            <span style={{ color: "var(--cs-dim)", fontSize: 11, fontFamily: MONO, alignSelf: "center" }}>
              — {allRows.length} fields
            </span>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--cs-border)", boxShadow: "var(--cs-shadow-md)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--cs-bg)" }}>
            <thead>
              <tr>
                <th style={TH}>Classification</th>
                <th style={TH}>Source API</th>
                <th style={TH}>Schema</th>
                <th style={TH}>Field</th>
                <th style={TH}>Raw Type</th>
                <th style={TH}>References</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "var(--cs-bg)" : "var(--cs-surface)" }}>
                  <td style={{ ...TD, whiteSpace: "nowrap" }}>
                    <ClassificationCell
                      direction={r.direction ?? "IN_OUT"}
                      kind={r.kind ?? "VAL"}
                      required={r.required ?? false}
                    />
                  </td>
                  <td style={TD}>
                    <span style={{
                      background: apiColor(r.sourceApi) + "22", color: apiColor(r.sourceApi),
                      border: `1.5px solid ${apiColor(r.sourceApi)}66`,
                      borderRadius: 5, padding: "3px 9px", fontSize: 11, fontFamily: MONO, whiteSpace: "nowrap",
                    }}>{r.sourceApi}</span>
                  </td>
                  <td style={{ ...TD, color: "var(--cs-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.sourceSchema}
                  </td>
                  <td style={{ ...TD, fontWeight: 600, color: "var(--cs-text)" }}>
                    {r.field}
                    {r.description && (
                      <span title={r.description} style={{
                        marginLeft: 6, color: "var(--cs-dim)", fontSize: 10,
                        cursor: "help", opacity: 0.6,
                      }}>ⓘ</span>
                    )}
                  </td>
                  <td style={TD}>
                    <span style={{ color: r.isArray ? "#fb923c" : "var(--cs-dim)", fontFamily: MONO }}>
                      {r.fieldType || "—"}
                    </span>
                  </td>
                  <td style={TD}>
                    {r.referencesSchema ? (
                      <span style={{
                        background: schemaColor(r.referencesSchema) + "1a",
                        color: schemaColor(r.referencesSchema),
                        border: `1.5px solid ${schemaColor(r.referencesSchema)}55`,
                        borderRadius: 5, padding: "3px 9px", fontSize: 11, fontFamily: MONO,
                      }}>→ {r.referencesSchema}</span>
                    ) : (
                      <span style={{ color: "var(--cs-dim)", opacity: 0.35 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ ...TD, color: "var(--cs-dim)", textAlign: "center", padding: 32 }}>
                  No fields match the current filters.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ color: "var(--cs-dim)", fontSize: 12, fontFamily: MONO }}>
            {rows.length > 0
              ? `Showing ${safePage * TABLE_PAGE_SIZE + 1}–${Math.min((safePage + 1) * TABLE_PAGE_SIZE, allRows.length)} of ${allRows.length} fields`
              : "0 fields"}
          </span>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button disabled={safePage === 0} onClick={() => this.setState({ page: safePage - 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePage === 0 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "5px 12px", cursor: safePage === 0 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12
                }}>◀</button>
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => Math.abs(i - safePage) < 4 || i === 0 || i === totalPages - 1)
                .reduce<(number | "…")[]>((acc, i, idx, arr) => {
                  if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(i); return acc;
                }, [])
                .map((item, idx) =>
                  item === "…"
                    ? <span key={`e${idx}`} style={{ color: "var(--cs-dim)", padding: "0 4px" }}>…</span>
                    : <button key={item} onClick={() => this.setState({ page: item as number })}
                      style={{
                        width: 30, height: 28, borderRadius: 6, padding: 0,
                        background: item === safePage ? "var(--cs-accent)" : "var(--cs-surface-2)",
                        border: `1px solid ${item === safePage ? "var(--cs-accent)" : "var(--cs-border)"}`,
                        color: item === safePage ? "#000" : "var(--cs-muted)",
                        fontFamily: MONO, fontSize: 11, fontWeight: item === safePage ? 700 : 400,
                        cursor: "pointer"
                      }}>{(item as number) + 1}</button>
                )}
              <button disabled={safePage >= totalPages - 1} onClick={() => this.setState({ page: safePage + 1 })}
                style={{
                  background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
                  color: safePage >= totalPages - 1 ? "var(--cs-dim)" : "var(--cs-text)",
                  borderRadius: 6, padding: "5px 12px", cursor: safePage >= totalPages - 1 ? "default" : "pointer",
                  fontFamily: MONO, fontSize: 12
                }}>▶</button>
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
// DATA GENERATOR TAB
// Inline DSG: field detection, synth data, execution plan + runner
// ─────────────────────────────────────────────────────────────

// ── Method colours ──
const DG_METHOD_COLORS: Record<string, string> = {
  POST: "#34d399", GET: "#60a5fa", PATCH: "#fb923c",
  PUT: "#f59e0b", DELETE: "#f87171", RPC: "#a78bfa",
};
const DG_METHOD_ORDER: Record<string, number> = {
  POST: 0, GET: 1, PATCH: 2, PUT: 3, DELETE: 4,
};

// ── Synth value engine ──
function dgSynthValue(name: string, type: string): any {
  const n = name.toLowerCase();
  const t = type.toLowerCase().replace(/\[\]$/, "");
  if (n.includes("eladdr") || n.includes("email")) return SYNTH.email(SYNTH.firstName(), SYNTH.lastName());
  if (n === "firstname") return SYNTH.firstName();
  if (n === "name" || n === "lastname") return SYNTH.lastName();
  if (n === "firm" || n.includes("company")) return SYNTH.firm();
  if (n.includes("street") && !n.includes("nr")) return SYNTH.street();
  if (n === "streetnr" || n === "housenr") return String(rndInt(1, 200));
  if (n === "zip" || n.includes("postal")) return String(rndInt(1000, 9999));
  if (n === "city") return SYNTH.city();
  if (n.includes("iban")) return SYNTH.iban();
  if (n.includes("bic") || n.includes("swift")) return SYNTH.bic();
  if (n.includes("phone") || n.includes("tel")) return SYNTH.phone();
  if (n === "currency" || n === "ccy") return SYNTH.currency();
  if (n.includes("amount") || n.includes("amt")) return rndFloat(1000, 1000000, 2);
  if (n.includes("rate") || n.includes("yield")) return rndFloat(0.1, 8.5, 3);
  if (n.includes("isin")) return SYNTH.isin();
  if (n.includes("portfolio")) return SYNTH.portfolio();
  if (n.includes("date")) return isoDate(0);
  if (n.includes("maturity")) return isoDate(rndInt(30, 1825));
  if (n === "country" || n.includes("country")) return SYNTH.country();
  if (n.includes("addrtype")) return SYNTH.addrType();
  if (n.includes("addrkind")) return SYNTH.addrKind();
  if (n.includes("riskclass")) return SYNTH.riskClass();
  if (n.includes("assetclass")) return SYNTH.assetClass();
  if (n.includes("txtype")) return SYNTH.txType();
  if (n === "description" || n === "note") return `Test ${name} ${rndInt(100, 999)}`;
  if (n === "id" || n.endsWith("id")) return null;
  if (t === "integer" || t === "number") return rndInt(1, 9999);
  if (t === "boolean") return true;
  if (t === "string") return `${name}-${rndInt(100, 999)}`;
  if (t === "object") return { id: rndInt(1, 100) };
  return null;
}

function dgBuildBody(spec: ApiSpec, ctx: Record<string, number>, all: ApiSpec[]): Record<string, any> {
  const pathPs = new Set(spec.pathParams || []);
  const body: Record<string, any> = {};
  for (const f of spec.fields) {
    if (f.readOnly) continue;
    if (pathPs.has(f.name) || f.isParam) continue;
    const base = f.type.replace(/\[\]$/, "");
    const isArr = f.type.endsWith("[]");
    const dep = all.find(s => s.schemaName === base || s.resourceName === base);
    if (dep?.resourceName && ctx[dep.resourceName] != null) {
      body[f.name] = isArr ? [{ id: ctx[dep.resourceName] }] : { id: ctx[dep.resourceName] };
      continue;
    }
    const v = dgSynthValue(f.name, f.type);
    if (v !== null) body[f.name] = v;
  }
  return body;
}

function dgTopoSort(specs: ApiSpec[]): ApiSpec[] {
  const bySchema: Record<string, ApiSpec> = {};
  const byRes: Record<string, ApiSpec> = {};
  for (const s of specs) {
    if (s.schemaName) bySchema[s.schemaName] = s;
    if (s.resourceName) byRes[s.resourceName] = s;
  }
  const visited = new Set<string>();
  const out: ApiSpec[] = [];
  function visit(s: ApiSpec) {
    if (visited.has(s.fileName)) return;
    visited.add(s.fileName);
    for (const d of s.dependencies || []) {
      const ds = bySchema[d] || byRes[d];
      if (ds && ds.fileName !== s.fileName) visit(ds);
    }
    out.push(s);
  }
  specs.forEach(visit);
  return out;
}

interface DgStep {
  id: string; spec: ApiSpec; method: string; summary: string;
  synthBody: Record<string, any>; producesId: boolean;
  dependsOn: string[];
}

function dgBuildPlan(specs: ApiSpec[]): DgStep[] {
  const sorted = dgTopoSort(specs);
  const steps: DgStep[] = [];
  for (const spec of sorted) {
    if (!spec.resourceName) continue;
    const res = spec.resourceName;
    const methods = [...new Set(
      spec.endpoints.map(e => e.method.toUpperCase())
        .filter(m => ["POST", "GET", "PATCH", "PUT", "DELETE"].includes(m))
    )].sort((a, b) => (DG_METHOD_ORDER[a] ?? 9) - (DG_METHOD_ORDER[b] ?? 9));

    for (const method of methods) {
      const ep = spec.endpoints.find(e => e.method.toUpperCase() === method)!;
      const dependsOn: string[] = [];
      if (method !== "POST") {
        const postId = `${res}__POST`;
        if (steps.find(s => s.id === postId)) dependsOn.push(postId);
      }
      for (const dep of spec.dependencies || []) {
        const ds = sorted.find(s => s.schemaName === dep || s.resourceName === dep);
        if (ds?.resourceName) {
          const pid = `${ds.resourceName}__POST`;
          if (!dependsOn.includes(pid) && steps.find(s => s.id === pid)) dependsOn.push(pid);
        }
      }
      const synthBody = ["POST", "PATCH", "PUT"].includes(method) ? dgBuildBody(spec, {}, sorted) : {};
      steps.push({
        id: `${res}__${method}`, spec, method,
        summary: ep?.summary || `${method} ${res}`,
        synthBody, producesId: method === "POST", dependsOn,
      });
    }
  }
  return steps;
}

// ── DataGenTab UI ──
type DgView = "setup" | "generated";

interface DataGenTabState {
  selNames: string[];
  testCount: number;
  dgView: DgView;
  plan: DgStep[];
  generatedN: number;
  envTick: number;   // bumps when env selection changes
  specsPage: number;
  specsPageSize: number;
  planPage: number;
  planPageSize: number;
  depOpenCard: string | null;
}

const DG_PRESETS = [1, 5, 10, 50, 100, 500, 1000, 2000];

export class DataGenTab extends React.Component<
  { loadedSpecs: ApiSpec[]; onGenerate?: () => void },
  DataGenTabState
> {
  state: DataGenTabState = {
    selNames: [], testCount: 1, dgView: "setup",
    plan: [], generatedN: 0, envTick: 0,
    specsPage: 0, specsPageSize: 20, planPage: 0, planPageSize: 20, depOpenCard: null,
  };

  private toggle = (fn: string) =>
    this.setState(s => ({
      selNames: s.selNames.includes(fn) ? s.selNames.filter(n => n !== fn) : [...s.selNames, fn],
    }));

  private generate = () => {
    const { selNames, testCount } = this.state;
    const { loadedSpecs, onGenerate } = this.props;
    const sel = loadedSpecs.filter(s => selNames.includes(s.fileName));
    const plan = dgBuildPlan(sel);
    if (plan.length === 0) return;

    // Generate testCount iterations × plan steps into testStore
    let added = 0;
    for (let run = 1; run <= testCount; run++) {
      for (const step of plan) {
        const res = step.spec.resourceName || "unknown";
        const body = ["POST", "PATCH", "PUT"].includes(step.method)
          ? dgBuildBody(step.spec, {}, sel) : null;
        const path = ["GET", "PATCH", "PUT", "DELETE"].includes(step.method)
          && step.spec.pathParams.length > 0
          ? `/${res}/{id}` : `/${res}`;
        testStore.add({
          runGroup: run,
          apiTitle: step.spec.title,
          resourceName: res,
          method: step.method,
          path,
          body,
          dataSource: "synthetic",
          resolvedUrl: envStore.resolve(path),   // frozen at generation time
        });
        added++;
      }
    }

    this.setState({ plan, generatedN: added, dgView: "generated" });
    onGenerate?.();
  };

  render() {
    const { loadedSpecs } = this.props;
    const { selNames, testCount, dgView, plan, generatedN, specsPage, specsPageSize, planPage, planPageSize, depOpenCard } = this.state;
    const SPEC_PAGE_SIZES = [10, 20, 50, 100];
    const specsTotalPages = Math.ceil(loadedSpecs.length / specsPageSize);
    const specsPageStart = specsPage * specsPageSize;
    const pagedSpecs = loadedSpecs.slice(specsPageStart, specsPageStart + specsPageSize);
    const sel = loadedSpecs.filter(s => selNames.includes(s.fileName));

    const SLbl = ({ text }: { text: string }) => (
      <div style={{
        fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)",
        letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 8
      }}>{text}</div>
    );
    const MChip = ({ m }: { m: string }) => {
      const c = DG_METHOD_COLORS[m] || "#8b949e";
      return (
        <span style={{
          background: c + "18", border: `1px solid ${c}40`, color: c,
          borderRadius: 5, padding: "1px 7px", fontFamily: MONO, fontSize: 10,
          fontWeight: 700, whiteSpace: "nowrap" as const, flexShrink: 0
        }}>{m}</span>
      );
    };

    return (
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>

        {/* ══ SETUP ══ */}
        {dgView === "setup" && (
          <>
            {/* Banner */}
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "#34d39910", border: "1px solid #34d39933"
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 13, fontWeight: 800,
                color: "#34d399", marginBottom: 5
              }}>⚗ Data Synthetic Generator</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.6 }}>
                Configure APIs and iteration count. The engine auto-detects IN / IN·OUT fields,
                generates banking-domain synthetic data and resolves cross-API dependencies.
                Generated test cases are queued in <strong style={{ color: "var(--cs-text)" }}>Ready for Test</strong> — no execution happens here.
              </div>
            </div>

            {/* ══ ENVIRONMENT ENDPOINT ══ */}
            <div style={{ borderRadius: 10, border: "1px solid var(--cs-border)", overflow: "visible" as const }}>
              {/* Section header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 14px", background: "var(--cs-surface-2)",
                borderBottom: "1px solid var(--cs-border-sub)",
                borderRadius: "10px 10px 0 0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🌐</span>
                  <span style={{
                    fontFamily: MONO, fontSize: 11, fontWeight: 800,
                    color: "var(--cs-text)", letterSpacing: 0.3
                  }}>
                    Target Environment
                  </span>
                </div>
                <span style={{
                  fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)",
                  background: "var(--cs-bg)", border: "1px solid var(--cs-border-sub)",
                  borderRadius: 4, padding: "1px 7px"
                }}>
                  Generated URIs will be bound to this endpoint
                </span>
              </div>
              {/* EnvBar dropdown */}
              <div style={{
                padding: "10px 14px", background: "var(--cs-bg)",
                borderRadius: "0 0 10px 10px"
              }}>
                <EnvBar onChange={() => this.setState(s => ({ envTick: s.envTick + 1 }))} />
              </div>
            </div>

            {/* ══ TEST COUNT + GENERATE ══ */}
            <div style={{
              borderRadius: 10, border: "1px solid var(--cs-border)",
              overflow: "hidden",
            }}>
              {/* Header row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 14px", background: "var(--cs-surface-2)",
                borderBottom: "1px solid var(--cs-border-sub)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>⚡</span>
                  <span style={{
                    fontFamily: MONO, fontSize: 11, fontWeight: 800,
                    color: "var(--cs-text)", letterSpacing: 0.3
                  }}>
                    Number of Test Runs
                  </span>
                </div>
                <input type="number" min={1} max={2000} value={testCount}
                  onChange={e => this.setState({ testCount: Math.min(2000, Math.max(1, +e.target.value || 1)) })}
                  style={{
                    width: 72, padding: "3px 8px", background: "var(--cs-input-bg)",
                    border: "1px solid var(--cs-border)", borderRadius: 6,
                    color: "var(--cs-text)", fontFamily: MONO, fontSize: 13, fontWeight: 700,
                    textAlign: "right" as const, outline: "none"
                  }} />
              </div>

              {/* Slider + presets */}
              <div style={{ padding: "12px 14px 14px", background: "var(--cs-bg)" }}>
                <input type="range" min={1} max={2000} value={testCount}
                  onChange={e => this.setState({ testCount: +e.target.value })}
                  style={{ width: "100%", accentColor: "var(--cs-accent)", marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 12 }}>
                  {DG_PRESETS.map(n => (
                    <button key={n} onClick={() => this.setState({ testCount: n })} style={{
                      background: testCount === n ? "#34d39918" : "var(--cs-surface-2)",
                      border: `1px solid ${testCount === n ? "#34d399" : "var(--cs-border)"}`,
                      color: testCount === n ? "#34d399" : "var(--cs-muted)",
                      borderRadius: 6, padding: "3px 11px", fontFamily: MONO, fontSize: 11,
                      cursor: "pointer", fontWeight: testCount === n ? 700 : 400,
                    }}>{n >= 1000 ? `${n / 1000}k` : n}</button>
                  ))}
                </div>

                {/* Live preview count — shows when specs are selected */}
                {sel.length > 0 && (() => {
                  const p = dgBuildPlan(sel);
                  const total = p.length * testCount;
                  return (
                    <div style={{
                      padding: "8px 12px", borderRadius: 8, marginBottom: 12,
                      background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
                      fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)"
                    }}>
                      <span style={{ color: "#34d399", fontWeight: 800, fontSize: 18 }}>{total.toLocaleString()}</span>
                      {" "}test case{total !== 1 ? "s" : ""} will be queued
                      <span style={{ opacity: 0.6 }}> — {p.length} step{p.length !== 1 ? "s" : ""} × {testCount} run{testCount !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })()}

                {/* Generate button */}
                <button
                  disabled={selNames.length === 0}
                  onClick={this.generate}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 8,
                    cursor: selNames.length === 0 ? "not-allowed" : "pointer",
                    background: selNames.length === 0 ? "var(--cs-surface-2)"
                      : "linear-gradient(135deg, #1a4a7a, #34d399)",
                    border: `1.5px solid ${selNames.length === 0 ? "var(--cs-border)" : "#34d399"}`,
                    color: selNames.length === 0 ? "var(--cs-dim)" : "#fff",
                    fontFamily: MONO, fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
                    opacity: selNames.length === 0 ? 0.4 : 1, transition: "all .15s",
                  }}>
                  {selNames.length === 0
                    ? "Select at least one API spec below"
                    : `⬡ Generate Test Cases → Ready for Test`
                  }
                </button>
              </div>
            </div>

            {/* API selector */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
              }}>

                {/* Tri-state checkbox */}
                <div
                  onClick={() => {
                    const allSel = loadedSpecs.every(s => selNames.includes(s.fileName));
                    this.setState({ selNames: allSel ? [] : loadedSpecs.map(s => s.fileName) });
                  }}
                  title={loadedSpecs.every(s => selNames.includes(s.fileName)) ? "Deselect all" : "Select all"}
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", transition: "all .15s",
                    border: selNames.length === 0 ? "1.5px solid var(--cs-border)" : "1.5px solid #34d399",
                    background: loadedSpecs.length > 0 && selNames.length === loadedSpecs.length
                      ? "#34d399" : selNames.length > 0 ? "#34d39940" : "transparent",
                  }}>
                  {loadedSpecs.length > 0 && selNames.length === loadedSpecs.length && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#0a1f15" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {selNames.length > 0 && selNames.length < loadedSpecs.length && (
                    <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
                      <path d="M1 1H7" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                {/* Green label pill */}
                <span style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 700,
                  color: "#34d399", letterSpacing: 1, textTransform: "uppercase" as const,
                  background: "#34d39915", border: "1px solid #34d39933",
                  borderRadius: 5, padding: "2px 9px", whiteSpace: "nowrap" as const,
                }}>
                  {loadedSpecs.length} loaded specs
                </span>

                {/* Selected badge */}
                {selNames.length > 0 && (
                  <span style={{
                    fontFamily: MONO, fontSize: 9, color: "#34d399",
                    background: "#34d39915", border: "1px solid #34d39930",
                    borderRadius: 4, padding: "1px 7px", whiteSpace: "nowrap" as const,
                  }}>
                    {selNames.length} selected
                  </span>
                )}

                {/* Page-size + pagination — centered flex-1 */}
                {specsTotalPages > 1 && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {/* Page-size chips */}
                    <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>per page</span>
                    {SPEC_PAGE_SIZES.map(n => (
                      <button key={n} onClick={() => this.setState({ specsPageSize: n, specsPage: 0 })} style={{
                        background: specsPageSize === n ? "#34d39918" : "var(--cs-surface-2)",
                        border: `1px solid ${specsPageSize === n ? "#34d399" : "var(--cs-border)"}`,
                        color: specsPageSize === n ? "#34d399" : "var(--cs-muted)",
                        borderRadius: 5, padding: "2px 7px", fontFamily: MONO, fontSize: 10,
                        cursor: "pointer", fontWeight: specsPageSize === n ? 700 : 400,
                      }}>{n}</button>
                    ))}

                    {/* Separator */}
                    <span style={{ width: 1, height: 14, background: "var(--cs-border)", margin: "0 2px" }} />

                    {/* Page nav */}
                    <button onClick={() => this.setState({ specsPage: specsPage - 1 })} disabled={specsPage === 0}
                      style={{ background: "transparent", border: "1px solid var(--cs-border)", color: "var(--cs-muted)", borderRadius: 5, padding: "2px 7px", fontFamily: MONO, fontSize: 10, cursor: specsPage === 0 ? "default" : "pointer", opacity: specsPage === 0 ? 0.4 : 1 }}>‹</button>
                    {Array.from({ length: specsTotalPages }, (_, pi) => {
                      const near = pi === 0 || pi === specsTotalPages - 1 || Math.abs(pi - specsPage) <= 1;
                      if (!near) return (pi === 1 || pi === specsTotalPages - 2)
                        ? <span key={pi} style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>…</span>
                        : null;
                      return (
                        <button key={pi} onClick={() => this.setState({ specsPage: pi })} style={{
                          background: pi === specsPage ? "#34d399" : "var(--cs-surface-2)",
                          border: `1px solid ${pi === specsPage ? "#34d399" : "var(--cs-border)"}`,
                          color: pi === specsPage ? "#0a1f15" : "var(--cs-muted)",
                          borderRadius: 5, padding: "2px 6px", fontFamily: MONO, fontSize: 10,
                          cursor: "pointer", fontWeight: pi === specsPage ? 700 : 400, minWidth: 24,
                        }}>{pi + 1}</button>
                      );
                    })}
                    <button onClick={() => this.setState({ specsPage: specsPage + 1 })} disabled={specsPage === specsTotalPages - 1}
                      style={{ background: "transparent", border: "1px solid var(--cs-border)", color: "var(--cs-muted)", borderRadius: 5, padding: "2px 7px", fontFamily: MONO, fontSize: 10, cursor: specsPage === specsTotalPages - 1 ? "default" : "pointer", opacity: specsPage === specsTotalPages - 1 ? 0.4 : 1 }}>›</button>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", marginLeft: 2 }}>
                      {specsPageStart + 1}–{Math.min(specsPageStart + specsPageSize, loadedSpecs.length)} of {loadedSpecs.length}
                    </span>
                  </div>
                )}
                {specsTotalPages <= 1 && <div style={{ flex: 1 }} />}

                {/* All / Clear — far right */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => this.setState({ selNames: loadedSpecs.map(s => s.fileName) })}
                    style={{
                      background: "transparent", border: "1px solid var(--cs-border)",
                      color: "#34d399", borderRadius: 6, padding: "3px 10px",
                      fontFamily: MONO, fontSize: 11, cursor: "pointer"
                    }}>All</button>
                  <button onClick={() => this.setState({ selNames: [] })}
                    style={{
                      background: "transparent", border: "1px solid var(--cs-border)",
                      color: "var(--cs-muted)", borderRadius: 6, padding: "3px 10px",
                      fontFamily: MONO, fontSize: 11, cursor: "pointer"
                    }}>Clear</button>
                </div>
              </div>

              {loadedSpecs.length === 0 ? (
                <div style={{
                  padding: "20px", textAlign: "center" as const,
                  fontFamily: MONO, fontSize: 12, color: "var(--cs-dim)",
                  border: "1px dashed var(--cs-border)", borderRadius: 8
                }}>
                  No API specs loaded — upload files in the API Files tab
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                  {pagedSpecs.map(spec => {
                    const active = selNames.includes(spec.fileName);
                    const pathPs = new Set(spec.pathParams || []);
                    const inCount = spec.fields.filter(f => !f.readOnly && !pathPs.has(f.name) && !f.isParam).length;
                    const outCount = spec.fields.filter(f => f.readOnly).length;
                    const methods = [...new Set(spec.endpoints.map(e => e.method.toUpperCase()))];
                    return (
                      <div key={spec.fileName} onClick={() => this.toggle(spec.fileName)} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                        borderRadius: 8, cursor: "pointer",
                        background: active ? "#34d39910" : "var(--cs-surface)",
                        border: `1.5px solid ${active ? "#34d39955" : "var(--cs-border-sub)"}`,
                        transition: "all .12s",
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${active ? "#34d399" : "var(--cs-border)"}`,
                          background: active ? "#34d399" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {active && <span style={{ color: "#0a0e1a", fontSize: 11, fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: MONO, fontSize: 12, fontWeight: 700,
                            color: active ? "var(--cs-text)" : "var(--cs-muted)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const
                          }}>
                            {spec.title}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", marginTop: 2 }}>
                            {spec.resourceName} · {spec.fields.length} fields
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                          <span style={{
                            background: "#60a5fa15", border: "1px solid #60a5fa33",
                            color: "#60a5fa", borderRadius: 5, padding: "1px 7px",
                            fontFamily: MONO, fontSize: 9, fontWeight: 600
                          }}>IN {inCount}</span>
                          <span style={{
                            background: "#f8717115", border: "1px solid #f8717133",
                            color: "#f87171", borderRadius: 5, padding: "1px 7px",
                            fontFamily: MONO, fontSize: 9, fontWeight: 600
                          }}>OUT {outCount}</span>
                        </div>
                        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                          {methods.slice(0, 4).map(m => <MChip key={m} m={m} />)}
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>

            {/* Dependency preview — grouped cards */}
            {sel.length > 1 && (() => {
              const pairs: { from: string; to: string }[] = [];
              for (const s of sel)
                for (const d of s.dependencies || []) {
                  const ds = sel.find(x => x.schemaName === d || x.resourceName === d);
                  if (ds && ds.fileName !== s.fileName) pairs.push({ from: ds.title, to: s.title });
                }
              if (pairs.length === 0) return null;

              // Group by TARGET (to), sort by chain count desc
              const byTarget: Record<string, string[]> = {};
              for (const p of pairs) {
                if (!byTarget[p.to]) byTarget[p.to] = [];
                if (!byTarget[p.to].includes(p.from)) byTarget[p.to].push(p.from);
              }
              const groups = Object.entries(byTarget).sort((a, b) => b[1].length - a[1].length);

              // Color palette cycling
              const CARD_COLORS = [
                { bg: "#34d39912", border: "#34d39933", label: "#34d399", dot: "#34d399" },
                { bg: "#60a5fa12", border: "#60a5fa33", label: "#60a5fa", dot: "#60a5fa" },
                { bg: "#fb923c12", border: "#fb923c33", label: "#fb923c", dot: "#fb923c" },
                { bg: "#a78bfa12", border: "#a78bfa33", label: "#a78bfa", dot: "#a78bfa" },
                { bg: "#f472b612", border: "#f472b633", label: "#f472b6", dot: "#f472b6" },
                { bg: "#facc1512", border: "#facc1533", label: "#facc15", dot: "#facc15" },
                { bg: "#38bdf812", border: "#38bdf833", label: "#38bdf8", dot: "#38bdf8" },
              ];

              return (
                <div>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: 1,
                      textTransform: "uppercase" as const, color: "#60a5fa",
                      background: "#60a5fa12", border: "1px solid #60a5fa33",
                      borderRadius: 5, padding: "2px 9px",
                    }}>
                      Detected dependencies
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>
                      {pairs.length} chains · {groups.length} targets · click to expand
                    </span>
                  </div>

                  {/* Cards grid */}
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                    {groups.map(([target, sources], gi) => {
                      const c = CARD_COLORS[gi % CARD_COLORS.length];
                      const isOpen = depOpenCard === target;
                      return (
                        <div key={target} style={{
                          borderRadius: 8, border: `1px solid ${isOpen ? c.border : "var(--cs-border-sub)"}`,
                          background: isOpen ? c.bg : "var(--cs-surface)",
                          overflow: "hidden", transition: "all .15s",
                          flexBasis: isOpen ? "100%" : "auto",
                          minWidth: isOpen ? "100%" : 0,
                        }}>
                          {/* Card header — always visible, clickable */}
                          <div
                            onClick={() => this.setState({ depOpenCard: isOpen ? null : target })}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "7px 12px", cursor: "pointer",
                              borderBottom: isOpen ? `1px solid ${c.border}` : "none",
                            }}>
                            <span style={{
                              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                              background: c.dot,
                            }} />
                            <span style={{
                              fontFamily: MONO, fontSize: 11, fontWeight: 700,
                              color: isOpen ? c.label : "var(--cs-text)",
                              flex: 1, whiteSpace: "nowrap" as const,
                              overflow: "hidden", textOverflow: "ellipsis",
                            }}>{target}</span>
                            <span style={{
                              fontFamily: MONO, fontSize: 9, color: isOpen ? c.label : "var(--cs-dim)",
                              background: isOpen ? c.bg : "var(--cs-surface-2)",
                              border: `1px solid ${isOpen ? c.border : "var(--cs-border)"}`,
                              borderRadius: 4, padding: "1px 6px", flexShrink: 0,
                            }}>{sources.length}</span>
                            <span style={{
                              fontSize: 9, color: isOpen ? c.label : "var(--cs-dim)",
                              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform .15s", lineHeight: 1,
                            }}>▼</span>
                          </div>

                          {/* Expanded: source list */}
                          {isOpen && (
                            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column" as const, gap: 5 }}>
                              {sources.map((src, si) => (
                                <div key={si} style={{
                                  display: "flex", alignItems: "center", gap: 8,
                                  fontFamily: MONO, fontSize: 11,
                                }}>
                                  <span style={{
                                    color: c.label, fontWeight: 700,
                                    background: c.bg, border: `1px solid ${c.border}`,
                                    borderRadius: 4, padding: "2px 8px",
                                  }}>{src}</span>
                                  <span style={{ color: "var(--cs-dim)", fontSize: 10 }}>→ id →</span>
                                  <span style={{ color: "var(--cs-text)", fontWeight: 600 }}>{target}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Synth data preview */}
            {sel.length > 0 && (() => {
              const preview = dgBuildBody(sel[0], {}, sel);
              const keys = Object.keys(preview).slice(0, 6);
              if (keys.length === 0) return null;
              return (
                <div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 8
                  }}>
                    <SLbl text={`Sample payload — ${sel[0].title}`} />
                    <button onClick={() => this.forceUpdate()}
                      style={{
                        background: "transparent", border: "1px solid var(--cs-border)",
                        color: "#34d399", borderRadius: 6, padding: "3px 10px",
                        fontFamily: MONO, fontSize: 11, cursor: "pointer", marginBottom: 8
                      }}>
                      ↻ Refresh
                    </button>
                  </div>
                  <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid var(--cs-border-sub)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, background: "var(--cs-bg)" }}>
                      <thead>
                        <tr>{keys.map(k => (
                          <th key={k} style={{
                            padding: "7px 12px", background: "var(--cs-surface-2)",
                            fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)",
                            textTransform: "uppercase" as const, letterSpacing: 0.7,
                            borderBottom: "1px solid var(--cs-border-sub)", textAlign: "left" as const,
                            whiteSpace: "nowrap" as const
                          }}>{k}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 3 }).map((_, ri) => {
                          const row = dgBuildBody(sel[0], {}, sel);
                          return (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--cs-bg)" : "var(--cs-surface)" }}>
                              {keys.map(k => {
                                const v = row[k];
                                const d = v == null ? "—"
                                  : typeof v === "object" ? ((v as any).ident || (v as any).id || JSON.stringify(v))
                                    : String(v);
                                return (
                                  <td key={k} title={d} style={{
                                    padding: "7px 12px",
                                    fontFamily: MONO, fontSize: 11, color: "var(--cs-text)",
                                    borderBottom: "1px solid var(--cs-border-sub)",
                                    maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis",
                                    whiteSpace: "nowrap" as const
                                  }}>{d}</td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", marginTop: 5, opacity: 0.7 }}>
                    Source: <strong>Synthetic</strong> — fresh values generated per test case
                  </div>
                </div>
              );
            })()}

            {/* Execution plan preview */}
            {sel.length > 0 && (() => {
              const p = dgBuildPlan(sel);
              if (p.length === 0) return null;
              const PLAN_PAGE_SIZES = [10, 20, 50, 100];
              const planTotalPages = Math.ceil(p.length / planPageSize);
              const planPageStart = planPage * planPageSize;
              const pagedPlan = p.slice(planPageStart, planPageStart + planPageSize);
              return (
                <div>
                  {/* Header row with label + inline pagination */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 10, fontWeight: 700,
                      color: "#34d399", letterSpacing: 1, textTransform: "uppercase" as const,
                      background: "#34d39915", border: "1px solid #34d39933",
                      borderRadius: 5, padding: "2px 9px", whiteSpace: "nowrap" as const, flexShrink: 0,
                    }}>
                      Execution plan — {p.length} step{p.length !== 1 ? "s" : ""} per run
                    </span>

                    {planTotalPages > 1 && (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>per page</span>
                        {PLAN_PAGE_SIZES.map(n => (
                          <button key={n} onClick={() => this.setState({ planPageSize: n, planPage: 0 })} style={{
                            background: planPageSize === n ? "#34d39918" : "var(--cs-surface-2)",
                            border: `1px solid ${planPageSize === n ? "#34d399" : "var(--cs-border)"}`,
                            color: planPageSize === n ? "#34d399" : "var(--cs-muted)",
                            borderRadius: 5, padding: "2px 7px", fontFamily: MONO, fontSize: 10,
                            cursor: "pointer", fontWeight: planPageSize === n ? 700 : 400,
                          }}>{n}</button>
                        ))}
                        <span style={{ width: 1, height: 14, background: "var(--cs-border)", margin: "0 2px" }} />
                        <button onClick={() => this.setState({ planPage: planPage - 1 })} disabled={planPage === 0}
                          style={{ background: "transparent", border: "1px solid var(--cs-border)", color: "var(--cs-muted)", borderRadius: 5, padding: "2px 7px", fontFamily: MONO, fontSize: 10, cursor: planPage === 0 ? "default" : "pointer", opacity: planPage === 0 ? 0.4 : 1 }}>‹</button>
                        {Array.from({ length: planTotalPages }, (_, pi) => {
                          const near = pi === 0 || pi === planTotalPages - 1 || Math.abs(pi - planPage) <= 1;
                          if (!near) return (pi === 1 || pi === planTotalPages - 2)
                            ? <span key={pi} style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>…</span> : null;
                          return (
                            <button key={pi} onClick={() => this.setState({ planPage: pi })} style={{
                              background: pi === planPage ? "#34d399" : "var(--cs-surface-2)",
                              border: `1px solid ${pi === planPage ? "#34d399" : "var(--cs-border)"}`,
                              color: pi === planPage ? "#0a1f15" : "var(--cs-muted)",
                              borderRadius: 5, padding: "2px 6px", fontFamily: MONO, fontSize: 10,
                              cursor: "pointer", fontWeight: pi === planPage ? 700 : 400, minWidth: 24,
                            }}>{pi + 1}</button>
                          );
                        })}
                        <button onClick={() => this.setState({ planPage: planPage + 1 })} disabled={planPage === planTotalPages - 1}
                          style={{ background: "transparent", border: "1px solid var(--cs-border)", color: "var(--cs-muted)", borderRadius: 5, padding: "2px 7px", fontFamily: MONO, fontSize: 10, cursor: planPage === planTotalPages - 1 ? "default" : "pointer", opacity: planPage === planTotalPages - 1 ? 0.4 : 1 }}>›</button>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", marginLeft: 2 }}>
                          {planPageStart + 1}–{Math.min(planPageStart + planPageSize, p.length)} of {p.length}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                    {pagedPlan.map((step, i) => {
                      const globalIdx = planPageStart + i;
                      const col = DG_METHOD_COLORS[step.method] || "#8b949e";
                      return (
                        <div key={step.id} style={{
                          display: "flex", alignItems: "center",
                          gap: 10, padding: "8px 12px", borderRadius: 7, background: "var(--cs-surface)",
                          border: `1px solid ${col}20`, borderLeft: `3px solid ${col}66`
                        }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", width: 18, flexShrink: 0 }}>{globalIdx + 1}</span>
                          <MChip m={step.method} />
                          <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--cs-text)", flex: 1 }}>
                            {step.summary}
                          </span>
                          {step.producesId && (
                            <span style={{ fontFamily: MONO, fontSize: 9, color: col, opacity: 0.7 }}>→ {step.spec.resourceName}_id</span>
                          )}
                          {step.dependsOn.length > 0 && (
                            <span style={{ fontFamily: MONO, fontSize: 9, color: "#60a5fa", opacity: 0.7 }}>← uses prev id</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ══ GENERATED CONFIRMATION ══ */}
        {dgView === "generated" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div style={{
              padding: "20px", borderRadius: 12, textAlign: "center" as const,
              background: "#34d39910", border: "2px solid #34d39944"
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <div style={{
                fontFamily: MONO, fontSize: 16, fontWeight: 800,
                color: "#34d399", marginBottom: 6
              }}>
                {generatedN.toLocaleString()} test case{generatedN !== 1 ? "s" : ""} queued
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.7 }}>
                {plan.length} step{plan.length !== 1 ? "s" : ""} × {testCount} run{testCount !== 1 ? "s" : ""}<br />
                Data source: <strong style={{ color: "#34d399" }}>Synthetic</strong><br />
                Target: <strong style={{ color: envStore.selected.color }}>
                  {envStore.selected.name} — {envStore.selected.baseUrl}
                </strong><br />
                Switch to <strong style={{ color: "var(--cs-text)" }}>Ready for Test</strong> to review and execute.
              </div>
            </div>

            {/* Summary by method */}
            <div>
              <SLbl text="Cases by method" />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {(["POST", "GET", "PATCH", "PUT", "DELETE"] as const).map(m => {
                  const cnt = plan.filter(s => s.method === m).length * testCount;
                  if (cnt === 0) return null;
                  const col = DG_METHOD_COLORS[m];
                  return (
                    <div key={m} style={{
                      padding: "8px 14px", borderRadius: 8,
                      background: col + "0a", border: `1px solid ${col}30`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <MChip m={m} />
                        <span style={{ fontFamily: MONO, fontSize: 13, color: col, fontWeight: 800 }}>{cnt}</span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>cases</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => this.setState({ dgView: "setup" })}
                style={{
                  flex: 1, padding: "11px", borderRadius: 8, cursor: "pointer",
                  background: "#34d39912", border: "1px solid #34d39933",
                  color: "#34d399", fontFamily: MONO, fontSize: 12, fontWeight: 700
                }}>
                ← Configure more
              </button>
              <button onClick={() => { testStore.clear(); this.setState({ dgView: "setup", generatedN: 0 }); }}
                style={{
                  flex: 1, padding: "11px", borderRadius: 8, cursor: "pointer",
                  background: "#fb923c12", border: "1px solid #fb923c33",
                  color: "#f87171", fontFamily: MONO, fontSize: 12, fontWeight: 600
                }}>
                🗑 Clear queue
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }
}

// ── helper components ──
const SLbl = ({ text }: { text: string }) => (
  <div style={{
    fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)",
    letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 8
  }}>{text}</div>
);
const MChip = ({ m }: { m: string }) => {
  const c = DG_METHOD_COLORS[m] || "#8b949e";
  return (
    <span style={{
      background: c + "18", border: `1px solid ${c}40`, color: c,
      borderRadius: 5, padding: "1px 7px", fontFamily: MONO, fontSize: 10,
      fontWeight: 700, whiteSpace: "nowrap" as const, flexShrink: 0
    }}>{m}</span>
  );
};


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
