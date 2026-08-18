// ═══════════════════════════════════════════════════════════════
// AI PREFERENCES STORE
// Shared singleton: category selection for AI + run count.
// Exported so both AIAssistantTab and TestLibraryTab can read/write.
// ═══════════════════════════════════════════════════════════════

type AIPrefsListener = () => void;

class AIPreferencesStore {
  /** Category IDs selected for AI prompt injection */
  selectedCategoryIds: Set<string> = new Set();
  /** How many test case runs to request */
  testRunCount: number = 5;

  private listeners: AIPrefsListener[] = [];

  subscribe(fn: AIPrefsListener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
    // Persist lightweight snapshot
    try {
      sessionStorage.setItem("mt_ai_prefs", JSON.stringify({
        cats: [...this.selectedCategoryIds],
        runs: this.testRunCount,
      }));
    } catch {}
  }

  toggleCategory(id: string) {
    if (this.selectedCategoryIds.has(id)) this.selectedCategoryIds.delete(id);
    else this.selectedCategoryIds.add(id);
    this.notify();
  }

  setRunCount(n: number) {
    this.testRunCount = Math.max(1, Math.min(50, n));
    this.notify();
  }

  load() {
    try {
      const raw = sessionStorage.getItem("mt_ai_prefs");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (Array.isArray(d.cats)) this.selectedCategoryIds = new Set(d.cats);
      if (typeof d.runs === "number") this.testRunCount = d.runs;
    } catch {}
  }
}

export const aiPrefsStore = new AIPreferencesStore();

// Auto-load on first import
aiPrefsStore.load();
