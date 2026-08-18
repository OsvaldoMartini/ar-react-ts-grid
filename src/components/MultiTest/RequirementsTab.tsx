// Requirements tab — high-context descriptions of functional cases that
// must be executed, with many-to-many traceability links to Functional
// Cases (use_case) and Flow Tests (flow).
//
// Three-column layout:
//   Left:   list of requirements with priority chip + coverage badges
//           (📁N · 🔀M). ➕ New / ✏️ Rename / 🗑 Delete (uses QuestionsCard).
//   Center: detail editor — external_ref, priority, status, big description.
//   Right:  two checkbox lists side-by-side — Functional Cases / Flow Tests.
//           Toggling a checkbox marks the panel dirty; Save persists both
//           link sets in one DB transaction.

import React, { useEffect, useMemo, useState } from "react";
import { mtT as t } from "./useMtT";
import { useRequirementsSocket, type NamedRow } from "./requirements/useRequirementsSocket";
import type { Requirement, RequirementPriority, RequirementStatus } from "./requirements/types";
import QuestionsCard, { type QuestionsCardProps } from "../QuestionsCard";

interface RequirementsTabProps {
  socketPort: number;
  botJobId: number;
  botJobName: string;
}

const MONO = "'JetBrains Mono','Fira Code',monospace";

const PRIORITY_STYLE: Record<RequirementPriority, { bg: string; fg: string }> = {
  LOW:      { bg: "#9E9E9E20", fg: "#616161" },
  MEDIUM:   { bg: "#1565C020", fg: "#1565C0" },
  HIGH:     { bg: "#E6510020", fg: "#E65100" },
  CRITICAL: { bg: "#C6282820", fg: "#C62828" },
};

// ── Remembered active requirement per bot job ──
function activeReqKey(botJobId: number) { return `requirements.active.botJob.${botJobId}`; }
function readActiveReqId(botJobId: number): number | null {
  if (!botJobId) return null;
  const raw = localStorage.getItem(activeReqKey(botJobId));
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
function rememberActiveReqId(botJobId: number, requirementId: number) {
  if (!botJobId || !requirementId) return;
  try { localStorage.setItem(activeReqKey(botJobId), String(requirementId)); } catch {}
}

// ── Order-insensitive sets compare for dirty detection ──
function sameIdSets(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a), sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const v of sa) if (!sb.has(v)) return false;
  return true;
}

