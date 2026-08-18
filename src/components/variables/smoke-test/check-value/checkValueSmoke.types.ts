export type CheckValueSmokeStatus = 'PASS' | 'FAIL' | 'WARNING';

export type CheckValueSmokeEvaluation =
  | { status: 'PASS'; expression: string }
  | { status: 'FAIL'; expression: string }
  | { status: 'WARNING'; expression: string; reason: string };

export type CheckValueSmokeOperands = {
  expression: string;
  operator: string;
  formatPolicy: string;
  leftRawValue: string;
  rightRawValue: string;
};

export type CheckValueSmokeOperandResolution =
  | { ok: true; operands: CheckValueSmokeOperands }
  | { ok: false; evaluation: Extract<CheckValueSmokeEvaluation, { status: 'WARNING' }> };
