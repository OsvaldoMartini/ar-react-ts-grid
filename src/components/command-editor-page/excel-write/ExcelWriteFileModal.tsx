import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, FileSpreadsheet, FolderOpen, Search, Trash2, X } from 'lucide-react';
import type { ExcelWriteCommandEditorDraft } from '../../command-editor/commandEditorDraft';
import {
  parseExcelWriteTarget,
  type ExcelWriteDelimiter,
  type ExcelWriteFileTarget,
  type ExcelWriteFileType,
  type ExcelWriteWorkspaceClient,
} from './ExcelWriteWorkspace.contract';
import styles from './ExcelWriteFileModal.module.scss';

interface Props {
  instructionId: number;
  value: ExcelWriteCommandEditorDraft;
  client: ExcelWriteWorkspaceClient;
  onApply: (value: ExcelWriteCommandEditorDraft) => void;
  onClose: () => void;
}

type Draft = {
  directory: string;
  filename: string;
  fileType: ExcelWriteFileType;
  delimiter: ExcelWriteDelimiter;
  outputKey: string;
  outputColumn: string;
};

const draftFrom = (value: ExcelWriteCommandEditorDraft): Draft => {
  const parsed = parseExcelWriteTarget(value.outputFile);
  return {
    directory: parsed.directory,
    filename: parsed.filename,
    fileType: parsed.fileType,
    delimiter: parsed.delimiter,
    outputKey: value.outputKey,
    outputColumn: value.outputColumn,
  };
};

