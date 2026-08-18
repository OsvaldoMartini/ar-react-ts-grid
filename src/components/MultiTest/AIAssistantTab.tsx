// ═══════════════════════════════════════════════════════════════
// AI ASSISTANT TAB  — v4 (clean rewrite)
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { getActiveContext } from "./banking/BankingContext";
import { pluginRegistry } from "./banking/PluginSystem";
import { testLibraryStore } from "./banking/TestLibraryStore";
import { testStore, envStore } from "./utils";
import { aiPrefsStore } from "./AIPrefsStore";
import type { ApiSpec } from "./utils";
import "./mt-ai.scss";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const LAST_RESPONSE_KEY = "mt_ai_last_responses";

// ─── TYPES ───────────────────────────────────────────────────
export interface AIProvider {
  id: string; name: string; icon: string; type: "cloud" | "local";
  description: string; endpoint: string; model: string;
  enabled: boolean; apiKeyHint: string;
  status: "ready" | "connecting" | "error" | "unknown";
}

type GenMode = "generate-tests" | "analyze-api" | "explain-rules" | "custom";

interface AIResponseSummary {
  mode:      "tests" | "text";
  items:     { index: number; name: string; desc: string }[];
  footer:    string[];
  textLines: string[];
  count:     number;
}

interface AIResponse {
  providerId:   string;
  providerName: string;
  model:        string;
  content:      string;
  timestamp:    string;
  elapsedMs:    number;
  status:       "pending" | "done" | "error";
  error?:       string;
  jsonFileName: string | null;
  jsonSaved:    boolean;
  summary:      AIResponseSummary | null;
}

// ─── CONSTANTS ───────────────────────────────────────────────
const DEFAULT_PROVIDERS: AIProvider[] = [
  { id: "claude-cloud",   name: "Anthropic Claude",   icon: "☁️", type: "cloud",
    description: "Claude AI by Anthropic — advanced reasoning and code generation",
    endpoint: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514",
    enabled: true, apiKeyHint: "sk-ant-...", status: "ready" },
  { id: "openai-cloud",   name: "OpenAI GPT",          icon: "☁️", type: "cloud",
    description: "OpenAI GPT-4 — general-purpose AI assistant",
    endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o",
    enabled: false, apiKeyHint: "sk-...", status: "unknown" },
  { id: "ollama-local",   name: "Ollama (Local)",       icon: "🖥️", type: "local",
    description: "Ollama local inference — runs on your PC or server",
    endpoint: "http://localhost:11434/api/generate", model: "qwen2.5:14b",
    enabled: false, apiKeyHint: "(no key needed)", status: "unknown" },
  { id: "lmstudio-local", name: "LM Studio (Local)",   icon: "🖥️", type: "local",
    description: "LM Studio — OpenAI-compatible local endpoint",
    endpoint: "http://localhost:1234/v1/chat/completions", model: "local-model",
    enabled: false, apiKeyHint: "(no key needed)", status: "unknown" },
  { id: "custom-local",   name: "Custom Local Server", icon: "🔧", type: "local",
    description: "Any OpenAI-compatible local inference server",
    endpoint: "http://localhost:8000/v1/chat/completions", model: "custom",
    enabled: false, apiKeyHint: "(optional)", status: "unknown" },
];

const GEN_MODES: { id: GenMode; label: string; icon: string; desc: string }[] = [
  { id: "generate-tests", label: "Generate Test Cases",    icon: "🧪", desc: "Generate business-oriented test cases from loaded APIs" },
  { id: "analyze-api",    label: "Analyze API Specs",      icon: "🔍", desc: "Analyze loaded API specifications and suggest test coverage" },
  { id: "explain-rules",  label: "Explain Business Rules", icon: "📖", desc: "Explain active banking rules and their implications" },
  { id: "custom",         label: "Custom Prompt",          icon: "✏️", desc: "Write a free-form prompt with banking context injected" },
];

// ─── SHARED STYLE CONSTANT ───────────────────────────────────
const IBTN_S: React.CSSProperties = {
  fontFamily: MONO, fontSize: 9, padding: "2px 8px", borderRadius: 4,
  cursor: "pointer", background: "transparent",
  border: "1px solid var(--cs-border)", color: "var(--cs-dim)",
};

// ─── INLINE EDIT HELPER ──────────────────────────────────────
function InlineEdit({ value, onChange, onCommit, onCancel, width }: {
  value: string; onChange: (v: string) => void;
  onCommit: () => void; onCancel: () => void; width: number;
}) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 3 }}>
      <input
        value={value} autoFocus
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") onCommit();
          if (e.key === "Escape") onCancel();
          e.stopPropagation();
        }}
        style={{
          width, fontFamily: MONO, fontSize: 10, padding: "3px 8px", borderRadius: 4,
          background: "var(--cs-bg)", border: "1px solid var(--cs-accent)",
          color: "var(--cs-text)", outline: "none",
        }}
      />
      <button onClick={onCommit} style={{ ...IBTN_S, color: "#34d399", borderColor: "#34d39944" }}>✓</button>
      <button onClick={onCancel} style={IBTN_S}>✕</button>
    </div>
  );
}

