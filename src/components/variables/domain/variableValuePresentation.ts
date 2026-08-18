import type {
  VariableCommandLink,
  VariableGraphEntry,
} from '../../variablesWorkspace.contract';

export type ConfiguredValueState = 'EMPTY' | 'VALUE' | 'NOT_CONFIGURED';
export type RuntimeTopologyState = 'SOURCE_DEFINED' | 'VOID';

export interface VariableValuePresentation {
  configuredState: ConfiguredValueState;
  configuredLabel: string;
  configuredDetail: string;
  runtimeState: RuntimeTopologyState;
  runtimeLabel: string;
  runtimeDetail: string;
  activeProducers: VariableCommandLink[];
  activeConsumers: VariableCommandLink[];
}

const effectivelyActive = (command: VariableCommandLink): boolean =>
  command.active === true && command.blockActive === true;

export const variableValuePresentation = (
  variable: VariableGraphEntry,
): VariableValuePresentation => {
  const configured = variable.configuredValue.trim();
  const activeProducers = variable.producers.filter(effectivelyActive);
  const activeConsumers = variable.consumers.filter(effectivelyActive);
  const configuredState: ConfiguredValueState = configured === '$EMPTY'
    ? 'EMPTY'
    : configured
      ? 'VALUE'
      : 'NOT_CONFIGURED';

  return {
    configuredState,
    configuredLabel: configuredState === 'EMPTY'
      ? 'EMPTY'
      : configuredState === 'VALUE'
        ? variable.configuredValue
        : 'Not configured',
    configuredDetail: configuredState === 'EMPTY'
      ? 'Configured $EMPTY sentinel'
      : configuredState === 'VALUE'
        ? 'Configured declaration value'
        : 'No configured declaration value',
    runtimeState: activeProducers.length > 0 ? 'SOURCE_DEFINED' : 'VOID',
    runtimeLabel: activeProducers.length > 0
      ? 'GET source defined'
      : 'VOID - no active GET producer',
    runtimeDetail: activeProducers.length > 0
      ? 'A runtime writer exists; its current value is not streamed yet.'
      : 'No active GET producer is present in the declared graph. Current runtime values are not streamed.',
    activeProducers,
    activeConsumers,
  };
};
