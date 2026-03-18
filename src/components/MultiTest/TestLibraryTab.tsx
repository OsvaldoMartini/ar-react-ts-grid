// ═══════════════════════════════════════════════════════════════
// TEST LIBRARY TAB
// ═══════════════════════════════════════════════════════════════
// Dashboard for browsing, searching, importing, and managing
// the business-oriented test case library (1000+ tests).
// Integrates with the plugin system and banking context.
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { BANKING_CATEGORIES, type LibraryTestCase, type BusinessCategory } from "./banking/BankingContext";
import { pluginRegistry } from "./banking/PluginSystem";
import { testLibraryStore } from "./banking/TestLibraryStore";
import { schemaMatchingEngine, type MatchResult } from "./banking/SchemaMatchingEngine";
import { db } from "./utils";
import { aiPrefsStore } from "./AIPrefsStore";
import { mtT as t } from "./useMtT";
import "./mt-library.scss";

// ─── COMPONENT STATE ─────────────────────────────────────────

interface LibraryState {
  view: "dashboard" | "category" | "detail" | "plugins";
  search: string;
  selectedCategory: string;
  selectedSubcat: string;
  selectedTest: LibraryTestCase | null;
  filteredTests: LibraryTestCase[];
  categoryStats: { category: string; subcategories: number; tests: number; icon: string; color: string }[];
  pluginStates: { id: string; name: string; icon: string; enabled: boolean; rules: number; tests: number; category: string }[];
  totalTests: number;
  importing: boolean;
  generating: boolean;
  lastMatchResults: MatchResult[];
  generatedCount: number;
  aiSelectedCatIds: Set<string>;
  showAICategories: boolean;
}

export class TestLibraryTab extends React.Component<{}, LibraryState> {
  state: LibraryState = {
    view: "dashboard",
    search: "",
    selectedCategory: "",
    selectedSubcat: "",
    selectedTest: null,
    filteredTests: [],
    categoryStats: testLibraryStore.getCategoryStats(),
    pluginStates: this.getPluginStates(),
    totalTests: testLibraryStore.stats.totalTests,
    importing: false,
    generating: false,
    lastMatchResults: [],
    generatedCount: testLibraryStore.generated.length,
    aiSelectedCatIds: new Set(aiPrefsStore.selectedCategoryIds),
    showAICategories: false,
  };

  private unsubPlugin?: () => void;
  private unsubLib?: () => void;
  private unsubPrefs?: () => void;
  private fileInput = React.createRef<HTMLInputElement>();
  private folderInput = React.createRef<HTMLInputElement>();
  private pluginFileInput = React.createRef<HTMLInputElement>();

  componentDidMount() {
    this.unsubPlugin = pluginRegistry.subscribe(() => this.refreshStats());
    this.unsubLib = testLibraryStore.subscribe(() => this.refreshStats());
    this.unsubPrefs = aiPrefsStore.subscribe(() =>
      this.setState({ aiSelectedCatIds: new Set(aiPrefsStore.selectedCategoryIds) })
    );
  }
  componentWillUnmount() {
    this.unsubPlugin?.();
    this.unsubLib?.();
    this.unsubPrefs?.();
  }

  private getPluginStates() {
    return pluginRegistry.getAll().map(p => ({
      id: p.metadata.id, name: p.metadata.name, icon: p.metadata.icon,
      enabled: p.metadata.enabled, rules: p.rules.length,
      tests: p.testCases.length, category: p.metadata.category,
    }));
  }

  private refreshStats() {
    this.setState({
      categoryStats: testLibraryStore.getCategoryStats(),
      pluginStates: this.getPluginStates(),
      totalTests: testLibraryStore.stats.totalTests,
      generatedCount: testLibraryStore.generated.length,
    });
  }

