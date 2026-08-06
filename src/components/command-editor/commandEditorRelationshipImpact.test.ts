import type { ComponentEditorCommand } from './componentEditor.types';
import {
  commandEditorRelationshipImpact,
  hasCommandEditorRelationshipImpact,
} from './commandEditorRelationshipImpact';

const loop: ComponentEditorCommand = {
  instructionId: 200,
  instructionOrder: 4,
  instructionName: 'Loop',
  action: 'LOOP',
  operation: '',
  onHoldSeconds: null,
  blockId: 10,
  blockOrder: 1,
  blockName: 'Main',
  active: true,
  parentId: 100,
  parentBlockId: 10,
};

test('KEEP does not disconnect a LOOP when the GridItem projection omits its parent', () => {
  const impact = commandEditorRelationshipImpact(loop, 10, { kind: 'KEEP' }, [loop]);

  expect(hasCommandEditorRelationshipImpact(impact)).toBe(false);
  expect(impact).toEqual({
    clearParentId: false,
    clearParentBlockId: false,
    messages: [],
  });
});

test('an actual cross-Block LOOP move still reports its relationship impact', () => {
  const impact = commandEditorRelationshipImpact(loop, 20, { kind: 'TOP' }, [loop]);

  expect(impact.clearParentId).toBe(true);
  expect(impact.clearParentBlockId).toBe(true);
});
