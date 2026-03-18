// ═══════════════════════════════════════════════════════════════
// TEST LIBRARY STORE
// ═══════════════════════════════════════════════════════════════
// Manages the imported/generated test case library.
// Supports import from JSON files, search, filter by category,
// and integration with the plugin system.
// ═══════════════════════════════════════════════════════════════

import type { LibraryTestCase } from "./BankingContext";
import { BANKING_CATEGORIES } from "./BankingContext";
import { pluginRegistry } from "./PluginSystem";

export interface LibraryFilter {
  search?:       string;
  category?:     string;
  subcategory?:  string;
  tags?:         string[];
}

export interface LibraryStats {
  totalTests:     number;
  categories:     number;
  subcategories:  number;
  tags:           string[];
}

export class TestLibraryStore {
  private _imported: LibraryTestCase[] = [];
  private _generated: LibraryTestCase[] = [];
  private listeners: (() => void)[] = [];

  /** All test cases = plugin test cases + imported + generated */
  get all(): LibraryTestCase[] {
    return [...pluginRegistry.getAllTestCases(), ...this._imported, ...this._generated];
  }

  /** Only imported (non-plugin) test cases */
  get imported(): LibraryTestCase[] {
    return [...this._imported];
  }

  /** Only API-generated test cases */
  get generated(): LibraryTestCase[] {
    return [...this._generated];
  }

  /** Add generated test cases (from Schema Matching Engine) */
  addGenerated(tests: LibraryTestCase[]): number {
    let added = 0;
    for (const t of tests) {
      if (!t.category || !t.testName) continue;
      if (!t.id) t.id = `gen-${Date.now()}-${added}`;
      if (!t.createdAt) t.createdAt = new Date().toISOString();
      if (!t.updatedAt) t.updatedAt = new Date().toISOString();
      this._generated.push(t);
      added++;
    }
    this._notify();
    return added;
  }

  /** Clear generated test cases */
  clearGenerated(): void {
    this._generated = [];
    this._notify();
  }

  /** Check if a test case is API-generated */
  isGenerated(testId: string): boolean {
    return this._generated.some(t => t.id === testId);
  }

  /** Import test cases from a JSON array */
  importTests(tests: LibraryTestCase[]): number {
    let added = 0;
    for (const t of tests) {
      if (!t.category || !t.testName) continue;
      if (!t.id) t.id = `import-${Date.now()}-${added}`;
      if (!t.createdAt) t.createdAt = new Date().toISOString();
      if (!t.updatedAt) t.updatedAt = new Date().toISOString();
      if (!t.steps) t.steps = [];
      if (!t.parameters) t.parameters = {};
      if (!t.tags) t.tags = [];
      this._imported.push(t);
      added++;
    }
    this._notify();
    return added;
  }

  /** Clear all imported test cases */
  clearImported(): void {
    this._imported = [];
    this._notify();
  }

  /** Search and filter test cases */
  filter(f: LibraryFilter): LibraryTestCase[] {
    let results = this.all;
    if (f.category) {
      results = results.filter(t => t.category === f.category);
    }
    if (f.subcategory) {
      results = results.filter(t => t.subcategory === f.subcategory);
    }
    if (f.tags && f.tags.length > 0) {
      const tagSet = new Set(f.tags.map(t => t.toLowerCase()));
      results = results.filter(t => t.tags.some(tag => tagSet.has(tag.toLowerCase())));
    }
    if (f.search) {
      const q = f.search.toLowerCase();
      results = results.filter(t =>
        t.testName.toLowerCase().includes(q) ||
        t.businessDescription.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.subcategory.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return results;
  }

  /** Get stats per category */
  getCategoryStats(): { category: string; subcategories: number; tests: number; icon: string; color: string }[] {
    const all = this.all;
    return BANKING_CATEGORIES.map(cat => {
      const tests = all.filter(t => t.category === cat.name);
      const subs = new Set(tests.map(t => t.subcategory));
      return { category: cat.name, subcategories: subs.size, tests: tests.length, icon: cat.icon, color: cat.color };
    });
  }

  /** Get overall stats */
  get stats(): LibraryStats {
    const all = this.all;
    const cats = new Set(all.map(t => t.category));
    const subs = new Set(all.map(t => t.subcategory));
    const tags = [...new Set(all.flatMap(t => t.tags))].sort();
    return { totalTests: all.length, categories: cats.size, subcategories: subs.size, tags };
  }

  /** Export all test cases as JSON */
  exportJSON(): string {
    return JSON.stringify(this.all, null, 2);
  }

  /** Subscribe to changes */
  subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private _notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const testLibraryStore = new TestLibraryStore();
