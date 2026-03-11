import React, { createRef } from "react";
import { SYNTH, rest, ApiSpec } from "./utils";
import { MethodBadge, StatusBadge, ResultRow } from "./AtomComponents";

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
      { id: "s1", label: "Crea indirizzo cliente", method: "POST", resource: "obj-addrs", synth: "address" },
      { id: "s2", label: "Verifica indirizzo creato", method: "GET", resource: "obj-addrs", dep: "s1" },
      { id: "s3", label: "Lista indirizzi cliente", method: "GET", resource: "obj-addrs", params: { limit: 10 } },
    ],
    params: [
      { key: "clientName", label: "Nome Cliente", type: "text", default: "Marco Rossi" },
      { key: "country", label: "Paese", type: "select", options: ["CH","DE","IT","FR","GB","US"], default: "CH" },
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
      { id: "s1", label: "Crea indirizzo", method: "POST", resource: "obj-addrs", synth: "address" },
      { id: "s2", label: "Leggi indirizzo creato", method: "GET", resource: "obj-addrs", dep: "s1" },
      { id: "s3", label: "Aggiorna indirizzo", method: "PATCH", resource: "obj-addrs", dep: "s1", patchFields: ["city","elAddr"] },
      { id: "s4", label: "Verifica aggiornamento", method: "GET", resource: "obj-addrs", dep: "s1" },
      { id: "s5", label: "Elimina indirizzo", method: "DELETE", resource: "obj-addrs", dep: "s1" },
    ],
    params: [
      { key: "numRecords", label: "N. Record da testare", type: "number", min: 1, max: 20, default: 3 },
      { key: "addrType", label: "Tipo Indirizzo", type: "select", options: ["MAIL","PHYS"], default: "MAIL" },
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
      { id: "s1", label: "GET ID inesistente (404)", method: "GET", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s3", label: "PATCH ID inesistente (404)", method: "PATCH", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
      { id: "s4", label: "DELETE ID inesistente (404)", method: "DELETE", resource: "obj-addrs", path: "/999999999", expectStatus: 404 },
    ],
    params: [
      { key: "includeEdgeCases", label: "Includi Edge Cases", type: "boolean", default: true },
    ],
    riskLevel: "LOW", domains: ["Resilience","API Quality"],
  },
];

const CAT_COLORS: Record<string, string> = {
  "Client Management": "#61afef", "Performance": "#e06c75",
  "API Quality": "#56b6c2", "Data Quality": "#e5c07b",
};

// ═══════════════════════════════════════════════════════════════
// BIZ WIZARD  — multi-step business case executor
// ═══════════════════════════════════════════════════════════════
interface BizWizardProps {
  onClose: () => void;
  loadedSpecs: ApiSpec[];
}

interface BizWizardState {
  wizStep: "select" | "configure" | "running" | "results";
  selCase: typeof BCASE_CATALOG[0] | null;
  wizParams: Record<string, any>;
  execResults: any[];
  execLog: any[];
  selCat: string;
  running: boolean;
}

export class BizWizard extends React.Component<BizWizardProps, BizWizardState> {
  state: BizWizardState = {
    wizStep: "select",
    selCase: null,
    wizParams: {},
    execResults: [],
    execLog: [],
    selCat: "ALL",
    running: false,
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
    this.setState({ execResults: results, running: false, wizStep: "results" });
  };

