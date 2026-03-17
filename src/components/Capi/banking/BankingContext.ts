// ═══════════════════════════════════════════════════════════════
// BANKING CONTEXT LAYER
// ═══════════════════════════════════════════════════════════════
// Encapsulates all banking-domain logic, rules, categories,
// and data structures. This is the ONLY file that needs to be
// replaced when supporting a different industry context
// (e.g., insurance, telecom, healthcare).
//
// The rest of the system (plugin loader, AI assistant, test runner)
// is context-agnostic and works through this interface.
// ═══════════════════════════════════════════════════════════════

import { SYNTH, rndPick, rndInt, rndFloat, isoDate } from "../utils";

// ─── INDUSTRY CONTEXT INTERFACE ──────────────────────────────
// Any future context (InsuranceContext, TelecomContext, etc.)
// must implement this interface to be compatible with the platform.
export interface IndustryContext {
  id:           string;
  name:         string;
  icon:         string;
  description:  string;
  categories:   BusinessCategory[];
  rulesets:     BusinessRuleset[];
  validators:   Record<string, (value: any) => ValidationResult>;
  dataGenerators: Record<string, () => any>;
}

export interface BusinessCategory {
  id:             string;
  name:           string;
  icon:           string;
  description:    string;
  subcategories:  BusinessSubcategory[];
  color:          string;
}

export interface BusinessSubcategory {
  id:          string;
  name:        string;
  description: string;
  parentId:    string;
}

export interface BusinessRuleset {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  rules:       BusinessRule[];
}

export interface BusinessRule {
  id:          string;
  name:        string;
  description: string;
  condition:   string;        // human-readable condition
  action:      string;        // human-readable action
  severity:    "info" | "warning" | "error" | "critical";
  evaluate:    (data: any) => RuleResult;
}

export interface RuleResult {
  passed:    boolean;
  message:   string;
  severity:  "info" | "warning" | "error" | "critical";
  details?:  any;
}

export interface ValidationResult {
  valid:    boolean;
  message:  string;
  details?: string;
}

// ─── TEST CASE STRUCTURES (from specification) ───────────────
export interface LibraryTestCase {
  id:                   string;
  category:             string;
  subcategory:          string;
  testName:             string;
  businessDescription:  string;
  tags:                 string[];
  parameters:           Record<string, string>;
  steps:                LibraryTestStep[];
  expectedResult:       string;
  documentation:        string;
  tutorial?:            string;
  createdAt:            string;
  updatedAt:            string;
}

export interface LibraryTestStep {
  step:                 number;
  name:                 string;
  businessDescription:  string;
  apiHint?:             string;
}

// ─── BANKING CATEGORIES (10 categories, 50 subcategories) ────

