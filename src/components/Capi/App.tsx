import React from "react";
import { db, rest, SYNTH, ApiSpec } from "./utils";
import { FileUploadPanel } from "./FileUploadPanel";
import { DebugTab, LogEntry } from "./DebugTab";
import { StoreTab } from "./StoreTab";
import { BizWizard } from "./BizWizard";
import { ApiWorkflowTab, DataGenTab } from "./ApiWorkflowTab";
import { ReadyForTestTab } from "./ReadyForTestTab";
import { testStore } from "./utils";
import "./capi-app.scss";

// ═══════════════════════════════════════════════════════════════
// WORKFLOW STEPPER
// ═══════════════════════════════════════════════════════════════
const STEPS = [
  { label: "APIs" },
  { label: "Synth Data" },
  { label: "Exec Flow" },
  { label: "Running" },
  { label: "Report" },
];

const TAB_STEP: Record<string, number> = {
  apis: 1,
  workflow: 1,
  datagen: 2,
  ready: 3,
  debug: 4,
  store: 5,
};

function WorkflowStepper({ activeStep }: { activeStep: number }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 24px 8px",
      background: "var(--cs-header-bg, var(--cs-surface))",
      borderBottom: "1px solid var(--cs-border-sub)",
      gap: 0,
      userSelect: "none",
    }}>
      {STEPS.map((step, i) => {
        const n = i + 1;
        const done = n < activeStep;
        const current = n === activeStep;

        const circleColor = done
          ? "#34d399"
          : current
            ? "var(--cs-accent)"
            : "transparent";

        const circleBorder = done || current
          ? "none"
          : "2px solid var(--cs-border)";

        const textColor = done
          ? "#34d399"
          : current
            ? "var(--cs-text)"
            : "var(--cs-dim)";

        const lineColor = done ? "#34d399" : "var(--cs-border)";

        return (
          <React.Fragment key={n}>
            {/* Step node */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: circleColor,
                border: circleBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 11,
                fontWeight: 800,
                color: done ? "#0a1f15" : current ? "#fff" : "var(--cs-dim)",
                flexShrink: 0,
                boxShadow: current ? "0 0 0 3px var(--cs-accent-bg, rgba(10,102,194,.18))" : "none",
                transition: "all .25s",
              }}>
                {done
                  ? <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="#0a1f15" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  : n
                }
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 9,
                fontWeight: current ? 800 : 500,
                color: textColor,
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
                transition: "color .25s",
              }}>
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                minWidth: 28,
                maxWidth: 80,
                height: 2,
                background: lineColor,
                marginBottom: 16,
                transition: "background .25s",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

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
  tab: "apis" | "workflow" | "datagen" | "ready" | "debug" | "store";
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
    const queuedCount = testStore.total;
    const TABS = [
      { id: "apis", l: `📁 API Files (${specs.length})` },
      { id: "workflow", l: `⬡ Workflow` },
      { id: "datagen", l: `⚗ Data Generator` },
      { id: "ready", l: `🧪 Ready for Test${queuedCount > 0 ? ` (${queuedCount.toLocaleString()})` : ""}` },
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

        {/* ── WORKFLOW STEPPER ── */}
        <WorkflowStepper activeStep={TAB_STEP[tab] ?? 1} />

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
          {tab === "datagen" && (
            <div className="capi-scroll" style={{ padding: "24px 28px" }}>
              <DataGenTab
                loadedSpecs={specs}
                onGenerate={() => this.setState(s => ({ tick: s.tick + 1 }))}
              />
            </div>
          )}
          {tab === "ready" && (
            <div className="capi-scroll" style={{ padding: "24px 28px" }}>
              <ReadyForTestTab
                onClearAll={() => this.setState(s => ({ tick: s.tick + 1 }))}
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
      </div>
    );
  }
}