  // ─── SCHEMA MATCHING ─────────────────────────────────────────
  private handleGenerateFromSchemas = () => {
    const specs = db.specs;
    if (specs.length === 0) {
      alert(t("library.noApisLoaded"));
      return;
    }
    this.setState({ generating: true });
    // Process asynchronously to not block UI
    setTimeout(() => {
      try {
        const { matches, tests } = schemaMatchingEngine.processSpecs(specs);
        // Clear previous generated tests and add new ones
        testLibraryStore.clearGenerated();
        const count = testLibraryStore.addGenerated(tests);
        this.refreshStats();
        this.setState({
          generating: false,
          lastMatchResults: matches,
        });
        alert(`Generated ${count} test case${count !== 1 ? "s" : ""} from ${matches.length} banking context match${matches.length !== 1 ? "es" : ""} across ${specs.length} API spec${specs.length !== 1 ? "s" : ""}.`);
      } catch (err) {
        this.setState({ generating: false });
        alert(t("library.generateError"));
        console.error("[SchemaMatchingEngine]", err);
      }
    }, 100);
  };

  // ─── SEARCH ─────────────────────────────────────────────────
  private handleSearch = (q: string) => {
    this.setState({ search: q });
    if (q.trim()) {
      const results = testLibraryStore.filter({ search: q });
      this.setState({ filteredTests: results, view: q.trim() ? "category" : "dashboard", selectedCategory: "", selectedSubcat: "" });
    } else {
      this.setState({ view: "dashboard", filteredTests: [] });
    }
  };

  // ─── CATEGORY CLICK ─────────────────────────────────────────
  private openCategory = (catName: string) => {
    const tests = testLibraryStore.filter({ category: catName });
    this.setState({ view: "category", selectedCategory: catName, selectedSubcat: "", filteredTests: tests, search: "" });
  };

  private openSubcat = (catName: string, subName: string) => {
    const tests = testLibraryStore.filter({ category: catName, subcategory: subName });
    this.setState({ view: "category", selectedCategory: catName, selectedSubcat: subName, filteredTests: tests });
  };

  private openTest = (test: LibraryTestCase) => {
    this.setState({ view: "detail", selectedTest: test });
  };

  private goBack = () => {
    const { view, selectedSubcat, selectedCategory } = this.state;
    if (view === "detail") {
      if (selectedCategory) {
        const tests = testLibraryStore.filter({ category: selectedCategory, subcategory: selectedSubcat || undefined });
        this.setState({ view: "category", selectedTest: null, filteredTests: tests });
      } else {
        this.setState({ view: "dashboard", selectedTest: null });
      }
    } else if (view === "category" || view === "plugins") {
      this.setState({ view: "dashboard", selectedCategory: "", selectedSubcat: "", search: "" });
    }
  };

  // ─── IMPORT ─────────────────────────────────────────────────
  private handleImport = () => {
    this.fileInput.current?.click();
  };