export const BANKING_CATEGORIES: BusinessCategory[] = [
  {
    id: "client-management", name: "Client Management", icon: "👤",
    description: "Client onboarding, profile management, segmentation, and lifecycle operations",
    color: "#61afef",
    subcategories: [
      { id: "client-onboarding",    name: "Client Onboarding",     description: "New client registration and initial setup",           parentId: "client-management" },
      { id: "client-profile",       name: "Client Profile Update", description: "Modify existing client data and attributes",          parentId: "client-management" },
      { id: "address-management",   name: "Address Management",    description: "CRUD operations on client addresses (obj-addrs)",     parentId: "client-management" },
      { id: "client-closure",       name: "Client Closure",        description: "Deactivate and archive client records",               parentId: "client-management" },
      { id: "client-segmentation",  name: "Client Segmentation",   description: "Classify clients by risk, wealth tier, and products", parentId: "client-management" },
    ],
  },
  {
    id: "account-lifecycle", name: "Account Lifecycle", icon: "🏦",
    description: "Account opening, funding, balance operations, limits, and closure",
    color: "#98c379",
    subcategories: [
      { id: "account-opening",   name: "Account Opening",            description: "Create new accounts with proper documentation", parentId: "account-lifecycle" },
      { id: "account-funding",   name: "Account Funding",            description: "Initial and subsequent deposits",               parentId: "account-lifecycle" },
      { id: "account-balance",   name: "Account Balance Operations", description: "Balance inquiries, holds, and adjustments",     parentId: "account-lifecycle" },
      { id: "account-limits",    name: "Account Limits",             description: "Set and manage transaction and balance limits",  parentId: "account-lifecycle" },
      { id: "account-closure",   name: "Account Closure",            description: "Close accounts and settle final balances",      parentId: "account-lifecycle" },
    ],
  },
  {
    id: "payments-transfers", name: "Payments & Transfers", icon: "💸",
    description: "Internal transfers, external payments, scheduled payments, and reconciliation",
    color: "#e5c07b",
    subcategories: [
      { id: "internal-transfers",    name: "Internal Transfers",    description: "Move funds between accounts within the same bank", parentId: "payments-transfers" },
      { id: "external-payments",     name: "External Payments",     description: "SEPA, SWIFT, and cross-border payments",          parentId: "payments-transfers" },
      { id: "scheduled-payments",    name: "Scheduled Payments",    description: "Standing orders and future-dated payments",        parentId: "payments-transfers" },
      { id: "payment-validation",    name: "Payment Validation",    description: "Verify payment eligibility and compliance",        parentId: "payments-transfers" },
      { id: "payment-reconciliation",name: "Payment Reconciliation",description: "Match and reconcile payment transactions",         parentId: "payments-transfers" },
    ],
  },
  {
    id: "investment-portfolio", name: "Investment Portfolio", icon: "📊",
    description: "Portfolio creation, asset allocation, rebalancing, valuation, and reporting",
    color: "#c678dd",
    subcategories: [
      { id: "portfolio-creation",     name: "Portfolio Creation",     description: "Set up new investment portfolios",            parentId: "investment-portfolio" },
      { id: "asset-allocation",       name: "Asset Allocation",       description: "Distribute assets across investment classes", parentId: "investment-portfolio" },
      { id: "portfolio-rebalancing",  name: "Portfolio Rebalancing",  description: "Adjust portfolio weights to target allocation",parentId: "investment-portfolio" },
      { id: "portfolio-valuation",    name: "Portfolio Valuation",    description: "Calculate current portfolio market value",     parentId: "investment-portfolio" },
      { id: "portfolio-reporting",    name: "Portfolio Reporting",    description: "Generate investment performance reports",      parentId: "investment-portfolio" },
    ],
  },
  {
    id: "trading-operations", name: "Trading Operations", icon: "📈",
    description: "Equity and bond orders, order lifecycle, settlement, and cancellation",
    color: "#56b6c2",
    subcategories: [
      { id: "equity-orders",      name: "Equity Orders",      description: "Buy and sell equity instruments",           parentId: "trading-operations" },
      { id: "bond-orders",        name: "Bond Orders",        description: "Buy and sell fixed-income instruments",     parentId: "trading-operations" },
      { id: "order-lifecycle",    name: "Order Lifecycle",    description: "Track orders from creation to execution",   parentId: "trading-operations" },
      { id: "trade-settlement",   name: "Trade Settlement",   description: "Settle executed trades and update holdings", parentId: "trading-operations" },
      { id: "trade-cancellation", name: "Trade Cancellation", description: "Cancel and reverse trades",                 parentId: "trading-operations" },
    ],
  },
  {
    id: "compliance-kyc", name: "Compliance & KYC", icon: "🛡️",
    description: "KYC updates, AML checks, document verification, risk classification, regulatory reporting",
    color: "#e06c75",
    subcategories: [
      { id: "kyc-updates",           name: "KYC Updates",           description: "Update Know Your Customer records",             parentId: "compliance-kyc" },
      { id: "aml-checks",            name: "AML Checks",            description: "Anti-money laundering screening and alerts",    parentId: "compliance-kyc" },
      { id: "document-verification",  name: "Document Verification", description: "Verify identity and compliance documents",     parentId: "compliance-kyc" },
      { id: "risk-classification",    name: "Risk Classification",   description: "Classify clients and transactions by risk",    parentId: "compliance-kyc" },
      { id: "regulatory-reporting",   name: "Regulatory Reporting",  description: "Generate FINMA, MiFID, and CRS reports",       parentId: "compliance-kyc" },
    ],
  },
  {
    id: "corporate-actions", name: "Corporate Actions", icon: "🏢",
    description: "Dividend distribution, stock splits, maturity processing, coupon payments",
    color: "#d19a66",
    subcategories: [
      { id: "dividend-distribution", name: "Dividend Distribution", description: "Process and distribute dividends to holders",  parentId: "corporate-actions" },
      { id: "stock-split",           name: "Stock Split",           description: "Handle stock split and reverse split events",  parentId: "corporate-actions" },
      { id: "maturity-processing",   name: "Maturity Processing",   description: "Process bond and instrument maturities",       parentId: "corporate-actions" },
      { id: "coupon-payments",       name: "Coupon Payments",       description: "Process fixed-income coupon distributions",    parentId: "corporate-actions" },
      { id: "asset-adjustments",     name: "Asset Adjustments",     description: "Corporate event adjustments to positions",     parentId: "corporate-actions" },
    ],
  },
  {
    id: "lending-credit", name: "Lending & Credit", icon: "💳",
    description: "Loan creation, credit checks, collateral management, repayment, and closure",
    color: "#be5046",
    subcategories: [
      { id: "loan-creation",         name: "Loan Creation",         description: "Originate new loans and credit facilities",    parentId: "lending-credit" },
      { id: "credit-checks",         name: "Credit Checks",         description: "Run creditworthiness assessments",             parentId: "lending-credit" },
      { id: "collateral-management", name: "Collateral Management", description: "Manage and value collateral assets",           parentId: "lending-credit" },
      { id: "loan-repayment",        name: "Loan Repayment",        description: "Process scheduled and early repayments",       parentId: "lending-credit" },
      { id: "loan-closure",          name: "Loan Closure",          description: "Close loans and release collateral",           parentId: "lending-credit" },
    ],
  },
  {
    id: "reporting-monitoring", name: "Reporting & Monitoring", icon: "📋",
    description: "Client statements, portfolio reports, activity logs, audit trails",
    color: "#818cf8",
    subcategories: [
      { id: "client-statements",     name: "Client Statements",     description: "Generate periodic client account statements",  parentId: "reporting-monitoring" },
      { id: "portfolio-reports",     name: "Portfolio Reports",     description: "Generate investment portfolio summaries",       parentId: "reporting-monitoring" },
      { id: "account-activity",      name: "Account Activity",      description: "Track and report account transaction history", parentId: "reporting-monitoring" },
      { id: "audit-logs",            name: "Audit Logs",            description: "Access and review system audit trails",        parentId: "reporting-monitoring" },
      { id: "operational-metrics",   name: "Operational Metrics",   description: "Monitor system performance and SLA metrics",   parentId: "reporting-monitoring" },
    ],
  },
  {
    id: "operational-maintenance", name: "Operational Maintenance", icon: "⚙️",
    description: "Data maintenance, batch processing, system monitoring, error recovery",
    color: "#8b949e",
    subcategories: [
      { id: "data-maintenance",      name: "Data Maintenance",      description: "Clean, migrate, and maintain data quality",    parentId: "operational-maintenance" },
      { id: "batch-processing",      name: "Batch Processing",      description: "Run batch jobs for end-of-day processing",     parentId: "operational-maintenance" },
      { id: "system-monitoring",     name: "System Monitoring",     description: "Monitor API health and system availability",   parentId: "operational-maintenance" },
      { id: "error-recovery",        name: "Error Recovery",        description: "Handle and recover from system errors",        parentId: "operational-maintenance" },
      { id: "operational-controls",  name: "Operational Controls",  description: "Manage system flags, toggles, and configs",    parentId: "operational-maintenance" },
    ],
  },
];

