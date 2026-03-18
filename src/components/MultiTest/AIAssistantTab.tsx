// ═══════════════════════════════════════════════════════════════
// AI ASSISTANT TAB  — v2
// Real API calls · API key management · Apply to Ready for Test
// CSV / JSON import → testStore
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { getActiveContext } from "./banking/BankingContext";
import { pluginRegistry } from "./banking/PluginSystem";
import { testLibraryStore } from "./banking/TestLibraryStore";
import { testStore, envStore } from "./utils";
import type { ApiSpec } from "./utils";
import "./mt-ai.scss";

// ─── AI PROVIDER DEFINITIONS ─────────────────────────────────

export interface AIProvider {
  id:          string;
  name:        string;
  icon:        string;
  type:        "cloud" | "local";
  description: string;
  endpoint:    string;
  model:       string;
  enabled:     boolean;
  apiKeyHint:  string;
  status:      "ready" | "connecting" | "error" | "unknown";
}

const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: "claude-cloud", name: "Anthropic Claude", icon: "☁️", type: "cloud",
    description: "Claude AI by Anthropic — advanced reasoning and code generation",
    endpoint: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514",
    enabled: true, apiKeyHint: "sk-ant-...", status: "ready",
  },
  {
    id: "openai-cloud", name: "OpenAI GPT", icon: "☁️", type: "cloud",
    description: "OpenAI GPT-4 — general-purpose AI assistant",
    endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o",
    enabled: false, apiKeyHint: "sk-...", status: "unknown",
  },
  {
    id: "ollama-local", name: "Ollama (Local)", icon: "🖥️", type: "local",
    description: "Ollama local inference — runs on your PC or server",
    endpoint: "http://localhost:11434/api/generate", model: "qwen2.5:14b",
    enabled: false, apiKeyHint: "(no key needed)", status: "unknown",
  },
  {
    id: "lmstudio-local", name: "LM Studio (Local)", icon: "🖥️", type: "local",
    description: "LM Studio local server — OpenAI-compatible endpoint on your machine",
    endpoint: "http://localhost:1234/v1/chat/completions", model: "local-model",
    enabled: false, apiKeyHint: "(no key needed)", status: "unknown",
  },
  {
    id: "custom-local", name: "Custom Local Server", icon: "🔧", type: "local",
    description: "Any OpenAI-compatible local inference server",
    endpoint: "http://localhost:8000/v1/chat/completions", model: "custom",
    enabled: false, apiKeyHint: "(optional)", status: "unknown",
  },
];

// ─── GENERATION MODE OPTIONS ─────────────────────────────────

type GenMode = "generate-tests" | "analyze-api" | "explain-rules" | "custom";

const GEN_MODES: { id: GenMode; label: string; icon: string; desc: string }[] = [
  { id: "generate-tests", label: "Generate Test Cases",    icon: "🧪", desc: "Use banking context and loaded APIs to generate business-oriented test cases" },
  { id: "analyze-api",    label: "Analyze API Specs",      icon: "🔍", desc: "Analyze loaded API specifications and suggest test coverage" },
  { id: "explain-rules",  label: "Explain Business Rules", icon: "📖", desc: "Explain active banking rules and their implications" },
  { id: "custom",         label: "Custom Prompt",          icon: "✏️", desc: "Write a free-form prompt with banking context injected" },
];

const MONO = "'JetBrains Mono','Fira Code',monospace";

// ─── COMPONENT STATE ─────────────────────────────────────────

interface AIResponse {
  providerId:   string;
  providerName: string;
  content:      string;
  timestamp:    string;
  status:       "pending" | "done" | "error";
  error?:       string;
}

interface AIAssistantState {
  providers:         AIProvider[];
  selectedIds:       Set<string>;
  showProviderPanel: boolean;
  genMode:           GenMode;
  customPrompt:      string;
  selectedCategory:  string;
  responses:         AIResponse[];
  sending:           boolean;
  pluginCount:       number;
  testCaseCount:     number;
  // NEW
  apiKeys:           Record<string, string>;
  showKeyFor:        string | null;
  applyStatus:       string | null;
  importStatus:      string | null;
  editEndpointFor:   string | null;
  editEndpointVal:   string;
  editModelFor:      string | null;
  editModelVal:      string;
}

