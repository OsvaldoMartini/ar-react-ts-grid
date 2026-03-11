import React from "react";
import { db, rest, SYNTH, ApiSpec } from "./utils";
import { FileUploadPanel } from "./FileUploadPanel";
import { DebugTab, LogEntry } from "./DebugTab";
import { StoreTab } from "./StoreTab";
import { BizWizard } from "./BizWizard";
import { ApiWorkflowTab } from "./ApiWorkflowTab";
import "./capi-app.scss";

// ═══════════════════════════════════════════════════════════════
// SHARED PROPS
// ═══════════════════════════════════════════════════════════════
export interface CapiProps {
  homeBankingIdInitial: number;
  homeBankNameInitial: string;
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
  /** Controls rendered right of the API count badge (e.g. LanguagePicker + ThemeToggle from CapiShell) */
  rightControls?: React.ReactNode;
}

interface AppState {
  tab: "apis" | "workflow" | "debug" | "store";
  specs: ApiSpec[];
  log: LogEntry[];
  loading: boolean;
  showWizard: boolean;
  tick: number;
  homeBankingId: number;
  homeBankName: string;
  socketPortLive: number;
  sessionIdLive: string;
  botJobId: number;
  botJobName: string;
}

export default class App extends React.Component<CapiProps, AppState> {
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
      homeBankName: props.homeBankNameInitial,
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
      homeBankingId, homeBankName, socketPortLive, botJobId, botJobName,
    } = this.state;
    const { rightControls } = this.props;
    const tot = Object.values(db.stores).reduce((a, s) => a + s.length, 0);
    const TABS = [
      { id: "apis", l: `📁 API Files (${specs.length})` },
      { id: "workflow", l: `⬡ Workflow` },
      { id: "debug", l: `🔍 Debug${log.length > 0 ? ` (${log.length})` : ""}` },
      { id: "store", l: `🗄️ Store (${tot})` },
    ] as const;

    return (
      <div className="capi-app">
        {/* Modals */}
        {showWizard && (
          <BizWizard onClose={() => this.setState({ showWizard: false })} loadedSpecs={specs} />
        )}

        {/* ── HEADER ── */}
        <div className="capi-header">
          <div className="capi-header__logo">A</div>
          <div>
            <div className="capi-header__title">AVALOQ API TEST SIMULATOR</div>
            <div className="capi-header__badges">
              {botJobName && (
                <span className="capi-badge capi-badge--job">🏦 Banking Name:({homeBankingId})-{homeBankName}</span>
              )}
              {/* <span className="capi-badge capi-badge--dim">🔌Socket :{socketPortLive}</span> */}
              <span className="capi-badge capi-badge--blue">📋 Bot Job:({botJobId})-{botJobName}</span>
            </div>
          </div>
          <div className="capi-header__controls">
            <button
              className="capi-btn-wizard"
              onClick={() => this.setState({ showWizard: true })}
            >
              🧪 WIZARD
            </button>
            <div className="capi-api-count">● {specs.length} API</div>
            {rightControls}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="capi-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => this.setState({ tab: t.id as any })}
              className={`capi-tab-btn${tab === t.id ? " active" : ""}`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="capi-content">
          {tab === "apis" && (
            <div className="capi-scroll">
              <FileUploadPanel
                onSpecLoaded={this.onSpecLoaded}
                loadedSpecs={specs}
                onDeleteAll={this.onDeleteAll}
              />
            </div>
          )}
          {tab === "workflow" && (
            <ApiWorkflowTab loadedSpecs={specs} />
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
      </div>
    );
  }
}
