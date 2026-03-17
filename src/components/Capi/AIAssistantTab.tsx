import React from "react";
import { ApiSpec } from "./utils";
import { DEFAULT_BANKING_CONTEXT, createExampleImportShape, suggestBankingRulesFromSpecs } from "./BankingContext";
import { createBuiltInBankingPlugins, DomainPlugin, loadPluginsFromFolder } from "./pluginSystem";

interface AIAssistantTabProps {
  loadedSpecs: ApiSpec[];
}

interface ProviderOption {
  id: string;
  name: string;
  location: "cloud" | "local";
  description: string;
}

interface AIAssistantTabState {
  providers: ProviderOption[];
  selectedProviderIds: string[];
  plugins: DomainPlugin[];
  selectedPluginIds: string[];
  pluginErrors: string[];
  requestGoal: string;
  generatedRequest: string;
}

const PROVIDERS: ProviderOption[] = [
  { id: "openai-cloud", name: "OpenAI (Cloud)", location: "cloud", description: "Managed cloud AI assistant" },
  { id: "azure-openai", name: "Azure OpenAI (Cloud)", location: "cloud", description: "Enterprise cloud deployment" },
  { id: "anthropic-cloud", name: "Anthropic Claude (Cloud)", location: "cloud", description: "Cloud assistant for analysis" },
  { id: "ollama-local", name: "Ollama (Local)", location: "local", description: "Runs on local PC or server" },
  { id: "llama-cpp-local", name: "llama.cpp (Local)", location: "local", description: "Self-hosted local model runtime" },
  { id: "custom-server-local", name: "Custom AI Server (Local)", location: "local", description: "Private inference server" },
];

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export class AIAssistantTab extends React.Component<AIAssistantTabProps, AIAssistantTabState> {
  constructor(props: AIAssistantTabProps) {
    super(props);
    const plugins = createBuiltInBankingPlugins(props.loadedSpecs);
    this.state = {
      providers: PROVIDERS,
      selectedProviderIds: ["openai-cloud", "ollama-local"],
      plugins,
      selectedPluginIds: plugins.filter(p => p.enabledByDefault).map(p => p.id),
      pluginErrors: [],
      requestGoal: "Generate business-readable banking requests and reusable test cases from the loaded specifications.",
      generatedRequest: "",
    };
  }

  componentDidUpdate(prevProps: AIAssistantTabProps) {
    if (prevProps.loadedSpecs !== this.props.loadedSpecs) {
      const builtIns = createBuiltInBankingPlugins(this.props.loadedSpecs);
      this.setState(s => {
        const folderPlugins = s.plugins.filter(p => p.source === "folder");
        const nextPlugins = [...builtIns, ...folderPlugins];
        const validIds = new Set(nextPlugins.map(p => p.id));
        const selectedPluginIds = s.selectedPluginIds.filter(id => validIds.has(id));
        const fallbackSelected = selectedPluginIds.length > 0
          ? selectedPluginIds
          : builtIns.filter(p => p.enabledByDefault).map(p => p.id);
        return { plugins: nextPlugins, selectedPluginIds: fallbackSelected };
      });
    }
  }

  private onMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>, key: "selectedProviderIds" | "selectedPluginIds") => {
    const values = Array.from(e.target.selectedOptions).map(o => o.value);
    this.setState({ [key]: values } as Pick<AIAssistantTabState, any>);
  };

  private async loadPlugins() {
    const result = await loadPluginsFromFolder();
    this.setState(s => {
      const builtIns = createBuiltInBankingPlugins(this.props.loadedSpecs);
      const nextPlugins = [...builtIns, ...result.plugins];
      const selectedPluginIds = unique([
        ...s.selectedPluginIds.filter(id => nextPlugins.some(p => p.id === id)),
        ...result.plugins.map(p => p.id),
      ]);
      return {
        plugins: nextPlugins,
        selectedPluginIds,
        pluginErrors: result.errors,
      };
    });
  }

  private generateRequest = () => {
    const { loadedSpecs } = this.props;
    const { providers, selectedProviderIds, plugins, selectedPluginIds, requestGoal } = this.state;
    const selectedProviders = providers.filter(p => selectedProviderIds.includes(p.id));
    const selectedPlugins = plugins.filter(p => selectedPluginIds.includes(p.id));
    const ruleLines = selectedPlugins.flatMap(p => p.ruleSuggestions).slice(0, 8);
    const topSpecs = loadedSpecs.slice(0, 10).map(s => `- ${s.title} [${s.resourceName || s.fileName}]`).join("\n") || "- No API specifications loaded yet";
    const sampleBlueprints = selectedPlugins.flatMap(p => p.promptBlueprints).slice(0, 3);
    const exampleImport = createExampleImportShape();

    const text = [
      `Goal: ${requestGoal}`,
      "",
      `Business context: ${DEFAULT_BANKING_CONTEXT.displayName} (${DEFAULT_BANKING_CONTEXT.bankName})`,
      `Priorities: ${DEFAULT_BANKING_CONTEXT.priorities.join(" | ")}`,
      `Selected AI assistants: ${selectedProviders.map(p => `${p.name} - ${p.location}`).join(", ") || "None selected"}`,
      `Selected plugins: ${selectedPlugins.map(p => p.name).join(", ") || "None selected"}`,
      "",
      "Use the following loaded API specifications:",
      topSpecs,
      "",
      "Apply these banking heuristics and business rules:",
      ...(ruleLines.length > 0 ? ruleLines.map(r => `- [${r.category}] ${r.name}: ${r.rationale}`) : ["- No plugin rules selected"]),
      "",
      "Expected output:",
      "- Business-readable workflow",
      "- Parameterised input placeholders only",
      "- Expected result",
      "- Documentation/tutorial notes",
      "- Import-ready JSON shape for the internal test library",
      "",
      "Reference import schema example:",
      JSON.stringify(exampleImport, null, 2),
      "",
      ...(sampleBlueprints.length > 0
        ? [
            "Prompt blueprints to consider:",
            ...sampleBlueprints.map(p => `- ${p.name}: ${p.template}`),
            "",
          ]
        : []),
      "Generate the response in business language, not raw API language.",
    ].join("\n");

    this.setState({ generatedRequest: text });
  };

  render() {
    const { loadedSpecs } = this.props;
    const { providers, selectedProviderIds, plugins, selectedPluginIds, pluginErrors, requestGoal, generatedRequest } = this.state;
    const selectedPlugins = plugins.filter(p => selectedPluginIds.includes(p.id));
    const suggestedRules = suggestBankingRulesFromSpecs(loadedSpecs);

    return (
      <div style={{ display: "grid", gap: 18, padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
          <section style={cardStyle}>
            <div style={titleRowStyle}>
              <div>
                <div style={eyebrowStyle}>BANKING CONTEXT</div>
                <h3 style={h3Style}>Dedicated banking domain layer</h3>
              </div>
              <span style={badgeStyle}>{DEFAULT_BANKING_CONTEXT.categories.length} categories</span>
            </div>
            <div style={{ color: "var(--cs-muted)", fontSize: 13, lineHeight: 1.6 }}>
              The banking context groups business taxonomy, reusable heuristics, and future client-domain separation.
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {DEFAULT_BANKING_CONTEXT.categories.slice(0, 6).map(cat => (
                <div key={cat.name} style={miniCardStyle}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{cat.name}</div>
                  <div style={{ color: "var(--cs-dim)", fontSize: 12, marginTop: 6 }}>{cat.subcategories.slice(0, 3).join(" · ")}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={titleRowStyle}>
              <div>
                <div style={eyebrowStyle}>AI ASSISTANTS</div>
                <h3 style={h3Style}>Cloud and local provider selection</h3>
              </div>
              <span style={badgeStyle}>{selectedProviderIds.length} selected</span>
            </div>
            <label style={labelStyle}>Select one or more AI assistants</label>
            <select multiple value={selectedProviderIds} onChange={e => this.onMultiSelect(e, "selectedProviderIds")} style={selectStyle}>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name} · {p.location}</option>
              ))}
            </select>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {providers.filter(p => selectedProviderIds.includes(p.id)).map(p => (
                <div key={p.id} style={pillRowStyle}>
                  <strong>{p.name}</strong>
                  <span style={{ color: "var(--cs-dim)" }}>{p.description}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 18 }}>
          <section style={cardStyle}>
            <div style={titleRowStyle}>
              <div>
                <div style={eyebrowStyle}>PLUGINS</div>
                <h3 style={h3Style}>Named JavaScript plugin packs</h3>
              </div>
              <button onClick={() => this.loadPlugins()} style={buttonStyle}>Load plugins from folder</button>
            </div>
            <label style={labelStyle}>Select one or more plugins</label>
            <select multiple value={selectedPluginIds} onChange={e => this.onMultiSelect(e, "selectedPluginIds")} style={selectStyle}>
              {plugins.map(p => (
                <option key={p.id} value={p.id}>{p.name} · {p.source}</option>
              ))}
            </select>
            {pluginErrors.length > 0 && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#7f1d1d22", border: "1px solid #7f1d1d55", color: "#fecaca", fontSize: 12 }}>
                {pluginErrors.map((err, idx) => <div key={idx}>• {err}</div>)}
              </div>
            )}
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {selectedPlugins.map(plugin => (
                <div key={plugin.id} style={miniCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{plugin.name}</strong>
                    <span style={{ color: "var(--cs-dim)", fontSize: 12 }}>{plugin.source}</span>
                  </div>
                  <div style={{ marginTop: 6, color: "var(--cs-muted)", fontSize: 12 }}>{plugin.description}</div>
                  <div style={{ marginTop: 8, color: "var(--cs-dim)", fontSize: 12 }}>Capabilities: {plugin.capabilities.join(", ") || "n/a"}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={titleRowStyle}>
              <div>
                <div style={eyebrowStyle}>REQUEST BUILDER</div>
                <h3 style={h3Style}>Generate AI-ready banking requests</h3>
              </div>
              <span style={badgeStyle}>{loadedSpecs.length} specs</span>
            </div>
            <label style={labelStyle}>Request goal</label>
            <textarea value={requestGoal} onChange={e => this.setState({ requestGoal: e.target.value })} style={textareaStyle} rows={4} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={this.generateRequest} style={buttonStyle}>Build request</button>
              <button onClick={() => this.setState({ generatedRequest: "" })} style={ghostButtonStyle}>Clear</button>
            </div>
            <div style={{ marginTop: 14, color: "var(--cs-dim)", fontSize: 12 }}>
              Suggested banking rules discovered from the loaded specs: {suggestedRules.length}
            </div>
            <textarea value={generatedRequest} readOnly style={{ ...textareaStyle, marginTop: 12, minHeight: 340, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }} />
          </section>
        </div>
      </div>
    );
  }
}

const cardStyle: React.CSSProperties = {
  background: "var(--cs-panel)",
  border: "1px solid var(--cs-border)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 8px 28px rgba(0,0,0,.10)",
};

const miniCardStyle: React.CSSProperties = {
  background: "var(--cs-panel-2)",
  border: "1px solid var(--cs-border)",
  borderRadius: 14,
  padding: 12,
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.2,
  color: "var(--cs-dim)",
  marginBottom: 6,
};

const h3Style: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  color: "var(--cs-text)",
};

const badgeStyle: React.CSSProperties = {
  background: "var(--cs-chip)",
  border: "1px solid var(--cs-border)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  color: "var(--cs-muted)",
  whiteSpace: "nowrap",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: "var(--cs-muted)",
  fontSize: 13,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 140,
  background: "var(--cs-panel-2)",
  color: "var(--cs-text)",
  border: "1px solid var(--cs-border)",
  borderRadius: 12,
  padding: 10,
  fontSize: 13,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--cs-panel-2)",
  color: "var(--cs-text)",
  border: "1px solid var(--cs-border)",
  borderRadius: 12,
  padding: 12,
  fontSize: 13,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const ghostButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "var(--cs-muted)",
  border: "1px solid var(--cs-border)",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const pillRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  border: "1px solid var(--cs-border)",
  borderRadius: 999,
  padding: "8px 12px",
  background: "var(--cs-panel-2)",
};
