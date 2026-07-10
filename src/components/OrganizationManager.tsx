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
  name?: string;
  homeBankingId: number;
  orgName?: string;
  url: string;
}

interface OrganizationManagerProps {
  socketPort: number;
  sessionId: string;
}

const NEW_ORG = 'new';
const NEW_ENV = 'new';

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
  name: 'TEST',
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
  const [orgSelect, setOrgSelect] = useState<string>(NEW_ORG);
  const [envSelect, setEnvSelect] = useState<string>(NEW_ENV);
  const [status, setStatus] = useState<{ level: StatusLevel; text: string }>({
    level: 'warn',
    text: 'Waiting for backend data',
  });

  const selectedOrgUrls = useMemo(
    () => homeUrls.filter(row => Number(row.homeBankingId) === Number(orgDraft.id)),
    [homeUrls, orgDraft.id],
  );

  const selectedOrgLabel = orgDraft.id ? `${orgDraft.id} - ${orgDraft.name}` : 'New Organization';
  const selectedEnvLabel = urlDraft.id ? `${urlDraft.id} - ${urlDraft.name || 'TEST'}` : 'New Environment';

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
          if (body.ok !== false && operationId === 'organization.deleteResponse') {
            selectNewOrganization();
          }
          if (body.ok !== false && operationId === 'homeUrl.deleteResponse') {
            selectNewEnvironment(orgDraft.id);
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const selectNewOrganization = () => {
    setOrgSelect(NEW_ORG);
    setEnvSelect(NEW_ENV);
    setOrgDraft(emptyOrg);
    setUrlDraft(emptyUrl);
  };

  const selectNewEnvironment = (homeBankingId: number) => {
    setEnvSelect(NEW_ENV);
    setUrlDraft({ ...emptyUrl, homeBankingId });
  };

  const selectOrg = (org: OrganizationRow) => {
    setOrgSelect(String(org.id));
    setOrgDraft({ ...emptyOrg, ...org });
    selectNewEnvironment(org.id);
  };

  const selectUrl = (row: HomeUrlRow) => {
    setEnvSelect(String(row.id));
    setUrlDraft({ ...row });
  };

  const onOrganizationSelect = (value: string) => {
    if (value === NEW_ORG) {
      selectNewOrganization();
      return;
    }
    const org = organizations.find(row => String(row.id) === value);
    if (org) selectOrg(org);
  };

  const onEnvironmentSelect = (value: string) => {
    if (value === NEW_ENV) {
      selectNewEnvironment(orgDraft.id);
      return;
    }
    const env = selectedOrgUrls.find(row => String(row.id) === value);
    if (env) selectUrl(env);
  };

  const saveOrg = (mode: 'create' | 'update') => {
    send(mode === 'create' ? 'organization.create' : 'organization.update', orgDraft);
  };

  const saveUrl = (mode: 'create' | 'update') => {
    send(mode === 'create' ? 'homeUrl.create' : 'homeUrl.update', {
      homeBankingId: orgDraft.id,
      homeUrlId: urlDraft.id,
      name: urlDraft.name || 'TEST',
      url: urlDraft.url,
    });
  };

  const statusClass =
    status.level === 'error' ? styles.statusError : status.level === 'ok' ? styles.statusOk : styles.statusWarn;

  return (
    <main className={styles.shell}>
      <section className={styles.window}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.title}>New Organization</h1>
            <p className={styles.subtitle}>Organizations and child environments</p>
          </div>
          <div className={`${styles.status} ${statusClass}`}>{error ? error : status.text}</div>
        </header>

        <div className={styles.selectorBand}>
          <label className={styles.selectorLabel}>
            Organization
            <select className={styles.select} value={orgSelect} onChange={e => onOrganizationSelect(e.target.value)}>
              <option value={NEW_ORG}>+ New Organization</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.id} - {org.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.selectorLabel}>
            Environment
            <select
              className={styles.select}
              value={envSelect}
              disabled={!orgDraft.id}
              onChange={e => onEnvironmentSelect(e.target.value)}
            >
              <option value={NEW_ENV}>+ New Environment</option>
              {selectedOrgUrls.map(row => (
                <option key={row.id} value={row.id}>
                  {row.id} - {row.name || 'TEST'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className={styles.content}>
          <div className={styles.editorPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>{selectedOrgLabel}</span>
              <span className={styles.badge}>{orgDraft.jobs || 0} active jobs</span>
            </div>

            <div className={styles.body}>
              <div className={styles.formGrid}>
                <label className={styles.fieldLabel}>
                  ID
                  <input className={styles.input} value={orgDraft.id || ''} readOnly />
                </label>
                <label className={styles.fieldLabel}>
                  Organization Name
                  <input
                    className={styles.input}
                    value={orgDraft.name}
                    placeholder="Avaloq, BancaStato, Temenos..."
                    onChange={e => setOrgDraft(prev => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label className={`${styles.fieldLabel} ${styles.full}`}>
                  URL Baseline
                  <input
                    className={styles.input}
                    value={orgDraft.url}
                    placeholder="https://..."
                    onChange={e => setOrgDraft(prev => ({ ...prev, url: e.target.value }))}
                  />
                </label>
              </div>
            </div>

            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={selectNewOrganization}>New</button>
              <button className={styles.createBtn} onClick={() => saveOrg(orgDraft.id ? 'update' : 'create')}>
                {orgDraft.id ? 'Update Organization' : 'Create Organization'}
              </button>
              <button
                className={styles.dangerBtn}
                disabled={!orgDraft.id || Number(orgDraft.jobs || 0) > 0}
                onClick={() => send('organization.delete', { id: orgDraft.id })}
              >
                Delete
              </button>
            </div>
          </div>

          <aside className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>{selectedEnvLabel}</span>
            </div>
            <div className={styles.body}>
              <label className={styles.fieldLabel}>
                Environment ID
                <input className={styles.input} value={urlDraft.id || ''} readOnly />
              </label>
              <label className={styles.fieldLabel}>
                Environment Name
                <input
                  className={styles.input}
                  value={urlDraft.name ?? 'TEST'}
                  placeholder="TEST, UAT, DEV, prod..."
                  disabled={!orgDraft.id}
                  onChange={e => setUrlDraft(prev => ({ ...prev, name: e.target.value, homeBankingId: orgDraft.id }))}
                />
              </label>
              <label className={styles.fieldLabel}>
                Environment URL
                <input
                  className={styles.input}
                  value={urlDraft.url}
                  placeholder="https://uat.example.com"
                  disabled={!orgDraft.id}
                  onChange={e => setUrlDraft(prev => ({ ...prev, url: e.target.value, homeBankingId: orgDraft.id }))}
                />
              </label>
            </div>
            <div className={styles.footer}>
              <button className={styles.cancelBtn} disabled={!orgDraft.id} onClick={() => selectNewEnvironment(orgDraft.id)}>
                New Environment
              </button>
              <button
                className={styles.createBtn}
                disabled={!orgDraft.id}
                onClick={() => saveUrl(urlDraft.id ? 'update' : 'create')}
              >
                {urlDraft.id ? 'Update URL' : 'Create URL'}
              </button>
              <button
                className={styles.dangerBtn}
                disabled={!orgDraft.id || !urlDraft.id || selectedOrgUrls.length <= 1}
                onClick={() => send('homeUrl.delete', { homeBankingId: orgDraft.id, homeUrlId: urlDraft.id })}
              >
                Delete URL
              </button>
            </div>

            <div className={styles.listPanel}>
              <div className={styles.listHeader}>Organization List</div>
              <div className={styles.compactList}>
                {organizations.map(org => (
                  <button
                    key={org.id}
                    type="button"
                    className={`${styles.listRow} ${orgDraft.id === org.id ? styles.activeRow : ''}`}
                    onClick={() => selectOrg(org)}
                  >
                    <span>{org.name}</span>
                    <small>{org.jobs || 0} jobs</small>
                  </button>
                ))}
                {organizations.length === 0 && <div className={styles.empty}>No organizations loaded.</div>}
              </div>
            </div>

            <div className={styles.listPanel}>
              <div className={styles.listHeader}>Environment List</div>
              <div className={styles.compactList}>
                {selectedOrgUrls.map(row => (
                  <button
                    key={row.id}
                    type="button"
                    className={`${styles.listRow} ${urlDraft.id === row.id ? styles.activeRow : ''}`}
                    onClick={() => selectUrl(row)}
                  >
                    <span>{row.name || 'TEST'}</span>
                    <small>#{row.id}</small>
                    <em>{row.url}</em>
                  </button>
                ))}
                {selectedOrgUrls.length === 0 && <div className={styles.empty}>No environments for this organization.</div>}
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
};

export default OrganizationManager;
