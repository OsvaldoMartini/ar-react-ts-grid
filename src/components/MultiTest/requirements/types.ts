// Requirements tab — shared types.
//
// A Requirement is a high-context description of a functional case that
// must be executed. Many-to-many linkable to Use Cases (Functional Cases)
// and Flows (Flow Tests) via the requirement_use_case / requirement_flow
// tables.

export type RequirementPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RequirementStatus = "ACTIVE" | "ARCHIVED";

/** Mirror of Java RequirementDTO. */
export interface Requirement {
  id: number;
  botJobId: number;
  externalRef: string | null;
  title: string;
  description: string | null;
  priority: RequirementPriority | null;
  status: RequirementStatus;
  createdAt: string | null;
  updatedAt: string | null;
  /** Roll-ups from server: how many use cases / flows are linked. */
  linkedUseCaseCount: number;
  linkedFlowCount: number;
}

/** Mirror of Java RequirementLinksDTO. */
export interface RequirementLinks {
  requirementId: number;
  useCaseIds: number[];
  flowIds: number[];
}
