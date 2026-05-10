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
} from "./funcTest/types";

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

function draftKey(botJobId: number) {
  return `funcTest.draft.botJob.${botJobId}`;
}

function readDraft(botJobId: number): FieldMapping[] | null {
  if (!botJobId) return null;
  try {
    const raw = localStorage.getItem(draftKey(botJobId));
    return raw ? (JSON.parse(raw) as FieldMapping[]) : null;
  } catch {
    return null;
  }
}

function writeDraft(botJobId: number, mappings: FieldMapping[]) {
  if (!botJobId) return;
  try {
    localStorage.setItem(draftKey(botJobId), JSON.stringify(mappings));
  } catch {
    // quota or private mode — silent
  }
}

function clearDraft(botJobId: number) {
  if (!botJobId) return;
  try { localStorage.removeItem(draftKey(botJobId)); } catch {}
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
    loadInputInstructions, loadMappings, saveMappings,
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

  // Lookup helpers for the centre column display + server conversion.
  const apiByKey = useMemo(() => new Map(apiRows.map(r => [r.key, r])), [apiRows]);
  const botById  = useMemo(() => new Map(botFields.map(f => [f.id, f])), [botFields]);

  // ── Bot-job change: trigger DB load + reset armed state ─────────────────
  useEffect(() => {
    setArmedApiKey(null);
    if (botJobId > 0 && connected) {
      loadMappings(botJobId);
    } else {
      setMappings([]);
      setSavedBaseline([]);
    }
  }, [botJobId, connected, loadMappings]);

  // ── DB load arrived: reconcile with any local draft ─────────────────────
  // If a draft exists (user had unsaved work before refresh), prefer the
  // draft; otherwise hydrate from the DB result. The savedBaseline is
  // ALWAYS the DB result so dirty-detection is correct either way.
  useEffect(() => {
    if (persistedMappings === null) return; // not loaded yet
    const fromDb = fromServer(persistedMappings);
    setSavedBaseline(fromDb);
    const draft = readDraft(botJobId);
    setMappings(draft ?? fromDb);
  }, [persistedMappings, botJobId]);

  // ── Persist current state to draft on every change ──────────────────────
  useEffect(() => {
    if (botJobId > 0) writeDraft(botJobId, mappings);
  }, [botJobId, mappings]);

  // ── After a successful save, refresh the baseline and drop the draft ───
  useEffect(() => {
    if (lastSaveOk === true && lastSaveAt) {
      setSavedBaseline(mappings);
      clearDraft(botJobId);
    }
    // intentionally only on lastSaveAt change — mappings is the user's current state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSaveAt]);

  const dirty = useMemo(() => !sameMappings(mappings, savedBaseline), [mappings, savedBaseline]);

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
    if (!dirty || saving) return;
    saveMappings(botJobId, toServer(mappings, apiByKey));
  };

  const onDiscardDraft = () => {
    setMappings(savedBaseline);
    clearDraft(botJobId);
  };

  // ── derived sets for "is this card paired?" lookups ──────────
  const pairedApiKeys = useMemo(() => new Set(mappings.map(m => m.apiKey)), [mappings]);
  const pairedBotIds = useMemo(() => new Set(mappings.map(m => m.botFieldId)), [mappings]);

  const apiInputs  = apiRows.filter(r => r.direction === "input"  || r.direction === "io");
  const apiOutputs = apiRows.filter(r => r.direction === "output" || r.direction === "io");

  // ── render ──────────────────────────────────────────────────
  return (
    <div className="mt-scroll" style={{ padding: "16px 20px", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
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
              <button
                onClick={onSave}
                disabled={!dirty || saving || botJobId <= 0 || !connected}
                title={t("funcTest.saveTitle")}
                style={{
                  border: "none",
                  background: dirty && !saving && botJobId > 0 && connected ? "#2E7D32" : "#9e9e9e",
                  color: "#fff", padding: "3px 10px", borderRadius: 3, fontSize: 11,
                  fontWeight: 600,
                  cursor: dirty && !saving && botJobId > 0 && connected ? "pointer" : "not-allowed",
                }}
              >{saving ? t("funcTest.saving") : t("funcTest.save")}</button>
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
