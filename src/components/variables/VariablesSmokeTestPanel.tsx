import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, FlaskConical, Octagon, Play, ShieldCheck } from 'lucide-react';
import type { VariablesExecutionFlowReview } from './domain/variablesExecutionFlowReview';
import { buildVariablesSmokeTestPlan } from './domain/variablesSmokeTestPlan';
import {
  simulateVariablesSmokeTestStep,
  type VariablesSmokeTestStepResult,
  variablesSmokeTestBlockKey,
} from './domain/variablesSmokeTestSimulation';
import type {
  VariablesSmokeTestCounters,
  VariablesSmokeTestLogEntry,
  VariablesSmokeTestPlan,
  VariablesSmokeTestPosition,
  VariablesSmokeTestRuntimeValue,
  VariablesSmokeTestStatus,
  VariablesSmokeTestStep,
} from './domain/variablesSmokeTestTypes';
import VariablesSmokeTestLog from './VariablesSmokeTestLog';
import VariablesSmokeTestReportModal from './VariablesSmokeTestReportModal';
import {
  buildSmokeExecutionProgram,
} from './Engine/smokeExecutionProgram';
import {
  initialLoopRemaining,
  resolveLoopCommandTransition,
} from './Engine/loopCommandEngine';
import {
  initialGotoRemaining,
  resolveGotoCommandTransition,
} from './Engine/gotoCommandEngine';
import type {
  CommandRemainingByInstructionId,
} from './Engine/controlFlowCommand.types';
import { resolveWaitCommandExecution } from './Engine/waitCommandEngine';
import { resolveExcelGotoTransition } from './Engine/excelGotoCommandEngine';
import {
  smokePlaywrightCommandBridge,
  type PlaywrightCommandResult,
} from './Engine/playwrightCommandBridge';
import {
  buildConditionalExecutionIndex,
  initialConditionalExecutionState,
  resolveConditionalBoundaryTransition,
  resolveConditionalCheckFailureTransition,
  type ConditionalExecutionState,
} from './Engine/ifElseCommandEngine';
import styles from './VariablesSmokeTestPanel.module.scss';
import ExcelDataModeToggle, { type ExcelDataMode } from '../excel-data/ExcelDataModeToggle';
import type { SmokeTestIntegrationController } from '../smoke-test/integration/useSmokeTestIntegrationRun';
import type {
  SmokeTestExecutionMode,
  SmokeTestIntegrationPagePolicy,
  SmokeTestIntegrationRuntimeMode,
  SmokeTestIntegrationStepResult,
} from '../smoke-test/integration/smokeTestIntegration.contract';
import SmokeTestWebPageRefreshButton from '../smoke-test/integration/SmokeTestWebPageRefreshButton';
import ConfirmationDialog from '../ConfirmationDialog';
import ExcelWriteManagerDialog from '../excel-write-manager/ExcelWriteManagerDialog';
import {
  EMPTY_EXCEL_WRITE_MANAGER,
  arriveExcelWrite,
  buildExcelWriteArtifacts,
  editExcelWriteCell,
  markExcelWriteFile,
  type ExcelWriteFlushPolicy,
  type ExcelWriteManagerState,
} from '../excel-write-manager/domain/excelWriteManager';

export interface VariablesSmokeTestPanelProps {
  review: VariablesExecutionFlowReview;
  selectedBlockIds: readonly number[];
  runtimeWriteAvailable?: boolean;
  onCommitRuntimeValue?: (variableId: number, value: string) => boolean;
  onActivePositionChange?: (position: VariablesSmokeTestPosition | null) => void;
  onExecutionTraceChange?: (positions: readonly VariablesSmokeTestPosition[]) => void;
  onCommandRemainingChange?: (remaining: CommandRemainingByInstructionId) => void;
  onRunStart?: () => void;
  excelDataMode?: ExcelDataMode;
  onExcelDataModeChange?: (mode: ExcelDataMode) => void;
  executionMode?: SmokeTestExecutionMode;
  integrationRuntimeMode?: SmokeTestIntegrationRuntimeMode;
  integrationPagePolicy?: SmokeTestIntegrationPagePolicy;
  integration?: SmokeTestIntegrationController;
  onStatusChange?: (status: VariablesSmokeTestStatus) => void;
}

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
  sequence: number,
  tone: VariablesSmokeTestLogEntry['tone'],
  message: string,
  counter: VariablesSmokeTestLogEntry['counter'] = null,
  now = new Date(),
): VariablesSmokeTestLogEntry => ({
  id: `${sequence}:${now.getTime()}:${tone}:${message}`,
  sequence,
  timestamp: now.toISOString(),
  tone,
  counter,
  message,
});

