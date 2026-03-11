import React from "react";
import { db, rest, SYNTH, ApiSpec } from "./utils";
import { FileUploadPanel } from "./FileUploadPanel";
import { DebugTab, LogEntry } from "./DebugTab";
import { StoreTab } from "./StoreTab";
import { BizWizard } from "./BizWizard";
import { LanguagePicker } from "./LanguagePicker";

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
  tab: "apis" | "debug" | "store";
  specs: ApiSpec[];
  log: LogEntry[];
  loading: boolean;
  showWizard: boolean;
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
      specs: [],
      log: [],
      loading: false,
      showWizard: false,
      tick: 0,
      homeBankingId: props.homeBankingIdInitial,
      socketPortLive: props.socketPort,
      sessionIdLive: props.sessionId,
      botJobId: props.botJobIdInitial,
      botJobName: props.botJobNameInitial,
    };
  }

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

  private addLog = (entry: Omit<LogEntry, "ts">) => {
    this.setState(s => ({ log: [...s.log, { ...entry, ts: new Date().toISOString() }] }));
  };

  private onSpecLoaded = (spec: ApiSpec) => {
    this.setState(prev => ({ specs: [...db.specs], tick: prev.tick + 1 }));
  };

  private onDeleteAll = () => {
    db.specs = [];
    db.stores = {};
    this.setState({ specs: [], log: [], tick: 0 });
  };

  render() {
    const {
      tab, specs, log, showWizard,
      homeBankingId, socketPortLive, botJobId, botJobName,
    } = this.state;
    const tot = Object.values(db.stores).reduce((a, s) => a + s.length, 0);
    const TABS = [
      { id: "apis", l: `📁 API Files (${specs.length})` },
      { id: "debug", l: `🔍 Debug${log.length > 0 ? ` (${log.length})` : ""}` },
      { id: "store", l: `🗄️ Store (${tot})` },
    ] as const;

    return (
      <div style={{ fontFamily: "'IBM Plex Mono','Courier New',monospace", background: "#0a0e17", minHeight: "100vh", color: "#c9d1d9", display: "flex", flexDirection: "column" }}>
        {/* Modals */}
        {showWizard && <BizWizard onClose={() => this.setState({ showWizard: false })} loadedSpecs={specs} />}

        {/* HEADER */}
        <div style={{ background: "linear-gradient(90deg,#0d1117,#161b22)", borderBottom: "1px solid #21262d", padding: "10px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#0052cc,#00875a)", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3", letterSpacing: 1 }}>AVALOQ API TEST SIMULATOR</div>
            {/* Context badges */}
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
            {/* Language picker — replaces CLAUDE/OLLAMA badge */}
            <LanguagePicker />
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
                onDeleteAll={this.onDeleteAll}
              />
            </div>
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
