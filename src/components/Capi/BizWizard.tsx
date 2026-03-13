import React, { createRef } from "react";
import {
  SYNTH, rest, ApiSpec, envStore,
  rndInt, rndFloat, rndPick, isoDate,
} from "./utils";
import { StatusBadge, ResultRow } from "./AtomComponents";
import "./capi-wizard.scss";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type FieldDirection = "OUT" | "IN" | "IN_OUT" | "PARAM";
type WizMode = "dsg" | "static";
type DsgStep = "api-select" | "data" | "flow" | "running" | "report";
type StaticStep = "configure" | "running" | "report";
type WizStep = "home" | DsgStep | StaticStep;

/** One step in the dynamic execution plan */
interface DynStep {
  id: string;
  spec: ApiSpec;
  method: string;
  path: string;
  summary: string;
  /** Synthetic body (IN / IN_OUT fields, excluding OUTs and PARAMs) */
  synthBody: Record<string, any>;
  /** Which resourceNames this step needs an ID from (path params) */
  needsIdFrom: string[];
  /** Does this step produce a resource ID? (POST → true) */
  producesId: boolean;
  /** Steps that must complete before this one */
  dependsOnIds: string[];
}

/** Live execution log entry */
interface ExecEntry {
  step: number; label: string; method: string;
  status: number | string; latency: number;
  result: any; headers: any; ok: boolean;
  // Request snapshot (captured before the call)
  reqUrl?: string;
  reqHeaders?: Record<string, string>;
  reqBody?: any;
}

// ═══════════════════════════════════════════════════════════════
// STATIC CATALOG  (Load Test + Error Handling only, unchanged)
// ═══════════════════════════════════════════════════════════════
const STATIC_CASES = [
  {
    id: "load_test", cat: "Execution Management", icon: "⚡",
    title: "Load Test Endpoint",
    desc: "Test di carico su endpoint GET con N chiamate parallele.",
    steps: [
      { id: "s1", label: "GET ripetuto N volte", method: "GET", resource: "obj-addrs", params: { limit: 10 } },
    ],
    params: [
      { key: "numRequests", label: "N. Richieste", type: "number", min: 10, max: 100, default: 20 },
    ],
    riskLevel: "HIGH", domains: ["Performance", "SRE"],
  },
  {
    id: "error_handling", cat: "Report Management", icon: "⚠️",
    title: "Test Error Handling",
    desc: "Verifica corretta gestione errori: 404 not found, 400 bad request.",
    steps: [
      { id: "s1", label: "GET ID inesistente (404)", method: "GET", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s2", label: "PATCH ID inesistente (404)", method: "PATCH", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s3", label: "DELETE ID inesistente (404)", method: "DELETE", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
    ],
    params: [
      { key: "includeEdgeCases", label: "Includi Edge Cases", type: "boolean", default: true },
    ],
    riskLevel: "LOW", domains: ["Resilience", "API Quality"],
  },
];

const CAT_COLORS: Record<string, string> = {
  "API Data Management": "#34d399",
  "Execution Management": "#fb923c",
  "Report Management": "#a78bfa",
};

const MONO = "'JetBrains Mono','Fira Mono',monospace";

const METHOD_ORDER: Record<string, number> = {
  POST: 0, GET: 1, PATCH: 2, PUT: 3, DELETE: 4, RPC: 5,
};

const METHOD_COLORS: Record<string, string> = {
  POST: "#34d399", GET: "#60a5fa", PATCH: "#fb923c",
  PUT: "#f59e0b", DELETE: "#f87171", RPC: "#a78bfa",
};

// ═══════════════════════════════════════════════════════════════
// SYNTH FIELD ENGINE
// Maps field name + type → realistic banking-domain value
// ═══════════════════════════════════════════════════════════════
function synthValueForField(name: string, type: string): any {
  const n = name.toLowerCase();
  const t = type.toLowerCase().replace(/\[\]$/, "");

  // ── Name-based heuristics (most specific first) ──
  if (n.includes("eladdr") || n.includes("email")) return SYNTH.email(SYNTH.firstName(), SYNTH.lastName());
  if (n === "firstname" || n.includes("firstname")) return SYNTH.firstName();
  if (n === "name" || n === "lastname" || n === "surname") return SYNTH.lastName();
  if (n === "firm" || n.includes("company")) return SYNTH.firm();
  if (n.includes("street") && !n.includes("nr")) return SYNTH.street();
  if (n === "streetnr" || n === "housenr") return String(rndInt(1, 200));
  if (n === "zip" || n.includes("postal")) return String(rndInt(1000, 9999));
  if (n === "city" || n.includes("city")) return SYNTH.city();
  if (n.includes("iban")) return SYNTH.iban();
  if (n.includes("bic") || n.includes("swift")) return SYNTH.bic();
  if (n.includes("phone") || n.includes("tel")) return SYNTH.phone();
  if (n === "currency" || n === "ccy") return SYNTH.currency();
  if (n.includes("amount") || n.includes("amt") ||
    n.includes("nominal") || n.includes("qty")) return rndFloat(1000, 1000000, 2);
  if (n.includes("rate") || n.includes("yield")) return rndFloat(0.1, 8.5, 3);
  if (n.includes("isin")) return SYNTH.isin();
  if (n.includes("portfolio") || n === "portf") return SYNTH.portfolio();
  if (n === "clientid" || n === "bpid") return rndInt(100000, 999999);
  if (n.includes("date") && !n.includes("bde")) return isoDate(0);
  if (n.includes("maturity") || n.includes("expiry")) return isoDate(rndInt(30, 1825));
  if (n.includes("valdate") || n.includes("valuedate")) return isoDate(0);
  if (n === "country" || n.includes("country")) return SYNTH.country();
  if (n.includes("addrtype")) return SYNTH.addrType();
  if (n.includes("addrkind")) return SYNTH.addrKind();
  if (n.includes("riskclass") || n.includes("risk")) return SYNTH.riskClass();
  if (n.includes("assetclass") || n.includes("assetcl")) return SYNTH.assetClass();
  if (n.includes("txtype") || n.includes("transtype")) return SYNTH.txType();
  if (n.includes("sign") || n.includes("longshort")) return SYNTH.posSign();
  if (n === "description" || n === "desc" || n === "note") return `Test ${name} ${rndInt(100, 999)}`;
  if (n.includes("nr") || n.includes("num") || n.includes("number"))
    return String(rndInt(10000, 99999));
  if (n === "id" || n.endsWith("id")) return null; // server assigns

  // ── Type-based fallbacks ──
  if (t === "integer" || t === "number" || t === "int32" || t === "int64") return rndInt(1, 9999);
  if (t === "boolean") return true;
  if (t === "string") return `${name}-${rndInt(100, 999)}`;
  if (t === "object") return { id: rndInt(1, 100) };
  return null;
}

/** Build a request body dict for IN and IN_OUT fields of a spec */
function buildSynthBody(
  spec: ApiSpec,
  context: Record<string, number>,
  allSpecs: ApiSpec[],
): Record<string, any> {
  const pathParamSet = new Set(spec.pathParams || []);
  const body: Record<string, any> = {};

  for (const f of spec.fields) {
    // Skip server-output fields and path params
    if (f.readOnly) continue;
    if (pathParamSet.has(f.name) || f.isParam) continue;

    const baseType = f.type.replace(/\[\]$/, "");
    const isArr = f.type.endsWith("[]");

    // Check if this type references another loaded spec
    const depSpec = allSpecs.find(s =>
      s.schemaName === baseType || s.resourceName === baseType
    );
    if (depSpec && depSpec.resourceName && context[depSpec.resourceName] != null) {
      // Inject the ID produced by the dependency
      body[f.name] = isArr
        ? [{ id: context[depSpec.resourceName] }]
        : { id: context[depSpec.resourceName] };
      continue;
    }

    // Generate synthetic value
    const val = synthValueForField(f.name, f.type);
    if (val !== null) body[f.name] = val;
  }

  return body;
}

// ═══════════════════════════════════════════════════════════════
// TOPOLOGICAL SORT
// Specs whose dependencies come first in the result list.
// ═══════════════════════════════════════════════════════════════
function topoSortSpecs(specs: ApiSpec[]): ApiSpec[] {
  const schemaToSpec: Record<string, ApiSpec> = {};
  const resourceToSpec: Record<string, ApiSpec> = {};
  for (const s of specs) {
    if (s.schemaName) schemaToSpec[s.schemaName] = s;
    if (s.resourceName) resourceToSpec[s.resourceName] = s;
  }

  const visited = new Set<string>();
  const result: ApiSpec[] = [];

  function visit(spec: ApiSpec) {
    const key = spec.fileName;
    if (visited.has(key)) return;
    visited.add(key);
    for (const dep of spec.dependencies || []) {
      const depSpec = schemaToSpec[dep] || resourceToSpec[dep];
      if (depSpec && depSpec.fileName !== key) visit(depSpec);
    }
    result.push(spec);
  }

  for (const s of specs) visit(s);
  return result;
}

// ═══════════════════════════════════════════════════════════════
// DYNAMIC EXECUTION PLAN BUILDER
// Produces an ordered list of steps respecting:
//   1. Dependency graph (specs whose deps run first)
//   2. Method order within a spec (POST → GET → PATCH → DELETE)
// ═══════════════════════════════════════════════════════════════
function buildDynExecPlan(specs: ApiSpec[]): DynStep[] {
  const sorted = topoSortSpecs(specs);
  const steps: DynStep[] = [];

  // Track which step IDs produce IDs per resource
  const producerStepId: Record<string, string> = {};

  for (const spec of sorted) {
    if (!spec.resourceName) continue;
    const res = spec.resourceName;

    // Collect unique methods from endpoints, sorted by logical order
    const methods = [...new Set(
      spec.endpoints.map(e => e.method.toUpperCase())
        .filter(m => ["POST", "GET", "PATCH", "PUT", "DELETE"].includes(m))
    )].sort((a, b) => (METHOD_ORDER[a] ?? 9) - (METHOD_ORDER[b] ?? 9));

    for (const method of methods) {
      const ep = spec.endpoints.find(e => e.method.toUpperCase() === method)!;
      const stepId = `${res}__${method}`;

      // What steps does this depend on?
      const dependsOnIds: string[] = [];
      // Same resource POST must precede this if it's GET/PATCH/DELETE
      if (method !== "POST") {
        const postId = `${res}__POST`;
        if (steps.find(s => s.id === postId)) dependsOnIds.push(postId);
      }
      // Cross-spec dependencies
      for (const dep of spec.dependencies || []) {
        const depSpec = sorted.find(s => s.schemaName === dep || s.resourceName === dep);
        if (depSpec?.resourceName) {
          const depPostId = `${depSpec.resourceName}__POST`;
          if (!dependsOnIds.includes(depPostId) && steps.find(s => s.id === depPostId))
            dependsOnIds.push(depPostId);
        }
      }

      // What IDs from other resources does this need in its path?
      const needsIdFrom: string[] = [];
      if (["GET", "PATCH", "PUT", "DELETE"].includes(method) && spec.pathParams.length > 0) {
        needsIdFrom.push(res);
      }

      // Build synth body (empty context here — will be populated at runtime)
      const synthBody = method === "POST" || method === "PATCH" || method === "PUT"
        ? buildSynthBody(spec, {}, sorted)
        : {};

      const producesId = method === "POST";
      if (producesId) producerStepId[res] = stepId;

      steps.push({
        id: stepId, spec, method, path: ep.path,
        summary: ep.summary || `${method} ${res}`,
        synthBody, needsIdFrom, producesId, dependsOnIds,
      });
    }
  }

  return steps;
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
function SLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)",
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, ...style,
    }}>{children}</div>
  );
}

