import { ApiSpec } from "./utils";
import { BusinessRuleSuggestion, suggestBankingRulesFromSpecs } from "./BankingContext";

export type PluginSource = "built-in" | "folder";

export interface PromptBlueprint {
  id: string;
  name: string;
  objective: string;
  template: string;
}

export interface DomainPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  domain: string;
  source: PluginSource;
  enabledByDefault?: boolean;
  capabilities: string[];
  ruleSuggestions: BusinessRuleSuggestion[];
  promptBlueprints: PromptBlueprint[];
}

export interface FolderPluginLoadResult {
  plugins: DomainPlugin[];
  errors: string[];
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function createBuiltInBankingPlugins(specs: ApiSpec[]): DomainPlugin[] {
  const suggestedRules = suggestBankingRulesFromSpecs(specs);
  const paymentRules = suggestedRules.filter(r => r.category === "Payments & Transfers");
  const complianceRules = suggestedRules.filter(r => r.category === "Compliance & KYC");
  const reportingRules = suggestedRules.filter(r => r.category === "Reporting & Monitoring");

  return [
    {
      id: "banking-payments-heuristics",
      name: "Banking Payments Heuristics",
      version: "1.0.0",
      description: "Business-first validation rules and prompt blueprints for transfers, balances, and payment checks.",
      domain: "banking",
      source: "built-in",
      enabledByDefault: true,
      capabilities: ["payments", "transfers", "business-rules", "test-generation"],
      ruleSuggestions: paymentRules,
      promptBlueprints: [
        {
          id: "payments-request",
          name: "Payment Request Builder",
          objective: "Generate a business-readable request for payment and transfer scenarios.",
          template: "Use the Banking Context, the selected payment plugin rules, and the loaded API specifications to create a business-readable transfer test case with parameters, expected result, and validation checkpoints.",
        },
      ],
    },
    {
      id: "banking-compliance-controls",
      name: "Banking Compliance Controls",
      version: "1.0.0",
      description: "KYC, AML, risk, and activation gating rules suitable for banking client onboarding and lifecycle flows.",
      domain: "banking",
      source: "built-in",
      enabledByDefault: true,
      capabilities: ["kyc", "aml", "risk", "client-management"],
      ruleSuggestions: complianceRules,
      promptBlueprints: [
        {
          id: "compliance-request",
          name: "Compliance Scenario Builder",
          objective: "Generate a banking compliance scenario request.",
          template: "Using the Banking Context and selected compliance plugins, produce a business scenario that verifies KYC, AML, and risk gating before account activation or transaction approval.",
        },
      ],
    },
    {
      id: "banking-reporting-library",
      name: "Banking Reporting Library",
      version: "1.0.0",
      description: "Reusable report-oriented plugin for statements, monitoring flows, and audit-friendly exports.",
      domain: "banking",
      source: "built-in",
      capabilities: ["reporting", "monitoring", "audit", "documentation"],
      ruleSuggestions: reportingRules,
      promptBlueprints: [
        {
          id: "reporting-request",
          name: "Reporting Prompt Builder",
          objective: "Generate reporting and monitoring requests for AI assistants.",
          template: "Combine the Banking Context, reporting plugin rules, and API specifications to produce a business-readable monitoring or reporting request with parameter placeholders and expected outcomes.",
        },
      ],
    },
  ];
}

function normalizePlugin(raw: any, fallbackName: string): DomainPlugin {
  const name = String(raw?.name || fallbackName || "Custom Plugin");
  return {
    id: String(raw?.id || slug(name) || `plugin-${Date.now()}`),
    name,
    version: String(raw?.version || "1.0.0"),
    description: String(raw?.description || "Loaded from plugin folder"),
    domain: String(raw?.domain || "banking"),
    source: "folder",
    enabledByDefault: !!raw?.enabledByDefault,
    capabilities: Array.isArray(raw?.capabilities) ? raw.capabilities.map((x: any) => String(x)) : [],
    ruleSuggestions: Array.isArray(raw?.ruleSuggestions) ? raw.ruleSuggestions.map((r: any, index: number) => ({
      id: String(r?.id || `${slug(name)}-rule-${index + 1}`),
      name: String(r?.name || `Rule ${index + 1}`),
      category: String(r?.category || "Banking"),
      severity: r?.severity === "low" || r?.severity === "medium" || r?.severity === "high" ? r.severity : "medium",
      rationale: String(r?.rationale || "Folder plugin rule"),
      when: Array.isArray(r?.when) ? r.when.map((x: any) => String(x)) : [],
    })) : [],
    promptBlueprints: Array.isArray(raw?.promptBlueprints) ? raw.promptBlueprints.map((p: any, index: number) => ({
      id: String(p?.id || `${slug(name)}-prompt-${index + 1}`),
      name: String(p?.name || `Prompt ${index + 1}`),
      objective: String(p?.objective || "Folder plugin prompt"),
      template: String(p?.template || ""),
    })) : [],
  };
}

export async function loadPluginsFromFolder(): Promise<FolderPluginLoadResult> {
  const picker = (window as any).showDirectoryPicker;
  if (typeof picker !== "function") {
    return {
      plugins: [],
      errors: ["Directory picker is not supported in this browser. Use a Chromium-based browser to load plugins from a folder."],
    };
  }

  const plugins: DomainPlugin[] = [];
  const errors: string[] = [];

  try {
    const handle = await picker();
    for await (const entry of (handle as any).values()) {
      if (!entry || entry.kind !== "file") continue;
      if (!/\.(json)$/i.test(entry.name)) continue;
      try {
        const file = await entry.getFile();
        const text = await file.text();
        const raw = JSON.parse(text);
        plugins.push(normalizePlugin(raw, entry.name.replace(/\.json$/i, "")));
      } catch (err: any) {
        errors.push(`${entry.name}: ${err?.message || "Invalid plugin JSON"}`);
      }
    }
  } catch (err: any) {
    errors.push(err?.message || "Plugin folder selection cancelled");
  }

  return { plugins, errors };
}
