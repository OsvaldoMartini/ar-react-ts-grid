// Flow tab — Phase 2a skeleton (ROADMAP_9).
//
// What's here:
//   - Left rail: list of flows for the active bot job + ➕ New / ✏️ Rename / 🗑 Delete
//   - Center area: "Pick a flow" placeholder (Phase 2b drops the step cards here)
//   - Right area: "Inspector" placeholder (Phase 2c drops the type-specific
//     payload editor + captures + substitutions tables here)
//
// What's NOT here yet:
//   - Step cards / reorder / add-delete (Phase 2b)
//   - Per-step-type payload editors (Phase 2c)
//   - Executor / live progress (Phase 3 — DEFERRED per ROADMAP_9 §5)

import React, { useEffect, useMemo, useState } from "react";
import { mtT as t } from "./useMtT";
import { useFlowSocket } from "./flow/useFlowSocket";
import type { Flow, FlowStep, FlowStepType } from "./flow/types";

interface FlowTabProps {
  socketPort: number;
  botJobId: number;
  botJobName: string;
}

const MONO = "'JetBrains Mono','Fira Code',monospace";

// ── Remembered active flow per bot job ─────────────────────────────────
function activeFlowKey(botJobId: number) {
  return `flow.activeFlow.botJob.${botJobId}`;
}
function readRememberedFlowId(botJobId: number): number | null {
  if (!botJobId) return null;
  const raw = localStorage.getItem(activeFlowKey(botJobId));
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
function rememberFlowId(botJobId: number, flowId: number) {
  if (!botJobId || !flowId) return;
  try { localStorage.setItem(activeFlowKey(botJobId), String(flowId)); } catch {}
}

// ── Draft cache for flow steps per (flowId) — survives refresh ─────────
function stepsDraftKey(flowId: number) { return `flow.stepsDraft.${flowId}`; }
function readStepsDraft(flowId: number): FlowStep[] | null {
  if (!flowId) return null;
  try {
    const raw = localStorage.getItem(stepsDraftKey(flowId));
    return raw ? (JSON.parse(raw) as FlowStep[]) : null;
  } catch { return null; }
}
function writeStepsDraft(flowId: number, steps: FlowStep[]) {
  if (!flowId) return;
  try { localStorage.setItem(stepsDraftKey(flowId), JSON.stringify(steps)); } catch {}
}
function clearStepsDraft(flowId: number) {
  if (!flowId) return;
  try { localStorage.removeItem(stepsDraftKey(flowId)); } catch {}
}

// ── Default empty payload per step type — gives Phase 2c something to edit ──
function defaultPayload(type: FlowStepType): string {
  switch (type) {
    case "API":    return JSON.stringify({ method: "GET", path: "/", headers: {}, captures: [], substitutes: [] });
    case "UI":     return JSON.stringify({ refBlockId: 0, useCaseId: null, substitutes: [], captures: [] });
    case "WAIT":   return JSON.stringify({ seconds: 1 });
    case "ASSERT": return JSON.stringify({ expr: "", expected: "" });
  }
}

// ── One-line summary of a step's payload, for the card ──
function stepSummary(step: FlowStep): string {
  try {
    const p = step.payloadJson ? JSON.parse(step.payloadJson) : {};
    switch (step.stepType) {
      case "API":    return `${p.method ?? "GET"} ${p.path ?? "/"}`;
      case "UI":     return p.refBlockId ? `block #${p.refBlockId}` : "(no block selected)";
      case "WAIT":   return `${p.seconds ?? 0}s`;
      case "ASSERT": return p.expr ? String(p.expr) : "(no expression)";
    }
  } catch {
    return "(invalid payload)";
  }
  return "";
}

// ── Order-insensitive (by id+order) compare to drive dirty detection ──
function sameSteps(a: FlowStep[], b: FlowStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x.stepType !== y.stepType) return false;
    if ((x.name ?? "") !== (y.name ?? "")) return false;
    if ((x.payloadJson ?? "") !== (y.payloadJson ?? "")) return false;
    if (x.stepOrder !== y.stepOrder) return false;
  }
  return true;
}

