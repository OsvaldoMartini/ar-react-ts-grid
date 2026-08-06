import type {
  ComponentEditorBlockOption,
  ComponentEditorCommand,
  ComponentEditorStoredConfiguration,
  ComponentEditorVariableOption,
} from '../command-editor/componentEditor.types';

export interface CommandEditorPageInstruction {
  id: number;
  name: string;
  actions: string;
  operation: string | null;
  blockId: number;
  blockName: string;
  blockOrderNumber: number;
  instructionOrderNumber: number;
  variableId: number | null;
  parentId: number | null;
  parentBlockId: number | null;
  onHoldSeconds: number | null;
  instructionActive: boolean | null;
}

export interface CommandEditorPageGraphCapability {
  enabled: true;
  contractVersion: 3;
  workspaceEpoch: number;
  graphVersion: number;
  graphRevision: string;
  ownerAssertion: {
    workspaceKind: 'BOT_JOB';
    homeBankingId: number;
    botJobId: number;
  };
}

export interface CommandEditorPageSnapshot {
  selectedBlockId: number | null;
  selectedInstructionId: number | null;
  selectionRevision: number;
  graphRevision: string;
  instructions: CommandEditorPageInstruction[];
  commands: ComponentEditorCommand[];
  blocks: ComponentEditorBlockOption[];
  variables: ComponentEditorVariableOption[];
  graphCapability: CommandEditorPageGraphCapability | null;
  connectionCount: number;
  diagnosticCount: number;
}

const positiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const nonNegativeInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

const nullablePositiveInteger = (value: unknown): number | null =>
  value == null ? null : positiveInteger(value);

const text = (value: unknown): string => typeof value === 'string' ? value : '';

const nullableBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

export const commandEditorPageInstructionFromPayload = (
  row: any,
): CommandEditorPageInstruction | null => {
  const id = positiveInteger(row?.id);
  const blockId = positiveInteger(row?.blockId);
  if (id === null || blockId === null) return null;
  return {
    id,
    name: text(row?.name),
    actions: text(row?.actions),
    operation: row?.operation == null ? null : text(row.operation),
    blockId,
    blockName: text(row?.blockName),
    blockOrderNumber: positiveInteger(row?.blockOrderNumber) ?? 1,
    instructionOrderNumber: positiveInteger(row?.instructionOrderNumber) ?? 1,
    variableId: nullablePositiveInteger(row?.variableId),
    parentId: nullablePositiveInteger(row?.parentId),
    parentBlockId: nullablePositiveInteger(row?.parentBlockId),
    onHoldSeconds: row?.onHoldSeconds == null ? null : Number(row.onHoldSeconds),
    instructionActive: nullableBoolean(row?.instructionActive ?? row?.active),
  };
};

const storedConfigurationFromPayload = (
  row: any,
): ComponentEditorStoredConfiguration => ({
  commandType: text(row?.commandType),
  conditionSource: text(row?.conditionSource),
  leftVariableId: nullablePositiveInteger(row?.leftVariableId),
  operandKind: text(row?.operandKind),
  comparisonOperator: text(row?.comparisonOperator),
  operandRawValue: text(row?.operandRawValue),
  operandVariableId: nullablePositiveInteger(row?.operandVariableId),
  outputKey: text(row?.outputKey),
  outputColumn: text(row?.outputColumn),
  outputFile: text(row?.outputFile),
  externalSourceKey: text(row?.externalSourceKey),
  formatPolicy: text(row?.formatPolicy),
});

const graphCapabilityFromPayload = (
  body: any,
): CommandEditorPageGraphCapability | null => {
  const candidate = body?.workspaceCapabilities?.botJobGraphMutationV3;
  const owner = candidate?.ownerAssertion;
  const workspaceEpoch = positiveInteger(candidate?.workspaceEpoch);
  const rootWorkspaceEpoch = positiveInteger(body?.workspaceEpoch);
  const graphVersion = nonNegativeInteger(candidate?.graphVersion);
  const homeBankingId = positiveInteger(owner?.homeBankingId);
  const botJobId = positiveInteger(owner?.botJobId);
  const graphRevision = text(candidate?.graphRevision).trim();
  if (
    candidate?.enabled !== true
    || Number(candidate?.contractVersion) !== 3
    || workspaceEpoch === null
    || (rootWorkspaceEpoch !== null && rootWorkspaceEpoch !== workspaceEpoch)
    || graphVersion === null
    || homeBankingId === null
    || botJobId === null
    || owner?.workspaceKind !== 'BOT_JOB'
    || graphRevision.length === 0
  ) {
    return null;
  }
  return {
    enabled: true,
    contractVersion: 3,
    workspaceEpoch,
    graphVersion,
    graphRevision,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId,
      botJobId,
    },
  };
};