const ExcelWriteFileModal: React.FC<Props> = ({
  instructionId,
  value,
  client,
  onApply,
  onClose,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(value));
  const [targets, setTargets] = useState<ExcelWriteFileTarget[]>([]);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<'bootstrap' | 'directory' | 'validate' | null>('bootstrap');
  const [status, setStatus] = useState('Loading instruction-owned Excel targets...');
  const [error, setError] = useState('');

  useEffect(() => {
    closeRef.current?.focus();
    let active = true;
    client.request('excelWrite.bootstrap', {
      instructionId,
      outputFile: value.outputFile,
    }).then((response) => {
      if (!active) return;
      if (!response.ok) {
        setError(response.error || response.message || 'ExcelWrite configuration could not load.');
        return;
      }
      setTargets(Array.isArray(response.targets) ? response.targets : []);
      if (response.current?.outputFile && !value.outputFile.trim()) {
        setDraft(current => ({
          ...current,
          directory: response.current?.directory || '',
          filename: response.current?.filename || '',
          fileType: response.current?.fileType || '.xlsx',
          delimiter: response.current?.delimiter || ',',
        }));
      }
      setStatus(response.message || 'ExcelWrite file configuration loaded.');
    }).catch((reason) => {
      if (active) setError(String(reason?.message || reason || 'ExcelWrite configuration could not load.'));
    }).finally(() => {
      if (active) setPending(null);
    });
    return () => { active = false; };
  }, [client, instructionId, value.outputFile]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = closeRef.current?.closest('[role="dialog"]');
      if (!(panel instanceof HTMLElement)) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled])',
      ));
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
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const filteredTargets = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return targets;
    return targets.filter(target => [target.directory, target.filename, target.outputFile, target.fileType]
      .some(candidate => candidate.toLocaleLowerCase().includes(needle)));
  }, [search, targets]);

  const chooseDirectory = async () => {
    if (pending || !client.connected) return;
    setPending('directory');
    setError('');
    try {
      const response = await client.request('excelWrite.chooseDirectory', {
        instructionId,
        directory: draft.directory,
      });
      if (!response.ok) throw new Error(response.error || response.message || 'Directory selection failed.');
      if (!response.cancelled && response.directory) {
        setDraft(current => ({ ...current, directory: response.directory || '' }));
      }
      setStatus(response.message || (response.cancelled
        ? 'Directory selection cancelled.'
        : 'Directory selected.'));
    } catch (reason: any) {
      setError(String(reason?.message || reason || 'Directory selection failed.'));
    } finally {
      setPending(null);
    }
  };

  const apply = async () => {
    if (pending || !client.connected) return;
    if (!draft.outputKey.trim()) return setError('Output key is required.');
    if (!draft.outputColumn.trim()) return setError('Destination column is required.');
    if (!draft.directory.trim() || !draft.filename.trim()) {
      return setError('Directory and filename are required.');
    }
    setPending('validate');
    setError('');
    try {
      const response = await client.request('excelWrite.validateTarget', {
        instructionId,
        directory: draft.directory.trim(),
        filename: draft.filename.trim(),
        fileType: draft.fileType,
        delimiter: draft.delimiter,
      });
      if (!response.ok || !response.outputFile) {
        throw new Error(response.error || response.message || 'ExcelWrite target is invalid.');
      }
      onApply({
        ...value,
        outputKey: draft.outputKey.trim(),
        outputColumn: draft.outputColumn.trim(),
        outputFile: response.outputFile,
      });
      onClose();
    } catch (reason: any) {
      setError(String(reason?.message || reason || 'ExcelWrite target is invalid.'));
    } finally {
      setPending(null);
    }
  };

  const selectTarget = (target: ExcelWriteFileTarget) => {
    setDraft(current => ({
      ...current,
      directory: target.directory,
      filename: target.filename,
      fileType: target.fileType,
      delimiter: target.delimiter,
    }));
    setStatus(`Selected ${target.filename}. Apply it to this command, then UPDATE.`);
    setError('');
  };

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="excel-write-file-title">
        <header className={styles.header}>
          <FileSpreadsheet size={21} aria-hidden="true" />
          <span>
            <strong id="excel-write-file-title">ExcelWrite file configuration</strong>
            <small>Instruction #{instructionId > 0 ? instructionId : 'NEW'} · variable → file column</small>
          </span>
          <button ref={closeRef} type="button" title="Close" aria-label="Close ExcelWrite file configuration" onClick={onClose}>
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.form} aria-label="ExcelWrite destination">
            <label className={styles.wide}>
              <span>Excel directory</span>
              <div className={styles.directoryControl}>
                <input value={draft.directory} disabled={Boolean(pending)} onChange={event => setDraft(current => ({ ...current, directory: event.target.value }))} />
                <button type="button" disabled={Boolean(pending) || !client.connected} onClick={chooseDirectory}>
                  <FolderOpen size={16} aria-hidden="true" />
                  {pending === 'directory' ? 'Choosing...' : 'Browse'}
                </button>
              </div>
            </label>
            <label><span>File name</span><input value={draft.filename} disabled={Boolean(pending)} onChange={event => setDraft(current => ({ ...current, filename: event.target.value }))} /></label>
            <label><span>File type</span><select value={draft.fileType} disabled={Boolean(pending)} onChange={event => setDraft(current => ({ ...current, fileType: event.target.value as ExcelWriteFileType }))}><option value=".xlsx">Excel (.xlsx)</option><option value=".csv">CSV (.csv)</option></select></label>
            <label><span>Output key</span><input value={draft.outputKey} disabled={Boolean(pending)} onChange={event => setDraft(current => ({ ...current, outputKey: event.target.value }))} /></label>
            <label><span>Destination column</span><input value={draft.outputColumn} disabled={Boolean(pending)} onChange={event => setDraft(current => ({ ...current, outputColumn: event.target.value }))} /></label>
            <label><span>CSV delimiter</span><select value={draft.delimiter} disabled={Boolean(pending) || draft.fileType !== '.csv'} onChange={event => setDraft(current => ({ ...current, delimiter: event.target.value as ExcelWriteDelimiter }))}><option value=",">Comma</option><option value="|">Pipe</option></select></label>
          </section>

          <section className={styles.library} aria-label="Existing ExcelWrite files">
            <div className={styles.libraryTitle}>
              <span><strong>Existing Bot Job files</strong><small>Reuse one destination across different Blocks.</small></span>
              <label className={styles.search}>
                <Search size={15} aria-hidden="true" />
                <input aria-label="Search existing ExcelWrite files" placeholder="Search files..." value={search} onChange={event => setSearch(event.target.value)} />
                {search && <button type="button" title="Clear search" aria-label="Clear file search" onClick={() => setSearch('')}><X size={14} /></button>}
              </label>
            </div>
            <div className={styles.targets}>
              {filteredTargets.length === 0 ? (
                <p>{pending === 'bootstrap' ? 'Loading files...' : 'No matching configured files.'}</p>
              ) : filteredTargets.map(target => (
                <button key={`${target.outputFile}:${target.legacy ? 'legacy' : 'typed'}`} type="button" onClick={() => selectTarget(target)}>
                  <FileSpreadsheet size={17} aria-hidden="true" />
                  <span><strong>{target.filename}</strong><small>{target.directory}</small></span>
                  <b>{target.legacy ? 'LEGACY' : `${target.usageCount} USE${target.usageCount === 1 ? '' : 'S'}`}</b>
                </button>
              ))}
            </div>
          </section>

          {error ? <p className={styles.error} role="alert">{error}</p> : <p className={styles.status} role="status">{status}</p>}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.clear} disabled={Boolean(pending)} onClick={() => { onApply({ ...value, outputFile: '' }); onClose(); }}><Trash2 size={15} aria-hidden="true" /> Clear file</button>
          <button type="button" className={styles.cancel} disabled={Boolean(pending)} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.apply} disabled={Boolean(pending) || !client.connected} onClick={apply}><Check size={15} aria-hidden="true" /> Apply to command</button>
        </footer>
      </section>
    </div>
  );
};

export default ExcelWriteFileModal;
