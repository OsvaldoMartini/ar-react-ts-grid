import React, { useState, useCallback, useRef, useEffect } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ApiParameter {
  name: string;
  in: string;
  description: string;
  required: boolean;
  type: string;
}

interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  summary: string;
  description: string;
  requestBodyExample: string;
  parameters: ApiParameter[];
  responses: Record<string, string>;
}

interface ApiDefinition {
  id: string;
  name: string;
  baseUrl: string;
  version: string;
  description: string;
  endpoints: ApiEndpoint[];
}

interface TestStep {
  stepNumber: number;
  name: string;
  endpointPath: string;
  httpMethod: string;
  requestBody: string;
  expectedStatusCode: string;
  description: string;
  extractVariable: string;
  extractJsonPath: string;
  isMock: boolean;
  mockResponse: string;
  status: "Pending" | "Passed" | "Failed";
  lastResult: string;
}

interface TestCase {
  id: string;
  name: string;
  apiName: string;
  endpointPath: string;
  httpMethod: string;
  baseUrl: string;
  requestBody: string;
  headers: Record<string, string>;
  expectedStatusCode: string;
  expectedResponseContains: string;
  description: string;
  tags: string;
  isMock: boolean;
  mockResponse: string;
  isOrchestrated: boolean;
  steps: TestStep[];
  status: "Pending" | "Passed" | "Failed";
  lastResult: string;
  lastRunTime?: string;
  lastDurationMs?: number;
}

interface TestResult {
  id: string;
  testCaseId: string;
  testCaseName: string;
  success: boolean;
  statusCode: number;
  responseBody: string;
  requestBody: string;
  url: string;
  durationMs: number;
  runAt: string;
  errorMessage: string;
}

interface MockResponder {
  id: string;
  name: string;
  pathPattern: string;
  method: string;
  statusCode: number;
  responseBody: string;
  isEnabled: boolean;
  delayMs: number;
  description: string;
}

interface ConsoleMessage {
  timestamp: string;
  level: string;
  message: string;
  color: string;
}

interface AiSettings {
  provider: "Ollama" | "Claude" | "OpenAI";
  ollamaUrl: string;
  ollamaModel: string;
  anthropicApiKey: string;
  openAiApiKey: string;
  openAiModel: string;
  systemPrompt: string;
}

type TabId = "explorer" | "testcases" | "ai" | "mock" | "results" | "console";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET: "#4ade80",
  POST: "#60a5fa",
  PUT: "#fbbf24",
  DELETE: "#f87171",
  PATCH: "#c084fc",
  MULTI: "#fb923c",
};

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "#FF6B6B",
  WARN: "#FFD93D",
  AI: "#A29BFE",
  MOCK: "#74B9FF",
  RUN: "#55EFC4",
  RESULT: "#00B894",
  INFO: "#DFE6E9",
};

const SAMPLE_APIS: ApiDefinition[] = [
  {
    id: "1",
    name: "Transient Stock Exchange API",
    baseUrl: "https://demo.service.avaloq.com/api1",
    version: "1.0.0",
    description: "API for simulating stock exchange transactions",
    endpoints: [
      {
        path: "/simulation/mem-doc-stexs",
        method: "POST",
        summary: "Create stock exchange order",
        description: "Simulates a stock exchange transaction order",
        requestBodyExample: JSON.stringify({ qty: 100, price: 50.5, side: "B", isin: "CH0012221716" }, null, 2),
        parameters: [],
        responses: { "200": "Order created", "400": "Bad request", "401": "Unauthorized" },
      },
      {
        path: "/simulation/mem-doc-stexs/{id}",
        method: "GET",
        summary: "Get order by ID",
        description: "Retrieve a specific stock exchange order",
        requestBodyExample: "",
        parameters: [{ name: "id", in: "path", description: "Order ID", required: true, type: "string" }],
        responses: { "200": "Order found", "404": "Not found" },
      },
      {
        path: "/simulation/mem-doc-stexs/{id}/cancel",
        method: "DELETE",
        summary: "Cancel order",
        description: "Cancel an existing stock exchange order",
        requestBodyExample: "",
        parameters: [{ name: "id", in: "path", description: "Order ID", required: true, type: "string" }],
        responses: { "200": "Cancelled", "404": "Not found" },
      },
    ],
  },
  {
    id: "2",
    name: "Portfolio Management API",
    baseUrl: "https://demo.service.avaloq.com/api2",
    version: "2.1.0",
    description: "Portfolio and asset management endpoints",
    endpoints: [
      {
        path: "/portfolios",
        method: "GET",
        summary: "List portfolios",
        description: "Returns all accessible portfolios",
        requestBodyExample: "",
        parameters: [],
        responses: { "200": "Portfolio list" },
      },
      {
        path: "/portfolios/{id}/positions",
        method: "GET",
        summary: "Get positions",
        description: "Returns all positions for a portfolio",
        requestBodyExample: "",
        parameters: [{ name: "id", in: "path", description: "Portfolio ID", required: true, type: "string" }],
        responses: { "200": "Positions list" },
      },
      {
        path: "/portfolios/{id}/rebalance",
        method: "POST",
        summary: "Rebalance portfolio",
        description: "Trigger a portfolio rebalancing",
        requestBodyExample: JSON.stringify({ targetAllocation: { equity: 60, bonds: 30, cash: 10 } }, null, 2),
        parameters: [],
        responses: { "200": "Rebalanced", "409": "Conflict" },
      },
    ],
  },
];

