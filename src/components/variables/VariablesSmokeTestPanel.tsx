import React, { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Octagon, Play, ShieldCheck } from 'lucide-react';
import type { VariablesExecutionFlowReview } from './domain/variablesExecutionFlowReview';
import { buildVariablesSmokeTestPlan } from './domain/variablesSmokeTestPlan';
import { simulateVariablesSmokeTestStep } from './domain/variablesSmokeTestSimulation';
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
  onActiveStepChange?: (stepKey: string | null) => void;
}

const STEP_INTERVAL_MS = 100;

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
  onActiveStepChange,
}) => {
  const [status, setStatus] = useState<VariablesSmokeTestStatus>('IDLE');
  const [plan, setPlan] = useState<VariablesSmokeTestPlan | null>(null);
  const [entries, setEntries] = useState<readonly VariablesSmokeTestLogEntry[]>([]);
  const [counters, setCounters] = useState<VariablesSmokeTestCounters>(EMPTY_COUNTERS);
  const [cursor, setCursor] = useState(0);
  const previewPlan = useMemo(
    () => buildVariablesSmokeTestPlan(review, blockFilter),
    [blockFilter, review],
  );

  const run = () => {
    const nextPlan = buildVariablesSmokeTestPlan(review, blockFilter);
    setPlan(nextPlan);
    setCursor(0);
    setCounters(EMPTY_COUNTERS);
    onActiveStepChange?.(null);
    setStatus(nextPlan.steps.length === 0 ? 'COMPLETED' : 'RUNNING');
    setEntries([
      logEntry(
        'SUCCESS',
        `Started in-memory Smoke Test for ${nextPlan.steps.length} command(s) across ${nextPlan.blocks.length} Block(s).`,
      ),
      logEntry(
        'INFO',
        nextPlan.steps.length === 0
          ? 'The selected scope contains no commands to simulate.'
          : `Frozen graph revision ${nextPlan.graphRevision || 'unavailable'}; running one command every ${STEP_INTERVAL_MS} ms.`,
      ),
    ]);
  };

  const stop = () => {
    if (status !== 'RUNNING') return;
    setStatus('STOPPED');
    onActiveStepChange?.(null);
    setEntries(current => [
      ...current,
      logEntry('WARNING', `Smoke Test stopped after ${cursor} of ${plan?.steps.length ?? 0} command(s).`),
    ]);
  };

  useEffect(() => {
    if (status !== 'RUNNING' || plan === null) return undefined;
    if (cursor >= plan.steps.length) {
      setStatus('COMPLETED');
      onActiveStepChange?.(null);
      setEntries(current => [
        ...current,
        logEntry('SUCCESS', `Smoke Test completed all ${plan.steps.length} command(s).`),
      ]);
      return undefined;
    }

    const step = plan.steps[cursor];
    onActiveStepChange?.(step.key);
    const timer = window.setTimeout(() => {
      const result = simulateVariablesSmokeTestStep(step, cursor + 1);
      setEntries(current => [...current, logEntry(result.tone, result.message)]);
      setCounters(current => ({
        ...current,
        [result.counter]: current[result.counter] + 1,
      }));
      setCursor(current => current + 1);
    }, STEP_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [cursor, onActiveStepChange, plan, status]);

  useEffect(() => () => onActiveStepChange?.(null), [onActiveStepChange]);

  const activePlan = plan ?? previewPlan;
  const currentStep = status === 'RUNNING' && plan !== null
    ? plan.steps[cursor] ?? null
    : null;
  const completedSteps = status === 'COMPLETED'
    ? activePlan.steps.length
    : cursor;
  const progress = activePlan.steps.length === 0
    ? 0
    : Math.round((completedSteps / activePlan.steps.length) * 100);

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
          disabled={status !== 'RUNNING'}
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
          : status === 'COMPLETED'
            ? 'All visible commands were simulated.'
            : 'Press Run Smoke Test to begin.'}</small>
        <div className={styles.progress} aria-label={`${progress}% completed`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>{completedSteps} / {activePlan.steps.length} commands</small>
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
