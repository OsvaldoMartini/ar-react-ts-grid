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
  fields: { name: string; type: string; description: string; required: boolean; readOnly?: boolean; writeOnly?: boolean; isParam?: boolean }[];
  pathParams: string[];
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
// TEST CASE STORE
// Shared singleton: DataGenTab writes, ReadyForTestTab reads+runs
// ═══════════════════════════════════════════════════════════════
export type TestDataSource = "synthetic" | "file";

export interface TestCase {
  id:           string;
  seq:          number;          // global sequence (1-based)
  runGroup:     number;          // which iteration/run (1-based)
  apiTitle:     string;
  resourceName: string;
  method:       string;
  path:         string;
  body:         Record<string, any> | null;
  dataSource:   TestDataSource;
  fileSource?:  string;          // original filename when source === "file"
  createdAt:    string;
  // execution state (mutated in-place during test run)
  status:       "pending" | "running" | "passed" | "failed";
  httpStatus?:  number | string;
  latency?:     number;
  result?:      any;
  headers?:     any;
  resolvedUrl?: string;  // full URL used during execution (base + path)
}

export class TestCaseStore {
  private _seq = 0;
  cases: TestCase[] = [];
  stopFlag = false;

  add(tc: Omit<TestCase, "id" | "seq" | "createdAt" | "status">): TestCase {
    const entry: TestCase = {
      ...tc,
      id:        `tc-${++this._seq}`,
      seq:       this._seq,
      createdAt: new Date().toISOString(),
      status:    "pending",
    };
    this.cases.push(entry);
    return entry;
  }

  clear()   { this.cases = []; this._seq = 0; this.stopFlag = false; }
  pending() { return this.cases.filter(c => c.status === "pending"); }
  get total() { return this.cases.length; }
}

export const testStore = new TestCaseStore();

// ═══════════════════════════════════════════════════════════════
// EXECUTION HISTORY STORE
// Tracks output mode + last completed execution for reporting
// ═══════════════════════════════════════════════════════════════
export interface StoredExecution {
  id:          string;
  startedAt:   string;
  finishedAt:  string;
  mode:        "flow" | "independent";
  environment: string;
  baseUrl:     string;
}

class ExecutionHistoryStore {
  /** "live" = stream results in UI, "save" = write files to folder on finish */
  outputMode: "live" | "save" = "live";
  /** Start time of the currently running execution */
  currentStartedAt: string | null = null;
  /** Last completed execution metadata (for download button) */
  last: StoredExecution | null = null;
  /** File System Access API directory handle — set before execution starts */
  dirHandle: FileSystemDirectoryHandle | null = null;
  /** Rows written per CSV chunk (default 100) */
  rowsPerFile: number = 100;
}

export const executionHistory = new ExecutionHistoryStore();

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT STORE
// Shared singleton: selected base URL used during test execution
// ═══════════════════════════════════════════════════════════════
export type EnvTag = "local" | "development" | "staging" | "production" | "custom";

export interface Environment {
  id:      string;
  tag:     EnvTag;
  name:    string;
  baseUrl: string;
  color:   string;   // indicator dot color
  builtIn: boolean;  // false = user-added
}

const DEFAULT_ENVS: Environment[] = [
  { id: "env-local",  tag: "local",       name: "Local",       baseUrl: "http://localhost:8080",               color: "#8b949e", builtIn: true },
  { id: "env-dev",    tag: "development", name: "Development", baseUrl: "https://api-dev.api-services.internal",    color: "#60a5fa", builtIn: true },
  { id: "env-stg",    tag: "staging",     name: "Staging",     baseUrl: "https://api-staging.api-services.internal",color: "#f59e0b", builtIn: true },
  { id: "env-prod",   tag: "production",  name: "Production",  baseUrl: "https://api.api-services.com",             color: "#f87171", builtIn: true },
];

export class EnvironmentStore {
  envs:        Environment[] = DEFAULT_ENVS.map(e => ({ ...e }));
  selectedId:  string = "env-local";

  get selected(): Environment {
    return this.envs.find(e => e.id === this.selectedId) || this.envs[0];
  }

  select(id: string) { this.selectedId = id; }

  updateUrl(id: string, url: string) {
    const e = this.envs.find(x => x.id === id);
    if (e) e.baseUrl = url;
  }

  addCustom(name: string, baseUrl: string): Environment {
    const e: Environment = {
      id: `env-custom-${Date.now()}`, tag: "custom",
      name, baseUrl, color: "#a78bfa", builtIn: false,
    };
    this.envs.push(e);
    return e;
  }

  remove(id: string) {
    const e = this.envs.find(x => x.id === id);
    if (!e || e.builtIn) return;
    this.envs = this.envs.filter(x => x.id !== id);
    if (this.selectedId === id) this.selectedId = this.envs[0].id;
  }

  /** Full URL for a given API path */
  resolve(path: string): string {
    const base = this.selected.baseUrl.replace(/\/$/, "");
    const p    = path.startsWith("/") ? path : "/" + path;
    return base + p;
  }
}

export const envStore = new EnvironmentStore();

// ═══════════════════════════════════════════════════════════════
// MOCK SERVER STORE
// In-browser mock: intercepts rest.req() when running.
// Also generates a downloadable zero-dependency Node.js server.
// ═══════════════════════════════════════════════════════════════
export type MockServerStatus = "stopped" | "starting" | "running" | "error";

export interface MockRoute {
  method:       string;
  path:         string;
  resourceName: string;
  apiTitle:     string;
  seedData:     any[];          // 50 pre-generated records
}

