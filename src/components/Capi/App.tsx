import React from "react";
import { db, rest, SYNTH, ApiSpec } from "./utils";
import { FileUploadPanel } from "./FileUploadPanel";
import { RunningTab } from "./RunningTab";
import { StoreTab } from "./StoreTab";
import { BizWizard } from "./BizWizard";
import { ApiWorkflowTab, DataGenTab } from "./ApiWorkflowTab";
import { ReadyForTestTab } from "./ReadyForTestTab";
import { AIAssistantTab } from "./AIAssistantTab";
import { testStore } from "./utils";
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
  tab: "apis" | "workflow" | "datagen" | "ai" | "ready" | "running" | "report";
  specs: ApiSpec[];
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

  private onSpecLoaded = (spec: ApiSpec) => {
    this.setState(prev => ({ specs: [...db.specs], tick: prev.tick + 1 }));
  };

  private onDeleteAll = () => {
    db.specs = [];
    db.stores = {};
    this.setState({ specs: [], tick: 0 });
  };

  render() {
    const {
      tab, specs, showWizard,
      homeBankingId, homeBankName, socketPortLive, botJobId, botJobName,
    } = this.state;
    const { rightControls } = this.props;
    const tot = Object.values(db.stores).reduce((a, s) => a + s.length, 0);
    const queuedCount = testStore.total;
    const TABS = [
      { id: "apis", l: `📁 API Files (${specs.length})`, stepLabel: "API Files" },
      { id: "workflow", l: `⬡ Workflow`, stepLabel: "Workflow" },
      { id: "datagen", l: `⚗ Data Generator`, stepLabel: "Data Generator" },
      { id: "ai", l: `🤖 AI Assistant`, stepLabel: "AI Assistant" },
      { id: "ready", l: `🧪 Ready for Test${queuedCount > 0 ? ` (${queuedCount.toLocaleString()})` : ""}`, stepLabel: "Ready for Test" },
      { id: "running", l: `🔍 Running`, stepLabel: "Running" },
      { id: "report", l: `🗄️ Report (${tot})`, stepLabel: "Report" },
    ] as const;
    const activeTabIndex = TABS.findIndex(t => t.id === tab);

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
              🧪 Generate Rapid Tests
            </button>
            <div className="capi-api-count">● {specs.length} API</div>
            {rightControls}
          </div>
        </div>

        {/* ── STEP INDICATOR + TABS ── */}
        <div className="capi-nav-shell">
          <div className="capi-stepper" aria-label="Workflow progress">
            {TABS.map((t, index) => {
              const stateClass = index < activeTabIndex ? "is-complete" : index === activeTabIndex ? "is-active" : "is-upcoming";
              return (
                <React.Fragment key={t.id}>
                  <button
                    type="button"
                    onClick={() => this.setState({ tab: t.id as any })}
                    className={`capi-step ${stateClass}`}
                    aria-current={index === activeTabIndex ? "step" : undefined}
                  >
                    <span className="capi-step__circle">{index + 1}</span>
                    <span className="capi-step__label">{t.stepLabel}</span>
                  </button>
                  {index < TABS.length - 1 && (
                    <div className={`capi-step__connector ${index < activeTabIndex ? "is-complete" : ""}`} aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

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
          {tab === "datagen" && (
            <div className="capi-scroll" style={{ padding: "24px 28px" }}>
              <DataGenTab
                loadedSpecs={specs}
                onGenerate={() => this.setState(s => ({ tick: s.tick + 1 }))}
              />
            </div>
          )}
          {tab === "ai" && (
            <div className="capi-scroll">
              <AIAssistantTab loadedSpecs={specs} />
            </div>
          )}
          {tab === "ready" && (
            <div className="capi-scroll" style={{ padding: "24px 28px" }}>
              <ReadyForTestTab
                onClearAll={() => this.setState(s => ({ tick: s.tick + 1 }))}
                onExecutionStart={() => this.setState({ tab: "running" })}
              />
            </div>
          )}
          {tab === "running" && (
            <div className="capi-scroll">
              <RunningTab />
            </div>
          )}
          {tab === "report" && (
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
