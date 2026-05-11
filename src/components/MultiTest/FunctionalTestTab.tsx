// Functional Test tab — maps API spec fields (left) to bot-job INPUT-text
// instructions (right). Click-to-pair UX:
//   1. Click a left card → it becomes "armed" (highlighted).
//   2. Click a right card → pair is created, shown in the centre column.
//   3. Click ✕ in the centre to remove a pair.
// Mappings persist to localStorage keyed by botJobId so each bot job has its
// own mapping set. Backend persistence lives in the Use Case Orchestrator
// roadmap (ROADMAP_8) — out of scope here.

import React, { useEffect, useMemo, useState } from "react";
import { mtT as t } from "./useMtT";
import type { ApiSpec } from "./utils";
import { useFuncTestSocket, type PersistedFieldMapping } from "./funcTest/useFuncTestSocket";
import type {
  ApiFieldDirection,
  ApiFieldRow,
  BotJobInputField,
  FieldMapping,
  UseCase,
} from "./funcTest/types";
import QuestionsCard, { type QuestionsCardProps } from "../QuestionsCard";

interface FunctionalTestTabProps {
  loadedSpecs: ApiSpec[];
  socketPort: number;
  botJobId: number;
  botJobName: string;
}

// ─────────────────────────────────────────────────────────────
// Field extraction helpers
// ─────────────────────────────────────────────────────────────

function classify(field: ApiSpec["fields"][number]): ApiFieldDirection {
  if (field.isParam || field.writeOnly) return "input";
  if (field.readOnly) return "output";
  return "io";
}

function buildApiFieldRows(specs: ApiSpec[]): ApiFieldRow[] {
  const out: ApiFieldRow[] = [];
  for (const spec of specs) {
    for (const f of spec.fields ?? []) {
      const direction = classify(f);
      out.push({
        key: `${spec.fileName}::${f.name}`,
        specFile: spec.fileName,
        specTitle: spec.title || spec.fileName,
        fieldName: f.name,
        fieldType: f.type ?? "",
        required: !!f.required,
        direction,
        isParam: !!f.isParam,
      });
    }
  }
  return out;
}

function stripActionPrefix(actions: string): string {
  // "I:IBAN" → "IBAN"; "I:" alone → "(unnamed)"
  if (!actions) return "(unnamed)";
  const idx = actions.indexOf(":");
  return idx === -1 ? actions : (actions.slice(idx + 1) || "(unnamed)");
}

// ─────────────────────────────────────────────────────────────
// Draft cache (localStorage) — survives page refresh between user
// edits and the next "💾 Save". The DB is the source of truth; this
// is just a crash-safety net so unsaved work isn't lost on reload.
// ─────────────────────────────────────────────────────────────

function draftKey(botJobId: number, useCaseId: number) {
  return `funcTest.draft.botJob.${botJobId}.uc.${useCaseId}`;
}

function readDraft(botJobId: number, useCaseId: number): FieldMapping[] | null {
  if (!botJobId || !useCaseId) return null;
  try {
    const raw = localStorage.getItem(draftKey(botJobId, useCaseId));
    return raw ? (JSON.parse(raw) as FieldMapping[]) : null;
  } catch {
    return null;
  }
}

function writeDraft(botJobId: number, useCaseId: number, mappings: FieldMapping[]) {
  if (!botJobId || !useCaseId) return;
  try {
    localStorage.setItem(draftKey(botJobId, useCaseId), JSON.stringify(mappings));
  } catch {
    // quota or private mode — silent
  }
}

function clearDraft(botJobId: number, useCaseId: number) {
  if (!botJobId || !useCaseId) return;
  try { localStorage.removeItem(draftKey(botJobId, useCaseId)); } catch {}
}