function mockSynthField(name: string, type: string): any {
  const n = name.toLowerCase();
  if (/date|^dt|dt$|trxdate|valdate|expir/.test(n))  return isoDate(rndInt(-30, 30));
  if (/amount|price|value|total|sum|fee|trl/.test(n)) return rndFloat(100, 100000);
  if (/rate|yield|percent|ratio|trig/.test(n))        return rndFloat(0.001, 0.15, 4);
  if (/curr|ccy/.test(n))                             return rndPick(["CHF","EUR","USD","GBP","JPY"]);
  if (/isin/.test(n))                                 return SYNTH.isin();
  if (/portfolio|portf/.test(n))                      return SYNTH.portfolio();
  if (/client|customer|partner/.test(n))              return SYNTH.clientId();
  if (/iban/.test(n))                                 return SYNTH.iban();
  if (/bic|swift/.test(n))                            return SYNTH.bic();
  if (/^name$|surname|firstname|lastname/.test(n))    return `${SYNTH.firstName()} ${SYNTH.lastName()}`;
  if (/type$|kind$|typeid/.test(n))                   return rndPick(["TYPE_A","TYPE_B","TYPE_C","TYPE_D"]);
  if (/status/.test(n))                               return rndPick(["ACTIVE","PENDING","INACTIVE","CLOSED"]);
  if (/qty|quantity|count|num|limit/.test(n))         return rndInt(1, 10000);
  if (/flag|enabled|active$/.test(n))                 return Math.random() > 0.5;
  if (/desc|comment|note|remark/.test(n))             return `Mock ${name}`;
  if (/code$/.test(n))                                return `${rndPick(["A","B","C","D"])}${rndInt(100,999)}`;
  if (/asset/.test(n))                                return SYNTH.assetClass();
  if (/risk/.test(n))                                 return SYNTH.riskClass();
  if (/sign$|side$/.test(n))                          return SYNTH.posSign();
  if (/stex|pool|alloc|place/.test(n))                return rndInt(1000, 999999);
  if (type === "integer" || type === "number")         return rndInt(1, 9999);
  if (type === "boolean")                              return Math.random() > 0.5;
  return `val-${rndInt(100, 999)}`;
}

function generateSeedRecord(
  fields: { name: string; type: string }[],
  id: number
): any {
  const rec: any = { id };
  for (const f of fields) {
    if (f.name === "id") continue;
    rec[f.name] = mockSynthField(f.name, f.type);
  }
  return rec;
}

export class MockServerStore {
  port:   number           = 8855;
  status: MockServerStatus = "stopped";
  routes: MockRoute[]      = [];
  envId:  string | null    = null;
  logs:   string[]         = [];

  private log(msg: string) {
    this.logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (this.logs.length > 300) this.logs = this.logs.slice(-300);
  }

  /** Build seed data from loaded ApiSpecs */
  buildFromSpecs(specs: ApiSpec[]) {
    // Group endpoints by resourceName to share seedData per resource
    const seedCache = new Map<string, any[]>();
    this.routes = [];

    for (const spec of specs) {
      const res = spec.resourceName || spec.fileName;
      if (!res) continue;

      if (!seedCache.has(res)) {
        const writableFields = spec.fields.filter(f => !f.readOnly && !f.isParam);
        const seed = Array.from({ length: 50 }, (_, i) =>
          generateSeedRecord(writableFields, i + 1)
        );
        seedCache.set(res, seed);
      }

      for (const ep of spec.endpoints) {
        this.routes.push({
          method:       ep.method.toUpperCase(),
          path:         ep.path,
          resourceName: res,
          apiTitle:     spec.title,
          seedData:     seedCache.get(res)!,
        });
      }
    }
  }

  /** Build seed data from existing testStore cases (when no specs available) */
  buildFromTestCases() {
    const resMap = new Map<string, { title: string; methods: string[]; fields: Set<string> }>();
    for (const tc of testStore.cases) {
      if (!resMap.has(tc.resourceName)) {
        resMap.set(tc.resourceName, { title: tc.apiTitle, methods: [], fields: new Set() });
      }
      const e = resMap.get(tc.resourceName)!;
      if (!e.methods.includes(tc.method)) e.methods.push(tc.method);
      if (tc.body) Object.keys(tc.body).forEach(k => e.fields.add(k));
    }

    const seedCache = new Map<string, any[]>();
    this.routes = [];

    for (const [res, info] of resMap) {
      if (!seedCache.has(res)) {
        const fields = Array.from(info.fields).map(name => ({ name, type: "string" }));
        const seed = Array.from({ length: 50 }, (_, i) => generateSeedRecord(fields, i + 1));
        seedCache.set(res, seed);
      }
      for (const method of info.methods) {
        const hasId = ["GET","PATCH","PUT","DELETE"].includes(method);
        this.routes.push({
          method, resourceName: res, apiTitle: info.title,
          path: hasId ? `/${res}/{id}` : `/${res}`,
          seedData: seedCache.get(res)!,
        });
      }
    }
  }

  start() {
    this.status = "starting";
    this.log(`Starting mock server on http://localhost:${this.port}`);

    // Add (or reuse) env entry
    const url = `http://localhost:${this.port}`;
    const existing = envStore.envs.find(e => e.baseUrl === url);
    if (existing) {
      this.envId = existing.id;
    } else {
      const e: Environment = {
        id: `env-mock-${this.port}`, tag: "custom",
        name: `Mock :${this.port}`, baseUrl: url,
        color: "#a78bfa", builtIn: false,
      };
      envStore.envs.push(e);
      this.envId = e.id;
    }
    envStore.select(this.envId!);

    this.status = "running";
    this.log(`✓ Mock server running — ${this.routes.length} routes, ${this._totalRecords()} seed records`);
    const byRes = this._routesByResource();
    for (const [res, routes] of byRes) {
      this.log(`  /${res.padEnd(28)} ${routes.map(r => r.method).join(" | ")}  (${routes[0].seedData.length} records)`);
    }
  }

