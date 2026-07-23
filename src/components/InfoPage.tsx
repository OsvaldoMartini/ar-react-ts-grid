import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileKey2, Info, RefreshCw } from 'lucide-react';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import { useWebSocket } from './useWebSocket';
import styles from './InfoPage.module.scss';

export const INFO_PAGE_SESSION_ID = 'aboutPanel';

type LicenseSummary = {
  ok?: boolean;
  statusCode?: string;
  status?: string;
  active?: boolean;
  requiresActivation?: boolean;
  path?: string;
  organization?: string;
  owner?: string;
  licensedUser?: string;
  error?: string;
};

type AboutInformation = {
  ok?: boolean;
  product?: string;
  version?: string;
  build?: string;
  expiration?: string | null;
  copyright?: string;
  license?: LicenseSummary;
};

type Status = {
  level: 'ok' | 'warn' | 'error';
  text: string;
};

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const parseMessage = (raw: string): { operationId?: string; body: any } => {
  const envelope = JSON.parse(raw);
  let body = envelope?.body ?? envelope;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = { message: body };
    }
  }
  return {
    operationId: envelope?.operationId || envelope?.type,
    body,
  };
};

const displayValue = (value: unknown, fallback = 'Not configured') => {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  return String(value);
};

const InfoPage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const processedMessageCountRef = useRef(0);
  const [about, setAbout] = useState<AboutInformation | null>(null);
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for software information',
  });

  const send = useCallback((type: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus({ level: 'error', text: 'Info is not connected.' });
      return false;
    }
    webSocket.send(JSON.stringify({
      type,
      sessionId,
      body: JSON.stringify({}),
    }));
    return true;
  }, [sessionId, webSocket]);

  const refresh = useCallback(() => {
    if (send('about.bootstrap')) {
      setStatus({ level: 'warn', text: 'Refreshing software information...' });
    }
  }, [send]);

  const openLicense = useCallback(() => {
    if (send('about.openLicense')) {
      setStatus({ level: 'warn', text: 'Opening License Manager...' });
    }
  }, [send]);

  useEffect(() => {
    if (connected) refresh();
  }, [connected, refresh]);

  useEffect(() => {
    if (processedMessageCountRef.current > messages.length) {
      processedMessageCountRef.current = 0;
    }
    const pendingMessages = messages.slice(processedMessageCountRef.current);
    processedMessageCountRef.current = messages.length;

    pendingMessages.forEach((raw) => {
      try {
        const { operationId, body } = parseMessage(raw);
        if (operationId === 'about.bootstrapResponse') {
          setAbout(body || null);
          setStatus(body?.ok === false
            ? { level: 'error', text: body?.error || 'Software information is unavailable.' }
            : { level: 'ok', text: 'Software information loaded' });
        } else if (operationId === 'about.openLicenseResponse') {
          setStatus(body?.ok === false
            ? { level: 'error', text: body?.message || body?.error || 'License Manager could not be opened.' }
            : { level: 'ok', text: body?.message || 'License Manager opened' });
        } else if (operationId === 'license.statusChanged') {
          refresh();
        } else if (operationId === 'application.workspaceFocus') {
          try {
            window.focus();
          } catch {
            // Native focus is best-effort and may be refused by the window manager.
          }
        }
      } catch (messageError) {
        console.error('Could not read Info response:', messageError);
        setStatus({ level: 'error', text: 'The Info response could not be read.' });
      }
    });
  }, [messages, refresh]);

  useEffect(() => {
    if (error) setStatus({ level: 'error', text: error });
  }, [error]);

  const license = about?.license;
  const statusClass = status.level === 'error'
    ? styles.statusError
    : status.level === 'warn'
      ? styles.statusWarn
      : styles.statusOk;
  const licenseStateClass = license?.active ? styles.licenseActive : styles.licenseRequired;

  return (
    <DetachedPageShell
      title="Info"
      testId="info-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <main className={styles.shell}>
        <section className={styles.window}>
          <header className={styles.topBar} data-floating-workspace-drag-handle>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>AR Web</h1>
              <p className={styles.subtitle}>Software and license information</p>
            </div>
            <div className={styles.topBarRight} data-floating-drag-ignore="true">
              <div className={`${styles.status} ${statusClass}`} role="status">
                {status.text}
              </div>
              <PagesOpenButton
                webSocket={webSocket}
                connected={connected}
                messages={messages}
                sessionId={sessionId}
              />
              <button
                type="button"
                className={styles.closeButton}
                title="Close only this Info window"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </header>

          <div className={styles.commandBar}>
            <div className={styles.commandContext}>
              <Info size={18} aria-hidden="true" />
              <span>Installed application details</span>
            </div>
            <div className={styles.commandActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={!connected}
                onClick={refresh}
              >
                <RefreshCw size={15} aria-hidden="true" />
                Refresh
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!connected}
                onClick={openLicense}
              >
                <FileKey2 size={15} aria-hidden="true" />
                Open License Manager
              </button>
            </div>
          </div>

          <div className={styles.content}>
            <section className={styles.infoSection} aria-labelledby="software-information-title">
              <div className={styles.sectionHeader}>
                <div>
                  <h2 id="software-information-title">Software Information</h2>
                  <p>Version and build details for this AR Web installation.</p>
                </div>
              </div>
              <dl className={styles.detailGrid}>
                <div>
                  <dt>Product</dt>
                  <dd>{displayValue(about?.product, 'AR Web')}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{displayValue(about?.version)}</dd>
                </div>
                <div>
                  <dt>Build</dt>
                  <dd>{displayValue(about?.build)}</dd>
                </div>
                <div>
                  <dt>Expiration</dt>
                  <dd>{displayValue(about?.expiration, 'No expiration configured')}</dd>
                </div>
                <div>
                  <dt>Copyright</dt>
                  <dd>{displayValue(about?.copyright, 'Allinweb AG')}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.infoSection} aria-labelledby="license-information-title">
              <div className={styles.sectionHeader}>
                <div>
                  <h2 id="license-information-title">License Information</h2>
                  <p>Current authorization and licensed-user details.</p>
                </div>
                <span className={`${styles.licenseBadge} ${licenseStateClass}`}>
                  {license?.active ? 'Active' : 'Activation required'}
                </span>
              </div>
              <dl className={styles.detailGrid}>
                <div>
                  <dt>Status</dt>
                  <dd>{displayValue(license?.status, 'License status unavailable')}</dd>
                </div>
                <div>
                  <dt>Status code</dt>
                  <dd>{displayValue(license?.statusCode, 'UNKNOWN')}</dd>
                </div>
                <div>
                  <dt>Organization</dt>
                  <dd>{displayValue(license?.organization)}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{displayValue(license?.owner)}</dd>
                </div>
                <div>
                  <dt>Licensed user</dt>
                  <dd>{displayValue(license?.licensedUser)}</dd>
                </div>
                <div className={styles.wideDetail}>
                  <dt>License path</dt>
                  <dd title={license?.path}>{displayValue(license?.path, 'Application directory')}</dd>
                </div>
              </dl>
              {license?.error && <p className={styles.errorMessage}>{license.error}</p>}
              <div className={styles.licenseAction}>
                <span>Request, activate, or select an AR Web license in its own workspace.</span>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={!connected}
                  onClick={openLicense}
                >
                  <FileKey2 size={15} aria-hidden="true" />
                  Manage License
                </button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </DetachedPageShell>
  );
};

export default InfoPage;