export const commandEditorPageSnapshotFromPayload = (
  payload: any,
  options: {
    mode?: 'EDIT' | 'CREATE';
    targetBlockId?: number | null;
  } = {},
): CommandEditorPageSnapshot | null => {
  const body = payload?.snapshot && typeof payload.snapshot === 'object'
    ? { ...payload, ...payload.snapshot }
    : payload;
  if (
    body?.ok === false
    || !Array.isArray(body?.blocks)
    || !Array.isArray(body?.instructions)
    || !Array.isArray(body?.variables)
    || typeof body?.graphRevision !== 'string'
  ) {
    return null;
  }

  const instructions: CommandEditorPageInstruction[] = (body.instructions as any[])
    .map(commandEditorPageInstructionFromPayload)
    .filter((row: CommandEditorPageInstruction | null): row is CommandEditorPageInstruction =>
      row !== null);
  const blocks: ComponentEditorBlockOption[] = body.blocks.flatMap((row: any) => {
    const blockId = positiveInteger(row?.id ?? row?.blockId);
    if (blockId === null) return [];
    return [{
      blockId,
      blockOrder: positiveInteger(row?.blockOrderNumber ?? row?.blockOrder) ?? blockId,
      blockName: text(row?.name ?? row?.blockName) || `Block ${blockId}`,
      commandCount: instructions.filter(command => command.blockId === blockId).length,
      active: typeof (row?.active ?? row?.blockActive) === 'boolean'
        ? Boolean(row?.active ?? row?.blockActive)
        : undefined,
    }];
  });
  const mode = options.mode ?? 'EDIT';
  const selectedInstructionId = positiveInteger(
    body?.selectedInstructionId ?? body?.instruction?.id,
  );
  const selectedBlockId = positiveInteger(
    body?.selectedBlockId ?? body?.instruction?.blockId ?? options.targetBlockId,
  );
  if (mode === 'EDIT') {
    if (
      selectedInstructionId === null
      || selectedBlockId === null
      || !instructions.some(row =>
        row.id === selectedInstructionId && row.blockId === selectedBlockId)
    ) {
      return null;
    }
  } else {
    const expectedTargetBlockId = positiveInteger(options.targetBlockId);
    if (
      selectedInstructionId !== null
      || (
        expectedTargetBlockId !== null
        && selectedBlockId !== expectedTargetBlockId
      )
      || (
        selectedBlockId !== null
        && !blocks.some(block => block.blockId === selectedBlockId)
      )
    ) return null;
  }

  const configurations = new Map<number, ComponentEditorStoredConfiguration>();
  if (Array.isArray(body?.commandConfigurations)) {
    body.commandConfigurations.forEach((row: any) => {
      const instructionId = positiveInteger(row?.instructionId);
      if (instructionId !== null) {
        configurations.set(instructionId, storedConfigurationFromPayload(row));
      }
    });
  }

  const commands: ComponentEditorCommand[] = instructions.map(row => ({
    instructionId: row.id,
    instructionOrder: row.instructionOrderNumber,
    instructionName: row.name,
    action: row.actions,
    operation: row.operation ?? '',
    onHoldSeconds: row.onHoldSeconds,
    blockId: row.blockId,
    blockOrder: row.blockOrderNumber,
    blockName: row.blockName,
    active: row.instructionActive,
    parentId: row.parentId,
    parentBlockId: row.parentBlockId,
    variableId: row.variableId,
    storedConfiguration: configurations.get(row.id) ?? null,
  }));

  const variables: ComponentEditorVariableOption[] = body.variables.flatMap((row: any) => {
    const variableId = positiveInteger(row?.id ?? row?.variableId);
    if (variableId === null) return [];
    return [{
      variableId,
      name: text(row?.name) || `Variable ${variableId}`,
      type: text(row?.type) || 'Variable',
    }];
  });

  const selected = selectedInstructionId === null
    ? null
    : instructions.find(row => row.id === selectedInstructionId) ?? null;
  const explicitConnectionCount = nonNegativeInteger(body?.connectionCount);
  const selectedVariableLinks = Array.isArray(body?.variableLinks)
    ? body.variableLinks.filter((row: any) => Number(row?.instructionId) === selectedInstructionId)
    : [];
  const inferredConnectionCount = Number(selected?.parentId != null)
    + Number(selected?.parentBlockId != null)
    + selectedVariableLinks.length;
  const diagnosticCount = nonNegativeInteger(body?.diagnosticCount)
    ?? (Array.isArray(body?.diagnostics) ? body.diagnostics.length : 0);

  return {
    selectedBlockId,
    selectedInstructionId,
    selectionRevision: nonNegativeInteger(body?.selectionRevision) ?? 0,
    graphRevision: body.graphRevision,
    instructions,
    commands,
    blocks,
    variables,
    graphCapability: graphCapabilityFromPayload(body),
    connectionCount: explicitConnectionCount ?? inferredConnectionCount,
    diagnosticCount,
  };
};