  render() {
    const { onClose } = this.props;
    const { wizStep, selCase, wizParams, execResults, execLog, selCat, running } = this.state;
    const cats = ["ALL", ...new Set(BCASE_CATALOG.map(b => b.cat))];
    const filtered = selCat === "ALL" ? BCASE_CATALOG : BCASE_CATALOG.filter(b => b.cat === selCat);
    const totalOk = execResults.filter(r => r.ok).length;
    const totalFail = execResults.filter(r => !r.ok).length;
    const avgLat = execResults.length ? Math.round(execResults.reduce((a, r) => a + (r.latency || 0), 0) / execResults.length) : 0;

    return (
      <div style={{ position: "fixed", inset: 0, background: "#00000099", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 12, width: "min(560px,95vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "14px 18px", background: "linear-gradient(90deg,#0d1117,#161b22)", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🧪</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3" }}>Business Case Wizard</div>
              <div style={{ fontSize: 9, color: "#8b949e" }}>{selCase ? selCase.title : "Seleziona un caso"}</div>
            </div>
            <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "1px solid rgba(255,255,255,.2)", borderRadius: 5, color: "#fff", cursor: "pointer", fontSize: 14, width: 28, height: 28 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {/* SELECT */}
            {wizStep === "select" && (
              <div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {cats.map(c => (
                    <button key={c} onClick={() => this.setState({ selCat: c })} style={{ padding: "4px 10px", background: "none", border: `1px solid ${selCat === c ? (CAT_COLORS[c] || "#58a6ff") : "#30363d"}`, borderRadius: 4, color: selCat === c ? (CAT_COLORS[c] || "#58a6ff") : "#555", cursor: "pointer", fontSize: 9, fontFamily: "inherit", fontWeight: 600 }}>
                      {c}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filtered.map(bc => (
                    <div key={bc.id} onClick={() => this.selectCase(bc)} style={{ background: "#0a0e17", border: "1px solid #21262d", borderRadius: 8, padding: "12px 14px", cursor: "pointer", transition: "border-color .2s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = CAT_COLORS[bc.cat] || "#58a6ff")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#21262d")}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 18 }}>{bc.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#e6edf3", marginBottom: 3 }}>{bc.title}</div>
                          <div style={{ fontSize: 9, color: "#8b949e", lineHeight: 1.5 }}>{bc.desc}</div>
                          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 7, background: `${CAT_COLORS[bc.cat] || "#58a6ff"}22`, border: `1px solid ${CAT_COLORS[bc.cat] || "#58a6ff"}44`, color: CAT_COLORS[bc.cat] || "#58a6ff", borderRadius: 3, padding: "1px 5px" }}>{bc.cat}</span>
                            <span style={{ fontSize: 7, background: bc.riskLevel === "HIGH" ? "#f8514922" : "#21262d", border: `1px solid ${bc.riskLevel === "HIGH" ? "#f85149" : "#30363d"}44`, color: bc.riskLevel === "HIGH" ? "#f85149" : "#555", borderRadius: 3, padding: "1px 5px" }}>⚠ {bc.riskLevel}</span>
                            {bc.domains.map(d => <span key={d} style={{ fontSize: 7, background: "#161b22", border: "1px solid #21262d", color: "#555", borderRadius: 3, padding: "1px 5px" }}>{d}</span>)}
                          </div>
                        </div>
                        <div style={{ fontSize: 9, color: "#555", flexShrink: 0 }}>{bc.steps.length} step</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONFIGURE */}
            {wizStep === "configure" && selCase && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ padding: "10px 14px", background: "#0a0e17", border: "1px solid #21262d", borderRadius: 7 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#e6edf3", marginBottom: 4 }}>{selCase.icon} {selCase.title}</div>
                  <div style={{ fontSize: 9, color: "#8b949e" }}>{selCase.desc}</div>
                </div>
                {selCase.params.map(p => (
                  <div key={p.key}>
                    <label style={{ fontSize: 9, color: "#8b949e", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{p.label}</label>
                    {p.type === "select" ? (
                      <select value={wizParams[p.key]} onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: e.target.value } }))} style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", borderRadius: 5, padding: "7px 10px", fontSize: 11, fontFamily: "inherit" }}>
                        {(p as any).options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : p.type === "number" ? (
                      <input type="number" value={wizParams[p.key]} min={(p as any).min} max={(p as any).max} onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: +e.target.value } }))} style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", borderRadius: 5, padding: "7px 10px", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                    ) : (
                      <input type="text" value={wizParams[p.key]} onChange={e => this.setState(s => ({ wizParams: { ...s.wizParams, [p.key]: e.target.value } }))} style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", borderRadius: 5, padding: "7px 10px", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => this.setState({ wizStep: "select" })} style={{ flex: 1, background: "none", border: "1px solid #30363d", borderRadius: 6, color: "#8b949e", padding: 10, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>← Indietro</button>
                  <button onClick={this.execInSim} style={{ flex: 2, background: "linear-gradient(135deg,#0a1628,#0d2347)", border: "2px solid #3fb950", borderRadius: 6, color: "#3fb950", padding: 10, cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 700 }}>▶ Esegui nel Simulatore</button>
                </div>
              </div>
            )}

            {/* RUNNING */}
            {wizStep === "running" && (
              <div>
                <div style={{ textAlign: "center", padding: "20px 0 14px" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3", marginBottom: 4 }}>Esecuzione in corso...</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {execLog.map((e: any, i: number) => {
                    const isRun = e.status === "running";
                    const clr = isRun ? "#d29922" : e.ok ? "#3fb950" : "#f85149";
                    return (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 10px", background: "#0d1117", border: `1px solid ${clr}33`, borderRadius: 5, borderLeft: `3px solid ${clr}` }}>
                        <span style={{ fontSize: 9, color: "#555", width: 16, flexShrink: 0 }}>{e.step}</span>
                        <span style={{ fontSize: 16 }}>{isRun ? "⏳" : e.ok ? "✅" : "❌"}</span>
                        <span style={{ fontSize: 10, color: clr, flex: 1 }}>{e.label}</span>
                        {!isRun && <><StatusBadge status={e.status} /><span style={{ fontSize: 9, color: "#555" }}>{e.latency}ms</span></>}
                      </div>
                    );
                  })}
                  <div ref={this.logRef} />
                </div>
              </div>
            )}

            {/* RESULTS */}
            {wizStep === "results" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {[[totalOk, "✓ PASS", "#3fb950", "#0d2b0d"], [totalFail, "✗ FAIL", "#f85149", "#2b0d0d"], [execResults.length, "Totale", "#58a6ff", "#0d1e3a"], [avgLat + "ms", "Latenza", "#d29922", "#2b1f0d"]].map(([val, label, color, bg]: any) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2 }}>{val}</div>
                      <div style={{ fontSize: 8, color, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {execResults.map((r: any, i: number) => <ResultRow key={i} r={r} i={i} />)}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => this.setState({ wizStep: "select", selCase: null, execResults: [], execLog: [] })} style={{ flex: 1, background: "none", border: "1px solid #30363d", borderRadius: 6, color: "#8b949e", padding: 10, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>← Nuovo Test</button>
                  {totalFail === 0 && <button onClick={this.execInSim} style={{ flex: 1, background: "linear-gradient(135deg,#0a1628,#0d2347)", border: "2px solid #3fb950", borderRadius: 6, color: "#3fb950", padding: 10, cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 700 }}>▶ Riesegui</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