const SAMPLE_TEST_CASES: TestCase[] = [
  {
    id: "tc1",
    name: "Buy 100 Nestlé shares",
    apiName: "Transient Stock Exchange API",
    endpointPath: "/simulation/mem-doc-stexs",
    httpMethod: "POST",
    baseUrl: "https://demo.service.avaloq.com/api1",
    requestBody: JSON.stringify({ qty: 100, price: 95.5, side: "B", isin: "CH0012221716", account: "C001" }, null, 2),
    headers: {},
    expectedStatusCode: "200",
    expectedResponseContains: "",
    description: "Simulate buying 100 Nestlé shares at market price",
    tags: "smoke,acquisto,equity",
    isMock: false,
    mockResponse: "",
    isOrchestrated: false,
    steps: [],
    status: "Passed",
    lastResult: "200 OK – 142ms",
    lastRunTime: new Date().toISOString(),
    lastDurationMs: 142,
  },
  {
    id: "tc2",
    name: "Liquidity error simulation",
    apiName: "Transient Stock Exchange API",
    endpointPath: "/simulation/mem-doc-stexs",
    httpMethod: "POST",
    baseUrl: "https://demo.service.avaloq.com/api1",
    requestBody: JSON.stringify({ qty: 9999999, price: 95.5, side: "B", isin: "US5949181045", account: "C003" }, null, 2),
    headers: {},
    expectedStatusCode: "400",
    expectedResponseContains: "insufficient_funds",
    description: "Test that large orders fail with insufficient funds error",
    tags: "negative,liquidity",
    isMock: true,
    mockResponse: JSON.stringify({ error: "insufficient_funds", message: "Account balance too low" }, null, 2),
    isOrchestrated: false,
    steps: [],
    status: "Failed",
    lastResult: "Expected 400, got 200",
    lastRunTime: new Date().toISOString(),
    lastDurationMs: 88,
  },
  {
    id: "tc3",
    name: "Portfolio rebalance flow",
    apiName: "Portfolio Management API",
    endpointPath: "(orchestrated)",
    httpMethod: "MULTI",
    baseUrl: "https://demo.service.avaloq.com/api2",
    requestBody: "",
    headers: {},
    expectedStatusCode: "200",
    expectedResponseContains: "",
    description: "Multi-step: list portfolios → get positions → rebalance",
    tags: "orchestrated,portfolio",
    isMock: false,
    mockResponse: "",
    isOrchestrated: true,
    steps: [
      { stepNumber: 1, name: "List portfolios", endpointPath: "/portfolios", httpMethod: "GET", requestBody: "", expectedStatusCode: "200", description: "Fetch portfolio list", extractVariable: "portfolioId", extractJsonPath: "$.data[0].id", isMock: false, mockResponse: "", status: "Pending", lastResult: "" },
      { stepNumber: 2, name: "Get positions", endpointPath: "/portfolios/{{portfolioId}}/positions", httpMethod: "GET", requestBody: "", expectedStatusCode: "200", description: "Get positions of first portfolio", extractVariable: "", extractJsonPath: "", isMock: false, mockResponse: "", status: "Pending", lastResult: "" },
      { stepNumber: 3, name: "Rebalance", endpointPath: "/portfolios/{{portfolioId}}/rebalance", httpMethod: "POST", requestBody: JSON.stringify({ targetAllocation: { equity: 60, bonds: 30, cash: 10 } }, null, 2), expectedStatusCode: "200", description: "Trigger rebalancing", extractVariable: "", extractJsonPath: "", isMock: false, mockResponse: "", status: "Pending", lastResult: "" },
    ],
    status: "Pending",
    lastResult: "",
  },
];

const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: "Claude",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "qwen2.5:14b",
  anthropicApiKey: "",
  openAiApiKey: "",
  openAiModel: "gpt-4o",
  systemPrompt: "Sei un assistente esperto di API bancarie Avaloq. Aiuta a creare richieste REST, generare dati di test e analizzare risposte API. Rispondi sempre in italiano.",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function tryFormatJson(s: string): string {
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
}

function generatePythonServer(api: ApiDefinition): string {
  // Derive the primary resource slug from the first endpoint path
  const resource = api.endpoints[0]?.path.split("/").filter(Boolean)[0] ?? "items";
  const prefix = `/api/v1/${resource}`;
  const lines: string[] = [];
  const L = (x: string) => lines.push(x);

  const has = (m: string) => api.endpoints.some(e => e.method === m);

  L(`#!/usr/bin/env python3`);
  L(`"""Mock server for ${api.name} v${api.version}  —  generated by ApiTestTool`);
  L(`  Install: pip install fastapi uvicorn`);
  L(`  Run    : python serv.py`);
  L(`  Docs   : http://localhost:8080/docs`);
  L(`"""`);
  L(`import os, uuid`);
  L(`from datetime import datetime`);
  L(`from typing import Any, Dict, List, Optional`);
  L(`import uvicorn`);
  L(`from fastapi import FastAPI, HTTPException, Path, Query`);
  L(`from fastapi.middleware.cors import CORSMiddleware`);
  L(``);
  L(`HOST = os.getenv("HOST", "0.0.0.0")`);
  L(`PORT = int(os.getenv("PORT", "8080"))`);
  L(``);
  L(`app = FastAPI(title="${api.name}", version="${api.version}")`);
  L(`app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])`);
  L(``);
  L(`DB: Dict[str, Dict] = {}  # in-memory store`);
  L(``);

  // LIST  (GET without path param)
  if (has("GET")) {
    L(`@app.get("${prefix}")`);
    L(`async def list_items(`);
    L(`    limit: int = Query(20, ge=1, le=500),`);
    L(`    offset: int = Query(0, ge=0),`);
    L(`    filter: Optional[str] = Query(None),`);
    L(`):`);
    L(`    items = list(DB.values())`);
    L(`    if filter:`);
    L(`        items = [r for r in items if any(filter.lower() in str(v).lower() for v in r.values())]`);
    L(`    return {"data": items[offset: offset + limit], "total": len(items)}`);
    L(``);
  }

  // CREATE
  if (has("POST")) {
    L(`@app.post("${prefix}", status_code=201)`);
    L(`async def create_item(payload: Dict[str, Any]):`);
    L(`    rid = str(uuid.uuid4())`);
    L(`    DB[rid] = {**payload, "id": rid, "_created": datetime.utcnow().isoformat()}`);
    L(`    return DB[rid]`);
    L(``);
  }

  // GET by ID
  L(`@app.get("${prefix}/{item_id}")`);
  L(`async def get_item(item_id: str = Path(...)):`);
  L(`    if item_id not in DB:`);
  L(`        raise HTTPException(status_code=404, detail="Not found")`);
  L(`    return DB[item_id]`);
  L(``);

  // UPDATE
  if (has("PATCH") || has("PUT")) {
    const verb = has("PATCH") ? "patch" : "put";
    const method = verb.toUpperCase();
    L(`@app.${verb}("${prefix}/{item_id}")`);
    L(`async def update_item(payload: Dict[str, Any], item_id: str = Path(...)):`);
    L(`    if item_id not in DB:`);
    L(`        raise HTTPException(status_code=404, detail="Not found")`);
    L(`    DB[item_id] = {**DB[item_id], **payload, "_updated": datetime.utcnow().isoformat()}`);
    L(`    return DB[item_id]`);
    L(``);
  }

  // DELETE
  if (has("DELETE")) {
    L(`@app.delete("${prefix}/{item_id}", status_code=204)`);
    L(`async def delete_item(item_id: str = Path(...)):`);
    L(`    if item_id not in DB:`);
    L(`        raise HTTPException(status_code=404, detail="Not found")`);
    L(`    del DB[item_id]`);
    L(``);
  }

  // Health + entry point
  L(`@app.get("/health")`);
  L(`async def health():`);
  L(`    return {"status": "ok", "api": "${api.name}", "records": len(DB), "ts": datetime.utcnow().isoformat()}`);
  L(``);
  L(`if __name__ == "__main__":`);
  L(`    print(f"\\n  ${api.name}  —  http://{{HOST}}:{{PORT}}")`);
  L(`    print(f"  Docs : http://{{HOST}}:{{PORT}}/docs\\n")`);
  L(`    uvicorn.run("serv:app", host=HOST, port=PORT, reload=True, log_level="info")`);

  return lines.join("\n");
}

// helper used by the button click
function downloadPythonServer(api: ApiDefinition): void {
  const code = generatePythonServer(api);
  const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "serv.py";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}


