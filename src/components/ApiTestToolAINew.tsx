/**
 * ApiTestToolAINew.tsx
 * Located at: src/components/ApiTestToolAINew.tsx
 *
 * Entry point for the Capi simulator.
 * index.tsx renders it as:
 *
 *   {sessionId && sessionId.includes("apiTestToolAINew") && (
 *     <ApiTestToolAINew
 *       homeBankingIdInitial={homeBanking}
 *       socketPort={socketPort}
 *       sessionId={sessionId}
 *       botJobIdInitial={botJobId}
 *       botJobNameInitial={botJobName}
 *     />
 *   )}
 *
 * Uses CapiShell (not App directly) so ThemeProvider + i18n are always mounted.
 */

import CapiShell from "./Capi/CapiShell";
export type { CapiProps } from "./Capi/App";

export default CapiShell;