const generatedSmokeValue = (
  variableType: string,
  index: number,
): string => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return variableType.trim().toLocaleUpperCase().includes('NUMERIC')
    ? String(randomNumber)
    : `SMOKE_${index + 1}_${randomNumber}`;
};

const replaceSmokeStepDetail = (message: string, detail: string): string => {
  const separator = message.indexOf(': ');
  return separator < 0 ? detail : `${message.slice(0, separator)}: ${detail}`;
};

const localControlAction = (action: string): boolean => [
  'CK',
  'CHECKVALUE',
  'CSV CHECK',
  'PDF CHECK',
  'LOOP',
  'REFRESH_LOOP',
  'GOTO',
  'EXCEL GOTO',
  'IF',
  'ELSEIF',
  'ELSE',
  'ENDIF',
  'H',
  'HOLD',
  'WAIT',
  'PAUSE',
].includes(action.trim().toLocaleUpperCase());

const integrationResultForStep = (
  step: VariablesSmokeTestStep,
  result: SmokeTestIntegrationStepResult,
): VariablesSmokeTestStepResult => {
  const position = `Block #${step.blockOrder ?? step.blockId ?? '?'} ${step.blockName} - #${step.instructionOrder ?? '?'} ${step.instructionName}`;
  const tone = result.outcome === 'PASSED'
    ? 'SUCCESS'
    : result.outcome === 'BYPASSED'
      ? 'WARNING'
      : result.outcome === 'WARNING'
        ? 'WARNING'
        : 'FAIL';
  const counter = result.outcome === 'PASSED'
    ? 'passed'
    : result.outcome === 'BYPASSED'
      ? 'bypassed'
      : result.outcome === 'WARNING'
        ? 'warning'
        : 'failed';
  return {
    tone,
    counter,
    message: `${position}: ${result.message}`,
    runtimeWrites: [],
  };
};