// ─── API KEY INPUT ────────────────────────────────────────────
interface ApiKeyInputProps {
  providerId: string; providerName: string; hint: string;
  currentKey: string; onSave: (id: string, key: string) => void; onCancel: () => void;
}
class ApiKeyInput extends React.Component<ApiKeyInputProps, { value: string; show: boolean }> {
  state = { value: this.props.currentKey, show: false };
  render() {
    const { providerId, providerName, hint, onSave, onCancel } = this.props;
    const { value, show } = this.state;
    return (
      <div style={{
        padding: "10px 14px 12px", background: "#60a5fa08",
        border: "1px solid #60a5fa22", borderTop: "none", borderRadius: "0 0 8px 8px",
      }}>
        <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#60a5fa", letterSpacing: 0.8, marginBottom: 8 }}>
          🔑 API KEY — {providerName}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type={show ? "text" : "password"} value={value} placeholder={hint}
            onChange={e => this.setState({ value: e.target.value })}
            onKeyDown={e => {
              if (e.key === "Enter") onSave(providerId, value);
              if (e.key === "Escape") onCancel();
              e.stopPropagation();
            }}
            autoFocus
            style={{
              flex: 1, padding: "7px 12px", fontFamily: MONO, fontSize: 11,
              background: "var(--cs-bg)", border: "1px solid #60a5fa66",
              borderRadius: 6, color: "var(--cs-text)", outline: "none",
            }}
          />
          <button onClick={() => this.setState(s => ({ show: !s.show }))}
            style={{ ...IBTN_S, padding: "6px 10px", fontSize: 14 }}>
            {show ? "🙈" : "👁"}
          </button>
          <button onClick={() => onSave(providerId, value)} disabled={!value.trim()}
            style={{
              padding: "7px 16px", borderRadius: 6, fontFamily: MONO, fontSize: 11,
              fontWeight: 700, cursor: value.trim() ? "pointer" : "not-allowed",
              background: value.trim() ? "#34d39920" : "transparent",
              border: `1px solid ${value.trim() ? "#34d399" : "var(--cs-border)"}`,
              color: value.trim() ? "#34d399" : "var(--cs-dim)",
            }}>
            ✓ Save
          </button>
          <button onClick={onCancel} style={{ ...IBTN_S, padding: "7px 12px", fontSize: 11 }}>✕</button>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", marginTop: 6, lineHeight: 1.5 }}>
          Optional for Anthropic Claude — leave empty to use free mode. Providing your own key removes rate limits.
        </div>
      </div>
    );
  }
}

