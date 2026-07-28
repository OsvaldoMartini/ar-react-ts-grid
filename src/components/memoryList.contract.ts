import type { CreateBlockOption } from './CreateNewBlock';
import type { ElementDTO } from './instructionsMockData';

export type MemoryListSourceKind = 'BOT_JOB' | 'PAGE_SCANNER' | 'COMPONENT' | 'MIXED';
export type MemoryListItemSourceKind = Exclude<MemoryListSourceKind, 'MIXED'>;

export type MemoryListItemIcon =
  | 'click'
  | 'excel'
  | 'input'
  | 'link'
  | 'output'
  | 'screen'
  | 'wait'
  | 'default';

export interface BotJobMemoryListPayload {
  instructionId: number;
}

export interface PageScannerMemoryListPayload {
  elementDTO: ElementDTO;
}

export interface ComponentInstructionMemoryListPayload {
  kind: 'INSTRUCTION';
  componentInstructionId: number;
  componentBlockId: number;
  sourceRevision: string;
}

export interface ComponentBlockMemoryListPayload {
  kind: 'BLOCK';
  componentBlockId: number;
  sourceRevision: string;
}

/**
 * One authoritative member of the dependency group returned for an instruction.
 *
 * The row intentionally carries source identity/presentation data only. Parent,
 * variable, and destination IDs are resolved again by Java from the authoritative
 * graph before apply, so React never invents foreign keys.
 */
export interface MemoryInstructionGroupRow {
  id: number;
  order: number;
  name: string;
  action: string;
  parentId?: number | null;
  blockId: number;
}

/**
 * Optional cross-block context for dependency groups such as GOTO. The first
 * connected-group implementation is row based, but keeping this typed prevents
 * future block relationships from being represented by unvalidated `any` data.
 */
export interface MemoryInstructionGroupBlock {
  blockId: number;
  blockOrderNumber?: number;
  blockName?: string;
}

export type ComponentMemoryListPayload =
  | ComponentInstructionMemoryListPayload
  | ComponentBlockMemoryListPayload;

export type MemoryListItemPayload =
  | BotJobMemoryListPayload
  | PageScannerMemoryListPayload
  | ComponentMemoryListPayload;

export interface MemoryListItem<
  TPayload extends MemoryListItemPayload = MemoryListItemPayload,
> {
  /**
   * Globally unique presentation key. Source producers namespace this value so
   * an instruction and a scanned element can coexist in one aggregate list.
   */
  key: string;
  sourceKind: MemoryListItemSourceKind;
  /**
   * Backend-authorized connected-graph identity. Items with the same key are one
   * atomic Memory List unit: they are reordered, removed, and applied together.
   */
  dependencyGroupKey?: string;
  /**
   * Producer-native key used when the aggregate workspace routes commands back
   * to the component that owns the item.
   */
  sourceItemKey: string;
  label: string;
  detail?: string;
  icon?: MemoryListItemIcon;
  active?: boolean;
  payload?: TPayload;
}

export interface MemoryListSnapshot {
  ownerEpoch: string;
  sourceKind: MemoryListSourceKind;
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
  items: MemoryListItem[];
  blocks: CreateBlockOption[];
  targetBlockId: number | null;
  emptyMessage: string;
  status?: string;
  busy?: boolean;
  canApply?: boolean;
}

/**
 * Mirrors the Java aggregate Memory List rule. A whole reusable Component block
 * creates its own Bot Job block, so neither that item nor individually selected
 * rows already covered by the same block require a destination. Every other item
 * must have a valid Bot Job target block.
 */
export const memoryListRequiresTargetBlock = (items: MemoryListItem[]): boolean => {
  const selectedComponentBlocks = new Set(
    items
      .filter(item => item.sourceKind === 'COMPONENT')
      .map(item => item.payload as ComponentMemoryListPayload | undefined)
      .filter(
        (payload): payload is ComponentBlockMemoryListPayload =>
          payload?.kind === 'BLOCK' && payload.componentBlockId > 0,
      )
      .map(payload => payload.componentBlockId),
  );

  return items.some(item => {
    if (item.sourceKind !== 'COMPONENT') return true;
    const payload = item.payload as ComponentMemoryListPayload | undefined;
    if (payload?.kind === 'BLOCK') return false;
    if (payload?.kind === 'INSTRUCTION') {
      return !selectedComponentBlocks.has(payload.componentBlockId);
    }
    return true;
  });
};