function nowTs() {
  return new Date().toLocaleTimeString("it-IT", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
}

function makeConsoleMsg(raw: string): ConsoleMessage {
  const level = raw.startsWith("[ERROR]") ? "ERROR" :
    raw.startsWith("[WARN]") ? "WARN" :
      raw.startsWith("[AI]") ? "AI" :
        raw.startsWith("[MOCK]") ? "MOCK" :
          raw.startsWith("[RUN]") ? "RUN" :
            raw.startsWith("[RESULT]") ? "RESULT" : "INFO";
  return { timestamp: nowTs(), level, message: raw, color: LEVEL_COLORS[level] };
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1,
      color: METHOD_COLORS[method] ?? "#aaa",
      border: `1px solid ${METHOD_COLORS[method] ?? "#aaa"}`,
      borderRadius: 3, padding: "1px 5px",
      fontFamily: "monospace",
    }}>{method}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = status === "Passed" ? "#4ade80" : status === "Failed" ? "#f87171" : "#94a3b8";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: c, border: `1px solid ${c}`, borderRadius: 3, padding: "1px 6px" }}>
      {status.toUpperCase()}
    </span>
  );
}

function JsonEditor({ value, onChange, height = 200 }: { value: string; onChange: (v: string) => void; height?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", height, background: "#0d1117", color: "#e6edf3",
        border: "1px solid #30363d", borderRadius: 6, padding: 10,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12,
        resize: "vertical", outline: "none", boxSizing: "border-box",
        lineHeight: 1.6,
      }}
      spellCheck={false}
    />
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, small = false, style: extra }: {
  children: React.ReactNode; onClick: () => void; variant?: "primary" | "ghost" | "danger" | "success";
  disabled?: boolean; small?: boolean; style?: React.CSSProperties;
}) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    primary: { bg: "#1d4ed8", color: "#fff", border: "#2563eb" },
    ghost: { bg: "transparent", color: "#94a3b8", border: "#30363d" },
    danger: { bg: "#7f1d1d", color: "#fca5a5", border: "#991b1b" },
    success: { bg: "#14532d", color: "#86efac", border: "#15803d" },
  };
  const c = colors[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: small ? "3px 10px" : "6px 14px",
      fontSize: small ? 11 : 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, fontFamily: "inherit", ...extra,
    }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = "text", style: extra }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        background: "#161b22", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6,
        padding: "5px 10px", fontSize: 12, fontFamily: "inherit", outline: "none",
        width: "100%", boxSizing: "border-box", ...extra,
      }} />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: "#7d8590", marginBottom: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><Label>{label}</Label>{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#58a6ff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, borderBottom: "1px solid #21262d", paddingBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

// TAB 1 – API Explorer
function ExplorerTab({ apis, addConsoleLog }: { apis: ApiDefinition[]; addConsoleLog: (m: string) => void }) {
  const [selectedApi, setSelectedApi] = useState<ApiDefinition | null>(apis[0] ?? null);
  const [selectedEp, setSelectedEp] = useState<ApiEndpoint | null>(apis[0]?.endpoints[0] ?? null);
  const [body, setBody] = useState(apis[0]?.endpoints[0]?.requestBodyExample ?? "{}");
  const [response, setResponse] = useState("");
  const [filter, setFilter] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoints = (selectedApi?.endpoints ?? []).filter(e =>
    !filter || e.path.toLowerCase().includes(filter.toLowerCase()) || e.summary.toLowerCase().includes(filter.toLowerCase())
  );

  const selectEp = (ep: ApiEndpoint) => {
    setSelectedEp(ep);
    setBody(ep.requestBodyExample || "{}");
    setResponse("");
  };

  const runRequest = async () => {
    if (!selectedEp || !selectedApi) return;
    setLoading(true);
    const url = `${selectedApi.baseUrl}${selectedEp.path}`;
    addConsoleLog(`[RUN] ${selectedEp.method} ${url}`);
    const start = Date.now();
    try {
      const opts: RequestInit = {
        method: selectedEp.method,
        headers: { "Content-Type": "application/json", ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}) },
        ...(["POST", "PUT", "PATCH"].includes(selectedEp.method) ? { body } : {}),
      };
      const res = await fetch(url, opts);
      const text = await res.text();
      const dur = Date.now() - start;
      const formatted = tryFormatJson(text);
      setResponse(formatted);
      addConsoleLog(`[RESULT] ${res.status} ${res.statusText} – ${dur}ms`);
    } catch (err: any) {
      const dur = Date.now() - start;
      const errMsg = `Error: ${err.message}`;
      setResponse(errMsg);
      addConsoleLog(`[ERROR] ${errMsg} (${dur}ms)`);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Left: API + Endpoint list */}
      <div style={{ width: 280, borderRight: "1px solid #21262d", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "12px 12px 8px" }}>
          <Label>API</Label>
          <select value={selectedApi?.id ?? ""} onChange={e => {
            const api = apis.find(a => a.id === e.target.value) ?? null;
            setSelectedApi(api);
            setSelectedEp(null);
            setResponse("");
          }} style={{ width: "100%", background: "#161b22", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}>
            {apis.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {selectedApi && (
            <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>
              {selectedApi.endpoints.length} endpoints · v{selectedApi.version}
            </div>
          )}
        </div>
        <div style={{ padding: "0 12px 8px" }}>
          <Input value={filter} onChange={setFilter} placeholder="Filter endpoints…" />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {endpoints.map(ep => (
            <div key={`${ep.method}${ep.path}`} onClick={() => selectEp(ep)}
              style={{
                padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #161b22",
                background: selectedEp === ep ? "#161b22" : "transparent",
                borderLeft: selectedEp === ep ? "2px solid #58a6ff" : "2px solid transparent",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <MethodBadge method={ep.method} />
              </div>
              <div style={{ fontSize: 11, color: "#e6edf3", fontFamily: "monospace", wordBreak: "break-all" }}>{ep.path}</div>
              {ep.summary && <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>{ep.summary}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Request / Response */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedEp ? (
          <>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <MethodBadge method={selectedEp.method} />
              <span style={{ fontFamily: "monospace", fontSize: 13, color: "#e6edf3", flex: 1 }}>{selectedEp.path}</span>
              <Input value={bearerToken} onChange={setBearerToken} placeholder="Bearer Token (optional)" style={{ width: 260 }} />
              <Btn onClick={runRequest} disabled={loading}>{loading ? "Running…" : "▶ Run"}</Btn>
              <Btn onClick={() => setBody(tryFormatJson(body))} variant="ghost" small>{ } Format</Btn>
              <Btn
                onClick={() => selectedApi && downloadPythonServer(selectedApi)}
                variant="ghost"
                small
                disabled={!selectedApi}
                style={{ color: "#a8d08d", borderColor: "#a8d08d" }}
              >
                🐍 Python
              </Btn>
            </div>
            {selectedEp.summary && (
              <div style={{ padding: "6px 16px", background: "#161b22", fontSize: 11, color: "#7d8590", borderBottom: "1px solid #21262d" }}>
                {selectedEp.summary}{selectedEp.description ? ` — ${selectedEp.description}` : ""}
              </div>
            )}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div style={{ flex: 1, padding: 16, borderRight: "1px solid #21262d", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Label>Request Body</Label>
                <JsonEditor value={body} onChange={setBody} height={9999} />
              </div>
              <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Label>Response</Label>
                <JsonEditor value={response || "// Run the request to see the response"} onChange={() => { }} height={9999} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#7d8590", fontSize: 13 }}>
            Select an endpoint from the left panel
          </div>
        )}
      </div>
    </div>
  );
}

// TAB 2 – Test Cases
function TestCasesTab({ testCases, setTestCases, apis, addConsoleLog }: {
  testCases: TestCase[]; setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  apis: ApiDefinition[]; addConsoleLog: (m: string) => void;
}) {
  const [selected, setSelected] = useState<TestCase | null>(testCases[0] ?? null);
  const [filter, setFilter] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState<Partial<TestCase>>({});

  const filtered = testCases.filter(tc =>
    !filter || tc.name.toLowerCase().includes(filter.toLowerCase()) ||
    tc.tags.toLowerCase().includes(filter.toLowerCase()) ||
    tc.endpointPath.toLowerCase().includes(filter.toLowerCase())
  );

  const selectTc = (tc: TestCase) => {
    setSelected(tc);
    setEditing({ ...tc });
  };

  const saveEditing = () => {
    if (!selected) return;
    setTestCases(prev => prev.map(tc => tc.id === selected.id ? { ...tc, ...editing } as TestCase : tc));
    setSelected(prev => prev ? { ...prev, ...editing } as TestCase : prev);
  };

  const runSingle = async (tc: TestCase) => {
    const baseUrl = tc.baseUrl || (apis.find(a => a.name === tc.apiName)?.baseUrl ?? "");
    const url = `${baseUrl}${tc.endpointPath}`;
    addConsoleLog(`[RUN] ${tc.httpMethod} ${url}`);
    const start = Date.now();
    let result: Partial<TestCase> = {};
    try {
      if (tc.isMock) {
        await new Promise(r => setTimeout(r, 50));
        const mockCode = parseInt(tc.mockResponse ? "200" : tc.expectedStatusCode);
        const passed = mockCode === parseInt(tc.expectedStatusCode);
        result = { status: passed ? "Passed" : "Failed", lastResult: `MOCK ${mockCode}`, lastDurationMs: 50 };
      } else {
        const res = await fetch(url, {
          method: tc.httpMethod,
          headers: { "Content-Type": "application/json", ...tc.headers },
          ...(["POST", "PUT", "PATCH"].includes(tc.httpMethod) ? { body: tc.requestBody } : {}),
        });
        const dur = Date.now() - start;
        const text = await res.text();
        const passed = res.status === parseInt(tc.expectedStatusCode) &&
          (!tc.expectedResponseContains || text.includes(tc.expectedResponseContains));
        result = { status: passed ? "Passed" : "Failed", lastResult: `${res.status} – ${dur}ms`, lastDurationMs: dur };
      }
    } catch (err: any) {
      result = { status: "Failed", lastResult: `Error: ${err.message}`, lastDurationMs: Date.now() - start };
    }
    addConsoleLog(`[RESULT] ${tc.name}: ${result.status} (${result.lastResult})`);
    setTestCases(prev => prev.map(t => t.id === tc.id ? { ...t, ...result, lastRunTime: new Date().toISOString() } : t));
    if (selected?.id === tc.id) setSelected(prev => prev ? { ...prev, ...result, lastRunTime: new Date().toISOString() } : prev);
  };

  const runAll = async () => {
    setRunning(true);
    setProgress(0);
    for (let i = 0; i < testCases.length; i++) {
      await runSingle(testCases[i]);
      setProgress(Math.round(((i + 1) / testCases.length) * 100));
    }
    setRunning(false);
  };

  const addNew = () => {
    const tc: TestCase = {
      id: Math.random().toString(36).slice(2),
      name: "New Test Case",
      apiName: apis[0]?.name ?? "",
      endpointPath: "",
      httpMethod: "POST",
      baseUrl: apis[0]?.baseUrl ?? "",
      requestBody: "{}",
      headers: {},
      expectedStatusCode: "200",
      expectedResponseContains: "",
      description: "",
      tags: "",
      isMock: false,
      mockResponse: "",
      isOrchestrated: false,
      steps: [],
      status: "Pending",
      lastResult: "",
    };
    setTestCases(prev => [...prev, tc]);
    setSelected(tc);
    setEditing({ ...tc });
  };

  const deleteTc = (id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* List */}
      <div style={{ width: 300, borderRight: "1px solid #21262d", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #21262d" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <Btn onClick={addNew} small>+ New</Btn>
            <Btn onClick={runAll} disabled={running} variant="success" small>{running ? `Running ${progress}%` : "▶ Run All"}</Btn>
          </div>
          <Input value={filter} onChange={setFilter} placeholder="Filter test cases…" />
          {running && (
            <div style={{ marginTop: 6, background: "#21262d", borderRadius: 4, height: 4, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#4ade80", transition: "width 0.3s" }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map(tc => (
            <div key={tc.id} onClick={() => selectTc(tc)}
              style={{
                padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #161b22",
                background: selected?.id === tc.id ? "#161b22" : "transparent",
                borderLeft: selected?.id === tc.id ? "2px solid #58a6ff" : "2px solid transparent",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <StatusBadge status={tc.status} />
                <MethodBadge method={tc.httpMethod} />
              </div>
              <div style={{ fontSize: 12, color: "#e6edf3", fontWeight: 600 }}>{tc.name}</div>
              <div style={{ fontSize: 10, color: "#7d8590", fontFamily: "monospace" }}>{tc.endpointPath}</div>
              {tc.tags && <div style={{ fontSize: 10, color: "#58a6ff", marginTop: 2 }}>{tc.tags}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {selected ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "#e6edf3" }}>{selected.name}</h3>
              <StatusBadge status={selected.status} />
              {selected.lastResult && <span style={{ fontSize: 11, color: "#7d8590" }}>{selected.lastResult}</span>}
              <div style={{ flex: 1 }} />
              <Btn onClick={() => runSingle(selected)} variant="success" small>▶ Run</Btn>
              <Btn onClick={saveEditing} small>💾 Save</Btn>
              <Btn onClick={() => deleteTc(selected.id)} variant="danger" small>🗑</Btn>
            </div>

            {selected.isOrchestrated ? (
              <div>
                <Section title="Orchestrated Steps">
                  {selected.steps.map((step, i) => (
                    <div key={i} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#7d8590" }}>Step {step.stepNumber}</span>
                        <MethodBadge method={step.httpMethod} />
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#e6edf3" }}>{step.endpointPath}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#7d8590" }}>{step.description}</div>
                      {step.extractVariable && (
                        <div style={{ fontSize: 10, color: "#A29BFE", marginTop: 4 }}>
                          Extract: <code style={{ fontFamily: "monospace" }}>{step.extractVariable}</code> from <code style={{ fontFamily: "monospace" }}>{step.extractJsonPath}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </Section>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <Field label="Name"><Input value={editing.name ?? ""} onChange={v => setEditing(e => ({ ...e, name: v }))} /></Field>
                  <Field label="Endpoint Path"><Input value={editing.endpointPath ?? ""} onChange={v => setEditing(e => ({ ...e, endpointPath: v }))} placeholder="/api/endpoint" /></Field>
                  <Field label="Base URL"><Input value={editing.baseUrl ?? ""} onChange={v => setEditing(e => ({ ...e, baseUrl: v }))} placeholder="https://…" /></Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Field label="Method">
                      <select value={editing.httpMethod ?? "POST"} onChange={e => setEditing(ed => ({ ...ed, httpMethod: e.target.value }))}
                        style={{ width: "100%", background: "#161b22", color: METHOD_COLORS[editing.httpMethod ?? "POST"] ?? "#fff", border: "1px solid #30363d", borderRadius: 6, padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}>
                        {["GET", "POST", "PUT", "DELETE", "PATCH"].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Expected Status"><Input value={editing.expectedStatusCode ?? "200"} onChange={v => setEditing(e => ({ ...e, expectedStatusCode: v }))} /></Field>
                  </div>
                  <Field label="Expected Contains"><Input value={editing.expectedResponseContains ?? ""} onChange={v => setEditing(e => ({ ...e, expectedResponseContains: v }))} placeholder="optional substring check" /></Field>
                  <Field label="Tags"><Input value={editing.tags ?? ""} onChange={v => setEditing(e => ({ ...e, tags: v }))} placeholder="tag1,tag2" /></Field>
                  <Field label="Description"><Input value={editing.description ?? ""} onChange={v => setEditing(e => ({ ...e, description: v }))} /></Field>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={editing.isMock ?? false} onChange={e => setEditing(ed => ({ ...ed, isMock: e.target.checked }))} id="isMock" />
                    <label htmlFor="isMock" style={{ fontSize: 12, color: "#94a3b8" }}>Is Mock</label>
                  </div>
                </div>
                <div>
                  <Field label="Request Body">
                    <JsonEditor value={editing.requestBody ?? "{}"} onChange={v => setEditing(e => ({ ...e, requestBody: v }))} height={200} />
                  </Field>
                  {editing.isMock && (
                    <Field label="Mock Response">
                      <JsonEditor value={editing.mockResponse ?? "{}"} onChange={v => setEditing(e => ({ ...e, mockResponse: v }))} height={160} />
                    </Field>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#7d8590", fontSize: 13 }}>
            Select or create a test case
          </div>
        )}
      </div>
    </div>
  );
}

// TAB 3 – AI Assistant
function AiTab({ apis, testCases, setTestCases, aiSettings, setAiSettings, addConsoleLog }: {
  apis: ApiDefinition[]; testCases: TestCase[]; setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  aiSettings: AiSettings; setAiSettings: (s: AiSettings) => void; addConsoleLog: (m: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "generate" | "orchestrate">("chat");

  const buildSystemPrompt = () => {
    const apiList = apis.map(a => `- ${a.name} v${a.version}: ${a.endpoints.length} endpoints, BaseURL: ${a.baseUrl}`).join("\n");
    const epSample = apis.flatMap(a => a.endpoints).slice(0, 20).map(e => `  ${e.method} ${e.path}: ${e.summary}`).join("\n");
    return `${aiSettings.systemPrompt}

API caricate (${apis.length} totali):
${apiList}

Endpoint (campione):
${epSample}

Dati bancari statici:
- Conti: C001 (EUR 150k), C002 (CHF 2.5M), C003 (USD 75k)
- ISIN: CH0012221716 (Nestlé), US5949181045 (Microsoft), DE0005140008 (Deutsche Bank)
- BP: BP001 (Mario Rossi), BP002 (Banca Svizzera SA)
- Portfolio: P001 (Balanced Growth), P002 (Conservative Income)`;
  };

  const callClaude = async (userPrompt: string): Promise<string> => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? "Nessuna risposta.";
  };

  const send = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    addConsoleLog(`[AI] Sending to ${aiSettings.provider}: ${prompt.slice(0, 80)}…`);

    try {
      let result = "";
      if (mode === "chat") {
        if (aiSettings.provider === "Claude") {
          result = await callClaude(prompt);
        } else if (aiSettings.provider === "Ollama") {
          const res = await fetch(`${aiSettings.ollamaUrl.replace(/\/$/, "")}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: aiSettings.ollamaModel, prompt, stream: false, options: { temperature: 0.3 } }),
          });
          const d = await res.json();
          result = d.response ?? "Nessuna risposta.";
        } else {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiSettings.openAiApiKey}` },
            body: JSON.stringify({ model: aiSettings.openAiModel, max_tokens: 1000, messages: [{ role: "system", content: buildSystemPrompt() }, { role: "user", content: prompt }] }),
          });
          const d = await res.json();
          result = d.choices?.[0]?.message?.content ?? d.error?.message ?? "Nessuna risposta.";
        }
        setResponse(result);
        addConsoleLog(`[AI] Response received (${result.length} chars)`);
      } else if (mode === "generate") {
        const genPrompt = `Genera un test case bancario per: ${prompt}\n\nRispondi SOLO con JSON:\n{"name":"","description":"","endpointPath":"/path","httpMethod":"POST","requestBody":{},"expectedStatusCode":"200","tags":""}`;
        const raw = aiSettings.provider === "Claude" ? await callClaude(genPrompt) : prompt;
        setResponse(raw);
        try {
          const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
          if (s >= 0 && e > s) {
            const j = JSON.parse(raw.slice(s, e + 1));
            const tc: TestCase = {
              id: Math.random().toString(36).slice(2),
              name: j.name ?? "AI Generated Test",
              apiName: apis[0]?.name ?? "",
              endpointPath: j.endpointPath ?? "",
              httpMethod: j.httpMethod ?? "POST",
              baseUrl: apis[0]?.baseUrl ?? "",
              requestBody: typeof j.requestBody === "object" ? JSON.stringify(j.requestBody, null, 2) : j.requestBody ?? "{}",
              headers: {},
              expectedStatusCode: j.expectedStatusCode ?? "200",
              expectedResponseContains: "",
              description: j.description ?? "",
              tags: (j.tags ?? "ai-generated"),
              isMock: false,
              mockResponse: "",
              isOrchestrated: false,
              steps: [],
              status: "Pending",
              lastResult: "",
            };
            setTestCases(prev => [...prev, tc]);
            addConsoleLog(`[AI] Test case generated: ${tc.name}`);
          }
        } catch { addConsoleLog("[AI] Could not parse generated test case JSON"); }
      }
    } catch (err: any) {
      const msg = `Errore: ${err.message}`;
      setResponse(msg);
      addConsoleLog(`[ERROR] AI call failed: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Settings sidebar */}
      <div style={{ width: 260, borderRight: "1px solid #21262d", padding: 16, overflowY: "auto", flexShrink: 0 }}>
        <Section title="Provider">
          <Field label="AI Provider">
            <select value={aiSettings.provider} onChange={e => setAiSettings({ ...aiSettings, provider: e.target.value as any })}
              style={{ width: "100%", background: "#161b22", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}>
              <option value="Claude">Claude (Anthropic)</option>
              <option value="Ollama">Ollama (Local)</option>
              <option value="OpenAI">OpenAI</option>
            </select>
          </Field>
          {aiSettings.provider === "Claude" && (
            <Field label="Anthropic API Key">
              <Input type="password" value={aiSettings.anthropicApiKey} onChange={v => setAiSettings({ ...aiSettings, anthropicApiKey: v })} placeholder="sk-ant-…" />
            </Field>
          )}
          {aiSettings.provider === "Ollama" && (
            <>
              <Field label="Ollama URL"><Input value={aiSettings.ollamaUrl} onChange={v => setAiSettings({ ...aiSettings, ollamaUrl: v })} /></Field>
              <Field label="Model"><Input value={aiSettings.ollamaModel} onChange={v => setAiSettings({ ...aiSettings, ollamaModel: v })} /></Field>
            </>
          )}
          {aiSettings.provider === "OpenAI" && (
            <>
              <Field label="OpenAI API Key"><Input type="password" value={aiSettings.openAiApiKey} onChange={v => setAiSettings({ ...aiSettings, openAiApiKey: v })} placeholder="sk-…" /></Field>
              <Field label="Model"><Input value={aiSettings.openAiModel} onChange={v => setAiSettings({ ...aiSettings, openAiModel: v })} /></Field>
            </>
          )}
        </Section>
        <Section title="Mode">
          {(["chat", "generate"] as const).map(m => (
            <div key={m} onClick={() => setMode(m)} style={{
              padding: "6px 10px", marginBottom: 4, borderRadius: 6, cursor: "pointer", fontSize: 12,
              background: mode === m ? "#1d4ed820" : "transparent",
              border: `1px solid ${mode === m ? "#1d4ed8" : "#21262d"}`,
              color: mode === m ? "#60a5fa" : "#94a3b8",
            }}>
              {m === "chat" ? "💬 Chat" : "🧪 Generate Test Case"}
            </div>
          ))}
        </Section>
        <Section title="Static Banking Data">
          <div style={{ fontSize: 10, color: "#7d8590", lineHeight: 1.8 }}>
            <div>💰 C001 EUR 150k · C002 CHF 2.5M</div>
            <div>📈 Nestlé CH0012221716</div>
            <div>📈 Microsoft US5949181045</div>
            <div>👤 BP001 Mario Rossi</div>
            <div>📁 P001 Balanced Growth</div>
          </div>
        </Section>
      </div>

      {/* Main AI area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 12, overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {response ? (
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10, color: "#7d8590", marginBottom: 8 }}>AI RESPONSE · {aiSettings.provider}</div>
              <pre style={{ margin: 0, fontFamily: "monospace", fontSize: 12, color: "#e6edf3", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{response}</pre>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#7d8590", gap: 8 }}>
              <div style={{ fontSize: 32 }}>🤖</div>
              <div style={{ fontSize: 13 }}>AI Banking Assistant</div>
              <div style={{ fontSize: 11, textAlign: "center", maxWidth: 340 }}>
                Try: "Crea un ordine di acquisto di 100 azioni Nestlé a mercato" or "Genera 5 test per errori di liquidità"
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }}
            placeholder={mode === "generate" ? "Describe the test case to generate…" : "Ask anything about the banking APIs…"}
            style={{
              flex: 1, background: "#161b22", color: "#e6edf3", border: "1px solid #30363d",
              borderRadius: 8, padding: 10, fontSize: 12, fontFamily: "inherit",
              resize: "none", height: 80, outline: "none",
            }} />
          <Btn onClick={send} disabled={loading || !prompt.trim()} style={{ alignSelf: "flex-end", height: 40 }}>
            {loading ? "…" : "Send"}
          </Btn>
        </div>
        <div style={{ fontSize: 10, color: "#7d8590" }}>Ctrl+Enter to send · {mode === "generate" ? "Will auto-add generated test case" : "Chat mode"}</div>
      </div>
    </div>
  );
}

// TAB 4 – Mock Server
function MockTab({ mocks, setMocks }: { mocks: MockResponder[]; setMocks: React.Dispatch<React.SetStateAction<MockResponder[]>> }) {
  const [selected, setSelected] = useState<MockResponder | null>(mocks[0] ?? null);
  const [editing, setEditing] = useState<Partial<MockResponder>>({});

  const add = () => {
    const m: MockResponder = {
      id: Math.random().toString(36).slice(2),
      name: "New Mock",
      pathPattern: "/api/*",
      method: "POST",
      statusCode: 200,
      responseBody: '{\n  "status": "ok",\n  "message": "Mock response"\n}',
      isEnabled: true,
      delayMs: 0,
      description: "",
    };
    setMocks(prev => [...prev, m]);
    setSelected(m);
    setEditing({ ...m });
  };

  const save = () => {
    if (!selected) return;
    setMocks(prev => prev.map(m => m.id === selected.id ? { ...m, ...editing } as MockResponder : m));
  };

  const del = (id: string) => {
    setMocks(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const toggle = (id: string) => {
    setMocks(prev => prev.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m));
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      <div style={{ width: 280, borderRight: "1px solid #21262d", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #21262d" }}>
          <Btn onClick={add} small>+ Add Mock</Btn>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {mocks.map(m => (
            <div key={m.id} onClick={() => { setSelected(m); setEditing({ ...m }); }}
              style={{
                padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #161b22",
                background: selected?.id === m.id ? "#161b22" : "transparent",
                borderLeft: selected?.id === m.id ? "2px solid #58a6ff" : "2px solid transparent",
                opacity: m.isEnabled ? 1 : 0.45,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <div onClick={e => { e.stopPropagation(); toggle(m.id); }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: m.isEnabled ? "#4ade80" : "#374151", cursor: "pointer" }} />
                <MethodBadge method={m.method} />
                <span style={{ fontSize: 10, color: "#7d8590" }}>{m.statusCode}</span>
              </div>
              <div style={{ fontSize: 12, color: "#e6edf3", fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: "#7d8590", fontFamily: "monospace" }}>{m.pathPattern}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
        {selected ? (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <h3 style={{ margin: 0, flex: 1, fontSize: 14, color: "#e6edf3" }}>{selected.name}</h3>
              <Btn onClick={save} small>💾 Save</Btn>
              <Btn onClick={() => del(selected.id)} variant="danger" small>🗑</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <Field label="Name"><Input value={editing.name ?? ""} onChange={v => setEditing(e => ({ ...e, name: v }))} /></Field>
                <Field label="Path Pattern"><Input value={editing.pathPattern ?? ""} onChange={v => setEditing(e => ({ ...e, pathPattern: v }))} placeholder="/api/* or /api/specific" /></Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Field label="Method">
                    <select value={editing.method ?? "POST"} onChange={e => setEditing(ed => ({ ...ed, method: e.target.value }))}
                      style={{ width: "100%", background: "#161b22", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}>
                      {["GET", "POST", "PUT", "DELETE", "PATCH", "*"].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label="Status Code"><Input value={String(editing.statusCode ?? 200)} onChange={v => setEditing(e => ({ ...e, statusCode: parseInt(v) || 200 }))} /></Field>
                </div>
                <Field label="Delay (ms)"><Input value={String(editing.delayMs ?? 0)} onChange={v => setEditing(e => ({ ...e, delayMs: parseInt(v) || 0 }))} /></Field>
                <Field label="Description"><Input value={editing.description ?? ""} onChange={v => setEditing(e => ({ ...e, description: v }))} /></Field>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={editing.isEnabled ?? true} onChange={e => setEditing(ed => ({ ...ed, isEnabled: e.target.checked }))} id="mockEnabled" />
                  <label htmlFor="mockEnabled" style={{ fontSize: 12, color: "#94a3b8" }}>Enabled</label>
                </div>
              </div>
              <div>
                <Field label="Response Body">
                  <JsonEditor value={editing.responseBody ?? "{}"} onChange={v => setEditing(e => ({ ...e, responseBody: v }))} height={300} />
                </Field>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#7d8590" }}>
            Select or create a mock responder
          </div>
        )}
      </div>
    </div>
  );
}

// TAB 5 – Results
function ResultsTab({ results, setResults }: { results: TestResult[]; setResults: React.Dispatch<React.SetStateAction<TestResult[]>> }) {
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const [selected, setSelected] = useState<TestResult | null>(null);

  const exportCSV = () => {
    const headers = ["Name", "Success", "Status", "Duration(ms)", "URL", "Run At", "Error"];
    const rows = results.map(r => [r.testCaseName, r.success ? "PASS" : "FAIL", r.statusCode, r.durationMs, r.url, r.runAt, r.errorMessage]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Results_${new Date().toISOString().slice(0, 16).replace(":", "-")}.csv`;
    a.click();
  };

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      {/* Summary bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <span style={{ color: "#94a3b8" }}>Total: <strong style={{ color: "#e6edf3" }}>{results.length}</strong></span>
          <span style={{ color: "#4ade80" }}>Passed: <strong>{passed}</strong></span>
          <span style={{ color: "#f87171" }}>Failed: <strong>{failed}</strong></span>
          {results.length > 0 && (
            <span style={{ color: "#94a3b8" }}>Pass rate: <strong style={{ color: passed / results.length > 0.8 ? "#4ade80" : "#f87171" }}>{((passed / results.length) * 100).toFixed(1)}%</strong></span>
          )}
          {results.length > 0 && (
            <span style={{ color: "#94a3b8" }}>Avg: <strong style={{ color: "#e6edf3" }}>{Math.round(results.reduce((s, r) => s + r.durationMs, 0) / results.length)}ms</strong></span>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <Btn onClick={exportCSV} variant="ghost" small disabled={results.length === 0}>⬇ Export CSV</Btn>
        <Btn onClick={() => { setResults([]); setSelected(null); }} variant="danger" small disabled={results.length === 0}>Clear</Btn>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#161b22", position: "sticky", top: 0 }}>
                {["", "Test Name", "Status", "Duration", "URL", "Run At"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#7d8590", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #21262d" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  style={{ cursor: "pointer", background: selected?.id === r.id ? "#1d4ed820" : "transparent", borderBottom: "1px solid #161b22" }}>
                  <td style={{ padding: "7px 12px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.success ? "#4ade80" : "#f87171" }} />
                  </td>
                  <td style={{ padding: "7px 12px", color: "#e6edf3", fontWeight: 500 }}>{r.testCaseName}</td>
                  <td style={{ padding: "7px 12px" }}><StatusBadge status={r.success ? "Passed" : "Failed"} /></td>
                  <td style={{ padding: "7px 12px", color: "#94a3b8", fontFamily: "monospace" }}>{r.durationMs}ms</td>
                  <td style={{ padding: "7px 12px", color: "#7d8590", fontFamily: "monospace", fontSize: 11 }}>{r.url.length > 50 ? r.url.slice(0, 50) + "…" : r.url}</td>
                  <td style={{ padding: "7px 12px", color: "#7d8590", fontSize: 10 }}>{new Date(r.runAt).toLocaleTimeString()}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#7d8590" }}>No results yet. Run tests to see results here.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 360, borderLeft: "1px solid #21262d", padding: 16, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <strong style={{ fontSize: 13, color: "#e6edf3" }}>{selected.testCaseName}</strong>
              <StatusBadge status={selected.success ? "Passed" : "Failed"} />
            </div>
            <div style={{ fontSize: 10, color: "#7d8590", marginBottom: 12 }}>
              <div>Status: {selected.statusCode} · {selected.durationMs}ms</div>
              <div style={{ fontFamily: "monospace", marginTop: 4, wordBreak: "break-all" }}>{selected.url}</div>
              {selected.errorMessage && <div style={{ color: "#f87171", marginTop: 4 }}>{selected.errorMessage}</div>}
            </div>
            {selected.requestBody && (
              <div style={{ marginBottom: 12 }}>
                <Label>Request</Label>
                <pre style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, padding: 8, margin: 0, fontSize: 10, color: "#e6edf3", overflow: "auto", maxHeight: 120 }}>{tryFormatJson(selected.requestBody)}</pre>
              </div>
            )}
            <div>
              <Label>Response</Label>
              <pre style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, padding: 8, margin: 0, fontSize: 10, color: "#e6edf3", overflow: "auto", maxHeight: 200 }}>{tryFormatJson(selected.responseBody)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// TAB 6 – Console
function ConsoleTab({ messages, clear }: { messages: ConsoleMessage[]; clear: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #21262d", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#7d8590" }}>{messages.length} messages</span>
        <div style={{ flex: 1 }} />
        {(["INFO", "ERROR", "WARN", "AI", "MOCK", "RUN", "RESULT"] as const).map(lvl => (
          <span key={lvl} style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, border: `1px solid ${LEVEL_COLORS[lvl]}`, color: LEVEL_COLORS[lvl] }}>{lvl}</span>
        ))}
        <Btn onClick={clear} variant="danger" small>Clear</Btn>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", fontFamily: "monospace", fontSize: 11 }}>
        {[...messages].reverse().map((m, i) => (
          <div key={i} style={{ marginBottom: 3, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#7d8590", flexShrink: 0 }}>{m.timestamp}</span>
            <span style={{ color: m.color, flexShrink: 0, fontWeight: 700, width: 48 }}>{m.level}</span>
            <span style={{ color: m.color, wordBreak: "break-word" }}>{m.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
        {messages.length === 0 && <div style={{ color: "#7d8590", textAlign: "center", paddingTop: 40 }}>Console is empty</div>}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// Props interface mirrors GridItem / GridItemComp so index.tsx can call it
// the same way:
//   <ApiTestTool homeBankingIdInitial={homeBanking} socketPort={socketPort}
//                sessionId={sessionId} botJobIdInitial={botJobId}
//                botJobNameInitial={botJobName} />
interface ApiTestToolProps {
  homeBankingIdInitial: number;
  homeBankNameInitial: string;
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
}

const ApiTestToolAI: React.FC<ApiTestToolProps> = ({
  homeBankingIdInitial,
  homeBankNameInitial,
  socketPort,
  sessionId,
  botJobIdInitial,
  botJobNameInitial,
}) => {
  // Mirror the pattern used by GridItem / GridItemComp
  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [homeBankName, setHomeBankName] = useState<string>(homeBankNameInitial);
  const [botJobId, setBotJobId] = useState<number>(botJobIdInitial);
  const [botJobName, setBotJobName] = useState<string>(botJobNameInitial);

  // Keep local state in sync if parent re-renders with new props
  useEffect(() => {
    setHomeBankingId(homeBankingIdInitial);
    setHomeBankName(homeBankNameInitial);
  }, [homeBankingIdInitial, homeBankNameInitial]);
  useEffect(() => { setBotJobId(botJobIdInitial); }, [botJobIdInitial]);
  useEffect(() => { setBotJobName(botJobNameInitial); }, [botJobNameInitial]);

  const [activeTab, setActiveTab] = useState<TabId>("explorer");
  const [apis] = useState<ApiDefinition[]>(SAMPLE_APIS);
  const [testCases, setTestCases] = useState<TestCase[]>(SAMPLE_TEST_CASES);
  const [results, setResults] = useState<TestResult[]>([]);
  const [mocks, setMocks] = useState<MockResponder[]>([
    { id: "m1", name: "Stock Exchange Mock", pathPattern: "/simulation/*", method: "POST", statusCode: 200, responseBody: JSON.stringify({ id: "ord_001", status: "accepted", timestamp: new Date().toISOString() }, null, 2), isEnabled: true, delayMs: 100, description: "Mock all stock exchange calls" },
  ]);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    { timestamp: nowTs(), level: "INFO", message: `API Test Tool – Banking Suite initialized  [homeBanking=${homeBankingIdInitial} | botJob=${botJobIdInitial} | session=${sessionId}]`, color: LEVEL_COLORS.INFO },
    { timestamp: nowTs(), level: "INFO", message: `Loaded ${SAMPLE_APIS.length} APIs, ${SAMPLE_TEST_CASES.length} test cases  |  socket=${socketPort}`, color: LEVEL_COLORS.INFO },
  ]);
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);

  const addConsoleLog = useCallback((raw: string) => {
    setConsoleMessages(prev => {
      const next = [makeConsoleMsg(raw), ...prev];
      return next.slice(0, 500);
    });
  }, []);

  const TABS: { id: TabId; label: string; icon: string; badge?: number }[] = [
    { id: "explorer", label: "API Explorer", icon: "🔍" },
    { id: "testcases", label: "Test Cases", icon: "🧪", badge: testCases.length },
    { id: "ai", label: "AI Assistant", icon: "🤖" },
    { id: "mock", label: "Mock Server", icon: "🎭", badge: mocks.filter(m => m.isEnabled).length },
    { id: "results", label: "Results", icon: "📊", badge: results.length || undefined },
    { id: "console", label: "Console", icon: "🖥", badge: consoleMessages.filter(m => m.level === "ERROR").length || undefined },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0d1117", color: "#e6edf3",
      fontFamily: "'Segoe UI', 'SF Pro Text', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ background: "#161b22", borderBottom: "1px solid #30363d", padding: "0 16px", display: "flex", alignItems: "center", gap: 12, height: 48, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3", lineHeight: 1 }}>API Test Tool</div>
            <div style={{ fontSize: 9, color: "#7d8590", letterSpacing: 1 }}>BANKING SUITE · AVALOQ</div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: "#30363d" }} />

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
          <span style={{ color: "#7d8590" }}>{apis.length} APIs</span>
          <span style={{ color: "#7d8590" }}>{apis.flatMap(a => a.endpoints).length} Endpoints</span>
          <span style={{ color: testCases.filter(t => t.status === "Passed").length > 0 ? "#4ade80" : "#7d8590" }}>
            {testCases.filter(t => t.status === "Passed").length} Passed
          </span>
          <span style={{ color: testCases.filter(t => t.status === "Failed").length > 0 ? "#f87171" : "#7d8590" }}>
            {testCases.filter(t => t.status === "Failed").length} Failed
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 4 }}>
          {[{ c: "#f87171", t: "Active Mocks" }, { c: "#fbbf24" }, { c: "#4ade80" }].map(({ c, t }, i) => (
            <div key={i} title={t} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: "#161b22", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0 }}>
        {TABS.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 500,
              color: activeTab === tab.id ? "#e6edf3" : "#7d8590",
              borderBottom: activeTab === tab.id ? "2px solid #58a6ff" : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 5, position: "relative",
              transition: "color 0.15s",
            }}>
            <span style={{ fontSize: 13 }}>{tab.icon}</span>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span style={{ fontSize: 9, background: tab.id === "console" && consoleMessages.some(m => m.level === "ERROR") ? "#7f1d1d" : "#21262d", color: "#e6edf3", borderRadius: 10, padding: "1px 5px", fontWeight: 700 }}>{tab.badge}</span>
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "explorer" && <ExplorerTab apis={apis} addConsoleLog={addConsoleLog} />}
        {activeTab === "testcases" && <TestCasesTab testCases={testCases} setTestCases={setTestCases} apis={apis} addConsoleLog={addConsoleLog} />}
        {activeTab === "ai" && <AiTab apis={apis} testCases={testCases} setTestCases={setTestCases} aiSettings={aiSettings} setAiSettings={setAiSettings} addConsoleLog={addConsoleLog} />}
        {activeTab === "mock" && <MockTab mocks={mocks} setMocks={setMocks} />}
        {activeTab === "results" && <ResultsTab results={results} setResults={setResults} />}
        {activeTab === "console" && <ConsoleTab messages={consoleMessages} clear={() => setConsoleMessages([])} />}
      </div>

      {/* Status bar */}
      <div style={{ background: "#161b22", borderTop: "1px solid #21262d", padding: "3px 16px", display: "flex", gap: 16, fontSize: 10, color: "#7d8590", flexShrink: 0 }}>
        <span>API Test Tool v1.0</span>
        <span>·</span>
        <span>{mocks.filter(m => m.isEnabled).length} active mocks</span>
        <span>·</span>
        <span>AI: {aiSettings.provider}</span>
        <span>·</span>
        <span>homeBanking={homeBankingId}</span>
        <span>·</span>
        <span>botJob={botJobId} {botJobName ? `· ${botJobName}` : ""}</span>
        <div style={{ flex: 1 }} />
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default ApiTestToolAI;