function PhaseBanner({ color, icon, title, desc }: {
  color: string; icon: string; title: string; desc: string;
}) {
  return (
    <div style={{
      padding: "11px 15px", borderRadius: 10, marginBottom: 2,
      background: color + "10", border: `1px solid ${color}33`,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color, marginBottom: 5 }}>
        {icon} {title}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  );
}

function MethodChip({ method, size = "sm" }: { method: string; size?: "xs" | "sm" }) {
  const col = METHOD_COLORS[method.toUpperCase()] || "#8b949e";
  return (
    <span style={{
      background: col + "18", border: `1px solid ${col}44`, color: col,
      borderRadius: 5, padding: size === "xs" ? "1px 5px" : "2px 8px",
      fontFamily: MONO, fontSize: size === "xs" ? 9 : 10, fontWeight: 700,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>{method}</span>
  );
}

// ═══════════════════════════════════════════════════════════════
// DSG PROGRESS STEPPER
// ═══════════════════════════════════════════════════════════════
const DSG_PHASES: { key: DsgStep; short: string }[] = [
  { key: "api-select", short: "APIs" },
  { key: "data", short: "Synth Data" },
  { key: "flow", short: "Exec Flow" },
  { key: "running", short: "Running" },
  { key: "report", short: "Report" },
];

function DsgStepper({ current }: { current: DsgStep }) {
  const idx = DSG_PHASES.findIndex(p => p.key === current);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      padding: "12px 20px 10px", borderBottom: "1px solid var(--cs-border-sub)",
      background: "var(--cs-surface)", flexShrink: 0,
    }}>
      {DSG_PHASES.map((p, i) => {
        const done = i < idx;
        const active = i === idx;
        const col = active ? "var(--cs-accent)" : done ? "#34d399" : "var(--cs-border)";
        const txtCol = active ? "var(--cs-accent)" : done ? "#34d399" : "var(--cs-dim)";
        return (
          <React.Fragment key={p.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", border: `2px solid ${col}`,
                background: active ? "var(--cs-accent)" : done ? "#34d39920" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: MONO, fontSize: 10, fontWeight: 800,
                color: active ? "#0a0e1a" : done ? "#34d399" : "var(--cs-dim)",
                transition: "all .25s",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontFamily: MONO, fontSize: 9, fontWeight: active ? 700 : 400,
                color: txtCol, letterSpacing: 0.4, whiteSpace: "nowrap",
              }}>{p.short}</span>
            </div>
            {i < DSG_PHASES.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 14, minWidth: 8,
                background: i < idx ? "#34d399" : "var(--cs-border-sub)",
                transition: "background .3s",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEST COUNT SLIDER COMPONENT
// ═══════════════════════════════════════════════════════════════
function TestCountPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const presets = [1, 5, 10, 50, 100, 500, 1000, 2000];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <SLabel style={{ marginBottom: 0 }}>Number of test runs</SLabel>
        <input
          type="number" min={1} max={2000} value={value}
          onChange={e => onChange(Math.min(2000, Math.max(1, +e.target.value || 1)))}
          style={{
            width: 80, padding: "4px 8px", background: "var(--cs-input-bg)",
            border: "1px solid var(--cs-border)", borderRadius: 6,
            color: "var(--cs-text)", fontFamily: MONO, fontSize: 13,
            textAlign: "right", outline: "none",
          }}
        />
      </div>

      {/* Slider */}
      <input type="range" min={1} max={2000} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: "var(--cs-accent)", marginBottom: 10 }}
      />

      {/* Preset chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map(n => (
          <button key={n} onClick={() => onChange(n)}
            style={{
              background: value === n ? "var(--cs-accent)18" : "var(--cs-surface-2)",
              border: `1px solid ${value === n ? "var(--cs-accent)" : "var(--cs-border)"}`,
              color: value === n ? "var(--cs-accent)" : "var(--cs-muted)",
              borderRadius: 6, padding: "3px 11px", fontFamily: MONO, fontSize: 11,
              cursor: "pointer", fontWeight: value === n ? 700 : 400,
              transition: "all .12s",
            }}>
            {n >= 1000 ? `${n / 1000}k` : n}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", marginTop: 8, opacity: 0.7 }}>
        {value === 1 ? "Single test run" : `${value} test runs — each run executes the full plan once`}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BIZ WIZARD  (main component)
// ═══════════════════════════════════════════════════════════════
interface BizWizardProps { onClose: () => void; loadedSpecs: ApiSpec[]; }

interface BizWizardState {
  wizMode: WizMode | null;
  wizStep: WizStep;
  // DSG state
  selSpecNames: string[];
  dynPlan: DynStep[];
  testCount: number;
  synthPreviews: Record<string, any>[];
  // Static case state
  selStaticCase: typeof STATIC_CASES[0] | null;
  staticParams: Record<string, any>;
  // Execution
  execLog: ExecEntry[];
  execResults: ExecEntry[];
  running: boolean;
  // Execution mode
  execMode: "flow" | "independent";
  flowTimeout: number;          // seconds — only used in flow mode
  // UI
  selCat: string;
}

export class BizWizard extends React.Component<BizWizardProps, BizWizardState> {
  state: BizWizardState = {
    wizMode: null, wizStep: "home",
    selSpecNames: [], dynPlan: [], testCount: 1, synthPreviews: [],
    selStaticCase: null, staticParams: {},
    execLog: [], execResults: [], running: false,
    execMode: "flow", flowTimeout: 15,
    selCat: "ALL",
  };
  private logRef = createRef<HTMLDivElement>();

  componentDidUpdate(_: BizWizardProps, prev: BizWizardState) {
    if (prev.execLog !== this.state.execLog)
      this.logRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // ── DSG ──────────────────────────────────────────────────────
  private toggleSpec = (fileName: string) => {
    this.setState(s => ({
      selSpecNames: s.selSpecNames.includes(fileName)
        ? s.selSpecNames.filter(n => n !== fileName)
        : [...s.selSpecNames, fileName],
    }));
  };

  private goToData = () => {
    const { selSpecNames } = this.state;
    const { loadedSpecs } = this.props;
    const selected = loadedSpecs.filter(s => selSpecNames.includes(s.fileName));
    const plan = buildDynExecPlan(selected);
    const previews = Array.from({ length: 3 }, () =>
      buildSynthBody(selected[0] || loadedSpecs[0], {}, selected)
    );
    this.setState({ dynPlan: plan, synthPreviews: previews, wizStep: "data" });
  };

  private refreshPreviews = () => {
    const { loadedSpecs } = this.props;
    const { selSpecNames } = this.state;
    const selected = loadedSpecs.filter(s => selSpecNames.includes(s.fileName));
    this.setState({
      synthPreviews: Array.from({ length: 3 }, () =>
        buildSynthBody(selected[0] || loadedSpecs[0], {}, selected)
      ),
    });
  };

  // ── Static case ───────────────────────────────────────────────
  private selectStatic = (sc: typeof STATIC_CASES[0]) => {
    const defaults: Record<string, any> = {};
    sc.params.forEach(p => { defaults[p.key] = p.default; });
    this.setState({ selStaticCase: sc, staticParams: defaults, wizMode: "static", wizStep: "configure" });
  };

  // ── Execution ─────────────────────────────────────────────────
  private execDynPlan = async () => {
    const { dynPlan, testCount, execMode, flowTimeout } = this.state;
    const { loadedSpecs } = this.props;
    const { selSpecNames } = this.state;
    const selected = loadedSpecs.filter(s => selSpecNames.includes(s.fileName));

    this.setState({ wizStep: "running", running: true, execLog: [], execResults: [] });
    const results: ExecEntry[] = [];
    // context is only populated/used in flow mode — in independent mode it stays empty
    const context: Record<string, number> = {};
    let stepNum = 0;

    const runCount = Math.min(testCount, 5);

    for (let run = 0; run < runCount; run++) {
      for (const step of dynPlan) {
        stepNum++;
        const label = run > 0 ? `[Run ${run + 1}] ${step.summary}` : step.summary;
        this.setState(s => ({
          execLog: [...s.execLog, {
            step: stepNum, label, method: step.method,
            status: "running", latency: 0, result: null, headers: null, ok: false,
          }],
        }));

        const t0 = Date.now();
        // Hoist body + callPath so the catch block can reference them
        const resource = step.spec.resourceName || "obj-addrs";
        const pathId = execMode === "flow" ? (context[resource] || null) : null;
        let callPath: string;
        if (execMode === "flow" && ["GET", "PATCH", "PUT", "DELETE"].includes(step.method) && step.spec.pathParams.length > 0 && pathId) {
          callPath = `/${resource}/${pathId}`;
        } else {
          callPath = `/${resource}`;
        }
        const body = (step.method === "POST" || step.method === "PATCH" || step.method === "PUT")
          ? buildSynthBody(step.spec, execMode === "flow" ? context : {}, selected)
          : null;

        try {
          // In flow mode: simulate real network latency + honour flowTimeout
          // In independent mode: fast mock, no chaining, use pure synth data
          const mockDelay = execMode === "flow"
            ? 40 + Math.random() * 120
            : 20 + Math.random() * 50;
          await new Promise(r => setTimeout(r, mockDelay));

          // Flow mode: apply per-step timeout guard
          const timeoutMs = execMode === "flow" ? flowTimeout * 1000 : 10000;
          const reqPromise = rest.req(step.method, callPath, body);
          const timeoutPromise = new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error(`Timeout after ${flowTimeout}s`)), timeoutMs)
          );
          const r = await Promise.race([reqPromise, timeoutPromise]) as Awaited<ReturnType<typeof rest.req>>;

          // Only chain IDs in flow mode
          if (execMode === "flow" && step.producesId && (r.body as any)?.id) {
            context[resource] = (r.body as any).id;
          }

          const latency = Date.now() - t0;
          const expectOk = r.status >= 200 && r.status < 300;
          const entry: ExecEntry = {
            step: stepNum, label, method: step.method,
            status: r.status, latency, result: r.body,
            headers: r.headers, ok: expectOk,
            reqUrl: envStore.resolve(callPath),
            reqHeaders: { "Content-Type": "application/json", "Accept": "application/json" },
            reqBody: body ?? undefined,
          };
          results.push(entry);
          this.setState(s => ({
            execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x),
          }));
        } catch (e: any) {
          const entry: ExecEntry = {
            step: stepNum, label, method: step.method,
            status: "ERR", latency: Date.now() - t0,
            result: { error: e.message }, headers: null, ok: false,
            reqUrl: envStore.resolve(callPath),
            reqHeaders: { "Content-Type": "application/json", "Accept": "application/json" },
            reqBody: body ?? undefined,
          };
          results.push(entry);
          this.setState(s => ({
            execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x),
          }));
        }
      }
    }

    this.setState({ execResults: results, running: false, wizStep: "report" });
  };

  private execStaticPlan = async () => {
    const { selStaticCase } = this.state;
    if (!selStaticCase) return;
    this.setState({ wizStep: "running", running: true, execLog: [], execResults: [] });
    const results: ExecEntry[] = [];
    let lastId: number | null = null;

    for (let i = 0; i < selStaticCase.steps.length; i++) {
      const step = selStaticCase.steps[i] as any;
      this.setState(s => ({
        execLog: [...s.execLog, {
          step: i + 1, label: step.label, method: step.method,
          status: "running", latency: 0, result: null, headers: null, ok: false,
        }],
      }));
      const t0 = Date.now();
      const staticReqHeaders = { "Content-Type": "application/json", "Accept": "application/json" };
      try {
        await new Promise(r => setTimeout(r, 40 + Math.random() * 80));
        let r: any;
        let staticCallPath: string;
        let staticReqBody: any = undefined;
        if (step.method === "POST" && step.synth === "address") {
          staticCallPath = "/" + step.resource;
          staticReqBody = SYNTH.address();
          r = await rest.req("POST", staticCallPath, staticReqBody);
          if (r.body?.id) lastId = r.body.id;
        } else if (step.method === "GET") {
          staticCallPath = step.dep && lastId ? `/${step.resource}/${lastId}` : `/${step.resource}`;
          r = await rest.req("GET", staticCallPath, null, step.params || {});
        } else if (step.method === "PATCH") {
          staticCallPath = `/${step.resource}/${step.path?.replace("/", "") || lastId || 0}`;
          staticReqBody = SYNTH.address();
          r = await rest.req("PATCH", staticCallPath, staticReqBody);
        } else if (step.method === "DELETE") {
          staticCallPath = `/${step.resource}/${step.path?.replace("/", "") || lastId || 999999999}`;
          r = await rest.req("DELETE", staticCallPath);
        } else {
          staticCallPath = "/" + (step.resource || "");
          r = { status: step.expectStatus || 200, body: {}, headers: {} };
        }
        const latency = Date.now() - t0;
        const expectOk = step.expectStatus ? r.status === step.expectStatus : r.status >= 200 && r.status < 300;
        const entry: ExecEntry = {
          step: i + 1, label: step.label, method: step.method, status: r.status, latency,
          result: r.body, headers: r.headers, ok: expectOk,
          reqUrl: envStore.resolve(staticCallPath),
          reqHeaders: staticReqHeaders,
          reqBody: staticReqBody,
        };
        results.push(entry);
        this.setState(s => ({ execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x) }));
      } catch (e: any) {
        const entry: ExecEntry = {
          step: i + 1, label: step.label, method: step.method, status: "ERR",
          latency: Date.now() - t0, result: { error: e.message }, headers: null, ok: false,
          reqHeaders: staticReqHeaders,
        };
        results.push(entry);
        this.setState(s => ({ execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x) }));
      }
    }
    this.setState({ execResults: results, running: false, wizStep: "report" });
  };

  private reset = () =>
    this.setState({
      wizMode: null, wizStep: "home", selSpecNames: [], dynPlan: [],
      testCount: 1, selStaticCase: null, execResults: [], execLog: [],
    });

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  render() {
    const { onClose, loadedSpecs } = this.props;
    const {
      wizMode, wizStep, selSpecNames, dynPlan, testCount, synthPreviews,
      selStaticCase, staticParams, execLog, execResults, selCat,
    } = this.state;

    const totalOk = execResults.filter(r => r.ok).length;
    const totalFail = execResults.filter(r => !r.ok).length;
    const avgLat = execResults.length
      ? Math.round(execResults.reduce((a, r) => a + (r.latency || 0), 0) / execResults.length) : 0;
    const pct = execResults.length ? Math.round((totalOk / execResults.length) * 100) : 0;
    const pctCol = pct === 100 ? "#34d399" : pct >= 50 ? "#f59e0b" : "#f87171";

    // Unique categories for filter bar
    const cats = ["ALL", ...new Set(STATIC_CASES.map(c => c.cat))];
    const filteredStatics = selCat === "ALL"
      ? STATIC_CASES
      : STATIC_CASES.filter(c => c.cat === selCat);

    // Selected specs for DSG
    const selectedSpecs = loadedSpecs.filter(s => selSpecNames.includes(s.fileName));

    return (
      <div className="capi-wizard-overlay">
        <div className="capi-wizard" style={{ width: "min(660px, 96vw)", maxHeight: "92vh" }}>

          {/* ── Header ── */}
          <div className="capi-wizard__header">
            <span className="capi-wizard__header-icon">🧪</span>
            <div className="capi-wizard__titles">
              <div className="capi-wizard__title">Business Case Wizard</div>
              <div className="capi-wizard__subtitle">
                {wizStep === "home" ? "Select a test case"
                  : wizMode === "dsg" ? "Data Synthetic Generator"
                    : selStaticCase?.title || "Configure"}
              </div>
            </div>
            <button className="capi-wizard__close" onClick={onClose}>✕</button>
          </div>

          {/* ── DSG Stepper ── */}
          {wizMode === "dsg" && wizStep !== "home" && (
            <DsgStepper current={wizStep as DsgStep} />
          )}

          {/* ── Body ── */}
          <div className="capi-wizard__body">

            {/* ══════════════════════════════════════════
                HOME  — choose DSG or static case
            ══════════════════════════════════════════ */}
            {wizStep === "home" && (
              <div>

                {/* DSG entry card */}
                <div
                  onClick={() => this.setState({ wizMode: "dsg", wizStep: "api-select" })}
                  style={{
                    border: "2px solid #34d39944", borderRadius: 12,
                    padding: "18px 20px", marginBottom: 16, cursor: "pointer",
                    background: "#34d39908", transition: "all .15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#34d399"; (e.currentTarget as HTMLDivElement).style.background = "#34d39914"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#34d39944"; (e.currentTarget as HTMLDivElement).style.background = "#34d39908"; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <span style={{ fontSize: 28 }}>⬡</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: "#34d399" }}>
                          Data Synthetic Generator
                        </span>
                        <span style={{
                          background: "#34d39920", border: "1px solid #34d39944",
                          color: "#34d399", borderRadius: 5, padding: "2px 8px",
                          fontFamily: MONO, fontSize: 10, fontWeight: 700,
                        }}>DYNAMIC</span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.65, marginBottom: 10 }}>
                        Select any combination of loaded APIs. The wizard automatically detects
                        input fields, generates synthetic test data, resolves cross-API dependencies,
                        and builds the correct execution sequence.
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["Auto field detection", "Dependency chaining", "IN/IN·OUT synth data", "Configurable test count"].map(f => (
                          <span key={f} style={{
                            background: "#34d39912", border: "1px solid #34d39930",
                            color: "#34d399", borderRadius: 5, padding: "2px 9px",
                            fontFamily: MONO, fontSize: 10,
                          }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {loadedSpecs.length > 0 && (
                    <div style={{
                      marginTop: 12, paddingTop: 12, borderTop: "1px solid #34d39922",
                      fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)"
                    }}>
                      {loadedSpecs.length} API spec{loadedSpecs.length !== 1 ? "s" : ""} available for selection
                    </div>
                  )}
                  {loadedSpecs.length === 0 && (
                    <div style={{
                      marginTop: 12, paddingTop: 12, borderTop: "1px solid #34d39922",
                      fontFamily: MONO, fontSize: 11, color: "#fb923c"
                    }}>
                      ⚠ Upload API specs first to use this mode
                    </div>
                  )}
                </div>

                {/* Static cases */}
                <div style={{
                  fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", fontWeight: 700,
                  letterSpacing: 1, textTransform: "uppercase", marginBottom: 10
                }}>
                  Static test cases
                </div>

                <div className="capi-wizard-cats" style={{ marginBottom: 12 }}>
                  {cats.map(c => {
                    const active = selCat === c;
                    const col = CAT_COLORS[c] || "#58a6ff";
                    return (
                      <button key={c} onClick={() => this.setState({ selCat: c })}
                        className="capi-wizard-cat-btn"
                        style={active ? { borderColor: col, color: col, background: col + "12" } : undefined}>
                        {c}
                      </button>
                    );
                  })}
                </div>

                <div className="capi-wizard-cases">
                  {filteredStatics.map(sc => {
                    const col = CAT_COLORS[sc.cat] || "#58a6ff";
                    return (
                      <div key={sc.id} className="capi-wizard-case"
                        onClick={() => this.selectStatic(sc)}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = col)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "")}>
                        <div className="capi-wizard-case__row">
                          <span className="capi-wizard-case__icon">{sc.icon}</span>
                          <div className="capi-wizard-case__info">
                            <div className="capi-wizard-case__title">{sc.title}</div>
                            <div className="capi-wizard-case__desc">{sc.desc}</div>
                            <div className="capi-wizard-case__tags">
                              <span className="capi-wizard-case__tag"
                                style={{ background: col + "22", borderColor: col + "44", color: col }}>
                                {sc.cat}
                              </span>
                              <span className={`capi-wizard-case__tag capi-wizard-case__tag--risk-${sc.riskLevel === "HIGH" ? "high" : "low"}`}>
                                ⚠ {sc.riskLevel}
                              </span>
                              {sc.domains.map(d => (
                                <span key={d} className="capi-wizard-case__tag capi-wizard-case__tag--domain">{d}</span>
                              ))}
                            </div>
                          </div>
                          <div className="capi-wizard-case__step-count">{sc.steps.length} step</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                DSG 1 — API SELECTION
            ══════════════════════════════════════════ */}
            {wizStep === "api-select" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PhaseBanner
                  color="#34d399" icon="⬡" title="Select APIs for Testing"
                  desc="Choose which loaded API specs to include. The wizard will detect all input fields, cross-API dependencies, and build the execution sequence automatically."
                />

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {/* Tri-state checkbox — select all / deselect all */}
                    <div
                      onClick={() => {
                        const allSel = loadedSpecs.every(s => selSpecNames.includes(s.fileName));
                        this.setState({ selSpecNames: allSel ? [] : loadedSpecs.map(s => s.fileName) });
                      }}
                      title={loadedSpecs.every(s => selSpecNames.includes(s.fileName)) ? "Deselect all" : "Select all"}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", transition: "all .15s",
                        border: selSpecNames.length === 0
                          ? "1.5px solid var(--cs-border)"
                          : "1.5px solid #34d399",
                        background: loadedSpecs.length > 0 && selSpecNames.length === loadedSpecs.length
                          ? "#34d399"
                          : selSpecNames.length > 0
                            ? "#34d39940"
                            : "transparent",
                      }}>
                      {loadedSpecs.length > 0 && selSpecNames.length === loadedSpecs.length && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0a1f15" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {selSpecNames.length > 0 && selSpecNames.length < loadedSpecs.length && (
                        <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
                          <path d="M1 1H7" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <SLabel style={{ marginBottom: 0 }}>
                      {loadedSpecs.length} loaded spec{loadedSpecs.length !== 1 ? "s" : ""}
                    </SLabel>
                    {selSpecNames.length > 0 && (
                      <span style={{
                        fontFamily: MONO, fontSize: 9, color: "#34d399",
                        background: "#34d39915", border: "1px solid #34d39930",
                        borderRadius: 4, padding: "1px 7px",
                      }}>
                        {selSpecNames.length} selected
                      </span>
                    )}
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                      <button onClick={() => this.setState({ selSpecNames: loadedSpecs.map(s => s.fileName) })}
                        style={{
                          background: "transparent", border: "1px solid var(--cs-border)", color: "#34d399",
                          borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11, cursor: "pointer"
                        }}>
                        Select all
                      </button>
                      <button onClick={() => this.setState({ selSpecNames: [] })}
                        style={{
                          background: "transparent", border: "1px solid var(--cs-border)", color: "var(--cs-muted)",
                          borderRadius: 6, padding: "3px 10px", fontFamily: MONO, fontSize: 11, cursor: "pointer"
                        }}>
                        Clear
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {loadedSpecs.map(spec => {
                      const sel = selSpecNames.includes(spec.fileName);
                      const inFields = spec.fields.filter(f => !f.readOnly && !f.isParam).length;
                      const outFields = spec.fields.filter(f => f.readOnly).length;
                      return (
                        <div key={spec.fileName}
                          onClick={() => this.toggleSpec(spec.fileName)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                            background: sel ? "#34d39910" : "var(--cs-surface)",
                            border: `1.5px solid ${sel ? "#34d39955" : "var(--cs-border-sub)"}`,
                            transition: "all .12s",
                          }}>
                          {/* Checkbox */}
                          <div style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                            border: `2px solid ${sel ? "#34d399" : "var(--cs-border)"}`,
                            background: sel ? "#34d399" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {sel && <span style={{ color: "#0a0e1a", fontSize: 12, fontWeight: 900 }}>✓</span>}
                          </div>

                          {/* Name + meta */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily: MONO, fontSize: 12, fontWeight: 700,
                              color: sel ? "var(--cs-text)" : "var(--cs-muted)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                            }}>
                              {spec.title}
                            </div>
                            <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", marginTop: 2 }}>
                              {spec.resourceName} · {spec.fields.length} fields
                            </div>
                          </div>

                          {/* Field badges */}
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <span style={{
                              background: "#60a5fa15", border: "1px solid #60a5fa33",
                              color: "#60a5fa", borderRadius: 5, padding: "2px 7px",
                              fontFamily: MONO, fontSize: 9, fontWeight: 600,
                            }}>IN {inFields}</span>
                            <span style={{
                              background: "#f8717115", border: "1px solid #f8717133",
                              color: "#f87171", borderRadius: 5, padding: "2px 7px",
                              fontFamily: MONO, fontSize: 9, fontWeight: 600,
                            }}>OUT {outFields}</span>
                          </div>

                          {/* Method pills */}
                          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                            {[...new Set(spec.endpoints.map(e => e.method))].slice(0, 4).map(m => (
                              <MethodChip key={m} method={m} size="xs" />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dependency preview */}
                  {selSpecNames.length > 1 && (() => {
                    const sel = loadedSpecs.filter(s => selSpecNames.includes(s.fileName));
                    const depPairs: { from: string; to: string }[] = [];
                    for (const s of sel) {
                      for (const dep of s.dependencies || []) {
                        const depSpec = sel.find(x => x.schemaName === dep || x.resourceName === dep);
                        if (depSpec && depSpec.fileName !== s.fileName) {
                          depPairs.push({ from: depSpec.title, to: s.title });
                        }
                      }
                    }
                    if (depPairs.length === 0) return null;
                    return (
                      <div style={{
                        marginTop: 10, padding: "10px 14px", borderRadius: 8,
                        background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)"
                      }}>
                        <SLabel>Detected dependencies</SLabel>
                        {depPairs.map((p, i) => (
                          <div key={i} style={{
                            fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)",
                            display: "flex", alignItems: "center", gap: 6, marginBottom: 3
                          }}>
                            <span style={{ color: "#34d399", fontWeight: 700 }}>{p.from}</span>
                            <span>→ ID injected into →</span>
                            <span style={{ color: "#60a5fa", fontWeight: 700 }}>{p.to}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="capi-wizard-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "home", wizMode: null })}>← Back</button>
                  <button
                    className="capi-wizard-btn capi-wizard-btn--run"
                    disabled={selSpecNames.length === 0}
                    onClick={this.goToData}
                    style={{ opacity: selSpecNames.length === 0 ? 0.4 : 1 }}>
                    Next: Synthetic Data → ({selSpecNames.length} selected)
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                DSG 2 — SYNTHETIC DATA PREVIEW + TEST COUNT
            ══════════════════════════════════════════ */}
            {wizStep === "data" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PhaseBanner
                  color="#34d399" icon="⬡" title="API Data Management — Synthetic Generator"
                  desc="IN and IN·OUT fields are auto-detected from the spec schemas. Values are generated using banking-domain heuristics. OUT (readOnly) fields are excluded — the server produces those."
                />

                {/* ── Number of Test Runs card — ApiWorkflowTab style ── */}
                <div style={{ borderRadius: 10, border: "1px solid var(--cs-border)", overflow: "hidden" }}>
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
                        color: "var(--cs-text)", letterSpacing: 0.3,
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
                        textAlign: "right" as const, outline: "none",
                      }} />
                  </div>
                  {/* Slider + presets */}
                  <div style={{ padding: "12px 14px 14px", background: "var(--cs-bg)" }}>
                    <input type="range" min={1} max={2000} value={testCount}
                      onChange={e => this.setState({ testCount: +e.target.value })}
                      style={{ width: "100%", accentColor: "var(--cs-accent)", marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 6 }}>
                      {[1, 5, 10, 50, 100, 500, 1000, 2000].map(n => (
                        <button key={n} onClick={() => this.setState({ testCount: n })} style={{
                          background: testCount === n ? "#34d39918" : "var(--cs-surface-2)",
                          border: `1px solid ${testCount === n ? "#34d399" : "var(--cs-border)"}`,
                          color: testCount === n ? "#34d399" : "var(--cs-muted)",
                          borderRadius: 6, padding: "3px 11px", fontFamily: MONO, fontSize: 11,
                          cursor: "pointer", fontWeight: testCount === n ? 700 : 400,
                        }}>{n >= 1000 ? `${n / 1000}k` : n}</button>
                      ))}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", opacity: 0.7 }}>
                      {testCount === 1 ? "Single test run" : `${testCount} test runs — each run executes the full plan once`}
                    </div>
                  </div>
                </div>

                {/* Per-spec field breakdown */}
                {selectedSpecs.map(spec => {
                  const pathParamSet = new Set(spec.pathParams || []);
                  const inFields = spec.fields.filter(f =>
                    !f.readOnly && !(pathParamSet.has(f.name)) && !f.isParam
                  );
                  const outFields = spec.fields.filter(f => f.readOnly);
                  if (inFields.length === 0) return null;
                  return (
                    <div key={spec.fileName}>
                      <SLabel>{spec.title} — {inFields.length} input fields</SLabel>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                        {inFields.slice(0, 12).map(f => (
                          <span key={f.name} style={{
                            background: f.writeOnly ? "#60a5fa15" : "#34d39912",
                            border: `1px solid ${f.writeOnly ? "#60a5fa33" : "#34d39930"}`,
                            color: f.writeOnly ? "#60a5fa" : "#34d399",
                            borderRadius: 5, padding: "2px 8px",
                            fontFamily: MONO, fontSize: 10, fontWeight: 600,
                          }}>
                            {f.name}
                            <span style={{ opacity: 0.6, marginLeft: 4, fontSize: 9 }}>{f.type}</span>
                          </span>
                        ))}
                        {inFields.length > 12 && (
                          <span style={{
                            fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
                            padding: "2px 8px", alignSelf: "center"
                          }}>
                            +{inFields.length - 12} more
                          </span>
                        )}
                      </div>
                      {outFields.length > 0 && (
                        <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", opacity: 0.6 }}>
                          {outFields.length} OUT fields skipped (readOnly — server-generated)
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Synth preview table */}
                {synthPreviews.length > 0 && Object.keys(synthPreviews[0]).length > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <SLabel style={{ marginBottom: 0 }}>Sample generated payload ({selectedSpecs[0]?.title})</SLabel>
                      <button onClick={this.refreshPreviews}
                        style={{
                          background: "transparent", border: "1px solid var(--cs-border)",
                          color: "#34d399", borderRadius: 6, padding: "3px 10px",
                          fontFamily: MONO, fontSize: 11, cursor: "pointer"
                        }}>
                        ↻ Regenerate
                      </button>
                    </div>
                    <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid var(--cs-border-sub)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--cs-bg)" }}>
                        <thead>
                          <tr>
                            {Object.keys(synthPreviews[0]).slice(0, 6).map(k => (
                              <th key={k} style={{
                                padding: "7px 12px", background: "var(--cs-surface-2)",
                                fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)",
                                textTransform: "uppercase", letterSpacing: 0.7,
                                borderBottom: "1px solid var(--cs-border-sub)", textAlign: "left", whiteSpace: "nowrap",
                              }}>{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {synthPreviews.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--cs-bg)" : "var(--cs-surface)" }}>
                              {Object.entries(row).slice(0, 6).map(([k, v]) => {
                                const d = v == null ? "—"
                                  : typeof v === "object" ? ((v as any).ident || (v as any).id || JSON.stringify(v))
                                    : String(v);
                                return (
                                  <td key={k} title={d} style={{
                                    padding: "7px 12px", fontFamily: MONO, fontSize: 11,
                                    color: "var(--cs-text)", borderBottom: "1px solid var(--cs-border-sub)",
                                    maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}>{d}</td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", marginTop: 5, opacity: 0.6 }}>
                      Fresh values generated per request at execution time
                    </div>
                  </div>
                )}

                <div className="capi-wizard-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "api-select" })}>← Back</button>
                  <button className="capi-wizard-btn capi-wizard-btn--run"
                    onClick={() => this.setState({ wizStep: "flow" })}>
                    Next: Execution Flow →
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                DSG 3 — EXECUTION FLOW REVIEW
            ══════════════════════════════════════════ */}
            {wizStep === "flow" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PhaseBanner
                  color="#fb923c" icon="▶" title="Execution Flow"
                  desc={`${dynPlan.length} API calls ordered by dependency graph and HTTP method logic (POST → GET → PATCH → DELETE). IDs produced by each POST are automatically chained into subsequent calls.`}
                />

                {/* ── Execution Mode Selector ── */}
                {(() => {
                  const { execMode, flowTimeout } = this.state;
                  const isFlow = execMode === "flow";
                  return (
                    <div style={{
                      borderRadius: 10, border: "1px solid var(--cs-border)",
                      overflow: "hidden",
                    }}>
                      {/* Header */}
                      <div style={{
                        padding: "8px 14px",
                        background: "var(--cs-surface-2)",
                        borderBottom: "1px solid var(--cs-border-sub)",
                        fontFamily: MONO, fontSize: 10, fontWeight: 700,
                        color: "var(--cs-dim)", letterSpacing: 0.5,
                      }}>
                        EXECUTION MODE
                      </div>

                      {/* Two buttons row */}
                      <div style={{ display: "flex", padding: "10px 12px", gap: 8, background: "var(--cs-bg)" }}>

                        {/* ── Flow (default) ── */}
                        <button
                          onClick={() => this.setState({ execMode: "flow" })}
                          style={{
                            flex: 1, padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                            fontFamily: MONO, fontSize: 10, fontWeight: 800, textAlign: "left" as const,
                            transition: "all .15s",
                            background: isFlow
                              ? "linear-gradient(135deg, #7a4a00, #f59e0b)"
                              : "var(--cs-surface-2)",
                            border: `1.5px solid ${isFlow ? "#f59e0b" : "var(--cs-border)"}`,
                            color: isFlow ? "#0a0800" : "var(--cs-muted)",
                            boxShadow: isFlow ? "0 0 12px #f59e0b44" : "none",
                          }}
                          onMouseEnter={e => {
                            if (isFlow) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px #f59e0b66";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = isFlow ? "0 0 12px #f59e0b44" : "none";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            {isFlow && <span style={{ fontSize: 9 }}>●</span>}
                            <span>▶ Execution Flow</span>
                            {isFlow && (
                              <span style={{
                                fontSize: 8, background: "#0a080044", borderRadius: 3,
                                padding: "1px 5px", marginLeft: "auto",
                              }}>DEFAULT</span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 9, fontWeight: 400, lineHeight: 1.5,
                            color: isFlow ? "#0a080099" : "var(--cs-dim)", marginTop: 2,
                          }}>
                            {dynPlan.length} calls · dependency graph · POST→GET→PATCH→DELETE.
                            IDs from each POST auto-chained into next call.
                            Each request waits for the previous response.
                          </div>
                        </button>

                        {/* ── Independent ── */}
                        <button
                          onClick={() => this.setState({ execMode: "independent" })}
                          style={{
                            flex: 1, padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                            fontFamily: MONO, fontSize: 10, fontWeight: 800, textAlign: "left" as const,
                            transition: "all .15s",
                            background: !isFlow
                              ? "#0d2e2b"
                              : "var(--cs-surface-2)",
                            border: `1.5px solid ${!isFlow ? "#95d7d1" : "var(--cs-border)"}`,
                            color: !isFlow ? "#95d7d1" : "var(--cs-muted)",
                            boxShadow: !isFlow ? "0 0 12px #95d7d133" : "none",
                          }}
                          onMouseEnter={e => {
                            if (!isFlow) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px #95d7d155";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = !isFlow ? "0 0 12px #95d7d133" : "none";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            {!isFlow && <span style={{ fontSize: 9 }}>●</span>}
                            <span style={{ color: !isFlow ? "#95d7d1" : "var(--cs-muted)" }}>
                              ⊞ Independent
                            </span>
                          </div>
                          <div style={{
                            fontSize: 9, fontWeight: 400, lineHeight: 1.5,
                            color: !isFlow ? "#95d7d188" : "var(--cs-dim)", marginTop: 2,
                          }}>
                            Each API runs individually with synthetic data.
                            No dependency chain — no waiting for other responses.
                            Requests execute in parallel using generated payloads.
                          </div>
                        </button>
                      </div>

                      {/* Timeout field — only visible in flow mode */}
                      {isFlow && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 14px",
                          background: "#f59e0b08",
                          borderTop: "1px solid #f59e0b22",
                        }}>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: "#f59e0b88", fontWeight: 700, letterSpacing: 0.5 }}>
                            ⏱ STEP TIMEOUT
                          </span>
                          <input
                            type="number" min={1} max={120} value={flowTimeout}
                            onChange={e => this.setState({ flowTimeout: Math.min(120, Math.max(1, +e.target.value || 15)) })}
                            style={{
                              width: 52, padding: "3px 7px", borderRadius: 5,
                              background: "var(--cs-bg)", border: "1px solid #f59e0b55",
                              color: "#f59e0b", fontFamily: MONO, fontSize: 12, fontWeight: 700,
                              textAlign: "center" as const, outline: "none",
                            }}
                          />
                          <span style={{ fontFamily: MONO, fontSize: 9, color: "#f59e0b66" }}>seconds per request</span>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", marginLeft: "auto" }}>
                            max {flowTimeout * dynPlan.length}s total
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Execution plan */}
                <div>
                  <SLabel>Execution sequence — {dynPlan.length} steps · {testCount} run{testCount > 1 ? "s" : ""}</SLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {dynPlan.map((step, i) => {
                      const col = METHOD_COLORS[step.method] || "#8b949e";
                      const hasDeps = step.dependsOnIds.length > 0;
                      const produces = step.producesId;
                      const needsId = step.needsIdFrom.length > 0;
                      const inFieldCount = Object.keys(step.synthBody).length;
                      return (
                        <div key={step.id} style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "10px 13px", borderRadius: 8,
                          background: "var(--cs-surface)", border: `1px solid ${col}20`,
                          borderLeft: `3px solid ${col}80`,
                        }}>
                          {/* Step number */}
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                            background: col + "20", border: `1.5px solid ${col}44`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: MONO, fontSize: 10, fontWeight: 800, color: col
                          }}>
                            {i + 1}
                          </div>

                          {/* Method + summary */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                              <MethodChip method={step.method} />
                              <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--cs-text)", fontWeight: 600 }}>
                                {step.summary}
                              </span>
                            </div>
                            <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <span>{step.spec.resourceName}</span>
                              {inFieldCount > 0 && (
                                <span style={{ color: "#34d399" }}>⬡ {inFieldCount} synth fields</span>
                              )}
                              {hasDeps && (
                                <span style={{ color: "#60a5fa" }}>
                                  ← needs ID from: {step.dependsOnIds.map(d => d.split("__")[0]).join(", ")}
                                </span>
                              )}
                              {produces && (
                                <span style={{ color: col }}>→ produces {step.spec.resourceName}_id</span>
                              )}
                              {needsId && !produces && (
                                <span style={{ color: "#fb923c" }}>
                                  uses {step.needsIdFrom[0]}_id in path
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dependency chain summary */}
                {(() => {
                  const producers = dynPlan.filter(s => s.producesId);
                  const consumers = dynPlan.filter(s => s.dependsOnIds.length > 0);
                  if (producers.length === 0 && consumers.length === 0) return null;
                  return (
                    <div style={{
                      padding: "12px 14px", borderRadius: 8,
                      background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)"
                    }}>
                      <SLabel>ID chaining</SLabel>
                      {producers.map(p => {
                        const deps = dynPlan.filter(s => s.dependsOnIds.includes(p.id));
                        if (deps.length === 0) return null;
                        const col = METHOD_COLORS[p.method];
                        return (
                          <div key={p.id} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", marginBottom: 4
                          }}>
                            <span style={{ color: col, fontWeight: 700 }}>
                              {p.spec.resourceName}_id
                            </span>
                            <span>→</span>
                            {deps.map(d => (
                              <span key={d.id} style={{ color: "var(--cs-text)", fontWeight: 600 }}>
                                {d.spec.resourceName} {d.method}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="capi-wizard-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "data" })}>← Back</button>
                  <button className="capi-wizard-btn capi-wizard-btn--run"
                    onClick={this.execDynPlan}>
                    {this.state.execMode === "flow"
                      ? `▶ Execute Flow · ${dynPlan.length} steps × ${testCount} run${testCount > 1 ? "s" : ""}`
                      : `⊞ Execute Independent · ${dynPlan.length} APIs × ${testCount} run${testCount > 1 ? "s" : ""}`
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STATIC — CONFIGURE
            ══════════════════════════════════════════ */}
            {wizStep === "configure" && selStaticCase && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{
                  padding: "12px 15px", borderRadius: 10, background: "var(--cs-surface-2)",
                  border: "1px solid var(--cs-border-sub)"
                }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 14, fontWeight: 700,
                    color: "var(--cs-text)", marginBottom: 5
                  }}>
                    {selStaticCase.icon} {selStaticCase.title}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--cs-muted)", lineHeight: 1.55 }}>
                    {selStaticCase.desc}
                  </div>
                </div>

                {selStaticCase.params.map(p => (
                  <div key={p.key} className="capi-wizard-field">
                    <label className="capi-wizard-field__label">{p.label}</label>
                    {p.type === "select" ? (
                      <select className="capi-wizard-field__select"
                        value={staticParams[p.key]}
                        onChange={e => this.setState(s => ({ staticParams: { ...s.staticParams, [p.key]: e.target.value } }))}>
                        {(p as any).options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : p.type === "number" ? (
                      <input type="number" className="capi-wizard-field__input"
                        value={staticParams[p.key]} min={(p as any).min} max={(p as any).max}
                        onChange={e => this.setState(s => ({ staticParams: { ...s.staticParams, [p.key]: +e.target.value } }))} />
                    ) : (
                      <input type="text" className="capi-wizard-field__input"
                        value={staticParams[p.key]}
                        onChange={e => this.setState(s => ({ staticParams: { ...s.staticParams, [p.key]: e.target.value } }))} />
                    )}
                  </div>
                ))}

                <div className="capi-wizard-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "home", wizMode: null, selStaticCase: null })}>
                    ← Back
                  </button>
                  <button className="capi-wizard-btn capi-wizard-btn--run"
                    onClick={this.execStaticPlan}>▶ Execute</button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                RUNNING  (shared DSG + static)
            ══════════════════════════════════════════ */}
            {wizStep === "running" && (
              <div>
                <div className="capi-wizard-running-header">
                  <div className="capi-wizard-running-icon">⚙️</div>
                  <div className="capi-wizard-running-title">
                    {wizMode === "dsg" ? `Executing ${dynPlan.length} API steps…` : "Executing…"}
                  </div>
                  {wizMode === "dsg" && testCount > 1 && (
                    <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-dim)", marginTop: 4 }}>
                      {Math.min(testCount, 5)} of {testCount} runs — chaining IDs between POST → GET/PATCH/DELETE
                    </div>
                  )}
                </div>
                <div className="capi-wizard-steps">
                  {execLog.map((e: ExecEntry, i: number) => {
                    const isRun = e.status === "running";
                    const cls = isRun ? "running" : e.ok ? "ok" : "fail";
                    return (
                      <div key={i} className={`capi-wizard-step capi-wizard-step--${cls}`}>
                        <span className="capi-wizard-step__num">{e.step}</span>
                        <span className="capi-wizard-step__icon">{isRun ? "⏳" : e.ok ? "✅" : "❌"}</span>
                        <span className="capi-wizard-step__label">{e.label}</span>
                        {!isRun && (<><StatusBadge status={e.status} /><span className="capi-wizard-step__lat">{e.latency}ms</span></>)}
                      </div>
                    );
                  })}
                  <div ref={this.logRef} />
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                REPORT  (shared)
            ══════════════════════════════════════════ */}
            {wizStep === "report" && (
              <div className="capi-wizard-results">

                <div style={{
                  padding: "11px 15px", borderRadius: 10, marginBottom: 4,
                  background: "#a78bfa10", border: "1px solid #a78bfa33"
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color: "#a78bfa", marginBottom: 4 }}>
                    📊 Report Management
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)" }}>
                    {wizMode === "dsg"
                      ? `${selectedSpecs.length} API${selectedSpecs.length > 1 ? "s" : ""} · ${dynPlan.length} steps · ${testCount} configured run${testCount > 1 ? "s" : ""}`
                      : selStaticCase?.title}
                    {" · "}{execResults.length} calls executed · {pct}% success
                  </div>
                </div>

                {/* Stats */}
                <div className="capi-wizard-stats">
                  {([
                    { value: totalOk, label: "✓ PASS", mod: "ok" },
                    { value: totalFail, label: "✗ FAIL", mod: "fail" },
                    { value: execResults.length, label: "Total", mod: "total" },
                    { value: avgLat + "ms", label: "Avg Lat", mod: "latency" },
                  ] as const).map(({ value, label, mod }) => (
                    <div key={label} className={`capi-wizard-stat capi-wizard-stat--${mod}`}>
                      <div className="capi-wizard-stat__value">{value}</div>
                      <div className="capi-wizard-stat__label">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Success bar */}
                <div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", marginBottom: 5
                  }}>
                    <span>Success rate</span>
                    <span style={{ fontWeight: 700, color: pctCol }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--cs-surface-2)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4, width: `${pct}%`,
                      background: pctCol, transition: "width .6s ease"
                    }} />
                  </div>
                </div>

                {/* DSG: method breakdown */}
                {wizMode === "dsg" && (
                  <div>
                    <SLabel>By HTTP method</SLabel>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(["POST", "GET", "PATCH", "PUT", "DELETE"] as const)
                        .map(m => {
                          const mResults = execResults.filter(r => r.method === m);
                          if (mResults.length === 0) return null;
                          const ok = mResults.filter(r => r.ok).length;
                          const col = METHOD_COLORS[m];
                          return (
                            <div key={m} style={{
                              padding: "8px 13px", borderRadius: 8,
                              background: col + "0a", border: `1px solid ${col}30`,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                <MethodChip method={m} size="xs" />
                                <span style={{ fontFamily: MONO, fontSize: 10, color: col, fontWeight: 700 }}>
                                  {ok}/{mResults.length}
                                </span>
                              </div>
                              <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>
                                {mResults.length > 0 ? Math.round(mResults.reduce((a, r) => a + r.latency, 0) / mResults.length) : 0}ms avg
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Step results */}
                <div className="capi-wizard-result-list">
                  <SLabel>Step results</SLabel>
                  {execResults.map((r: ExecEntry, i: number) => <ResultRow key={i} r={r} i={i} />)}
                </div>

                {/* Actions */}
                <div className="capi-wizard-result-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--new" onClick={this.reset}>
                    ← New Test
                  </button>
                  {wizMode === "dsg" && (
                    <button className="capi-wizard-btn capi-wizard-btn--back"
                      onClick={() => this.setState({ wizStep: "flow" })}>← Change Flow</button>
                  )}
                  <button className="capi-wizard-btn capi-wizard-btn--rerun"
                    onClick={wizMode === "dsg" ? this.execDynPlan : this.execStaticPlan}>
                    ↻ Re-run
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }
}
