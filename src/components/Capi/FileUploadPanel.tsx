import React, { createRef } from "react";
import { db, ApiSpec, DEFAULT_SPEC, CAT_COLORS, parseApiSpec } from "./utils";
import { MethodBadge } from "./AtomComponents";
import "./capi-upload.scss";

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD PANEL  — API spec file loader + spec list
// ═══════════════════════════════════════════════════════════════
interface FileUploadPanelProps {
  onSpecLoaded: (spec: ApiSpec) => void;
  loadedSpecs: ApiSpec[];
  onDeleteAll: () => void;
}

interface FileUploadPanelState {
  drag: boolean;
  parsing: boolean;
  results: { ok: boolean; spec: ApiSpec }[];
  expanded: number | null;
  showDeps: boolean;
}

const ACCEPTED_EXTS = [".yaml", ".yml", ".json", ".schema", ".shape", ".proto", ".pdf"];

export class FileUploadPanel extends React.Component<FileUploadPanelProps, FileUploadPanelState> {
  state: FileUploadPanelState = {
    drag: false, parsing: false, results: [], expanded: null, showDeps: false,
  };

  private folderRef = createRef<HTMLInputElement>();
  private fileRef = createRef<HTMLInputElement>();

  // ── File processing ─────────────────────────────────────────
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
          // Minimal text extraction from PDF bytes
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

