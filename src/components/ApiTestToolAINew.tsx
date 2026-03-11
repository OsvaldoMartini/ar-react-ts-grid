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
 */

import CapiApp from "./Capi/App";
export type { CapiProps } from "./Capi/App";

export default CapiApp;