interface AIAssistantProps {
  loadedSpecs: ApiSpec[];
}

export class AIAssistantTab extends React.Component<AIAssistantProps, AIAssistantState> {
  state: AIAssistantState = {
    providers:         DEFAULT_PROVIDERS.map(p => ({ ...p })),
    selectedIds:       new Set(["claude-cloud"]),
    showProviderPanel: false,
    genMode:           "generate-tests",
    customPrompt:      "",
    selectedCategory:  "",
    responses:         [],
    sending:           false,
    pluginCount:       pluginRegistry.getEnabled().length,
    testCaseCount:     testLibraryStore.stats.totalTests,
    apiKeys:           {},
    showKeyFor:        null,
    applyStatus:       null,
    importStatus:      null,
    editEndpointFor:   null,
    editEndpointVal:   "",
    editModelFor:      null,
    editModelVal:      "",
  };

  private unsubPlugin?: () => void;
  private unsubLib?: () => void;
  private csvInputRef = React.createRef<HTMLInputElement>();
  private jsonInputRef = React.createRef<HTMLInputElement>();

  componentDidMount() {
    this.unsubPlugin = pluginRegistry.subscribe(() =>
      this.setState({ pluginCount: pluginRegistry.getEnabled().length })
    );
    this.unsubLib = testLibraryStore.subscribe(() =>
      this.setState({ testCaseCount: testLibraryStore.stats.totalTests })
    );
    // Restore API keys from sessionStorage (not localStorage — keys clear on tab close)
    try {
      const saved = sessionStorage.getItem("mt_ai_keys");
      if (saved) this.setState({ apiKeys: JSON.parse(saved) });
    } catch {}
  }

  componentWillUnmount() {
    this.unsubPlugin?.();
    this.unsubLib?.();
  }

