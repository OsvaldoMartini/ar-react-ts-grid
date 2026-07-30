import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import type { VariablesDropPlacement } from './domain/variablesInstructionMove';

type DropIntent = {
  targetInstructionId: number;
  placement: VariablesDropPlacement;
};

type Options = {
  authorityKey: string;
  disabled: boolean;
  onDropInstruction: (
    sourceInstructionId: number,
    targetInstructionId: number,
    placement: VariablesDropPlacement,
  ) => void;
};

const DATA_TYPE = 'application/x-arweb-variable-instruction';

/**
 * Page-private native drag controller for the Variables execution lane.
 *
 * No drag state is shared with Bot Job Details, Components, or Memory List.
 */
export const useVariablesInstructionDrag = ({
  authorityKey,
  disabled,
  onDropInstruction,
}: Options) => {
  const [sourceInstructionId, setSourceInstructionId] = useState<number | null>(null);
  const [dropIntent, setDropIntent] = useState<DropIntent | null>(null);
  const sourceInstructionIdRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    sourceInstructionIdRef.current = null;
    setSourceInstructionId(null);
    setDropIntent(null);
  }, []);

  useEffect(() => {
    clear();
  }, [authorityKey, clear]);

  const onDragStart = useCallback((
    event: DragEvent<HTMLElement>,
    instructionId: number,
  ) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DATA_TYPE, String(instructionId));
    event.dataTransfer.setData('text/plain', String(instructionId));
    sourceInstructionIdRef.current = instructionId;
    setSourceInstructionId(instructionId);
    setDropIntent(null);
  }, [disabled]);

  const onDragEnd = useCallback(() => clear(), [clear]);

  const onDragOver = useCallback((
    event: DragEvent<HTMLElement>,
    targetInstructionId: number,
    placement: VariablesDropPlacement,
  ) => {
    const source = sourceInstructionIdRef.current;
    if (
      disabled
      || source === null
      || source === targetInstructionId
    ) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropIntent({ targetInstructionId, placement });
  }, [disabled]);

  const onDragLeave = useCallback((
    event: DragEvent<HTMLElement>,
    targetInstructionId: number,
    placement?: VariablesDropPlacement,
  ) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDropIntent(current =>
      current?.targetInstructionId === targetInstructionId
      && (placement === undefined || current.placement === placement)
        ? null
        : current);
  }, []);

  const onDrop = useCallback((
    event: DragEvent<HTMLElement>,
    targetInstructionId: number,
    placement: VariablesDropPlacement,
  ) => {
    event.preventDefault();
    const customTransfer = event.dataTransfer.getData(DATA_TYPE);
    const plainTransfer = event.dataTransfer.getData('text/plain');
    const transferredValue = customTransfer || plainTransfer;
    const transferred = transferredValue ? Number(transferredValue) : null;
    const validTransfer = transferred === null
      || (Number.isSafeInteger(transferred) && transferred > 0);
    const source = sourceInstructionIdRef.current;
    clear();
    if (
      disabled
      || source === null
      || !validTransfer
      || (transferred !== null && transferred !== source)
      || source === targetInstructionId
    ) {
      return;
    }
    onDropInstruction(source, targetInstructionId, placement);
  }, [clear, disabled, onDropInstruction]);

  const isDropActive = (
    targetInstructionId: number,
    placement: VariablesDropPlacement,
  ): boolean =>
    dropIntent?.targetInstructionId === targetInstructionId
    && dropIntent.placement === placement;

  return {
    sourceInstructionId,
    isDropActive,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};
