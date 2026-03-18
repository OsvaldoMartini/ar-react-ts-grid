import React from "react";
import { mtT as t } from "./useMtT";
import { db, rest, SYNTH, ApiSpec } from "./utils";
import { FileUploadPanel } from "./FileUploadPanel";
import { RunningTab } from "./RunningTab";
import { StoreTab } from "./StoreTab";
import { BizWizard } from "./BizWizard";
import { ApiWorkflowTab, DataGenTab } from "./ApiWorkflowTab";
import { ReadyForTestTab } from "./ReadyForTestTab";
import { AIAssistantTab } from "./AIAssistantTab";
import { TestLibraryTab } from "./TestLibraryTab";
import { testStore } from "./utils";

// Import banking module (auto-registers built-in plugins on first import)
import "./banking";

import "./mt-app.scss";

// ═══════════════════════════════════════════════════════════════
// SHARED PROPS
// ═══════════════════════════════════════════════════════════════
export interface AppProps {
  homeOrgIdInitial: number;
  homeOrgNameInitial: string;
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
  /** Controls rendered right of the API count badge (e.g. LanguagePicker + ThemeToggle from AppShell) */
  rightControls?: React.ReactNode;
}

interface AppState {
  tab: "apis" | "workflow" | "datagen" | "ready" | "running" | "report" | "library" | "ai";
  specs: ApiSpec[];
  loading: boolean;
  showWizard: boolean;
  tick: number;
  homeOrgId: number;
  homeOrgName: string;
  socketPortLive: number;
  sessionIdLive: string;
  botJobId: number;
  botJobName: string;
}

export default class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      tab: "apis",
      specs: [],
      loading: false,
      showWizard: false,
      tick: 0,
      homeOrgId: props.homeOrgIdInitial,
      homeOrgName: props.homeOrgNameInitial,
      socketPortLive: props.socketPort,
      sessionIdLive: props.sessionId,
      botJobId: props.botJobIdInitial,
      botJobName: props.botJobNameInitial,
    };
  }

  componentDidUpdate(prevProps: AppProps) {
    const { homeOrgIdInitial, socketPort, sessionId, botJobIdInitial, botJobNameInitial } = this.props;
    if (
      prevProps.homeOrgIdInitial !== homeOrgIdInitial ||
      prevProps.socketPort !== socketPort ||
      prevProps.sessionId !== sessionId ||
      prevProps.botJobIdInitial !== botJobIdInitial ||
      prevProps.botJobNameInitial !== botJobNameInitial
    ) {
      this.setState({
        homeOrgId: homeOrgIdInitial,
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
      homeOrgId, homeOrgName, socketPortLive, botJobId, botJobName,
    } = this.state;
    const { rightControls } = this.props;
    const tot = Object.values(db.stores).reduce((a, s) => a + s.length, 0);
    const queuedCount = testStore.total;
    const TABS = [
      { id: "apis", l: `📁 ${t("nav.apiFiles")} (${specs.length})`, stepLabel: t("nav.apiFiles") },
      { id: "workflow", l: `⬡ ${t("nav.workflow")}`, stepLabel: t("nav.workflow") },
      { id: "datagen", l: `⚗ ${t("nav.dataGen")}`, stepLabel: t("nav.dataGen") },
      { id: "ready", l: `🧪 ${t("nav.readyForTest")}${queuedCount > 0 ? ` (${queuedCount.toLocaleString()})` : ""}`, stepLabel: t("nav.readyForTest") },
      { id: "running", l: `🔍 ${t("nav.running")}`, stepLabel: t("nav.running") },
      { id: "report", l: `🗄️ ${t("nav.report")} (${tot})`, stepLabel: t("nav.report") },
      { id: "library", l: `📚 ${t("nav.library")}`, stepLabel: t("nav.library") },
      { id: "ai", l: `🤖 ${t("nav.ai")}`, stepLabel: t("nav.ai") },
    ] as const;
    const activeTabIndex = TABS.findIndex(t => t.id === tab);

    return (
      <div className="mt-app">
        {/* Modals */}
        {showWizard && (
          <BizWizard onClose={() => this.setState({ showWizard: false })} loadedSpecs={specs} />
        )}

        {/* ── HEADER ── */}
        <div className="mt-header">
          <div className="mt-header__logo">A</div>
          <div>
            <div className="mt-header__title">MULTITEST.AI — API TEST PLATFORM</div>
            <div className="mt-header__badges">
              {botJobName && (
                <span className="mt-badge mt-badge--job">🏢 Environment:({homeOrgId})-{homeOrgName}</span>
              )}
              {/* <span className="mt-badge mt-badge--dim">🔌Socket :{socketPortLive}</span> */}
              <span className="mt-badge mt-badge--blue">📋 Bot Job:({botJobId})-{botJobName}</span>
            </div>
          </div>
          <div className="mt-header__controls">
            <button
              className="mt-btn-wizard"
              onClick={() => this.setState({ showWizard: true })}
            >
              {t("header.generateTests")}
            </button>
            <div className="mt-api-count">● {specs.length} API</div>
            {rightControls}
          </div>
        </div>

        {/* ── STEP INDICATOR + TABS ── */}
        <div className="mt-nav-shell">
          <div className="mt-stepper" aria-label={t("nav.workflowProgress")}>
            {TABS.map((tab, index) => {
              const stateClass = index < activeTabIndex ? "is-complete" : index === activeTabIndex ? "is-active" : "is-upcoming";
              return (
                <React.Fragment key={tab.id}>
                  <button
                    type="button"
                    onClick={() => this.setState({ tab: tab.id as any })}
                    className={`mt-step ${stateClass}`}
                    aria-current={index === activeTabIndex ? "step" : undefined}
                  >
                    <span className="mt-step__circle">{index + 1}</span>
                    <span className="mt-step__label">{tab.stepLabel}</span>
                  </button>
                  {index < TABS.length - 1 && (
                    <div className={`mt-step__connector ${index < activeTabIndex ? "is-complete" : ""}`} aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => this.setState({ tab: tab.id as any })}
                className={`mt-tab-btn${this.state.tab === tab.id ? " active" : ""}`}
              >
                {tab.l}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="mt-content">
          {tab === "apis" && (
            <div className="mt-scroll">
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
            <div className="mt-scroll" style={{ padding: "24px 28px" }}>
              <DataGenTab
                loadedSpecs={specs}
                onGenerate={() => this.setState(s => ({ tick: s.tick + 1 }))}
              />
            </div>
          )}
          {tab === "ready" && (
            <div className="mt-scroll" style={{ padding: "24px 28px" }}>
              <ReadyForTestTab
                onClearAll={() => this.setState(s => ({ tick: s.tick + 1 }))}
                onExecutionStart={() => this.setState({ tab: "running" })}
              />
            </div>
          )}
          {tab === "running" && (
            <div className="mt-scroll">
              <RunningTab />
            </div>
          )}
          {tab === "report" && (
            <StoreTab
              onOpenWizard={() => this.setState({ showWizard: true })}
              onOpenReport={() => { }}
            />
          )}
          {tab === "library" && (
            <TestLibraryTab />
          )}
          {tab === "ai" && (
            <AIAssistantTab loadedSpecs={specs} />
          )}
        </div>
      </div>
    );
  }
}
