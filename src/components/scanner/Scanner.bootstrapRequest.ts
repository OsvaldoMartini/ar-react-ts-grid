export interface ScannerBootstrapRequestContext {
  enabled: boolean;
  connected: boolean;
  socketReadyState: number | null;
  openReadyState: number;
  botJobId: number | null;
  force: boolean;
  alreadyBootstrappedOnSocket: boolean;
}

export function canRequestScannerBootstrap(context: ScannerBootstrapRequestContext): boolean {
  if (!context.enabled || !context.connected) return false;
  if (context.socketReadyState !== context.openReadyState) return false;
  if (!context.botJobId || context.botJobId <= 0) return false;
  return context.force || !context.alreadyBootstrappedOnSocket;
}
