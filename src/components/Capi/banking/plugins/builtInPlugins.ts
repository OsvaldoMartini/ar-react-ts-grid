// ═══════════════════════════════════════════════════════════════
// BUILT-IN BANKING PLUGINS
// ═══════════════════════════════════════════════════════════════
// 10 plugins, one per business category from the specification.
// Each contains domain-specific rules and sample test cases.
// Auto-registered with the plugin registry on import.
// ═══════════════════════════════════════════════════════════════

import { pluginRegistry, type CapiPlugin } from "../PluginSystem";
import type { LibraryTestCase, BusinessRule } from "../BankingContext";
import { rndPick, rndInt, isoDate, SYNTH } from "../../utils";

const ts = () => new Date().toISOString();

// ─── HELPER: Build test cases for a subcategory ──────────────
function tc(
  cat: string, sub: string, name: string,
  desc: string, tags: string[],
  params: Record<string, string>,
  steps: { name: string; desc: string }[],
  expected: string, doc: string
): LibraryTestCase {
  return {
    id: `${cat}--${sub}--${name}`.replace(/\s+/g, "-").toLowerCase().slice(0, 80),
    category: cat, subcategory: sub, testName: name,
    businessDescription: desc, tags,
    parameters: params,
    steps: steps.map((s, i) => ({ step: i + 1, name: s.name, businessDescription: s.desc })),
    expectedResult: expected, documentation: doc,
    createdAt: ts(), updatedAt: ts(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. CLIENT MANAGEMENT PLUGIN
// ═══════════════════════════════════════════════════════════════
const clientMgmtPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-client-management", name: "Client Management", version: "1.0.0",
    icon: "👤", description: "Rules and tests for client onboarding, profile updates, address management, closure, and segmentation",
    author: "CAPI Built-in", category: "client-management",
    tags: ["client","onboarding","profile","address","KYC"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [
    {
      id: "r-cl-001", name: "Client Name Required", description: "Every client must have a first and last name",
      condition: "firstName or lastName is empty", action: "Reject client creation", severity: "error",
      evaluate: (d: any) => (!d?.firstName || !d?.name)
        ? { passed: false, message: "Client first name and last name are required", severity: "error" as const }
        : { passed: true, message: "Client name fields present", severity: "info" as const },
    },
    {
      id: "r-cl-002", name: "Email Format Validation", description: "Client email must be a valid format",
      condition: "Email does not match pattern", action: "Flag invalid email", severity: "warning",
      evaluate: (d: any) => {
        if (!d?.email && !d?.elAddr) return { passed: true, message: "No email provided", severity: "info" as const };
        const email = d.email || d.elAddr;
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return valid
          ? { passed: true, message: "Email format valid", severity: "info" as const }
          : { passed: false, message: `Invalid email format: ${email}`, severity: "warning" as const };
      },
    },
    {
      id: "r-cl-003", name: "Duplicate Client Check", description: "New client should not match existing name+DOB",
      condition: "Matching name + date of birth found", action: "Flag potential duplicate", severity: "warning",
      evaluate: (d: any) => ({ passed: true, message: "Duplicate check requires DB lookup — passes in simulation", severity: "info" as const }),
    },
  ],
  validators: {},
  generators: {
    "new-client": () => ({ firstName: SYNTH.firstName(), name: SYNTH.lastName(), firm: SYNTH.firm(), email: SYNTH.email(SYNTH.firstName(), SYNTH.lastName()), riskClass: SYNTH.riskClass() }),
  },
  testCases: [
    tc("Client Management","Client Onboarding","Register new retail client",
      "A new retail banking customer is registered with personal details, contact information, and initial risk classification.",
      ["retail","onboarding","KYC"],
      { CLIENT_FIRST_NAME: "${FIRST_NAME}", CLIENT_LAST_NAME: "${LAST_NAME}", CLIENT_EMAIL: "${EMAIL}", RISK_CLASS: "LOW" },
      [
        { name: "Enter client personal data", desc: "The operator enters the customer's first name, last name, and date of birth." },
        { name: "Add contact information", desc: "A mailing address and email are associated with the new client record." },
        { name: "Assign initial risk class", desc: "The system assigns an initial risk classification based on the client profile." },
        { name: "Verify client creation", desc: "The system confirms the client record was created and returns a unique client ID." },
      ],
      "New client is registered, assigned a unique ID, and appears in the client directory with LOW risk classification.",
      "This test validates the core retail onboarding flow using the obj-addrs and client management APIs."
    ),
    tc("Client Management","Client Onboarding","Onboard corporate client",
      "A corporate client is registered with company details, authorized representatives, and regulatory classification.",
      ["corporate","onboarding","entity"],
      { COMPANY_NAME: "${FIRM}", REPRESENTATIVE: "${CONTACT_NAME}", COUNTRY: "${COUNTRY_CODE}" },
      [
        { name: "Enter company information", desc: "The operator enters the corporate entity name, registration number, and domicile." },
        { name: "Add authorized signatory", desc: "An authorized representative is linked to the corporate client." },
        { name: "Run KYC screening", desc: "The system screens the entity against sanctions and PEP lists." },
        { name: "Confirm registration", desc: "The corporate client is registered and flagged for enhanced due diligence if required." },
      ],
      "Corporate client registered with linked signatory and KYC screening completed.",
      "Tests the corporate onboarding path including entity screening."
    ),
    tc("Client Management","Client Profile Update","Update client address",
      "An existing client's postal address is updated and the old address is archived.",
      ["address","update","obj-addrs"],
      { CLIENT_ID: "${CLIENT_ID}", NEW_STREET: "${STREET}", NEW_CITY: "${CITY}", NEW_ZIP: "${ZIP}" },
      [
        { name: "Retrieve current address", desc: "The system loads the client's existing address record." },
        { name: "Submit updated address", desc: "The operator submits the new street, city, and postal code." },
        { name: "Verify address update", desc: "The system confirms the address was updated and the old address archived." },
      ],
      "Client address is updated successfully and previous address is kept in history.",
      "Validates the PATCH operation on obj-addrs resource."
    ),
    tc("Client Management","Address Management","Create new address for client",
      "A new mailing address is added to an existing client who currently has only a physical address.",
      ["address","create","obj-addrs"],
      { CLIENT_ID: "${CLIENT_ID}", ADDR_TYPE: "MAIL", STREET: "${STREET}", CITY: "${CITY}", COUNTRY: "${COUNTRY_CODE}" },
      [
        { name: "Verify client exists", desc: "The system confirms the client ID is valid and active." },
        { name: "Add new mailing address", desc: "A new address record of type MAIL is created for the client." },
        { name: "Confirm dual addresses", desc: "The system verifies the client now has both PHYS and MAIL addresses." },
      ],
      "New mailing address is created and linked to the client; client now has two address records.",
      "Tests POST on obj-addrs with address type classification."
    ),
    tc("Client Management","Client Closure","Deactivate retail client",
      "A retail client requests account closure. All accounts must be zeroed and the client record deactivated.",
      ["closure","deactivation","retail"],
      { CLIENT_ID: "${CLIENT_ID}" },
      [
        { name: "Check open accounts", desc: "The system retrieves all accounts associated with the client." },
        { name: "Verify zero balances", desc: "All account balances must be zero before closure." },
        { name: "Deactivate client", desc: "The client record is set to inactive status." },
        { name: "Confirm closure", desc: "The system confirms the client is deactivated and no longer appears in active searches." },
      ],
      "Client is deactivated with all accounts closed and zero balances confirmed.",
      "End-to-end client closure workflow."
    ),
    tc("Client Management","Client Segmentation","Classify high-net-worth client",
      "A client with total assets above CHF 1,000,000 is automatically reclassified as a private banking client.",
      ["segmentation","wealth-tier","private-banking"],
      { CLIENT_ID: "${CLIENT_ID}", TOTAL_ASSETS: "${TOTAL_ASSETS}" },
      [
        { name: "Calculate total assets", desc: "The system aggregates all portfolio and account balances for the client." },
        { name: "Apply segmentation rules", desc: "If total assets exceed CHF 1M, the client is classified as Private Banking." },
        { name: "Verify segment change", desc: "The client record reflects the new wealth tier." },
      ],
      "Client is reclassified to Private Banking segment when assets exceed threshold.",
      "Tests the automatic client segmentation based on wealth tier rules."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2. ACCOUNT LIFECYCLE PLUGIN
// ═══════════════════════════════════════════════════════════════
const accountPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-account-lifecycle", name: "Account Lifecycle", version: "1.0.0",
    icon: "🏦", description: "Rules for account opening, funding, balance ops, limits, and closure",
    author: "CAPI Built-in", category: "account-lifecycle",
    tags: ["account","opening","closure","balance","funding"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [
    {
      id: "r-acc-010", name: "Account Currency Required", description: "Every account must have a valid currency code",
      condition: "Currency missing or invalid", action: "Reject account creation", severity: "error",
      evaluate: (d: any) => {
        const ccys = new Set(["CHF","EUR","USD","GBP","JPY","SGD"]);
        return ccys.has(d?.currency) ? { passed: true, message: "Currency valid", severity: "info" as const } : { passed: false, message: `Invalid currency: ${d?.currency}`, severity: "error" as const };
      },
    },
    {
      id: "r-acc-011", name: "Opening Balance Non-Negative", description: "Opening balance cannot be negative",
      condition: "Initial balance < 0", action: "Reject", severity: "error",
      evaluate: (d: any) => parseFloat(d?.balance || 0) < 0
        ? { passed: false, message: "Opening balance cannot be negative", severity: "error" as const }
        : { passed: true, message: "Opening balance valid", severity: "info" as const },
    },
  ],
  validators: {},
  generators: { "account": () => SYNTH.account() },
  testCases: [
    tc("Account Lifecycle","Account Opening","Open CHF savings account",
      "A new CHF savings account is opened for an existing retail client with an initial deposit.",
      ["savings","CHF","opening"],
      { CLIENT_ID: "${CLIENT_ID}", CURRENCY: "CHF", INITIAL_DEPOSIT: "${AMOUNT}", ACCOUNT_TYPE: "SAVINGS" },
      [
        { name: "Verify client eligibility", desc: "Confirm the client is active and eligible for a new account." },
        { name: "Create account", desc: "Open a new CHF savings account linked to the client." },
        { name: "Process initial deposit", desc: "Credit the initial deposit to the new account." },
        { name: "Verify account status", desc: "Confirm the account is active with the correct balance." },
      ],
      "New CHF savings account is created with the initial deposit reflected in the balance.",
      "Standard account opening flow for retail savings."
    ),
    tc("Account Lifecycle","Account Funding","Fund account via wire transfer",
      "An existing account receives an incoming wire transfer and the balance is updated.",
      ["funding","wire","credit"],
      { ACCOUNT_ID: "${ACCOUNT_ID}", AMOUNT: "${AMOUNT}", CURRENCY: "${CURRENCY}", SOURCE_REF: "${WIRE_REF}" },
      [
        { name: "Receive incoming wire", desc: "An external wire transfer is received referencing the account." },
        { name: "Credit account", desc: "The incoming amount is credited to the account." },
        { name: "Verify balance", desc: "The account balance reflects the credited amount." },
      ],
      "Account balance is increased by the wire transfer amount.",
      "Tests incoming wire processing and balance update."
    ),
    tc("Account Lifecycle","Account Balance Operations","Check account balance",
      "Retrieve the current balance of an account and verify it matches expected value.",
      ["balance","inquiry","GET"],
      { ACCOUNT_ID: "${ACCOUNT_ID}" },
      [
        { name: "Request balance", desc: "Query the account balance via the account API." },
        { name: "Verify balance format", desc: "Confirm the response includes balance, currency, and as-of date." },
      ],
      "Account balance is returned with correct currency and timestamp.",
      "Basic balance inquiry test."
    ),
    tc("Account Lifecycle","Account Limits","Set daily withdrawal limit",
      "Set a daily withdrawal limit on an account and verify it is enforced.",
      ["limits","withdrawal","daily"],
      { ACCOUNT_ID: "${ACCOUNT_ID}", DAILY_LIMIT: "${LIMIT_AMOUNT}" },
      [
        { name: "Set withdrawal limit", desc: "Configure a daily withdrawal limit on the account." },
        { name: "Attempt within-limit withdrawal", desc: "Withdraw an amount within the daily limit." },
        { name: "Attempt over-limit withdrawal", desc: "Attempt a withdrawal exceeding the limit and verify it is blocked." },
      ],
      "Withdrawals within the limit succeed; withdrawals exceeding the limit are rejected.",
      "Tests limit enforcement logic."
    ),
    tc("Account Lifecycle","Account Closure","Close zero-balance account",
      "An account with zero balance is closed and archived.",
      ["closure","archive"],
      { ACCOUNT_ID: "${ACCOUNT_ID}" },
      [
        { name: "Verify zero balance", desc: "Confirm the account balance is exactly zero." },
        { name: "Close account", desc: "Submit account closure request." },
        { name: "Verify closure", desc: "Confirm the account status is CLOSED and no further operations are possible." },
      ],
      "Account is closed and marked as archived in the system.",
      "Standard account closure for zero-balance accounts."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 3. PAYMENTS & TRANSFERS PLUGIN
// ═══════════════════════════════════════════════════════════════
const paymentsPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-payments-transfers", name: "Payments & Transfers", version: "1.0.0",
    icon: "💸", description: "Internal transfers, SEPA/SWIFT payments, scheduled payments, validation, and reconciliation",
    author: "CAPI Built-in", category: "payments-transfers",
    tags: ["payment","transfer","SEPA","SWIFT","reconciliation"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [
    {
      id: "r-pay-010", name: "Sufficient Funds Check", description: "Source account must have sufficient balance for the transfer",
      condition: "Available balance < transfer amount", action: "Reject payment", severity: "error",
      evaluate: (d: any) => {
        const bal = parseFloat(d?.sourceBalance || 0);
        const amt = parseFloat(d?.amount || 0);
        return bal < amt
          ? { passed: false, message: `Insufficient funds: balance ${bal} < amount ${amt}`, severity: "error" as const }
          : { passed: true, message: "Sufficient funds", severity: "info" as const };
      },
    },
    {
      id: "r-pay-011", name: "Same-Currency Transfer", description: "Source and destination accounts must share the same currency unless FX is enabled",
      condition: "Currencies differ and FX not enabled", action: "Reject or route to FX desk", severity: "warning",
      evaluate: (d: any) => {
        if (d?.sourceCurrency && d?.destCurrency && d.sourceCurrency !== d.destCurrency && !d.fxEnabled) {
          return { passed: false, message: `Currency mismatch: ${d.sourceCurrency} → ${d.destCurrency}, FX not enabled`, severity: "warning" as const };
        }
        return { passed: true, message: "Currency match OK", severity: "info" as const };
      },
    },
  ],
  validators: {},
  generators: { "payment": () => ({ sourceIban: SYNTH.iban(), destIban: SYNTH.iban(), amount: SYNTH.amount(100, 50000), currency: SYNTH.currency(), valueDate: isoDate(rndInt(0, 5)) }) },
  testCases: [
    tc("Payments & Transfers","Internal Transfers","Transfer between two retail accounts",
      "Verify that a customer can transfer funds between two internal accounts and that balances are updated correctly.",
      ["retail","transfer","balance"],
      { ACCOUNT_SOURCE: "${ACCOUNT_SOURCE}", ACCOUNT_DEST: "${ACCOUNT_DEST}", TRANSFER_AMOUNT: "${TRANSFER_AMOUNT}", CURRENCY: "EUR" },
      [
        { name: "Retrieve source account balance", desc: "The system verifies the available balance of the customer's account before executing the transfer." },
        { name: "Execute transfer", desc: "Funds are transferred between the two accounts using the internal transfer service." },
        { name: "Validate balances", desc: "The system confirms that the debit and credit were applied correctly." },
      ],
      "The transfer is executed successfully and both account balances are updated.",
      "This test validates the internal transfer process for retail banking customers."
    ),
    tc("Payments & Transfers","External Payments","Send SEPA payment",
      "Execute a SEPA credit transfer to a beneficiary in the Eurozone.",
      ["SEPA","external","EUR"],
      { SOURCE_IBAN: "${SOURCE_IBAN}", DEST_IBAN: "${DEST_IBAN}", AMOUNT: "${AMOUNT}", BIC: "${BIC}" },
      [
        { name: "Validate beneficiary IBAN", desc: "The system validates the destination IBAN format." },
        { name: "Check SEPA eligibility", desc: "Confirm both IBANs belong to SEPA-participating countries." },
        { name: "Execute SEPA transfer", desc: "The SEPA credit transfer is submitted to the clearing system." },
        { name: "Confirm settlement", desc: "The payment status is confirmed as settled within T+1." },
      ],
      "SEPA payment is executed and confirmed within one business day.",
      "Tests the SEPA payment flow including IBAN validation and settlement."
    ),
    tc("Payments & Transfers","Scheduled Payments","Create standing order",
      "Set up a recurring monthly payment from a client account.",
      ["standing-order","scheduled","recurring"],
      { ACCOUNT_ID: "${ACCOUNT_ID}", DEST_IBAN: "${DEST_IBAN}", AMOUNT: "${AMOUNT}", FREQUENCY: "MONTHLY", START_DATE: "${START_DATE}" },
      [
        { name: "Define standing order", desc: "Create a new recurring payment instruction with monthly frequency." },
        { name: "Verify first execution", desc: "Confirm the first payment is scheduled for the start date." },
        { name: "Verify recurrence", desc: "Confirm subsequent payments are scheduled at the correct intervals." },
      ],
      "Standing order is created and scheduled payments are visible in the payment calendar.",
      "Tests standing order creation and scheduling logic."
    ),
    tc("Payments & Transfers","Payment Validation","Reject payment exceeding daily limit",
      "A payment that exceeds the account's daily transaction limit is rejected.",
      ["validation","limit","rejection"],
      { ACCOUNT_ID: "${ACCOUNT_ID}", AMOUNT: "${LARGE_AMOUNT}", DAILY_LIMIT: "${DAILY_LIMIT}" },
      [
        { name: "Submit payment", desc: "Attempt to process a payment exceeding the daily limit." },
        { name: "Verify rejection", desc: "Confirm the system rejects the payment with an appropriate error." },
        { name: "Verify balance unchanged", desc: "Confirm the source account balance was not debited." },
      ],
      "Payment is rejected and source balance remains unchanged.",
      "Tests the daily limit enforcement for payments."
    ),
    tc("Payments & Transfers","Payment Reconciliation","Reconcile daily payments",
      "Match all outgoing payments of the day with settlement confirmations.",
      ["reconciliation","daily","matching"],
      { SETTLEMENT_DATE: "${DATE}" },
      [
        { name: "Retrieve day's payments", desc: "Load all payments processed on the settlement date." },
        { name: "Match with confirmations", desc: "Cross-reference each payment with clearing system confirmations." },
        { name: "Flag unmatched", desc: "Identify any payments without matching confirmations." },
      ],
      "All payments are matched with confirmations; unmatched items are flagged for investigation.",
      "Tests end-of-day payment reconciliation flow."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 4. INVESTMENT PORTFOLIO PLUGIN
// ═══════════════════════════════════════════════════════════════
const investmentPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-investment-portfolio", name: "Investment Portfolio", version: "1.0.0",
    icon: "📊", description: "Portfolio creation, asset allocation, rebalancing, valuation, and performance reporting",
    author: "CAPI Built-in", category: "investment-portfolio",
    tags: ["portfolio","investment","allocation","rebalancing","valuation"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [
    {
      id: "r-inv-001", name: "Portfolio Diversification", description: "Portfolio must contain at least 3 different asset classes",
      condition: "Fewer than 3 asset classes", action: "Flag under-diversified", severity: "warning",
      evaluate: (d: any) => {
        const classes = new Set(Array.isArray(d?.positions) ? d.positions.map((p: any) => p.assetClass) : []);
        return classes.size < 3
          ? { passed: false, message: `Only ${classes.size} asset class(es) — minimum 3 recommended`, severity: "warning" as const }
          : { passed: true, message: `Diversified across ${classes.size} asset classes`, severity: "info" as const };
      },
    },
  ],
  validators: {},
  generators: { "portfolio": () => ({ id: SYNTH.portfolio(), clientId: SYNTH.clientId(), currency: SYNTH.currency(), value: SYNTH.amount(50000, 5000000) }) },
  testCases: [
    tc("Investment Portfolio","Portfolio Creation","Create balanced portfolio",
      "Create a new portfolio with a balanced allocation across equity, bonds, and cash.",
      ["portfolio","balanced","creation"],
      { CLIENT_ID: "${CLIENT_ID}", PORTFOLIO_CURRENCY: "CHF", INITIAL_VALUE: "${AMOUNT}" },
      [
        { name: "Create portfolio", desc: "Set up a new investment portfolio for the client." },
        { name: "Allocate assets", desc: "Distribute the initial value across equity (60%), bonds (30%), and cash (10%)." },
        { name: "Verify allocation", desc: "Confirm the portfolio reflects the target allocation." },
      ],
      "New portfolio created with balanced allocation matching the target weights.",
      "Tests portfolio creation and initial allocation."
    ),
    tc("Investment Portfolio","Asset Allocation","Change target allocation",
      "Modify the target allocation of an existing portfolio from balanced to growth.",
      ["allocation","growth","rebalance"],
      { PORTFOLIO_ID: "${PORTFOLIO_ID}", EQUITY_TARGET: "80", BOND_TARGET: "15", CASH_TARGET: "5" },
      [
        { name: "Load current allocation", desc: "Retrieve the portfolio's current target and actual allocations." },
        { name: "Set new targets", desc: "Update the target to growth profile (80% equity, 15% bonds, 5% cash)." },
        { name: "Verify targets saved", desc: "Confirm the new targets are stored and a rebalancing proposal is generated." },
      ],
      "Portfolio target allocation is updated to growth profile.",
      "Tests target allocation modification."
    ),
    tc("Investment Portfolio","Portfolio Valuation","Calculate mark-to-market value",
      "Calculate the total market value of a portfolio using current prices.",
      ["valuation","mark-to-market","pricing"],
      { PORTFOLIO_ID: "${PORTFOLIO_ID}" },
      [
        { name: "Retrieve positions", desc: "Load all positions in the portfolio with current quantities." },
        { name: "Fetch market prices", desc: "Get the latest market price for each instrument." },
        { name: "Calculate total value", desc: "Sum (quantity × price) across all positions." },
        { name: "Verify valuation", desc: "Confirm the total matches expected value within tolerance." },
      ],
      "Portfolio total market value is calculated and matches the sum of position values.",
      "Tests mark-to-market valuation logic."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 5. TRADING OPERATIONS PLUGIN
// ═══════════════════════════════════════════════════════════════
const tradingPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-trading-operations", name: "Trading Operations", version: "1.0.0",
    icon: "📈", description: "Equity/bond order placement, lifecycle tracking, settlement, and cancellation",
    author: "CAPI Built-in", category: "trading-operations",
    tags: ["trading","equity","bond","order","settlement"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [
    {
      id: "r-trd-010", name: "Minimum Order Amount", description: "Orders must meet minimum notional value",
      condition: "Order notional < minimum", action: "Reject order", severity: "error",
      evaluate: (d: any) => {
        const notional = (parseFloat(d?.quantity || 0)) * (parseFloat(d?.price || 0));
        return notional < 100
          ? { passed: false, message: `Order notional ${notional} below minimum 100`, severity: "error" as const }
          : { passed: true, message: `Order notional ${notional} OK`, severity: "info" as const };
      },
    },
  ],
  validators: {},
  generators: {},
  testCases: [
    tc("Trading Operations","Equity Orders","Place market buy order",
      "Submit a market buy order for equity shares and verify execution.",
      ["equity","buy","market-order"],
      { PORTFOLIO_ID: "${PORTFOLIO_ID}", ISIN: "${ISIN}", QUANTITY: "${QTY}", ORDER_TYPE: "MARKET" },
      [
        { name: "Submit buy order", desc: "Place a market buy order for the specified equity instrument." },
        { name: "Verify order accepted", desc: "Confirm the order is accepted and assigned an order ID." },
        { name: "Verify execution", desc: "Confirm the order is executed and shares are added to the portfolio." },
      ],
      "Market buy order is executed and portfolio holdings are updated.",
      "Tests the equity market order flow."
    ),
    tc("Trading Operations","Bond Orders","Buy government bond",
      "Purchase a government bond for a fixed-income portfolio.",
      ["bond","buy","fixed-income"],
      { PORTFOLIO_ID: "${PORTFOLIO_ID}", ISIN: "${ISIN}", FACE_VALUE: "${FACE_VALUE}" },
      [
        { name: "Submit bond order", desc: "Place a buy order for a government bond." },
        { name: "Verify settlement", desc: "Confirm T+2 settlement and bond appears in holdings." },
      ],
      "Government bond is purchased and settled into the portfolio.",
      "Tests bond purchase and settlement."
    ),
    tc("Trading Operations","Trade Cancellation","Cancel pending order",
      "Cancel a pending limit order before execution.",
      ["cancel","limit-order","pending"],
      { ORDER_ID: "${ORDER_ID}" },
      [
        { name: "Retrieve pending order", desc: "Load the pending order details." },
        { name: "Submit cancellation", desc: "Request cancellation of the pending order." },
        { name: "Verify cancellation", desc: "Confirm the order status is CANCELLED and no execution occurred." },
      ],
      "Pending order is cancelled without any execution.",
      "Tests order cancellation flow."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 6. COMPLIANCE & KYC PLUGIN
// ═══════════════════════════════════════════════════════════════
const compliancePlugin: CapiPlugin = {
  metadata: {
    id: "plugin-compliance-kyc", name: "Compliance & KYC", version: "1.0.0",
    icon: "🛡️", description: "KYC updates, AML screening, document verification, risk classification, regulatory reporting",
    author: "CAPI Built-in", category: "compliance-kyc",
    tags: ["KYC","AML","compliance","sanctions","FINMA"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [
    {
      id: "r-kyc-010", name: "PEP Screening", description: "All new clients must be screened against PEP lists",
      condition: "Client onboarding without PEP check", action: "Block until screening completed", severity: "critical",
      evaluate: (d: any) => {
        return d?.pepScreened
          ? { passed: true, message: "PEP screening completed", severity: "info" as const }
          : { passed: false, message: "PEP screening not completed — required for onboarding", severity: "critical" as const };
      },
    },
  ],
  validators: {},
  generators: {},
  testCases: [
    tc("Compliance & KYC","KYC Updates","Renew client KYC",
      "Renew a client's KYC documentation that is approaching expiry.",
      ["KYC","renewal","documentation"],
      { CLIENT_ID: "${CLIENT_ID}", DOCUMENT_TYPE: "PASSPORT", EXPIRY_DATE: "${EXPIRY_DATE}" },
      [
        { name: "Identify expiring KYC", desc: "The system flags clients with KYC documentation expiring within 30 days." },
        { name: "Upload new documents", desc: "Updated identification documents are submitted." },
        { name: "Verify renewal", desc: "KYC status is updated with new expiry date." },
      ],
      "Client KYC is renewed with updated documentation and new expiry date.",
      "Tests KYC renewal workflow."
    ),
    tc("Compliance & KYC","AML Checks","Screen high-value transaction",
      "Run AML screening on a transaction exceeding the reporting threshold.",
      ["AML","screening","high-value"],
      { TRANSACTION_ID: "${TX_ID}", AMOUNT: "${AMOUNT}", THRESHOLD: "100000" },
      [
        { name: "Detect threshold breach", desc: "The system identifies the transaction exceeds the AML reporting threshold." },
        { name: "Run sanctions screening", desc: "The counterparty is screened against sanctions databases." },
        { name: "Generate SAR if needed", desc: "A Suspicious Activity Report is generated if screening returns matches." },
      ],
      "Transaction is screened and appropriate reports are generated.",
      "Tests AML screening for high-value transactions."
    ),
    tc("Compliance & KYC","Risk Classification","Reclassify client risk level",
      "A client's risk classification is updated based on new transaction patterns.",
      ["risk","classification","upgrade"],
      { CLIENT_ID: "${CLIENT_ID}", NEW_RISK_CLASS: "HIGH" },
      [
        { name: "Analyze transaction patterns", desc: "Review client's recent transaction history for risk indicators." },
        { name: "Apply risk model", desc: "Run the risk scoring model on the updated data." },
        { name: "Update classification", desc: "Client's risk class is updated to the new level." },
      ],
      "Client risk classification is updated based on transaction analysis.",
      "Tests risk reclassification workflow."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 7. CORPORATE ACTIONS PLUGIN
// ═══════════════════════════════════════════════════════════════
const corporatePlugin: CapiPlugin = {
  metadata: {
    id: "plugin-corporate-actions", name: "Corporate Actions", version: "1.0.0",
    icon: "🏢", description: "Dividend distribution, stock splits, maturity processing, coupon payments",
    author: "CAPI Built-in", category: "corporate-actions",
    tags: ["dividend","split","maturity","coupon","corporate"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [],
  validators: {},
  generators: {},
  testCases: [
    tc("Corporate Actions","Dividend Distribution","Process cash dividend",
      "Distribute a cash dividend to all holders of an equity instrument.",
      ["dividend","cash","distribution"],
      { ISIN: "${ISIN}", DIVIDEND_PER_SHARE: "${DPS}", RECORD_DATE: "${RECORD_DATE}" },
      [
        { name: "Identify holders", desc: "Determine all portfolios holding the instrument on the record date." },
        { name: "Calculate entitlements", desc: "Compute dividend amount per holder based on their position size." },
        { name: "Process payments", desc: "Credit dividend amounts to each holder's cash account." },
        { name: "Verify distributions", desc: "Confirm all dividend payments match expected calculations." },
      ],
      "Cash dividends are credited correctly to all eligible holders.",
      "Tests dividend distribution across multiple portfolios."
    ),
    tc("Corporate Actions","Stock Split","Process 2:1 stock split",
      "Handle a 2:1 stock split for an equity instrument across all affected portfolios.",
      ["split","equity","position-adjustment"],
      { ISIN: "${ISIN}", SPLIT_RATIO: "2:1", EFFECTIVE_DATE: "${DATE}" },
      [
        { name: "Identify affected positions", desc: "Find all portfolios holding the instrument." },
        { name: "Apply split ratio", desc: "Double the quantity and halve the cost basis per share." },
        { name: "Verify positions", desc: "Confirm all positions reflect the new quantities and prices." },
      ],
      "Stock split is applied and all positions reflect doubled quantities at halved prices.",
      "Tests stock split processing logic."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 8. LENDING & CREDIT PLUGIN
// ═══════════════════════════════════════════════════════════════
const lendingPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-lending-credit", name: "Lending & Credit", version: "1.0.0",
    icon: "💳", description: "Loan origination, credit assessment, collateral management, repayment, and closure",
    author: "CAPI Built-in", category: "lending-credit",
    tags: ["loan","credit","collateral","repayment","mortgage"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [
    {
      id: "r-ln-001", name: "Debt-to-Income Ratio", description: "DTI must not exceed 40% for new loans",
      condition: "DTI > 40%", action: "Reject loan application", severity: "error",
      evaluate: (d: any) => {
        const dti = parseFloat(d?.dtiRatio || 0);
        return dti > 40
          ? { passed: false, message: `DTI ratio ${dti}% exceeds maximum 40%`, severity: "error" as const }
          : { passed: true, message: `DTI ratio ${dti}% within limits`, severity: "info" as const };
      },
    },
  ],
  validators: {},
  generators: {},
  testCases: [
    tc("Lending & Credit","Loan Creation","Originate personal loan",
      "Create a new personal loan for an eligible client.",
      ["loan","personal","origination"],
      { CLIENT_ID: "${CLIENT_ID}", LOAN_AMOUNT: "${AMOUNT}", TERM_MONTHS: "36", RATE: "${RATE}" },
      [
        { name: "Check eligibility", desc: "Verify the client meets lending criteria." },
        { name: "Run credit check", desc: "Assess the client's creditworthiness." },
        { name: "Create loan", desc: "Originate the loan with specified terms." },
        { name: "Disburse funds", desc: "Credit the loan amount to the client's account." },
      ],
      "Personal loan is created and funds are disbursed to the client.",
      "Tests end-to-end loan origination."
    ),
    tc("Lending & Credit","Loan Repayment","Process monthly repayment",
      "Process a scheduled monthly loan repayment.",
      ["repayment","monthly","scheduled"],
      { LOAN_ID: "${LOAN_ID}", INSTALLMENT_AMOUNT: "${AMOUNT}" },
      [
        { name: "Calculate installment", desc: "Compute the principal and interest components." },
        { name: "Debit account", desc: "Debit the repayment amount from the client's account." },
        { name: "Update loan balance", desc: "Reduce the outstanding loan balance." },
      ],
      "Monthly repayment is processed and loan balance is reduced.",
      "Tests scheduled repayment processing."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 9. REPORTING & MONITORING PLUGIN
// ═══════════════════════════════════════════════════════════════
const reportingPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-reporting-monitoring", name: "Reporting & Monitoring", version: "1.0.0",
    icon: "📋", description: "Client statements, portfolio reports, activity logs, audit trails, operational metrics",
    author: "CAPI Built-in", category: "reporting-monitoring",
    tags: ["reporting","statements","audit","monitoring","metrics"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [],
  validators: {},
  generators: {},
  testCases: [
    tc("Reporting & Monitoring","Client Statements","Generate monthly statement",
      "Generate a monthly account statement for a retail client.",
      ["statement","monthly","retail"],
      { CLIENT_ID: "${CLIENT_ID}", PERIOD: "${YEAR_MONTH}" },
      [
        { name: "Retrieve transactions", desc: "Load all account transactions for the specified month." },
        { name: "Generate statement", desc: "Compile the statement with opening/closing balances and transaction details." },
        { name: "Verify format", desc: "Confirm the statement contains all required sections." },
      ],
      "Monthly statement is generated with correct balances and transaction history.",
      "Tests monthly statement generation."
    ),
    tc("Reporting & Monitoring","Audit Logs","Retrieve audit trail for client",
      "Access the full audit trail of operations performed on a client record.",
      ["audit","trail","compliance"],
      { CLIENT_ID: "${CLIENT_ID}", DATE_FROM: "${DATE_FROM}", DATE_TO: "${DATE_TO}" },
      [
        { name: "Query audit log", desc: "Retrieve all operations logged against the client ID within the date range." },
        { name: "Verify completeness", desc: "Confirm all known operations appear in the audit trail." },
      ],
      "Complete audit trail is returned with timestamps, operators, and operation details.",
      "Tests audit log retrieval and completeness."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// 10. OPERATIONAL MAINTENANCE PLUGIN
// ═══════════════════════════════════════════════════════════════
const operationsPlugin: CapiPlugin = {
  metadata: {
    id: "plugin-operational-maintenance", name: "Operational Maintenance", version: "1.0.0",
    icon: "⚙️", description: "Data maintenance, batch processing, system monitoring, error recovery, and operational controls",
    author: "CAPI Built-in", category: "operational-maintenance",
    tags: ["operations","batch","monitoring","maintenance","recovery"], enabled: true, builtIn: true, loadedAt: ts(),
  },
  rules: [],
  validators: {},
  generators: {},
  testCases: [
    tc("Operational Maintenance","System Monitoring","Health check all API endpoints",
      "Run a health check against all loaded API endpoints and verify they respond.",
      ["health","monitoring","availability"],
      { BASE_URL: "${BASE_URL}" },
      [
        { name: "Enumerate endpoints", desc: "List all loaded API endpoint paths." },
        { name: "Send health probes", desc: "Issue a lightweight GET request to each endpoint." },
        { name: "Collect results", desc: "Record response status and latency for each endpoint." },
      ],
      "All endpoints respond with 200 OK within acceptable latency.",
      "Tests system-wide API availability."
    ),
    tc("Operational Maintenance","Batch Processing","Run end-of-day batch",
      "Execute the end-of-day batch process including balance updates and interest accruals.",
      ["batch","EOD","interest"],
      { BATCH_DATE: "${DATE}" },
      [
        { name: "Trigger EOD batch", desc: "Start the end-of-day processing job." },
        { name: "Verify interest accruals", desc: "Confirm interest was calculated and applied to eligible accounts." },
        { name: "Verify batch completion", desc: "Confirm the batch completed without errors." },
      ],
      "End-of-day batch completes successfully with all accruals processed.",
      "Tests batch processing workflow."
    ),
    tc("Operational Maintenance","Error Recovery","Retry failed transaction",
      "Retry a transaction that failed due to a transient error.",
      ["retry","error","recovery"],
      { TRANSACTION_ID: "${TX_ID}" },
      [
        { name: "Identify failed transaction", desc: "Locate the failed transaction in the error queue." },
        { name: "Retry transaction", desc: "Resubmit the transaction for processing." },
        { name: "Verify success", desc: "Confirm the transaction completes successfully on retry." },
      ],
      "Failed transaction is retried and completes successfully.",
      "Tests error recovery and retry mechanism."
    ),
  ],
};

// ═══════════════════════════════════════════════════════════════
// AUTO-REGISTER ALL BUILT-IN PLUGINS
// ═══════════════════════════════════════════════════════════════
export function registerAllBuiltInPlugins(): void {
  [
    clientMgmtPlugin, accountPlugin, paymentsPlugin, investmentPlugin,
    tradingPlugin, compliancePlugin, corporatePlugin, lendingPlugin,
    reportingPlugin, operationsPlugin,
  ].forEach(p => pluginRegistry.register(p));
}

// Auto-register on import
registerAllBuiltInPlugins();
