// Flow tab — shared types between the panel components, the socket hook,
// and the persisted shape. Phase 2a builds the skeleton (list + CRUD).
// Step authoring (cards, payload editors) lands in Phase 2b/c.

export type FlowStepType = "API" | "UI" | "WAIT" | "ASSERT";

/** Mirror of Java FlowDTO. */
export interface Flow {
  id: number;
  botJobId: number;
  name: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Mirror of Java FlowStepDTO. {@code payloadJson} is parsed per stepType. */
export interface FlowStep {
  id?: number;
  flowId: number;
  stepOrder: number;
  name: string | null;
  stepType: FlowStepType;
  payloadJson: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// ── Per-step-type payload shapes (parsed from / serialised to payloadJson) ──
// Phase 2b/c populates editors that read/write these.

export interface ApiCapture { var: string; jsonpath: string; }
export interface ApiSubstitute { var: string; target: "header" | "path" | "body"; key: string; }

export interface ApiStepPayload {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  captures?: ApiCapture[];
  substitutes?: ApiSubstitute[];
}

export interface UiSubstitute { botInstructionId: number; var: string; }

export interface UiStepPayload {
  refBlockId: number;
  useCaseId?: number | null;     // optional autocomplete source for substitutions
  substitutes?: UiSubstitute[];
  captures?: ApiCapture[];       // re-uses same {var, expression} shape (DOM scrape)
}

export interface WaitStepPayload { seconds: number; }

export interface AssertStepPayload { expr: string; expected?: string; }
