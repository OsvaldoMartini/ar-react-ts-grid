// ═══════════════════════════════════════════════════════════════
// AI ASSISTANT TAB
// ═══════════════════════════════════════════════════════════════
// Provides a multi-provider AI assistant interface where users
// can select one or more AI providers (cloud + local), compose
// requests using the banking context and loaded plugins, and
// process responses within the application.
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { getActiveContext } from "./banking/BankingContext";
import { pluginRegistry } from "./banking/PluginSystem";
import { testLibraryStore } from "./banking/TestLibraryStore";
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

// ─── COMPONENT STATE ─────────────────────────────────────────

interface AIAssistantState {
  providers:        AIProvider[];
  selectedIds:      Set<string>;
  showProviderPanel:boolean;
  genMode:          GenMode;
  customPrompt:     string;
  selectedCategory: string;
  responses:        { providerId: string; providerName: string; content: string; timestamp: string; status: "pending" | "done" | "error" }[];
  sending:          boolean;
  pluginCount:      number;
  testCaseCount:    number;
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
  };

  private unsubPlugin?: () => void;
  private unsubLib?: () => void;

  componentDidMount() {
    this.unsubPlugin = pluginRegistry.subscribe(() =>
      this.setState({ pluginCount: pluginRegistry.getEnabled().length })
    );
    this.unsubLib = testLibraryStore.subscribe(() =>
      this.setState({ testCaseCount: testLibraryStore.stats.totalTests })
    );
  }

  componentWillUnmount() {
    this.unsubPlugin?.();
    this.unsubLib?.();
  }

  // ─── PROVIDER TOGGLE ────────────────────────────────────────
  private toggleProvider = (id: string) => {
    this.setState(prev => {
      const next = new Set(prev.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    });
  };

  // ─── BUILD CONTEXT PROMPT ───────────────────────────────────
  private buildPrompt(): string {
    const ctx = getActiveContext();
    const { genMode, customPrompt, selectedCategory } = this.state;
    const { loadedSpecs } = this.props;
    const enabledPlugins = pluginRegistry.getEnabled();
    const rules = pluginRegistry.getAllRules();

    // Banking context header
    let prompt = `You are an expert banking test automation assistant.\n\n`;
    prompt += `BANKING CONTEXT: ${ctx.name}\n`;
    prompt += `Domain: ${ctx.description}\n`;
    prompt += `Active plugins: ${enabledPlugins.map(p => p.metadata.name).join(", ")}\n`;
    prompt += `Business rules loaded: ${rules.length}\n`;
    prompt += `Loaded API specs: ${loadedSpecs.length}\n\n`;

    // API spec summaries
    if (loadedSpecs.length > 0) {
      prompt += `LOADED APIs:\n`;
      for (const spec of loadedSpecs.slice(0, 10)) {
        prompt += `  - ${spec.title} (${spec.endpoints.length} endpoints: ${spec.endpoints.map(e => `${e.method} ${e.path}`).join(", ")})\n`;
        if (spec.fields.length > 0) {
          prompt += `    Fields: ${spec.fields.slice(0, 8).map(f => `${f.name}:${f.type}`).join(", ")}\n`;
        }
      }
      prompt += `\n`;
    }

    // Active rules summary
    if (rules.length > 0) {
      prompt += `ACTIVE BUSINESS RULES:\n`;
      for (const r of rules.slice(0, 15)) {
        prompt += `  - [${r.severity.toUpperCase()}] ${r.name}: ${r.description}\n`;
      }
      prompt += `\n`;
    }

    // Mode-specific instructions
    switch (genMode) {
      case "generate-tests":
        prompt += `TASK: Generate business-oriented test cases for the ${selectedCategory || "banking"} domain.\n`;
        prompt += `CONSTRAINTS:\n`;
        prompt += `- Describe flows in business terms, not technical API language.\n`;
        prompt += `- Each test must include: category, subcategory, testName, businessDescription, steps, parameters, expectedResult, documentation.\n`;
        prompt += `- Use parameter placeholders like \${CLIENT_ID}, \${AMOUNT}, etc.\n`;
        prompt += `- Output as a valid JSON array matching the import schema.\n`;
        if (selectedCategory) prompt += `- Focus on category: ${selectedCategory}\n`;
        break;
      case "analyze-api":
        prompt += `TASK: Analyze the loaded API specifications and suggest:\n`;
        prompt += `- Missing test coverage areas\n`;
        prompt += `- Edge cases and boundary conditions\n`;
        prompt += `- Business rule violations to test\n`;
        prompt += `- Integration test scenarios between APIs\n`;
        break;
      case "explain-rules":
        prompt += `TASK: Explain the active banking business rules in plain language:\n`;
        prompt += `- What each rule checks\n`;
        prompt += `- When it would trigger\n`;
        prompt += `- What the business impact is\n`;
        prompt += `- Example test scenarios for each rule\n`;
        break;
      case "custom":
        prompt += `USER REQUEST:\n${customPrompt}\n`;
        break;
    }

    return prompt;
  }

  // ─── SEND TO PROVIDERS ──────────────────────────────────────
  private handleSend = () => {
    const { selectedIds, providers } = this.state;
    const selected = providers.filter(p => selectedIds.has(p.id));
    if (selected.length === 0) return;

    const prompt = this.buildPrompt();
    const responses = selected.map(p => ({
      providerId: p.id, providerName: p.name,
      content: "", timestamp: new Date().toISOString(), status: "pending" as const,
    }));

    this.setState({ sending: true, responses });

    // Simulate responses (in real app, these would be actual API calls)
    for (let i = 0; i < selected.length; i++) {
      const p = selected[i];
      setTimeout(() => {
        this.setState(prev => {
          const rs = [...prev.responses];
          const idx = rs.findIndex(r => r.providerId === p.id);
          if (idx >= 0) {
            rs[idx] = {
              ...rs[idx],
              content: this.generateSimulatedResponse(p, prev.genMode),
              status: "done",
            };
          }
          const allDone = rs.every(r => r.status !== "pending");
          return { responses: rs, sending: !allDone };
        });
      }, 1500 + i * 800 + Math.random() * 1000);
    }
  };

  private generateSimulatedResponse(provider: AIProvider, mode: GenMode): string {
    const ctx = getActiveContext();
    switch (mode) {
      case "generate-tests":
        return `[${provider.name}] Generated 5 test cases for ${this.state.selectedCategory || "banking domain"}:\n\n` +
          `1. "Verify client onboarding with KYC" — Tests the complete onboarding flow including PEP screening\n` +
          `2. "Transfer between CHF accounts" — Validates internal transfer with balance updates\n` +
          `3. "Reject over-limit payment" — Tests payment limit enforcement\n` +
          `4. "Monthly interest accrual" — Validates batch interest calculation\n` +
          `5. "KYC renewal for expiring documents" — Tests document renewal workflow\n\n` +
          `💡 These test cases use the banking context from ${ctx.name} with ${pluginRegistry.getEnabled().length} active plugins.\n` +
          `📋 Import-ready JSON format available via the export function.`;
      case "analyze-api":
        return `[${provider.name}] API Analysis Report:\n\n` +
          `Coverage gaps identified:\n` +
          `• No negative test for DELETE operations\n` +
          `• Missing concurrent modification test (bdeRecVersion conflicts)\n` +
          `• No pagination boundary tests for list endpoints\n` +
          `• Missing validation tests for required fields\n\n` +
          `Recommended additional tests: 12`;
      case "explain-rules":
        const rules = pluginRegistry.getAllRules().slice(0, 5);
        return `[${provider.name}] Business Rules Explained:\n\n` +
          rules.map((r, i) => `${i + 1}. **${r.name}** (${r.severity})\n   ${r.description}\n   Condition: ${r.condition}\n   Action: ${r.action}`).join("\n\n");
      default:
        return `[${provider.name}] Response to custom query.\nProcessed using ${ctx.name} context with ${pluginRegistry.getAllRules().length} active rules.`;
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────
  render() {
    const {
      providers, selectedIds, showProviderPanel,
      genMode, customPrompt, selectedCategory,
      responses, sending, pluginCount, testCaseCount,
    } = this.state;
    const { loadedSpecs } = this.props;
    const ctx = getActiveContext();
    const categories = ctx.categories;
    const selected = providers.filter(p => selectedIds.has(p.id));

    return (
      <div className="ai-assistant">
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
              </span>
            ))}
            <button className="ai-btn-select-providers" onClick={() => this.setState(s => ({ showProviderPanel: !s.showProviderPanel }))}>
              {showProviderPanel ? "▴ Close" : "▾ Select Providers"} ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* ── PROVIDER SELECTOR PANEL ── */}
        {showProviderPanel && (
          <div className="ai-provider-panel">
            <div className="ai-provider-panel__section">
              <div className="ai-provider-panel__heading">☁️ Cloud AI Assistants</div>
              {providers.filter(p => p.type === "cloud").map(p => (
                <label key={p.id} className={`ai-provider-row${selectedIds.has(p.id) ? " selected" : ""}`}>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => this.toggleProvider(p.id)} />
                  <div className="ai-provider-row__info">
                    <span className="ai-provider-row__name">{p.icon} {p.name}</span>
                    <span className="ai-provider-row__desc">{p.description}</span>
                    <span className="ai-provider-row__detail">Model: {p.model} · Endpoint: {p.endpoint}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="ai-provider-panel__section">
              <div className="ai-provider-panel__heading">🖥️ Local AI Assistants (Personal Infrastructure)</div>
              {providers.filter(p => p.type === "local").map(p => (
                <label key={p.id} className={`ai-provider-row${selectedIds.has(p.id) ? " selected" : ""}`}>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => this.toggleProvider(p.id)} />
                  <div className="ai-provider-row__info">
                    <span className="ai-provider-row__name">{p.icon} {p.name}</span>
                    <span className="ai-provider-row__desc">{p.description}</span>
                    <span className="ai-provider-row__detail">Model: {p.model} · Endpoint: {p.endpoint}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN LAYOUT: LEFT = CONTROLS, RIGHT = RESPONSES ── */}
        <div className="ai-main">
          {/* LEFT: Generation Controls */}
          <div className="ai-controls">
            <div className="ai-section-title">Generation Mode</div>
            <div className="ai-mode-grid">
              {GEN_MODES.map(m => (
                <button
                  key={m.id}
                  className={`ai-mode-btn${genMode === m.id ? " active" : ""}`}
                  onClick={() => this.setState({ genMode: m.id })}
                >
                  <span className="ai-mode-btn__icon">{m.icon}</span>
                  <span className="ai-mode-btn__label">{m.label}</span>
                  <span className="ai-mode-btn__desc">{m.desc}</span>
                </button>
              ))}
            </div>

            {genMode === "generate-tests" && (
              <div className="ai-field">
                <label className="ai-field__label">Target Category</label>
                <select
                  className="ai-field__select"
                  value={selectedCategory}
                  onChange={e => this.setState({ selectedCategory: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {genMode === "custom" && (
              <div className="ai-field">
                <label className="ai-field__label">Custom Prompt</label>
                <textarea
                  className="ai-field__textarea"
                  rows={6}
                  value={customPrompt}
                  onChange={e => this.setState({ customPrompt: e.target.value })}
                  placeholder="Describe what you need. Banking context and API specs will be automatically included..."
                />
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

            <button
              className="ai-btn-send"
              onClick={this.handleSend}
              disabled={sending || selectedIds.size === 0}
            >
              {sending ? "⏳ Processing..." : `🚀 Send to ${selectedIds.size} Provider${selectedIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>

          {/* RIGHT: Responses */}
          <div className="ai-responses">
            {responses.length === 0 && (
              <div className="ai-empty">
                <div className="ai-empty__icon">🤖</div>
                <div className="ai-empty__title">AI Assistant Ready</div>
                <div className="ai-empty__sub">
                  Select providers, choose a generation mode, and click Send.
                  The banking context, loaded API specs, and active business rules
                  will be automatically included in the prompt.
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
                </div>
                {r.status === "done" && (
                  <div className="ai-response-card__body">
                    <pre className="ai-response-card__content">{r.content}</pre>
                  </div>
                )}
                {r.status === "pending" && (
                  <div className="ai-response-card__body">
                    <div className="ai-response-card__loading">
                      <span className="ai-pulse" /> Generating response...
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