  stop() {
    this.status = "stopped";
    this.log("Mock server stopped");
    if (this.envId) {
      const e = envStore.envs.find(x => x.id === this.envId);
      if (e && !e.builtIn) envStore.remove(this.envId);
      this.envId = null;
    }
    if (envStore.selectedId.startsWith("env-mock-")) {
      envStore.selectedId = "env-local";
    }
  }

  handleRequest(method: string, path: string, body?: any): { status: number; body: any; headers?: any } {
    const clean  = path.replace(/\?.*$/, "").replace(/^\//, "");
    const parts  = clean.split("/");
    const res    = parts[0];
    const idRaw  = parts[1];
    const id     = idRaw ? parseInt(idRaw) : null;
    const headers = { "Content-Type": "application/json", "X-Mock-Server": `localhost:${this.port}` };

    const route  = this.routes.find(r =>
      r.resourceName === res && r.method === method.toUpperCase()
    );

    if (!route) {
      this.log(`404 ${method.padEnd(6)} /${clean} — no route`);
      return { status: 404, body: { error: `No mock route: ${method} /${clean}` }, headers };
    }

    const col = route.seedData;

    if (method === "GET" && !id) {
      this.log(`200 GET    /${res} → [${col.length}]`);
      return { status: 200, body: col, headers };
    }
    if (method === "GET" && id) {
      const item = col.find(r => r.id === id);
      this.log(`${item ? 200 : 404} GET    /${res}/${id}`);
      return { status: item ? 200 : 404, body: item ?? { error: "Not found", id }, headers };
    }
    if (method === "POST") {
      const newId  = Math.max(...col.map(r => r.id), 50) + 1;
      const newRec = { id: newId, ...body };
      col.push(newRec);
      this.log(`201 POST   /${res} → id=${newId}`);
      return { status: 201, body: newRec, headers };
    }
    if ((method === "PATCH" || method === "PUT") && id) {
      const idx = col.findIndex(r => r.id === id);
      if (idx < 0) {
        this.log(`404 ${method.padEnd(6)} /${res}/${id}`);
        return { status: 404, body: { error: "Not found", id }, headers };
      }
      col[idx] = method === "PUT" ? { id, ...body } : { ...col[idx], ...body };
      this.log(`200 ${method.padEnd(6)} /${res}/${id}`);
      return { status: 200, body: col[idx], headers };
    }
    if (method === "DELETE" && id) {
      const idx = col.findIndex(r => r.id === id);
      if (idx < 0) {
        this.log(`404 DELETE /${res}/${id}`);
        return { status: 404, body: { error: "Not found", id }, headers };
      }
      col.splice(idx, 1);
      this.log(`204 DELETE /${res}/${id}`);
      return { status: 204, body: null, headers };
    }

    this.log(`405 ${method.padEnd(6)} /${clean}`);
    return { status: 405, body: { error: "Method not allowed" }, headers };
  }

  private _totalRecords(): number {
    const seen = new Set<string>();
    let n = 0;
    for (const r of this.routes) {
      if (!seen.has(r.resourceName)) { seen.add(r.resourceName); n += r.seedData.length; }
    }
    return n;
  }

  _routesByResource(): Map<string, MockRoute[]> {
    const m = new Map<string, MockRoute[]>();
    for (const r of this.routes) {
      if (!m.has(r.resourceName)) m.set(r.resourceName, []);
      m.get(r.resourceName)!.push(r);
    }
    return m;
  }

  /** Generate a zero-dependency Node.js server script */
  generateNodeScript(): string {
    const byRes = this._routesByResource();
    const dbObj: Record<string, any[]> = {};
    for (const [res, routes] of byRes) dbObj[res] = routes[0].seedData;
    const totalRec = Object.values(dbObj).reduce((s, a) => s + a.length, 0);
    const nextId   = Math.max(...Object.values(dbObj).flat().map(r => r.id ?? 0), 50) + 1;

    return `// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MULTITEST MOCK SERVER  ·  API Services API Test Simulator
// Generated: ${new Date().toLocaleString()}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Run:   node mock-server.js
// Deps:  NONE (pure Node.js built-ins only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';
const http = require('http');
const PORT = ${this.port};

// ── Seed database (${totalRec} records across ${Object.keys(dbObj).length} resources) ──
const db = ${JSON.stringify(dbObj, null, 2)};

let nextId = ${nextId};

// ── Helpers ──
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
};

function send(res, status, data) {
  const body = data !== null ? JSON.stringify(data, null, 2) : '';
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(body);
}

function parsePath(url) {
  return url.split('?')[0].split('/').filter(Boolean);
}

function log(method, url, status, extra) {
  const ts  = new Date().toLocaleTimeString();
  const sts = status >= 400 ? \`\\x1b[31m\${status}\\x1b[0m\` : \`\\x1b[32m\${status}\\x1b[0m\`;
  console.log(\`  \${ts}  \${method.padEnd(7)} \${url.padEnd(40)} \${sts} \${extra || ''}\`);
}

// ── Router ──
const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  const parts    = parsePath(req.url);
  const resource = parts[0];
  const id       = parts[1] ? parseInt(parts[1]) : null;

  if (!resource || !db[resource]) {
    log(req.method, req.url, 404);
    return send(res, 404, { error: \`Unknown resource: \${resource}\`, available: Object.keys(db) });
  }

  // Buffer body
  let raw = '';
  req.on('data', c => raw += c);
  req.on('end', () => {
    let body = {};
    try { if (raw.trim()) body = JSON.parse(raw); } catch (e) {
      return send(res, 400, { error: 'Invalid JSON body', detail: e.message });
    }

    const col = db[resource];

    // ── GET list ──
    if (req.method === 'GET' && !id) {
      log(req.method, req.url, 200, \`[\${col.length}]\`);
      return send(res, 200, col);
    }

    // ── GET by id ──
    if (req.method === 'GET' && id) {
      const item = col.find(r => r.id === id);
      log(req.method, req.url, item ? 200 : 404, item ? \`id=\${id}\` : '');
      return send(res, item ? 200 : 404, item ?? { error: 'Not found', id });
    }

    // ── POST (create) ──
    if (req.method === 'POST') {
      const newItem = { id: nextId++, ...body };
      col.push(newItem);
      log(req.method, req.url, 201, \`id=\${newItem.id}\`);
      return send(res, 201, newItem);
    }

    // ── PATCH (partial update) ──
    if (req.method === 'PATCH' && id) {
      const i = col.findIndex(r => r.id === id);
      if (i < 0) { log(req.method, req.url, 404); return send(res, 404, { error: 'Not found', id }); }
      col[i] = { ...col[i], ...body };
      log(req.method, req.url, 200, \`id=\${id}\`);
      return send(res, 200, col[i]);
    }

    // ── PUT (replace) ──
    if (req.method === 'PUT' && id) {
      const i = col.findIndex(r => r.id === id);
      if (i < 0) { log(req.method, req.url, 404); return send(res, 404, { error: 'Not found', id }); }
      col[i] = { id, ...body };
      log(req.method, req.url, 200, \`id=\${id}\`);
      return send(res, 200, col[i]);
    }

    // ── DELETE ──
    if (req.method === 'DELETE' && id) {
      const i = col.findIndex(r => r.id === id);
      if (i < 0) { log(req.method, req.url, 404); return send(res, 404, { error: 'Not found', id }); }
      col.splice(i, 1);
      log(req.method, req.url, 204, \`id=\${id}\`);
      return send(res, 204, null);
    }

    log(req.method, req.url, 405);
    send(res, 405, { error: 'Method Not Allowed' });
  });
});

server.listen(PORT, () => {
  console.log('\\n\\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\x1b[0m');
  console.log('\\x1b[35m  CAPI MOCK SERVER  ·  API Services API Test Simulator\\x1b[0m');
  console.log('\\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\x1b[0m');
  console.log(\`  \\x1b[32m📡  http://localhost:\${PORT}\\x1b[0m\`);
  console.log(\`  📦  \${Object.keys(db).length} resources  ·  \${Object.values(db).reduce((s,a) => s+a.length,0)} seed records\\n\`);
  Object.entries(db).forEach(([r, rows]) => {
    console.log(\`  /\${r.padEnd(30)} \\x1b[36m\${rows.length} records\\x1b[0m\`);
  });
  console.log('\\nRequests:\\n');
});

process.on('SIGINT', () => { console.log('\\n\\x1b[33m  Mock server stopped.\\x1b[0m'); process.exit(0); });
`;
  }
}

export const mockServerStore = new MockServerStore();

// ═══════════════════════════════════════════════════════════════
// MOCK REST ENGINE
// ═══════════════════════════════════════════════════════════════
export const rest = {
  async req(method: string, path: string, body?: any, params?: Record<string, any>) {
    await new Promise(r => setTimeout(r, 30 + Math.random() * 70));

    // ── Delegate to mock server when running ──
    if (mockServerStore.status === "running") {
      return mockServerStore.handleRequest(method, path, body);
    }

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

// ═══════════════════════════════════════════════════════════════
// DEFAULT SPEC  — parsed dynamically, never hardcoded
// This is the fallback shown before any files are loaded.
// All fields, schemas, endpoints and pathParams are derived
// by running the same parseApiSpec() pipeline as uploaded files.
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// PARSE API SPEC  — shared by FileUploadPanel and tests
// Handles: OpenAPI 3.x / Swagger 2.x JSON/YAML, plain JSON data,
//          Protobuf .proto, and raw JSON Schema/Shape files.
// Populates spec.fields and spec.dependencies fully.
// ═══════════════════════════════════════════════════════════════

const SCALAR_TYPES = new Set(["string","integer","number","boolean","null","any","object","array","void","empty"]);

function refName(ref: string): string {
  return ref.split("/").pop() || ref;
}

function collectRefs(obj: any, out: Set<string>): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) { obj.forEach(v => collectRefs(v, out)); return; }
  for (const [k, v] of Object.entries(obj)) {
    if (k === "$ref" && typeof v === "string") out.add(refName(v));
    else collectRefs(v, out);
  }
}

function fieldsFromSchema(schema: any): { name: string; type: string; description: string; required: boolean; readOnly?: boolean; writeOnly?: boolean }[] {
  const fields: { name: string; type: string; description: string; required: boolean; readOnly?: boolean; writeOnly?: boolean }[] = [];
  if (!schema || typeof schema !== "object") return fields;
  const required = new Set((schema.required || []) as string[]);
  for (const [prop, def] of Object.entries(schema.properties || {})) {
    const d = def as any;
    let type: string;
    if (d.$ref) {
      type = refName(d.$ref);
    } else if (d.type === "array") {
      const itemRef = d.items?.$ref ? refName(d.items.$ref) : (d.items?.type || "any");
      type = `${itemRef}[]`;
    } else if (d.allOf || d.oneOf || d.anyOf) {
      const variants = (d.allOf || d.oneOf || d.anyOf) as any[];
      const firstRef = variants.find((v: any) => v.$ref);
      type = firstRef ? refName(firstRef.$ref) : "object";
    } else {
      type = d.type || "object";
    }
    fields.push({
      name: prop, type,
      description: d.description || "",
      required: required.has(prop),
      readOnly: d.readOnly === true ? true : undefined,
      writeOnly: d.writeOnly === true ? true : undefined,
    });
  }
  return fields;
}

function fieldsFromSample(sample: Record<string, any>): { name: string; type: string; description: string; required: boolean }[] {
  return Object.entries(sample).map(([name, val]) => ({
    name,
    type: Array.isArray(val) ? "array" : (val === null ? "null" : typeof val),
    description: "",
    required: false,
  }));
}

function resourceFromTitle(title: string): string {
  return "obj-" + title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-api$/, "").replace(/-+$/, "");
}

