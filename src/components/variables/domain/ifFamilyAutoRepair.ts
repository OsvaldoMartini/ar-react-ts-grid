import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  BotJobGraphMutationDraft,
  InstructionGraphRelationPatch,
} from '../../bot-job-details/grid/domain/instructionGraphMutation.contract';
import type {
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';

const CONDITIONAL_ACTIONS = new Set(['IF', 'ELSEIF', 'ELSE', 'ENDIF']);

export type IfFamilyAutoRepairPlan = {
  /** Guard: submit only while the snapshot still matches this key. */
  authorityKey: string;
  /** One RELATIONSHIP_UPDATE draft carrying every deterministic family fix. */
  draft: BotJobGraphMutationDraft;
  repairedInstructionIds: readonly number[];
  rootInstructionIds: readonly number[];
};

const autoRepairAuthorityKey = (snapshot: VariableWorkspaceSnapshot): string =>
  [
    snapshot.bindingEpoch,
    snapshot.workspaceEpoch,
    snapshot.graphRevision,
    snapshot.mutationCapability?.graphVersion ?? '',
    snapshot.mutationCapability?.graphRevision ?? '',
  ].join(':');

/**
 * IF-family links are a CLOSED rule (user decision 2026-08-03): with exactly one
 * IF root in a Block there is exactly ONE valid wiring — the IF references
 * itself and every ELSEIF/ELSE/ENDIF references that IF and the containing
 * Block. Nothing to choose means nothing to ask: this planner emits the exact
 * deterministic patches instead of surfacing "Repair Conditional" chips.
 *
 * Blocks with zero or multiple IF roots are NOT deterministic and are left for
 * the explicit reconnect flow.
 */
export const planIfFamilyAutoRepair = (
  snapshot: VariableWorkspaceSnapshot,
): IfFamilyAutoRepairPlan | null => {
  const capability = snapshot.mutationCapability;
  if (!capability || !capability.enabled) return null;

  const byBlock = new Map<number, VariablesInstructionFact[]>();
  for (const fact of capability.instructionFacts) {
    if (!CONDITIONAL_ACTIONS.has(canonicalInstructionAction(fact.action))) continue;
    const block = byBlock.get(fact.blockId);
    if (block) block.push(fact);
    else byBlock.set(fact.blockId, [fact]);
  }

  const patches: InstructionGraphRelationPatch[] = [];
  const repairedInstructionIds: number[] = [];
  const rootInstructionIds: number[] = [];
  for (const [blockId, boundaries] of byBlock) {
    const roots = boundaries.filter(
      fact => canonicalInstructionAction(fact.action) === 'IF',
    );
    if (roots.length !== 1) continue;
    const root = roots[0];
    let blockRepaired = false;
    for (const fact of boundaries) {
      if (fact.parentId === root.instructionId && fact.parentBlockId === blockId) {
        continue;
      }
      patches.push({
        instructionId: fact.instructionId,
        relationKind: 'CONDITIONAL_ROOT',
        operation: 'SET',
        expected: {
          parentId: fact.parentId,
          parentBlockId: fact.parentBlockId,
        },
        replacement: {
          parentId: root.instructionId,
          parentBlockId: blockId,
        },
      });
      repairedInstructionIds.push(fact.instructionId);
      blockRepaired = true;
    }
    if (blockRepaired) rootInstructionIds.push(root.instructionId);
  }
  if (patches.length === 0) return null;

  return {
    authorityKey: autoRepairAuthorityKey(snapshot),
    draft: {
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: capability.layoutRows.map(row => ({ ...row })),
      instructionRelationPatches: patches,
      variableBindingPatches: [],
      variableOwnerPatches: [],
    },
    repairedInstructionIds,
    rootInstructionIds,
  };
};
