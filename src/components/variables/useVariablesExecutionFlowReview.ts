import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  VariableWorkspaceSnapshot,
} from '../variablesWorkspace.contract';
import {
  buildVariablesExecutionFlowReview,
  variablesExecutionFlowReviewAuthorityKey,
  type VariablesExecutionFlowReview,
} from './domain/variablesExecutionFlowReview';

export type VariablesExecutionFlowReviewState = Readonly<{
  authorityKey: string;
  scopeLabel: string;
  review: VariablesExecutionFlowReview;
}>;

export type VariablesExecutionFlowReviewController = Readonly<{
  reviewState: VariablesExecutionFlowReviewState | null;
  openReview: (
    scopeLabel: string,
  ) => VariablesExecutionFlowReviewState | null;
  closeReview: () => void;
}>;

const sameBotJob = (
  state: VariablesExecutionFlowReviewState,
  snapshot: VariableWorkspaceSnapshot,
): boolean => state.review.homeBankingId === snapshot.botJob.homeBankingId
  && state.review.botJobId === snapshot.botJob.id;

const reviewChanged = (
  current: VariablesExecutionFlowReviewState,
  authorityKey: string,
  next: VariablesExecutionFlowReview,
): boolean => current.authorityKey !== authorityKey
  || current.review.runtimeMemoryRevision !== next.runtimeMemoryRevision
  || current.review.relationshipsAvailable !== next.relationshipsAvailable
  || current.review.connectionCount !== next.connectionCount
  || current.review.issueCount !== next.issueCount
  || current.review.steps.length !== next.steps.length
  || current.review.variableFlows.length !== next.variableFlows.length;

/**
 * Owns the read-only Variables execution review lifecycle.
 *
 * The review graph is deliberately lazy: it is built when openReview is
 * called, and rebuilt for real-time snapshots only while a review is open.
 * Closed workspaces never pay the graph-building cost.
 */
export const useVariablesExecutionFlowReview = (
  snapshot: VariableWorkspaceSnapshot | null,
): VariablesExecutionFlowReviewController => {
  const stateRef = useRef<VariablesExecutionFlowReviewState | null>(null);
  const [reviewState, setReviewState] =
    useState<VariablesExecutionFlowReviewState | null>(null);

  const replaceState = useCallback((
    next: VariablesExecutionFlowReviewState | null,
  ) => {
    stateRef.current = next;
    setReviewState(next);
  }, []);

  const closeReview = useCallback(() => {
    replaceState(null);
  }, [replaceState]);

  const openReview = useCallback((
    scopeLabel: string,
  ): VariablesExecutionFlowReviewState | null => {
    if (!snapshot) return null;

    const next: VariablesExecutionFlowReviewState = Object.freeze({
      authorityKey: variablesExecutionFlowReviewAuthorityKey(snapshot),
      scopeLabel: scopeLabel.trim() || 'Complete Bot Job',
      review: buildVariablesExecutionFlowReview(snapshot),
    });
    replaceState(next);
    return next;
  }, [replaceState, snapshot]);

  useEffect(() => {
    const current = stateRef.current;

    // Critical performance boundary: never build a review while it is closed.
    if (!current || !snapshot) return;

    if (!sameBotJob(current, snapshot)) {
      replaceState(null);
      return;
    }

    const authorityKey = variablesExecutionFlowReviewAuthorityKey(snapshot);
    const nextReview = buildVariablesExecutionFlowReview(snapshot);
    if (!reviewChanged(current, authorityKey, nextReview)) return;

    replaceState(Object.freeze({
      authorityKey,
      scopeLabel: current.scopeLabel,
      review: nextReview,
    }));
  }, [replaceState, snapshot]);

  return {
    reviewState,
    openReview,
    closeReview,
  };
};

export default useVariablesExecutionFlowReview;
