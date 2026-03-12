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

function fieldsFromSchema(schema: any): { name: string; type: string; description: string; required: boolean }[] {
  const fields: { name: string; type: string; description: string; required: boolean }[] = [];
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
    fields.push({ name: prop, type, description: d.description || "", required: required.has(prop) });
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
    dependencies: [], fields: [], description: "",
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

        // Extract endpoints
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
          }
        }

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
export interface WfFieldRow {
  sourceSchema: string; field: string; fieldType: string;
  referencesSchema: string; sourceApi: string; isArray: boolean;
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

    // Schema field rows — only non-scalar cross-refs
    for (const field of spec.fields) {
      const baseType = field.type.replace(/\[\]$/, "");
      if (SCALAR_TYPES.has(baseType.toLowerCase())) continue;
      schemaFields.push({
        sourceSchema: schema,
        field: field.name,
        fieldType: field.type.includes("[]") ? "array" : "object",
        referencesSchema: baseType,
        sourceApi: spec.title,
        isArray: field.type.includes("[]"),
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