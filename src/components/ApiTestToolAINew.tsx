/**
 * ApiTestToolAINew.tsx
 * Located at: src/components/ApiTestToolAINew.tsx
 *
 * Entry point for the MultiTest platform.
 * index.tsx renders it as:
 *
 *   {sessionId && sessionId.includes("apiTestToolAINew") && (
 *     <ApiTestToolAINew
 *       homeOrgIdInitial={homeBanking}
 *       socketPort={socketPort}
 *       sessionId={sessionId}
 *       botJobIdInitial={botJobId}
 *       botJobNameInitial={botJobName}
 *     />
 *   )}
 *
 * Uses AppShell (not App directly) so ThemeProvider + i18n are always mounted.
 */

import AppShell from "./MultiTest/AppShell";
export type { AppProps } from "./MultiTest/App";

export default AppShell;
