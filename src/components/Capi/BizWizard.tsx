import React, { createRef } from "react";
import { SYNTH, rest, ApiSpec } from "./utils";
import { MethodBadge, StatusBadge, ResultRow } from "./AtomComponents";
import "./capi-wizard.scss";

// ═══════════════════════════════════════════════════════════════
// BUSINESS CASE CATALOG
// ═══════════════════════════════════════════════════════════════
const BCASE_CATALOG = [
  {
    id: "client_onboarding", cat: "Client Management", icon: "👤",
    title: "Client Onboarding",
    desc: "Onboarding completo di un nuovo cliente: creazione anagrafica, indirizzo, documento identità, portafoglio di base.",
    apis: ["obj-addrs","obj-clients","obj-portfolios"],
    steps: [
      { id: "s1", label: "Crea indirizzo cliente",  method: "POST", resource: "obj-addrs", synth: "address" },
      { id: "s2", label: "Verifica indirizzo creato", method: "GET", resource: "obj-addrs", dep: "s1" },
      { id: "s3", label: "Lista indirizzi cliente",  method: "GET", resource: "obj-addrs", params: { limit: 10 } },
    ],
    params: [
      { key: "clientName",   label: "Nome Cliente", type: "text",   default: "Marco Rossi" },
      { key: "country",      label: "Paese",        type: "select", options: ["CH","DE","IT","FR","GB","US"], default: "CH" },
      { key: "numAddresses", label: "N. Indirizzi", type: "number", min: 1, max: 10, default: 1 },
    ],
    riskLevel: "LOW", domains: ["CRM","KYC"],
  },
  {
    id: "address_crud", cat: "Client Management", icon: "📋",
    title: "CRUD Indirizzi Completo",
    desc: "Test completo Create-Read-Update-Delete su oggetti indirizzo.",
    apis: ["obj-addrs"],
    steps: [
      { id: "s1", label: "Crea indirizzo",        method: "POST",   resource: "obj-addrs", synth: "address" },
      { id: "s2", label: "Leggi indirizzo creato", method: "GET",   resource: "obj-addrs", dep: "s1" },
      { id: "s3", label: "Aggiorna indirizzo",     method: "PATCH", resource: "obj-addrs", dep: "s1", patchFields: ["city","elAddr"] },
      { id: "s4", label: "Verifica aggiornamento", method: "GET",   resource: "obj-addrs", dep: "s1" },
      { id: "s5", label: "Elimina indirizzo",      method: "DELETE",resource: "obj-addrs", dep: "s1" },
    ],
    params: [
      { key: "numRecords", label: "N. Record da testare", type: "number", min: 1, max: 20, default: 3 },
      { key: "addrType",   label: "Tipo Indirizzo",       type: "select", options: ["MAIL","PHYS"], default: "MAIL" },
    ],
    riskLevel: "LOW", domains: ["Data Quality","Testing"],
  },
  {
    id: "load_test", cat: "Performance", icon: "⚡",
    title: "Load Test Endpoint",
    desc: "Test di carico su endpoint GET con N chiamate parallele.",
    apis: ["obj-addrs"],
    steps: [
      { id: "s1", label: "GET ripetuto N volte", method: "GET", resource: "obj-addrs", params: { limit: 10 } },
    ],
    params: [
      { key: "numRequests", label: "N. Richieste", type: "number", min: 10, max: 100, default: 20 },
    ],
    riskLevel: "HIGH", domains: ["Performance","SRE"],
  },
  {
    id: "error_handling", cat: "API Quality", icon: "⚠️",
    title: "Test Error Handling",
    desc: "Verifica corretta gestione errori: 404 not found, 400 bad request.",
    apis: ["obj-addrs"],
    steps: [
      { id: "s1", label: "GET ID inesistente (404)",    method: "GET",    resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s3", label: "PATCH ID inesistente (404)",  method: "PATCH",  resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s4", label: "DELETE ID inesistente (404)", method: "DELETE", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
    ],
    params: [
      { key: "includeEdgeCases", label: "Includi Edge Cases", type: "boolean", default: true },
    ],
    riskLevel: "LOW", domains: ["Resilience","API Quality"],
  },
];

const CAT_COLORS: Record<string, string> = {
  "Client Management": "#61afef",
  "Performance":       "#e06c75",
  "API Quality":       "#56b6c2",
  "Data Quality":      "#e5c07b",
};

// ═══════════════════════════════════════════════════════════════
// BIZ WIZARD  — multi-step business case executor
// ═══════════════════════════════════════════════════════════════
interface BizWizardProps {
  onClose:      () => void;
  loadedSpecs:  ApiSpec[];
}

interface BizWizardState {
  wizStep:     "select" | "configure" | "running" | "results";
  selCase:     typeof BCASE_CATALOG[0] | null;
  wizParams:   Record<string, any>;
  execResults: any[];
  execLog:     any[];
  selCat:      string;
  running:     boolean;
}

export class BizWizard extends React.Component<BizWizardProps, BizWizardState> {
  state: BizWizardState = {
    wizStep: "select", selCase: null, wizParams: {},
    execResults: [], execLog: [], selCat: "ALL", running: false,
  };
  private logRef = createRef<HTMLDivElement>();

  componentDidUpdate(prevProps: BizWizardProps, prevState: BizWizardState) {
    if (prevState.execLog !== this.state.execLog) {
      this.logRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  private selectCase = (bc: typeof BCASE_CATALOG[0]) => {
    const defaults: Record<string, any> = {};
    bc.params.forEach(p => { defaults[p.key] = p.default; });
    this.setState({ selCase: bc, wizParams: defaults, wizStep: "configure" });
  };

  private execInSim = async () => {
    const { selCase, wizParams } = this.state;
    if (!selCase) return;
    this.setState({ wizStep: "running", running: true, execLog: [], execResults: [] });
    const results: any[] = [];
    let lastId: number | null = null;

    for (let i = 0; i < selCase.steps.length; i++) {
      const step = selCase.steps[i] as any;
      const logEntry = { step: i + 1, label: step.label, method: step.method, status: "running", latency: 0, ok: null };
      this.setState(s => ({ execLog: [...s.execLog, logEntry] }));
      const t0 = Date.now();
      try {
        await new Promise(r => setTimeout(r, 40 + Math.random() * 60));
        let r: any = null;
        if (step.method === "POST" && step.synth === "address") {
          r = await rest.req("POST", "/" + step.resource, SYNTH.address());
          if (r.body?.id) lastId = r.body.id;
        } else if (step.method === "GET") {
          const path = step.dep && lastId ? `/${step.resource}/${lastId}` : `/${step.resource}`;
          r = await rest.req("GET", path, null, step.params || {});
        } else if (step.method === "PATCH") {
          r = await rest.req("PATCH", `/${step.resource}/${lastId || 0}`, SYNTH.address());
        } else if (step.method === "DELETE") {
          r = await rest.req("DELETE", `/${step.resource}/${lastId || 999999999}`);
        } else {
          r = { status: step.expectStatus || 200, body: {}, headers: {} };
        }
        const latency   = Date.now() - t0;
        const expectOk  = step.expectStatus ? r.status === step.expectStatus : r.status >= 200 && r.status < 300;
        const entry     = { step: i + 1, label: step.label, method: step.method, status: r.status, latency, result: r.body, headers: r.headers, ok: expectOk };
        results.push(entry);
        this.setState(s => ({ execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x) }));
      } catch (e: any) {
        const entry = { step: i + 1, label: step.label, method: step.method, status: "ERR", latency: Date.now() - t0, result: { error: e.message }, ok: false };
        results.push(entry);
        this.setState(s => ({ execLog: s.execLog.map((x, xi) => xi === s.execLog.length - 1 ? entry : x) }));
      }
    }
    this.setState({ execResults: results, running: false, wizStep: "results" });
  };

  render() {
    const { onClose }                                              = this.props;
    const { wizStep, selCase, wizParams, execResults, execLog, selCat } = this.state;
    const cats     = ["ALL", ...new Set(BCASE_CATALOG.map(b => b.cat))];
    const filtered = selCat === "ALL" ? BCASE_CATALOG : BCASE_CATALOG.filter(b => b.cat === selCat);
    const totalOk   = execResults.filter(r => r.ok).length;
    const totalFail = execResults.filter(r => !r.ok).length;
    const avgLat    = execResults.length
      ? Math.round(execResults.reduce((a, r) => a + (r.latency || 0), 0) / execResults.length) : 0;

    return (
      <div className="capi-wizard-overlay">
        <div className="capi-wizard">

          {/* ── Header ── */}
          <div className="capi-wizard__header">
            <span className="capi-wizard__header-icon">🧪</span>
            <div className="capi-wizard__titles">
              <div className="capi-wizard__title">Business Case Wizard</div>
              <div className="capi-wizard__subtitle">
                {selCase ? selCase.title : "Seleziona un caso"}
              </div>
            </div>
            <button className="capi-wizard__close" onClick={onClose}>✕</button>
          </div>

          {/* ── Body ── */}
          <div className="capi-wizard__body">

            {/* SELECT */}
            {wizStep === "select" && (
              <div>
                {/* Category filters */}
                <div className="capi-wizard-cats">
                  {cats.map(c => {
                    const isActive = selCat === c;
                    const catColor = CAT_COLORS[c] || "#58a6ff";
                    return (
                      <button
                        key={c}
                        onClick={() => this.setState({ selCat: c })}
                        className="capi-wizard-cat-btn"
                        style={isActive ? { borderColor: catColor, color: catColor } : undefined}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>

                {/* Case cards */}
                <div className="capi-wizard-cases">
                  {filtered.map(bc => {
                    const catColor = CAT_COLORS[bc.cat] || "#58a6ff";
                    return (
                      <div
                        key={bc.id}
                        className="capi-wizard-case"
                        onClick={() => this.selectCase(bc)}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = catColor)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                      >
                        <div className="capi-wizard-case__row">
                          <span className="capi-wizard-case__icon">{bc.icon}</span>
                          <div className="capi-wizard-case__info">
                            <div className="capi-wizard-case__title">{bc.title}</div>
                            <div className="capi-wizard-case__desc">{bc.desc}</div>
                            <div className="capi-wizard-case__tags">
                              {/* Category tag — color is dynamic */}
                              <span
                                className="capi-wizard-case__tag"
                                style={{
                                  background:  `${catColor}22`,
                                  borderColor: `${catColor}44`,
                                  color:        catColor,
                                }}
                              >
                                {bc.cat}
                              </span>
                              {/* Risk tag — uses modifier class */}
                              <span className={`capi-wizard-case__tag capi-wizard-case__tag--risk-${bc.riskLevel === "HIGH" ? "high" : "low"}`}>
                                ⚠ {bc.riskLevel}
                              </span>
                              {/* Domain tags */}
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

            {/* CONFIGURE */}
            {wizStep === "configure" && selCase && (
              <div className="capi-wizard-config">
                <div className="capi-wizard-config-info">
                  <div className="capi-wizard-config-info__title">{selCase.icon} {selCase.title}</div>
                  <div className="capi-wizard-config-info__desc">{selCase.desc}</div>
                </div>

                {selCase.params.map(p => (
                  <div key={p.key} className="capi-wizard-field">
                    <label className="capi-wizard-field__label">{p.label}</label>
                    {p.type === "select" ? (
                      <select
                        className="capi-wizard-field__select"
                        value={wizParams[p.key]}
                        onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: e.target.value } }))}
                      >
                        {(p as any).options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : p.type === "number" ? (
                      <input
                        type="number"
                        className="capi-wizard-field__input"
                        value={wizParams[p.key]}
                        min={(p as any).min}
                        max={(p as any).max}
                        onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: +e.target.value } }))}
                      />
                    ) : (
                      <input
                        type="text"
                        className="capi-wizard-field__input"
                        value={wizParams[p.key]}
                        onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: e.target.value } }))}
                      />
                    )}
                  </div>
                ))}

                <div className="capi-wizard-actions">
                  <button className="capi-wizard-btn capi-wizard-btn--back"
                    onClick={() => this.setState({ wizStep: "select" })}>← Indietro</button>
                  <button className="capi-wizard-btn capi-wizard-btn--run"
                    onClick={this.execInSim}>▶ Esegui nel Simulatore</button>
                </div>
              </div>
            )}

            {/* RUNNING */}
            {wizStep === "running" && (
              <div>
                <div className="capi-wizard-running-header">
                  <div className="capi-wizard-running-icon">⚙️</div>
                  <div className="capi-wizard-running-title">Esecuzione in corso...</div>
                </div>
                <div className="capi-wizard-steps">
                  {execLog.map((e: any, i: number) => {
                    const isRun     = e.status === "running";
                    const stateClass = isRun ? "running" : e.ok ? "ok" : "fail";
                    return (
                      <div key={i} className={`capi-wizard-step capi-wizard-step--${stateClass}`}>
                        <span className="capi-wizard-step__num">{e.step}</span>
                        <span className="capi-wizard-step__icon">{isRun ? "⏳" : e.ok ? "✅" : "❌"}</span>
                        <span className="capi-wizard-step__label">{e.label}</span>
                        {!isRun && (
                          <>
                            <StatusBadge status={e.status} />
                            <span className="capi-wizard-step__lat">{e.latency}ms</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div ref={this.logRef} />
                </div>
              </div>
            )}

            {/* RESULTS */}
            {wizStep === "results" && (
              <div className="capi-wizard-results">
                {/* Stats row */}
                <div className="capi-wizard-stats">
                  {(
                    [
                      { value: totalOk,           label: "✓ PASS",  mod: "ok"      },
                      { value: totalFail,          label: "✗ FAIL",  mod: "fail"    },
                      { value: execResults.length, label: "Totale",  mod: "total"   },
                      { value: avgLat + "ms",      label: "Latenza", mod: "latency" },
                    ] as const
                  ).map(({ value, label, mod }) => (
                    <div key={label} className={`capi-wizard-stat capi-wizard-stat--${mod}`}>
                      <div className="capi-wizard-stat__value">{value}</div>
                      <div className="capi-wizard-stat__label">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Result rows */}
                <div className="capi-wizard-result-list">
                  {execResults.map((r: any, i: number) => <ResultRow key={i} r={r} i={i} />)}
                </div>

                {/* Actions */}
                <div className="capi-wizard-result-actions">
                  <button
                    className="capi-wizard-btn capi-wizard-btn--new"
                    onClick={() => this.setState({ wizStep: "select", selCase: null, execResults: [], execLog: [] })}
                  >← Nuovo Test</button>
                  {totalFail === 0 && (
                    <button className="capi-wizard-btn capi-wizard-btn--rerun" onClick={this.execInSim}>
                      ▶ Riesegui
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }
}