const VariablesSmokeTestPanel: React.FC<VariablesSmokeTestPanelProps> = ({
  review,
  selectedBlockIds,
  runtimeWriteAvailable = false,
  onCommitRuntimeValue,
  onActivePositionChange,
  onExecutionTraceChange,
  onCommandRemainingChange,
  onRunStart,
  excelDataMode = 'REAL',
  onExcelDataModeChange,
  executionMode = 'SMOKE',
  integrationRuntimeMode = 'JAVA_V1',
  integrationPagePolicy = 'PRESERVE_ACTIVE',
  integration,
  onStatusChange,
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
  const [pausedStep, setPausedStep] = useState<VariablesSmokeTestStep | null>(null);
  const [excelWriteManager, setExcelWriteManager] = useState<ExcelWriteManagerState>(EMPTY_EXCEL_WRITE_MANAGER);
  const [excelWriteManagerOpen, setExcelWriteManagerOpen] = useState(false);
  const [excelWriteSaving, setExcelWriteSaving] = useState(false);
  const excelWriteManagerRef = useRef<ExcelWriteManagerState>(EMPTY_EXCEL_WRITE_MANAGER);
  const runtimeValuesRef = useRef<Map<number, VariablesSmokeTestRuntimeValue>>(new Map());
  const commandRemainingRef = useRef<CommandRemainingByInstructionId>({});
  const conditionalStateRef = useRef<ConditionalExecutionState>(
    initialConditionalExecutionState(),
  );
  const executionTraceRef = useRef<readonly VariablesSmokeTestPosition[]>([]);
  const integrationRef = useRef(integration);
  const pauseResolverRef = useRef<((decision: 'CONTINUE' | 'STOP') => void) | null>(null);
  const stopRequestedRef = useRef(false);
  const excelRowIndexRef = useRef(0);
  const datasetRowCountRef = useRef(0);
  const previewPlan = useMemo(
    () => buildVariablesSmokeTestPlan(review, selectedBlockIds),
    [review, selectedBlockIds],
  );
  const executionProgram = useMemo(
    () => plan === null ? null : buildSmokeExecutionProgram(plan),
    [plan],
  );
  const executionItems = useMemo(
    () => executionProgram?.items ?? [],
    [executionProgram],
  );
  const conditionalIndex = useMemo(
    () => executionProgram === null
      ? null
      : buildConditionalExecutionIndex(executionProgram),
    [executionProgram],
  );

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    integrationRef.current = integration;
  }, [integration]);

  const resolvePause = useCallback((decision: 'CONTINUE' | 'STOP') => {
    const resolve = pauseResolverRef.current;
    if (resolve === null) return;
    pauseResolverRef.current = null;
    setPausedStep(null);
    resolve(decision);
  }, []);

  const pauseAt = useCallback((step: VariablesSmokeTestStep) => {
    const previous = pauseResolverRef.current;
    if (previous !== null) previous('STOP');
    setPausedStep(step);
    return new Promise<'CONTINUE' | 'STOP'>((resolve) => {
      pauseResolverRef.current = resolve;
    });
  }, []);

  const replaceExcelWriteManager = useCallback((next: ExcelWriteManagerState) => {
    excelWriteManagerRef.current = next;
    setExcelWriteManager(next);
  }, []);

  const flushExcelWriteFiles = useCallback(async (blockId?: number) => {
    const candidates = excelWriteManagerRef.current.files.filter(file =>
      file.dirty && (blockId === undefined || file.touchedBlockIds.includes(blockId)));
    if (candidates.length === 0) return;
    if (executionMode !== 'INTEGRATION' || !integrationRef.current?.activeRun) {
      throw new Error('ExcelWrite files can be saved only by an active Integration run.');
    }
    setExcelWriteSaving(true);
    try {
      for (const file of candidates) {
        replaceExcelWriteManager(markExcelWriteFile(
          excelWriteManagerRef.current, file.fileId, 'UPLOADING', 'Sending finalized DTO to Java…'));
        try {
          const artifacts = await buildExcelWriteArtifacts(file);
          let message = '';
          for (const artifact of artifacts) {
            message = await integrationRef.current.saveExcelWrite({
              outputFile: file.outputFile,
              delimiter: file.delimiter,
              columns: file.columns,
              instructionIds: file.instructionIds,
              ...artifact,
              revision: file.revision,
            });
          }
          replaceExcelWriteManager(markExcelWriteFile(
            excelWriteManagerRef.current, file.fileId, 'SAVED', message));
        } catch (failure) {
          replaceExcelWriteManager(markExcelWriteFile(
            excelWriteManagerRef.current, file.fileId, 'FAILED',
            failure instanceof Error ? failure.message : 'ExcelWrite save failed.'));
          throw failure;
        }
      }
    } finally {
      setExcelWriteSaving(false);
    }
  }, [executionMode, replaceExcelWriteManager]);

  useEffect(() => () => {
    const resolve = pauseResolverRef.current;
    pauseResolverRef.current = null;
    if (resolve !== null) resolve('STOP');
  }, []);

  const run = async () => {
    resolvePause('STOP');
    stopRequestedRef.current = false;
    excelRowIndexRef.current = 0;
    datasetRowCountRef.current = 0;
    replaceExcelWriteManager(Object.freeze({
      files: Object.freeze([]),
      policy: excelWriteManagerRef.current.policy,
    }));
    setExcelWriteManagerOpen(false);
    onRunStart?.();
    const nextPlan = buildVariablesSmokeTestPlan(review, selectedBlockIds);
    const nextProgram = buildSmokeExecutionProgram(nextPlan);
    const nextCommandRemaining = Object.freeze({
      ...initialLoopRemaining(nextProgram),
      ...initialGotoRemaining(nextProgram),
    });
    commandRemainingRef.current = nextCommandRemaining;
    conditionalStateRef.current = initialConditionalExecutionState();
    onCommandRemainingChange?.(nextCommandRemaining);
    runtimeValuesRef.current = new Map<number, VariablesSmokeTestRuntimeValue>(
      nextPlan.variableFlows.map((flow, index): [number, VariablesSmokeTestRuntimeValue] => {
        if (flow.runtimeState === 'VALUE') {
          return [flow.variableId, {
            state: 'VALUE' as const,
            value: flow.runtimeRawValue,
          }];
        }
        if (executionMode === 'INTEGRATION') {
          return [flow.variableId, {
            state: 'VOID' as const,
            value: '',
          }];
        }
        const value = generatedSmokeValue(flow.variableType, index);
        if (
          writeRuntimeValues
          && (!runtimeWriteAvailable
            || !onCommitRuntimeValue
            || !onCommitRuntimeValue(flow.variableId, value))
        ) {
          // The local Smoke value remains available even when durable memory is busy.
        }
        return [flow.variableId, {
          state: 'VALUE' as const,
          value,
        }];
      }),
    );
    setItemCursor(0);
    setProcessedCommands(0);
    setCounters(EMPTY_COUNTERS);
    setReportCounter(null);
    onActivePositionChange?.(null);
    executionTraceRef.current = [];
    onExecutionTraceChange?.([]);
    setEntries([]);
    if (executionMode === 'INTEGRATION') {
      if (!integration) {
        setStatus('STOPPED');
        setEntries([logEntry(0, 'ERROR', 'Smoke Test Integration is unavailable.', 'failed')]);
        setCounters({ ...EMPTY_COUNTERS, failed: 1 });
        return;
      }
      setStatus('STARTING');
      try {
        const startedRun = await integration.start(
          nextPlan,
          excelDataMode,
          integrationRuntimeMode,
          writeRuntimeValues,
          integrationPagePolicy,
        );
        runtimeValuesRef.current = new Map<number, VariablesSmokeTestRuntimeValue>(
          startedRun.runtimeSnapshot.values.map(value => [value.variableId, {
            state: value.state,
            value: value.value,
          }]),
        );
        datasetRowCountRef.current = startedRun.datasetRowCount;
      } catch (failure) {
        const message = failure instanceof Error ? failure.message : 'Smoke Test Integration could not start.';
        setStatus('STOPPED');
        setEntries([logEntry(0, 'ERROR', message, 'failed')]);
        setCounters({ ...EMPTY_COUNTERS, failed: 1 });
        return;
      }
    }
    setPlan(nextPlan);
    if (nextProgram.items.length === 0) {
      if (executionMode === 'INTEGRATION') {
        try {
          await integration?.finish();
        } catch (_) {
          // The empty run still has no instruction side effect to repeat.
        }
      }
      setStatus('COMPLETED');
      return;
    }
    setStatus('RUNNING');
  };

  const stop = async () => {
    const integrationCleanupPending = executionMode === 'INTEGRATION'
      && Boolean(integrationRef.current?.activeRun);
    if (status !== 'RUNNING' && !integrationCleanupPending) return;
    stopRequestedRef.current = true;
    resolvePause('STOP');
    setStatus('STOPPING');
    onActivePositionChange?.(null);
    if (executionMode === 'INTEGRATION') {
      try {
        await integrationRef.current?.stop('USER_REQUEST');
      } catch (failure) {
        const message = failure instanceof Error ? failure.message : 'Integration stop was not acknowledged.';
        setEntries(current => [...current, logEntry(processedCommands + 1, 'ERROR', message, 'failed')]);
      }
    }
    setStatus('STOPPED');
  };

  useEffect(() => {
    if (status !== 'RUNNING' || plan === null || executionProgram === null) return undefined;
    if (itemCursor >= executionItems.length) {
      onActivePositionChange?.(null);
      if (executionMode === 'INTEGRATION') {
        setStatus('STOPPING');
        const integrationController = integrationRef.current;
        if (!integrationController) {
          setEntries(current => [
            ...current,
            logEntry(processedCommands + 1, 'ERROR', 'Integration finish is unavailable.', 'failed'),
          ]);
          setCounters(current => ({ ...current, failed: current.failed + 1 }));
          setStatus('STOPPED');
          return undefined;
        }
        void flushExcelWriteFiles()
          .then(() => integrationController.finish())
          .then(() => setStatus('COMPLETED'))
          .catch(async (failure) => {
            const message = failure instanceof Error
              ? failure.message
              : 'Integration finish was not acknowledged.';
            setEntries(current => [
              ...current,
              logEntry(processedCommands + 1, 'ERROR', message, 'failed'),
            ]);
            setCounters(current => ({ ...current, failed: current.failed + 1 }));
            try {
              await integrationController.stop('EXCEL_WRITE_FLUSH_FAILED');
            } catch (_) {
              // The original flush failure remains the user-facing cause.
            }
            setStatus('STOPPED');
          });
      } else {
        setStatus('COMPLETED');
      }
      return undefined;
    }

    const item = executionItems[itemCursor];
    const blockKey = variablesSmokeTestBlockKey(item.block);
    const activePosition = {
      blockKey,
      stepKey: item.kind === 'STEP' ? item.step.key : null,
    };
    onActivePositionChange?.(activePosition);
    executionTraceRef.current = [...executionTraceRef.current, activePosition];
    onExecutionTraceChange?.(executionTraceRef.current);
    const activeStep = item.kind === 'STEP' && item.step.active;
    const activeAction = item.kind === 'STEP'
      ? item.step.action.trim().toLocaleUpperCase()
      : '';
    const loopTransition = activeStep
      ? resolveLoopCommandTransition(
          executionProgram,
          itemCursor,
          commandRemainingRef.current,
        )
      : null;
    const gotoTransition = activeStep
      ? resolveGotoCommandTransition(
          executionProgram,
          itemCursor,
          commandRemainingRef.current,
        )
      : null;
    const controlTransition = loopTransition ?? gotoTransition;
    const excelGotoTransition = activeStep && executionProgram !== null
      ? resolveExcelGotoTransition(
          executionProgram,
          itemCursor,
          excelRowIndexRef.current,
          datasetRowCountRef.current,
        )
      : null;
    const conditionalBoundaryTransition = activeStep && conditionalIndex !== null
      ? resolveConditionalBoundaryTransition(
          conditionalIndex,
          itemCursor,
          conditionalStateRef.current,
        )
      : null;
    const waitExecution = activeStep
      ? resolveWaitCommandExecution(item.step)
      : null;
    const executionDelayMs = stepIntervalMs
      + (controlTransition?.waitMs ?? waitExecution?.waitMs ?? 0);

    let cancelled = false;
    let timer: number | null = null;
    let playwrightResult: PlaywrightCommandResult | null = null;
    let integrationStepResult: SmokeTestIntegrationStepResult | null = null;

    const completeCurrentItem = async () => {
      let nextCursor = conditionalBoundaryTransition?.nextCursor
        ?? excelGotoTransition?.nextCursor
        ?? controlTransition?.nextCursor
        ?? (activeAction === 'Q' || activeAction === 'QUIT'
          ? executionItems.length
          : itemCursor + 1);
      if (item.kind === 'INACTIVE_BLOCK') {
        const skipped = item.block.steps.length;
        setEntries(current => [
          ...current,
          ...item.block.steps.map((step, index) => logEntry(
            processedCommands + index + 1,
            'WARNING',
            `Block #${item.block.blockOrder ?? item.block.blockId ?? '?'} ${item.block.blockName} - #${step.instructionOrder ?? '?'} ${step.instructionName}: bypassed because the Block is inactive.`,
            'bypassed',
          )),
        ]);
        setCounters(current => ({ ...current, bypassed: current.bypassed + skipped }));
        setProcessedCommands(current => current + skipped);
      } else {
        let simulatedResult = simulateVariablesSmokeTestStep(
          item.step,
          processedCommands + 1,
          runtimeValuesRef.current,
        );
        if (activeStep && ['E', 'EXCELWRITE'].includes(activeAction)) {
          try {
            const nextManager = arriveExcelWrite(
              excelWriteManagerRef.current,
              item.step,
              excelRowIndexRef.current,
              runtimeValuesRef.current,
            );
            replaceExcelWriteManager(nextManager);
            setExcelWriteManagerOpen(true);
            simulatedResult = {
              ...simulatedResult,
              tone: 'SUCCESS',
              counter: 'passed',
              message: replaceSmokeStepDetail(
                simulatedResult.message,
                'captured the configured variable in ExcelWriter Manager memory',
              ),
            };
          } catch (failure) {
            simulatedResult = {
              ...simulatedResult,
              tone: 'FAIL',
              counter: 'failed',
              message: replaceSmokeStepDetail(
                simulatedResult.message,
                failure instanceof Error ? failure.message : 'ExcelWrite memory capture failed.',
              ),
            };
          }
        }
        const result = integrationStepResult !== null
          && (!localControlAction(item.step.action)
            || integrationStepResult.outcome === 'FAILED'
            || integrationStepResult.disposition === 'UNSUPPORTED')
          ? integrationResultForStep(item.step, integrationStepResult)
          : simulatedResult;
        const engineWarning = controlTransition?.warning
          ?? excelGotoTransition?.warning
          ?? waitExecution?.warning
          ?? null;
        const engineMessage = controlTransition === null
          ? conditionalBoundaryTransition?.message
            ?? excelGotoTransition?.message
            ?? waitExecution?.message
            ?? null
          : [
              playwrightResult?.message,
              controlTransition.message,
              controlTransition.warning === null
                ? null
                : `${controlTransition.warning}.`,
            ].filter((part): part is string => Boolean(part)).join('; ');
        const engineResult = engineMessage === null
          ? result
          : {
              ...result,
              tone: engineWarning === null
                && playwrightResult?.status !== 'FAILED'
                  ? result.tone
                  : 'WARNING' as const,
              counter: engineWarning === null
                && playwrightResult?.status !== 'FAILED'
                  ? result.counter
                  : 'warning' as const,
              message: replaceSmokeStepDetail(
                result.message,
                engineWarning !== null && controlTransition === null
                  ? `${engineMessage} ${engineWarning}.`
                  : engineMessage,
              ),
            };
        const conditionalCheckTransition = engineResult.tone === 'FAIL'
          && conditionalIndex !== null
          ? resolveConditionalCheckFailureTransition(
              conditionalIndex,
              itemCursor,
            )
          : null;
        const displayedResult = conditionalCheckTransition === null
          ? engineResult
          : {
              ...engineResult,
              message: `${engineResult.message} ${conditionalCheckTransition.message}.`,
            };
        const refusedRuntimeWrites: string[] = [];
        displayedResult.runtimeWrites.forEach((write) => {
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
          logEntry(
            processedCommands + 1,
            refusedRuntimeWrites.length > 0 ? 'WARNING' : displayedResult.tone,
            refusedRuntimeWrites.length > 0
              ? `${displayedResult.message} Runtime write-through remained local for ${refusedRuntimeWrites.join(', ')}.`
              : displayedResult.message,
            refusedRuntimeWrites.length > 0 ? 'warning' : displayedResult.counter,
          ),
        ]);
        setCounters(current => ({
          ...current,
          [refusedRuntimeWrites.length > 0 ? 'warning' : displayedResult.counter]:
            current[refusedRuntimeWrites.length > 0 ? 'warning' : displayedResult.counter] + 1,
        }));
        setProcessedCommands(current => current + 1);
        if (controlTransition !== null) {
          const nextRemaining = Object.freeze({
            ...commandRemainingRef.current,
            [controlTransition.instructionId]: controlTransition.nextRemaining,
          });
          commandRemainingRef.current = nextRemaining;
          onCommandRemainingChange?.(nextRemaining);
        }
        if (excelGotoTransition !== null) {
          excelRowIndexRef.current = excelGotoTransition.nextRowIndex;
        }
        const conditionalTransition = conditionalCheckTransition
          ?? conditionalBoundaryTransition;
        if (conditionalTransition !== null) {
          conditionalStateRef.current = conditionalTransition.nextState;
          nextCursor = conditionalTransition.nextCursor;
        }
      }
      if (
        excelWriteManagerRef.current.policy === 'END_BLOCK'
        && item.block.blockId !== null
        && executionItems[nextCursor]?.block.blockId !== item.block.blockId
      ) {
        await flushExcelWriteFiles(item.block.blockId);
      }
      setItemCursor(nextCursor);
    };

    const scheduleCurrentItem = async () => {
      try {
        if (executionMode === 'INTEGRATION' && activeStep && item.kind === 'STEP') {
          if (item.step.instructionId === null) {
            throw new Error('Integration cannot execute an instruction without a database ID.');
          }
          if (!integrationRef.current) {
            throw new Error('Smoke Test Integration is unavailable.');
          }
          integrationStepResult = await integrationRef.current.executeStep(
            item.step.instructionId,
            excelRowIndexRef.current,
          );
          integrationStepResult.runtimeWrites.forEach((write) => {
            runtimeValuesRef.current.set(write.variableId, {
              state: 'VALUE',
              value: write.value,
            });
          });
          playwrightResult = {
            status: integrationStepResult.outcome === 'FAILED' ? 'FAILED' : 'COMPLETED',
            message: integrationStepResult.message,
          };
        } else if (controlTransition?.playwrightCommand) {
          playwrightResult = await smokePlaywrightCommandBridge.dispatch(
            controlTransition.playwrightCommand,
          );
        }
        if (
          activeStep
          && item.kind === 'STEP'
          && activeAction === 'PAUSE'
        ) {
          const decision = await pauseAt(item.step);
          if (cancelled || stopRequestedRef.current) return;
          if (decision === 'STOP') {
            stopRequestedRef.current = true;
            setStatus('STOPPING');
            onActivePositionChange?.(null);
            if (executionMode === 'INTEGRATION') {
              try {
                await integrationRef.current?.stop('PAUSE_STOP');
              } catch (failure) {
                const message = failure instanceof Error
                  ? failure.message
                  : 'Integration PAUSE stop was not acknowledged.';
                setEntries(current => [
                  ...current,
                  logEntry(processedCommands + 1, 'ERROR', message, 'failed'),
                ]);
              }
            }
            setStatus('STOPPED');
            return;
          }
        }
      } catch (failure) {
        if (cancelled) return;
        const message = failure instanceof Error
          ? failure.message
          : 'Integration instruction failed without a correlated response.';
        setEntries(current => [
          ...current,
          logEntry(processedCommands + 1, 'ERROR', message, 'failed'),
        ]);
        setCounters(current => ({ ...current, failed: current.failed + 1 }));
        setProcessedCommands(current => current + 1);
        onActivePositionChange?.(null);
        setStatus('STOPPING');
        void integrationRef.current?.stop('STEP_REQUEST_FAILED')
          .catch(() => undefined)
          .finally(() => setStatus('STOPPED'));
        return;
      }
      if (cancelled) return;
      timer = window.setTimeout(() => {
        void completeCurrentItem().catch((failure) => {
          if (cancelled) return;
          const message = failure instanceof Error ? failure.message : 'ExcelWrite end-of-Block save failed.';
          setEntries(current => [...current, logEntry(processedCommands + 1, 'ERROR', message, 'failed')]);
          setCounters(current => ({ ...current, failed: current.failed + 1 }));
          onActivePositionChange?.(null);
          setStatus('STOPPING');
          void integrationRef.current?.stop('EXCEL_WRITE_FLUSH_FAILED')
            .catch(() => undefined)
            .finally(() => setStatus('STOPPED'));
        });
      }, executionDelayMs);
    };
    void scheduleCurrentItem();

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [
    executionItems,
    executionProgram,
    executionMode,
    conditionalIndex,
    itemCursor,
    onActivePositionChange,
    onExecutionTraceChange,
    onCommitRuntimeValue,
    onCommandRemainingChange,
    pauseAt,
    flushExcelWriteFiles,
    replaceExcelWriteManager,
    plan,
    processedCommands,
    runtimeWriteAvailable,
    status,
    stepIntervalMs,
    writeRuntimeValues,
  ]);

  useEffect(() => () => {
    onActivePositionChange?.(null);
    onExecutionTraceChange?.([]);
    onCommandRemainingChange?.({});
  }, [onActivePositionChange, onCommandRemainingChange, onExecutionTraceChange]);

  const activePlan = plan ?? previewPlan;
  const currentItem = status === 'RUNNING' ? executionItems[itemCursor] ?? null : null;
  const currentStep = currentItem?.kind === 'STEP' ? currentItem.step : null;
  const currentInactiveBlock = currentItem?.kind === 'INACTIVE_BLOCK'
    ? currentItem.block
    : null;
  const progress = activePlan.steps.length === 0
    ? status === 'COMPLETED' ? 100 : 0
    : Math.min(100, Math.round((processedCommands / activePlan.steps.length) * 100));
  const executionActive = status === 'STARTING'
    || status === 'RUNNING'
    || status === 'STOPPING';
  const integrationUnavailable = executionMode === 'INTEGRATION'
    && (!runtimeWriteAvailable || !integration || integration.phase !== 'IDLE');

  return (
    <aside className={styles.panel} aria-label="Smoke Tests">
      <header className={styles.header}>
        <div>
          <span>{executionMode === 'INTEGRATION' ? 'Playwright workspace' : 'Simulation workspace'}</span>
          <h3><FlaskConical size={17} aria-hidden="true" /> {executionMode === 'INTEGRATION' ? 'INTEGRATION' : 'SMOKE TESTS'}</h3>
        </div>
        <b data-status={status}>{status}</b>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.runButton}
          disabled={selectedBlockIds.length === 0 || executionActive || integrationUnavailable}
          onClick={() => { void run(); }}
        >
          <Play size={14} aria-hidden="true" /> RUN
        </button>
        <ExcelDataModeToggle mode={excelDataMode}
          disabled={!onExcelDataModeChange || executionActive}
          onChange={mode => onExcelDataModeChange?.(mode)} />
        <label className={styles.speedSelector}>
          <span>Speed</span>
          <select
            aria-label="Smoke Test speed"
            value={stepIntervalMs}
            disabled={executionActive}
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
            disabled={!runtimeWriteAvailable || executionActive}
            onChange={event => setWriteRuntimeValues(event.target.checked)}
          />
          <span aria-hidden="true"><i /></span>
          <b>{writeRuntimeValues ? 'ON' : 'OFF'}</b>
          <small>Variables</small>
        </label>
        <SmokeTestWebPageRefreshButton
          refreshing={integration?.phase === 'REFRESHING'}
          disabled={executionMode !== 'INTEGRATION'
            || !runtimeWriteAvailable
            || !integration
            || integration.phase !== 'IDLE'
            || executionActive}
          onRefresh={() => { void integration?.refreshPage().catch(() => undefined); }}
        />
        <button type="button" className={styles.runButton} disabled={excelWriteManager.files.length === 0}
          title="Open ExcelWriter Manager" onClick={() => setExcelWriteManagerOpen(true)}>
          <FileSpreadsheet size={14} aria-hidden="true" /> FILES ({excelWriteManager.files.length})
        </button>
        <button
          type="button"
          className={styles.stopButton}
          disabled={executionMode === 'INTEGRATION'
            ? !integration?.activeRun || status === 'STOPPING'
            : status !== 'RUNNING'}
          onClick={() => { void stop(); }}
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
              ? executionMode === 'INTEGRATION'
                ? 'All visible commands completed through the Playwright Integration path.'
                : 'All visible commands were simulated.'
              : executionMode === 'INTEGRATION'
                ? 'Press Run to execute through Playwright Integration.'
                : 'Press Run to begin the Smoke Test.'}</small>
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
        <span>{executionMode === 'INTEGRATION'
          ? integrationRuntimeMode === 'TYPESCRIPT_PLAYWRIGHT_V2'
            ? 'Each physical step uses this run\'s isolated Node/Playwright session. Java V1 fallback is disabled.'
            : 'Each active instruction uses the established Java Playwright path. Java executeJob() is not used.'
          : 'No Playwright, Web page, or production execution is called.'}</span>
      </footer>

      {reportCounter !== null && (
        <VariablesSmokeTestReportModal
          counter={reportCounter}
          count={counters[reportCounter]}
          entries={entries}
          onClose={() => setReportCounter(null)}
        />
      )}
      {pausedStep !== null && (
        <ConfirmationDialog
          title={executionMode === 'INTEGRATION' ? 'PAUSE INTEGRATION' : 'PAUSE SMOKE TEST'}
          message={`Paused at Block #${pausedStep.blockOrder ?? pausedStep.blockId ?? '?'} ${pausedStep.blockName}.`}
          detail={`${pausedStep.instructionName || 'PAUSE'} is waiting. The current Playwright page remains open.`}
          confirmLabel="Continue"
          cancelLabel="Stop Run"
          initialFocus="confirm"
          onConfirm={() => resolvePause('CONTINUE')}
          onCancel={() => resolvePause('STOP')}
        />
      )}
      {excelWriteManagerOpen && (
        <ExcelWriteManagerDialog
          state={excelWriteManager}
          busy={excelWriteSaving}
          policyLocked={executionActive}
          onPolicyChange={(policy: ExcelWriteFlushPolicy) => replaceExcelWriteManager(Object.freeze({
            ...excelWriteManagerRef.current,
            policy,
          }))}
          onCellChange={(fileId, rowIndex, column, value) => replaceExcelWriteManager(
            editExcelWriteCell(excelWriteManagerRef.current, fileId, rowIndex, column, value))}
          onSave={() => { void flushExcelWriteFiles().catch(() => undefined); }}
          onClose={() => setExcelWriteManagerOpen(false)}
        />
      )}
    </aside>
  );
};

export default VariablesSmokeTestPanel;
