import React, { createRef } from "react";
import { SYNTH, rest, ApiSpec } from "./utils";
import { MethodBadge, StatusBadge, ResultRow } from "./AtomComponents";
import "./capi-wizard.scss";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type ExecMode = "e2e" | "independent";
type WizStep = "select" | "data" | "execution" | "running" | "report";

// ═══════════════════════════════════════════════════════════════
// CATALOG  — categories renamed per spec
// ═══════════════════════════════════════════════════════════════
const BCASE_CATALOG = [
  {
    id: "client_onboarding", cat: "API Data Management", icon: "👤",
    title: "Client Onboarding",
    desc: "Onboarding completo di un nuovo cliente: creazione anagrafica, indirizzo, documento identità, portafoglio di base.",
    apis: ["obj-addrs", "obj-clients", "obj-portfolios"],
    steps: [
      { id: "s1", label: "Crea indirizzo cliente", method: "POST", resource: "obj-addrs", synth: "address" },
      { id: "s2", label: "Verifica indirizzo creato", method: "GET", resource: "obj-addrs", dep: "s1" },
      { id: "s3", label: "Lista indirizzi cliente", method: "GET", resource: "obj-addrs", params: { limit: 10 } },
    ],
    params: [
      { key: "clientName", label: "Nome Cliente", type: "text", default: "Marco Rossi" },
      { key: "country", label: "Paese", type: "select", options: ["CH", "DE", "IT", "FR", "GB", "US"], default: "CH" },
      { key: "numAddresses", label: "N. Indirizzi", type: "number", min: 1, max: 10, default: 1 },
    ],
    riskLevel: "LOW", domains: ["CRM", "KYC"],
    synthFields: ["firstName", "name", "firm", "street", "city", "zip", "country", "elAddr"],
  },
  {
    id: "address_crud", cat: "API Data Management", icon: "📋",
    title: "CRUD Indirizzi Completo",
    desc: "Test completo Create-Read-Update-Delete su oggetti indirizzo.",
    apis: ["obj-addrs"],
    steps: [
      { id: "s1", label: "Crea indirizzo", method: "POST", resource: "obj-addrs", synth: "address" },
      { id: "s2", label: "Leggi indirizzo creato", method: "GET", resource: "obj-addrs", dep: "s1" },
      { id: "s3", label: "Aggiorna indirizzo", method: "PATCH", resource: "obj-addrs", dep: "s1", patchFields: ["city", "elAddr"] },
      { id: "s4", label: "Verifica aggiornamento", method: "GET", resource: "obj-addrs", dep: "s1" },
      { id: "s5", label: "Elimina indirizzo", method: "DELETE", resource: "obj-addrs", dep: "s1" },
    ],
    params: [
      { key: "numRecords", label: "N. Record da testare", type: "number", min: 1, max: 20, default: 3 },
      { key: "addrType", label: "Tipo Indirizzo", type: "select", options: ["MAIL", "PHYS"], default: "MAIL" },
    ],
    riskLevel: "LOW", domains: ["Data Quality", "Testing"],
    synthFields: ["firstName", "name", "street", "city", "zip", "country", "elAddr"],
  },
  {
    id: "load_test", cat: "Execution Management", icon: "⚡",
    title: "Load Test Endpoint",
    desc: "Test di carico su endpoint GET con N chiamate parallele.",
    apis: ["obj-addrs"],
    steps: [
      { id: "s1", label: "GET ripetuto N volte", method: "GET", resource: "obj-addrs", params: { limit: 10 } },
    ],
    params: [
      { key: "numRequests", label: "N. Richieste", type: "number", min: 10, max: 100, default: 20 },
    ],
    riskLevel: "HIGH", domains: ["Performance", "SRE"],
    synthFields: [],
  },
  {
    id: "error_handling", cat: "Report Management", icon: "⚠️",
    title: "Test Error Handling",
    desc: "Verifica corretta gestione errori: 404 not found, 400 bad request.",
    apis: ["obj-addrs"],
    steps: [
      { id: "s1", label: "GET ID inesistente (404)", method: "GET", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s3", label: "PATCH ID inesistente (404)", method: "PATCH", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s4", label: "DELETE ID inesistente (404)", method: "DELETE", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
    ],
    params: [
      { key: "includeEdgeCases", label: "Includi Edge Cases", type: "boolean", default: true },
    ],
    riskLevel: "LOW", domains: ["Resilience", "API Quality"],
    synthFields: [],
  },
];

const CAT_COLORS: Record<string, string> = {
  "API Data Management": "#34d399",
  "Execution Management": "#fb923c",
  "Report Management": "#a78bfa",
};

const MONO = "'JetBrains Mono','Fira Code',monospace";

// ═══════════════════════════════════════════════════════════════
// PROGRESS STEPPER
// ═══════════════════════════════════════════════════════════════
const PHASES: { key: WizStep; label: string; short: string }[] = [
  { key: "select", label: "Select Case", short: "Select" },
  { key: "data", label: "API Data Management", short: "Data" },
  { key: "execution", label: "Execution Mode", short: "Execution" },
  { key: "running", label: "Running", short: "Running" },
  { key: "report", label: "Report", short: "Report" },
];

function ProgressStepper({ current }: { current: WizStep }) {
  const idx = PHASES.findIndex(p => p.key === current);
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "12px 20px 10px", borderBottom: "1px solid var(--cs-border-sub)",
      background: "var(--cs-surface)", flexShrink: 0, gap: 0,
    }}>
      {PHASES.map((p, i) => {
        const done = i < idx;
        const active = i === idx;
        const col = active ? "var(--cs-accent)" : done ? "#34d399" : "var(--cs-border)";
        const txtCol = active ? "var(--cs-accent)" : done ? "#34d399" : "var(--cs-dim)";
        return (
          <React.Fragment key={p.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                border: `2px solid ${col}`,
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
            {i < PHASES.length - 1 && (
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
// SECTION BANNER  — colored phase identifier
// ═══════════════════════════════════════════════════════════════
function PhaseBanner({ color, icon, title, desc }: {
  color: string; icon: string; title: string; desc: string;
}) {
  return (
    <div style={{
      padding: "11px 15px", borderRadius: 10,
      background: color + "10", border: `1px solid ${color}33`,
      marginBottom: 2,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color, marginBottom: 4 }}>
        {icon} {title}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION LABEL
// ═══════════════════════════════════════════════════════════════
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, fontWeight: 700,
      color: "var(--cs-dim)", letterSpacing: 1,
      textTransform: "uppercase", marginBottom: 8,
    }}>{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
interface BizWizardProps { onClose: () => void; loadedSpecs: ApiSpec[]; }

interface BizWizardState {
  wizStep: WizStep;
  selCase: typeof BCASE_CATALOG[0] | null;
  wizParams: Record<string, any>;
  execMode: ExecMode;
  synthPreview: Record<string, any>[];
  execResults: any[];
  execLog: any[];
  selCat: string;
  running: boolean;
}

export class BizWizard extends React.Component<BizWizardProps, BizWizardState> {
  state: BizWizardState = {
    wizStep: "select", selCase: null, wizParams: {},
    execMode: "e2e", synthPreview: [],
    execResults: [], execLog: [], selCat: "ALL", running: false,
  };
  private logRef = createRef<HTMLDivElement>();

  componentDidUpdate(_: BizWizardProps, prev: BizWizardState) {
    if (prev.execLog !== this.state.execLog)
      this.logRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  private selectCase = (bc: typeof BCASE_CATALOG[0]) => {
    const defaults: Record<string, any> = {};
    bc.params.forEach(p => { defaults[p.key] = p.default; });
    this.setState({
      selCase: bc, wizParams: defaults, wizStep: "data",
      synthPreview: Array.from({ length: 3 }, () => SYNTH.address()),
    });
  };

  private execInSim = async () => {
    const { selCase, execMode } = this.state;
    if (!selCase) return;
    this.setState({ wizStep: "running", running: true, execLog: [], execResults: [] });
    const results: any[] = [];
    let lastId: number | null = null;

    for (let i = 0; i < selCase.steps.length; i++) {
      const step = selCase.steps[i] as any;
      const useChain = execMode === "e2e";
      this.setState(s => ({
        execLog: [...s.execLog,
        { step: i + 1, label: step.label, method: step.method, status: "running", latency: 0, ok: null }
        ]
      }));
      const t0 = Date.now();
      try {
        await new Promise(r => setTimeout(r, 40 + Math.random() * 80));
        let r: any;
        if (step.method === "POST" && step.synth === "address") {
          r = await rest.req("POST", "/" + step.resource, SYNTH.address());
          if (r.body?.id) lastId = r.body.id;
        } else if (step.method === "GET") {
          const path = useChain && step.dep && lastId ? `/${step.resource}/${lastId}` : `/${step.resource}`;
          r = await rest.req("GET", path, null, step.params || {});
        } else if (step.method === "PATCH") {
          const id = useChain && lastId ? lastId : (step.path ? step.path.replace("/", "") : 0);
          r = await rest.req("PATCH", `/${step.resource}/${id}`, SYNTH.address());
        } else if (step.method === "DELETE") {
          const id = useChain && lastId ? lastId : (step.path ? step.path.replace("/", "") : 999999999);
          r = await rest.req("DELETE", `/${step.resource}/${id}`);
        } else {
          r = { status: step.expectStatus || 200, body: {}, headers: {} };
        }
        const latency = Date.now() - t0;
        const expectOk = step.expectStatus ? r.status === step.expectStatus : r.status >= 200 && r.status < 300;
        const entry = { step: i + 1, label: step.label, method: step.method, status: r.status, latency, result: r.body, headers: r.headers, ok: expectOk };
        results.push(entry);
        this.setState(s => ({ execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x) }));
      } catch (e: any) {
        const entry = { step: i + 1, label: step.label, method: step.method, status: "ERR", latency: Date.now() - t0, result: { error: e.message }, ok: false };
        results.push(entry);
        this.setState(s => ({ execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x) }));
      }
    }
    this.setState({ execResults: results, running: false, wizStep: "report" });
  };

  render() {
    const { onClose } = this.props;
    const { wizStep, selCase, wizParams, execMode, synthPreview, execResults, execLog, selCat } = this.state;

    const cats = ["ALL", ...new Set(BCASE_CATALOG.map(b => b.cat))];
    const filtered = selCat === "ALL" ? BCASE_CATALOG : BCASE_CATALOG.filter(b => b.cat === selCat);
    const totalOk = execResults.filter(r => r.ok).length;
    const totalFail = execResults.filter(r => !r.ok).length;
    const avgLat = execResults.length ? Math.round(execResults.reduce((a, r) => a + (r.latency || 0), 0) / execResults.length) : 0;
    const pct = execResults.length ? Math.round((totalOk / execResults.length) * 100) : 0;
    const pctColor = pct === 100 ? "#34d399" : pct >= 50 ? "#f59e0b" : "#f87171";

    return (
      <div className="capi-wizard-overlay">
        <div className="capi-wizard" style={{ width: "min(640px, 96vw)", maxHeight: "92vh" }}>

          {/* ── Header ── */}
          <div className="capi-wizard__header">
            <span className="capi-wizard__header-icon">🧪</span>
            <div className="capi-wizard__titles">
              <div className="capi-wizard__title">Business Case Wizard</div>
              <div className="capi-wizard__subtitle">{selCase ? selCase.title : "Seleziona un caso"}</div>
            </div>
            <button className="capi-wizard__close" onClick={onClose}>✕</button>
          </div>

          {/* ── Stepper (hidden on select step) ── */}
          {wizStep !== "select" && <ProgressStepper current={wizStep} />}

          {/* ── Body ── */}
          <div className="capi-wizard__body">

            {/* ═══════════════════════════ SELECT ═══════════════════════════ */}
            {wizStep === "select" && (
              <div>
                <div className="capi-wizard-cats">
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
                  {filtered.map(bc => {
                    const col = CAT_COLORS[bc.cat] || "#58a6ff";
                    return (
                      <div key={bc.id} className="capi-wizard-case"
                        onClick={() => this.selectCase(bc)}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = col)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "")}>
                        <div className="capi-wizard-case__row">
                          <span className="capi-wizard-case__icon">{bc.icon}</span>
                          <div className="capi-wizard-case__info">
                            <div className="capi-wizard-case__title">{bc.title}</div>
                            <div className="capi-wizard-case__desc">{bc.desc}</div>
                            <div className="capi-wizard-case__tags">
                              <span className="capi-wizard-case__tag"
                                style={{ background: col + "22", borderColor: col + "44", color: col }}>
                                {bc.cat}
                              </span>
                              <span className={`capi-wizard-case__tag capi-wizard-case__tag--risk-${bc.riskLevel === "HIGH" ? "high" : "low"}`}>
                                ⚠ {bc.riskLevel}
                              </span>
                              {bc.domains.map(d => (
                                <span key={d} className="capi-wizard-case__tag capi-wizard-case__tag--domain">{d}</span>
                              ))}
                            </div>
                          </div>
                          <div className="capi-wizard-case__step-count">{bc.steps.length} step</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════════════════════ API DATA MANAGEMENT ═══════════════════════ */}
            {wizStep === "data" && selCase && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PhaseBanner
                  color="#34d399" icon="⬡" title="API Data Management"
                  desc="Synthetic test data is generated for all IN / IN·OUT fields of the selected APIs.
This data serves as the baseline input for every API request during execution."
                />

                {/* APIs */}
                <div>
                  <SLabel>APIs selected</SLabel>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {selCase.apis.map(api => (
                      <span key={api} style={{
                        background: "#34d39915", border: "1px solid #34d39940",
                        color: "#34d399", borderRadius: 6, padding: "4px 11px",
                        fontFamily: MONO, fontSize: 11, fontWeight: 600,
                      }}>{api}</span>
                    ))}
                  </div>
                </div>

                {/* Synth preview */}
                {selCase.synthFields.length > 0 ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <SLabel>Synthetic data preview</SLabel>
                      <button onClick={() => this.setState({ synthPreview: Array.from({ length: 3 }, () => SYNTH.address()) })}
                        style={{
                          background: "transparent", border: "1px solid var(--cs-border)",
                          color: "#34d399", borderRadius: 6, padding: "3px 10px",
                          fontFamily: MONO, fontSize: 11, cursor: "pointer", marginBottom: 8,
                        }}>↻ Regenerate</button>
                    </div>
                    <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid var(--cs-border-sub)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--cs-bg)" }}>
                        <thead>
                          <tr>
                            {selCase.synthFields.slice(0, 5).map(f => (
                              <th key={f} style={{
                                padding: "7px 12px", background: "var(--cs-surface-2)",
                                fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)",
                                textTransform: "uppercase", letterSpacing: 0.7,
                                borderBottom: "1px solid var(--cs-border-sub)", textAlign: "left",
                                whiteSpace: "nowrap",
                              }}>{f}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {synthPreview.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--cs-bg)" : "var(--cs-surface)" }}>
                              {selCase.synthFields.slice(0, 5).map(f => {
                                const v = row[f];
                                const d = v == null ? "—"
                                  : typeof v === "object" ? (v.ident || v.id || JSON.stringify(v))
                                    : String(v);
                                return (
                                  <td key={f} title={d} style={{
                                    padding: "7px 12px", fontFamily: MONO, fontSize: 11,
                                    color: "var(--cs-text)", borderBottom: "1px solid var(--cs-border-sub)",
                                    maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}>{d}</td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", marginTop: 5, opacity: 0.6 }}>
                      {selCase.synthFields.length} fields · {synthPreview.length} sample rows · fresh data generated per request at execution time
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: "13px 16px", borderRadius: 8,
                    background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
                    fontFamily: MONO, fontSize: 12, color: "var(--cs-muted)", lineHeight: 1.6,
                  }}>
                    ℹ This case uses existing or error-path data — no synthetic generation required.
                  </div>
                )}

                {/* Params */}
                {selCase.params.length > 0 && (
                  <div>
                    <SLabel>Parameters</SLabel>
                    {selCase.params.map(p => (
                      <div key={p.key} className="capi-wizard-field">
                        <label className="capi-wizard-field__label">{p.label}</label>
                        {p.type === "select" ? (
                          <select className="capi-wizard-field__select"
                            value={wizParams[p.key]}
                            onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: e.target.value } }))}>
                            {(p as any).options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : p.type === "number" ? (
                          <input type="number" className="capi-wizard-field__input"
                            value={wizParams[p.key]} min={(p as any).min} max={(p as any).max}
                            onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: +e.target.value } }))} />
                        ) : (
                          <input type="text" className="capi-wizard-field__input"
                            value={wizParams[p.key]}
                            onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: e.target.value } }))} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="capi-wizard-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "select" })}>← Back</button>
                  <button className="capi-wizard-btn capi-wizard-btn--run"
                    onClick={() => this.setState({ wizStep: "execution" })}>Next: Execution Mode →</button>
                </div>
              </div>
            )}

            {/* ═══════════════════════ EXECUTION MANAGEMENT ═══════════════════════ */}
            {wizStep === "execution" && selCase && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PhaseBanner
                  color="#fb923c" icon="▶" title="Execution Management"
                  desc="Define how the API calls in this case are executed — sequentially as a chained workflow,
or independently in isolation."
                />

                <SLabel>Execution mode</SLabel>

                {/* Mode cards */}
                <div style={{ display: "flex", gap: 10 }}>

                  {/* E2E */}
                  {([
                    {
                      key: "e2e" as ExecMode,
                      color: "#34d399",
                      label: "End-to-End Sequential",
                      icon: "🔗",
                      desc: "APIs run in sequence. Each call waits for the previous response — the returned ID or data is passed as input to the next step, simulating a real workflow.",
                    },
                    {
                      key: "independent" as ExecMode,
                      color: "#60a5fa",
                      label: "Independent",
                      icon: "⚡",
                      desc: "Each API runs independently using only the synthetic data generated. No dependency between calls — useful for load testing or isolated validation.",
                    },
                  ] as const).map(({ key, color, label, icon, desc }) => {
                    const active = execMode === key;
                    return (
                      <div key={key} onClick={() => this.setState({ execMode: key })}
                        style={{
                          flex: 1, border: `2px solid ${active ? color : color + "33"}`,
                          borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                          background: active ? color + "0e" : "var(--cs-surface)",
                          transition: "all .15s",
                        }}>
                        {/* Radio + title */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
                            border: `2px solid ${active ? color : "var(--cs-border)"}`,
                            background: active ? color : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0a0e1a" }} />}
                          </div>
                          <span style={{
                            fontFamily: MONO, fontSize: 12, fontWeight: 700,
                            color: active ? color : "var(--cs-text)"
                          }}>
                            {icon} {label}
                          </span>
                        </div>
                        <div style={{
                          fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)",
                          lineHeight: 1.6, marginBottom: 12, opacity: active ? 1 : 0.7
                        }}>
                          {desc}
                        </div>
                        {/* Flow diagram */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", opacity: active ? 1 : 0.35 }}>
                          {key === "e2e" ? (
                            selCase.steps.map((s, i) => (
                              <React.Fragment key={s.id}>
                                <span style={{
                                  background: color + "18", border: `1px solid ${color}44`,
                                  color, borderRadius: 5, padding: "2px 7px",
                                  fontFamily: MONO, fontSize: 10, fontWeight: 700,
                                }}>{s.method}</span>
                                {i < selCase.steps.length - 1 &&
                                  <span style={{ color, fontFamily: MONO, fontSize: 10 }}>→id→</span>}
                              </React.Fragment>
                            ))
                          ) : (
                            <>
                              <span style={{ color, fontFamily: MONO, fontSize: 10 }}>parallel:</span>
                              {selCase.steps.map(s => (
                                <span key={s.id} style={{
                                  background: color + "18", border: `1px solid ${color}44`,
                                  color, borderRadius: 5, padding: "2px 7px",
                                  fontFamily: MONO, fontSize: 10, fontWeight: 700,
                                }}>{s.method}</span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Execution plan */}
                <div>
                  <SLabel>Execution plan — {selCase.steps.length} calls</SLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {selCase.steps.map((s, i) => {
                      const col = execMode === "e2e" ? "#34d399" : "#60a5fa";
                      return (
                        <div key={s.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", borderRadius: 7,
                          background: "var(--cs-surface)", border: `1px solid ${col}22`,
                          borderLeft: `3px solid ${col}66`,
                        }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", width: 18, flexShrink: 0 }}>{i + 1}</span>
                          <span style={{
                            background: col + "18", color: col, border: `1px solid ${col}44`,
                            borderRadius: 4, padding: "1px 7px", fontFamily: MONO, fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }}>{s.method}</span>
                          <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--cs-text)", flex: 1 }}>{s.label}</span>
                          {execMode === "e2e" && (s as any).dep && (
                            <span style={{ fontFamily: MONO, fontSize: 9, color: col, opacity: 0.7, flexShrink: 0 }}>← uses prev id</span>
                          )}
                          {execMode === "independent" && (
                            <span style={{ fontFamily: MONO, fontSize: 9, color: "#60a5fa", opacity: 0.6, flexShrink: 0 }}>synth data</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="capi-wizard-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "data" })}>← Back</button>
                  <button className="capi-wizard-btn capi-wizard-btn--run"
                    onClick={this.execInSim}>
                    ▶ Execute {execMode === "e2e" ? "End-to-End" : "Independent"}
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════ RUNNING ═══════════════════════════ */}
            {wizStep === "running" && (
              <div>
                <div className="capi-wizard-running-header">
                  <div className="capi-wizard-running-icon">{execMode === "e2e" ? "🔗" : "⚡"}</div>
                  <div className="capi-wizard-running-title">
                    {execMode === "e2e" ? "End-to-End execution…" : "Independent execution…"}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-dim)", marginTop: 4 }}>
                    {execMode === "e2e"
                      ? "Chaining API responses as inputs to subsequent calls"
                      : "Each API running with synthetic data — no dependencies"}
                  </div>
                </div>
                <div className="capi-wizard-steps">
                  {execLog.map((e: any, i: number) => {
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

            {/* ═══════════════════════ REPORT MANAGEMENT ═══════════════════════ */}
            {wizStep === "report" && (
              <div className="capi-wizard-results">

                <PhaseBanner
                  color="#a78bfa" icon="📊" title="Report Management"
                  desc={`${selCase?.title} · ${execMode === "e2e" ? "End-to-End" : "Independent"} mode · ${execResults.length} API calls · ${pct}% success rate`}
                />

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
                    <span style={{ fontWeight: 700, color: pctColor }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--cs-surface-2)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4, width: `${pct}%`,
                      background: pctColor, transition: "width .6s ease",
                    }} />
                  </div>
                </div>

                {/* Execution sequence */}
                {execMode === "e2e" && execResults.length > 1 && (
                  <div>
                    <SLabel>Execution sequence</SLabel>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                      padding: "10px 14px", background: "var(--cs-surface)",
                      borderRadius: 8, border: "1px solid var(--cs-border-sub)",
                    }}>
                      {execResults.map((r, i) => (
                        <React.Fragment key={i}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{
                              background: r.ok ? "#34d39918" : "#f8717118",
                              border: `1px solid ${r.ok ? "#34d39944" : "#f8717144"}`,
                              color: r.ok ? "#34d399" : "#f87171",
                              borderRadius: 6, padding: "3px 9px",
                              fontFamily: MONO, fontSize: 10, fontWeight: 700,
                            }}>{r.method}</div>
                            <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", marginTop: 2 }}>{r.latency}ms</div>
                          </div>
                          {i < execResults.length - 1 && (
                            <span style={{ color: "#34d399", fontFamily: MONO, fontSize: 11 }}>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* API summary */}
                {selCase && (
                  <div>
                    <SLabel>API summary</SLabel>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {selCase.apis.map(api => {
                        const relevant = execResults.filter(r =>
                          selCase.steps.some(s => (s as any).resource === api && s.label === r.label)
                        );
                        const ok = relevant.filter(r => r.ok).length;
                        const fail = relevant.filter(r => !r.ok).length;
                        const n = relevant.length || execResults.length;
                        const good = fail === 0;
                        return (
                          <div key={api} style={{
                            padding: "9px 14px", borderRadius: 8,
                            background: good ? "#34d39908" : "#f8717108",
                            border: `1px solid ${good ? "#34d39930" : "#f8717130"}`,
                            display: "flex", flexDirection: "column", gap: 3,
                          }}>
                            <span style={{
                              fontFamily: MONO, fontSize: 12, fontWeight: 700,
                              color: good ? "#34d399" : "#f87171"
                            }}>{api}</span>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>
                              {ok} pass · {fail} fail · {n} calls
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step results */}
                <div className="capi-wizard-result-list">
                  <SLabel>Step results</SLabel>
                  {execResults.map((r: any, i: number) => <ResultRow key={i} r={r} i={i} />)}
                </div>

                {/* Actions */}
                <div className="capi-wizard-result-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--new"
                    onClick={() => this.setState({ wizStep: "select", selCase: null, execResults: [], execLog: [] })}>
                    ← New Test
                  </button>
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "execution" })}>
                    ← Change Mode
                  </button>
                  <button className="capi-wizard-btn capi-wizard-btn--rerun" onClick={this.execInSim}>
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
