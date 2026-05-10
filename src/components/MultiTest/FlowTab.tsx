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
import type { Flow } from "./flow/types";

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

export default function FlowTab({ socketPort, botJobId, botJobName }: FlowTabProps) {
  const sessionId = useMemo(
    () => `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const {
    connected, error,
    flows, loadingFlows,
    savingFlow, lastFlowSaveAt, lastFlowSaved, lastFlowDeletedId,
    loadFlows, saveFlow, deleteFlow,
  } = useFlowSocket({ socketPort, sessionId });

  const [currentFlowId, setCurrentFlowId] = useState<number | null>(null);

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

        {/* ── CENTER (steps placeholder) ─────────────────────────── */}
        <section style={panelStyle()}>
          <header style={panelHeader()}>
            <span>{t("flow.steps")}</span>
            <span style={{ fontSize: 11, color: "var(--cs-dim, #666)" }}>
              {currentFlow ? currentFlow.name : t("flow.noFlowSelected")}
            </span>
          </header>

          <div style={{
            padding: 24, flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
            color: "var(--cs-dim, #666)", textAlign: "center",
          }}>
            {!currentFlow ? (
              <>
                <div style={{ fontSize: 42, opacity: 0.3 }}>🔀</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t("flow.pickFlowToStart")}</div>
                <div style={{ fontSize: 11, maxWidth: 360 }}>{t("flow.pickFlowHint")}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 42, opacity: 0.3 }}>🚧</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t("flow.editorComingSoon")}</div>
                <div style={{ fontSize: 11, maxWidth: 360 }}>{t("flow.editorPhase2bHint")}</div>
              </>
            )}
          </div>
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
