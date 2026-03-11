import React from "react";
import { db, rest, SYNTH, ApiSpec, DEFAULT_SPEC } from "./utils";
import { FileUploadPanel } from "./FileUploadPanel";
import { ChatTab, ChatMessage } from "./ChatTab";
import { DebugTab, LogEntry } from "./DebugTab";
import { StoreTab } from "./StoreTab";
import { BizWizard } from "./BizWizard";

// ═══════════════════════════════════════════════════════════════
// SHARED PROPS — matches the shape used by GridItem, GridItemComp,
// GridItemScann, GridItemScannMobile and ApiTestToolAI in index.tsx
// ═══════════════════════════════════════════════════════════════
export interface CapiProps {
  homeBankingIdInitial: number;
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP — Avaloq API Test Simulator
// Broken down into React Class Components
// ═══════════════════════════════════════════════════════════════

interface AppState {
  tab: "apis" | "chat" | "debug" | "store";
  specs: ApiSpec[];
  history: ChatMessage[];
  log: LogEntry[];
  loading: boolean;
  showWizard: boolean;
  showReport: boolean;
  provider: string;
  ollamaUrl: string;
  tick: number;
  // runtime values synced from props (may be updated later via receiveDataFromJava)
  homeBankingId: number;
  socketPortLive: number;
  sessionIdLive: string;
  botJobId: number;
  botJobName: string;
}

export default class App extends React.Component<CapiProps, AppState> {
  // Initialise state from props so the component is usable as a drop-in
  // inside the existing index.tsx (same prop contract as GridItem et al.)
  constructor(props: CapiProps) {
    super(props);
    this.state = {
      tab: "apis",
      specs: [DEFAULT_SPEC],
      history: [],
      log: [],
      loading: false,
      showWizard: false,
      showReport: false,
      provider: "anthropic",
      ollamaUrl: "http://localhost:11434",
      tick: 0,
      homeBankingId: props.homeBankingIdInitial,
      socketPortLive: props.socketPort,
      sessionIdLive: props.sessionId,
      botJobId: props.botJobIdInitial,
      botJobName: props.botJobNameInitial,
    };
  }

  componentDidMount() {
    db.loadSpec(DEFAULT_SPEC);
  }

  // When the parent re-renders with updated props (e.g. after receiveDataFromJava),
  // sync the live values into local state.
  componentDidUpdate(prevProps: CapiProps) {
    const { homeBankingIdInitial, socketPort, sessionId, botJobIdInitial, botJobNameInitial } = this.props;
    if (
      prevProps.homeBankingIdInitial !== homeBankingIdInitial ||
      prevProps.socketPort !== socketPort ||
      prevProps.sessionId !== sessionId ||
      prevProps.botJobIdInitial !== botJobIdInitial ||
      prevProps.botJobNameInitial !== botJobNameInitial
    ) {
      this.setState({
        homeBankingId: homeBankingIdInitial,
        socketPortLive: socketPort,
        sessionIdLive: sessionId,
        botJobId: botJobIdInitial,
        botJobName: botJobNameInitial,
      });
    }
  }

  // ── AI call (Claude API via fetch) ──────────────────────────
  private callAI = async (
    userMsg: string,
    history: ChatMessage[]
  ): Promise<{ thought: string; actions: any[]; finalMessage: string }> => {
    const { provider, ollamaUrl, specs } = this.state;
    const specsSummary = specs
      .map(s => `API: ${s.title} | Endpoints: ${s.endpoints.map(e => `${e.method} ${e.path}`).join(", ")}`)
      .join("\n");

    const systemPrompt = `Sei un assistente Avaloq API. Hai accesso a queste API:\n${specsSummary}\n\nRisorse disponibili: ${Object.keys(db.stores).join(", ") || "obj-addrs"}\n\nRispondi SOLO con JSON valido:\n{"thought":"ragionamento breve","actions":[{"method":"GET|POST|PATCH|DELETE","path":"/resource[/id]","body":null,"params":{},"description":""}],"finalMessage":"risposta utente"}`;

    const messages = [
      ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userMsg },
    ];

    let rawText = "";