  private onFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    this.setState({ importing: true });
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(json) ? json : [json];
        const count = testLibraryStore.importTests(arr);
        this.refreshStats();
        this.setState({ importing: false });
        alert(`Imported ${count} test case${count !== 1 ? "s" : ""} successfully.`);
      } catch (err) {
        this.setState({ importing: false });
        alert(t("errors.jsonParseFailed"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ─── EXPORT ─────────────────────────────────────────────────
  private handleExport = () => {
    const json = testLibraryStore.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── PLUGIN FOLDER LOADING ──────────────────────────────────
  private handleLoadPluginFolder = () => {
    this.folderInput.current?.click();
  };

  private handleLoadPluginFile = () => {
    this.pluginFileInput.current?.click();
  };

  private onPluginFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    let loaded = 0;
    let failed = 0;
    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".json")) continue;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const plugin = pluginRegistry.loadFromJSON(json);
        if (plugin) loaded++;
        else failed++;
      } catch {
        failed++;
      }
    }
    this.refreshStats();
    alert(`Plugin folder loaded: ${loaded} plugin${loaded !== 1 ? "s" : ""} registered${failed > 0 ? `, ${failed} failed` : ""}.`);
    e.target.value = "";
  };

  private onPluginFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const plugin = pluginRegistry.loadFromJSON(json);
      this.refreshStats();
      if (plugin) {
        alert(`Plugin "${plugin.metadata.name}" loaded successfully (${plugin.rules.length} rules, ${plugin.testCases.length} tests).`);
      } else {
        alert(t("errors.pluginLoadFailed"));
      }
    } catch {
      alert(t("errors.pluginParseFailed"));
    }
    e.target.value = "";
  };

  // ─── RENDER ─────────────────────────────────────────────────
  render() {
    const { view, search, categoryStats, totalTests, selectedCategory, selectedSubcat, filteredTests, selectedTest, pluginStates, importing, generating, generatedCount, aiSelectedCatIds, showAICategories } = this.state;
    const stats = testLibraryStore.stats;
    const specsLoaded = db.specs.length;

    return (
      <div className="lib-root">
        <input ref={this.fileInput} type="file" accept=".json" style={{ display: "none" }} onChange={this.onFileImport} />
        <input ref={this.pluginFileInput} type="file" accept=".json" style={{ display: "none" }} onChange={this.onPluginFileImport} />
        <input ref={this.folderInput} type="file" accept=".json" multiple style={{ display: "none" }}
          {...({ webkitdirectory: "", directory: "" } as any)}
          onChange={this.onPluginFolderSelect} />

        {/* ── TOP BAR ── */}
        <div className="lib-topbar">
          <div className="lib-topbar__left">
            {view !== "dashboard" && (
              <button className="lib-btn-back" onClick={this.goBack}>← Back</button>
            )}
            <span className="lib-topbar__title">
              {view === "dashboard" && "📚 Test Library Dashboard"}
              {view === "category" && (search ? `🔍 Search: "${search}"` : `${BANKING_CATEGORIES.find(c => c.name === selectedCategory)?.icon || "📁"} ${selectedCategory}${selectedSubcat ? ` › ${selectedSubcat}` : ""}`)}
              {view === "detail" && `🧪 ${selectedTest?.testName || "Test Detail"}`}
              {view === "plugins" && "🔌 Plugin Manager"}
            </span>
          </div>
          <div className="lib-topbar__right">
            <div className="lib-search-wrap">
              <input
                className="lib-search"
                type="text"
                value={search}
                onChange={e => this.handleSearch(e.target.value)}
                placeholder="🔍 Search by name, category, tag, or keyword..."
              />
            </div>
            <button className="lib-btn-action" onClick={this.handleImport} disabled={importing}>
              {importing ? "⏳ Importing..." : "📥 Import JSON"}
            </button>
            <button className="lib-btn-action" onClick={this.handleExport}>📤 Export All</button>
            <button
              className="lib-btn-action lib-btn-action--generate"
              onClick={this.handleGenerateFromSchemas}
              disabled={generating || specsLoaded === 0}
              title={specsLoaded === 0 ? "Load API schemas in the API Files tab first" : `Generate tests from ${specsLoaded} loaded API schema(s)`}
            >
              {generating ? "⏳ Generating..." : `🔄 Generate from APIs (${specsLoaded})`}
            </button>
            <button className="lib-btn-action lib-btn-action--plugins" onClick={() => this.setState({ view: "plugins" })}>
              🔌 Plugins ({pluginStates.filter(p => p.enabled).length})
            </button>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="lib-stats-bar">
          <div className="lib-stat"><span className="lib-stat__val">{totalTests}</span><span className="lib-stat__label">Total Tests</span></div>
          <div className="lib-stat"><span className="lib-stat__val">{stats.categories}</span><span className="lib-stat__label">Categories</span></div>
          <div className="lib-stat"><span className="lib-stat__val">{stats.subcategories}</span><span className="lib-stat__label">Subcategories</span></div>
          <div className="lib-stat"><span className="lib-stat__val">{pluginStates.filter(p => p.enabled).length}</span><span className="lib-stat__label">Active Plugins</span></div>
          {generatedCount > 0 && (
            <div className="lib-stat lib-stat--generated"><span className="lib-stat__val">{generatedCount}</span><span className="lib-stat__label">API Generated</span></div>
          )}
        </div>

        {/* ── DASHBOARD VIEW ── */}
        {view === "dashboard" && (
          <div className="lib-dashboard">

            {/* ── AI CATEGORY SELECTOR ── */}
            <div style={{
              marginBottom: 18, borderRadius: 10,
              border: "1px solid var(--cs-border)",
              background: "var(--cs-surface-2)",
              overflow: "hidden",
            }}>
              {/* Header / toggle */}
              <button
                onClick={() => this.setState(s => ({ showAICategories: !s.showAICategories }))}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", background: "transparent", border: "none",
                  borderBottom: showAICategories ? "1px solid var(--cs-border)" : "none",
                  cursor: "pointer", textAlign: "left" as const,
                }}
              >
                <span style={{ fontSize: 14 }}>🤖</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 11, fontWeight: 700, color: "var(--cs-text)" }}>
                    AI Assistant Category Filter
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 9, color: "var(--cs-dim)", marginTop: 1 }}>
                    {aiSelectedCatIds.size === 0
                      ? "No categories selected — AI will use all domains"
                      : `${aiSelectedCatIds.size} categor${aiSelectedCatIds.size === 1 ? "y" : "ies"} selected — injected into AI prompts`}
                  </div>
                </div>
                {aiSelectedCatIds.size > 0 && (
                  <span style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 9,
                    padding: "2px 8px", borderRadius: 10,
                    background: "#34d39920", border: "1px solid #34d39933", color: "#34d399",
                  }}>
                    {aiSelectedCatIds.size} active
                  </span>
                )}
                <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, color: "var(--cs-dim)" }}>
                  {showAICategories ? "▲" : "▼"}
                </span>
              </button>

              {/* Expandable checkbox grid */}
              {showAICategories && (
                <div style={{ padding: "10px 14px 14px" }}>
                  <div style={{
                    display: "flex", gap: 6, flexWrap: "wrap" as const,
                    marginBottom: 10,
                  }}>
                    <button onClick={() => { BANKING_CATEGORIES.forEach(c => { if (!aiPrefsStore.selectedCategoryIds.has(c.id)) aiPrefsStore.toggleCategory(c.id); }); }}
                      style={{
                        padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                        background: "var(--cs-accent)18", border: "1px solid var(--cs-accent)44",
                        color: "var(--cs-accent)", fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, fontWeight: 700,
                      }}>
                      ✓ All
                    </button>
                    <button onClick={() => { [...aiPrefsStore.selectedCategoryIds].forEach(id => aiPrefsStore.toggleCategory(id)); }}
                      style={{
                        padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                        background: "transparent", border: "1px solid var(--cs-border-sub)",
                        color: "var(--cs-dim)", fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10,
                      }}>
                      ✕ None
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 6 }}>
                    {BANKING_CATEGORIES.map(cat => {
                      const checked = aiSelectedCatIds.has(cat.id);
                      return (
                        <label key={cat.id}
                          onClick={() => aiPrefsStore.toggleCategory(cat.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                            background: checked ? cat.color + "10" : "var(--cs-bg)",
                            border: `1px solid ${checked ? cat.color + "44" : "var(--cs-border-sub)"}`,
                            transition: "all .12s",
                          }}
                        >
                          <input
                            type="checkbox" checked={checked} readOnly
                            style={{ accentColor: cat.color, width: 13, height: 13, flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{cat.icon}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10,
                              fontWeight: checked ? 700 : 400,
                              color: checked ? cat.color : "var(--cs-muted)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                            }}>
                              {cat.name}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {aiSelectedCatIds.size > 0 && (
                    <div style={{
                      marginTop: 10, padding: "6px 10px", borderRadius: 6,
                      background: "#34d39910", border: "1px solid #34d39922",
                      fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 9, color: "#34d399",
                      lineHeight: 1.5,
                    }}>
                      ✓ Selected: {[...aiSelectedCatIds].map(id => BANKING_CATEGORIES.find(c => c.id === id)?.name).filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lib-cat-grid">
              {categoryStats.map(cs => {
                const cat = BANKING_CATEGORIES.find(c => c.name === cs.category);
                const genCount = testLibraryStore.generated.filter(t => t.category === cs.category).length;
                return (
                  <button key={cs.category} className={`lib-cat-card${genCount > 0 ? " lib-cat-card--has-generated" : ""}`} onClick={() => this.openCategory(cs.category)}>
                    <div className="lib-cat-card__header" style={{ borderLeftColor: cs.color }}>
                      <span className="lib-cat-card__icon">{cs.icon}</span>
                      <span className="lib-cat-card__name">{cs.category}</span>
                    </div>
                    <div className="lib-cat-card__body">
                      <div className="lib-cat-card__stat"><span>{cs.subcategories}</span> Subcategories</div>
                      <div className="lib-cat-card__stat"><span>{cs.tests}</span> Tests</div>
                      {genCount > 0 && (
                        <div className="lib-cat-card__stat lib-cat-card__stat--gen"><span>{genCount}</span> API Gen</div>
                      )}
                    </div>
                    {cat && (
                      <div className="lib-cat-card__subs">
                        {cat.subcategories.slice(0, 3).map(s => (
                          <span key={s.id} className="lib-cat-card__sub-tag">{s.name}</span>
                        ))}
                        {cat.subcategories.length > 3 && <span className="lib-cat-card__sub-tag">+{cat.subcategories.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CATEGORY / SEARCH RESULTS VIEW ── */}
        {view === "category" && (
          <div className="lib-category-view">
            {/* Subcategory pills */}
            {selectedCategory && !search && (
              <div className="lib-subcat-pills">
                <button
                  className={`lib-pill${!selectedSubcat ? " active" : ""}`}
                  onClick={() => { const t = testLibraryStore.filter({ category: selectedCategory }); this.setState({ selectedSubcat: "", filteredTests: t }); }}
                >All ({testLibraryStore.filter({ category: selectedCategory }).length})</button>
                {BANKING_CATEGORIES.find(c => c.name === selectedCategory)?.subcategories.map(s => {
                  const count = testLibraryStore.filter({ category: selectedCategory, subcategory: s.name }).length;
                  return (
                    <button key={s.id} className={`lib-pill${selectedSubcat === s.name ? " active" : ""}`} onClick={() => this.openSubcat(selectedCategory, s.name)}>
                      {s.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Test list */}
            <div className="lib-test-list">
              {filteredTests.length === 0 && (
                <div className="lib-empty">No test cases found. Import tests or enable more plugins.</div>
              )}
              {filteredTests.map(t => {
                const isGen = testLibraryStore.isGenerated(t.id);
                return (
                  <button key={t.id} className={`lib-test-row${isGen ? " lib-test-row--generated" : ""}`} onClick={() => this.openTest(t)}>
                    <div className="lib-test-row__top">
                      <span className="lib-test-row__name">{t.testName}</span>
                      <span className="lib-test-row__steps">{t.steps.length} steps</span>
                      {isGen && <span className="lib-test-row__badge-gen">API Generated</span>}
                    </div>
                    <div className="lib-test-row__desc">{t.businessDescription}</div>
                    <div className="lib-test-row__meta">
                      <span className="lib-test-row__cat">{t.category}</span>
                      <span className="lib-test-row__subcat">{t.subcategory}</span>
                      {t.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="lib-test-row__tag">{tag}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TEST DETAIL VIEW ── */}
        {view === "detail" && selectedTest && (
          <div className={`lib-detail${testLibraryStore.isGenerated(selectedTest.id) ? " lib-detail--generated" : ""}`}>
            <div className="lib-detail__header">
              <h2 className="lib-detail__title">🧪 {selectedTest.testName}</h2>
              <div className="lib-detail__breadcrumb">{selectedTest.category} › {selectedTest.subcategory}</div>
              {testLibraryStore.isGenerated(selectedTest.id) && (
                <div className="lib-detail__gen-banner">
                  <span className="lib-detail__gen-badge">🔄 API Generated</span>
                  <span className="lib-detail__gen-info">Auto-generated from loaded API schemas using banking context matching</span>
                </div>
              )}
            </div>

            <div className="lib-detail__section">
              <div className="lib-detail__section-title">Business Scenario</div>
              <p className="lib-detail__text">{selectedTest.businessDescription}</p>
            </div>

            <div className="lib-detail__section">
              <div className="lib-detail__section-title">Process Flow</div>
              <div className="lib-detail__steps">
                {selectedTest.steps.map((s, i) => (
                  <div key={i} className="lib-step">
                    <div className="lib-step__num">{s.step}</div>
                    <div className="lib-step__content">
                      <div className="lib-step__name">{s.name}</div>
                      <div className="lib-step__desc">{s.businessDescription}</div>
                    </div>
                    {i < selectedTest.steps.length - 1 && <div className="lib-step__connector" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="lib-detail__section">
              <div className="lib-detail__section-title">Parameters</div>
              <div className="lib-detail__params">
                {Object.entries(selectedTest.parameters).map(([key, val]) => (
                  <div key={key} className="lib-param-row">
                    <span className="lib-param-row__key">{key}</span>
                    <span className="lib-param-row__val">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lib-detail__section">
              <div className="lib-detail__section-title">Expected Result</div>
              <p className="lib-detail__text lib-detail__text--result">{selectedTest.expectedResult}</p>
            </div>

            <div className="lib-detail__section">
              <div className="lib-detail__section-title">Documentation</div>
              <p className="lib-detail__text">{selectedTest.documentation}</p>
            </div>

            <div className="lib-detail__tags">
              {selectedTest.tags.map(t => <span key={t} className="lib-detail__tag">{t}</span>)}
            </div>
          </div>
        )}

        {/* ── PLUGIN MANAGER VIEW ── */}
        {view === "plugins" && (
          <div className="lib-plugins">
            <div className="lib-plugins__header">
              <h3>🔌 Banking Plugins</h3>
              <div className="lib-plugins__actions">
                <button className="lib-btn-action" onClick={this.handleLoadPluginFile}>📄 Load Plugin File</button>
                <button className="lib-btn-action" onClick={this.handleLoadPluginFolder}>📁 Load Plugin Folder</button>
                <span className="lib-plugins__summary">
                  {pluginStates.filter(p => p.enabled).length} of {pluginStates.length} enabled
                </span>
              </div>
            </div>
            <div className="lib-plugin-grid">
              {pluginStates.map(p => (
                <div key={p.id} className={`lib-plugin-card${p.enabled ? "" : " disabled"}`}>
                  <div className="lib-plugin-card__top">
                    <span className="lib-plugin-card__icon">{p.icon}</span>
                    <span className="lib-plugin-card__name">{p.name}</span>
                    <label className="lib-plugin-toggle">
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={() => {
                          pluginRegistry.setEnabled(p.id, !p.enabled);
                          this.refreshStats();
                        }}
                      />
                      <span className="lib-plugin-toggle__track" />
                    </label>
                  </div>
                  <div className="lib-plugin-card__stats">
                    <span>{p.rules} rules</span>
                    <span>{p.tests} tests</span>
                    {!p.id.startsWith("plugin-") && <span className="lib-plugin-card__ext">External</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}
