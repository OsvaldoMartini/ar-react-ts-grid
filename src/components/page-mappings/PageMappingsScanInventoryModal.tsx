import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Building2, GitBranch, Search, X } from 'lucide-react';
import styles from './PageMappingsScanInventoryModal.module.scss';

export type PageMappingsScanInventoryPage = {
  pageKey: string;
  pageUrl: string;
  elementCount: number;
  lastScannedAt: string;
};

export type PageMappingsScanInventoryJob = {
  botJobId: number;
  botJobName: string;
  elementCount: number;
  pageCount: number;
  pages: PageMappingsScanInventoryPage[];
};

export type PageMappingsScanInventory = {
  homeBankingId: number;
  organizationName: string;
  totalElements: number;
  totalBotJobs: number;
  totalPages: number;
  jobs: PageMappingsScanInventoryJob[];
};

type Props = {
  inventory: PageMappingsScanInventory;
  onClose: () => void;
};

const searchable = (...values: Array<string | number>): string => (
  values.join(' ').toLocaleLowerCase()
);

const formatLastScanned = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const PageMappingsScanInventoryModal: React.FC<Props> = ({ inventory, onClose }) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const tokens = useMemo(
    () => query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const visibleJobs = useMemo(() => inventory.jobs.flatMap(job => {
    if (tokens.length === 0) return [job];
    const organizationContent = searchable(
      'organization',
      'home banking',
      inventory.homeBankingId,
      inventory.organizationName,
    );
    const organizationMatches = tokens.every(token => organizationContent.includes(token));
    if (organizationMatches) return [job];
    const jobMatches = tokens.every(token => searchable('bot job', job.botJobId, job.botJobName).includes(token));
    const pages = jobMatches ? job.pages : job.pages.filter(page => {
      const content = searchable(
        'page web elements',
        job.botJobId,
        job.botJobName,
        page.pageUrl,
        page.pageKey,
        page.elementCount,
      );
      return tokens.every(token => content.includes(token));
    });
    return pages.length > 0 ? [{ ...job, pages, pageCount: pages.length }] : [];
  }), [inventory.homeBankingId, inventory.jobs, inventory.organizationName, tokens]);

  const visiblePageCount = visibleJobs.reduce((total, job) => total + job.pages.length, 0);
  const visibleElementCount = visibleJobs.reduce(
    (total, job) => total + job.pages.reduce((sum, page) => sum + page.elementCount, 0),
    0,
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ) || []);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div>
            <div className={styles.titleLine}>
              <GitBranch size={21} aria-hidden="true" />
              <h2 id={titleId}>Scanned Pages Flow</h2>
            </div>
            <p id={descriptionId}>Read-only database inventory grouped by organization, Bot Job, and page.</p>
          </div>
          <button type="button" className={styles.close} aria-label="Close scanned pages flow" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.organization} aria-label="Organization scan summary">
            <Building2 size={22} aria-hidden="true" />
            <div>
              <span>Organization</span>
              <strong>{inventory.organizationName}</strong>
              <small>Home Banking #{inventory.homeBankingId}</small>
            </div>
            <b>READ ONLY</b>
          </section>

          <section className={styles.summary} aria-label="Visible scanned page totals">
            <div><span>Web Elements</span><strong>{visibleElementCount}</strong></div>
            <div><span>Bot Jobs</span><strong>{visibleJobs.length}</strong></div>
            <div><span>Pages</span><strong>{visiblePageCount}</strong></div>
          </section>

          <div className={styles.searchField}>
            <label htmlFor="page-mappings-scan-flow-search">Filter the page tree</label>
            <div className={styles.searchControl}>
              <Search size={16} aria-hidden="true" />
              <input
                ref={searchRef}
                id="page-mappings-scan-flow-search"
                type="search"
                value={query}
                placeholder="Organization, Bot Job, URL, page key, or count..."
                onChange={event => setQuery(event.target.value)}
              />
              {query && (
                <button type="button" aria-label="Clear scanned page filter" title="Clear filter" onClick={() => setQuery('')}>
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <section className={styles.tree} aria-label="Scanned page tree">
            {visibleJobs.length === 0 ? (
              <p className={styles.empty}>No scanned pages match this filter.</p>
            ) : visibleJobs.map(job => (
              <article className={styles.job} key={job.botJobId}>
                <header className={styles.jobHeader}>
                  <strong>Bot Job #{job.botJobId} - {job.botJobName}</strong>
                  <span>{job.pages.reduce((sum, page) => sum + page.elementCount, 0)} elements - {job.pages.length} page{job.pages.length === 1 ? '' : 's'}</span>
                </header>
                <div className={styles.pages}>
                  {job.pages.map(page => (
                    <div className={styles.page} key={`${job.botJobId}:${page.pageKey}`}>
                      <span className={styles.connector} aria-hidden="true" />
                      <div className={styles.pageIdentity}>
                        <strong>{page.pageUrl || page.pageKey}</strong>
                        <code title={page.pageKey}>{page.pageKey}</code>
                        {page.lastScannedAt && <small>Last registry update: {formatLastScanned(page.lastScannedAt)}</small>}
                      </div>
                      <b>{page.elementCount}<small>web elements</small></b>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </div>
  );
};

export default PageMappingsScanInventoryModal;