// ── Remembered active use case per bot job — so reopening the tab returns
//    the user to the same use case they were on. ─────────────────────────
function activeUcKey(botJobId: number) {
  return `funcTest.activeUseCase.botJob.${botJobId}`;
}
function readRememberedUseCaseId(botJobId: number): number | null {
  if (!botJobId) return null;
  const raw = localStorage.getItem(activeUcKey(botJobId));
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
function rememberUseCaseId(botJobId: number, useCaseId: number) {
  if (!botJobId || !useCaseId) return;
  try { localStorage.setItem(activeUcKey(botJobId), String(useCaseId)); } catch {}
}

// ─────────────────────────────────────────────────────────────
// Server ↔ local mapping conversion
// ─────────────────────────────────────────────────────────────

function fromServer(rows: PersistedFieldMapping[]): FieldMapping[] {
  return rows.map(r => ({
    apiKey: r.apiKey,
    botFieldId: r.botInstructionId,
    createdAt: r.createdAt || new Date().toISOString(),
  }));
}

function toServer(
  mappings: FieldMapping[],
  apiByKey: Map<string, ApiFieldRow>,
): PersistedFieldMapping[] {
  return mappings.map(m => {
    const a = apiByKey.get(m.apiKey);
    return {
      apiKey: m.apiKey,
      apiSpecFile: a?.specFile ?? null,
      apiFieldName: a?.fieldName ?? null,
      botInstructionId: m.botFieldId,
      createdAt: m.createdAt,
    };
  });
}

function sameMappings(a: FieldMapping[], b: FieldMapping[]): boolean {
  if (a.length !== b.length) return false;
  // Order-insensitive comparison: a mapping is identified by (apiKey, botFieldId).
  const sigA = a.map(x => `${x.apiKey}::${x.botFieldId}`).sort().join("|");
  const sigB = b.map(x => `${x.apiKey}::${x.botFieldId}`).sort().join("|");
  return sigA === sigB;
}

// ─────────────────────────────────────────────────────────────
// Visual atoms
// ─────────────────────────────────────────────────────────────

const MONO = "'JetBrains Mono','Fira Code',monospace";

function DirectionPill({ direction }: { direction: ApiFieldDirection }) {
  const map: Record<ApiFieldDirection, { bg: string; fg: string; label: string }> = {
    input:  { bg: "#1565C020", fg: "#1565C0", label: "IN" },
    output: { bg: "#2E7D3220", fg: "#2E7D32", label: "OUT" },
    io:     { bg: "#9C27B020", fg: "#9C27B0", label: "IN/OUT" },
  };
  const s = map[direction];
  return (
    <span style={{
      background: s.bg, color: s.fg,
      padding: "2px 6px", borderRadius: 3,
      fontSize: 10, fontWeight: 700, fontFamily: MONO,
    }}>{s.label}</span>
  );
}

interface CardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  selected?: boolean;
  paired?: boolean;
  onClick?: () => void;
}