// ─── BANKING VALIDATION RULES ────────────────────────────────

function validateIBAN(value: any): ValidationResult {
  if (typeof value !== "string") return { valid: false, message: "IBAN must be a string" };
  const clean = value.replace(/\s/g, "").toUpperCase();
  if (clean.length < 15 || clean.length > 34) return { valid: false, message: `IBAN length ${clean.length} invalid (15-34 expected)` };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) return { valid: false, message: "IBAN format invalid: must start with 2 letters + 2 digits" };
  return { valid: true, message: "IBAN format valid" };
}

function validateBIC(value: any): ValidationResult {
  if (typeof value !== "string") return { valid: false, message: "BIC must be a string" };
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.toUpperCase())) {
    return { valid: false, message: "BIC format invalid (expected 8 or 11 alphanumeric chars)" };
  }
  return { valid: true, message: "BIC format valid" };
}

function validateAmount(value: any): ValidationResult {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n) || n < 0) return { valid: false, message: "Amount must be a non-negative number" };
  if (n > 999_999_999.99) return { valid: false, message: "Amount exceeds maximum (999,999,999.99)" };
  return { valid: true, message: "Amount valid" };
}

function validateCurrency(value: any): ValidationResult {
  const VALID_CCYS = new Set(["CHF","EUR","USD","GBP","JPY","SGD","HKD","CAD","AUD","SEK","NOK","DKK"]);
  if (!VALID_CCYS.has(String(value).toUpperCase())) {
    return { valid: false, message: `Unknown currency: ${value}`, details: `Supported: ${[...VALID_CCYS].join(", ")}` };
  }
  return { valid: true, message: "Currency valid" };
}