// ── Type-specific badge palette ──
const STEP_BADGE: Record<FlowStepType, { bg: string; fg: string; icon: string; label: string }> = {
  API:    { bg: "#1565C020", fg: "#1565C0", icon: "▶", label: "API"    },
  UI:     { bg: "#2E7D3220", fg: "#2E7D32", icon: "▶", label: "UI"     },
  WAIT:   { bg: "#E6510020", fg: "#E65100", icon: "⏱", label: "WAIT"   },
  ASSERT: { bg: "#9C27B020", fg: "#9C27B0", icon: "✓", label: "ASSERT" },
};

export default function FlowTab({ socketPort, botJobId, botJobName }: FlowTabProps) {
  const sessionId = useMemo(
    () => `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const {
    connected, error,
    flows, loadingFlows,
    savingFlow, lastFlowSaveAt, lastFlowSaved, lastFlowDeletedId,
    steps: serverSteps, loadingSteps, savingSteps, lastStepsSaveAt, lastStepsSaveOk,
    loadFlows, saveFlow, deleteFlow, loadSteps, saveSteps,
  } = useFlowSocket({ socketPort, sessionId });

  const [currentFlowId, setCurrentFlowId] = useState<number | null>(null);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [stepsBaseline, setStepsBaseline] = useState<FlowStep[]>([]);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(null);

  // Bot job change → load flows + reset
  useEffect(() => {
    setCurrentFlowId(null);
    if (botJobId > 0 && connected) loadFlows(botJobId);
  }, [botJobId, connected, loadFlows]);

  // Flows arrived → pick remembered or first
  useEffect(() => {
    if (botJobId <= 0 || flows.length === 0) return;
    setCurrentFlowId(prev => {
      if (prev && flows.some(f => f.id === prev)) return prev;
      const remembered = readRememberedFlowId(botJobId);
      if (remembered && flows.some(f => f.id === remembered)) return remembered;
      return flows[0].id;
    });
  }, [flows, botJobId]);

  // Persist active flow choice
  useEffect(() => {
    if (botJobId > 0 && currentFlowId) rememberFlowId(botJobId, currentFlowId);
  }, [botJobId, currentFlowId]);

  // After a successful create/rename → refresh + select
  useEffect(() => {
    if (!lastFlowSaveAt || !lastFlowSaved || botJobId <= 0) return;
    loadFlows(botJobId);
    if (lastFlowSaved.id) setCurrentFlowId(lastFlowSaved.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFlowSaveAt]);

  // After a successful delete → refresh + clear if it was current
  useEffect(() => {
    if (!lastFlowDeletedId || botJobId <= 0) return;
    if (currentFlowId === lastFlowDeletedId) setCurrentFlowId(null);
    loadFlows(botJobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFlowDeletedId]);

  const currentFlow: Flow | undefined = useMemo(
    () => flows.find(f => f.id === currentFlowId),
    [flows, currentFlowId],
  );

  // ── current flow change → load steps + reset ────────────────────────────
  useEffect(() => {
    setSteps([]);
    setStepsBaseline([]);
    setSelectedStepIdx(null);
    if (currentFlowId && connected) loadSteps(currentFlowId);
  }, [currentFlowId, connected, loadSteps]);

  // ── server steps arrived → reconcile with draft ─────────────────────────
  useEffect(() => {
    if (serverSteps === null || !currentFlowId) return;
    setStepsBaseline(serverSteps);
    const draft = readStepsDraft(currentFlowId);
    setSteps(draft ?? serverSteps);
  }, [serverSteps, currentFlowId]);

  // ── persist current state to draft on every change ──────────────────────
  useEffect(() => {
    if (currentFlowId) writeStepsDraft(currentFlowId, steps);
  }, [currentFlowId, steps]);

  // ── after a successful steps save → baseline := current, drop draft ────
  useEffect(() => {
    if (lastStepsSaveOk === true && lastStepsSaveAt && currentFlowId) {
      // Reload from server so any newly inserted rows get their assigned ids
      loadSteps(currentFlowId);
      clearStepsDraft(currentFlowId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastStepsSaveAt]);

  const stepsDirty = useMemo(() => !sameSteps(steps, stepsBaseline), [steps, stepsBaseline]);

  // ── step list handlers ──────────────────────────────────────────────────
  const onAddStep = (type: FlowStepType) => {
    if (!currentFlowId) return;
    setSteps(prev => [...prev, {
      flowId: currentFlowId,
      stepOrder: prev.length,
      name: `${type} step ${prev.length + 1}`,
      stepType: type,
      payloadJson: defaultPayload(type),
    }]);
  };

  const onDeleteStep = (idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i })));
    setSelectedStepIdx(null);
  };

  const onMoveStep = (idx: number, dir: -1 | 1) => {
    setSteps(prev => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((s, i) => ({ ...s, stepOrder: i }));
    });
    setSelectedStepIdx(prev => (prev === idx ? idx + dir : prev));
  };

  const onSaveSteps = () => {
    if (!currentFlowId || !stepsDirty || savingSteps) return;
    // Re-stamp orders before sending so server-side order matches what user sees.
    const ordered = steps.map((s, i) => ({ ...s, stepOrder: i, flowId: currentFlowId }));
    saveSteps(currentFlowId, ordered);
  };

  const onDiscardSteps = () => {
    setSteps(stepsBaseline);
    setSelectedStepIdx(null);
    if (currentFlowId) clearStepsDraft(currentFlowId);
  };

  // ── handlers ────────────────────────────────────────────────────────────
  const onCreate = () => {
    if (botJobId <= 0) return;
    const name = (window.prompt(t("flow.newFlowPrompt"), "") || "").trim();
    if (!name) return;
    if (flows.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      window.alert(t("flow.flowNameTaken"));
      return;
    }
    saveFlow({ botJobId, name, description: null });
  };

  const onRename = () => {
    if (!currentFlow) return;
    const next = (window.prompt(t("flow.renameFlowPrompt"), currentFlow.name) || "").trim();
    if (!next || next === currentFlow.name) return;
    if (flows.some(f => f.id !== currentFlow.id && f.name.toLowerCase() === next.toLowerCase())) {
      window.alert(t("flow.flowNameTaken"));
      return;
    }
    saveFlow({
      id: currentFlow.id, botJobId, name: next, description: currentFlow.description,
    });
  };

  const onDelete = () => {
    if (!currentFlow) return;
    if (!window.confirm(t("flow.deleteFlowConfirm").replace("{name}", currentFlow.name))) return;
    deleteFlow(currentFlow.id);
  };

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <div className="mt-scroll" style={{ padding: "16px 20px", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{t("flow.title")}</h3>
        <span style={{ fontSize: 12, color: "var(--cs-dim, #666)" }}>{t("flow.subtitle")}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: connected ? "#2E7D32" : "#C62828",
          }} />
          <span>{connected ? t("flow.connected") : t("flow.disconnected")}</span>
        </div>
      </div>

      {error && (
        <div style={{
          background: "#C6282810", color: "#C62828",
          padding: "8px 10px", borderRadius: 4, fontSize: 12,
        }}>{error}</div>
      )}

      {/* 3-column body: left rail (flows), centre (steps placeholder), right (inspector placeholder) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr 320px",
        gap: 12, flex: 1, minHeight: 0,
      }}>
        {/* ── LEFT RAIL ──────────────────────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span>{t("flow.flows")}</span>
            <span style={{ fontSize: 11, color: "var(--cs-dim, #666)" }}>{flows.length}</span>
          </header>

          <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "auto" }}>
            <div style={{
              display: "flex", flexDirection: "column", gap: 4,
              padding: 8, background: "var(--cs-soft-bg, #f5f5f5)", borderRadius: 4,
              fontSize: 11,
            }}>
              <span style={{ color: "var(--cs-dim, #666)" }}>{t("flow.activeBotJob")}</span>
              <span style={{ fontWeight: 600 }}>
                {botJobId > 0 ? `(${botJobId}) ${botJobName || "—"}` : t("flow.noBotJob")}
              </span>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={onCreate}
                disabled={botJobId <= 0 || !connected || savingFlow}
                title={t("flow.newFlowTitle")}
                style={btn("#1565C0", botJobId > 0 && connected && !savingFlow, { flex: 1 })}
              >➕ {t("flow.newFlow")}</button>
              <button
                onClick={onRename}
                disabled={!currentFlow || savingFlow}
                title={t("flow.renameFlowTitle")}
                style={btn("#37474F", !!currentFlow && !savingFlow, {})}
              >✏️</button>
              <button
                onClick={onDelete}
                disabled={!currentFlow}
                title={t("flow.deleteFlowTitle")}
                style={btn("#C62828", !!currentFlow, {})}
              >🗑</button>
            </div>

            {loadingFlows && (
              <div style={{ fontSize: 11, color: "var(--cs-dim, #666)", padding: 8, textAlign: "center" }}>
                {t("flow.loadingFlows")}
              </div>
            )}

            {!loadingFlows && flows.length === 0 && botJobId > 0 && (
              <EmptyHint text={t("flow.noFlowsHint")} />
            )}

            {flows.map(f => {
              const active = f.id === currentFlowId;
              return (
                <button
                  key={f.id}
                  onClick={() => setCurrentFlowId(f.id)}
                  style={{
                    textAlign: "left", padding: "8px 10px",
                    background: active ? "#1565C015" : "var(--cs-card-bg, #fff)",
                    border: `2px solid ${active ? "#1565C0" : "var(--cs-border, #ddd)"}`,
                    borderRadius: 4, cursor: "pointer",
                    fontSize: 12, fontWeight: active ? 700 : 500,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      background: "#1565C020", color: "#1565C0",
                      padding: "1px 5px", borderRadius: 3,
                      fontSize: 9, fontWeight: 700, fontFamily: MONO,
                    }}>FLOW</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                  </div>
                  {f.description && (
                    <div style={{ fontSize: 10, color: "var(--cs-dim, #666)", marginTop: 2 }}>
                      {f.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── CENTER (step list) ─────────────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {t("flow.steps")}
              {stepsDirty && (
                <span title={t("flow.unsavedSteps")} style={{ color: "#E65100", fontSize: 10 }}>●</span>
              )}
              <span style={{ fontSize: 11, color: "var(--cs-dim, #666)", fontWeight: 400 }}>
                {currentFlow ? `(${currentFlow.name})` : ""}
              </span>
            </span>
            {currentFlow && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--cs-dim, #666)" }}>{steps.length}</span>
                {stepsDirty && (
                  <button
                    onClick={onDiscardSteps}
                    title={t("flow.discardStepsTitle")}
                    style={{
                      border: "1px solid var(--cs-border, #ddd)", background: "transparent",
                      padding: "2px 8px", borderRadius: 3, fontSize: 11, cursor: "pointer",
                    }}
                  >{t("flow.discard")}</button>
                )}
                {(() => {
                  const canSave = stepsDirty && !savingSteps && !!currentFlowId && connected;
                  const reason = !connected
                    ? t("flow.saveDisabledNoConn")
                    : !currentFlowId
                      ? t("flow.saveDisabledNoFlow")
                      : !stepsDirty
                        ? t("flow.saveDisabledNoChanges")
                        : t("flow.saveStepsTitle");
                  return (
                    <button
                      onClick={onSaveSteps}
                      disabled={!canSave}
                      title={reason}
                      style={{
                        border: "none",
                        background: canSave ? "#2E7D32" : "#9e9e9e",
                        color: "#fff", padding: "3px 10px", borderRadius: 3, fontSize: 11,
                        fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed",
                      }}
                    >{savingSteps ? t("flow.saving") : t("flow.save")}</button>
                  );
                })()}
              </span>
            )}
          </header>

          {!currentFlow ? (
            <div style={{
              padding: 24, flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              color: "var(--cs-dim, #666)", textAlign: "center",
            }}>
              <div style={{ fontSize: 42, opacity: 0.3 }}>🔀</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t("flow.pickFlowToStart")}</div>
              <div style={{ fontSize: 11, maxWidth: 360 }}>{t("flow.pickFlowHint")}</div>
            </div>
          ) : (
            <div style={{
              padding: 10, flex: 1, overflow: "auto",
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              {loadingSteps && (
                <div style={{ fontSize: 11, color: "var(--cs-dim, #666)", padding: 8, textAlign: "center" }}>
                  {t("flow.loadingSteps")}
                </div>
              )}

              {!loadingSteps && steps.length === 0 && (
                <EmptyHint text={t("flow.noStepsHint")} />
              )}

              {steps.map((step, idx) => {
                const badge = STEP_BADGE[step.stepType];
                const selected = selectedStepIdx === idx;
                const canUp = idx > 0;
                const canDown = idx < steps.length - 1;
                return (
                  <div
                    key={step.id ?? `new-${idx}`}
                    onClick={() => setSelectedStepIdx(idx)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px",
                      background: selected ? "#1565C015" : "var(--cs-card-bg, #fff)",
                      border: `2px solid ${selected ? "#1565C0" : "var(--cs-border, #ddd)"}`,
                      borderRadius: 6, cursor: "pointer",
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "var(--cs-dim, #666)",
                      minWidth: 20, textAlign: "right", fontFamily: MONO,
                    }}>{idx + 1}.</span>
                    <span style={{
                      background: badge.bg, color: badge.fg,
                      padding: "2px 8px", borderRadius: 3,
                      fontSize: 10, fontWeight: 700, fontFamily: MONO,
                    }}>{badge.icon} {badge.label}</span>
                    <span style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {step.name || t("flow.unnamedStep")}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--cs-dim, #666)", fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {stepSummary(step)}
                      </span>
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); onMoveStep(idx, -1); }}
                      disabled={!canUp}
                      title={t("flow.moveUp")}
                      style={iconBtn(canUp)}
                    >▲</button>
                    <button
                      onClick={e => { e.stopPropagation(); onMoveStep(idx, +1); }}
                      disabled={!canDown}
                      title={t("flow.moveDown")}
                      style={iconBtn(canDown)}
                    >▼</button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteStep(idx); }}
                      title={t("flow.deleteStep")}
                      style={{ ...iconBtn(true), color: "#C62828" }}
                    >✕</button>
                  </div>
                );
              })}

              {/* + Add step row */}
              <div style={{
                marginTop: 8, padding: 8,
                background: "var(--cs-soft-bg, #f5f5f5)",
                border: "1px dashed var(--cs-border, #ccc)",
                borderRadius: 6,
                display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cs-dim, #666)" }}>
                  {t("flow.addStep")}:
                </span>
                {(["API", "UI", "WAIT", "ASSERT"] as FlowStepType[]).map(type => {
                  const b = STEP_BADGE[type];
                  return (
                    <button
                      key={type}
                      onClick={() => onAddStep(type)}
                      title={t(`flow.addStep_${type}`)}
                      style={{
                        border: "none", background: b.fg, color: "#fff",
                        padding: "4px 10px", borderRadius: 4,
                        fontSize: 11, fontWeight: 700, fontFamily: MONO,
                        cursor: "pointer",
                      }}
                    >+ {b.label}</button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── RIGHT (inspector placeholder) ──────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span>{t("flow.inspector")}</span>
          </header>
          <div style={{
            padding: 24, flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
            color: "var(--cs-dim, #666)", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, opacity: 0.3 }}>🔍</div>
            <div style={{ fontSize: 11, maxWidth: 240 }}>{t("flow.inspectorPhase2cHint")}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 12, color: "var(--cs-dim, #666)",
      padding: "16px 8px", textAlign: "center", fontStyle: "italic",
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

function iconBtn(enabled: boolean): React.CSSProperties {
  return {
    border: "1px solid var(--cs-border, #ddd)",
    background: "transparent",
    padding: "2px 6px", borderRadius: 3,
    fontSize: 10, cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.4,
    color: "var(--cs-dim, #666)",
    minWidth: 26, fontFamily: MONO,
  };
}
