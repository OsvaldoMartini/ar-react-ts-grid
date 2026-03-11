import React, { createRef } from "react";
import { db, ApiSpec, DEFAULT_SPEC, CAT_COLORS } from "./utils";
import { MethodBadge } from "./AtomComponents";
import "./capi-upload.scss";

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD PANEL  — API spec file loader + spec list
// ═══════════════════════════════════════════════════════════════
interface FileUploadPanelProps {
  onSpecLoaded: (spec: ApiSpec) => void;
  loadedSpecs:  ApiSpec[];
  onDeleteAll:  () => void;
}

interface FileUploadPanelState {
  drag:     boolean;
  parsing:  boolean;
  results:  { ok: boolean; spec: ApiSpec }[];
  expanded: number | null;
  showDeps: boolean;
}

const ACCEPTED_EXTS = [".yaml", ".yml", ".json", ".schema", ".proto", ".pdf"];

export class FileUploadPanel extends React.Component<FileUploadPanelProps, FileUploadPanelState> {
  state: FileUploadPanelState = {
    drag: false, parsing: false, results: [], expanded: null, showDeps: false,
  };

  private folderRef = createRef<HTMLInputElement>();
  private fileRef   = createRef<HTMLInputElement>();

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
          const buf   = await f.arrayBuffer();
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
      } catch { /* skip */ }
    }
    this.setState(s => ({ parsing: false, results: [...s.results, ...newResults] }));
  };

  private getCategory(spec: ApiSpec): string {
    if (spec.tags?.length)                         return spec.tags[0];
    if (spec.resourceName?.includes("addr"))       return "Address Management";
    if (spec.resourceName?.includes("client"))     return "Client Management";
    return "General";
  }

  render() {
    const { loadedSpecs, onDeleteAll } = this.props;
    const { drag, parsing, results, expanded, showDeps } = this.state;

    // Group by category
    const byCat: Record<string, ApiSpec[]> = {};
    loadedSpecs.forEach(s => {
      const cat = this.getCategory(s);
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(s);
    });
    const getCatColor = (cat: string) => CAT_COLORS[cat] || "#8b949e";

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
      <div className="capi-upload">

        {/* Delete All */}
        {loadedSpecs.length > 0 && (
          <div className="capi-upload__delete-row">
            <button
              className="capi-btn-delete"
              onClick={() => { if (window.confirm("Delete all loaded API files?")) onDeleteAll(); }}
            >
              🗑 Delete All
            </button>
          </div>
        )}

        {/* Upload zones */}
        <div className="capi-upload__zones">
          {/* Folder zone */}
          <div
            className="capi-zone"
            onClick={() => this.folderRef.current?.click()}
          >
            <div className="capi-zone__icon">📁</div>
            <div className="capi-zone__title">Carica Cartella</div>
            <div className="capi-zone__subtitle">yaml yml json schema shape proto pdf</div>
            <input
              ref={this.folderRef}
              type="file"
              {...({ webkitdirectory: "true" } as any)}
              multiple
              style={{ display: "none" }}
              onChange={e => this.processFiles(e.target.files)}
            />
          </div>

          {/* Drop zone */}
          <div
            className={`capi-zone${drag ? " capi-zone--dragging" : ""}`}
            onDragOver={e  => { e.preventDefault(); this.setState({ drag: true }); }}
            onDragLeave={() => this.setState({ drag: false })}
            onDrop={e => { e.preventDefault(); this.setState({ drag: false }); this.processFiles(e.dataTransfer.files); }}
            onClick={() => this.fileRef.current?.click()}
          >
            <div className="capi-zone__icon">🗂️</div>
            <div className="capi-zone__title">Drag &amp; Drop / File</div>
            <div className="capi-zone__subtitle">+ PDF per documentazione API</div>
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
          <div className="capi-upload__parsing">⚙ Parsing in corso...</div>
        )}
        {results.length > 0 && (
          <div className="capi-upload__results">
            {results.slice(0, 4).map((r, i) => (
              <div key={i} className={`capi-upload__result capi-upload__result--${r.ok ? "ok" : "err"}`}>
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
          <div className="capi-deps">
            <button
              className="capi-deps__toggle"
              onClick={() => this.setState(s => ({ showDeps: !s.showDeps }))}
            >
              {showDeps ? "▲" : "▼"} Grafo Dipendenze API ({depEdges.length} link tra {Object.keys(depNodes).length} risorse)
            </button>
            {showDeps && (
              <div className="capi-deps__body">
                {Object.entries(depNodes).map(([id, node]) => {
                  const deps   = depEdges.filter(e => e.from === id).map(e => e.to);
                  const usedBy = depEdges.filter(e => e.to   === id).map(e => e.from);
                  return (
                    <div key={id} className="capi-deps__row">
                      <div className="capi-deps__row-meta">
                        <span className="capi-deps__path">/{id}</span>
                        <span className="capi-deps__tag">{node.type}</span>
                        <span className="capi-deps__meta">{node.endpoints} ep</span>
                        {node.fields > 0 && <span className="capi-deps__meta">{node.fields} fields</span>}
                      </div>
                      {deps.length   > 0 && <div className="capi-deps__links">→ dipende da: {deps.map(d   => <code key={d} className="capi-deps__code-y">{d}</code>)}</div>}
                      {usedBy.length > 0 && <div className="capi-deps__links">← usato da: {usedBy.map(d  => <code key={d} className="capi-deps__code-b">{d}</code>)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* API list */}
        <div className="capi-api-label">
          API Caricate ({loadedSpecs.length}) · {Object.values(db.stores).reduce((a, s) => a + s.length, 0)} records
        </div>

        {Object.entries(byCat).map(([cat, specs]) => {
          const cc = getCatColor(cat);
          return (
            <div key={cat} className="capi-api-group">
              {/* Category header — color dot + name are dynamic */}
              <div
                className="capi-api-group__header"
                style={{ borderBottom: `1px solid ${cc}33` }}
              >
                <span className="capi-api-group__dot" style={{ background: cc }} />
                <span className="capi-api-group__name" style={{ color: cc }}>{cat}</span>
                <span className="capi-api-group__count">{specs.length}</span>
              </div>

              {specs.map((spec, i) => {
                const gi = loadedSpecs.indexOf(spec);
                return (
                  <div key={i} className="capi-api-card">
                    {/* Card header */}
                    <div
                      className="capi-api-card__header"
                      onClick={() => this.setState({ expanded: expanded === gi ? null : gi })}
                    >
                      <div className="capi-api-card__name-row">
                        <span className="capi-api-card__name">{spec.title}</span>
                        <span className="capi-api-card__version">v{spec.version}</span>
                        <span className="capi-api-card__ext">{spec.ext.toUpperCase()}</span>
                        {spec.parseError && <span className="capi-api-card__warn">⚠</span>}
                      </div>
                      <div className="capi-api-card__controls">
                        {spec.dependencies?.length > 0 && <span className="capi-api-card__deps">{spec.dependencies.length} deps</span>}
                        {spec.authSchemes?.length  > 0 && <span className="capi-api-card__auth">🔐</span>}
                        <span className="capi-api-card__chevron">{expanded === gi ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {/* Expanded body */}
                    {expanded === gi && (
                      <div className="capi-api-card__body">
                        {spec.description && (
                          <div className="capi-api-card__desc">{spec.description.slice(0, 200)}</div>
                        )}
                        {spec.servers?.length > 0 && (
                          <div className="capi-api-card__srv">
                            Servers: {spec.servers.map(s => <code key={s} className="capi-deps__code-y">{s}</code>)}
                          </div>
                        )}
                        <div className="capi-api-card__res">
                          Resource: <code className="capi-deps__code-y">/{spec.resourceName}</code>
                          {" · "}Records: <code className="capi-deps__code-b">{db.get(spec.resourceName || "").length}</code>
                        </div>

                        {spec.endpoints.map((ep, j) => (
                          <div key={j} className="capi-api-card__ep">
                            <MethodBadge method={ep.method} />
                            <span>{ep.path}</span>
                            {ep.summary && <span className="capi-api-card__ep-sum">— {ep.summary.slice(0, 40)}</span>}
                          </div>
                        ))}

                        {spec.fields?.length > 0 && (
                          <div className="capi-api-card__fields-wrap">
                            <div className="capi-api-card__fields-label">Campi schema ({spec.fields.length}):</div>
                            <div className="capi-api-card__fields">
                              {spec.fields.slice(0, 16).map(f => (
                                <span key={f.name} className="capi-api-card__field-chip">{f.name}</span>
                              ))}
                              {spec.fields.length > 16 && (
                                <span className="capi-api-card__more">+{spec.fields.length - 16} altri</span>
                              )}
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
  const ext  = fileType || fileName.split(".").pop()!.toLowerCase();
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
          spec.title       = p.info?.title       || spec.title;
          spec.version     = p.info?.version     || spec.version;
          spec.description = p.info?.description || "";
          spec.servers     = (p.servers || []).map((s: any) => s.url);
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
      if (tM) spec.title   = tM[1].trim();
      if (vM) spec.version = vM[1].trim();
      spec.authSchemes = content.includes("bearerAuth") ? ["Bearer"] : content.includes("apiKey") ? ["ApiKey"] : [];
      const lines = content.split(/\r?\n/);
      let inPaths = false, curPath: string | null = null;
      for (const l of lines) {
        if (/^paths:/.test(l))                            { inPaths = true;  continue; }
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
