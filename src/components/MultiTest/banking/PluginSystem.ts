// ═══════════════════════════════════════════════════════════════
// PLUGIN SYSTEM
// ═══════════════════════════════════════════════════════════════
// Dynamic, modular plugin architecture for the MultiTest platform.
// Plugins encapsulate banking business rules, validators,
// data generators, and test case templates.
//
// The system supports:
//   - Built-in plugins (bundled with the app)
//   - External plugins (loaded from folder at runtime)
//   - Plugin enable/disable without restart
//   - Plugin dependency resolution
//   - Typed plugin metadata for frontend display
// ═══════════════════════════════════════════════════════════════

import type { BusinessRule, RuleResult, LibraryTestCase } from "./BankingContext";

// ─── PLUGIN INTERFACE ────────────────────────────────────────

export interface PluginMetadata {
  id:          string;
  name:        string;       // human-readable, shown in UI
  version:     string;
  icon:        string;
  description: string;
  author:      string;
  category:    string;       // maps to BusinessCategory.id
  tags:        string[];
  enabled:     boolean;
  builtIn:     boolean;      // false = loaded from external folder
  loadedAt:    string;       // ISO timestamp
}

export interface TestPlugin {
  metadata:    PluginMetadata;
  rules:       BusinessRule[];
  validators:  Record<string, (value: any) => { valid: boolean; message: string }>;
  generators:  Record<string, () => any>;
  testCases:   LibraryTestCase[];
  /** Called once when plugin is loaded */
  onLoad?:     () => void;
  /** Called when plugin is enabled */
  onEnable?:   () => void;
  /** Called when plugin is disabled */
  onDisable?:  () => void;
}

// ─── PLUGIN REGISTRY (singleton) ─────────────────────────────

export class PluginRegistry {
  private plugins: Map<string, TestPlugin> = new Map();
  private listeners: ((plugins: TestPlugin[]) => void)[] = [];

  /** Register a plugin */
  register(plugin: TestPlugin): void {
    const existing = this.plugins.get(plugin.metadata.id);
    if (existing) {
      console.warn(`[PluginRegistry] Replacing plugin: ${plugin.metadata.id}`);
    }
    plugin.metadata.loadedAt = new Date().toISOString();
    this.plugins.set(plugin.metadata.id, plugin);
    if (plugin.onLoad) plugin.onLoad();
    if (plugin.metadata.enabled && plugin.onEnable) plugin.onEnable();
    this._notify();
  }

  /** Unregister a plugin */
  unregister(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    if (plugin.onDisable) plugin.onDisable();
    this.plugins.delete(id);
    this._notify();
    return true;
  }

  /** Enable/disable a plugin */
  setEnabled(id: string, enabled: boolean): void {
    const p = this.plugins.get(id);
    if (!p) return;
    p.metadata.enabled = enabled;
    if (enabled && p.onEnable) p.onEnable();
    if (!enabled && p.onDisable) p.onDisable();
    this._notify();
  }

  /** Get all plugins */
  getAll(): TestPlugin[] {
    return [...this.plugins.values()];
  }

  /** Get only enabled plugins */
  getEnabled(): TestPlugin[] {
    return [...this.plugins.values()].filter(p => p.metadata.enabled);
  }

  /** Get plugins by category */
  getByCategory(categoryId: string): TestPlugin[] {
    return this.getEnabled().filter(p => p.metadata.category === categoryId);
  }

  /** Get a specific plugin */
  get(id: string): TestPlugin | undefined {
    return this.plugins.get(id);
  }

  /** Collect ALL active rules across enabled plugins */
  getAllRules(): BusinessRule[] {
    return this.getEnabled().flatMap(p => p.rules);
  }

  /** Collect ALL test cases across enabled plugins */
  getAllTestCases(): LibraryTestCase[] {
    return this.getEnabled().flatMap(p => p.testCases);
  }

  /** Evaluate all enabled rules against a data payload */
  evaluateAll(data: any): { pluginId: string; pluginName: string; results: RuleResult[] }[] {
    return this.getEnabled().map(p => ({
      pluginId:   p.metadata.id,
      pluginName: p.metadata.name,
      results:    p.rules.map(r => r.evaluate(data)),
    }));
  }

  /** Subscribe to plugin changes */
  subscribe(fn: (plugins: TestPlugin[]) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private _notify() {
    const all = this.getAll();
    this.listeners.forEach(fn => fn(all));
  }

  /** Load a plugin from a JSON definition (external file) */
  loadFromJSON(json: any): TestPlugin | null {
    try {
      if (!json?.metadata?.id || !json?.metadata?.name) {
        console.error("[PluginRegistry] Invalid plugin JSON: missing metadata.id or metadata.name");
        return null;
      }
      const plugin: TestPlugin = {
        metadata: {
          ...json.metadata,
          enabled:  json.metadata.enabled !== false,
          builtIn:  false,
          loadedAt: new Date().toISOString(),
        },
        rules:      (json.rules || []).map((r: any) => ({
          ...r,
          evaluate: new Function("data", r.evaluateBody || "return { passed: true, message: 'No evaluation', severity: 'info' };") as any,
        })),
        validators: {},
        generators: {},
        testCases:  json.testCases || [],
      };
      this.register(plugin);
      return plugin;
    } catch (e) {
      console.error("[PluginRegistry] Failed to load plugin from JSON:", e);
      return null;
    }
  }

  /** Get summary stats */
  get stats() {
    const all = this.getAll();
    const enabled = all.filter(p => p.metadata.enabled);
    return {
      total:     all.length,
      enabled:   enabled.length,
      rules:     enabled.reduce((n, p) => n + p.rules.length, 0),
      testCases: enabled.reduce((n, p) => n + p.testCases.length, 0),
      builtIn:   all.filter(p => p.metadata.builtIn).length,
      external:  all.filter(p => !p.metadata.builtIn).length,
    };
  }
}

/** Global singleton */
export const pluginRegistry = new PluginRegistry();