function Card({ title, subtitle, meta, badge, selected, paired, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", gap: 4,
        textAlign: "left", width: "100%",
        padding: "8px 10px",
        background: paired ? "var(--cs-paired-bg, #2E7D3210)" : "var(--cs-card-bg, #fff)",
        border: `2px solid ${selected ? "#1565C0" : paired ? "#2E7D32" : "var(--cs-border, #ddd)"}`,
        borderRadius: 6,
        cursor: onClick ? "pointer" : "default",
        boxShadow: selected ? "0 0 0 3px #1565C040" : "none",
        transition: "all .12s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge}
        <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: "var(--cs-dim, #666)", fontFamily: MONO }}>
          {subtitle}
        </div>
      )}
      {meta && (
        <div style={{ fontSize: 10, color: "var(--cs-muted, #888)" }}>{meta}</div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Main tab component
// ─────────────────────────────────────────────────────────────

export default function FunctionalTestTab({
  loadedSpecs, socketPort, botJobId, botJobName,
}: FunctionalTestTabProps) {
  // Theme is read implicitly via CSS vars (--cs-*); no useTheme() handle needed here.

  // Per-mount unique session id — keeps the WebSocket distinct from the
  // boot session ("capiApiTestToolAI") and routes the response back to us.
  const sessionId = useMemo(
    () => `funcTest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const {
    connected, loading, saving, error,
    fields: botFields, persistedMappings,
    lastSaveOk, lastSaveAt,
    useCases, lastUseCaseSaveAt, lastUseCaseSaved, lastUseCaseDeletedId,
    loadInputInstructions,
    loadUseCases, saveUseCase, deleteUseCase,
    loadMappings, saveMappings,
  } = useFuncTestSocket({ socketPort, sessionId });

  const apiRows = useMemo(() => buildApiFieldRows(loadedSpecs), [loadedSpecs]);

  // Group bot fields by block for the right column.
  const botByBlock = useMemo(() => {
    const groups = new Map<number, { blockName: string; rows: BotJobInputField[] }>();
    for (const f of botFields) {
      const g = groups.get(f.blockId);
      if (g) g.rows.push(f);
      else groups.set(f.blockId, { blockName: f.blockName ?? `block #${f.blockId}`, rows: [f] });
    }
    return Array.from(groups.values());
  }, [botFields]);

  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [savedBaseline, setSavedBaseline] = useState<FieldMapping[]>([]); // last DB-confirmed state
  const [armedApiKey, setArmedApiKey] = useState<string | null>(null);
  const [currentUseCaseId, setCurrentUseCaseId] = useState<number | null>(null);
  const [modal, setModal] = useState<QuestionsCardProps | null>(null);
  const closeModal = () => setModal(null);

  // Lookup helpers for the centre column display + server conversion.
  const apiByKey = useMemo(() => new Map(apiRows.map(r => [r.key, r])), [apiRows]);
  const botById  = useMemo(() => new Map(botFields.map(f => [f.id, f])), [botFields]);

  // ── Bot-job change: load use cases for the new job + reset armed ────────
  useEffect(() => {
    setArmedApiKey(null);
    setCurrentUseCaseId(null);
    setMappings([]);
    setSavedBaseline([]);
    if (botJobId > 0 && connected) {
      loadUseCases(botJobId);
    }
  }, [botJobId, connected, loadUseCases]);

  // ── Use cases arrived: pick the remembered one (if still present) or
  //    fall back to the first ("Default" by id ordering). ─────────────────
  useEffect(() => {
    if (botJobId <= 0 || useCases.length === 0) return;
    setCurrentUseCaseId(prev => {
      if (prev && useCases.some(u => u.id === prev)) return prev;
      const remembered = readRememberedUseCaseId(botJobId);
      if (remembered && useCases.some(u => u.id === remembered)) return remembered;
      return useCases[0].id;
    });
  }, [useCases, botJobId]);

  // ── Current use case changed: persist choice + load its mappings ────────
  useEffect(() => {
    if (currentUseCaseId && botJobId > 0) {
      rememberUseCaseId(botJobId, currentUseCaseId);
      loadMappings(currentUseCaseId);
    } else {
      setMappings([]);
      setSavedBaseline([]);
    }
    setArmedApiKey(null);
  }, [currentUseCaseId, botJobId, loadMappings]);

  // ── DB mapping load arrived: reconcile with any local draft ─────────────
  // Draft wins if present (user had unsaved work before refresh); otherwise
  // hydrate from DB. savedBaseline is ALWAYS the DB state so dirty detection
  // works correctly either way.
  useEffect(() => {
    if (persistedMappings === null || !currentUseCaseId) return;
    const fromDb = fromServer(persistedMappings);
    setSavedBaseline(fromDb);
    const draft = readDraft(botJobId, currentUseCaseId);
    setMappings(draft ?? fromDb);
  }, [persistedMappings, botJobId, currentUseCaseId]);

  // ── Persist current state to draft on every change ──────────────────────
  useEffect(() => {
    if (botJobId > 0 && currentUseCaseId) writeDraft(botJobId, currentUseCaseId, mappings);
  }, [botJobId, currentUseCaseId, mappings]);

  // ── After a successful save, refresh the baseline and drop the draft ───
  useEffect(() => {
    if (lastSaveOk === true && lastSaveAt && currentUseCaseId) {
      setSavedBaseline(mappings);
      clearDraft(botJobId, currentUseCaseId);
    }
    // intentionally only on lastSaveAt change — mappings is the user's current state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSaveAt]);

  // ── After a successful use-case create/rename: refresh list + select it ─
  useEffect(() => {
    if (!lastUseCaseSaveAt || !lastUseCaseSaved || botJobId <= 0) return;
    loadUseCases(botJobId);
    if (lastUseCaseSaved.id) setCurrentUseCaseId(lastUseCaseSaved.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUseCaseSaveAt]);

  // ── After a successful use-case delete: refresh list + clear drafts ─────
  useEffect(() => {
    if (!lastUseCaseDeletedId || botJobId <= 0) return;
    clearDraft(botJobId, lastUseCaseDeletedId);
    if (currentUseCaseId === lastUseCaseDeletedId) setCurrentUseCaseId(null);
    loadUseCases(botJobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUseCaseDeletedId]);

  const dirty = useMemo(() => !sameMappings(mappings, savedBaseline), [mappings, savedBaseline]);

  const currentUseCase: UseCase | undefined = useMemo(
    () => useCases.find(u => u.id === currentUseCaseId),
    [useCases, currentUseCaseId],
  );
  const isDefaultUseCase = currentUseCase?.name === "Default";

  // ── interaction handlers ────────────────────────────────────
  const onClickApi = (key: string) => {
    setArmedApiKey(prev => (prev === key ? null : key));
  };

  const onClickBot = (botFieldId: number) => {
    if (!armedApiKey) return;
    setMappings(prev => {
      // Replace any existing mapping for the same apiKey OR same botFieldId
      // (1:1 in v1 — a field on either side can only be in one pair).
      const next = prev.filter(m => m.apiKey !== armedApiKey && m.botFieldId !== botFieldId);
      next.push({ apiKey: armedApiKey, botFieldId, createdAt: new Date().toISOString() });
      return next;
    });
    setArmedApiKey(null);
  };

  const removeMapping = (apiKey: string) => {
    setMappings(prev => prev.filter(m => m.apiKey !== apiKey));
  };

  const onSave = () => {
    if (!dirty || saving || !currentUseCaseId) return;
    saveMappings(botJobId, currentUseCaseId, toServer(mappings, apiByKey));
  };

  const onDiscardDraft = () => {
    setMappings(savedBaseline);
    if (currentUseCaseId) clearDraft(botJobId, currentUseCaseId);
  };

  // ── Use case CRUD handlers (use QuestionsCard — JCEF blocks window.*) ──
  const showNameTakenAlert = () => {
    setModal({
      mode: "alert",
      header: t("funcTest.useCaseNameTaken"),
      body: t("funcTest.useCaseNameTakenBody"),
      error: true,
      onSubmit: closeModal,
      onCancel: closeModal,
    });
  };

  const onCreateUseCase = () => {
    if (botJobId <= 0) return;
    setModal({
      mode: "prompt",
      header: t("funcTest.newUseCaseHeader"),
      body: t("funcTest.newUseCasePrompt"),
      placeholder: t("funcTest.newUseCasePlaceholder"),
      okLabel: t("funcTest.create"),
      onSubmit: (raw) => {
        const name = raw.trim();
        if (!name) { closeModal(); return; }
        if (useCases.some(u => u.name.toLowerCase() === name.toLowerCase())) {
          showNameTakenAlert();
          return;
        }
        closeModal();
        saveUseCase({ botJobId, name, description: null });
      },
      onCancel: closeModal,
    });
  };

  const onRenameUseCase = () => {
    if (!currentUseCase || isDefaultUseCase) return;
    setModal({
      mode: "prompt",
      header: t("funcTest.renameUseCaseHeader"),
      body: t("funcTest.renameUseCasePrompt"),
      defaultValue: currentUseCase.name,
      okLabel: t("funcTest.rename"),
      onSubmit: (raw) => {
        const next = raw.trim();
        if (!next || next === currentUseCase.name) { closeModal(); return; }
        if (useCases.some(u => u.id !== currentUseCase.id && u.name.toLowerCase() === next.toLowerCase())) {
          showNameTakenAlert();
          return;
        }
        closeModal();
        saveUseCase({
          id: currentUseCase.id, botJobId, name: next, description: currentUseCase.description,
        });
      },
      onCancel: closeModal,
    });
  };

  const onDeleteUseCase = () => {
    if (!currentUseCase || isDefaultUseCase) return;
    setModal({
      mode: "confirm",
      header: t("funcTest.deleteUseCaseHeader"),
      body: t("funcTest.deleteUseCaseConfirm").replace("{name}", currentUseCase.name),
      okLabel: t("funcTest.delete"),
      destructive: true,
      onSubmit: () => {
        closeModal();
        deleteUseCase(currentUseCase.id);
      },
      onCancel: closeModal,
    });
  };

  // ── derived sets for "is this card paired?" lookups ──────────
  const pairedApiKeys = useMemo(() => new Set(mappings.map(m => m.apiKey)), [mappings]);
  const pairedBotIds = useMemo(() => new Set(mappings.map(m => m.botFieldId)), [mappings]);

  const apiInputs  = apiRows.filter(r => r.direction === "input"  || r.direction === "io");
  const apiOutputs = apiRows.filter(r => r.direction === "output" || r.direction === "io");

  // ── render ──────────────────────────────────────────────────
  return (
    <div className="mt-scroll" style={{ padding: "16px 20px", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {modal && <QuestionsCard {...modal} />}

      {/* Header strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{t("funcTest.title")}</h3>
        <span style={{ fontSize: 12, color: "var(--cs-dim, #666)" }}>
          {t("funcTest.subtitle")}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: connected ? "#2E7D32" : "#C62828",
          }} />
          <span>{connected ? t("funcTest.connected") : t("funcTest.disconnected")}</span>
        </div>
      </div>

      {/* Use case selector */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "8px 10px",
        background: "var(--cs-soft-bg, #f5f5f5)",
        border: "1px solid var(--cs-border, #ddd)",
        borderRadius: 6, fontSize: 12,
      }}>
        <span style={{ fontWeight: 600 }}>{t("funcTest.useCase")}:</span>
        <select
          value={currentUseCaseId ?? ""}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            if (Number.isFinite(v) && v > 0) setCurrentUseCaseId(v);
          }}
          disabled={useCases.length === 0 || botJobId <= 0}
          style={{
            padding: "4px 8px", border: "1px solid var(--cs-border, #ddd)",
            borderRadius: 4, fontSize: 12, minWidth: 180,
          }}
        >
          {useCases.length === 0 && <option value="">{t("funcTest.noUseCases")}</option>}
          {useCases.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <button
          onClick={onCreateUseCase}
          disabled={botJobId <= 0 || !connected}
          title={t("funcTest.newUseCaseTitle")}
          style={btnStyle("#1565C0", botJobId > 0 && connected)}
        >➕ {t("funcTest.newUseCase")}</button>

        <button
          onClick={onRenameUseCase}
          disabled={!currentUseCase || isDefaultUseCase}
          title={isDefaultUseCase ? t("funcTest.cannotRenameDefault") : t("funcTest.renameUseCaseTitle")}
          style={btnStyle("#37474F", !!currentUseCase && !isDefaultUseCase)}
        >✏️ {t("funcTest.renameUseCase")}</button>

        <button
          onClick={onDeleteUseCase}
          disabled={!currentUseCase || isDefaultUseCase}
          title={isDefaultUseCase ? t("funcTest.cannotDeleteDefault") : t("funcTest.deleteUseCaseTitle")}
          style={btnStyle("#C62828", !!currentUseCase && !isDefaultUseCase)}
        >🗑 {t("funcTest.deleteUseCase")}</button>

        {currentUseCase && (
          <span style={{ marginLeft: "auto", color: "var(--cs-dim, #666)", fontStyle: "italic" }}>
            {currentUseCase.description || ""}
          </span>
        )}
      </div>

      {error && (
        <div style={{
          background: "#C6282810", color: "#C62828",
          padding: "8px 10px", borderRadius: 4, fontSize: 12,
        }}>{error}</div>
      )}

      {/* 3-column body */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 280px 1fr",
        gap: 12, flex: 1, minHeight: 0,
      }}>
        {/* ── LEFT: API fields ─────────────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span>{t("funcTest.apiSide")}</span>
            <span style={{ fontSize: 11, color: "var(--cs-dim, #666)" }}>
              {apiRows.length} {t("funcTest.fields")}
            </span>
          </header>

          <div style={{ overflow: "auto", display: "flex", flexDirection: "column", gap: 14, padding: 10 }}>
            <FieldGroup
              title={t("funcTest.inputs")}
              rows={apiInputs}
              armedKey={armedApiKey}
              pairedKeys={pairedApiKeys}
              onClick={onClickApi}
            />
            <FieldGroup
              title={t("funcTest.outputs")}
              rows={apiOutputs}
              armedKey={armedApiKey}
              pairedKeys={pairedApiKeys}
              onClick={onClickApi}
            />
            {apiRows.length === 0 && (
              <EmptyHint text={t("funcTest.noApi")} />
            )}
          </div>
        </section>

        {/* ── CENTER: pair list ────────────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {t("funcTest.mappings")}
              {dirty && (
                <span title={t("funcTest.unsavedHint")} style={{ color: "#E65100", fontSize: 10 }}>●</span>
              )}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--cs-dim, #666)" }}>{mappings.length}</span>
              {dirty && (
                <button
                  onClick={onDiscardDraft}
                  title={t("funcTest.discardDraft")}
                  style={{
                    border: "1px solid var(--cs-border, #ddd)", background: "transparent",
                    padding: "2px 8px", borderRadius: 3, fontSize: 11, cursor: "pointer",
                  }}
                >{t("funcTest.discard")}</button>
              )}
              {(() => {
                const canSave = dirty && !saving && botJobId > 0 && connected && !!currentUseCaseId;
                const reason = !connected
                  ? t("funcTest.saveDisabledNoConn")
                  : botJobId <= 0
                    ? t("funcTest.saveDisabledNoJob")
                    : !currentUseCaseId
                      ? t("funcTest.saveDisabledNoUseCase")
                      : !dirty
                        ? t("funcTest.saveDisabledNoChanges")
                        : t("funcTest.saveTitle");
                return (
                  <button
                    onClick={onSave}
                    disabled={!canSave}
                    title={reason}
                    style={{
                      border: "none",
                      background: canSave ? "#2E7D32" : "#9e9e9e",
                      color: "#fff", padding: "3px 10px", borderRadius: 3, fontSize: 11,
                      fontWeight: 600,
                      cursor: canSave ? "pointer" : "not-allowed",
                    }}
                  >{saving ? t("funcTest.saving") : t("funcTest.save")}</button>
                );
              })()}
            </span>
          </header>

          <div style={{ overflow: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {mappings.length === 0 && (
              <EmptyHint text={armedApiKey ? t("funcTest.pickRight") : t("funcTest.pickLeft")} />
            )}
            {mappings.map(m => {
              const a = apiByKey.get(m.apiKey);
              const b = botById.get(m.botFieldId);
              return (
                <div key={m.apiKey + ":" + m.botFieldId} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 8px", border: "1px solid var(--cs-border, #ddd)",
                  borderRadius: 4, fontSize: 12, fontFamily: MONO,
                }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a ? a.fieldName : m.apiKey}
                  </span>
                  <span style={{ color: "var(--cs-dim, #666)" }}>→</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b ? stripActionPrefix(b.actions) : `id:${m.botFieldId}`}
                  </span>
                  <button
                    onClick={() => removeMapping(m.apiKey)}
                    title={t("funcTest.remove")}
                    style={{
                      border: "none", background: "transparent",
                      cursor: "pointer", color: "#C62828", fontSize: 14, padding: "0 4px",
                    }}
                  >×</button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── RIGHT: bot job INPUT instructions ────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span>{t("funcTest.botSide")}</span>
            <span style={{ fontSize: 11, color: "var(--cs-dim, #666)" }}>
              {botFields.length} {t("funcTest.inputsLc")}
            </span>
          </header>

          <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "auto" }}>
            <div style={{
              display: "flex", flexDirection: "column", gap: 4,
              padding: 8, background: "var(--cs-soft-bg, #f5f5f5)", borderRadius: 4,
              fontSize: 12,
            }}>
              <span style={{ color: "var(--cs-dim, #666)" }}>{t("funcTest.activeBotJob")}</span>
              <span style={{ fontWeight: 600 }}>
                {botJobId > 0 ? `(${botJobId}) ${botJobName || "—"}` : t("funcTest.noBotJob")}
              </span>
              <button
                onClick={() => loadInputInstructions(botJobId)}
                disabled={!connected || loading || botJobId <= 0}
                style={{
                  marginTop: 4, padding: "6px 10px",
                  background: "#1565C0", color: "#fff",
                  border: "none", borderRadius: 4,
                  cursor: !connected || loading || botJobId <= 0 ? "not-allowed" : "pointer",
                  opacity: !connected || loading || botJobId <= 0 ? 0.55 : 1,
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {loading ? t("funcTest.loading") : t("funcTest.loadBotJob")}
              </button>
            </div>

            {botByBlock.length === 0 && !loading && (
              <EmptyHint text={t("funcTest.noBotFields")} />
            )}

            {botByBlock.map(group => (
              <div key={group.blockName} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  color: "var(--cs-dim, #666)", padding: "4px 2px",
                  borderBottom: "1px solid var(--cs-border, #ddd)",
                }}>{group.blockName}</div>
                {group.rows.map(b => (
                  <Card
                    key={b.id}
                    title={stripActionPrefix(b.actions)}
                    subtitle={b.clientNamed || b.name || undefined}
                    meta={b.xpath ? `xpath: ${truncate(b.xpath, 60)}` : undefined}
                    badge={<span style={{
                      background: "#1565C020", color: "#1565C0",
                      padding: "2px 6px", borderRadius: 3,
                      fontSize: 10, fontWeight: 700, fontFamily: MONO,
                    }}>I</span>}
                    paired={pairedBotIds.has(b.id)}
                    onClick={armedApiKey ? () => onClickBot(b.id) : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper components / styles
// ─────────────────────────────────────────────────────────────

function FieldGroup({
  title, rows, armedKey, pairedKeys, onClick,
}: {
  title: string;
  rows: ApiFieldRow[];
  armedKey: string | null;
  pairedKeys: Set<string>;
  onClick: (key: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        color: "var(--cs-dim, #666)", padding: "4px 2px",
        borderBottom: "1px solid var(--cs-border, #ddd)",
      }}>{title}</div>
      {rows.map(r => (
        <Card
          key={r.key}
          title={r.fieldName}
          subtitle={`${r.fieldType}${r.required ? " *" : ""}${r.isParam ? " · param" : ""}`}
          meta={r.specTitle}
          badge={<DirectionPill direction={r.direction} />}
          selected={armedKey === r.key}
          paired={pairedKeys.has(r.key)}
          onClick={() => onClick(r.key)}
        />
      ))}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 12, color: "var(--cs-dim, #666)",
      padding: "16px 8px", textAlign: "center",
      fontStyle: "italic",
    }}>{text}</div>
  );
}

function panelStyle(): React.CSSProperties {
  return {
    display: "flex", flexDirection: "column",
    background: "var(--cs-panel-bg, #fafafa)",
    border: "1px solid var(--cs-border, #ddd)",
    borderRadius: 6, minHeight: 0,
  };
}

function panelHeader(): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 12px",
    background: "var(--cs-panel-header-bg, #f0f0f0)",
    borderBottom: "1px solid var(--cs-border, #ddd)",
    fontSize: 13, fontWeight: 600,
    borderTopLeftRadius: 6, borderTopRightRadius: 6,
  };
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function btnStyle(color: string, enabled: boolean): React.CSSProperties {
  return {
    border: "none",
    background: enabled ? color : "#9e9e9e",
    color: "#fff", padding: "4px 10px", borderRadius: 4,
    fontSize: 11, fontWeight: 600,
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.7,
  };
}
