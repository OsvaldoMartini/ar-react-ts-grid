import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './OrganizationManager.module.scss';
import { useWebSocket } from './useWebSocket';

type StatusLevel = 'ok' | 'warn' | 'error';

interface OrganizationRow {
  id: number;
  name: string;
  url: string;
  jobs?: number;
  priority?: string;
  searchConfig?: string;
  optionsConfig?: string;
}

interface HomeUrlRow {
  id: number;
  homeBankingId: number;
  orgName?: string;
  url: string;
}

interface OrganizationManagerProps {
  socketPort: number;
  sessionId: string;
}

const emptyOrg: OrganizationRow = {
  id: 0,
  name: '',
  url: '',
  jobs: 0,
  priority: '',
  searchConfig: '',
  optionsConfig: '',
};

const emptyUrl: HomeUrlRow = {
  id: 0,
  homeBankingId: 0,
  url: '',
};

function parseMessage(raw: string): { operationId?: string; body: any } {
  const outer = JSON.parse(raw);
  const operationId = outer.operationId || outer.type;
  const body = typeof outer.body === 'string' ? JSON.parse(outer.body) : outer.body ?? outer;
  return { operationId, body };
}

const OrganizationManager: React.FC<OrganizationManagerProps> = ({ socketPort, sessionId }) => {
  const { webSocket, connected, messages, error } = useWebSocket(socketPort, sessionId);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [homeUrls, setHomeUrls] = useState<HomeUrlRow[]>([]);
  const [orgDraft, setOrgDraft] = useState<OrganizationRow>(emptyOrg);
  const [urlDraft, setUrlDraft] = useState<HomeUrlRow>(emptyUrl);
  const [status, setStatus] = useState<{ level: StatusLevel; text: string }>({
    level: 'warn',
    text: 'Waiting for backend data',
  });

  const selectedOrgUrls = useMemo(
    () => homeUrls.filter(row => Number(row.homeBankingId) === Number(orgDraft.id)),
    [homeUrls, orgDraft.id],
  );

  const send = useCallback(
    (type: string, body: unknown = {}) => {
      if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        setStatus({ level: 'warn', text: 'Socket is not connected yet' });
        return;
      }
      webSocket.send(JSON.stringify({ type, sessionId, body: JSON.stringify(body) }));
    },
    [sessionId, webSocket],
  );

  useEffect(() => {
    if (connected) {
      send('organization.list');
    }
  }, [connected, send]);

  useEffect(() => {
    for (const raw of messages) {
      try {
        const { operationId, body } = parseMessage(raw);
        if (operationId === 'organization.listResponse') {
          setOrganizations(body.organizations || []);
          setHomeUrls(body.homeUrls || []);
          setStatus({ level: 'ok', text: 'Organizations loaded' });
        } else if (operationId === 'organization.templateResponse') {
          setOrgDraft(prev => ({
            ...prev,
            priority: body.priority || '',
            searchConfig: body.searchConfig || '',
            optionsConfig: body.optionsConfig || '',
          }));
          setStatus({ level: 'ok', text: 'Template loaded' });
        } else if (
          operationId === 'organization.saveResponse' ||
          operationId === 'organization.deleteResponse' ||
          operationId === 'homeUrl.saveResponse' ||
          operationId === 'homeUrl.deleteResponse'
        ) {
          if (body.organizations) setOrganizations(body.organizations);
          if (body.homeUrls) setHomeUrls(body.homeUrls);
          setStatus({ level: body.ok === false ? 'error' : 'ok', text: body.message || operationId });
        } else if (operationId === 'organization.status') {
          setStatus({
            level: body.level === 'error' ? 'error' : body.level === 'warning' ? 'warn' : 'ok',
            text: body.message || 'Status update',
          });
        }
      } catch (err) {
        console.warn('OrganizationManager ignored socket message', err, raw);
      }
    }
  }, [messages]);

  const selectOrg = (org: OrganizationRow) => {
    setOrgDraft({ ...emptyOrg, ...org });
    setUrlDraft({ ...emptyUrl, homeBankingId: org.id });
  };

  const selectUrl = (row: HomeUrlRow) => {
    setUrlDraft({ ...row });
  };

  const saveOrg = (mode: 'create' | 'update') => {
    send(mode === 'create' ? 'organization.create' : 'organization.update', orgDraft);
  };

  const saveUrl = (mode: 'create' | 'update') => {
    send(mode === 'create' ? 'homeUrl.create' : 'homeUrl.update', {
      homeBankingId: orgDraft.id,
      homeUrlId: urlDraft.id,
      url: urlDraft.url,
    });
  };

  const statusClass =
    status.level === 'error' ? styles.statusError : status.level === 'ok' ? styles.statusOk : styles.statusWarn;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Organizations</h1>
          <p className={styles.subtitle}>Manage organization records and their environment URLs.</p>
        </div>
        <div className={`${styles.status} ${statusClass}`}>
          {error ? error : status.text}
        </div>
      </header>

      <section className={styles.layout}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Organization Details</h2>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              ID
              <input className={styles.input} value={orgDraft.id || ''} readOnly />
            </label>
            <label className={styles.label}>
              Organization
              <input
                className={styles.input}
                value={orgDraft.name}
                onChange={e => setOrgDraft(prev => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label className={styles.label}>
              Jobs
              <input className={styles.input} value={orgDraft.jobs || 0} readOnly />
            </label>
            <label className={styles.label}>
              URL Baseline
              <input
                className={styles.input}
                value={orgDraft.url}
                onChange={e => setOrgDraft(prev => ({ ...prev, url: e.target.value }))}
              />
            </label>
            <label className={`${styles.label} ${styles.wide}`}>
              Priority
              <textarea
                className={styles.textarea}
                value={orgDraft.priority || ''}
                onChange={e => setOrgDraft(prev => ({ ...prev, priority: e.target.value }))}
              />
            </label>
            <label className={`${styles.label} ${styles.wide}`}>
              Scan Config
              <textarea
                className={styles.textarea}
                value={orgDraft.searchConfig || ''}
                onChange={e => setOrgDraft(prev => ({ ...prev, searchConfig: e.target.value }))}
              />
            </label>
            <label className={`${styles.label} ${styles.wide}`}>
              WebDriver Options
              <textarea
                className={styles.textarea}
                value={orgDraft.optionsConfig || ''}
                onChange={e => setOrgDraft(prev => ({ ...prev, optionsConfig: e.target.value }))}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.primary}`} onClick={() => saveOrg('create')}>Insert</button>
            <button className={styles.button} disabled={!orgDraft.id} onClick={() => saveOrg('update')}>Update</button>
            <button className={`${styles.button} ${styles.danger}`} disabled={!orgDraft.id || Number(orgDraft.jobs || 0) > 0} onClick={() => send('organization.delete', { id: orgDraft.id })}>Delete</button>
            <button className={styles.button} onClick={() => send('organization.template')}>Template</button>
            <button className={styles.button} onClick={() => setOrgDraft(emptyOrg)}>Clear</button>
          </div>

          <h2 className={styles.panelTitle}>Environment Details</h2>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              ID
              <input className={styles.input} value={urlDraft.id || ''} readOnly />
            </label>
            <label className={`${styles.label} ${styles.wide}`}>
              Environment URL
              <input
                className={styles.input}
                value={urlDraft.url}
                onChange={e => setUrlDraft(prev => ({ ...prev, url: e.target.value, homeBankingId: orgDraft.id }))}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.primary}`} disabled={!orgDraft.id} onClick={() => saveUrl('create')}>Insert URL</button>
            <button className={styles.button} disabled={!orgDraft.id || !urlDraft.id} onClick={() => saveUrl('update')}>Update URL</button>
            <button className={`${styles.button} ${styles.danger}`} disabled={!orgDraft.id || !urlDraft.id || selectedOrgUrls.length <= 1} onClick={() => send('homeUrl.delete', { homeBankingId: orgDraft.id, homeUrlId: urlDraft.id })}>Delete URL</button>
            <button className={styles.button} onClick={() => setUrlDraft({ ...emptyUrl, homeBankingId: orgDraft.id })}>Clear URL</button>
          </div>
        </div>

        <div className={styles.tables}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Organizations</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>ID</th><th>Jobs</th><th>Organization</th><th>URL Baseline</th></tr>
                </thead>
                <tbody>
                  {organizations.map(org => (
                    <tr key={org.id} className={`${styles.row} ${orgDraft.id === org.id ? styles.selected : ''}`} onClick={() => selectOrg(org)}>
                      <td>{org.id}</td>
                      <td>{org.jobs || 0}</td>
                      <td>{org.name}</td>
                      <td>{org.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {organizations.length === 0 && <div className={styles.empty}>No organizations loaded.</div>}
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Environments</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>ID</th><th>Organization</th><th>URL Environment</th></tr>
                </thead>
                <tbody>
                  {selectedOrgUrls.map(row => (
                    <tr key={row.id} className={`${styles.row} ${urlDraft.id === row.id ? styles.selected : ''}`} onClick={() => selectUrl(row)}>
                      <td>{row.id}</td>
                      <td>{row.orgName || orgDraft.name}</td>
                      <td>{row.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedOrgUrls.length === 0 && <div className={styles.empty}>Select an organization to see environments.</div>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default OrganizationManager;
