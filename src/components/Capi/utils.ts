// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
export const gId = (): number => Math.floor(100000 + Math.random() * 900000);
export const gRV = (): number => Date.now() * 1000;
export const now8601 = (): string => new Date().toISOString();
export const isoDate = (d = 0): string => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().split("T")[0];
};
export const rndFloat = (min: number, max: number, dec = 2): number =>
  +(Math.random() * (max - min) + min).toFixed(dec);
export const rndInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
export const rndPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ═══════════════════════════════════════════════════════════════
// SYNTHETIC DATA GENERATORS  (banking-domain aware)
// ═══════════════════════════════════════════════════════════════
export const SYNTH = {
  firstName: () => rndPick(["Marco","Sophie","Hans","Elena","Pierre","Fatima","James","Yuki","Carlos","Priya","David","Anna","Mohammed","Laura","Erik"]),
  lastName: () => rndPick(["Rossi","Müller","Dupont","Smith","García","Tanaka","Ferreira","Andersen","Kowalski","Svensson","Bianchi","Wagner","Cohen","Papadopoulos","Okonkwo"]),
  firm: () => rndPick(["UBS AG","Credit Suisse","Banca Generali","Julius Bär","Vontobel","Pictet","Lombard Odier","Raiffeisen","PostFinance","Zuger KB","BNP Paribas","Deutsche Bank","Société Générale","ING","Barclays"]),
  iban: () => { const cc = rndPick(["CH","DE","IT","FR","AT"]); return `${cc}${rndInt(10,99)}${rndInt(1000,9999)}${rndInt(10000,99999)}${rndInt(100000,999999)}`; },
  bic: () => rndPick(["UBSWCHZH80A","CRESCHZZ80A","BFGEIT3F","BNPAFRPP","DEUTDEDB"]),
  currency: () => rndPick(["CHF","EUR","USD","GBP","JPY","SGD"]),
  country: () => rndPick([{id:1,ident:"CH"},{id:2,ident:"DE"},{id:3,ident:"IT"},{id:4,ident:"FR"},{id:5,ident:"AT"},{id:6,ident:"GB"},{id:7,ident:"US"}]),
  city: () => rndPick(["Zürich","Geneva","Basel","Bern","Lugano","Frankfurt","Milan","Paris","Vienna","London","New York","Singapore"]),
  street: () => rndPick(["Bahnhofstrasse","Paradeplatz","Talstrasse","Limmatquai","Via Aurelia","Taunusanlage","Rue de la Paix","Ringstrasse","Rue du Rhône"]),
  addrType: () => rndPick([{id:1,ident:"MAIL"},{id:2,ident:"PHYS"}]),
  addrKind: () => rndPick([{id:1,ident:"DOMI"},{id:2,ident:"CORR"},{id:3,ident:"WORK"},{id:4,ident:"SAFE"}]),
  amount: (min = 1000, max = 1000000) => rndFloat(min, max, 2),
  rate: () => rndFloat(0.1, 8.5, 3),
  maturity: () => isoDate(rndInt(30, 1825)),
  valDate: () => isoDate(rndInt(-30, 0)),
  isin: () => `${rndPick(["CH","DE","US","GB","FR"])}${rndInt(1000000000,9999999999)}`,
  portfolio: () => `P-${rndInt(100000,999999)}`,
  clientId: () => rndInt(100000, 999999),
  email: (fn: string, ln: string) => `${fn.toLowerCase()}.${ln.toLowerCase()}@${rndPick(["ubs.com","db.com","gmail.com","bancagenerali.it","credit-suisse.com"])}`,
  phone: () => `+${rndPick(["41","39","49","33","44"])}${rndInt(100000000,999999999)}`,
  riskClass: () => rndPick(["LOW","MEDIUM","HIGH","VERY_HIGH"]),
  assetClass: () => rndPick(["EQUITY","BOND","CASH","ALTERNATIVE","REAL_ESTATE","COMMODITY"]),
  posSign: () => rndPick(["LONG","SHORT"]),
  txType: () => rndPick(["BUY","SELL","TRANSFER","REDEMPTION","SUBSCRIPTION","DIVIDEND","COUPON","FEE"]),
  account: (currency?: string) => ({
    id: gId(),
    number: `ACC-${rndInt(10000,99999)}`,
    currency: currency || SYNTH.currency(),
    balance: SYNTH.amount(1000, 500000),
    openDate: isoDate(-rndInt(30, 1000)),
  }),
  address: () => {
    const fn = SYNTH.firstName();
    const ln = SYNTH.lastName();
    return {
      firstName: fn, name: ln, firm: SYNTH.firm(), street: SYNTH.street(),
      streetNr: `${rndInt(1,200)}`, zip: `${rndInt(1000,9999)}`, city: SYNTH.city(),
      country: SYNTH.country(), addrType: SYNTH.addrType(), addrKind: SYNTH.addrKind(),
      elAddr: SYNTH.email(fn, ln), openDate: isoDate(-rndInt(0, 365)),
    };
  },
};