function validateDate(value: any): ValidationResult {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(value))) return { valid: false, message: "Date must be ISO format (YYYY-MM-DD)" };
  const d = new Date(value);
  if (isNaN(d.getTime())) return { valid: false, message: "Invalid date" };
  return { valid: true, message: "Date valid" };
}

function validateClientId(value: any): ValidationResult {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(n) || n < 1) return { valid: false, message: "Client ID must be a positive integer" };
  return { valid: true, message: "Client ID valid" };
}

function validateRiskClass(value: any): ValidationResult {
  const VALID = new Set(["LOW","MEDIUM","HIGH","VERY_HIGH"]);
  if (!VALID.has(String(value).toUpperCase())) {
    return { valid: false, message: `Invalid risk class: ${value}`, details: "Expected: LOW, MEDIUM, HIGH, VERY_HIGH" };
  }
  return { valid: true, message: "Risk class valid" };
}

function validateISIN(value: any): ValidationResult {
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(String(value).toUpperCase())) {
    return { valid: false, message: "ISIN format invalid (2 letters + 9 alphanumeric + 1 check digit)" };
  }
  return { valid: true, message: "ISIN format valid" };
}

// ─── BANKING BUSINESS RULESETS ───────────────────────────────

const BANKING_RULESETS: BusinessRuleset[] = [
  {
    id: "rs-payment-limits", name: "Payment Limits & Controls", category: "payments-transfers",
    description: "Business rules governing payment amounts, frequencies, and authorization thresholds",
    rules: [
      {
        id: "r-pay-001", name: "Single Transaction Limit",
        description: "Single payment must not exceed CHF 1,000,000 without dual authorization",
        condition: "Payment amount > CHF 1,000,000", action: "Require dual authorization",
        severity: "warning",
        evaluate: (data: any) => {
          const amt = parseFloat(data?.amount || 0);
          return amt > 1_000_000
            ? { passed: false, message: `Amount ${amt.toLocaleString()} exceeds single-tx limit of 1,000,000`, severity: "warning" as const }
            : { passed: true, message: "Amount within single-tx limit", severity: "info" as const };
        },
      },
      {
        id: "r-pay-002", name: "Cross-Border Compliance",
        description: "Cross-border payments require valid BIC and beneficiary IBAN",
        condition: "Payment destination is foreign", action: "Validate BIC + IBAN presence",
        severity: "error",
        evaluate: (data: any) => {
          if (!data?.crossBorder) return { passed: true, message: "Domestic payment — no extra validation", severity: "info" as const };
          const hasBic = !!data.bic;
          const hasIban = !!data.iban;
          return hasBic && hasIban
            ? { passed: true, message: "Cross-border: BIC and IBAN present", severity: "info" as const }
            : { passed: false, message: `Cross-border payment missing: ${!hasBic ? "BIC " : ""}${!hasIban ? "IBAN" : ""}`, severity: "error" as const };
        },
      },
      {
        id: "r-pay-003", name: "Weekend/Holiday Check",
        description: "Payments on non-business days are queued for next business day",
        condition: "Payment date falls on weekend or holiday", action: "Queue for next business day",
        severity: "info",
        evaluate: (data: any) => {
          const d = new Date(data?.valueDate || new Date());
          const day = d.getDay();
          return day === 0 || day === 6
            ? { passed: false, message: `Value date ${d.toISOString().slice(0, 10)} is a ${day === 0 ? "Sunday" : "Saturday"} — will be queued`, severity: "info" as const }
            : { passed: true, message: "Value date is a business day", severity: "info" as const };
        },
      },
    ],
  },
  {
    id: "rs-kyc-aml", name: "KYC & AML Compliance", category: "compliance-kyc",
    description: "Know Your Customer and Anti-Money Laundering rules",
    rules: [
      {
        id: "r-kyc-001", name: "KYC Expiry Check",
        description: "KYC documentation must be renewed within 365 days of last review",
        condition: "Days since last KYC review > 365", action: "Flag for KYC renewal",
        severity: "warning",
        evaluate: (data: any) => {
          const lastReview = data?.lastKycReview ? new Date(data.lastKycReview) : null;
          if (!lastReview) return { passed: false, message: "No KYC review date on record", severity: "error" as const };
          const daysSince = Math.floor((Date.now() - lastReview.getTime()) / 86400000);
          return daysSince > 365
            ? { passed: false, message: `KYC expired: last review was ${daysSince} days ago`, severity: "warning" as const }
            : { passed: true, message: `KYC current: last review ${daysSince} days ago`, severity: "info" as const };
        },
      },
      {
        id: "r-kyc-002", name: "High-Risk Country Screening",
        description: "Transactions involving FATF high-risk countries require enhanced due diligence",
        condition: "Country is on FATF high-risk list", action: "Trigger enhanced due diligence",
        severity: "critical",
        evaluate: (data: any) => {
          const HIGH_RISK = new Set(["KP","IR","MM","SY","YE","AF"]);
          const country = String(data?.country || "").toUpperCase().slice(0, 2);
          return HIGH_RISK.has(country)
            ? { passed: false, message: `High-risk country detected: ${country} — enhanced due diligence required`, severity: "critical" as const }
            : { passed: true, message: "Country not on FATF high-risk list", severity: "info" as const };
        },
      },
      {
        id: "r-kyc-003", name: "Large Transaction Reporting",
        description: "Transactions above CHF 100,000 must be reported for AML purposes",
        condition: "Transaction amount > 100,000", action: "Generate suspicious activity report",
        severity: "warning",
        evaluate: (data: any) => {
          const amt = parseFloat(data?.amount || 0);
          return amt > 100_000
            ? { passed: false, message: `Amount ${amt.toLocaleString()} triggers AML reporting threshold (100,000)`, severity: "warning" as const }
            : { passed: true, message: "Amount below AML reporting threshold", severity: "info" as const };
        },
      },
    ],
  },
  {
    id: "rs-account-rules", name: "Account Management Rules", category: "account-lifecycle",
    description: "Business rules for account opening, maintenance, and closure",
    rules: [
      {
        id: "r-acc-001", name: "Minimum Balance Requirement",
        description: "Account balance must not drop below minimum threshold for account type",
        condition: "Balance < minimum for account type", action: "Block withdrawal or charge fee",
        severity: "warning",
        evaluate: (data: any) => {
          const balance = parseFloat(data?.balance || 0);
          const minBalance = parseFloat(data?.minBalance || 0);
          return balance < minBalance
            ? { passed: false, message: `Balance ${balance} below minimum ${minBalance}`, severity: "warning" as const }
            : { passed: true, message: "Balance above minimum", severity: "info" as const };
        },
      },
      {
        id: "r-acc-002", name: "Dormant Account Detection",
        description: "Accounts with no activity for 12 months are flagged as dormant",
        condition: "No transactions for 365 days", action: "Flag as dormant, restrict operations",
        severity: "info",
        evaluate: (data: any) => {
          const lastActivity = data?.lastActivityDate ? new Date(data.lastActivityDate) : null;
          if (!lastActivity) return { passed: false, message: "No activity date on record", severity: "info" as const };
          const daysSince = Math.floor((Date.now() - lastActivity.getTime()) / 86400000);
          return daysSince > 365
            ? { passed: false, message: `Account dormant: no activity for ${daysSince} days`, severity: "info" as const }
            : { passed: true, message: `Account active: last activity ${daysSince} days ago`, severity: "info" as const };
        },
      },
    ],
  },
  {
    id: "rs-trading-rules", name: "Trading Compliance Rules", category: "trading-operations",
    description: "Rules governing order placement, execution, and settlement",
    rules: [
      {
        id: "r-trd-001", name: "Order Size Validation",
        description: "Order quantity must be within instrument's lot size constraints",
        condition: "Order qty not multiple of lot size", action: "Reject order",
        severity: "error",
        evaluate: (data: any) => {
          const qty = parseInt(data?.quantity || 0, 10);
          const lotSize = parseInt(data?.lotSize || 1, 10);
          return qty % lotSize !== 0
            ? { passed: false, message: `Quantity ${qty} is not a multiple of lot size ${lotSize}`, severity: "error" as const }
            : { passed: true, message: "Order quantity valid", severity: "info" as const };
        },
      },
      {
        id: "r-trd-002", name: "Market Hours Check",
        description: "Orders can only be placed during market hours or as limit orders",
        condition: "Market is closed AND order is market type", action: "Reject or convert to limit",
        severity: "warning",
        evaluate: (data: any) => {
          const hour = new Date().getUTCHours();
          const marketOpen = hour >= 7 && hour < 17; // Simplified EU hours
          if (data?.orderType === "MARKET" && !marketOpen) {
            return { passed: false, message: "Market order outside trading hours — convert to limit", severity: "warning" as const };
          }
          return { passed: true, message: "Order timing valid", severity: "info" as const };
        },
      },
    ],
  },
  {
    id: "rs-portfolio-rules", name: "Portfolio Management Rules", category: "investment-portfolio",
    description: "Rules for portfolio construction, diversification, and risk limits",
    rules: [
      {
        id: "r-pf-001", name: "Concentration Limit",
        description: "Single position must not exceed 10% of total portfolio value",
        condition: "Position weight > 10%", action: "Flag over-concentration",
        severity: "warning",
        evaluate: (data: any) => {
          const weight = parseFloat(data?.positionWeight || 0);
          return weight > 10
            ? { passed: false, message: `Position weight ${weight}% exceeds 10% concentration limit`, severity: "warning" as const }
            : { passed: true, message: `Position weight ${weight}% within limits`, severity: "info" as const };
        },
      },
    ],
  },
];

