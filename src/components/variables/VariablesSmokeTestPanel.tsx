import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, Octagon, Play, ShieldCheck } from 'lucide-react';
import type { VariablesExecutionFlowReview } from './domain/variablesExecutionFlowReview';
import { buildVariablesSmokeTestPlan } from './domain/variablesSmokeTestPlan';
import {
  simulateVariablesSmokeTestStep,
  variablesSmokeTestBlockKey,
  type VariablesSmokeTestRuntimeValue,
} from './domain/variablesSmokeTestSimulation';
import type {
  VariablesSmokeTestBlock,
  VariablesSmokeTestCounters,
  VariablesSmokeTestLogEntry,
  VariablesSmokeTestPlan,
  VariablesSmokeTestPosition,
  VariablesSmokeTestStatus,
  VariablesSmokeTestStep,
} from './domain/variablesSmokeTestTypes';
import VariablesSmokeTestLog from './VariablesSmokeTestLog';
import VariablesSmokeTestReportModal from './VariablesSmokeTestReportModal';
import styles from './VariablesSmokeTestPanel.module.scss';

export interface VariablesSmokeTestPanelProps {
  review: VariablesExecutionFlowReview;
  selectedBlockIds: readonly number[];
  runtimeWriteAvailable?: boolean;
  onCommitRuntimeValue?: (variableId: number, value: string) => boolean;
  onActivePositionChange?: (position: VariablesSmokeTestPosition | null) => void;
}

type SmokeExecutionItem =
  | { kind: 'INACTIVE_BLOCK'; block: VariablesSmokeTestBlock }
  | { kind: 'STEP'; block: VariablesSmokeTestBlock; step: VariablesSmokeTestStep };

const SPEED_OPTIONS = [
  { value: 0, label: '0 ms' },
  { value: 50, label: '50 ms' },
  { value: 100, label: '100 ms' },
  { value: 1000, label: '1 second' },
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
] as const;

const EMPTY_COUNTERS: VariablesSmokeTestCounters = Object.freeze({
  passed: 0,
  bypassed: 0,
  warning: 0,
  failed: 0,
});

const logEntry = (
  tone: VariablesSmokeTestLogEntry['tone'],
  message: string,
  counter: VariablesSmokeTestLogEntry['counter'] = null,
  now = new Date(),
): VariablesSmokeTestLogEntry => ({
  id: `${now.getTime()}:${tone}:${message}`,
  timestamp: now.toISOString(),
  tone,
  counter,
  message,
});

const executionItemsFor = (plan: VariablesSmokeTestPlan): readonly SmokeExecutionItem[] => {
  const items: SmokeExecutionItem[] = [];
  plan.blocks.forEach((block) => {
    if (!block.active) {
      items.push({ kind: 'INACTIVE_BLOCK', block });
      return;
    }
    block.steps.forEach(step => items.push({ kind: 'STEP', block, step }));
  });
  return items;
};

const generatedSmokeValue = (
  variableType: string,
  index: number,
): string => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return variableType.trim().toLocaleUpperCase().includes('NUMERIC')
    ? String(randomNumber)
    : `SMOKE_${index + 1}_${randomNumber}`;
};

