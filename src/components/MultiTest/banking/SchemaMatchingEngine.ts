// ═══════════════════════════════════════════════════════════════
// SCHEMA MATCHING ENGINE
// ═══════════════════════════════════════════════════════════════
// Cross-references loaded API schemas against the banking context
// and active plugins to auto-generate test cases.
//
// The engine uses a heuristic keyword-scoring system to map
// API endpoints, fields, and tags to banking categories/subcategories.
// Generated test cases are flagged as "api-generated" for visual
// distinction in the Test Library (green cards).
// ═══════════════════════════════════════════════════════════════

import type { ApiSpec } from "../utils";
import {
  BANKING_CATEGORIES,
  type BusinessCategory,
  type BusinessSubcategory,
  type LibraryTestCase,
  type LibraryTestStep,
} from "./BankingContext";
import { pluginRegistry } from "./PluginSystem";

// ─── KEYWORD MAP ────────────────────────────────────────────
// Maps keywords found in API paths, tags, fields, and descriptions
// to banking subcategory IDs. Each entry has a weight.

interface KeywordEntry {
  keyword:       string;
  subcategoryId: string;
  categoryId:    string;
  weight:        number;
}

const KEYWORD_MAP: KeywordEntry[] = [
  // Client Management
  { keyword: "business-partner",   subcategoryId: "client-onboarding",    categoryId: "client-management", weight: 3.0 },
  { keyword: "bp",                 subcategoryId: "client-onboarding",    categoryId: "client-management", weight: 2.0 },
  { keyword: "client",             subcategoryId: "client-profile",       categoryId: "client-management", weight: 2.0 },
  { keyword: "person",             subcategoryId: "client-profile",       categoryId: "client-management", weight: 1.5 },
  { keyword: "onboard",            subcategoryId: "client-onboarding",    categoryId: "client-management", weight: 2.5 },
  { keyword: "addr",               subcategoryId: "address-management",   categoryId: "client-management", weight: 3.0 },
  { keyword: "address",            subcategoryId: "address-management",   categoryId: "client-management", weight: 3.0 },
  { keyword: "segment",            subcategoryId: "client-segmentation",  categoryId: "client-management", weight: 2.0 },
  { keyword: "closure",            subcategoryId: "client-closure",       categoryId: "client-management", weight: 2.0 },
  { keyword: "deactivat",          subcategoryId: "client-closure",       categoryId: "client-management", weight: 2.0 },

  // Account Lifecycle
  { keyword: "account",            subcategoryId: "account-opening",      categoryId: "account-lifecycle", weight: 2.0 },
  { keyword: "acct",               subcategoryId: "account-opening",      categoryId: "account-lifecycle", weight: 2.0 },
  { keyword: "deposit",            subcategoryId: "account-funding",      categoryId: "account-lifecycle", weight: 2.5 },
  { keyword: "funding",            subcategoryId: "account-funding",      categoryId: "account-lifecycle", weight: 2.5 },
  { keyword: "balance",            subcategoryId: "account-balance",      categoryId: "account-lifecycle", weight: 2.0 },
  { keyword: "limit",              subcategoryId: "account-limits",       categoryId: "account-lifecycle", weight: 2.0 },

  // Payments & Transfers
  { keyword: "payment",            subcategoryId: "external-payments",    categoryId: "payments-transfers", weight: 3.0 },
  { keyword: "transfer",           subcategoryId: "internal-transfers",   categoryId: "payments-transfers", weight: 3.0 },
  { keyword: "sepa",               subcategoryId: "external-payments",    categoryId: "payments-transfers", weight: 3.0 },
  { keyword: "swift",              subcategoryId: "external-payments",    categoryId: "payments-transfers", weight: 2.5 },
  { keyword: "standing-order",     subcategoryId: "scheduled-payments",   categoryId: "payments-transfers", weight: 3.0 },
  { keyword: "schedul",            subcategoryId: "scheduled-payments",   categoryId: "payments-transfers", weight: 2.0 },
  { keyword: "reconcil",           subcategoryId: "payment-reconciliation", categoryId: "payments-transfers", weight: 2.5 },
  { keyword: "validat",            subcategoryId: "payment-validation",   categoryId: "payments-transfers", weight: 1.5 },

  // Investment Portfolio
  { keyword: "portfolio",          subcategoryId: "portfolio-creation",   categoryId: "investment-portfolio", weight: 3.0 },
  { keyword: "asset",              subcategoryId: "asset-allocation",     categoryId: "investment-portfolio", weight: 2.0 },
  { keyword: "allocation",         subcategoryId: "asset-allocation",     categoryId: "investment-portfolio", weight: 2.5 },
  { keyword: "rebalanc",           subcategoryId: "portfolio-rebalancing",categoryId: "investment-portfolio", weight: 3.0 },
  { keyword: "valuation",          subcategoryId: "portfolio-valuation",  categoryId: "investment-portfolio", weight: 2.5 },
  { keyword: "position",           subcategoryId: "portfolio-valuation",  categoryId: "investment-portfolio", weight: 1.5 },
  { keyword: "holding",            subcategoryId: "portfolio-valuation",  categoryId: "investment-portfolio", weight: 2.0 },

  // Trading Operations
  { keyword: "order",              subcategoryId: "equity-orders",        categoryId: "trading-operations", weight: 2.0 },
  { keyword: "trade",              subcategoryId: "trade-settlement",     categoryId: "trading-operations", weight: 2.5 },
  { keyword: "equity",             subcategoryId: "equity-orders",        categoryId: "trading-operations", weight: 3.0 },
  { keyword: "bond",               subcategoryId: "bond-orders",          categoryId: "trading-operations", weight: 3.0 },
  { keyword: "settlement",         subcategoryId: "trade-settlement",     categoryId: "trading-operations", weight: 3.0 },
  { keyword: "cancel",             subcategoryId: "trade-cancellation",   categoryId: "trading-operations", weight: 2.0 },
  { keyword: "execution",          subcategoryId: "order-lifecycle",      categoryId: "trading-operations", weight: 2.0 },

  // Compliance & KYC
  { keyword: "kyc",                subcategoryId: "kyc-updates",          categoryId: "compliance-kyc", weight: 3.0 },
  { keyword: "aml",                subcategoryId: "aml-checks",           categoryId: "compliance-kyc", weight: 3.0 },
  { keyword: "compliance",         subcategoryId: "regulatory-reporting", categoryId: "compliance-kyc", weight: 2.5 },
  { keyword: "document",           subcategoryId: "document-verification",categoryId: "compliance-kyc", weight: 1.5 },
  { keyword: "risk",               subcategoryId: "risk-classification",  categoryId: "compliance-kyc", weight: 2.0 },
  { keyword: "screening",          subcategoryId: "aml-checks",           categoryId: "compliance-kyc", weight: 2.5 },
  { keyword: "pep",                subcategoryId: "aml-checks",           categoryId: "compliance-kyc", weight: 3.0 },
  { keyword: "sanction",           subcategoryId: "aml-checks",           categoryId: "compliance-kyc", weight: 3.0 },

  // Corporate Actions
  { keyword: "dividend",           subcategoryId: "dividend-distribution",categoryId: "corporate-actions", weight: 3.0 },
  { keyword: "split",              subcategoryId: "stock-split",          categoryId: "corporate-actions", weight: 2.5 },
  { keyword: "maturity",           subcategoryId: "maturity-processing",  categoryId: "corporate-actions", weight: 3.0 },
  { keyword: "coupon",             subcategoryId: "coupon-payments",      categoryId: "corporate-actions", weight: 3.0 },
  { keyword: "corporate-action",   subcategoryId: "asset-adjustments",   categoryId: "corporate-actions", weight: 3.0 },

  // Lending & Credit
  { keyword: "loan",               subcategoryId: "loan-creation",        categoryId: "lending-credit", weight: 3.0 },
  { keyword: "credit",             subcategoryId: "credit-checks",        categoryId: "lending-credit", weight: 2.0 },
  { keyword: "collateral",         subcategoryId: "collateral-management",categoryId: "lending-credit", weight: 3.0 },
  { keyword: "mortgage",           subcategoryId: "loan-creation",        categoryId: "lending-credit", weight: 3.0 },
  { keyword: "repay",              subcategoryId: "loan-repayment",       categoryId: "lending-credit", weight: 2.5 },

  // Reporting & Monitoring
  { keyword: "report",             subcategoryId: "portfolio-reports",    categoryId: "reporting-monitoring", weight: 2.0 },
  { keyword: "statement",          subcategoryId: "client-statements",    categoryId: "reporting-monitoring", weight: 2.5 },
  { keyword: "audit",              subcategoryId: "audit-logs",           categoryId: "reporting-monitoring", weight: 2.5 },
  { keyword: "log",                subcategoryId: "audit-logs",           categoryId: "reporting-monitoring", weight: 1.5 },
  { keyword: "metric",             subcategoryId: "operational-metrics",  categoryId: "reporting-monitoring", weight: 2.0 },
  { keyword: "activity",           subcategoryId: "account-activity",     categoryId: "reporting-monitoring", weight: 1.5 },

  // Operational Maintenance
  { keyword: "batch",              subcategoryId: "batch-processing",     categoryId: "operational-maintenance", weight: 2.5 },
  { keyword: "maintenance",        subcategoryId: "data-maintenance",     categoryId: "operational-maintenance", weight: 2.5 },
  { keyword: "monitor",            subcategoryId: "system-monitoring",    categoryId: "operational-maintenance", weight: 2.0 },
  { keyword: "health",             subcategoryId: "system-monitoring",    categoryId: "operational-maintenance", weight: 2.0 },
  { keyword: "error",              subcategoryId: "error-recovery",       categoryId: "operational-maintenance", weight: 1.5 },
  { keyword: "config",             subcategoryId: "operational-controls", categoryId: "operational-maintenance", weight: 1.5 },
];