// ─── DATA GENERATORS (banking-specific synthetic data) ───────

const BANKING_DATA_GENERATORS: Record<string, () => any> = {
  "client":       () => ({ id: SYNTH.clientId(), firstName: SYNTH.firstName(), lastName: SYNTH.lastName(), email: SYNTH.email(SYNTH.firstName(), SYNTH.lastName()), riskClass: SYNTH.riskClass() }),
  "account":      () => SYNTH.account(),
  "address":      () => SYNTH.address(),
  "iban":         () => SYNTH.iban(),
  "bic":          () => SYNTH.bic(),
  "portfolio":    () => ({ id: SYNTH.portfolio(), clientId: SYNTH.clientId(), currency: SYNTH.currency(), value: SYNTH.amount(10000, 5000000) }),
  "transaction":  () => ({ id: rndInt(100000, 999999), type: SYNTH.txType(), amount: SYNTH.amount(100, 500000), currency: SYNTH.currency(), date: SYNTH.valDate(), status: rndPick(["EXECUTED","PENDING","CANCELLED"]) }),
  "instrument":   () => ({ isin: SYNTH.isin(), name: rndPick(["Nestlé","Roche","UBS","Novartis","Swiss Re","ABB"]), assetClass: SYNTH.assetClass(), currency: SYNTH.currency(), price: rndFloat(10, 5000) }),
  "payment":      () => ({ id: rndInt(100000, 999999), sourceIban: SYNTH.iban(), destIban: SYNTH.iban(), amount: SYNTH.amount(100, 100000), currency: SYNTH.currency(), valueDate: isoDate(rndInt(0, 5)) }),
  "loan":         () => ({ id: rndInt(100000, 999999), clientId: SYNTH.clientId(), amount: SYNTH.amount(10000, 2000000), rate: SYNTH.rate(), maturity: SYNTH.maturity(), currency: SYNTH.currency() }),
};

// ═══════════════════════════════════════════════════════════════
// BANKING CONTEXT — the concrete IndustryContext for Avaloq CAPI
// ═══════════════════════════════════════════════════════════════

export const BankingContext: IndustryContext = {
  id:             "avaloq-banking",
  name:           "Avaloq Core Banking",
  icon:           "🏦",
  description:    "Avaloq CAPI banking domain — client, account, payment, investment, compliance, and operations context for Swiss/European banking",
  categories:     BANKING_CATEGORIES,
  rulesets:       BANKING_RULESETS,
  validators: {
    iban:       validateIBAN,
    bic:        validateBIC,
    amount:     validateAmount,
    currency:   validateCurrency,
    date:       validateDate,
    clientId:   validateClientId,
    riskClass:  validateRiskClass,
    isin:       validateISIN,
  },
  dataGenerators: BANKING_DATA_GENERATORS,
};

// ─── ACTIVE CONTEXT (can be swapped at runtime) ──────────────
let _activeContext: IndustryContext = BankingContext;
export function getActiveContext(): IndustryContext { return _activeContext; }
export function setActiveContext(ctx: IndustryContext) { _activeContext = ctx; }