const VariablesSmokeTestPanel: React.FC<VariablesSmokeTestPanelProps> = ({
  review,
  selectedBlockIds,
  runtimeWriteAvailable = false,
  onCommitRuntimeValue,
  onActivePositionChange,
}) => {
  const [status, setStatus] = useState<VariablesSmokeTestStatus>('IDLE');
  const [plan, setPlan] = useState<VariablesSmokeTestPlan | null>(null);
  const [entries, setEntries] = useState<readonly VariablesSmokeTestLogEntry[]>([]);
  const [counters, setCounters] = useState<VariablesSmokeTestCounters>(EMPTY_COUNTERS);
  const [itemCursor, setItemCursor] = useState(0);
  const [processedCommands, setProcessedCommands] = useState(0);
  const [stepIntervalMs, setStepIntervalMs] = useState(100);
  const [writeRuntimeValues, setWriteRuntimeValues] = useState(false);
  const [reportCounter, setReportCounter] = useState<keyof VariablesSmokeTestCounters | null>(null);
  const runtimeValuesRef = useRef<Map<number, VariablesSmokeTestRuntimeValue>>(new Map());
  const previewPlan = useMemo(
    () => buildVariablesSmokeTestPlan(review, selectedBlockIds),
    [review, selectedBlockIds],
  );
  const executionItems = useMemo(
    () => plan === null ? [] : executionItemsFor(plan),
    [plan],
  );

  const run = () => {
    const nextPlan = buildVariablesSmokeTestPlan(review, selectedBlockIds);
    const nextItems = executionItemsFor(nextPlan);
    const initializedVariables: string[] = [];
    const refusedInitialWrites: string[] = [];
    runtimeValuesRef.current = new Map(nextPlan.variableFlows.map((flow, index) => {
      if (flow.runtimeState === 'VALUE') {
        return [flow.variableId, {
          state: 'VALUE' as const,
          value: flow.runtimeRawValue,
        }];
      }
      const value = generatedSmokeValue(flow.variableType, index);
      initializedVariables.push(`${flow.variableName}=${value}`);
      if (
        writeRuntimeValues
        && (!runtimeWriteAvailable
          || !onCommitRuntimeValue
          || !onCommitRuntimeValue(flow.variableId, value))
      ) {
        refusedInitialWrites.push(flow.variableName);
      }
      return [flow.variableId, {
        state: 'VALUE' as const,
        value,
      }];
    }));
    setPlan(nextPlan);
    setItemCursor(0);
    setProcessedCommands(0);
    setCounters(EMPTY_COUNTERS);
    setReportCounter(null);
    onActivePositionChange?.(null);
    setStatus(nextItems.length === 0 ? 'COMPLETED' : 'RUNNING');
    setEntries([
      logEntry(
        'SUCCESS',
        `Started in-memory Smoke Test for ${nextPlan.steps.length} command(s) across ${nextPlan.blocks.length} Block(s).`,
      ),
      logEntry(
        'INFO',
        nextItems.length === 0
          ? 'The selected scope contains no Blocks or commands to simulate.'
          : `Frozen graph revision ${nextPlan.graphRevision || 'unavailable'}; speed ${stepIntervalMs} ms.`,
      ),
      logEntry(
        initializedVariables.length > 0 ? 'SUCCESS' : 'INFO',
        initializedVariables.length > 0
          ? `Initialized ${initializedVariables.length} VOID runtime variable(s): ${initializedVariables.join(', ')}.`
          : 'All runtime variables already had initial values; no Smoke value was generated.',
      ),
      ...(refusedInitialWrites.length > 0
        ? [logEntry(
            'WARNING',
            `Smoke value write-through is waiting or unavailable for ${refusedInitialWrites.join(', ')}. Local generated values remain active for this run.`,
          )]
        : []),
    ]);
  };

  const stop = () => {
    if (status !== 'RUNNING') return;
    setStatus('STOPPED');
    onActivePositionChange?.(null);
    setEntries(current => [
      ...current,
      logEntry('WARNING', `Smoke Test stopped after ${processedCommands} of ${plan?.steps.length ?? 0} command(s).`),
    ]);
  };

  useEffect(() => {
    if (status !== 'RUNNING' || plan === null) return undefined;
    if (itemCursor >= executionItems.length) {
      setStatus('COMPLETED');
      onActivePositionChange?.(null);
      setEntries(current => [
        ...current,
        logEntry('SUCCESS', `Smoke Test completed all ${plan.steps.length} command(s).`),
      ]);
      return undefined;
    }

    const item = executionItems[itemCursor];
    const blockKey = variablesSmokeTestBlockKey(item.block);
    onActivePositionChange?.({
      blockKey,
      stepKey: item.kind === 'STEP' ? item.step.key : null,
    });

    const timer = window.setTimeout(() => {
      if (item.kind === 'INACTIVE_BLOCK') {
        const skipped = item.block.steps.length;
        setEntries(current => [
          ...current,
          logEntry(
            'WARNING',
            `Block #${item.block.blockOrder ?? item.block.blockId ?? '?'} ${item.block.blockName}: BLOCK INACTIVE - skipped ${skipped} instruction(s).`,
            'bypassed',
          ),
        ]);
        setCounters(current => ({ ...current, bypassed: current.bypassed + skipped }));
        setProcessedCommands(current => current + skipped);
      } else {
        const result = simulateVariablesSmokeTestStep(
          item.step,
          processedCommands + 1,
          runtimeValuesRef.current,
        );
        const refusedRuntimeWrites: string[] = [];
        result.runtimeWrites.forEach((write) => {
          runtimeValuesRef.current.set(write.variableId, {
            state: 'VALUE',
            value: write.value,
          });
          if (
            writeRuntimeValues
            && (!runtimeWriteAvailable
              || !onCommitRuntimeValue
              || !onCommitRuntimeValue(write.variableId, write.value))
          ) {
            refusedRuntimeWrites.push(write.variableName);
          }
        });
        setEntries(current => [
          ...current,
          logEntry(result.tone, result.message, result.counter),
          ...(refusedRuntimeWrites.length > 0
            ? [logEntry(
                'WARNING',
                `Smoke value write-through is waiting or unavailable for ${refusedRuntimeWrites.join(', ')}. The local simulation continued.`,
              )]
            : []),
        ]);
        setCounters(current => ({
          ...current,
          [result.counter]: current[result.counter] + 1,
        }));
        setProcessedCommands(current => current + 1);
      }
      setItemCursor(current => current + 1);
    }, stepIntervalMs);

    return () => window.clearTimeout(timer);
  }, [
    executionItems,
    itemCursor,
    onActivePositionChange,
    onCommitRuntimeValue,
    plan,
    processedCommands,
    runtimeWriteAvailable,
    status,
    stepIntervalMs,
    writeRuntimeValues,
  ]);

  useEffect(() => () => onActivePositionChange?.(null), [onActivePositionChange]);

  const activePlan = plan ?? previewPlan;
  const currentItem = status === 'RUNNING' ? executionItems[itemCursor] ?? null : null;
  const currentStep = currentItem?.kind === 'STEP' ? currentItem.step : null;
  const currentInactiveBlock = currentItem?.kind === 'INACTIVE_BLOCK'
    ? currentItem.block
    : null;
  const progress = activePlan.steps.length === 0
    ? status === 'COMPLETED' ? 100 : 0
    : Math.round((processedCommands / activePlan.steps.length) * 100);

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
        <button
          type="button"
          className={styles.runButton}
          disabled={selectedBlockIds.length === 0}
          onClick={run}
        >
          <Play size={14} aria-hidden="true" /> RUN SMOKE TEST
        </button>
        <label className={styles.speedSelector}>
          <span>Speed</span>
          <select
            aria-label="Smoke Test speed"
            value={stepIntervalMs}
            onChange={event => setStepIntervalMs(Number(event.target.value))}
          >
            {SPEED_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label
          className={styles.runtimeToggle}
          title={writeRuntimeValues
            ? 'ON: generated Smoke values are saved to connected runtime variables and broadcast to open Variables pages.'
            : 'OFF: generated Smoke values remain inside this simulation and do not change saved runtime values.'}
        >
          <input
            type="checkbox"
            checked={writeRuntimeValues}
            disabled={!runtimeWriteAvailable}
            onChange={event => setWriteRuntimeValues(event.target.checked)}
          />
          <span aria-hidden="true"><i /></span>
          <b>{writeRuntimeValues ? 'ON' : 'OFF'}</b>
        </label>
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
          : currentInactiveBlock
            ? `Block #${currentInactiveBlock.blockOrder ?? currentInactiveBlock.blockId ?? '?'} ${currentInactiveBlock.blockName}`
            : 'Not executing'}</strong>
        <small>{currentStep
          ? `#${currentStep.instructionOrder ?? '?'} ${currentStep.instructionName} - ID ${currentStep.instructionId ?? 'Missing'}`
          : currentInactiveBlock
            ? `BLOCK INACTIVE - ${currentInactiveBlock.steps.length} instruction(s) will be skipped.`
            : status === 'COMPLETED'
              ? 'All visible commands were simulated.'
              : 'Press Run Smoke Test to begin.'}</small>
        <div className={styles.progress} aria-label={`${progress}% completed`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>{processedCommands} / {activePlan.steps.length} commands</small>
      </section>

      <section className={styles.logSection} aria-label="Smoke Test results">
        <header><span>Step log</span><b>{entries.length}</b></header>
        <VariablesSmokeTestLog entries={entries} />
      </section>

      <section className={styles.counters} aria-label="Smoke Test counters">
        {(Object.keys(counters) as Array<keyof VariablesSmokeTestCounters>).map(counter => (
          <button type="button" key={counter} onClick={() => setReportCounter(counter)}>
            <span>{counter === 'warning' ? 'Warning' : `${counter.charAt(0).toLocaleUpperCase()}${counter.slice(1)}`}</span>
            <strong>{counters[counter]}</strong>
          </button>
        ))}
      </section>

      <footer className={styles.safety}>
        <ShieldCheck size={15} aria-hidden="true" />
        <span>No Playwright, Web page, or production execution is called.</span>
      </footer>

      {reportCounter !== null && (
        <VariablesSmokeTestReportModal
          counter={reportCounter}
          count={counters[reportCounter]}
          entries={entries}
          onClose={() => setReportCounter(null)}
        />
      )}
    </aside>
  );
};

export default VariablesSmokeTestPanel;