// ═══════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════
export interface ApiRecord {
  id: number;
  bdeRecVersion?: number;
  [key: string]: any;
}

export interface ApiSpec {
  fileName: string;
  ext: string;
  title: string;
  version: string;
  endpoints: { method: string; path: string; summary: string; tags?: string[]; operationId?: string }[];
  schemas: Record<string, any>;
  resourceName: string | null;
  schemaName: string | null;
  parseError: string | null;
  category: string | null;
  folder: string | null;
  dependencies: string[];
  fields: { name: string; type: string; description: string; required: boolean }[];
  description: string;
  authSchemes: string[];
  servers: string[];
  tags: string[];
  rawContent: string;
}

export class ApiStore {
  stores: Record<string, ApiRecord[]> = {};
  specs: ApiSpec[] = [];

  loadSpec(s: ApiSpec) {
    this.specs = this.specs.filter(x => x.fileName !== s.fileName);
    this.specs.push(s);
    if (s.resourceName && !this.stores[s.resourceName]) this.stores[s.resourceName] = [];
  }

  get(r: string): ApiRecord[] {
    if (!this.stores[r]) this.stores[r] = [];
    return this.stores[r];
  }

  add(r: string, rec: Partial<ApiRecord>): ApiRecord {
    const x = { ...rec, id: rec.id || gId(), bdeRecVersion: gRV() } as ApiRecord;
    this.get(r).push(x);
    return x;
  }

  update(r: string, id: number, p: Partial<ApiRecord>): ApiRecord | null {
    const s = this.get(r);
    const i = s.findIndex(x => x.id === id);
    if (i === -1) return null;
    s[i] = { ...s[i], ...p, bdeRecVersion: gRV() };
    return s[i];
  }

  del(r: string, id: number): boolean {
    const s = this.get(r);
    const i = s.findIndex(x => x.id === id);
    if (i === -1) return false;
    s.splice(i, 1);
    return true;
  }

  find(r: string, id: number): ApiRecord | null {
    return this.get(r).find(x => x.id === id) || null;
  }

  list(r: string, { filter, limit = 10, offset = 0 }: { filter?: string; limit?: number; offset?: number } = {}) {
    let recs = [...this.get(r)];
    if (filter) {
      const f = filter.toLowerCase();
      recs = recs.filter(x => JSON.stringify(x).toLowerCase().includes(f));
    }
    return { data: recs.slice(offset, offset + limit), total: recs.length, hasNext: offset + limit < recs.length };
  }
}

export const db = new ApiStore();