export default function RequirementsTab({ socketPort, botJobId, botJobName }: RequirementsTabProps) {
  const sessionId = useMemo(
    () => `requirements-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const {
    connected, error,
    requirements, loadingRequirements,
    savingRequirement, lastReqSaveAt, lastReqSaved, lastReqDeletedId,
    links, loadingLinks, savingLinks, lastLinksSaveAt, lastLinksSaveOk,
    useCases, flows,
    loadRequirements, saveRequirement, deleteRequirement,
    loadLinks, saveLinks,
    loadUseCases, loadFlows,
  } = useRequirementsSocket({ socketPort, sessionId });

  const [currentReqId, setCurrentReqId] = useState<number | null>(null);
  const [draftDescription, setDraftDescription] = useState<string>("");
  const [draftExternalRef, setDraftExternalRef] = useState<string>("");
  const [draftPriority, setDraftPriority] = useState<RequirementPriority | "">("");
  const [draftStatus, setDraftStatus] = useState<RequirementStatus>("ACTIVE");
  const [draftUseCaseIds, setDraftUseCaseIds] = useState<number[]>([]);
  const [draftFlowIds, setDraftFlowIds] = useState<number[]>([]);
  const [modal, setModal] = useState<QuestionsCardProps | null>(null);
  const closeModal = () => setModal(null);

  // ── Bot-job change → load all sources ──
  useEffect(() => {
    setCurrentReqId(null);
    if (botJobId > 0 && connected) {
      loadRequirements(botJobId);
      loadUseCases(botJobId);
      loadFlows(botJobId);
    }
  }, [botJobId, connected, loadRequirements, loadUseCases, loadFlows]);

  // ── Requirements arrived → pick remembered or first ──
  useEffect(() => {
    if (botJobId <= 0 || requirements.length === 0) return;
    setCurrentReqId(prev => {
      if (prev && requirements.some(r => r.id === prev)) return prev;
      const remembered = readActiveReqId(botJobId);
      if (remembered && requirements.some(r => r.id === remembered)) return remembered;
      return requirements[0].id;
    });
  }, [requirements, botJobId]);

  const currentReq: Requirement | undefined = useMemo(
    () => requirements.find(r => r.id === currentReqId),
    [requirements, currentReqId],
  );

  // ── Active requirement change → load its links + hydrate detail editor ──
  useEffect(() => {
    if (botJobId > 0 && currentReqId) rememberActiveReqId(botJobId, currentReqId);
    if (currentReqId && connected) loadLinks(currentReqId);
    if (currentReq) {
      setDraftDescription(currentReq.description ?? "");
      setDraftExternalRef(currentReq.externalRef ?? "");
      setDraftPriority(currentReq.priority ?? "");
      setDraftStatus(currentReq.status ?? "ACTIVE");
    } else {
      setDraftDescription(""); setDraftExternalRef(""); setDraftPriority(""); setDraftStatus("ACTIVE");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReqId, connected]);

  // Re-hydrate when the underlying requirement row changes (e.g. after save reload)
  useEffect(() => {
    if (currentReq) {
      setDraftDescription(currentReq.description ?? "");
      setDraftExternalRef(currentReq.externalRef ?? "");
      setDraftPriority(currentReq.priority ?? "");
      setDraftStatus(currentReq.status ?? "ACTIVE");
    }
  }, [currentReq]);

  // ── Links arrived → hydrate the right-column draft sets ──
  useEffect(() => {
    if (links === null) return;
    setDraftUseCaseIds(links.useCaseIds);
    setDraftFlowIds(links.flowIds);
  }, [links]);

  // ── After save events → refresh list / pick new ──
  useEffect(() => {
    if (!lastReqSaveAt || !lastReqSaved || botJobId <= 0) return;
    loadRequirements(botJobId);
    if (lastReqSaved.id) setCurrentReqId(lastReqSaved.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastReqSaveAt]);

  useEffect(() => {
    if (!lastReqDeletedId || botJobId <= 0) return;
    if (currentReqId === lastReqDeletedId) setCurrentReqId(null);
    loadRequirements(botJobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastReqDeletedId]);

  // After links save → reload list (coverage counts changed) + reload links baseline
  useEffect(() => {
    if (lastLinksSaveOk === true && lastLinksSaveAt && currentReqId && botJobId > 0) {
      loadRequirements(botJobId);
      loadLinks(currentReqId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLinksSaveAt]);

  // ── Dirty flags ──
  const detailDirty = useMemo(() => {
    if (!currentReq) return false;
    return (
      (currentReq.description ?? "") !== draftDescription ||
      (currentReq.externalRef ?? "") !== draftExternalRef ||
      (currentReq.priority ?? "") !== draftPriority ||
      (currentReq.status ?? "ACTIVE") !== draftStatus
    );
  }, [currentReq, draftDescription, draftExternalRef, draftPriority, draftStatus]);

  const linksDirty = useMemo(() => {
    if (links === null) return false;
    return !sameIdSets(links.useCaseIds, draftUseCaseIds) || !sameIdSets(links.flowIds, draftFlowIds);
  }, [links, draftUseCaseIds, draftFlowIds]);

  // ── Modal helpers ──
  const showNameTakenAlert = () => {
    setModal({
      mode: "alert",
      header: t("requirements.nameTaken"),
      body: t("requirements.nameTakenBody"),
      error: true,
      onSubmit: closeModal, onCancel: closeModal,
    });
  };

  // ── CRUD handlers ──
  const onCreate = () => {
    if (botJobId <= 0) return;
    setModal({
      mode: "prompt",
      header: t("requirements.newHeader"),
      body: t("requirements.newPrompt"),
      placeholder: t("requirements.newPlaceholder"),
      okLabel: t("requirements.create"),
      onSubmit: (raw) => {
        const title = raw.trim();
        if (!title) { closeModal(); return; }
        if (requirements.some(r => r.title.toLowerCase() === title.toLowerCase())) {
          showNameTakenAlert(); return;
        }
        closeModal();
        saveRequirement({ botJobId, title, description: null, priority: "MEDIUM", status: "ACTIVE" });
      },
      onCancel: closeModal,
    });
  };

  const onRename = () => {
    if (!currentReq) return;
    setModal({
      mode: "prompt",
      header: t("requirements.renameHeader"),
      body: t("requirements.renamePrompt"),
      defaultValue: currentReq.title,
      okLabel: t("requirements.rename"),
      onSubmit: (raw) => {
        const next = raw.trim();
        if (!next || next === currentReq.title) { closeModal(); return; }
        if (requirements.some(r => r.id !== currentReq.id && r.title.toLowerCase() === next.toLowerCase())) {
          showNameTakenAlert(); return;
        }
        closeModal();
        saveRequirement({
          id: currentReq.id, botJobId, title: next,
          externalRef: currentReq.externalRef, description: currentReq.description,
          priority: currentReq.priority, status: currentReq.status,
        });
      },
      onCancel: closeModal,
    });
  };

  const onDelete = () => {
    if (!currentReq) return;
    setModal({
      mode: "confirm",
      header: t("requirements.deleteHeader"),
      body: t("requirements.deleteConfirm").replace("{name}", currentReq.title),
      okLabel: t("requirements.delete"),
      destructive: true,
      onSubmit: () => { closeModal(); deleteRequirement(currentReq.id); },
      onCancel: closeModal,
    });
  };

  const onSaveDetail = () => {
    if (!currentReq || !detailDirty || savingRequirement) return;
    saveRequirement({
      id: currentReq.id, botJobId, title: currentReq.title,
      externalRef: draftExternalRef || null,
      description: draftDescription || null,
      priority: (draftPriority || null) as RequirementPriority | null,
      status: draftStatus,
    });
  };

  const onDiscardDetail = () => {
    if (!currentReq) return;
    setDraftDescription(currentReq.description ?? "");
    setDraftExternalRef(currentReq.externalRef ?? "");
    setDraftPriority(currentReq.priority ?? "");
    setDraftStatus(currentReq.status ?? "ACTIVE");
  };

  const onSaveLinks = () => {
    if (!currentReqId || !linksDirty || savingLinks) return;
    saveLinks(currentReqId, draftUseCaseIds, draftFlowIds);
  };

  const onDiscardLinks = () => {
    if (!links) return;
    setDraftUseCaseIds(links.useCaseIds);
    setDraftFlowIds(links.flowIds);
  };

  const toggleUseCase = (id: number) => {
    setDraftUseCaseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleFlow = (id: number) => {
    setDraftFlowIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── Coverage rollup for the header ──
  const totalReqs = requirements.length;
  const coveredReqs = requirements.filter(r => (r.linkedUseCaseCount + r.linkedFlowCount) > 0).length;

  return (
    <div className="mt-scroll" style={{ padding: "16px 20px", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {modal && <QuestionsCard {...modal} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{t("requirements.title")}</h3>
        <span style={{ fontSize: 12, color: "var(--cs-dim, #666)" }}>{t("requirements.subtitle")}</span>
        <span style={{
          marginLeft: 8, padding: "3px 10px",
          background: coveredReqs === totalReqs && totalReqs > 0 ? "#2E7D3215" : "#E6510015",
          color: coveredReqs === totalReqs && totalReqs > 0 ? "#2E7D32" : "#E65100",
          borderRadius: 12, fontSize: 11, fontWeight: 700,
        }}>
          {t("requirements.coverage").replace("{covered}", String(coveredReqs)).replace("{total}", String(totalReqs))}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: connected ? "#2E7D32" : "#C62828",
          }} />
          <span>{connected ? t("requirements.connected") : t("requirements.disconnected")}</span>
        </div>
      </div>

      {error && (
        <div style={{ background: "#C6282810", color: "#C62828", padding: "8px 10px", borderRadius: 4, fontSize: 12 }}>{error}</div>
      )}

      {/* 3-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", gap: 12, flex: 1, minHeight: 0 }}>
        {/* ── LEFT RAIL ───────────────────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span>{t("requirements.list")}</span>
            <span style={{ fontSize: 11, color: "var(--cs-dim, #666)" }}>{requirements.length}</span>
          </header>

          <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "auto" }}>
            <div style={{
              display: "flex", flexDirection: "column", gap: 4,
              padding: 8, background: "var(--cs-soft-bg, #f5f5f5)", borderRadius: 4, fontSize: 11,
            }}>
              <span style={{ color: "var(--cs-dim, #666)" }}>{t("requirements.activeBotJob")}</span>
              <span style={{ fontWeight: 600 }}>
                {botJobId > 0 ? `(${botJobId}) ${botJobName || "—"}` : t("requirements.noBotJob")}
              </span>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={onCreate} disabled={botJobId <= 0 || !connected || savingRequirement}
                style={btn("#1565C0", botJobId > 0 && connected && !savingRequirement, { flex: 1 })}>
                ➕ {t("requirements.new")}
              </button>
              <button onClick={onRename} disabled={!currentReq || savingRequirement}
                style={btn("#37474F", !!currentReq && !savingRequirement, {})}>✏️</button>
              <button onClick={onDelete} disabled={!currentReq}
                style={btn("#C62828", !!currentReq, {})}>🗑</button>
            </div>

            {loadingRequirements && (
              <div style={{ fontSize: 11, color: "var(--cs-dim, #666)", padding: 8, textAlign: "center" }}>
                {t("requirements.loading")}
              </div>
            )}
            {!loadingRequirements && requirements.length === 0 && botJobId > 0 && (
              <EmptyHint text={t("requirements.empty")} />
            )}

            {requirements.map(r => {
              const active = r.id === currentReqId;
              const cover = r.linkedUseCaseCount + r.linkedFlowCount;
              const pStyle = r.priority ? PRIORITY_STYLE[r.priority] : { bg: "#9E9E9E20", fg: "#9E9E9E" };
              return (
                <button key={r.id} onClick={() => setCurrentReqId(r.id)}
                  style={{
                    textAlign: "left", padding: "8px 10px",
                    background: active ? "#1565C015" : "var(--cs-card-bg, #fff)",
                    border: `2px solid ${active ? "#1565C0" : "var(--cs-border, #ddd)"}`,
                    borderRadius: 4, cursor: "pointer",
                    fontSize: 12,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {r.priority && (
                      <span style={{
                        background: pStyle.bg, color: pStyle.fg,
                        padding: "1px 6px", borderRadius: 3,
                        fontSize: 9, fontWeight: 700, fontFamily: MONO,
                      }}>{r.priority}</span>
                    )}
                    <span style={{ flex: 1, fontWeight: active ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
                  </div>
                  <div style={{ marginTop: 3, display: "flex", gap: 8, fontSize: 10, color: "var(--cs-dim, #666)" }}>
                    <span title={t("requirements.linkedUseCases")}>📁 {r.linkedUseCaseCount}</span>
                    <span title={t("requirements.linkedFlows")}>🔀 {r.linkedFlowCount}</span>
                    {cover === 0 && (
                      <span style={{ color: "#E65100", fontWeight: 700 }}>{t("requirements.uncovered")}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── CENTER (detail editor) ────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {t("requirements.detail")}
              {detailDirty && <span title={t("requirements.unsavedDetail")} style={{ color: "#E65100", fontSize: 10 }}>●</span>}
              <span style={{ fontSize: 11, color: "var(--cs-dim, #666)", fontWeight: 400 }}>
                {currentReq ? `(${currentReq.title})` : ""}
              </span>
            </span>
            {currentReq && (
              <span style={{ display: "flex", gap: 6 }}>
                {detailDirty && (
                  <button onClick={onDiscardDetail} style={{
                    border: "1px solid var(--cs-border, #ddd)", background: "transparent",
                    padding: "2px 8px", borderRadius: 3, fontSize: 11, cursor: "pointer",
                  }}>{t("requirements.discard")}</button>
                )}
                <button onClick={onSaveDetail} disabled={!detailDirty || savingRequirement}
                  style={{
                    border: "none",
                    background: detailDirty && !savingRequirement ? "#2E7D32" : "#9e9e9e",
                    color: "#fff", padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 600,
                    cursor: detailDirty && !savingRequirement ? "pointer" : "not-allowed",
                  }}>
                  {savingRequirement ? t("requirements.saving") : t("requirements.save")}
                </button>
              </span>
            )}
          </header>

          {!currentReq ? (
            <div style={{
              padding: 24, flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              color: "var(--cs-dim, #666)", textAlign: "center",
            }}>
              <div style={{ fontSize: 42, opacity: 0.3 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t("requirements.pickToStart")}</div>
              <div style={{ fontSize: 11, maxWidth: 360 }}>{t("requirements.pickHint")}</div>
            </div>
          ) : (
            <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Field label={t("requirements.externalRef")} grow>
                  <input type="text" value={draftExternalRef}
                    onChange={e => setDraftExternalRef(e.target.value)}
                    placeholder="JIRA-123 / ADO-4567"
                    style={inputStyle()} />
                </Field>
                <Field label={t("requirements.priority")}>
                  <select value={draftPriority} onChange={e => setDraftPriority(e.target.value as RequirementPriority | "")}
                    style={{ ...inputStyle(), minWidth: 120 }}>
                    <option value="">—</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </Field>
                <Field label={t("requirements.status")}>
                  <select value={draftStatus} onChange={e => setDraftStatus(e.target.value as RequirementStatus)}
                    style={{ ...inputStyle(), minWidth: 120 }}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </Field>
              </div>
              <Field label={t("requirements.description")}>
                <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)}
                  placeholder={t("requirements.descriptionPlaceholder")}
                  style={{ ...inputStyle(), minHeight: 240, fontFamily: "inherit", resize: "vertical" }}
                  spellCheck />
              </Field>
            </div>
          )}
        </section>

        {/* ── RIGHT (link panels) ─────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {t("requirements.coverageLinks")}
              {linksDirty && <span title={t("requirements.unsavedLinks")} style={{ color: "#E65100", fontSize: 10 }}>●</span>}
            </span>
            {currentReq && (
              <span style={{ display: "flex", gap: 6 }}>
                {linksDirty && (
                  <button onClick={onDiscardLinks} style={{
                    border: "1px solid var(--cs-border, #ddd)", background: "transparent",
                    padding: "2px 8px", borderRadius: 3, fontSize: 11, cursor: "pointer",
                  }}>{t("requirements.discard")}</button>
                )}
                <button onClick={onSaveLinks} disabled={!linksDirty || savingLinks}
                  style={{
                    border: "none",
                    background: linksDirty && !savingLinks ? "#2E7D32" : "#9e9e9e",
                    color: "#fff", padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 600,
                    cursor: linksDirty && !savingLinks ? "pointer" : "not-allowed",
                  }}>
                  {savingLinks ? t("requirements.saving") : t("requirements.save")}
                </button>
              </span>
            )}
          </header>

          {!currentReq ? (
            <EmptyHint text={t("requirements.pickToLink")} />
          ) : loadingLinks ? (
            <div style={{ fontSize: 11, color: "var(--cs-dim, #666)", padding: 12, textAlign: "center" }}>
              {t("requirements.loadingLinks")}
            </div>
          ) : (
            <div style={{ padding: 10, flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <CheckList
                title={t("requirements.functionalCases")}
                rows={useCases}
                checkedIds={draftUseCaseIds}
                onToggle={toggleUseCase}
                emptyText={t("requirements.noUseCases")}
                badgeColor="#1565C0"
              />
              <CheckList
                title={t("requirements.flowTests")}
                rows={flows}
                checkedIds={draftFlowIds}
                onToggle={toggleFlow}
                emptyText={t("requirements.noFlows")}
                badgeColor="#37474F"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────

function CheckList({
  title, rows, checkedIds, onToggle, emptyText, badgeColor,
}: {
  title: string;
  rows: NamedRow[];
  checkedIds: number[];
  onToggle: (id: number) => void;
  emptyText: string;
  badgeColor: string;
}) {
  const set = new Set(checkedIds);
  const linkedCount = rows.filter(r => set.has(r.id)).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 11, fontWeight: 700, color: "var(--cs-dim, #666)",
        textTransform: "uppercase", padding: "2px 4px",
        borderBottom: "1px solid var(--cs-border, #ddd)",
      }}>
        <span>{title}</span>
        <span style={{ color: badgeColor }}>{linkedCount} / {rows.length}</span>
      </div>
      {rows.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--cs-muted, #888)", padding: "6px 4px", fontStyle: "italic" }}>{emptyText}</div>
      )}
      {rows.map(r => {
        const checked = set.has(r.id);
        return (
          <label key={r.id} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 8px", borderRadius: 4, cursor: "pointer",
            background: checked ? "#2E7D3210" : "transparent",
            border: `1px solid ${checked ? "#2E7D3240" : "var(--cs-border, #eee)"}`,
            fontSize: 12,
          }}>
            <input type="checkbox" checked={checked} onChange={() => onToggle(r.id)} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
          </label>
        );
      })}
    </div>
  );
}

function Field({ label, children, grow }: { label: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, flex: grow ? 1 : "initial" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cs-dim, #666)" }}>{label}</span>
      {children}
    </label>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 12, color: "var(--cs-dim, #666)", padding: "16px 8px", textAlign: "center", fontStyle: "italic" }}>{text}</div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    padding: "5px 8px",
    border: "1px solid var(--cs-border, #ddd)",
    borderRadius: 4,
    fontSize: 12,
    background: "var(--cs-card-bg, #fff)",
    color: "inherit",
  };
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

function btn(color: string, enabled: boolean, extra: React.CSSProperties): React.CSSProperties {
  return {
    border: "none",
    background: enabled ? color : "#9e9e9e",
    color: "#fff", padding: "5px 10px", borderRadius: 4,
    fontSize: 11, fontWeight: 600,
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.7,
    ...extra,
  };
}
