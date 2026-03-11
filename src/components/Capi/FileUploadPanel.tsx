import React, { createRef } from "react";
import { db, ApiSpec, DEFAULT_SPEC, CAT_COLORS } from "./utils";
import { MethodBadge } from "./AtomComponents";

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD PANEL  — API spec file loader + spec list
// ═══════════════════════════════════════════════════════════════
interface FileUploadPanelProps {
  onSpecLoaded: (spec: ApiSpec) => void;
  loadedSpecs: ApiSpec[];
  provider: string;
  setProvider: (v: string) => void;
  ollamaUrl: string;
  setOllamaUrl: (v: string) => void;
}

interface FileUploadPanelState {
  drag: boolean;
  parsing: boolean;
  results: { ok: boolean; spec: ApiSpec }[];
  expanded: number | null;
  showDeps: boolean;
}

const ACCEPTED_EXTS = [".yaml", ".yml", ".json", ".schema", ".proto", ".pdf"];

export class FileUploadPanel extends React.Component<FileUploadPanelProps, FileUploadPanelState> {
  state: FileUploadPanelState = {
    drag: false,
    parsing: false,
    results: [],
    expanded: null,
    showDeps: false,
  };

  private folderRef = createRef<HTMLInputElement>();
  private fileRef = createRef<HTMLInputElement>();

  private processFiles = async (files: FileList | null) => {
    if (!files) return;
    this.setState({ parsing: true });
    const arr = Array.from(files).filter(f =>
      ACCEPTED_EXTS.includes("." + f.name.split(".").pop()!.toLowerCase())
    );
    const newResults: { ok: boolean; spec: ApiSpec }[] = [];
    for (const f of arr) {
      const ext = f.name.split(".").pop()!.toLowerCase();
      try {
        let content = "";
        if (ext === "pdf") {
          const buf = await f.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let text = "";
          for (let i = 0; i < bytes.length; i++) {
            const c = bytes[i];
            if (c >= 32 && c < 127) text += String.fromCharCode(c);
            else if (c === 10 || c === 13) text += " ";
          }
          content = text.slice(0, 8000);
        } else {
          content = await f.text();
        }
        const spec = parseApiSpec(f.name, content, ext);
        db.loadSpec(spec);
        this.props.onSpecLoaded(spec);
        newResults.push({ ok: !spec.parseError, spec });
      } catch {
        // skip
      }
    }
    this.setState(s => ({ parsing: false, results: [...s.results, ...newResults] }));
  };

  private getCategory(spec: ApiSpec): string {
    if (spec.tags?.length) return spec.tags[0];
    if (spec.resourceName?.includes("addr")) return "Address Management";
    if (spec.resourceName?.includes("client")) return "Client Management";
    return "General";
  }