// ─── AI SUMMARY BODY ─────────────────────────────────────────
function AISummaryBody({ summary, jsonFileName, providerName, model, timestamp, elapsedMs }: {
  summary: AIResponseSummary; jsonFileName: string | null;
  providerName: string; model: string; timestamp: string; elapsedMs: number;
}) {
  const MF = MONO;
  const elapsedSec = elapsedMs > 0 ? (elapsedMs / 1000).toFixed(1) + "s" : "—";
  const timeStr = new Date(timestamp).toLocaleTimeString();

  const MetaBlock = () => (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--cs-border-sub)", background: "var(--cs-surface-2)" }}>
      <div style={{ fontFamily: MF, fontSize: 9, color: "var(--cs-dim)", marginBottom: 6 }}>{"─".repeat(52)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", rowGap: 3, fontFamily: MF, fontSize: 10 }}>
        <span style={{ color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.8 }}>PROVIDER</span>
        <span style={{ color: "var(--cs-text)" }}>: {providerName}</span>
        <span style={{ color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.8 }}>MODEL</span>
        <span style={{ color: "var(--cs-text)" }}>: {model || "default"}</span>
        <span style={{ color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.8 }}>TIME</span>
        <span style={{ color: "var(--cs-text)" }}>: {timeStr}</span>
        <span style={{ color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.8 }}>ELAPSED</span>
        <span style={{ color: elapsedMs > 0 ? "#f59e0b" : "var(--cs-dim)" }}>: {elapsedSec}</span>
        {summary.mode === "tests" && (
          <>
            <span style={{ color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.8 }}>GENERATED</span>
            <span style={{ color: "#34d399" }}>: {summary.count} test case{summary.count !== 1 ? "s" : ""}</span>
          </>
        )}
        {summary.mode === "text" && (
          <>
            <span style={{ color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.8 }}>RESPONSE</span>
            <span style={{ color: "var(--cs-muted)" }}>: {summary.textLines.join("\n").length} chars</span>
          </>
        )}
      </div>
      <div style={{ fontFamily: MF, fontSize: 9, color: "var(--cs-dim)", marginTop: 6 }}>{"─".repeat(52)}</div>
    </div>
  );

  if (summary.mode === "tests") {
    return (
      <div style={{ display: "flex", flexDirection: "column" as const }}>
        <MetaBlock />
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
          <div style={{ fontFamily: MF, fontSize: 11, fontWeight: 700, color: "var(--cs-text)", lineHeight: 1.5 }}>
            [{providerName}] Generated {summary.count} test case{summary.count !== 1 ? "s" : ""}:
          </div>
          <ol style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column" as const, gap: 5 }}>
            {summary.items.map(item => (
              <li key={item.index} style={{ fontFamily: MF, fontSize: 11, color: "var(--cs-text)", lineHeight: 1.6 }}>
                <span style={{ color: "#34d399", fontWeight: 700 }}>"{item.name}"</span>
                {item.desc ? <span style={{ color: "var(--cs-muted)" }}> — {item.desc}</span> : null}
              </li>
            ))}
          </ol>
          {summary.footer.map((line, i) => (
            <div key={i} style={{ fontFamily: MF, fontSize: 10, color: "var(--cs-muted)", lineHeight: 1.5 }}>{line}</div>
          ))}
          {jsonFileName && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 6,
              background: "#34d39912", border: "1px solid #34d39930", fontFamily: MF, fontSize: 10,
            }}>
              <span style={{ color: "var(--cs-dim)", fontWeight: 700, letterSpacing: 0.8 }}>FILE NAME :</span>
              <span style={{ color: "#34d399", fontWeight: 600 }}>{jsonFileName}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" as const }}>
      <MetaBlock />
      <div style={{ padding: "14px 16px" }}>
        {summary.textLines.map((line, i) => {
          if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
          const isBullet = /^[-*•]\s/.test(line.trim());
          const isHeader = /^#{1,3}\s/.test(line.trim()) || /^[A-Z][A-Z\s]{4,}:/.test(line.trim());
          const indent   = line.length - line.trimStart().length;
          const clean    = line.trim().replace(/^[-*•]\s/, "").replace(/^#{1,3}\s/, "").replace(/\*\*/g, "");
          if (isHeader) {
            return <div key={i} style={{ fontFamily: MF, fontSize: 11, fontWeight: 800, color: "var(--cs-text)", marginTop: 10, marginBottom: 3 }}>{clean}</div>;
          }
          if (isBullet) {
            return (
              <div key={i} style={{ display: "flex", gap: 6, marginLeft: indent * 2 + 8, marginBottom: 3 }}>
                <span style={{ color: "#60a5fa", flexShrink: 0, fontFamily: MF, fontSize: 10 }}>•</span>
                <span style={{ fontFamily: MF, fontSize: 11, color: "var(--cs-text)", lineHeight: 1.6 }}>{clean}</span>
              </div>
            );
          }
          return <div key={i} style={{ fontFamily: MF, fontSize: 11, color: "var(--cs-text)", lineHeight: 1.7, marginLeft: indent * 2 }}>{line.trim()}</div>;
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AI ASSISTANT TAB — MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface AIAssistantState {
  providers:          AIProvider[];
  selectedIds:        Set<string>;
  showProviderPanel:  boolean;
  genMode:            GenMode;
  customPrompt:       string;
  selectedCategory:   string;
  responses:          AIResponse[];
  sending:            boolean;
  pluginCount:        number;
  testCaseCount:      number;
  apiKeys:            Record<string, string>;
  showKeyFor:         string | null;
  applyStatus:        string | null;
  importStatus:       string | null;
  editEndpointFor:    string | null;
  editEndpointVal:    string;
  editModelFor:       string | null;
  editModelVal:       string;
  testRunCount:       number;
  selectedCatIds:     Set<string>;
  hasStoredResponses: boolean;
}

interface AIAssistantProps { loadedSpecs: ApiSpec[]; }

export class AIAssistantTab extends React.Component<AIAssistantProps, AIAssistantState> {
  state: AIAssistantState = {
    providers:          DEFAULT_PROVIDERS.map(p => ({ ...p })),
    selectedIds:        new Set(["claude-cloud"]),
    showProviderPanel:  false,
    genMode:            "generate-tests",
    customPrompt:       "",
    selectedCategory:   "",
    responses:          [],
    sending:            false,
    pluginCount:        pluginRegistry.getEnabled().length,
    testCaseCount:      testLibraryStore.stats.totalTests,
    apiKeys:            {},
    showKeyFor:         null,
    applyStatus:        null,
    importStatus:       null,
    editEndpointFor:    null,
    editEndpointVal:    "",
    editModelFor:       null,
    editModelVal:       "",
    testRunCount:       aiPrefsStore.testRunCount,
    selectedCatIds:     new Set(aiPrefsStore.selectedCategoryIds),
    hasStoredResponses: false,
  };

  private unsubPlugin?: () => void;
  private unsubLib?:    () => void;
  private unsubPrefs?:  () => void;
  private csvInputRef  = React.createRef<HTMLInputElement>();
  private jsonInputRef = React.createRef<HTMLInputElement>();

  componentDidMount() {
    this.unsubPlugin = pluginRegistry.subscribe(() => this.setState({ pluginCount: pluginRegistry.getEnabled().length }));
    this.unsubLib    = testLibraryStore.subscribe(() => this.setState({ testCaseCount: testLibraryStore.stats.totalTests }));
    this.unsubPrefs  = aiPrefsStore.subscribe(() => this.setState({
      testRunCount: aiPrefsStore.testRunCount,
      selectedCatIds: new Set(aiPrefsStore.selectedCategoryIds),
    }));
    try { const s = sessionStorage.getItem("mt_ai_keys"); if (s) this.setState({ apiKeys: JSON.parse(s) }); } catch {}
    try { if (sessionStorage.getItem(LAST_RESPONSE_KEY)) this.setState({ hasStoredResponses: true }); } catch {}
  }

  componentWillUnmount() {
    this.unsubPlugin?.();
    this.unsubLib?.();
    this.unsubPrefs?.();
  }

  // ─── HELPERS ──────────────────────────────────────────────
  private persistResponses(responses: AIResponse[]) {
    try { sessionStorage.setItem(LAST_RESPONSE_KEY, JSON.stringify(responses.filter(r => r.status !== "pending"))); } catch {}
  }

  private restoreLastResponses = () => {
    try {
      const s = sessionStorage.getItem(LAST_RESPONSE_KEY);
      if (s) this.setState({ responses: JSON.parse(s), hasStoredResponses: false });
    } catch {}
  };

  private clearStoredResponses = () => {
    try { sessionStorage.removeItem(LAST_RESPONSE_KEY); } catch {}
    this.setState({ hasStoredResponses: false });
  };

  private saveApiKey = (providerId: string, key: string) => {
    this.setState(prev => {
      const apiKeys = { ...prev.apiKeys, [providerId]: key.trim() };
      try { sessionStorage.setItem("mt_ai_keys", JSON.stringify(apiKeys)); } catch {}
      return { apiKeys, showKeyFor: null };
    });
  };

  private toggleProvider = (id: string) => {
    this.setState(prev => {
      const next = new Set(prev.selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { selectedIds: next };
    });
  };

  private makeFileName(providerName: string): string {
    const ts   = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const safe = providerName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `ai_tests_${safe}_${ts}.json`;
  }

  // ─── BUILD SUMMARY ────────────────────────────────────────
  private buildSummary(content: string, providerName: string): AIResponseSummary {
    let json: any[] | null = null;
    const trimmed = content.trim();
    if (trimmed.startsWith("[")) { try { json = JSON.parse(trimmed); } catch {} }
    if (!json) {
      const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fence) { try { json = JSON.parse(fence[1].trim()); } catch {} }
    }
    if (!json) {
      const arr = content.match(/\[[\s\S]*\]/);
      if (arr) { try { json = JSON.parse(arr[0]); } catch {} }
    }

    if (json && Array.isArray(json) && json.length > 0 && json[0] && typeof json[0] === "object") {
      const ctx   = getActiveContext();
      const items = json.slice(0, 30).map((item: any, idx: number) => ({
        index: idx + 1,
        name:  (item.testName || item.name || item.title || `Test ${idx + 1}`) as string,
        desc:  (item.businessDescription || item.description
          || (item.method && item.path ? `${item.method} ${item.path}` : "")) as string,
      }));
      const footer = [
        `\u{1F4A1} Banking context: ${ctx.name} \u00B7 ${pluginRegistry.getEnabled().length} active plugin${pluginRegistry.getEnabled().length !== 1 ? "s" : ""}`,
        `\u{1F4CB} ${json.length} test case${json.length !== 1 ? "s" : ""} ready to import`,
      ];
      return { mode: "tests", items, footer, textLines: [], count: json.length };
    }

    // Plain text — strip JSON blocks and fences
    const stripped = content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\[[\s\S]{20,}\]/g, "")
      .replace(/\{[\s\S]{20,}\}/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const textLines = stripped.split("\n").map((l: string) => l.trimEnd());
    return { mode: "text", items: [], footer: [], textLines, count: 0 };
  }

  // ─── BUILD PROMPT ─────────────────────────────────────────
  private buildPrompt(): string {
    const ctx      = getActiveContext();
    const { genMode, customPrompt, selectedCategory } = this.state;
    const { loadedSpecs } = this.props;
    const rules    = pluginRegistry.getAllRules();
    const runCount = aiPrefsStore.testRunCount;
    const catIds   = aiPrefsStore.selectedCategoryIds;

    let p = `You are an expert banking test automation assistant.\n\n`;
    p += `BANKING CONTEXT: ${ctx.name}\nDomain: ${ctx.description}\n`;
    p += `Active plugins: ${pluginRegistry.getEnabled().map(pl => pl.metadata.name).join(", ")}\n`;
    p += `Business rules loaded: ${rules.length}\nLoaded API specs: ${loadedSpecs.length}\n\n`;

    if (loadedSpecs.length > 0) {
      p += `LOADED APIs:\n`;
      for (const spec of loadedSpecs.slice(0, 10)) {
        p += `  - ${spec.title}  resource="${spec.resourceName}" (${spec.endpoints.map(e => `${e.method} ${e.path}`).join(", ")})\n`;
        const writable = spec.fields.filter(f => !f.readOnly).slice(0, 8);
        if (writable.length) p += `    Writable fields: ${writable.map(f => `${f.name}:${f.type}`).join(", ")}\n`;
      }
      p += `\n`;
    }

    if (catIds.size > 0) {
      const names = ctx.categories.filter(c => catIds.has(c.id)).map(c => c.name);
      p += `SELECTED CATEGORIES:\n${names.map(n => `  - ${n}`).join("\n")}\n\n`;
    }

    if (rules.length > 0) {
      p += `ACTIVE BUSINESS RULES:\n`;
      rules.slice(0, 15).forEach(r => { p += `  - [${r.severity.toUpperCase()}] ${r.name}: ${r.description}\n`; });
      p += `\n`;
    }

    switch (genMode) {
      case "generate-tests":
        p += `TASK: Generate exactly ${runCount} executable test cases as a JSON array.\n\n`;
        p += `REQUIRED OUTPUT FORMAT — return ONLY a raw JSON array, no markdown fences, no extra text:\n`;
        p += `[\n  {\n    "testName": "string",\n    "method": "POST|GET|PATCH|PUT|DELETE",\n    "path": "/resource-path",\n`;
        p += `    "resourceName": "resource",\n    "runGroup": 1,\n    "body": {},\n`;
        p += `    "expectedResult": "201 Created",\n    "businessDescription": "What this validates"\n  }\n]\n\n`;
        p += `CONSTRAINTS:\n- Use only paths/resources from LOADED APIs.\n`;
        p += `- runGroup: 1=POST, 2=GET/PATCH, 3=DELETE.\n- Generate EXACTLY ${runCount} test cases.\n`;
        p += `- Use realistic banking values (IBAN, CHF/EUR, etc.).\n`;
        if (selectedCategory) p += `- Focus on: ${selectedCategory}\n`;
        break;
      case "analyze-api":
        p += `TASK: Analyze the loaded APIs and identify missing coverage, edge cases, and integration scenarios.\n`;
        break;
      case "explain-rules":
        p += `TASK: Explain each active business rule — what it checks, when it triggers, business impact, example test scenarios.\n`;
        break;
      case "custom":
        p += `USER REQUEST:\n${customPrompt}\n`;
        break;
    }
    return p;
  }

  // ─── CALL PROVIDER ────────────────────────────────────────
  private callProvider = async (provider: AIProvider, prompt: string): Promise<string> => {
    const key = this.state.apiKeys[provider.id] || "";

    if (provider.id === "claude-cloud") {
      if (!key) throw new Error(
        "No API key configured for Anthropic Claude.\n" +
        "Click ✎ Set Key and enter your key (sk-ant-...).\n" +
        "Get one at: https://console.anthropic.com/settings/keys"
      );
      const headers: Record<string, string> = { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": key };
      const res = await fetch(provider.endpoint, {
        method: "POST", headers,
        body: JSON.stringify({ model: provider.model, max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) { const e: any = await res.json().catch(() => ({})); throw new Error(`Anthropic ${res.status}: ${e?.error?.message || res.statusText}`); }
      const d: any = await res.json();
      return d.content?.[0]?.text || "(empty response)";
    }

    if (["openai-cloud", "lmstudio-local", "custom-local"].includes(provider.id)) {
      if (provider.id === "openai-cloud" && !key) throw new Error(
        "No API key configured for OpenAI GPT.\n" +
        "Click ✎ Set Key and enter your key (sk-...).\n" +
        "Get one at: https://platform.openai.com/account/api-keys"
      );
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (key) headers["Authorization"] = `Bearer ${key}`;
      const res = await fetch(provider.endpoint, {
        method: "POST", headers,
        body: JSON.stringify({ model: provider.model, messages: [{ role: "user", content: prompt }], max_tokens: 4096 }),
      });
      if (!res.ok) { const e: any = await res.json().catch(() => ({})); throw new Error(`${provider.name} ${res.status}: ${e?.error?.message || res.statusText}`); }
      const d: any = await res.json();
      return d.choices?.[0]?.message?.content || "(empty response)";
    }

    if (provider.id === "ollama-local") {
      const res = await fetch(provider.endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: provider.model, prompt, stream: false }),
      });
      if (!res.ok) throw new Error(`Ollama ${res.status}: ${res.statusText}`);
      const d: any = await res.json();
      return d.response || "(empty response)";
    }

    throw new Error(`Unknown provider: ${provider.id}`);
  };

  // ─── SEND ─────────────────────────────────────────────────
  private handleSend = async () => {
    const { selectedIds, providers } = this.state;
    const selected = providers.filter(p => selectedIds.has(p.id));
    if (selected.length === 0) return;
    const prompt = this.buildPrompt();
    const startTimes: Record<string, number> = {};
    selected.forEach(p => { startTimes[p.id] = Date.now(); });
    const responses: AIResponse[] = selected.map(p => ({
      providerId: p.id, providerName: p.name, model: p.model,
      content: "", timestamp: new Date().toISOString(), elapsedMs: 0,
      status: "pending", jsonFileName: null, jsonSaved: false, summary: null,
    }));
    this.setState({ sending: true, responses, applyStatus: null });

    await Promise.allSettled(selected.map(async p => {
      try {
        const content      = await this.callProvider(p, prompt);
        const elapsedMs    = Date.now() - (startTimes[p.id] || Date.now());
        const jsonFileName = this.makeFileName(p.name);
        const summary      = this.buildSummary(content, p.name);
        this.setState(prev => {
          const next = prev.responses.map(r =>
            r.providerId === p.id ? { ...r, content, status: "done" as const, jsonFileName, summary, elapsedMs, model: p.model } : r
          );
          this.persistResponses(next);
          return { responses: next };
        });
      } catch (err: any) {
        this.setState(prev => {
          const next = prev.responses.map(r =>
            r.providerId === p.id ? { ...r, status: "error" as const, error: err.message, jsonFileName: null, jsonSaved: false, summary: null } : r
          );
          this.persistResponses(next);
          return { responses: next };
        });
      }
    }));
    this.setState({ sending: false });
  };

  // ─── DOWNLOAD JSON ────────────────────────────────────────
  private downloadJSON = (r: AIResponse) => {
    if (!r.content || r.status !== "done") return;
    let payload: any = null;
    const t = r.content.trim();
    if (t.startsWith("[")) { try { payload = JSON.parse(t); } catch {} }
    if (!payload) { const f = r.content.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) { try { payload = JSON.parse(f[1].trim()); } catch {} } }
    if (!payload) { const a = r.content.match(/\[[\s\S]*\]/); if (a) { try { payload = JSON.parse(a[0]); } catch {} } }
    const fileContent = payload ? JSON.stringify(payload, null, 2) : JSON.stringify({ raw: r.content, provider: r.providerName, timestamp: r.timestamp }, null, 2);
    const blob = new Blob([fileContent], { type: "application/json;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = r.jsonFileName || this.makeFileName(r.providerName);
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    this.setState(prev => {
      const next = prev.responses.map(rr => rr.providerId === r.providerId ? { ...rr, jsonSaved: true } : rr);
      this.persistResponses(next);
      return { responses: next };
    });
  };

  // ─── APPLY → READY FOR TEST ───────────────────────────────
  private handleApply = (content: string, providerName: string) => {
    let json: any[] | null = null;
    const t = content.trim();
    if (t.startsWith("[")) { try { json = JSON.parse(t); } catch {} }
    if (!json) { const f = content.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) { try { json = JSON.parse(f[1].trim()); } catch {} } }
    if (!json) { const a = content.match(/\[[\s\S]*\]/); if (a) { try { json = JSON.parse(a[0]); } catch {} } }
    if (!json || !Array.isArray(json) || json.length === 0) {
      this.setState({ applyStatus: "\u26A0 No valid JSON array found. Use \u201CGenerate Test Cases\u201D mode." });
      return;
    }
    const runGroup = testStore.cases.length > 0 ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1 : 1;
    let added = 0;
    for (const item of json) {
      if (!item || typeof item !== "object") continue;
      const method = ((item.method as string) || "GET").toUpperCase();
      const path   = (item.path as string) || "/";
      const resourceName = (item.resourceName as string) || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "") || "resource";
      testStore.add({
        apiTitle: (item.testName || item.name || item.title || `AI Test ${added + 1}`) as string,
        resourceName, method, path,
        body:     (item.body || item.parameters || null) as Record<string, any> | null,
        dataSource: "file", fileSource: `AI: ${providerName}`,
        runGroup:   typeof item.runGroup === "number" ? item.runGroup : runGroup,
      });
      added++;
    }
    for (const tc of testStore.cases) { if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path); }
    this.setState({ applyStatus: `\u2705 Applied ${added} test case${added !== 1 ? "s" : ""} from ${providerName} \u2192 Ready for Test tab` });
  };

  // ─── CSV / JSON IMPORT ────────────────────────────────────
  private parseCSVLine = (line: string): string[] => {
    const out: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur); return out;
  };

  private importFromCSV = (content: string, fileName: string): number => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return 0;
    const headers = this.parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
    const col = (row: string[], name: string) => { const idx = headers.indexOf(name); return idx >= 0 ? (row[idx] || "").replace(/^"|"$/g, "").trim() : ""; };
    const runGroup = testStore.cases.length > 0 ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1 : 1;
    let added = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i]);
      const method = (col(row, "method") || "GET").toUpperCase();
      const path   = col(row, "path");
      if (!path) continue;
      let body: Record<string, any> | null = null;
      const rawBody = col(row, "body");
      if (rawBody && rawBody !== "null" && rawBody !== '""') { try { body = JSON.parse(rawBody); } catch {} }
      testStore.add({
        apiTitle:     col(row, "apititle") || col(row, "api") || col(row, "name") || "Imported",
        resourceName: col(row, "resourcename") || col(row, "resource") || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "") || "resource",
        method, path, body, dataSource: "file", fileSource: fileName,
        runGroup: parseInt(col(row, "rungroup") || col(row, "run_group") || col(row, "run")) || runGroup,
      });
      added++;
    }
    for (const tc of testStore.cases) { if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path); }
    return added;
  };

  private importFromJSON = (content: string, fileName: string): number => {
    let json: any; try { json = JSON.parse(content); } catch { return 0; }
    const arr: any[] = Array.isArray(json) ? json : (json.testCases || json.cases || json.tests || [json]);
    if (!arr.length) return 0;
    const runGroup = testStore.cases.length > 0 ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1 : 1;
    let added = 0;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const method = ((item.method as string) || "GET").toUpperCase();
      const path   = (item.path as string) || "/";
      if (!path) continue;
      testStore.add({
        apiTitle:     (item.testName || item.name || item.apiTitle || "Imported") as string,
        resourceName: (item.resourceName || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "") || "resource") as string,
        method, path, body: (item.body || item.parameters || null) as Record<string, any> | null,
        dataSource: "file", fileSource: fileName,
        runGroup:   typeof item.runGroup === "number" ? item.runGroup : runGroup,
      });
      added++;
    }
    for (const tc of testStore.cases) { if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path); }
    return added;
  };

  private handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, type: "csv" | "json") => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const added   = type === "csv" ? this.importFromCSV(content, file.name) : this.importFromJSON(content, file.name);
      this.setState({ importStatus: added > 0 ? `\u2705 Imported ${added} test case${added !== 1 ? "s" : ""} from "${file.name}" \u2192 Ready for Test` : `\u26A0 No importable test cases in "${file.name}"` });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ─── RENDER ───────────────────────────────────────────────
  render() {
    const {
      providers, selectedIds, showProviderPanel,
      genMode, customPrompt, selectedCategory, responses, sending,
      pluginCount, testCaseCount, apiKeys, showKeyFor, applyStatus, importStatus,
      editEndpointFor, editEndpointVal, editModelFor, editModelVal,
      testRunCount, selectedCatIds, hasStoredResponses,
    } = this.state;
    const { loadedSpecs } = this.props;
    const ctx      = getActiveContext();
    const selected = providers.filter(p => selectedIds.has(p.id));

    return (
      <div className="ai-assistant">

        {/* Hidden file inputs */}
        <input ref={this.csvInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => this.handleFileImport(e, "csv")} />
        <input ref={this.jsonInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={e => this.handleFileImport(e, "json")} />

        {/* ── CONTEXT BANNER ── */}
        <div className="ai-ctx-banner">
          <div className="ai-ctx-banner__left">
            <span className="ai-ctx-banner__icon">{ctx.icon}</span>
            <div>
              <div className="ai-ctx-banner__title">{ctx.name}</div>
              <div className="ai-ctx-banner__sub">
                {pluginCount} plugins · {pluginRegistry.getAllRules().length} rules · {testCaseCount} tests · {loadedSpecs.length} APIs
                {selectedCatIds.size > 0 && <span style={{ marginLeft: 6, color: "#34d399" }}>· {selectedCatIds.size} categor{selectedCatIds.size === 1 ? "y" : "ies"} selected</span>}
              </div>
            </div>
          </div>
          <div className="ai-ctx-banner__badges">
            {selected.map(p => (
              <span key={p.id} className={`ai-provider-chip ai-provider-chip--${p.type}`}>
                {p.icon} {p.name}
                {apiKeys[p.id]
                  ? <span style={{ marginLeft: 4, color: "#34d399", fontSize: 9 }}>✓</span>
                  : p.type === "cloud" ? <span style={{ marginLeft: 4, color: "#f87171", fontSize: 9 }}>⚠ key</span>
                  : null}
              </span>
            ))}
            <button className="ai-btn-select-providers" onClick={() => this.setState(s => ({ showProviderPanel: !s.showProviderPanel }))}>
              {showProviderPanel ? "▴ Close" : "▾ Select Providers"} ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* ── RESTORE BANNER ── */}
        {hasStoredResponses && responses.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "#f59e0b10", borderBottom: "1px solid #f59e0b33", fontFamily: MONO, fontSize: 11 }}>
            <span style={{ color: "#f59e0b" }}>📋 Previous AI responses stored in this session.</span>
            <button onClick={this.restoreLastResponses} style={{ padding: "3px 12px", borderRadius: 6, cursor: "pointer", background: "#f59e0b20", border: "1px solid #f59e0b", color: "#f59e0b", fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>↩ Restore</button>
            <button onClick={this.clearStoredResponses} style={{ padding: "3px 10px", borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid #f8717133", color: "#f87171", fontFamily: MONO, fontSize: 10 }}>✕ Discard</button>
          </div>
        )}

        {/* ── PROVIDER PANEL ── */}
        {showProviderPanel && (
          <div className="ai-provider-panel">
            {(["cloud", "local"] as const).map(ptype => (
              <div key={ptype} className="ai-provider-panel__section">
                <div className="ai-provider-panel__heading">{ptype === "cloud" ? "☁️ Cloud AI Assistants" : "🖥️ Local AI Assistants"}</div>
                {providers.filter(p => p.type === ptype).map(p => {
                  const isShowKey = showKeyFor === p.id;
                  const isEditEp  = editEndpointFor === p.id;
                  const isEditMod = editModelFor === p.id;
                  const hasKey    = !!apiKeys[p.id];
                  return (
                    <div key={p.id}>
                      <label className={`ai-provider-row${selectedIds.has(p.id) ? " selected" : ""}`}>
                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => this.toggleProvider(p.id)} />
                        <div className="ai-provider-row__info" style={{ flex: 1, minWidth: 0 }}>
                          <span className="ai-provider-row__name">{p.icon} {p.name}</span>
                          <span className="ai-provider-row__desc">{p.description}</span>
                          {isEditEp
                            ? <InlineEdit value={editEndpointVal} onChange={(v: string) => this.setState({ editEndpointVal: v })}
                                onCommit={() => this.setState(prev => ({ providers: prev.providers.map(pp => pp.id === p.id ? { ...pp, endpoint: editEndpointVal } : pp), editEndpointFor: null }))}
                                onCancel={() => this.setState({ editEndpointFor: null })} width={280} />
                            : <span className="ai-provider-row__detail" onClick={() => this.setState({ editEndpointFor: p.id, editEndpointVal: p.endpoint })} style={{ cursor: "pointer", textDecoration: "underline dotted" }}>Endpoint: {p.endpoint}</span>
                          }
                          {isEditMod
                            ? <InlineEdit value={editModelVal} onChange={(v: string) => this.setState({ editModelVal: v })}
                                onCommit={() => this.setState(prev => ({ providers: prev.providers.map(pp => pp.id === p.id ? { ...pp, model: editModelVal } : pp), editModelFor: null }))}
                                onCancel={() => this.setState({ editModelFor: null })} width={180} />
                            : <span className="ai-provider-row__detail" onClick={() => this.setState({ editModelFor: p.id, editModelVal: p.model })} style={{ cursor: "pointer", textDecoration: "underline dotted" }}>Model: {p.model}</span>
                          }
                        </div>
                        {p.type === "cloud" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                            <span style={{
                              fontFamily: MONO, fontSize: 9, padding: "2px 7px", borderRadius: 4,
                              background: hasKey ? "#34d39915" : "#f8717115",
                              border: `1px solid ${hasKey ? "#34d39933" : "#f8717133"}`,
                              color: hasKey ? "#34d399" : "#f87171",
                            }}>
                              {hasKey ? "✓ Key set" : "⚠ No key"}
                            </span>
                            <button onClick={e => { e.preventDefault(); this.setState(prev => ({ showKeyFor: prev.showKeyFor === p.id ? null : p.id })); }} style={IBTN_S}>
                              {isShowKey ? "▲" : "✎ Set Key"}
                            </button>
                          </div>
                        )}
                      </label>
                      {isShowKey && (
                        <ApiKeyInput providerId={p.id} providerName={p.name} hint={p.apiKeyHint}
                          currentKey={apiKeys[p.id] || ""} onSave={this.saveApiKey}
                          onCancel={() => this.setState({ showKeyFor: null })} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── MAIN LAYOUT ── */}
        <div className="ai-main">

          {/* LEFT CONTROLS */}
          <div className="ai-controls">
            <div className="ai-section-title">Generation Mode</div>
            <div className="ai-mode-grid">
              {GEN_MODES.map(m => (
                <button key={m.id} className={`ai-mode-btn${genMode === m.id ? " active" : ""}`} onClick={() => this.setState({ genMode: m.id })}>
                  <span className="ai-mode-btn__icon">{m.icon}</span>
                  <span className="ai-mode-btn__label">{m.label}</span>
                  <span className="ai-mode-btn__desc">{m.desc}</span>
                </button>
              ))}
            </div>

            {genMode === "generate-tests" && (
              <div className="ai-field">
                <label className="ai-field__label">Target Category</label>
                <select className="ai-field__select" value={selectedCategory} onChange={e => this.setState({ selectedCategory: e.target.value })}>
                  <option value="">All Categories</option>
                  {ctx.categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            )}

            {genMode === "custom" && (
              <div className="ai-field">
                <label className="ai-field__label">Custom Prompt</label>
                <textarea className="ai-field__textarea" rows={6} value={customPrompt}
                  onChange={e => this.setState({ customPrompt: e.target.value })}
                  placeholder="Describe what you need. Banking context and API specs will be automatically included..." />
              </div>
            )}

            {/* Number of Test Runs */}
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)", marginTop: 8 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 8 }}>
                🔢 Number of Test Runs
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {[1, 3, 5, 10, 20].map(n => {
                  const active = testRunCount === n;
                  return (
                    <button key={n} onClick={() => aiPrefsStore.setRunCount(n)} style={{
                      padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                      background: active ? "var(--cs-accent)" : "var(--cs-surface-2)",
                      border: `1px solid ${active ? "var(--cs-accent)" : "var(--cs-border-sub)"}`,
                      color: active ? "#0a0e1a" : "var(--cs-muted)",
                      fontFamily: MONO, fontSize: 11, fontWeight: active ? 800 : 400,
                    }}>{n}</button>
                  );
                })}
                <input type="number" min={1} max={50} value={testRunCount}
                  onChange={e => aiPrefsStore.setRunCount(parseInt(e.target.value) || 1)}
                  style={{ width: 54, padding: "4px 8px", fontFamily: MONO, fontSize: 11, background: "var(--cs-bg)", border: "1px solid var(--cs-border)", borderRadius: 6, color: "var(--cs-text)", outline: "none", textAlign: "center" as const }} />
                <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)" }}>cases</span>
              </div>
            </div>

            {/* Context summary */}
            <div className="ai-context-summary">
              <div className="ai-context-summary__title">Context Injected into Prompt</div>
              <div className="ai-context-summary__item">🏦 Domain: {ctx.name}</div>
              <div className="ai-context-summary__item">🔌 Plugins: {pluginCount} active</div>
              <div className="ai-context-summary__item">📐 Rules: {pluginRegistry.getAllRules().length} business rules</div>
              <div className="ai-context-summary__item">📁 APIs: {loadedSpecs.length} spec{loadedSpecs.length !== 1 ? "s" : ""} loaded</div>
              <div className="ai-context-summary__item">📋 Library: {testCaseCount} existing test cases</div>
              {selectedCatIds.size > 0 && (
                <div className="ai-context-summary__item" style={{ color: "#34d399" }}>
                  🏷️ {selectedCatIds.size} categor{selectedCatIds.size === 1 ? "y" : "ies"} from Test Library
                </div>
              )}
            </div>

            <button className="ai-btn-send" onClick={this.handleSend} disabled={sending || selectedIds.size === 0}>
              {sending ? "⏳ Processing..." : `🚀 Send to ${selectedIds.size} Provider${selectedIds.size !== 1 ? "s" : ""} · ${testRunCount} tests`}
            </button>

            {/* Import */}
            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "var(--cs-dim)", letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 8 }}>📥 Import Test Cases</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => this.csvInputRef.current?.click()} style={{ flex: 1, padding: "8px 10px", borderRadius: 7, cursor: "pointer", background: "#60a5fa18", border: "1px solid #60a5fa44", color: "#60a5fa", fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>📄 Import CSV</button>
                <button onClick={() => this.jsonInputRef.current?.click()} style={{ flex: 1, padding: "8px 10px", borderRadius: 7, cursor: "pointer", background: "#f59e0b18", border: "1px solid #f59e0b44", color: "#f59e0b", fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>{"{ }"} Import JSON</button>
              </div>
              {importStatus && (
                <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, fontFamily: MONO, fontSize: 10, background: importStatus.startsWith("✅") ? "#34d39915" : "#f59e0b15", border: `1px solid ${importStatus.startsWith("✅") ? "#34d39933" : "#f59e0b33"}`, color: importStatus.startsWith("✅") ? "#34d399" : "#f59e0b" }}>{importStatus}</div>
              )}
            </div>
          </div>

          {/* RIGHT RESPONSES */}
          <div className="ai-responses">
            {applyStatus && (
              <div style={{ padding: "8px 14px", borderRadius: 8, marginBottom: 8, fontFamily: MONO, fontSize: 11, background: applyStatus.startsWith("✅") ? "#34d39915" : "#f59e0b15", border: `1px solid ${applyStatus.startsWith("✅") ? "#34d39933" : "#f59e0b33"}`, color: applyStatus.startsWith("✅") ? "#34d399" : "#f59e0b" }}>{applyStatus}</div>
            )}

            {responses.length === 0 && (
              <div className="ai-empty">
                <div className="ai-empty__icon">🤖</div>
                <div className="ai-empty__title">AI Assistant Ready</div>
                <div className="ai-empty__sub">
                  Configure API keys via <strong>▾ Select Providers</strong>.<br /><br />
                  Use <strong>"Generate Test Cases"</strong> mode → click <strong style={{ color: "#34d399" }}>Apply</strong> to push into Ready for Test.<br /><br />
                  Select categories in <strong>Test Library</strong> to focus AI output.
                </div>
              </div>
            )}

            {responses.map((r, i) => (
              <div key={i} className={`ai-response-card ai-response-card--${r.status}`}>

                {/* Card header */}
                <div className="ai-response-card__header" style={{ flexWrap: "wrap" as const, gap: 6 }}>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 1 }}>
                    <span className="ai-response-card__provider">{r.providerName}</span>
                    {r.status === "done" && r.summary?.mode === "tests" && (
                      <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>{r.summary.count} test case{r.summary.count !== 1 ? "s" : ""} generated</span>
                    )}
                  </div>
                  <span className="ai-response-card__time">{new Date(r.timestamp).toLocaleTimeString()}</span>
                  <span className={`ai-response-card__status ai-response-card__status--${r.status}`}>
                    {r.status === "pending" ? "⏳ Processing..." : r.status === "done" ? "✓ Complete" : "✗ Error"}
                  </span>

                  {/* JSON download badge */}
                  {r.status === "done" && r.jsonFileName && (
                    <span onClick={() => this.downloadJSON(r)} title="Click to download JSON" style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontFamily: MONO, fontSize: 9, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                      background: r.jsonSaved ? "#34d39915" : "#60a5fa15",
                      border: `1px solid ${r.jsonSaved ? "#34d39933" : "#60a5fa33"}`,
                      color: r.jsonSaved ? "#34d399" : "#60a5fa",
                    }}>
                      {r.jsonSaved ? "✓" : "⬇"} {r.jsonFileName}
                    </span>
                  )}
                  {r.status === "error" && (
                    <span style={{ fontFamily: MONO, fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "#f8717115", border: "1px solid #f8717133", color: "#f87171aa", fontStyle: "italic" }}>
                      no file — request failed
                    </span>
                  )}

                  {/* Apply button */}
                  {r.status === "done" && (
                    <button onClick={() => this.handleApply(r.content, r.providerName)} style={{
                      marginLeft: "auto", padding: "4px 14px", borderRadius: 6, cursor: "pointer",
                      background: "linear-gradient(135deg, #1a4a2a, #34d399)", border: "1.5px solid #34d399", color: "#0a1f15",
                      fontFamily: MONO, fontSize: 11, fontWeight: 800,
                      display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                    }}>
                      ✓ Apply → Ready for Test
                    </button>
                  )}
                </div>

                {/* Card body */}
                {r.status === "done" && r.summary && (
                  <AISummaryBody
                    summary={r.summary} jsonFileName={r.jsonFileName}
                    providerName={r.providerName} model={r.model || ""}
                    timestamp={r.timestamp} elapsedMs={r.elapsedMs || 0}
                  />
                )}
                {r.status === "pending" && (
                  <div className="ai-response-card__body">
                    <div className="ai-response-card__loading"><span className="ai-pulse" /> Waiting for {r.providerName}…</div>
                  </div>
                )}
                {r.status === "error" && (
                  <div className="ai-response-card__body">
                    <div style={{ padding: "12px 14px", borderRadius: 6, background: "#f8717115", border: "1px solid #f8717133", fontFamily: MONO, fontSize: 11, color: "#f87171" }}>
                      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12 }}>⚠ Request failed</div>
                      {(r.error || "Unknown error").split("\n").map((line: string, idx: number) => (
                        <div key={idx} style={{
                          opacity: idx === 0 ? 1 : 0.75,
                          marginBottom: 3,
                          paddingLeft: idx > 0 ? 10 : 0,
                          fontSize: idx === 0 ? 11 : 10,
                          borderLeft: idx > 0 ? "2px solid #f8717144" : "none",
                        }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
