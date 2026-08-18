import type {
  ExecutionPreflightOutcome,
  ExecutionPreflightReport,
} from '../BotJobDetails.types';

const explicitDispositionCounts = (
  report: ExecutionPreflightReport,
): {
  variable: number;
  structural: number;
  complete: boolean;
} => {
  let variable = 0;
  let structural = 0;
  let classified = 0;
  report.issues.forEach((issue) => {
    if (issue.disposition === 'VARIABLE_DIAGNOSTIC') {
      variable += 1;
      classified += 1;
    } else if (issue.disposition === 'STRUCTURAL_START_FAILURE') {
      structural += 1;
      classified += 1;
    }
  });
  return {
    variable,
    structural,
    complete: report.issues.length === report.totalIssues
      && classified === report.totalIssues,
  };
};

/**
 * Returns the semantic outcome used by React presentation.
 *
 * `status` remains the legacy wire field. A legacy `WOULD_BLOCK` report has no
 * reliable way to distinguish variable diagnostics from structural failures,
 * so it stays warning-only unless the additive outcome/count/disposition facts
 * prove that a structural start failure exists.
 */
export const executionPreflightOutcome = (
  report: ExecutionPreflightReport,
): ExecutionPreflightOutcome => {
  if (report.status === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (report.status === 'READY') return 'READY';

  const sample = explicitDispositionCounts(report);
  const structuralCount = report.structuralStartFailureCount;
  const variableCount = report.variableDiagnosticCount;
  const explicitlyVariableOnly = (
    structuralCount === 0
    && variableCount === report.totalIssues
  ) || (
    sample.complete
    && sample.structural === 0
  );
  if (explicitlyVariableOnly) return 'WARN';

  if (
    structuralCount !== undefined
    && structuralCount > 0
  ) {
    return 'BLOCKED';
  }
  if (sample.complete && sample.structural > 0) return 'BLOCKED';

  if (report.outcome === 'WARN' || report.outcome === 'BLOCKED') {
    return report.outcome;
  }

  // Backward compatibility: legacy WOULD_BLOCK was warning-only observation.
  return 'WARN';
};
