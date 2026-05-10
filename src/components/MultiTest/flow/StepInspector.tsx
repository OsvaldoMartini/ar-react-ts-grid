// Right-side inspector for the Flow tab — Phase 2c (ROADMAP_9).
//
// Renders type-specific payload editor + captures + substitutions tables.
// All edits flow back through the onChange callback so FlowTab keeps its
// dirty/save plumbing for the centre column.

import React, { useEffect, useMemo } from "react";
import { mtT as t } from "../useMtT";
import type {
  ApiCapture, ApiStepPayload, ApiSubstitute,
  AssertStepPayload,
  FlowStep, FlowStepType,
  UiStepPayload, UiSubstitute,
  WaitStepPayload,
} from "./types";
import type { BotJobBlock, FlowMapping, FlowUseCase } from "./useFlowSocket";

const MONO = "'JetBrains Mono','Fira Code',monospace";

interface StepInspectorProps {
  step: FlowStep;
  onChange: (next: FlowStep) => void;
  // Phase 2c autocomplete sources
  blocks: BotJobBlock[];
  useCases: FlowUseCase[];
  mappingsForUseCase: (useCaseId: number) => FlowMapping[];
  loadMappingsForUseCase: (useCaseId: number) => void;
  /** Look up the bot-job INPUT instruction by id (for showing names in UI substitution rows) */
  instructionLabel: (instructionId: number) => string;
}

// ── Safe JSON helpers ─────────────────────────────────────────────────────

function parsePayload<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try { return { ...fallback, ...JSON.parse(json) }; } catch { return fallback; }
}

function patchStep<T>(step: FlowStep, payload: T, name?: string | null): FlowStep {
  return {
    ...step,
    name: name !== undefined ? name : step.name,
    payloadJson: JSON.stringify(payload),
  };
}

// ── Inspector entry — switches on step type ───────────────────────────────

export default function StepInspector(props: StepInspectorProps) {
  const { step, onChange } = props;

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12, overflow: "auto", flex: 1 }}>
      {/* Step name */}
      <Field label={t("flow.inspector.name")}>
        <input
          type="text"
          value={step.name ?? ""}
          onChange={e => onChange({ ...step, name: e.target.value })}
          style={inputStyle()}
        />
      </Field>

      {/* Type-specific editor */}
      <TypeBlock title={typeTitle(step.stepType)}>
        {step.stepType === "API"    && <ApiEditor    {...props} />}
        {step.stepType === "UI"     && <UiEditor     {...props} />}
        {step.stepType === "WAIT"   && <WaitEditor   {...props} />}
        {step.stepType === "ASSERT" && <AssertEditor {...props} />}
      </TypeBlock>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// API step editor
// ─────────────────────────────────────────────────────────────────────────

const API_DEFAULT: ApiStepPayload = { method: "GET", path: "/", headers: {}, captures: [], substitutes: [] };
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];

