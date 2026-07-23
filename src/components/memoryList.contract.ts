import type { CreateBlockOption } from './CreateNewBlock';
import type { ElementDTO } from './instructionsMockData';

export type MemoryListSourceKind = 'BOT_JOB' | 'PAGE_SCANNER' | 'MIXED';
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

export type MemoryListItemPayload =
  | BotJobMemoryListPayload
  | PageScannerMemoryListPayload;

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