// ═══════════════════════════════════════════════════════════════
// MOCK REST ENGINE
// ═══════════════════════════════════════════════════════════════
export const rest = {
  async req(method: string, path: string, body?: any, params?: Record<string, any>) {
    await new Promise(r => setTimeout(r, 30 + Math.random() * 70));
    const parts = path.replace(/^\//, "").split("/");
    const resource = parts[0];
    const id = parts[1] ? parseInt(parts[1]) : null;
    const headers = { "Content-Type": "application/json", "X-Total": "0", "X-Request-ID": `sim-${gId()}` };

    if (method === "GET" && !id) {
      const result = db.list(resource, { filter: params?.filter, limit: params?.limit ? parseInt(params.limit) : 20, offset: params?.offset ? parseInt(params.offset) : 0 });
      return { status: 200, body: result.data, headers: { ...headers, "X-Total": String(result.total) } };
    }
    if (method === "GET" && id) {
      const rec = db.find(resource, id);
      if (!rec) return { status: 404, body: { error: "Not Found", id }, headers };
      return { status: 200, body: rec, headers };
    }
    if (method === "POST" && body) {
      const rec = db.add(resource, body);
      return { status: 201, body: rec, headers };
    }
    if ((method === "PATCH" || method === "PUT") && id && body) {
      const rec = db.update(resource, id, body);
      if (!rec) return { status: 404, body: { error: "Not Found" }, headers };
      return { status: 200, body: rec, headers };
    }
    if (method === "DELETE" && id) {
      const ok = db.del(resource, id);
      if (!ok) return { status: 404, body: { error: "Not Found" }, headers };
      return { status: 204, body: null, headers };
    }
    return { status: 400, body: { error: "Bad Request" }, headers };
  }
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY COLORS
// ═══════════════════════════════════════════════════════════════
export const CAT_COLORS: Record<string, string> = {
  "Client Management": "#61afef",
  "Data Operations": "#98c379",
  "Performance": "#e06c75",
  "Data Quality": "#e5c07b",
  "Compliance & KYC": "#c678dd",
  "API Quality": "#56b6c2",
  "Search & Filter": "#d19a66",
  "Regulatory": "#be5046",
};

export const DEFAULT_SPEC: ApiSpec = {
  fileName: "obj-addrs-api.yaml",
  ext: "yaml",
  title: "OBJ-ADDRS API",
  version: "1.0.0",
  description: "Avaloq Address Management API — obj-addrs resource",
  endpoints: [
    { method: "GET", path: "/api1/obj-addrs", summary: "List addresses" },
    { method: "POST", path: "/api1/obj-addrs", summary: "Create address" },
    { method: "GET", path: "/api1/obj-addrs/{id}", summary: "Get address by ID" },
    { method: "PATCH", path: "/api1/obj-addrs/{id}", summary: "Update address" },
    { method: "DELETE", path: "/api1/obj-addrs/{id}", summary: "Delete address" },
  ],
  schemas: {
    obj_addr: {
      type: "object",
      properties: {
        id: { type: "integer" },
        firstName: { type: "string" },
        name: { type: "string" },
        firm: { type: "string" },
        street: { type: "string" },
        streetNr: { type: "string" },
        zip: { type: "string" },
        city: { type: "string" },
        country: { type: "object" },
        addrType: { type: "object" },
        addrKind: { type: "object" },
        elAddr: { type: "string" },
        openDate: { type: "string", format: "date" },
        bdeRecVersion: { type: "integer" },
      }
    }
  },
  resourceName: "obj-addrs",
  schemaName: "obj_addr",
  parseError: null,
  category: "Address Management",
  folder: null,
  dependencies: [],
  fields: [
    { name: "id", type: "integer", description: "Unique identifier", required: true },
    { name: "firstName", type: "string", description: "First name", required: false },
    { name: "name", type: "string", description: "Last name / company name", required: true },
    { name: "firm", type: "string", description: "Firm / company", required: false },
    { name: "city", type: "string", description: "City", required: false },
    { name: "country", type: "object", description: "Country with id/ident", required: false },
    { name: "elAddr", type: "string", description: "Email address", required: false },
  ],
  authSchemes: ["Bearer"],
  servers: ["http://localhost:8080"],
  tags: ["Addresses"],
  rawContent: "",
};