  // ─── PROVIDER TOGGLE ─────────────────────────────────────────
  private toggleProvider = (id: string) => {
    this.setState(prev => {
      const next = new Set(prev.selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { selectedIds: next };
    });
  };

  // ─── API KEY SAVE ─────────────────────────────────────────────
  private saveApiKey = (providerId: string, key: string) => {
    this.setState(prev => {
      const apiKeys = { ...prev.apiKeys, [providerId]: key.trim() };
      try { sessionStorage.setItem("mt_ai_keys", JSON.stringify(apiKeys)); } catch {}
      return { apiKeys, showKeyFor: null };
    });
  };

  // ─── BUILD PROMPT ─────────────────────────────────────────────
  private buildPrompt(): string {
    const ctx = getActiveContext();
    const { genMode, customPrompt, selectedCategory } = this.state;
    const { loadedSpecs } = this.props;
    const enabledPlugins = pluginRegistry.getEnabled();
    const rules = pluginRegistry.getAllRules();

    let p = `You are an expert banking test automation assistant.\n\n`;
    p += `BANKING CONTEXT: ${ctx.name}\nDomain: ${ctx.description}\n`;
    p += `Active plugins: ${enabledPlugins.map(pl => pl.metadata.name).join(", ")}\n`;
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

    if (rules.length > 0) {
      p += `ACTIVE BUSINESS RULES:\n`;
      rules.slice(0, 15).forEach(r => { p += `  - [${r.severity.toUpperCase()}] ${r.name}: ${r.description}\n`; });
      p += `\n`;
    }

    switch (genMode) {
      case "generate-tests":
        p += `TASK: Generate executable test cases as a JSON array for the ${selectedCategory || "banking"} domain.\n\n`;
        p += `REQUIRED OUTPUT FORMAT — return ONLY a raw JSON array, no markdown fences, no explanations:\n`;
        p += `[\n  {\n    "testName": "string",\n    "method": "POST|GET|PATCH|PUT|DELETE",\n    "path": "/resource-path",\n`;
        p += `    "resourceName": "resource",\n    "runGroup": 1,\n    "body": { ...fields... },\n`;
        p += `    "expectedResult": "201 Created",\n    "businessDescription": "What this validates"\n  }\n]\n\n`;
        p += `CONSTRAINTS:\n- Use only paths and resources from the LOADED APIs section above.\n`;
        p += `- runGroup: 1=POST(create), 2=GET/PATCH, 3=DELETE.\n`;
        p += `- Generate 5-10 test cases covering happy path + edge cases.\n`;
        p += `- Use realistic banking values (IBAN, amounts, CHF/EUR currencies, etc.).\n`;
        if (selectedCategory) p += `- Focus on category: ${selectedCategory}\n`;
        break;
      case "analyze-api":
        p += `TASK: Analyze the loaded API specifications and identify:\n- Missing test coverage areas\n`;
        p += `- Edge cases and boundary conditions\n- Business rule violations to test\n- Integration scenarios\n`;
        break;
      case "explain-rules":
        p += `TASK: Explain the active banking business rules in plain language:\n`;
        p += `- What each rule checks\n- When it triggers\n- Business impact\n- Example test scenarios\n`;
        break;
      case "custom":
        p += `USER REQUEST:\n${customPrompt}\n`;
        break;
    }

    return p;
  }

  // ─── REAL API CALL DISPATCH ───────────────────────────────────
  private callProvider = async (provider: AIProvider, prompt: string): Promise<string> => {
    const key = this.state.apiKeys[provider.id] || "";

    // ── Anthropic Claude ──
    if (provider.id === "claude-cloud") {
      if (!key) throw new Error("API key required — click ✎ Set Key in the provider panel");
      const res = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        const err: any = await res.json().catch(() => ({}));
        throw new Error(`Anthropic ${res.status}: ${err?.error?.message || res.statusText}`);
      }
      const data: any = await res.json();
      return data.content?.[0]?.text || "(empty response)";
    }

    // ── OpenAI / LM Studio / Custom (OpenAI-compatible) ──
    if (["openai-cloud", "lmstudio-local", "custom-local"].includes(provider.id)) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (key) headers["Authorization"] = `Bearer ${key}`;
      const res = await fetch(provider.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096,
        }),
      });
      if (!res.ok) {
        const err: any = await res.json().catch(() => ({}));
        throw new Error(`${provider.name} ${res.status}: ${err?.error?.message || res.statusText}`);
      }
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || "(empty response)";
    }

    // ── Ollama ──
    if (provider.id === "ollama-local") {
      const res = await fetch(provider.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: provider.model, prompt, stream: false }),
      });
      if (!res.ok) throw new Error(`Ollama ${res.status}: ${res.statusText}`);
      const data: any = await res.json();
      return data.response || "(empty response)";
    }

    throw new Error(`Unknown provider: ${provider.id}`);
  };

  // ─── SEND ─────────────────────────────────────────────────────
  private handleSend = async () => {
    const { selectedIds, providers } = this.state;
    const selected = providers.filter(p => selectedIds.has(p.id));
    if (selected.length === 0) return;

    const prompt = this.buildPrompt();
    const responses: AIResponse[] = selected.map(p => ({
      providerId: p.id, providerName: p.name,
      content: "", timestamp: new Date().toISOString(), status: "pending",
    }));

    this.setState({ sending: true, responses, applyStatus: null });

    await Promise.allSettled(selected.map(async (p) => {
      try {
        const content = await this.callProvider(p, prompt);
        this.setState(prev => ({
          responses: prev.responses.map(r =>
            r.providerId === p.id ? { ...r, content, status: "done" } : r
          ),
        }));
      } catch (err: any) {
        this.setState(prev => ({
          responses: prev.responses.map(r =>
            r.providerId === p.id ? { ...r, status: "error", error: err.message } : r
          ),
        }));
      }
    }));

    this.setState({ sending: false });
  };

  // ─── APPLY RESPONSE → READY FOR TEST ─────────────────────────
  private handleApply = (content: string, providerName: string) => {
    let json: any[] | null = null;

    // Try direct parse
    const trimmed = content.trim();
    if (trimmed.startsWith("[")) {
      try { json = JSON.parse(trimmed); } catch {}
    }
    // Strip markdown fences
    if (!json) {
      const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fence) { try { json = JSON.parse(fence[1].trim()); } catch {} }
    }
    // Extract first array found anywhere in the text
    if (!json) {
      const arr = content.match(/\[[\s\S]*\]/);
      if (arr) { try { json = JSON.parse(arr[0]); } catch {} }
    }

    if (!json || !Array.isArray(json) || json.length === 0) {
      this.setState({
        applyStatus: "⚠ No valid JSON test case array found. Use \u201CGenerate Test Cases\u201D mode to get importable output.",
      });
      return;
    }

    const runGroup = testStore.cases.length > 0
      ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1
      : 1;

    let added = 0;
    for (const item of json) {
      if (!item || typeof item !== "object") continue;
      const method = ((item.method as string) || "GET").toUpperCase();
      const path   = (item.path as string) || "/";
      const resourceName = (item.resourceName as string)
        || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "")
        || "resource";

      testStore.add({
        apiTitle:     (item.testName || item.name || item.title || `AI Test ${added + 1}`) as string,
        resourceName,
        method,
        path,
        body:         (item.body || item.parameters || null) as Record<string, any> | null,
        dataSource:   "file",
        fileSource:   `AI: ${providerName}`,
        runGroup:     typeof item.runGroup === "number" ? item.runGroup : runGroup,
      });
      added++;
    }

    // Resolve URLs for new cases
    for (const tc of testStore.cases) {
      if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path);
    }

    this.setState({
      applyStatus: `✅ Applied ${added} test case${added !== 1 ? "s" : ""} from ${providerName} → Ready for Test tab`,
    });
  };

  // ─── CSV / JSON FILE IMPORT ───────────────────────────────────
  private parseCSVLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };

  private importFromCSV = (content: string, fileName: string): number => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return 0;

    const rawH = this.parseCSVLine(lines[0]);
    const headers = rawH.map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());

    const col = (row: string[], name: string): string => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? (row[idx] || "").replace(/^"|"$/g, "").trim() : "";
    };

    const runGroup = testStore.cases.length > 0
      ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1 : 1;

    let added = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i]);
      const method = (col(row, "method") || "GET").toUpperCase();
      const path   = col(row, "path");
      if (!path) continue;

      let body: Record<string, any> | null = null;
      const rawBody = col(row, "body");
      if (rawBody && rawBody !== "null" && rawBody !== '""') {
        try { body = JSON.parse(rawBody); } catch {}
      }

      const rg = parseInt(col(row, "rungroup") || col(row, "run_group") || col(row, "run")) || runGroup;

      testStore.add({
        apiTitle:     col(row, "apititle") || col(row, "api") || col(row, "name") || "Imported",
        resourceName: col(row, "resourcename") || col(row, "resource")
          || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "") || "resource",
        method, path, body,
        dataSource: "file",
        fileSource: fileName,
        runGroup:   rg,
      });
      added++;
    }

    for (const tc of testStore.cases) {
      if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path);
    }
    return added;
  };

  private importFromJSON = (content: string, fileName: string): number => {
    let json: any;
    try { json = JSON.parse(content); } catch { return 0; }

    const arr: any[] = Array.isArray(json)
      ? json
      : (json.testCases || json.cases || json.tests || (typeof json === "object" ? [json] : []));

    if (!arr.length) return 0;

    const runGroup = testStore.cases.length > 0
      ? Math.max(...testStore.cases.map(c => c.runGroup)) + 1 : 1;

    let added = 0;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const method = ((item.method as string) || "GET").toUpperCase();
      const path   = (item.path as string) || "/";
      if (!path) continue;

      testStore.add({
        apiTitle:     (item.testName || item.name || item.apiTitle || item.title || "Imported") as string,
        resourceName: (item.resourceName
          || path.replace(/^\//, "").split("/")[0].replace(/[{}]/g, "")
          || "resource") as string,
        method, path,
        body:       (item.body || item.parameters || null) as Record<string, any> | null,
        dataSource: "file",
        fileSource: fileName,
        runGroup:   typeof item.runGroup === "number" ? item.runGroup : runGroup,
      });
      added++;
    }

    for (const tc of testStore.cases) {
      if (!tc.resolvedUrl) tc.resolvedUrl = envStore.resolve(tc.path);
    }
    return added;
  };

  private handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, type: "csv" | "json") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const added = type === "csv"
        ? this.importFromCSV(content, file.name)
        : this.importFromJSON(content, file.name);
      this.setState({
        importStatus: added > 0
          ? `✅ Imported ${added} test case${added !== 1 ? "s" : ""} from "${file.name}" → Ready for Test tab`
          : `⚠ No importable test cases found in "${file.name}". Verify format.`,
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ─── RENDER ───────────────────────────────────────────────────
  render() {
    const {
      providers, selectedIds, showProviderPanel,
      genMode, customPrompt, selectedCategory,
      responses, sending, pluginCount, testCaseCount,
      apiKeys, showKeyFor, applyStatus, importStatus,
      editEndpointFor, editEndpointVal, editModelFor, editModelVal,
    } = this.state;
    const { loadedSpecs } = this.props;
    const ctx = getActiveContext();
    const categories = ctx.categories;
    const selected = providers.filter(p => selectedIds.has(p.id));

    return (
      <div className="ai-assistant">

        {/* Hidden file inputs */}
        <input ref={this.csvInputRef} type="file" accept=".csv" style={{ display: "none" }}
          onChange={e => this.handleFileImport(e, "csv")} />
        <input ref={this.jsonInputRef} type="file" accept=".json" style={{ display: "none" }}
          onChange={e => this.handleFileImport(e, "json")} />

        {/* ── CONTEXT BANNER ── */}
        <div className="ai-ctx-banner">
          <div className="ai-ctx-banner__left">
            <span className="ai-ctx-banner__icon">{ctx.icon}</span>
            <div>
              <div className="ai-ctx-banner__title">{ctx.name}</div>
              <div className="ai-ctx-banner__sub">
                {pluginCount} plugins · {pluginRegistry.getAllRules().length} rules · {testCaseCount} test cases · {loadedSpecs.length} APIs loaded
              </div>
            </div>
          </div>
          <div className="ai-ctx-banner__badges">
            {selected.map(p => (
              <span key={p.id} className={`ai-provider-chip ai-provider-chip--${p.type}`}>
                {p.icon} {p.name}
                {apiKeys[p.id]
                  ? <span style={{ marginLeft: 4, color: "#34d399", fontSize: 9 }}>✓</span>
                  : p.type === "cloud"
                    ? <span style={{ marginLeft: 4, color: "#f87171", fontSize: 9 }}>⚠ key</span>
                    : null}
              </span>
            ))}
            <button className="ai-btn-select-providers"
              onClick={() => this.setState(s => ({ showProviderPanel: !s.showProviderPanel }))}>
              {showProviderPanel ? "▴ Close" : "▾ Select Providers"} ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* ── PROVIDER SELECTOR PANEL ── */}
        {showProviderPanel && (
          <div className="ai-provider-panel">
            {(["cloud", "local"] as const).map(ptype => (
              <div key={ptype} className="ai-provider-panel__section">
                <div className="ai-provider-panel__heading">
                  {ptype === "cloud" ? "☁️ Cloud AI Assistants" : "🖥️ Local AI Assistants (Personal Infrastructure)"}
                </div>
                {providers.filter(p => p.type === ptype).map(p => {
                  const isShowKey  = showKeyFor === p.id;
                  const isEditEp   = editEndpointFor === p.id;
                  const isEditMod  = editModelFor === p.id;
                  const hasKey     = !!apiKeys[p.id];

                  return (
                    <div key={p.id}>
                      <label className={`ai-provider-row${selectedIds.has(p.id) ? " selected" : ""}`}>
                        <input type="checkbox" checked={selectedIds.has(p.id)}
                          onChange={() => this.toggleProvider(p.id)} />
                        <div className="ai-provider-row__info" style={{ flex: 1, minWidth: 0 }}>
                          <span className="ai-provider-row__name">{p.icon} {p.name}</span>
                          <span className="ai-provider-row__desc">{p.description}</span>
                          {/* Endpoint editable */}
                          {isEditEp ? (
                            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 3 }}>
                              <input value={editEndpointVal} autoFocus
                                onChange={e => this.setState({ editEndpointVal: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === "Enter") this.setState(prev => ({ providers: prev.providers.map(pp => pp.id === p.id ? { ...pp, endpoint: editEndpointVal } : pp), editEndpointFor: null }));
                                  if (e.key === "Escape") this.setState({ editEndpointFor: null });
                                  e.stopPropagation();
                                }}
                                style={{ flex: 1, fontFamily: MONO, fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "var(--cs-bg)", border: "1px solid var(--cs-accent)", color: "var(--cs-text)", outline: "none" }}
                              />
                              <button onClick={() => this.setState(prev => ({ providers: prev.providers.map(pp => pp.id === p.id ? { ...pp, endpoint: editEndpointVal } : pp), editEndpointFor: null }))}
                                style={{ ...IBTN, color: "#34d399", borderColor: "#34d39944" }}>✓</button>
                              <button onClick={() => this.setState({ editEndpointFor: null })} style={IBTN}>✕</button>
                            </div>
                          ) : (
                            <span className="ai-provider-row__detail"
                              onClick={() => this.setState({ editEndpointFor: p.id, editEndpointVal: p.endpoint })}
                              style={{ cursor: "pointer", textDecoration: "underline dotted" }}
                              title="Click to edit endpoint">
                              Endpoint: {p.endpoint}
                            </span>
                          )}
                          {/* Model editable */}
                          {isEditMod ? (
                            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 3 }}>
                              <input value={editModelVal} autoFocus
                                onChange={e => this.setState({ editModelVal: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === "Enter") this.setState(prev => ({ providers: prev.providers.map(pp => pp.id === p.id ? { ...pp, model: editModelVal } : pp), editModelFor: null }));
                                  if (e.key === "Escape") this.setState({ editModelFor: null });
                                  e.stopPropagation();
                                }}
                                style={{ width: 180, fontFamily: MONO, fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "var(--cs-bg)", border: "1px solid var(--cs-accent)", color: "var(--cs-text)", outline: "none" }}
                              />
                              <button onClick={() => this.setState(prev => ({ providers: prev.providers.map(pp => pp.id === p.id ? { ...pp, model: editModelVal } : pp), editModelFor: null }))}
                                style={{ ...IBTN, color: "#34d399", borderColor: "#34d39944" }}>✓</button>
                              <button onClick={() => this.setState({ editModelFor: null })} style={IBTN}>✕</button>
                            </div>
                          ) : (
                            <span className="ai-provider-row__detail"
                              onClick={() => this.setState({ editModelFor: p.id, editModelVal: p.model })}
                              style={{ cursor: "pointer", textDecoration: "underline dotted" }}
                              title="Click to edit model">
                              Model: {p.model}
                            </span>
                          )}
                        </div>
                        {/* API key badge for cloud providers */}
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
                            <button
                              onClick={e => { e.preventDefault(); this.setState(prev => ({ showKeyFor: prev.showKeyFor === p.id ? null : p.id })); }}
                              style={{ ...IBTN, color: "#60a5fa", borderColor: "#60a5fa44" }}
                            >
                              {isShowKey ? "▲" : "✎ Set Key"}
                            </button>
                          </div>
                        )}
                      </label>

                      {/* Inline API key editor */}
                      {isShowKey && (
                        <ApiKeyInput
                          providerId={p.id} providerName={p.name} hint={p.apiKeyHint}
                          currentKey={apiKeys[p.id] || ""}
                          onSave={this.saveApiKey}
                          onCancel={() => this.setState({ showKeyFor: null })}
                        />
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

          {/* LEFT: Controls */}
          <div className="ai-controls">
            <div className="ai-section-title">Generation Mode</div>
            <div className="ai-mode-grid">
              {GEN_MODES.map(m => (
                <button key={m.id}
                  className={`ai-mode-btn${genMode === m.id ? " active" : ""}`}
                  onClick={() => this.setState({ genMode: m.id })}>
                  <span className="ai-mode-btn__icon">{m.icon}</span>
                  <span className="ai-mode-btn__label">{m.label}</span>
                  <span className="ai-mode-btn__desc">{m.desc}</span>
                </button>
              ))}
            </div>

            {genMode === "generate-tests" && (
              <div className="ai-field">
                <label className="ai-field__label">Target Category</label>
                <select className="ai-field__select" value={selectedCategory}
                  onChange={e => this.setState({ selectedCategory: e.target.value })}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
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

            {/* Context summary */}
            <div className="ai-context-summary">
              <div className="ai-context-summary__title">Context Injected into Prompt</div>
              <div className="ai-context-summary__item">🏦 Domain: {ctx.name}</div>
              <div className="ai-context-summary__item">🔌 Plugins: {pluginCount} active</div>
              <div className="ai-context-summary__item">📐 Rules: {pluginRegistry.getAllRules().length} business rules</div>
              <div className="ai-context-summary__item">📁 APIs: {loadedSpecs.length} spec{loadedSpecs.length !== 1 ? "s" : ""} loaded</div>
              <div className="ai-context-summary__item">📋 Library: {testCaseCount} existing test cases</div>
            </div>

            <button className="ai-btn-send" onClick={this.handleSend}
              disabled={sending || selectedIds.size === 0}>
              {sending ? "⏳ Processing..." : `🚀 Send to ${selectedIds.size} Provider${selectedIds.size !== 1 ? "s" : ""}`}
            </button>

            {/* ── IMPORT SECTION ── */}
            <div style={{
              marginTop: 14, padding: "12px 14px", borderRadius: 10,
              background: "var(--cs-surface-2)", border: "1px solid var(--cs-border)",
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 700,
                color: "var(--cs-dim)", letterSpacing: 0.8,
                textTransform: "uppercase" as const, marginBottom: 8,
              }}>
                📥 Import Test Cases Directly
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-muted)", marginBottom: 10, lineHeight: 1.6 }}>
                Import from CSV (app export format) or JSON into the Ready for Test tab without AI.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => this.csvInputRef.current?.click()} style={{
                  flex: 1, padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                  background: "#60a5fa18", border: "1px solid #60a5fa44",
                  color: "#60a5fa", fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  📄 Import CSV
                </button>
                <button onClick={() => this.jsonInputRef.current?.click()} style={{
                  flex: 1, padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                  background: "#f59e0b18", border: "1px solid #f59e0b44",
                  color: "#f59e0b", fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  {"{ }"} Import JSON
                </button>
              </div>
              {importStatus && (
                <div style={{
                  marginTop: 8, padding: "6px 10px", borderRadius: 6,
                  fontFamily: MONO, fontSize: 10,
                  background: importStatus.startsWith("✅") ? "#34d39915" : "#f59e0b15",
                  border: `1px solid ${importStatus.startsWith("✅") ? "#34d39933" : "#f59e0b33"}`,
                  color: importStatus.startsWith("✅") ? "#34d399" : "#f59e0b",
                }}>
                  {importStatus}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Responses */}
          <div className="ai-responses">
            {/* Apply status */}
            {applyStatus && (
              <div style={{
                padding: "8px 14px", borderRadius: 8, marginBottom: 8,
                fontFamily: MONO, fontSize: 11,
                background: applyStatus.startsWith("✅") ? "#34d39915" : "#f59e0b15",
                border: `1px solid ${applyStatus.startsWith("✅") ? "#34d39933" : "#f59e0b33"}`,
                color: applyStatus.startsWith("✅") ? "#34d399" : "#f59e0b",
              }}>
                {applyStatus}
              </div>
            )}

            {responses.length === 0 && (
              <div className="ai-empty">
                <div className="ai-empty__icon">🤖</div>
                <div className="ai-empty__title">AI Assistant Ready</div>
                <div className="ai-empty__sub">
                  Configure API keys via <strong>▾ Select Providers</strong>, then choose a generation mode and click Send.<br /><br />
                  Use <strong>"Generate Test Cases"</strong> to get a JSON array you can apply directly to the Ready for Test tab via the <strong style={{ color: "#34d399" }}>Apply</strong> button on each response.
                </div>
              </div>
            )}

            {responses.map((r, i) => (
              <div key={i} className={`ai-response-card ai-response-card--${r.status}`}>
                <div className="ai-response-card__header">
                  <span className="ai-response-card__provider">{r.providerName}</span>
                  <span className="ai-response-card__time">{new Date(r.timestamp).toLocaleTimeString()}</span>
                  <span className={`ai-response-card__status ai-response-card__status--${r.status}`}>
                    {r.status === "pending" ? "⏳ Processing..." : r.status === "done" ? "✓ Complete" : "✗ Error"}
                  </span>
                  {r.status === "done" && (
                    <button
                      onClick={() => this.handleApply(r.content, r.providerName)}
                      title="Parse JSON test cases from this response and add to Ready for Test tab"
                      style={{
                        marginLeft: "auto", padding: "4px 14px", borderRadius: 6, cursor: "pointer",
                        background: "linear-gradient(135deg, #1a4a2a, #34d399)",
                        border: "1.5px solid #34d399", color: "#0a1f15",
                        fontFamily: MONO, fontSize: 11, fontWeight: 800,
                        display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                      }}
                    >
                      ✓ Apply → Ready for Test
                    </button>
                  )}
                </div>

                {r.status === "done" && (
                  <div className="ai-response-card__body">
                    <pre className="ai-response-card__content">{r.content}</pre>
                  </div>
                )}
                {r.status === "pending" && (
                  <div className="ai-response-card__body">
                    <div className="ai-response-card__loading">
                      <span className="ai-pulse" /> Waiting for {r.providerName}…
                    </div>
                  </div>
                )}
                {r.status === "error" && (
                  <div className="ai-response-card__body">
                    <div style={{
                      padding: "10px 12px", borderRadius: 6,
                      background: "#f8717115", border: "1px solid #f8717133",
                      fontFamily: MONO, fontSize: 11, color: "#f87171",
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Request failed</div>
                      <div style={{ opacity: 0.85 }}>{r.error || "Unknown error"}</div>
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

// ─── INLINE BUTTON STYLE ─────────────────────────────────────
const IBTN: React.CSSProperties = {
  fontFamily: MONO, fontSize: 9, padding: "2px 8px", borderRadius: 4,
  cursor: "pointer", background: "transparent",
  border: "1px solid var(--cs-border)", color: "var(--cs-dim)",
};

// ─── API KEY INPUT SUB-COMPONENT ─────────────────────────────

interface ApiKeyInputProps {
  providerId:   string;
  providerName: string;
  hint:         string;
  currentKey:   string;
  onSave:       (id: string, key: string) => void;
  onCancel:     () => void;
}

class ApiKeyInput extends React.Component<ApiKeyInputProps, { value: string; show: boolean }> {
  state = { value: this.props.currentKey, show: false };

  render() {
    const { providerId, providerName, hint, onSave, onCancel } = this.props;
    const { value, show } = this.state;
    return (
      <div style={{
        padding: "10px 14px 12px", background: "#60a5fa08",
        border: "1px solid #60a5fa22", borderTop: "none",
        borderRadius: "0 0 8px 8px",
      }}>
        <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#60a5fa", letterSpacing: 0.8, marginBottom: 8 }}>
          🔑 API KEY — {providerName}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type={show ? "text" : "password"}
            value={value}
            placeholder={hint}
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
          <button onClick={() => this.setState(s => ({ show: !s.show }))} title="Toggle visibility"
            style={{ ...IBTN, padding: "6px 10px", fontSize: 14 }}>
            {show ? "🙈" : "👁"}
          </button>
          <button
            onClick={() => onSave(providerId, value)}
            disabled={!value.trim()}
            style={{
              padding: "7px 16px", borderRadius: 6, fontFamily: MONO, fontSize: 11, fontWeight: 700,
              cursor: value.trim() ? "pointer" : "not-allowed",
              background: value.trim() ? "#34d39920" : "transparent",
              border: `1px solid ${value.trim() ? "#34d399" : "var(--cs-border)"}`,
              color: value.trim() ? "#34d399" : "var(--cs-dim)",
            }}
          >
            ✓ Save
          </button>
          <button onClick={onCancel} style={{ ...IBTN, padding: "7px 12px", fontSize: 11 }}>✕</button>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", marginTop: 6, lineHeight: 1.5 }}>
          Stored in session only — cleared when tab closes. Sent only to {providerName}'s endpoint.
        </div>
      </div>
    );
  }
}