  render() {
    const { loadedSpecs, provider, setProvider, ollamaUrl, setOllamaUrl } = this.props;
    const { drag, parsing, results, expanded, showDeps } = this.state;

    // Group by category
    const byCat: Record<string, ApiSpec[]> = {};
    loadedSpecs.forEach(s => {
      const cat = this.getCategory(s);
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(s);
    });

    const getCatColor = (cat: string) =>
      CAT_COLORS[cat] || "#8b949e";

    // Dependency graph
    const depNodes: Record<string, { type: string; endpoints: number; fields: number }> = {};
    const depEdges: { from: string; to: string }[] = [];
    loadedSpecs.forEach(s => {
      if (s.resourceName) {
        depNodes[s.resourceName] = { type: s.ext, endpoints: s.endpoints.length, fields: s.fields?.length || 0 };
        (s.dependencies || []).forEach(dep => {
          if (dep !== s.resourceName) depEdges.push({ from: s.resourceName!, to: dep });
        });
      }
    });

    return (
      <div style={{ padding: "14px 18px" }}>
        {/* AI Provider selector */}
        <div style={{
          marginBottom: 12, padding: "10px 14px",
          background: "#0d1117", border: "1px solid #21262d", borderRadius: 7,
        }}>
          <div style={{ fontSize: 9, color: "#8b949e", marginBottom: 6, letterSpacing: 2, textTransform: "uppercase" }}>
            AI Provider
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { id: "anthropic", label: "☁ Claude (Anthropic)", clr: "#58a6ff" },
              { id: "ollama", label: "🖥 Ollama (Local)", clr: "#3fb950" },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                style={{
                  background: provider === p.id ? `${p.clr}22` : "none",
                  border: `1px solid ${provider === p.id ? p.clr : "#30363d"}`,
                  color: provider === p.id ? p.clr : "#555",
                  borderRadius: 5, padding: "5px 12px", cursor: "pointer",
                  fontSize: 10, fontFamily: "inherit", fontWeight: 600,
                }}
              >
                {p.label}
              </button>
            ))}
            {provider === "ollama" && (
              <input
                value={ollamaUrl}
                onChange={e => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                style={{
                  flex: 1, minWidth: 180,
                  background: "#161b22", border: "1px solid #30363d",
                  color: "#e6edf3", borderRadius: 5,
                  padding: "5px 10px", fontSize: 10, fontFamily: "inherit", outline: "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Upload zone */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div
            onClick={() => this.folderRef.current?.click()}
            style={{
              border: "2px dashed #30363d", borderRadius: 8, padding: 16,
              textAlign: "center", cursor: "pointer", background: "#0d1117", transition: "border-color .2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#58a6ff")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#30363d")}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>📁</div>
            <div style={{ fontSize: 11, color: "#e6edf3", fontWeight: 600, marginBottom: 2 }}>Carica Cartella</div>
            <div style={{ fontSize: 9, color: "#555" }}>yaml yml json schema shape proto pdf</div>
            <input
              ref={this.folderRef}
              type="file"
              {...({ webkitdirectory: "true" } as any)}
              multiple
              style={{ display: "none" }}
              onChange={e => this.processFiles(e.target.files)}
            />
          </div>

          <div
            onDragOver={e => { e.preventDefault(); this.setState({ drag: true }); }}
            onDragLeave={() => this.setState({ drag: false })}
            onDrop={e => { e.preventDefault(); this.setState({ drag: false }); this.processFiles(e.dataTransfer.files); }}
            onClick={() => this.fileRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? "#58a6ff" : "#30363d"}`,
              borderRadius: 8, padding: 16, textAlign: "center",
              cursor: "pointer", background: drag ? "#0d1e3a22" : "#0d1117",
              transition: "all .2s",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>🗂️</div>
            <div style={{ fontSize: 11, color: "#e6edf3", fontWeight: 600, marginBottom: 2 }}>Drag & Drop / File</div>
            <div style={{ fontSize: 9, color: "#555" }}>+ PDF per documentazione API</div>
            <input
              ref={this.fileRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTS.join(",")}
              style={{ display: "none" }}
              onChange={e => this.processFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Parse status */}
        {parsing && (
          <div style={{
            padding: "6px 12px", background: "#0d1e3a", border: "1px solid #1f6feb44",
            borderRadius: 5, marginBottom: 10, fontSize: 10, color: "#58a6ff",
          }}>
            ⚙ Parsing in corso...
          </div>
        )}
        {results.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {results.slice(0, 4).map((r, i) => (
              <div key={i} style={{
                padding: "4px 8px", borderRadius: 4, marginBottom: 3,
                background: r.ok ? "#0d2b0d55" : "#2b0d0d55",
                border: `1px solid ${r.ok ? "#23862044" : "#f8514944"}`,
                fontSize: 9, color: r.ok ? "#3fb950" : "#f85149",
              }}>
                {r.ok
                  ? <><b>{r.spec.title}</b> · {r.spec.ext.toUpperCase()} · {r.spec.endpoints.length} endpoints{r.spec.dependencies?.length > 0 ? ` · ${r.spec.dependencies.length} deps` : ""}</>
                  : <>✗ {r.spec.fileName}: {r.spec.parseError}</>
                }
              </div>
            ))}
          </div>
        )}

        {/* Dependency graph */}
        {loadedSpecs.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => this.setState(s => ({ showDeps: !s.showDeps }))}
              style={{
                background: "#161b22", border: "1px solid #30363d", borderRadius: 5,
                color: "#8b949e", padding: "5px 12px", cursor: "pointer",
                fontSize: 9, fontFamily: "inherit", fontWeight: 700,
                width: "100%", textAlign: "left",
              }}
            >
              {showDeps ? "▲" : "▼"} Grafo Dipendenze API ({depEdges.length} link tra {Object.keys(depNodes).length} risorse)
            </button>
            {showDeps && (
              <div style={{
                marginTop: 6, background: "#0d1117",
                border: "1px solid #21262d", borderRadius: 6, padding: 10,
              }}>
                {Object.entries(depNodes).map(([id, node]) => {
                  const deps = depEdges.filter(e => e.from === id).map(e => e.to);
                  const usedBy = depEdges.filter(e => e.to === id).map(e => e.from);
                  return (
                    <div key={id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #21262d22" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#e6edf3", fontFamily: "monospace" }}>/{id}</span>
                        <span style={{ fontSize: 8, background: "#161b22", border: "1px solid #30363d", borderRadius: 2, padding: "0 4px", color: "#555" }}>{node.type}</span>
                        <span style={{ fontSize: 8, color: "#555" }}>{node.endpoints} ep</span>
                        {node.fields > 0 && <span style={{ fontSize: 8, color: "#555" }}>{node.fields} fields</span>}
                      </div>
                      {deps.length > 0 && <div style={{ fontSize: 8, color: "#8b949e", marginLeft: 8 }}>→ dipende da: {deps.map(d => <code key={d} style={{ color: "#e5c07b", marginRight: 4 }}>{d}</code>)}</div>}
                      {usedBy.length > 0 && <div style={{ fontSize: 8, color: "#8b949e", marginLeft: 8 }}>← usato da: {usedBy.map(d => <code key={d} style={{ color: "#61afef", marginRight: 4 }}>{d}</code>)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Spec list */}
        <div style={{ fontSize: 9, color: "#8b949e", marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }}>
          API Caricate ({loadedSpecs.length}) · {Object.values(db.stores).reduce((a, s) => a + s.length, 0)} records
        </div>
        {Object.entries(byCat).map(([cat, specs]) => {
          const cc = getCatColor(cat);
          return (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: 4, paddingBottom: 3, borderBottom: `1px solid ${cc}33`,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: cc, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: cc, letterSpacing: 1, textTransform: "uppercase" }}>{cat}</span>
                <span style={{ fontSize: 8, color: "#555" }}>{specs.length}</span>
              </div>
              {specs.map((spec, i) => {
                const gi = loadedSpecs.indexOf(spec);
                return (
                  <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 5, marginBottom: 3 }}>
                    <div
                      style={{ padding: "7px 10px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onClick={() => this.setState({ expanded: expanded === gi ? null : gi })}
                    >
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#e6edf3" }}>{spec.title}</span>
                        <span style={{ fontSize: 8, color: "#555" }}>v{spec.version}</span>
                        <span style={{ fontSize: 7, background: "#161b22", border: "1px solid #30363d", color: "#555", borderRadius: 2, padding: "0 4px" }}>{spec.ext.toUpperCase()}</span>
                        {spec.parseError && <span style={{ fontSize: 8, color: "#f85149" }}>⚠</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {spec.dependencies?.length > 0 && <span style={{ fontSize: 8, color: "#e5c07b" }}>{spec.dependencies.length} deps</span>}
                        {spec.authSchemes?.length > 0 && <span style={{ fontSize: 8, color: "#c678dd" }}>🔐</span>}
                        <span style={{ fontSize: 8, color: "#555" }}>{expanded === gi ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {expanded === gi && (
                      <div style={{ padding: "0 10px 8px", borderTop: "1px solid #21262d22" }}>
                        {spec.description && <div style={{ fontSize: 9, color: "#8b949e", marginBottom: 6, fontStyle: "italic", lineHeight: 1.4 }}>{spec.description.slice(0, 200)}</div>}
                        {spec.servers?.length > 0 && <div style={{ fontSize: 8, color: "#555", marginBottom: 4 }}>Servers: {spec.servers.map(s => <code key={s} style={{ color: "#e5c07b", marginRight: 4 }}>{s}</code>)}</div>}
                        <div style={{ fontSize: 8, color: "#555", marginBottom: 4 }}>
                          Resource: <code style={{ color: "#e5c07b" }}>/{spec.resourceName}</code> · Records: <code style={{ color: "#3fb950" }}>{db.get(spec.resourceName || "").length}</code>
                        </div>
                        {spec.endpoints.map((ep, j) => (
                          <div key={j} style={{ display: "flex", gap: 6, alignItems: "center", padding: "2px 0" }}>
                            <MethodBadge method={ep.method} />
                            <span style={{ fontSize: 9, color: "#8b949e", fontFamily: "monospace" }}>{ep.path}</span>
                            {ep.summary && <span style={{ fontSize: 8, color: "#555" }}>— {ep.summary.slice(0, 40)}</span>}
                          </div>
                        ))}
                        {spec.fields?.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ fontSize: 8, color: "#555", marginBottom: 3 }}>Campi schema ({spec.fields.length}):</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                              {spec.fields.slice(0, 16).map(f => (
                                <span key={f.name} style={{ fontSize: 7, background: "#161b22", border: "1px solid #30363d", borderRadius: 3, padding: "1px 5px", color: "#8b949e", fontFamily: "monospace" }}>{f.name}</span>
                              ))}
                              {spec.fields.length > 16 && <span style={{ fontSize: 7, color: "#555" }}>+{spec.fields.length - 16} altri</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// MINIMAL API SPEC PARSER (YAML / JSON / proto)
// ═══════════════════════════════════════════════════════════════
function parseApiSpec(fileName: string, content: string, fileType?: string): ApiSpec {
  const ext = fileType || fileName.split(".").pop()!.toLowerCase();
  const spec: ApiSpec = {
    fileName, ext,
    title: fileName.replace(/\.[^.]+$/, ""),
    version: "1.0", endpoints: [], schemas: {},
    resourceName: null, schemaName: null,
    parseError: null, category: null, folder: null,
    dependencies: [], fields: [], description: "",
    authSchemes: [], servers: [], tags: [],
    rawContent: content.slice(0, 5000),
  };
  try {
    if (["json","schema","shape"].includes(ext)) {
      let p: any;
      try { p = JSON.parse(content); } catch (e: any) { spec.parseError = "JSON parse: " + e.message; }
      if (p) {
        if (p.openapi || p.swagger) {
          spec.title = p.info?.title || spec.title;
          spec.version = p.info?.version || spec.version;
          spec.description = p.info?.description || "";
          spec.servers = (p.servers || []).map((s: any) => s.url);
          spec.authSchemes = Object.keys(p.components?.securitySchemes || {});
          for (const [path, ms] of Object.entries(p.paths || {})) {
            for (const [m, op] of Object.entries(ms as any)) {
              if (["get","post","put","patch","delete"].includes(m)) {
                spec.endpoints.push({ method: m.toUpperCase(), path, summary: (op as any).summary || "", tags: (op as any).tags || [] });
              }
            }
          }
        }
      }
    }
    if (["yaml","yml"].includes(ext)) {
      const tM = content.match(/^\s*title:\s*["']?([^"'\n\r]+)/m);
      const vM = content.match(/^\s*version:\s*["']?([^"'\n\r]+)/m);
      if (tM) spec.title = tM[1].trim();
      if (vM) spec.version = vM[1].trim();
      spec.authSchemes = content.includes("bearerAuth") ? ["Bearer"] : content.includes("apiKey") ? ["ApiKey"] : [];
      // Extract paths
      const lines = content.split(/\r?\n/);
      let inPaths = false, curPath: string | null = null;
      for (const l of lines) {
        if (/^paths:/.test(l)) { inPaths = true; continue; }
        if (inPaths && /^[a-zA-Z]/.test(l) && !/^  /.test(l)) inPaths = false;
        if (!inPaths) continue;
        const pM = l.match(/^  (\/[^:\s#]+):\s*$/);
        if (pM) { curPath = pM[1]; continue; }
        const mM = l.match(/^    (get|post|put|patch|delete):\s*$/i);
        if (mM && curPath) spec.endpoints.push({ method: mM[1].toUpperCase(), path: curPath, summary: "", tags: [] });
      }
    }
    if (ext === "proto") {
      spec.endpoints = [...content.matchAll(/rpc\s+(\w+)\s*\(([^)]+)\)\s*returns\s*\(([^)]+)\)/g)]
        .map(m => ({ method: "RPC", path: m[1], summary: `${m[1]}(${m[2]})->${m[3]}` }));
    }
    // Guess resource name
    for (const e of spec.endpoints) {
      const m = e.path?.match(/^\/(\w[\w-]*)/);
      if (m) { spec.resourceName = m[1]; break; }
    }
    if (!spec.resourceName) {
      spec.resourceName = "obj-" + spec.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-api$/, "");
    }
  } catch (e: any) { spec.parseError = e.message; }
  return spec;
}
