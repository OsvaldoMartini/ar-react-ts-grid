import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BotJobBlockSummary, BotJobExecutionMode } from './BotJobDetails.types';

export type BotJobExecutionBlockSelection = 'all' | number;

interface ExecutionSelectionState {
  selectedBlockId: BotJobExecutionBlockSelection;
  mode: BotJobExecutionMode;
}

interface ExecutionSelectionMessage {
  botJobId: number;
  sourceId: string;
  selectedBlockId: BotJobExecutionBlockSelection;
  mode: BotJobExecutionMode;
}

const CHANNEL_NAME = 'arweb.bot-job.execution-selection';
const CUSTOM_EVENT = 'arweb:bot-job-execution-selection';
const STORAGE_PREFIX = 'arweb.bot-job.execution-selection.';

const DEFAULT_SELECTION: ExecutionSelectionState = {
  selectedBlockId: 'all',
  mode: 'ALL',
};

function sourceId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sameSelection(left: ExecutionSelectionState, right: ExecutionSelectionState): boolean {
  return left.selectedBlockId === right.selectedBlockId && left.mode === right.mode;
}

function storageKey(botJobId: number): string {
  return `${STORAGE_PREFIX}${botJobId}`;
}

function parseMessage(value: unknown): ExecutionSelectionMessage | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ExecutionSelectionMessage>;
  const selected = candidate.selectedBlockId;
  const validSelected = selected === 'all'
    || (typeof selected === 'number' && Number.isInteger(selected) && selected > 0);
  if (
    typeof candidate.botJobId !== 'number'
    || !Number.isInteger(candidate.botJobId)
    || candidate.botJobId <= 0
    || typeof candidate.sourceId !== 'string'
    || !validSelected
    || (candidate.mode !== 'ALL' && candidate.mode !== 'ONE')
  ) {
    return null;
  }
  return candidate as ExecutionSelectionMessage;
}

function parseStoredMessage(raw: string | null): ExecutionSelectionMessage | null {
  if (!raw) return null;
  try {
    return parseMessage(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function useSharedBotJobExecutionSelection(
  botJobId: number | null | undefined,
  blocks: BotJobBlockSummary[],
) {
  const [selection, setSelection] = useState<ExecutionSelectionState>(DEFAULT_SELECTION);
  const selectionRef = useRef(selection);
  const sourceIdRef = useRef(sourceId());
  const channelRef = useRef<BroadcastChannel | null>(null);

  const validBlockIds = useMemo(() => new Set(blocks.map((block) => block.id)), [blocks]);

  const normalize = useCallback((candidate: Partial<ExecutionSelectionState> | null | undefined): ExecutionSelectionState => {
    const requestedBlockId = candidate?.selectedBlockId;
    const selectedBlockId: BotJobExecutionBlockSelection =
      typeof requestedBlockId === 'number' && validBlockIds.has(requestedBlockId)
        ? requestedBlockId
        : 'all';
    const requestedMode = candidate?.mode === 'ONE' ? 'ONE' : 'ALL';
    return {
      selectedBlockId,
      mode: selectedBlockId === 'all' ? 'ALL' : requestedMode,
    };
  }, [validBlockIds]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    setSelection((current) => {
      const normalized = normalize(current);
      return sameSelection(current, normalized) ? current : normalized;
    });
  }, [normalize]);

  const applyExternalSelection = useCallback((message: ExecutionSelectionMessage | null) => {
    if (!message || !botJobId || message.botJobId !== botJobId || message.sourceId === sourceIdRef.current) return;
    const normalized = normalize({
      selectedBlockId: message.selectedBlockId,
      mode: message.mode,
    });
    setSelection((current) => (sameSelection(current, normalized) ? current : normalized));
  }, [botJobId, normalize]);

  const publish = useCallback((next: ExecutionSelectionState) => {
    if (!botJobId || botJobId <= 0) {
      setSelection(next);
      return;
    }
    const normalized = normalize(next);
    setSelection(normalized);
    const message: ExecutionSelectionMessage = {
      botJobId,
      sourceId: sourceIdRef.current,
      selectedBlockId: normalized.selectedBlockId,
      mode: normalized.mode,
    };

    try {
      window.localStorage.setItem(storageKey(botJobId), JSON.stringify(message));
    } catch {
      // Storage is best-effort; BroadcastChannel/custom events still keep open windows in sync.
    }

    try {
      window.dispatchEvent(new CustomEvent(CUSTOM_EVENT, { detail: message }));
    } catch {
      // Ignore environments without CustomEvent support.
    }

    try {
      channelRef.current?.postMessage(message);
    } catch {
      // Ignore closed/unavailable channels.
    }
  }, [botJobId, normalize]);

  useEffect(() => {
    if (!botJobId || botJobId <= 0) {
      setSelection(DEFAULT_SELECTION);
      return undefined;
    }

    const stored = parseStoredMessage(window.localStorage.getItem(storageKey(botJobId)));
    applyExternalSelection(stored);

    const handleCustomEvent = (event: Event) => {
      applyExternalSelection(parseMessage((event as CustomEvent).detail));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey(botJobId)) {
        applyExternalSelection(parseStoredMessage(event.newValue));
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => applyExternalSelection(parseMessage(event.data));
      channelRef.current = channel;
    }

    window.addEventListener(CUSTOM_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(CUSTOM_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      if (channelRef.current === channel) channelRef.current = null;
      channel?.close();
    };
  }, [applyExternalSelection, botJobId]);

  const selectBlock = useCallback((selectedBlockId: BotJobExecutionBlockSelection) => {
    publish({
      selectedBlockId,
      mode: selectedBlockId === 'all' ? 'ALL' : 'ONE',
    });
  }, [publish]);

  const toggleMode = useCallback(() => {
    const current = selectionRef.current;
    if (current.selectedBlockId === 'all') return;
    publish({
      selectedBlockId: current.selectedBlockId,
      mode: current.mode === 'ALL' ? 'ONE' : 'ALL',
    });
  }, [publish]);

  return {
    selectedBlockId: selection.selectedBlockId,
    mode: selection.mode,
    selectBlock,
    toggleMode,
  };
}