function yamlScalarVal(line: string, key: string): string | null {
  const m = line.match(new RegExp(`^\\s*${key}:\\s*[\"']?([^\"'\\n\\r#]+)`));
  return m ? m[1].trim() : null;
}

/** Lightweight YAML → ApiSpec extractor (no full YAML parse library needed). */
function parseYamlSpec(content: string, spec: ApiSpec): void {
  const lines = content.split(/\r?\n/);

  // Top-level scalars
  for (const l of lines) {
    if (!spec.title || spec.title === spec.fileName.replace(/\.[^.]+$/, "")) {
      const t = yamlScalarVal(l, "title"); if (t) spec.title = t;
    }
    const v = yamlScalarVal(l, "version"); if (v && v !== spec.version) spec.version = v;
    const d = yamlScalarVal(l, "description"); if (d && !spec.description) spec.description = d;
  }

  spec.authSchemes = content.includes("bearerAuth") ? ["Bearer"]
    : content.includes("apiKey") ? ["ApiKey"] : [];

  // Servers
  const srvRx = /^\s*-\s*url:\s*['"]{0,1}([^'">\n\r]+)/gm;
  let sm: RegExpExecArray | null;
  while ((sm = srvRx.exec(content)) !== null) spec.servers.push(sm[1].trim());

  // Tags block
  const tagM = content.match(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m);
  if (tagM) {
    spec.tags = tagM[1].split("\n")
      .map(l => l.replace(/^\s*-\s*name:\s*/, "").replace(/^\s*-\s*/, "").trim())
      .filter(Boolean);
  }

  // Paths → endpoints
  let inPaths = false, curPath: string | null = null;
  for (let li = 0; li < lines.length; li++) {
    const l = lines[li];
    if (/^paths:/.test(l))                             { inPaths = true; continue; }
    if (inPaths && /^[a-zA-Z$]/.test(l) && !/^\s/.test(l)) inPaths = false;
    if (!inPaths) continue;
    const pM = l.match(/^  (\/[^:\s#]+):\s*$/);
    if (pM)  { curPath = pM[1]; continue; }
    const mM = l.match(/^    (get|post|put|patch|delete):\s*$/i);
    if (mM && curPath) {
      const nextLine   = lines[li + 1] || "";
      const sum        = yamlScalarVal(nextLine, "summary") || "";
      spec.endpoints.push({ method: mM[1].toUpperCase(), path: curPath, summary: sum, tags: [] });
    }
  }

  // components.schemas → fields + dependencies
  const schemaBlockIdx = content.search(/^  schemas:\s*$/m);
  if (schemaBlockIdx >= 0) {
    const after      = content.slice(schemaBlockIdx);
    const schNameRx  = /^    (\w[\w-]*):\s*$/gm;
    let nm: RegExpExecArray | null;
    const schemaNames: string[] = [];
    while ((nm = schNameRx.exec(after)) !== null) schemaNames.push(nm[1]);

    const allRefs = new Set<string>();

    for (let si = 0; si < schemaNames.length; si++) {
      const sname = schemaNames[si];
      const start = after.indexOf(`    ${sname}:\n`);
      const end   = si < schemaNames.length - 1
        ? after.indexOf(`    ${schemaNames[si + 1]}:\n`, start + 1)
        : after.length;
      const block = after.slice(start, end);

      // Collect $refs
      const refRx = /\$ref:\s*['"]?#\/components\/schemas\/([\w-]+)/g;
      let rr: RegExpExecArray | null;
      while ((rr = refRx.exec(block)) !== null) allRefs.add(rr[1]);

      // Collect properties at exactly 8-space indent
      const propRx = /^        (\w[\w-]*):/gm;
      let pm: RegExpExecArray | null;
      while ((pm = propRx.exec(block)) !== null) {
        const propName = pm[1];
        if (["type","description","required","example","format","minimum","maximum","default","enum","nullable"].includes(propName)) continue;
        const after2 = block.slice(pm.index + pm[0].length, pm.index + pm[0].length + 300);
        const typeM  = after2.match(/\n\s+type:\s*(\w+)/);
        const refM   = after2.match(/\n\s+\$ref:\s*['"]?#\/components\/schemas\/([\w-]+)/);
        const itemM  = after2.match(/items:\s*\n\s+\$ref:\s*['"]?#\/components\/schemas\/([\w-]+)/);
        const itemTypeM = after2.match(/items:\s*\n\s+type:\s*(\w+)/);
        let type = "object";
        if (refM)         { type = refM[1]; allRefs.add(refM[1]); }
        else if (itemM)   { type = itemM[1] + "[]"; allRefs.add(itemM[1]); }
        else if (itemTypeM) { type = itemTypeM[1] + "[]"; }
        else if (typeM)   { type = typeM[1]; }
        spec.fields.push({ name: propName, type, description: "", required: false });
      }
    }

    spec.dependencies = [...allRefs];
    if (!spec.schemaName && schemaNames.length > 0) spec.schemaName = schemaNames[0];
  }
}

export function parseApiSpec(fileName: string, content: string, fileType?: string): ApiSpec {
  const ext = fileType || fileName.split(".").pop()!.toLowerCase();
  const spec: ApiSpec = {
    fileName, ext,
    title: fileName.replace(/\.[^.]+$/, ""),
    version: "1.0",
    endpoints: [], schemas: {},
    resourceName: null, schemaName: null,
    parseError: null, category: null, folder: null,
    dependencies: [], fields: [], pathParams: [], description: "",
    authSchemes: [], servers: [], tags: [],
    rawContent: content.slice(0, 5000),
  };

  try {
    if (["json","schema","shape"].includes(ext)) {
      let parsed: any;
      try { parsed = JSON.parse(content); }
      catch (e: any) { spec.parseError = "JSON parse error: " + e.message; return spec; }

      if (parsed?.openapi || parsed?.swagger) {
        // ── OpenAPI 3.x / Swagger 2.x ──────────────────────────
        spec.title       = parsed.info?.title       || spec.title;
        spec.version     = parsed.info?.version     || spec.version;
        spec.description = parsed.info?.description || "";
        spec.servers     = (parsed.servers || []).map((s: any) => s.url).filter(Boolean);
        spec.authSchemes = Object.keys(parsed.components?.securitySchemes || {});
        spec.tags        = (parsed.tags || []).map((t: any) => (typeof t === "string" ? t : t.name)).filter(Boolean);

        const schemas: Record<string, any> =
          parsed.components?.schemas || parsed.definitions || {};
        spec.schemas = schemas;

        // Collect all $ref names across entire document
        const allDocRefs = new Set<string>();
        collectRefs(parsed.paths, allDocRefs);
        collectRefs(parsed.components, allDocRefs);
        collectRefs(parsed.definitions, allDocRefs);

        // Extract endpoints + collect path params
        const allPathParams = new Set<string>();
        for (const [path, pathItem] of Object.entries(parsed.paths || {})) {
          for (const [method, op] of Object.entries(pathItem as any)) {
            if (!["get","post","put","patch","delete"].includes(method)) continue;
            const o = op as any;
            spec.endpoints.push({
              method: method.toUpperCase(), path,
              summary: o.summary || "",
              tags: o.tags || [],
              operationId: o.operationId,
            });
            // Collect parameters from each operation AND path-level params
            const params = [
              ...((pathItem as any).parameters || []),
              ...(o.parameters || []),
            ];
            for (const p of params) {
              if (p.in === "path" && p.name) allPathParams.add(p.name);
            }
          }
        }
        spec.pathParams = [...allPathParams];

        // Identify primary schema (from POST request body ref or name matching)
        let primarySchema: string | null = null;
        for (const ep of spec.endpoints) {
          if (ep.method !== "POST") continue;
          const pathItem = (parsed.paths || {})[ep.path];
          const postOp   = pathItem?.post;
          // OpenAPI 3.x
          const bodyRef = postOp?.requestBody?.content?.["application/json"]?.schema?.$ref
            ?? postOp?.requestBody?.content?.["application/json"]?.schema?.allOf?.[0]?.$ref;
          if (bodyRef) { primarySchema = refName(bodyRef); break; }
          // Swagger 2.x
          const bodyParam = (postOp?.parameters || []).find((p: any) => p.in === "body");
          if (bodyParam?.schema?.$ref) { primarySchema = refName(bodyParam.schema.$ref); break; }
          // Fallback: name match
          const resource = ep.path.replace(/^\//, "").split("/")[0].replace(/[{}/]/g, "");
          const match = Object.keys(schemas).find(k =>
            k.toLowerCase().replace(/[_-]/g, "") === resource.toLowerCase().replace(/[_-]/g, "")
          );
          if (match) { primarySchema = match; break; }
        }
        if (!primarySchema && Object.keys(schemas).length > 0) primarySchema = Object.keys(schemas)[0];

        if (primarySchema && schemas[primarySchema]) {
          spec.schemaName = primarySchema;
          spec.fields     = fieldsFromSchema(schemas[primarySchema]);
        } else {
          for (const schema of Object.values(schemas)) {
            spec.fields.push(...fieldsFromSchema(schema as any));
          }
        }

        // Dependencies = $refs pointing to OTHER known schemas
        spec.dependencies = [...allDocRefs].filter(r => schemas[r] && r !== primarySchema);

      } else if (Array.isArray(parsed) || typeof parsed === "object") {
        // ── Plain JSON data file — seed db store ───────────────
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        if (arr.length > 0 && arr[0] !== null && typeof arr[0] === "object") {
          spec.fields = fieldsFromSample(arr[0]);
          const resourceName = resourceFromTitle(spec.title);
          spec.resourceName  = resourceName;
          // Seed in-memory store with the data records
          arr.forEach(item => {
            db.add(resourceName, (typeof item === "object" && item !== null) ? item : { data: item });
          });
        }
      }
    }

    if (["yaml","yml"].includes(ext)) {
      parseYamlSpec(content, spec);
    }

    if (ext === "proto") {
      spec.endpoints = [...content.matchAll(/rpc\s+(\w+)\s*\(([^)]+)\)\s*returns\s*\(([^)]+)\)/g)]
        .map(m => ({ method: "RPC", path: m[1], summary: `${m[1]}(${m[2].trim()}) → ${m[3].trim()}`, tags: [] }));
      const msgRx = /message\s+\w+\s*\{([^}]+)\}/gm;
      let mm: RegExpExecArray | null;
      while ((mm = msgRx.exec(content)) !== null) {
        const fieldRx = /(?:repeated\s+)?(\w+)\s+(\w+)\s*=/gm;
        let fm: RegExpExecArray | null;
        while ((fm = fieldRx.exec(mm[1])) !== null) {
          if (!["reserved","option"].includes(fm[2])) {
            spec.fields.push({ name: fm[2], type: fm[1], description: "", required: false });
          }
        }
      }
    }

    // Resolve resourceName from endpoints if not set yet
    if (!spec.resourceName) {
      for (const ep of spec.endpoints) {
        const m = ep.path?.match(/^\/([\w-]+)/);
        if (m) { spec.resourceName = m[1]; break; }
      }
    }
    if (!spec.resourceName) {
      spec.resourceName = resourceFromTitle(spec.title);
    }

    // Trim scalar-only entries from dependencies
    spec.dependencies = spec.dependencies.filter(d => !SCALAR_TYPES.has(d.toLowerCase()));

  } catch (e: any) {
    spec.parseError = e.message;
  }

  return spec;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT SPEC  — parsed dynamically, never hardcoded.
// Placed AFTER parseApiSpec so the IIFE call is valid.
// All fields, schemas, endpoints and pathParams are derived by
// the same pipeline used for real uploaded files.
// ═══════════════════════════════════════════════════════════════
const DEFAULT_SPEC_YAML = `
openapi: "3.0.2"
info:
  title: "OBJ-ADDRS API"
  version: "1.0.0"
  description: "API Services Address Management API — obj-addrs resource"
servers:
  - url: "http://localhost:8080"
paths:
  /api1/obj-addrs:
    get:
      summary: "List addresses"
      parameters:
        - name: filter
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
    post:
      summary: "Create address"
  /api1/obj-addrs/{id}:
    get:
      summary: "Get address by ID"
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
    patch:
      summary: "Update address"
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
    delete:
      summary: "Delete address"
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
  schemas:
    obj_addr:
      type: object
      required:
        - name
      properties:
        id:
          type: integer
          readOnly: true
          description: "Unique identifier (server-assigned)"
        firstName:
          type: string
          description: "First name"
        name:
          type: string
          description: "Last name or company name"
        firm:
          type: string
          description: "Firm or company"
        street:
          type: string
          description: "Street name"
        streetNr:
          type: string
          description: "Street number"
        zip:
          type: string
          description: "Postal code"
        city:
          type: string
          description: "City"
        country:
          $ref: "#/components/schemas/code_tab_ref"
        addrType:
          $ref: "#/components/schemas/code_tab_ref"
        addrKind:
          $ref: "#/components/schemas/code_tab_ref"
        elAddr:
          type: string
          description: "Email address"
        openDate:
          type: string
          readOnly: true
          description: "Date address was opened (server-set)"
        bdeRecVersion:
          type: integer
          readOnly: true
          description: "Optimistic locking version (server-managed)"
    code_tab_ref:
      type: object
      properties:
        _href:
          type: string
          readOnly: true
          description: "Reference link"
        id:
          type: integer
          description: "Numeric reference"
        ident:
          type: string
          description: "Unique symbolic reference"
        intlId:
          type: string
          readOnly: true
          description: "Symbolic reference (read-only)"
`;

export const DEFAULT_SPEC: ApiSpec = (() => {
  const spec = parseApiSpec("obj-addrs-api.yaml", DEFAULT_SPEC_YAML, "yaml");
  spec.category = "Address Management";
  return spec;
})();

// ═══════════════════════════════════════════════════════════════
// DYNAMIC WORKFLOW BUILDER
// Derives graph nodes, edges, schema-field table, workflow stages,
// and data-transfer arrows from the currently loaded ApiSpec[].
// ═══════════════════════════════════════════════════════════════

export interface WfNode {
  id: string; label: string; schema: string; resource: string;
  method: "POST"|"PATCH"|"GET"|"DELETE"|"PUT"|"RPC";
  path: string; group: string; produces?: string; color: string;
  x: number; y: number;
}
export interface WfEdge {
  from: string; to: string; field: string; type: "object"|"array"; label: string;
}
export type FieldDirection = "OUT" | "IN" | "IN_OUT" | "PARAM";
export type FieldKind      = "REF" | "ARR_REF" | "ARR_VAL" | "VAL" | "OBJ";

export interface WfFieldRow {
  sourceSchema: string; field: string; fieldType: string;
  referencesSchema: string; sourceApi: string; isArray: boolean;
  // Classification
  direction: FieldDirection;
  kind: FieldKind;
  required: boolean;
  description: string;
}
export interface WfStage {
  id: string; label: string; api: string; produces: string|null;
  color: string; step: number;
}
export interface WfTransfer {
  from: string; to: string; via: string; label: string;
}
export interface DynamicWorkflow {
  nodes: WfNode[];
  edges: WfEdge[];
  schemaFields: WfFieldRow[];
  stages: WfStage[];
  transfers: WfTransfer[];
  isEmpty: boolean;
}

const METHOD_COLORS: Record<string, string> = {
  POST:   "#34d399",
  GET:    "#60a5fa",
  PATCH:  "#fb923c",
  PUT:    "#f59e0b",
  DELETE: "#f87171",
  RPC:    "#a78bfa",
};

const PALETTE = [
  "#818cf8","#34d399","#fb923c","#a78bfa","#f472b6",
  "#64748b","#60a5fa","#f59e0b","#e06c75","#56b6c2",
];

export function buildDynamicWorkflow(specs: ApiSpec[]): DynamicWorkflow {
  if (!specs || specs.length === 0) {
    return { nodes: [], edges: [], schemaFields: [], stages: [], transfers: [], isEmpty: true };
  }

  const nodes: WfNode[]          = [];
  const edges: WfEdge[]          = [];
  const schemaFields: WfFieldRow[] = [];
  const stages: WfStage[]        = [];
  const transfers: WfTransfer[]  = [];

  // Stable color per resource group
  const resourceColors: Record<string, string> = {};
  const uniqueResources = [...new Set(
    specs.map(s => s.resourceName).filter(Boolean) as string[]
  )];
  uniqueResources.forEach((r, i) => { resourceColors[r] = PALETTE[i % PALETTE.length]; });

  const X_STEP  = 210;
  const Y_BASE  = 80;
  const Y_PATCH = 200;

  // POST node by resource — used when building edges
  const postNodeByResource: Record<string, WfNode> = {};
  let col = 0;
  let step = 1;

  for (const spec of specs) {
    if (!spec.resourceName) continue;
    const res   = spec.resourceName;
    const color = resourceColors[res] ?? "#8b949e";
    const schema = spec.schemaName || res;

    // De-duplicate: one node per resource+method combination
    for (const ep of spec.endpoints) {
      const method = ep.method as WfNode["method"];
      const isPatch = ["PATCH","PUT"].includes(method);
      const nodeId  = `${res}__${method}`;
      if (nodes.find(n => n.id === nodeId)) continue;

      const x = col * X_STEP + 40;
      const y = isPatch ? Y_PATCH : Y_BASE;

      const node: WfNode = {
        id: nodeId, label: spec.title.slice(0, 15),
        schema, resource: res, method, path: ep.path, group: res,
        produces: method === "POST" ? `${res}Id` : undefined,
        color, x, y,
      };
      nodes.push(node);

      if (method === "POST") {
        postNodeByResource[res] = node;
        stages.push({
          id: res,
          label: spec.title.slice(0, 16),
          api: `POST ${ep.path}`,
          produces: `${res}_id`,
          color,
          step: step++,
        });
        col++;
      }
    }

    // Schema field rows — ALL fields with full direction+kind classification
    const pathParamSet = new Set(spec.pathParams || []);
    for (const field of spec.fields) {
      const baseType  = field.type.replace(/\[\]$/, "");
      const isArrType = field.type.includes("[]");
      const isScalar  = SCALAR_TYPES.has(baseType.toLowerCase());

      // Direction
      let direction: FieldDirection;
      if (pathParamSet.has(field.name) || field.isParam) {
        direction = "PARAM";
      } else if (field.readOnly) {
        direction = "OUT";
      } else if (field.writeOnly) {
        direction = "IN";
      } else {
        direction = "IN_OUT";
      }

      // Kind
      let kind: FieldKind;
      if (!isScalar && !isArrType) {
        kind = "REF";
      } else if (!isScalar && isArrType) {
        kind = "ARR_REF";
      } else if (isArrType) {
        kind = "ARR_VAL";
      } else if (baseType === "object") {
        kind = "OBJ";
      } else {
        kind = "VAL";
      }

      schemaFields.push({
        sourceSchema: schema,
        field: field.name,
        fieldType: field.type,
        referencesSchema: isScalar ? "" : baseType,
        sourceApi: spec.title,
        isArray: isArrType,
        direction,
        kind,
        required: field.required || false,
        description: field.description || "",
      });
    }
  }

  // Build edges + transfers from explicit spec.dependencies
  const specBySchema:   Record<string, ApiSpec> = {};
  const specByResource: Record<string, ApiSpec> = {};
  for (const s of specs) {
    if (s.schemaName)   specBySchema[s.schemaName]   = s;
    if (s.resourceName) specByResource[s.resourceName] = s;
  }

  for (const spec of specs) {
    if (!spec.resourceName) continue;
    const toNode = postNodeByResource[spec.resourceName];
    if (!toNode) continue;

    for (const dep of spec.dependencies) {
      const providerSpec =
        specBySchema[dep] ??
        specByResource[dep] ??
        specs.find(s => s.fields.some(f => f.type === dep || f.type === dep + "[]"));
      if (!providerSpec || providerSpec.resourceName === spec.resourceName) continue;

      const fromNode = postNodeByResource[providerSpec.resourceName!];
      if (!fromNode) continue;

      const refField = spec.fields.find(f => {
        const base = f.type.replace(/\[\]$/, "");
        return base === dep;
      });
      const isArr = refField?.type.includes("[]") ?? false;

      if (!edges.find(e => e.from === fromNode.id && e.to === toNode.id && e.field === dep)) {
        edges.push({
          from: fromNode.id, to: toNode.id,
          field: refField?.name || dep,
          type: isArr ? "array" : "object",
          label: `${providerSpec.resourceName}Id → ${refField?.name || dep}`,
        });
      }
      if (!transfers.find(t => t.from === providerSpec.resourceName && t.to === spec.resourceName)) {
        transfers.push({
          from: providerSpec.resourceName!,
          to:   spec.resourceName,
          via:  refField?.name || dep,
          label: `${providerSpec.resourceName}Id`,
        });
      }
    }
  }

  // Also derive edges from schemaField cross-refs not captured above
  for (const row of schemaFields) {
    const depSpec =
      specBySchema[row.referencesSchema] ??
      specs.find(s => s.resourceName === row.referencesSchema);
    const srcSpec = specs.find(s =>
      (s.schemaName || s.resourceName) === row.sourceSchema
    );
    if (!depSpec || !srcSpec || depSpec.resourceName === srcSpec.resourceName) continue;

    const fromNode = depSpec.resourceName ? postNodeByResource[depSpec.resourceName] : null;
    const toNode   = srcSpec.resourceName  ? postNodeByResource[srcSpec.resourceName]  : null;
    if (!fromNode || !toNode) continue;

    if (!edges.find(e => e.from === fromNode.id && e.to === toNode.id && e.field === row.field)) {
      edges.push({
        from: fromNode.id, to: toNode.id,
        field: row.field,
        type: row.isArray ? "array" : "object",
        label: `${row.referencesSchema} → ${row.field}`,
      });
    }
    if (!transfers.find(t => t.from === depSpec.resourceName && t.to === srcSpec.resourceName)) {
      transfers.push({
        from: depSpec.resourceName!,
        to:   srcSpec.resourceName!,
        via:  row.field,
        label: `${depSpec.resourceName}Id`,
      });
    }
  }

  return { nodes, edges, schemaFields, stages, transfers, isEmpty: nodes.length === 0 };
}