    if (provider === "ollama") {
      const resp = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen2.5:14b", messages: [{ role: "system", content: systemPrompt }, ...messages], stream: false }),
      });
      const d = await resp.json();
      rawText = d.message?.content || "";
    } else {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages,
        }),
      });
      const d = await resp.json();
      rawText = d.content?.[0]?.text || "";
    }

    try {
      return JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch {
      return {
        thought: "Parsed fallback",
        actions: [],
        finalMessage: rawText || "Risposta AI ricevuta.",
      };
    }
  };

  // ── Send chat message ────────────────────────────────────────
  private sendMessage = async (prompt: string) => {
    this.setState(s => ({
      loading: true,
      history: [...s.history, { role: "user", content: prompt }],
      log: [...s.log, { type: "user_prompt", content: prompt, ts: new Date().toISOString() }],
    }));

    try {
      const plan = await this.callAI(prompt, this.state.history);
      this.addLog({ type: "ai_plan", content: plan.thought, actions: plan.actions });
      const res: { a: any; r: any }[] = [];

      for (const a of plan.actions || []) {
        this.addLog({ type: "rest_request", method: a.method, path: a.path, params: a.params, body: a.body, description: a.description });
        const r = await rest.req(a.method, a.path, a.body, a.params || {});
        this.addLog({ type: "rest_response", status: r.status, headers: r.headers, body: r.body });
        res.push({ a, r });
      }

      this.setState(s => ({
        tick: s.tick + 1,
        history: [...s.history, {
          role: "assistant",
          content: `${plan.finalMessage}\n\n✅ ${res.length} op:\n${res.map((x, i) => `${i + 1}. ${x.a.method} ${x.a.path} → ${x.r.status}`).join("\n")}`,
        }],
      }));
      this.addLog({ type: "complete", content: `✓ ${res.length} operazioni completate.` });
    } catch (e: any) {
      this.addLog({ type: "error", content: e.message });
      this.setState(s => ({ history: [...s.history, { role: "assistant", content: `⚠ ${e.message}` }] }));
    }
    this.setState({ loading: false });
  };

  private addLog = (entry: Omit<LogEntry, "ts">) => {
    this.setState(s => ({ log: [...s.log, { ...entry, ts: new Date().toISOString() }] }));
  };

  private onSpecLoaded = (spec: ApiSpec) => {
    this.setState(prev => ({ specs: [...db.specs], tick: prev.tick + 1 }));
  };

  render() {
    const {
      tab, specs, history, log, loading, showWizard, provider, ollamaUrl,
      homeBankingId, socketPortLive, sessionIdLive, botJobId, botJobName,
    } = this.state;
    const tot = Object.values(db.stores).reduce((a, s) => a + s.length, 0);
    const TABS = [
      { id: "apis", l: `📁 API Files (${specs.length})` },
      { id: "chat", l: "💬 Chat AI" },
      { id: "debug", l: `🔍 Debug${log.length > 0 ? ` (${log.length})` : ""}` },
      { id: "store", l: `🗄️ Store (${tot})` },
    ] as const;

    const pBadge = provider === "ollama"
      ? { label: "🖥 OLLAMA", bg: "#0d2b0d", border: "#3fb950", color: "#3fb950" }
      : { label: "☁ CLAUDE", bg: "#0d1e3a", border: "#58a6ff", color: "#58a6ff" };

    return (
      <div style={{ fontFamily: "'IBM Plex Mono','Courier New',monospace", background: "#0a0e17", minHeight: "100vh", color: "#c9d1d9", display: "flex", flexDirection: "column" }}>
        {/* Modals */}
        {showWizard && <BizWizard onClose={() => this.setState({ showWizard: false })} loadedSpecs={specs} />}

        {/* HEADER */}
        <div style={{ background: "linear-gradient(90deg,#0d1117,#161b22)", borderBottom: "1px solid #21262d", padding: "10px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#0052cc,#00875a)", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3", letterSpacing: 1 }}>AVALOQ API TEST SIMULATOR</div>
            {/* Context badges — show values received from Java / index.tsx */}
            <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
              {botJobName && (
                <span style={{ fontSize: 8, color: "#e5c07b", background: "#2b1f0d", border: "1px solid #e5c07b44", borderRadius: 8, padding: "1px 7px" }}>
                  📋 {botJobName}
                </span>
              )}
              <span style={{ fontSize: 8, color: "#8b949e", background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "1px 7px" }}>
                🏦 HB:{homeBankingId}
              </span>
              <span style={{ fontSize: 8, color: "#8b949e", background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "1px 7px" }}>
                🔌 :{socketPortLive}
              </span>
              <span style={{ fontSize: 8, color: "#61afef", background: "#0d1e3a", border: "1px solid #1f6feb44", borderRadius: 8, padding: "1px 7px" }}>
                #{botJobId}
              </span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => this.setState({ showWizard: true })}
              style={{ background: "linear-gradient(135deg,#0d2347,#0a1628)", border: "2px solid #3fb950", borderRadius: 6, color: "#3fb950", padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", fontWeight: 700 }}
            >🧪 WIZARD</button>
            <div style={{ fontSize: 9, color: "#3fb950", background: "#0d2b0d", border: "1px solid #238636", borderRadius: 10, padding: "2px 8px" }}>
              ● {specs.length} API
            </div>
            <div
              onClick={() => this.setState({ tab: "apis" })}
              style={{ fontSize: 9, color: pBadge.color, background: pBadge.bg, border: `1px solid ${pBadge.border}`, borderRadius: 10, padding: "2px 8px", cursor: "pointer", fontWeight: 700 }}
            >
              {pBadge.label}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "0 18px", display: "flex" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => this.setState({ tab: t.id as any })}
              style={{
                background: "none", border: "none",
                borderBottom: tab === t.id ? "2px solid #58a6ff" : "2px solid transparent",
                color: tab === t.id ? "#e6edf3" : "#8b949e",
                padding: "8px 14px", cursor: "pointer",
                fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                fontFamily: "inherit", transition: "all .15s",
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {tab === "apis" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <FileUploadPanel
                onSpecLoaded={this.onSpecLoaded}
                loadedSpecs={specs}
                provider={provider}
                setProvider={v => this.setState({ provider: v })}
                ollamaUrl={ollamaUrl}
                setOllamaUrl={v => this.setState({ ollamaUrl: v })}
              />
            </div>
          )}
          {tab === "chat" && (
            <ChatTab
              history={history}
              loading={loading}
              provider={provider}
              onSend={this.sendMessage}
              onClear={() => this.setState({ history: [], log: [] })}
              onOpenWizard={() => this.setState({ showWizard: true })}
              onOpenReport={() => { }}
            />
          )}
          {tab === "debug" && (
            <DebugTab
              log={log}
              onClear={() => this.setState({ log: [] })}
            />
          )}
          {tab === "store" && (
            <StoreTab
              onOpenWizard={() => this.setState({ showWizard: true })}
              onOpenReport={() => { }}
            />
          )}
        </div>

        <style>{`
          *{box-sizing:border-box;}
          ::-webkit-scrollbar{width:4px;height:4px;}
          ::-webkit-scrollbar-track{background:#0d1117;}
          ::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px;}
          textarea:focus,input:focus,select:focus{border-color:#58a6ff!important;outline:none;}
        `}</style>
      </div>
    );
  }
}
