export type PlaywrightPageRefreshCommand = {
  type: 'PAGE_REFRESH';
  instructionId: number;
  blockId: number | null;
  source: 'REFRESH_LOOP';
};

export type PlaywrightBrowserCommand = PlaywrightPageRefreshCommand;

export type PlaywrightCommandResult = {
  status: 'SIMULATED' | 'COMPLETED' | 'FAILED';
  message: string;
};

export type PlaywrightCommandExecutor = (
  command: PlaywrightBrowserCommand,
) => Promise<PlaywrightCommandResult>;

/**
 * Single frontend boundary for commands that require a Playwright browser.
 * Smoke mode never contacts a browser. Production mode delegates to an
 * injected WebSocket/Playwright executor when that transport is connected.
 */
export class PlaywrightCommandBridge {
  private constructor(
    private readonly mode: 'SMOKE' | 'PRODUCTION',
    private readonly executor: PlaywrightCommandExecutor | null,
  ) {}

  static smoke(): PlaywrightCommandBridge {
    return new PlaywrightCommandBridge('SMOKE', null);
  }

  static production(executor: PlaywrightCommandExecutor): PlaywrightCommandBridge {
    return new PlaywrightCommandBridge('PRODUCTION', executor);
  }

  async dispatch(command: PlaywrightBrowserCommand): Promise<PlaywrightCommandResult> {
    if (this.mode === 'SMOKE') {
      return {
        status: 'SIMULATED',
        message: command.type === 'PAGE_REFRESH'
          ? 'simulated Playwright browser refresh completed'
          : 'simulated Playwright command completed',
      };
    }
    if (this.executor === null) {
      return {
        status: 'FAILED',
        message: 'production Playwright executor is unavailable',
      };
    }
    try {
      return await this.executor(command);
    } catch (error) {
      return {
        status: 'FAILED',
        message: error instanceof Error
          ? error.message
          : 'production Playwright command failed',
      };
    }
  }
}

export const smokePlaywrightCommandBridge = PlaywrightCommandBridge.smoke();