function ApiEditor({ step, onChange }: StepInspectorProps) {
  const p = parsePayload<ApiStepPayload>(step.payloadJson, API_DEFAULT);
  const set = (next: Partial<ApiStepPayload>) => onChange(patchStep(step, { ...p, ...next }));

  return (
    <>
      <div style={{ display: "flex", gap: 6 }}>
        <Field label={t("flow.inspector.method")} compact>
          <select value={p.method} onChange={e => set({ method: e.target.value })} style={{ ...inputStyle(), minWidth: 100 }}>
            {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label={t("flow.inspector.path")} grow>
          <input type="text" value={p.path} onChange={e => set({ path: e.target.value })} placeholder="/accounts/{id}" style={inputStyle()} />
        </Field>
      </div>

      <Field label={t("flow.inspector.headersJson")}>
        <textarea
          value={JSON.stringify(p.headers ?? {}, null, 2)}
          onChange={e => {
            try { set({ headers: JSON.parse(e.target.value) }); }
            catch { /* keep last-good while user is mid-edit */ }
          }}
          style={{ ...inputStyle(), minHeight: 60, fontFamily: MONO }}
          spellCheck={false}
        />
      </Field>

      <Field label={t("flow.inspector.bodyJson")}>
        <textarea
          value={p.body !== undefined ? JSON.stringify(p.body, null, 2) : ""}
          onChange={e => {
            const raw = e.target.value;
            if (raw.trim() === "") { set({ body: undefined }); return; }
            try { set({ body: JSON.parse(raw) }); } catch {}
          }}
          style={{ ...inputStyle(), minHeight: 80, fontFamily: MONO }}
          spellCheck={false}
        />
      </Field>

      <ApiCapturesTable captures={p.captures ?? []} onChange={cs => set({ captures: cs })} />
      <ApiSubstitutesTable substitutes={p.substitutes ?? []} onChange={ss => set({ substitutes: ss })} />
    </>
  );
}

function ApiCapturesTable({ captures, onChange }: { captures: ApiCapture[]; onChange: (next: ApiCapture[]) => void }) {
  return (
    <TableBlock
      title={t("flow.inspector.captures")}
      hint={t("flow.inspector.capturesHint")}
      onAdd={() => onChange([...captures, { var: "", jsonpath: "" }])}
      addLabel={t("flow.inspector.addCapture")}
    >
      {captures.length === 0 && <EmptyRow text={t("flow.inspector.noCaptures")} />}
      {captures.map((c, i) => (
        <div key={i} style={rowStyle()}>
          <input placeholder="varName" value={c.var} onChange={e => {
            const next = captures.slice(); next[i] = { ...c, var: e.target.value }; onChange(next);
          }} style={{ ...inputStyle(), flex: 1 }} />
          <span style={arrowStyle()}>←</span>
          <input placeholder="$.data.id" value={c.jsonpath} onChange={e => {
            const next = captures.slice(); next[i] = { ...c, jsonpath: e.target.value }; onChange(next);
          }} style={{ ...inputStyle(), flex: 2, fontFamily: MONO }} />
          <button onClick={() => onChange(captures.filter((_, j) => j !== i))} style={removeBtn()} title={t("flow.inspector.removeRow")}>✕</button>
        </div>
      ))}
    </TableBlock>
  );
}

function ApiSubstitutesTable({ substitutes, onChange }: { substitutes: ApiSubstitute[]; onChange: (next: ApiSubstitute[]) => void }) {
  return (
    <TableBlock
      title={t("flow.inspector.substitutes")}
      hint={t("flow.inspector.substitutesHint")}
      onAdd={() => onChange([...substitutes, { var: "", target: "header", key: "" }])}
      addLabel={t("flow.inspector.addSubstitute")}
    >
      {substitutes.length === 0 && <EmptyRow text={t("flow.inspector.noSubstitutes")} />}
      {substitutes.map((s, i) => (
        <div key={i} style={rowStyle()}>
          <input placeholder="varName" value={s.var} onChange={e => {
            const next = substitutes.slice(); next[i] = { ...s, var: e.target.value }; onChange(next);
          }} style={{ ...inputStyle(), flex: 1 }} />
          <span style={arrowStyle()}>→</span>
          <select value={s.target} onChange={e => {
            const next = substitutes.slice(); next[i] = { ...s, target: e.target.value as ApiSubstitute["target"] }; onChange(next);
          }} style={{ ...inputStyle(), width: 80 }}>
            <option value="header">header</option>
            <option value="path">path</option>
            <option value="body">body</option>
          </select>
          <input placeholder="key/path" value={s.key} onChange={e => {
            const next = substitutes.slice(); next[i] = { ...s, key: e.target.value }; onChange(next);
          }} style={{ ...inputStyle(), flex: 1, fontFamily: MONO }} />
          <button onClick={() => onChange(substitutes.filter((_, j) => j !== i))} style={removeBtn()} title={t("flow.inspector.removeRow")}>✕</button>
        </div>
      ))}
    </TableBlock>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// UI step editor — block picker + use-case-driven substitution suggestions
// ─────────────────────────────────────────────────────────────────────────

const UI_DEFAULT: UiStepPayload = { refBlockId: 0, useCaseId: null, substitutes: [], captures: [] };

function UiEditor({ step, onChange, blocks, useCases, mappingsForUseCase, loadMappingsForUseCase, instructionLabel }: StepInspectorProps) {
  const p = parsePayload<UiStepPayload>(step.payloadJson, UI_DEFAULT);
  const set = (next: Partial<UiStepPayload>) => onChange(patchStep(step, { ...p, ...next }));

  // Trigger lazy mappings load when the user picks a use case.
  useEffect(() => {
    if (p.useCaseId) loadMappingsForUseCase(p.useCaseId);
  }, [p.useCaseId, loadMappingsForUseCase]);

  const mappings = p.useCaseId ? mappingsForUseCase(p.useCaseId) : [];

  const onApplyAllMappings = () => {
    if (!p.useCaseId || mappings.length === 0) return;
    // Append any mapping not already present in substitutes (matched by botInstructionId).
    const existing = new Set((p.substitutes ?? []).map(s => s.botInstructionId));
    const additions: UiSubstitute[] = mappings
      .filter(m => !existing.has(m.botInstructionId))
      .map(m => ({ botInstructionId: m.botInstructionId, var: m.apiFieldName ?? "" }));
    set({ substitutes: [...(p.substitutes ?? []), ...additions] });
  };

  return (
    <>
      <div style={{ display: "flex", gap: 6 }}>
        <Field label={t("flow.inspector.block")} grow>
          <select
            value={p.refBlockId || 0}
            onChange={e => set({ refBlockId: parseInt(e.target.value, 10) || 0 })}
            style={inputStyle()}
          >
            <option value={0}>{t("flow.inspector.pickBlock")}</option>
            {blocks.map(b => (
              <option key={b.id} value={b.id}>
                #{b.blockOrderNumber} — {b.name} (id {b.id})
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("flow.inspector.useCaseSource")} grow>
          <select
            value={p.useCaseId ?? ""}
            onChange={e => {
              const v = e.target.value;
              set({ useCaseId: v ? parseInt(v, 10) : null });
            }}
            style={inputStyle()}
          >
            <option value="">{t("flow.inspector.noUseCase")}</option>
            {useCases.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <UiSubstitutesTable
        substitutes={p.substitutes ?? []}
        onChange={ss => set({ substitutes: ss })}
        suggestions={mappings}
        onApplyAll={onApplyAllMappings}
        instructionLabel={instructionLabel}
      />

      <ApiCapturesTable captures={p.captures ?? []} onChange={cs => set({ captures: cs })} />
    </>
  );
}

function UiSubstitutesTable({
  substitutes, onChange, suggestions, onApplyAll, instructionLabel,
}: {
  substitutes: UiSubstitute[];
  onChange: (next: UiSubstitute[]) => void;
  suggestions: FlowMapping[];
  onApplyAll: () => void;
  instructionLabel: (id: number) => string;
}) {
  return (
    <TableBlock
      title={t("flow.inspector.uiSubstitutes")}
      hint={t("flow.inspector.uiSubstitutesHint")}
      onAdd={() => onChange([...substitutes, { botInstructionId: 0, var: "" }])}
      addLabel={t("flow.inspector.addSubstitute")}
      extraButton={suggestions.length > 0 ? (
        <button onClick={onApplyAll} style={{
          border: "none", background: "#1565C0", color: "#fff",
          padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
          cursor: "pointer",
        }}>
          ⤓ {t("flow.inspector.applyAllMappings").replace("{n}", String(suggestions.length))}
        </button>
      ) : undefined}
    >
      {substitutes.length === 0 && <EmptyRow text={t("flow.inspector.noUiSubstitutes")} />}
      {substitutes.map((s, i) => (
        <div key={i} style={rowStyle()}>
          <input
            type="number"
            placeholder="instr id"
            value={s.botInstructionId || ""}
            onChange={e => {
              const next = substitutes.slice();
              next[i] = { ...s, botInstructionId: parseInt(e.target.value, 10) || 0 };
              onChange(next);
            }}
            style={{ ...inputStyle(), width: 80, fontFamily: MONO }}
          />
          <span style={{ ...arrowStyle(), fontSize: 10, color: "var(--cs-dim, #666)", flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {s.botInstructionId ? instructionLabel(s.botInstructionId) : "—"}
          </span>
          <span style={arrowStyle()}>←</span>
          <input
            placeholder="$"
            value={s.var}
            onChange={e => {
              const next = substitutes.slice(); next[i] = { ...s, var: e.target.value }; onChange(next);
            }}
            style={{ ...inputStyle(), flex: 1, fontFamily: MONO }}
          />
          <button onClick={() => onChange(substitutes.filter((_, j) => j !== i))} style={removeBtn()} title={t("flow.inspector.removeRow")}>✕</button>
        </div>
      ))}
    </TableBlock>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// WAIT / ASSERT
// ─────────────────────────────────────────────────────────────────────────

function WaitEditor({ step, onChange }: StepInspectorProps) {
  const p = parsePayload<WaitStepPayload>(step.payloadJson, { seconds: 1 });
  return (
    <Field label={t("flow.inspector.waitSeconds")}>
      <input
        type="number"
        min={0}
        value={p.seconds}
        onChange={e => onChange(patchStep(step, { seconds: Math.max(0, parseFloat(e.target.value) || 0) }))}
        style={{ ...inputStyle(), width: 120 }}
      />
    </Field>
  );
}

function AssertEditor({ step, onChange }: StepInspectorProps) {
  const p = parsePayload<AssertStepPayload>(step.payloadJson, { expr: "", expected: "" });
  const set = (next: Partial<AssertStepPayload>) => onChange(patchStep(step, { ...p, ...next }));
  return (
    <>
      <Field label={t("flow.inspector.assertExpr")}>
        <input
          placeholder="${accountId}  OR  domText('//div[@id=...]')"
          value={p.expr}
          onChange={e => set({ expr: e.target.value })}
          style={{ ...inputStyle(), fontFamily: MONO }}
        />
      </Field>
      <Field label={t("flow.inspector.assertExpected")}>
        <input
          placeholder={t("flow.inspector.assertExpectedHint")}
          value={p.expected ?? ""}
          onChange={e => set({ expected: e.target.value })}
          style={{ ...inputStyle(), fontFamily: MONO }}
        />
      </Field>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────

function Field({ label, children, compact, grow }: { label: string; children: React.ReactNode; compact?: boolean; grow?: boolean }) {
  return (
    <label style={{
      display: "flex", flexDirection: "column", gap: 3,
      flex: grow ? 1 : compact ? 0 : "initial",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cs-dim, #666)" }}>{label}</span>
      {children}
    </label>
  );
}

function TypeBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        color: "var(--cs-dim, #666)", padding: "4px 0",
        borderBottom: "1px solid var(--cs-border, #ddd)",
      }}>{title}</div>
      {children}
    </div>
  );
}

function TableBlock({
  title, hint, onAdd, addLabel, extraButton, children,
}: {
  title: string; hint?: string;
  onAdd: () => void; addLabel: string;
  extraButton?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cs-dim, #666)", flex: 1 }}>{title}</span>
        {extraButton}
        <button onClick={onAdd} style={{
          border: "1px solid var(--cs-border, #ddd)", background: "transparent",
          padding: "2px 8px", borderRadius: 3, fontSize: 11, cursor: "pointer",
        }}>+ {addLabel}</button>
      </div>
      {hint && (
        <div style={{ fontSize: 10, color: "var(--cs-muted, #888)", fontStyle: "italic" }}>{hint}</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div style={{ fontSize: 11, color: "var(--cs-muted, #888)", padding: "6px 0", textAlign: "center", fontStyle: "italic" }}>{text}</div>;
}

function rowStyle(): React.CSSProperties {
  return { display: "flex", alignItems: "center", gap: 4 };
}
function arrowStyle(): React.CSSProperties {
  return { fontSize: 12, color: "var(--cs-dim, #666)", padding: "0 2px" };
}
function inputStyle(): React.CSSProperties {
  return {
    padding: "4px 6px",
    border: "1px solid var(--cs-border, #ddd)",
    borderRadius: 3,
    fontSize: 12,
    background: "var(--cs-card-bg, #fff)",
    color: "inherit",
  };
}
function removeBtn(): React.CSSProperties {
  return {
    border: "none", background: "transparent",
    color: "#C62828", cursor: "pointer", fontSize: 12, padding: "0 4px",
  };
}

function typeTitle(type: FlowStepType): string {
  switch (type) {
    case "API":    return t("flow.inspector.titleApi");
    case "UI":     return t("flow.inspector.titleUi");
    case "WAIT":   return t("flow.inspector.titleWait");
    case "ASSERT": return t("flow.inspector.titleAssert");
  }
}
