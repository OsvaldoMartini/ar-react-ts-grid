import React, { useMemo, useState } from 'react';
import { FlaskConical, Octagon, Play, ShieldCheck } from 'lucide-react';
import type { VariablesExecutionFlowReview } from './domain/variablesExecutionFlowReview';
import { buildVariablesSmokeTestPlan } from './domain/variablesSmokeTestPlan';
import type {
  VariablesSmokeTestCounters,
  VariablesSmokeTestLogEntry,
  VariablesSmokeTestPlan,
  VariablesSmokeTestStatus,
} from './domain/variablesSmokeTestTypes';
import VariablesSmokeTestLog from './VariablesSmokeTestLog';
import styles from './VariablesSmokeTestPanel.module.scss';

export interface VariablesSmokeTestPanelProps {
  review: VariablesExecutionFlowReview;
  blockFilter: number | null;
}

const EMPTY_COUNTERS: VariablesSmokeTestCounters = Object.freeze({
  passed: 0,
  bypassed: 0,
  warning: 0,
  failed: 0,
});

const logEntry = (
  tone: VariablesSmokeTestLogEntry['tone'],
  message: string,
  now = new Date(),
): VariablesSmokeTestLogEntry => ({
  id: `${now.getTime()}:${tone}:${message}`,
  timestamp: now.toISOString(),
  tone,
  message,
});

const VariablesSmokeTestPanel: React.FC<VariablesSmokeTestPanelProps> = ({
  review,
  blockFilter,
}) => {
  const [status, setStatus] = useState<VariablesSmokeTestStatus>('IDLE');
  const [plan, setPlan] = useState<VariablesSmokeTestPlan | null>(null);
  const [entries, setEntries] = useState<readonly VariablesSmokeTestLogEntry[]>([]);
  const counters = EMPTY_COUNTERS;
  const previewPlan = useMemo(
    () => buildVariablesSmokeTestPlan(review, blockFilter),
    [blockFilter, review],
  );

  const run = () => {
    const nextPlan = buildVariablesSmokeTestPlan(review, blockFilter);
    setPlan(nextPlan);
    setStatus('FROZEN');
    setEntries([
      logEntry(
        'SUCCESS',
        `Frozen ${nextPlan.steps.length} command(s) across ${nextPlan.blocks.length} Block(s). No browser or database action was executed.`,
      ),
      logEntry(
        'INFO',
        `Graph revision ${nextPlan.graphRevision || 'unavailable'} and runtime revision ${nextPlan.runtimeMemoryRevision} are fixed for this run.`,
      ),
    ]);
  };

  const stop = () => {
    if (status !== 'FROZEN') return;
    setStatus('STOPPED');
    setEntries(current => [
      ...current,
      logEntry('WARNING', 'Smoke Test stopped. The frozen plan and runtime values remain unchanged.'),
    ]);
  };

  const activePlan = plan ?? previewPlan;
  const currentStep = status === 'FROZEN' ? activePlan.steps[0] ?? null : null;

  return (
    <aside className={styles.panel} aria-label="Smoke Tests">
      <header className={styles.header}>
        <div>
          <span>Simulation workspace</span>
          <h3><FlaskConical size={17} aria-hidden="true" /> SMOKE TESTS</h3>
        </div>
        <b data-status={status}>{status}</b>
      </header>

      <div className={styles.actions}>
        <button type="button" className={styles.runButton} onClick={run}>
          <Play size={14} aria-hidden="true" /> RUN SMOKE TEST
        </button>
        <button
          type="button"
          className={styles.stopButton}
          disabled={status !== 'FROZEN'}
          onClick={stop}
        >
          <Octagon size={14} aria-hidden="true" /> STOP
        </button>
      </div>

      <section className={styles.scope} aria-label="Frozen Smoke Test scope">
        <span>{plan === null ? 'Visible scope' : 'Frozen scope'}</span>
        <strong>{activePlan.scopeLabel}</strong>
        <small>Bot Job #{activePlan.botJobId} {activePlan.botJobName}</small>
      </section>

      <section className={styles.current} aria-label="Current Smoke Test position">
        <span>Current position</span>
        <strong>{currentStep
          ? `Block #${currentStep.blockOrder ?? currentStep.blockId ?? '?'} ${currentStep.blockName}`
          : 'Not executing'}</strong>
        <small>{currentStep
          ? `#${currentStep.instructionOrder ?? '?'} ${currentStep.instructionName} · ID ${currentStep.instructionId ?? 'Missing'}`
          : 'The deterministic engine begins in S2.'}</small>
      </section>

      <section className={styles.logSection} aria-label="Smoke Test results">
        <header><span>Step log</span><b>{entries.length}</b></header>
        <VariablesSmokeTestLog entries={entries} />
      </section>

      <section className={styles.counters} aria-label="Smoke Test counters">
        <div><span>Passed</span><strong>{counters.passed}</strong></div>
        <div><span>Bypassed</span><strong>{counters.bypassed}</strong></div>
        <div><span>Warning</span><strong>{counters.warning}</strong></div>
        <div><span>Failed</span><strong>{counters.failed}</strong></div>
      </section>

      <footer className={styles.safety}>
        <ShieldCheck size={15} aria-hidden="true" />
        <span>No Playwright, Web page, or production execution is called.</span>
      </footer>
    </aside>
  );
};

export default VariablesSmokeTestPanel;

