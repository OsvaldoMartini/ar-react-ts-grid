import { ApiSpec } from "./utils";

export interface BankingCategory {
  name: string;
  subcategories: string[];
}

export interface BankingContextProfile {
  id: string;
  displayName: string;
  bankName: string;
  businessLanguage: string;
  region: string;
  priorities: string[];
  categories: BankingCategory[];
}

export interface BusinessRuleSuggestion {
  id: string;
  name: string;
  category: string;
  severity: "low" | "medium" | "high";
  rationale: string;
  when: string[];
}

export interface BusinessTestImportShape {
  category: string;
  subcategory: string;
  testName: string;
  businessDescription: string;
  tags: string[];
  parameters: Record<string, string>;
  steps: Array<{
    step: number;
    name: string;
    businessDescription: string;
  }>;
  expectedResult: string;
  documentation: string;
}

export const BANKING_TEST_TAXONOMY: BankingCategory[] = [
  { name: "Client Management", subcategories: ["Client onboarding", "Client profile update", "Address management", "Client closure", "Client segmentation"] },
  { name: "Account Lifecycle", subcategories: ["Account opening", "Account funding", "Account balance operations", "Account limits", "Account closure"] },
  { name: "Payments & Transfers", subcategories: ["Internal transfers", "External payments", "Scheduled payments", "Payment validation", "Payment reconciliation"] },
  { name: "Investment Portfolio", subcategories: ["Portfolio creation", "Asset allocation", "Portfolio rebalancing", "Portfolio valuation", "Portfolio reporting"] },
  { name: "Trading Operations", subcategories: ["Equity orders", "Bond orders", "Order lifecycle", "Trade settlement", "Trade cancellation"] },
  { name: "Compliance & KYC", subcategories: ["KYC updates", "AML checks", "Document verification", "Risk classification", "Regulatory reporting"] },
  { name: "Corporate Actions", subcategories: ["Dividend distribution", "Stock split", "Maturity processing", "Coupon payments", "Asset adjustments"] },
  { name: "Lending & Credit", subcategories: ["Loan creation", "Credit checks", "Collateral management", "Loan repayment", "Loan closure"] },
  { name: "Reporting & Monitoring", subcategories: ["Client statements", "Portfolio reports", "Account activity", "Audit logs", "Operational metrics"] },
  { name: "Operational Maintenance", subcategories: ["Data maintenance", "Batch processing", "System monitoring", "Error recovery", "Operational controls"] },
];

export const DEFAULT_BANKING_CONTEXT: BankingContextProfile = {
  id: "banking-default",
  displayName: "Default Banking Context",
  bankName: "Avaloq Banking Workspace",
  businessLanguage: "Business-first",
  region: "Multi-region",
  priorities: [
    "Business-readable workflows",
    "Parameterised tests",
    "Reusable domain plugins",
    "Cloud + local AI assistant orchestration",
  ],
  categories: BANKING_TEST_TAXONOMY,
};

const contains = (text: string, ...terms: string[]) => {
  const t = text.toLowerCase();
  return terms.some(term => t.includes(term.toLowerCase()));
};

export function suggestBankingRulesFromSpecs(specs: ApiSpec[]): BusinessRuleSuggestion[] {
  const rules: BusinessRuleSuggestion[] = [];
  const push = (rule: BusinessRuleSuggestion) => {
    if (!rules.some(r => r.id === rule.id)) rules.push(rule);
  };

  for (const spec of specs) {
    const searchable = [
      spec.title,
      spec.description,
      spec.resourceName || "",
      spec.schemaName || "",
      spec.tags.join(" "),
      spec.fields.map(f => `${f.name} ${f.description} ${f.type}`).join(" "),
      spec.endpoints.map(e => `${e.method} ${e.path} ${e.summary}`).join(" "),
    ].join(" ");

    if (contains(searchable, "payment", "transfer", "iban", "bic", "beneficiary")) {
      push({
        id: "rule-payment-validation",
        name: "Payment validation and balance checks",
        category: "Payments & Transfers",
        severity: "high",
        rationale: "Payment APIs should validate source account state, transfer amount, currency consistency, and beneficiary data before execution.",
        when: ["Before transfer execution", "Before external payment submission", "Before balance update confirmation"],
      });
    }

    if (contains(searchable, "kyc", "aml", "risk", "compliance", "document")) {
      push({
        id: "rule-compliance-gating",
        name: "Compliance gating before customer activation",
        category: "Compliance & KYC",
        severity: "high",
        rationale: "Customer lifecycle operations should be blocked or flagged until KYC, AML, and risk classification prerequisites are fulfilled.",
        when: ["Before onboarding completion", "Before account activation", "Before high-risk transaction processing"],
      });
    }

    if (contains(searchable, "portfolio", "asset", "valuation", "position", "trading", "order")) {
      push({
        id: "rule-investment-suitability",
        name: "Investment suitability and position consistency",
        category: "Investment Portfolio",
        severity: "medium",
        rationale: "Portfolio and trading operations should align with risk class, product eligibility, and settlement consistency checks.",
        when: ["Before order submission", "During portfolio rebalance", "Before valuation reporting"],
      });
    }

    if (contains(searchable, "loan", "credit", "collateral", "repayment")) {
      push({
        id: "rule-lending-credit-controls",
        name: "Credit eligibility and collateral completeness",
        category: "Lending & Credit",
        severity: "high",
        rationale: "Lending flows should verify creditworthiness, collateral availability, repayment schedule validity, and closure preconditions.",
        when: ["Before loan creation", "Before disbursement", "Before loan closure"],
      });
    }

    if (contains(searchable, "report", "statement", "audit", "monitor", "history")) {
      push({
        id: "rule-reporting-traceability",
        name: "Reporting traceability and audit completeness",
        category: "Reporting & Monitoring",
        severity: "medium",
        rationale: "Reporting endpoints should preserve business-readable traceability, input parameters, generated result sets, and execution timestamps.",
        when: ["When exporting reports", "When generating audit evidence", "When building monitoring dashboards"],
      });
    }
  }

  return rules;
}

export function createExampleImportShape(): BusinessTestImportShape {
  return {
    category: "Payments & Transfers",
    subcategory: "Internal transfers",
    testName: "Transfer between two retail accounts",
    businessDescription: "Verify that a customer can transfer funds between two internal accounts and that balances are updated correctly.",
    tags: ["retail", "transfer", "balance"],
    parameters: {
      ACCOUNT_SOURCE: "${ACCOUNT_SOURCE}",
      ACCOUNT_DEST: "${ACCOUNT_DEST}",
      TRANSFER_AMOUNT: "${TRANSFER_AMOUNT}",
      CURRENCY: "EUR",
    },
    steps: [
      { step: 1, name: "Retrieve source account balance", businessDescription: "The system verifies the available balance before executing the transfer." },
      { step: 2, name: "Execute transfer", businessDescription: "Funds are moved between the two selected internal accounts." },
      { step: 3, name: "Validate balances", businessDescription: "The system confirms that debit and credit updates were applied correctly." },
    ],
    expectedResult: "The transfer is executed successfully and both account balances are updated.",
    documentation: "This test validates the internal transfer process for retail banking customers.",
  };
}