// ─── MATCHING RESULT ────────────────────────────────────────

export interface MatchResult {
  specFileName:    string;
  specTitle:       string;
  categoryId:      string;
  categoryName:    string;
  subcategoryId:   string;
  subcategoryName: string;
  score:           number;
  matchedKeywords: string[];
  endpoints:       { method: string; path: string; summary: string }[];
  fields:          string[];
}

export interface GeneratedTestCase extends LibraryTestCase {
  /** Marks this test as auto-generated from API schema matching */
  source: "api-generated";
  /** The API spec file that triggered the generation */
  sourceFile: string;
  /** Match confidence score */
  matchScore: number;
}

// ─── SCHEMA MATCHING ENGINE ─────────────────────────────────

export class SchemaMatchingEngine {
  private scoreThreshold: number;

  constructor(threshold: number = 2.0) {
    this.scoreThreshold = threshold;
  }

  /**
   * Analyze a loaded API spec and find all banking context matches
   */
  matchSpec(spec: ApiSpec): MatchResult[] {
    const results: MatchResult[] = [];
    // Build a searchable text corpus from the spec
    const corpus = this.buildCorpus(spec);

    // Score each subcategory
    const scoreMap = new Map<string, { score: number; keywords: string[]; catId: string }>();

    for (const entry of KEYWORD_MAP) {
      const kw = entry.keyword.toLowerCase();
      let hits = 0;

      // Check path segments (highest weight)
      for (const ep of spec.endpoints) {
        const pathLower = ep.path.toLowerCase();
        if (pathLower.includes(kw)) hits += entry.weight;
        // Bonus for exact segment match
        const segments = pathLower.split("/").filter(Boolean);
        if (segments.some(s => s === kw || s.startsWith(kw))) hits += entry.weight * 0.5;
      }

      // Check tags
      for (const tag of spec.tags) {
        if (tag.toLowerCase().includes(kw)) hits += entry.weight * 0.8;
      }

      // Check field names
      for (const field of spec.fields) {
        if (field.name.toLowerCase().includes(kw)) hits += entry.weight * 0.6;
      }

      // Check title and description
      if (spec.title.toLowerCase().includes(kw)) hits += entry.weight * 0.7;
      if (spec.description.toLowerCase().includes(kw)) hits += entry.weight * 0.5;

      if (hits > 0) {
        const existing = scoreMap.get(entry.subcategoryId);
        if (existing) {
          existing.score += hits;
          if (!existing.keywords.includes(entry.keyword)) existing.keywords.push(entry.keyword);
        } else {
          scoreMap.set(entry.subcategoryId, { score: hits, keywords: [entry.keyword], catId: entry.categoryId });
        }
      }
    }

    // Convert scores above threshold to MatchResults
    for (const [subId, data] of scoreMap) {
      if (data.score >= this.scoreThreshold) {
        const cat = BANKING_CATEGORIES.find(c => c.id === data.catId);
        const sub = cat?.subcategories.find(s => s.id === subId);
        if (!cat || !sub) continue;

        results.push({
          specFileName:    spec.fileName,
          specTitle:       spec.title,
          categoryId:      cat.id,
          categoryName:    cat.name,
          subcategoryId:   sub.id,
          subcategoryName: sub.name,
          score:           Math.round(data.score * 10) / 10,
          matchedKeywords: data.keywords,
          endpoints:       spec.endpoints.map(e => ({ method: e.method, path: e.path, summary: e.summary })),
          fields:          spec.fields.map(f => f.name),
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Match ALL loaded specs and return aggregated results
   */
  matchAll(specs: ApiSpec[]): MatchResult[] {
    const allResults: MatchResult[] = [];
    for (const spec of specs) {
      allResults.push(...this.matchSpec(spec));
    }
    // Deduplicate by subcategory (keep highest score per subcategory)
    const best = new Map<string, MatchResult>();
    for (const r of allResults) {
      const key = `${r.categoryId}::${r.subcategoryId}`;
      const existing = best.get(key);
      if (!existing || r.score > existing.score) {
        best.set(key, r);
      }
    }
    return [...best.values()].sort((a, b) => b.score - a.score);
  }

  /**
   * Generate test cases from match results
   */
  generateTestCases(matches: MatchResult[]): GeneratedTestCase[] {
    const tests: GeneratedTestCase[] = [];
    const now = new Date().toISOString();

    for (const match of matches) {
      const cat = BANKING_CATEGORIES.find(c => c.id === match.categoryId);
      const sub = cat?.subcategories.find(s => s.id === match.subcategoryId);
      if (!cat || !sub) continue;

      // Generate CRUD-based tests for each relevant endpoint
      const endpointGroups = this.groupEndpointsByMethod(match.endpoints);

      // Generate a primary test case for the matched subcategory
      const steps = this.generateSteps(match, endpointGroups);
      const params = this.generateParams(match);

      const tc: GeneratedTestCase = {
        id: `api-gen-${match.categoryId}-${match.subcategoryId}-${Date.now()}`,
        category: cat.name,
        subcategory: sub.name,
        testName: `${sub.name} via ${match.specTitle}`,
        businessDescription: `Verify ${sub.description.toLowerCase()} using the ${match.specTitle} API. ` +
          `Matched banking context: ${match.matchedKeywords.join(", ")}.`,
        tags: ["api-generated", ...match.matchedKeywords, cat.id],
        parameters: params,
        steps,
        expectedResult: `The ${sub.name.toLowerCase()} operation completes successfully with all business rules validated.`,
        documentation: `Auto-generated from API schema: ${match.specFileName}. ` +
          `Match score: ${match.score}. ` +
          `Endpoints: ${match.endpoints.map(e => `${e.method} ${e.path}`).join(", ")}. ` +
          `Matched keywords: ${match.matchedKeywords.join(", ")}.`,
        createdAt: now,
        updatedAt: now,
        source: "api-generated",
        sourceFile: match.specFileName,
        matchScore: match.score,
      };

      tests.push(tc);

      // Generate additional method-specific tests
      if (endpointGroups.GET.length > 0) {
        tests.push(this.generateMethodTest("GET", "Retrieve", match, cat, sub, endpointGroups.GET, now));
      }
      if (endpointGroups.POST.length > 0) {
        tests.push(this.generateMethodTest("POST", "Create", match, cat, sub, endpointGroups.POST, now));
      }
      if (endpointGroups.PUT.length > 0 || endpointGroups.PATCH.length > 0) {
        const eps = [...endpointGroups.PUT, ...endpointGroups.PATCH];
        tests.push(this.generateMethodTest("PUT", "Update", match, cat, sub, eps, now));
      }
      if (endpointGroups.DELETE.length > 0) {
        tests.push(this.generateMethodTest("DELETE", "Remove", match, cat, sub, endpointGroups.DELETE, now));
      }
    }

    return tests;
  }

  /**
   * Full pipeline: match specs → generate tests
   */
  processSpecs(specs: ApiSpec[]): { matches: MatchResult[]; tests: GeneratedTestCase[] } {
    const matches = this.matchAll(specs);
    const tests = this.generateTestCases(matches);
    return { matches, tests };
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────

  private buildCorpus(spec: ApiSpec): string {
    const parts = [
      spec.title, spec.description,
      ...spec.endpoints.map(e => `${e.method} ${e.path} ${e.summary}`),
      ...spec.fields.map(f => `${f.name} ${f.description}`),
      ...spec.tags,
    ];
    return parts.join(" ").toLowerCase();
  }

  private groupEndpointsByMethod(endpoints: { method: string; path: string; summary: string }[]) {
    const groups: Record<string, typeof endpoints> = { GET: [], POST: [], PUT: [], PATCH: [], DELETE: [] };
    for (const ep of endpoints) {
      const m = ep.method.toUpperCase();
      if (groups[m]) groups[m].push(ep);
    }
    return groups;
  }

  private generateSteps(match: MatchResult, groups: Record<string, { method: string; path: string; summary: string }[]>): LibraryTestStep[] {
    const steps: LibraryTestStep[] = [];
    let stepNum = 1;

    // Step 1: always retrieve/validate prerequisites
    steps.push({
      step: stepNum++,
      name: "Verify prerequisites",
      businessDescription: `Confirm that all required data exists and the system is ready for the ${match.subcategoryName.toLowerCase()} operation.`,
    });

    // Step 2: based on primary operation
    if (groups.POST.length > 0) {
      steps.push({
        step: stepNum++,
        name: `Create ${match.subcategoryName.toLowerCase()} record`,
        businessDescription: `Submit the new data through the business process. The system validates all required fields and business rules before creating the record.`,
      });
    }

    if (groups.GET.length > 0) {
      steps.push({
        step: stepNum++,
        name: `Retrieve and verify data`,
        businessDescription: `Fetch the data from the system and confirm it matches the expected values. Check all relevant fields are populated correctly.`,
      });
    }

    if (groups.PUT.length > 0 || groups.PATCH.length > 0) {
      steps.push({
        step: stepNum++,
        name: `Update record`,
        businessDescription: `Modify the existing record with updated information. The system should validate the changes against business rules before applying.`,
      });
    }

    // Step N: validation
    steps.push({
      step: stepNum++,
      name: "Validate business rules",
      businessDescription: `Run all applicable business rules from the ${match.categoryName} domain to ensure compliance and data integrity.`,
    });

    // Step N+1: verify final state
    steps.push({
      step: stepNum++,
      name: "Confirm final state",
      businessDescription: `Verify the operation completed successfully and all affected records reflect the expected final state.`,
    });

    return steps;
  }

  private generateParams(match: MatchResult): Record<string, string> {
    const params: Record<string, string> = {};

    // Add common params based on matched fields
    for (const field of match.fields.slice(0, 8)) {
      const paramName = field.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
      params[paramName] = `\${${paramName}}`;
    }

    // Add standard banking params if relevant
    if (match.categoryId === "payments-transfers") {
      if (!params["AMOUNT"]) params["AMOUNT"] = "${AMOUNT}";
      if (!params["CURRENCY"]) params["CURRENCY"] = "CHF";
    }
    if (match.categoryId === "client-management") {
      if (!params["CLIENT_ID"]) params["CLIENT_ID"] = "${CLIENT_ID}";
    }
    if (match.categoryId === "account-lifecycle") {
      if (!params["ACCOUNT_ID"]) params["ACCOUNT_ID"] = "${ACCOUNT_ID}";
    }

    return params;
  }

  private generateMethodTest(
    method: string, verb: string,
    match: MatchResult,
    cat: BusinessCategory, sub: BusinessSubcategory,
    endpoints: { method: string; path: string; summary: string }[],
    now: string
  ): GeneratedTestCase {
    return {
      id: `api-gen-${method.toLowerCase()}-${match.subcategoryId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category: cat.name,
      subcategory: sub.name,
      testName: `${verb} ${sub.name.toLowerCase()} record`,
      businessDescription: `${verb} operation for ${sub.description.toLowerCase()}. ` +
        `Tests the ${method} endpoint${endpoints.length > 1 ? "s" : ""}: ${endpoints.map(e => e.path).join(", ")}.`,
      tags: ["api-generated", method.toLowerCase(), cat.id],
      parameters: this.generateParams(match),
      steps: [
        { step: 1, name: "Prepare test data", businessDescription: `Set up the required data for the ${verb.toLowerCase()} operation.` },
        { step: 2, name: `Execute ${verb.toLowerCase()}`, businessDescription: `Perform the ${verb.toLowerCase()} operation through the business interface.` },
        { step: 3, name: "Validate response", businessDescription: `Confirm the operation returned the expected result and all fields are correct.` },
      ],
      expectedResult: `The ${verb.toLowerCase()} operation completes with correct data and no business rule violations.`,
      documentation: `Auto-generated ${method} test from ${match.specFileName}.`,
      createdAt: now,
      updatedAt: now,
      source: "api-generated",
      sourceFile: match.specFileName,
      matchScore: match.score,
    };
  }
}

/** Global singleton */
export const schemaMatchingEngine = new SchemaMatchingEngine();