        // Use the shared parser from utils.ts
        const spec = parseApiSpec(f.name, content, ext);
        db.loadSpec(spec);
        this.props.onSpecLoaded(spec);
        newResults.push({ ok: !spec.parseError, spec });

      } catch {
        /* skip unreadable files */
      }
    }

    this.setState(s => ({ parsing: false, results: [...s.results, ...newResults] }));
  };

  // ── Category helper ─────────────────────────────────────────
  private getCategory(spec: ApiSpec): string {
    if (spec.tags?.length) return spec.tags[0];
    if (spec.resourceName?.includes("addr")) return "Address Management";
    if (spec.resourceName?.includes("client")) return "Client Management";
    if (spec.resourceName?.includes("pool")) return "Pool";
    if (spec.resourceName?.includes("stex")) return "Stock Exchange";
    return "General";
  }

  render() {
    const { loadedSpecs, onDeleteAll } = this.props;
    const { drag, parsing, results, expanded, showDeps } = this.state;

    // Group specs by category
    const byCat: Record<string, ApiSpec[]> = {};
    loadedSpecs.forEach(s => {
      const cat = this.getCategory(s);
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(s);
    });
    const getCatColor = (cat: string) => CAT_COLORS[cat] || "#8b949e";

    // Dependency graph nodes / edges for the "Grafo Dipendenze" section
    const depNodes: Record<string, { type: string; endpoints: number; fields: number }> = {};
    const depEdges: { from: string; to: string }[] = [];
    loadedSpecs.forEach(s => {
      if (s.resourceName) {
        depNodes[s.resourceName] = {
          type: s.ext,
          endpoints: s.endpoints.length,
          fields: s.fields?.length || 0,
        };
        (s.dependencies || []).forEach(dep => {
          // Only draw edge when the dep resolves to another loaded spec
          const depRes = loadedSpecs.find(
            x => x.resourceName === dep || x.schemaName === dep
          )?.resourceName;
          if (depRes && depRes !== s.resourceName) {
            depEdges.push({ from: s.resourceName!, to: depRes });
          }
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
          <div className="capi-zone" onClick={() => this.folderRef.current?.click()}>
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
            onDragOver={e => { e.preventDefault(); this.setState({ drag: true }); }}
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
            {results.slice(-4).map((r, i) => (
              <div
                key={i}
                className={`capi-upload__result capi-upload__result--${r.ok ? "ok" : "err"}`}
              >
                {r.ok ? (
                  <>
                    <b>{r.spec.title}</b>
                    {" · "}{r.spec.ext.toUpperCase()}
                    {" · "}{r.spec.endpoints.length} endpoints
                    {r.spec.fields.length > 0 && ` · ${r.spec.fields.length} fields`}
                    {r.spec.dependencies.length > 0 && ` · ${r.spec.dependencies.length} deps`}
                    {db.get(r.spec.resourceName || "").length > 0 &&
                      ` · ${db.get(r.spec.resourceName || "").length} records seeded`}
                  </>
                ) : (
                  <>✗ {r.spec.fileName}: {r.spec.parseError}</>
                )}
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
                  const deps = depEdges.filter(e => e.from === id).map(e => e.to);
                  const usedBy = depEdges.filter(e => e.to === id).map(e => e.from);
                  return (
                    <div key={id} className="capi-deps__row">
                      <div className="capi-deps__row-meta">
                        <span className="capi-deps__path">/{id}</span>
                        <span className="capi-deps__tag">{node.type}</span>
                        <span className="capi-deps__meta">{node.endpoints} ep</span>
                        {node.fields > 0 && <span className="capi-deps__meta">{node.fields} fields</span>}
                      </div>
                      {deps.length > 0 && (
                        <div className="capi-deps__links">
                          → dipende da: {deps.map(d => <code key={d} className="capi-deps__code-y">{d}</code>)}
                        </div>
                      )}
                      {usedBy.length > 0 && (
                        <div className="capi-deps__links">
                          ← usato da: {usedBy.map(d => <code key={d} className="capi-deps__code-b">{d}</code>)}
                        </div>
                      )}
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
                        {spec.dependencies?.length > 0 && (
                          <span className="capi-api-card__deps">{spec.dependencies.length} deps</span>
                        )}
                        {spec.authSchemes?.length > 0 && (
                          <span className="capi-api-card__auth">🔐</span>
                        )}
                        <span className="capi-api-card__chevron">{expanded === gi ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {expanded === gi && (
                      <div className="capi-api-card__body">
                        {spec.description && (
                          <div className="capi-api-card__desc">{spec.description.slice(0, 200)}</div>
                        )}
                        {spec.servers?.length > 0 && (
                          <div className="capi-api-card__srv">
                            Servers: {spec.servers.map(s => (
                              <code key={s} className="capi-deps__code-y">{s}</code>
                            ))}
                          </div>
                        )}
                        <div className="capi-api-card__res">
                          Resource: <code className="capi-deps__code-y">/{spec.resourceName}</code>
                          {" · "}Records: <code className="capi-deps__code-b">
                            {db.get(spec.resourceName || "").length}
                          </code>
                          {spec.schemaName && (
                            <>{" · "}Schema: <code className="capi-deps__code-y">{spec.schemaName}</code></>
                          )}
                        </div>

                        {spec.endpoints.map((ep, j) => (
                          <div key={j} className="capi-api-card__ep">
                            <MethodBadge method={ep.method} />
                            <span>{ep.path}</span>
                            {ep.summary && (
                              <span className="capi-api-card__ep-sum">— {ep.summary.slice(0, 50)}</span>
                            )}
                          </div>
                        ))}

                        {spec.fields?.length > 0 && (
                          <div className="capi-api-card__fields-wrap">
                            <div className="capi-api-card__fields-label">
                              Campi schema ({spec.fields.length}):
                            </div>
                            <div className="capi-api-card__fields">
                              {spec.fields.slice(0, 20).map(f => (
                                <span
                                  key={f.name}
                                  className="capi-api-card__field-chip"
                                  title={`${f.name}: ${f.type}${f.required ? " (required)" : ""}`}
                                >
                                  {f.name}
                                  {f.type !== "string" && f.type !== "integer" && (
                                    <em style={{ opacity: 0.6, marginLeft: 3 }}>:{f.type}</em>
                                  )}
                                </span>
                              ))}
                              {spec.fields.length > 20 && (
                                <span className="capi-api-card__more">+{spec.fields.length - 20} altri</span>
                              )}
                            </div>
                          </div>
                        )}

                        {spec.dependencies?.length > 0 && (
                          <div className="capi-api-card__fields-wrap" style={{ marginTop: 8 }}>
                            <div className="capi-api-card__fields-label">
                              Dipendenze schema ({spec.dependencies.length}):
                            </div>
                            <div className="capi-api-card__fields">
                              {spec.dependencies.map(d => (
                                <code key={d} className="capi-deps__code-y" style={{ marginRight: 4 }}>
                                  {d}
                                </code>
                              ))}
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
