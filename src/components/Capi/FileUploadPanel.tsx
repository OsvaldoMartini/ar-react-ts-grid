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
  apiPage: number;
  apiPageSize: number;
  openSections: Set<string>; // keys like "3-fields", "3-deps"
  openUris: Set<string>;     // keys like "3-uri-1" per-endpoint URI toggles
}

const ACCEPTED_EXTS = [".yaml", ".yml", ".json", ".schema", ".shape", ".proto", ".pdf"];

export class FileUploadPanel extends React.Component<FileUploadPanelProps, FileUploadPanelState> {
  state: FileUploadPanelState = {
    drag: false, parsing: false, results: [], expanded: null, showDeps: false,
    apiPage: 0, apiPageSize: 20,
    openSections: new Set<string>(),
    openUris: new Set<string>(),
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
    const { drag, parsing, results, expanded, showDeps, apiPage, apiPageSize, openSections, openUris } = this.state;

    // Pagination slice — applied before grouping
    const PAGE_SIZES = [10, 20, 50, 100];
    const totalPages = Math.ceil(loadedSpecs.length / apiPageSize);
    const pageStart = apiPage * apiPageSize;
    const pagedSpecs = loadedSpecs.slice(pageStart, pageStart + apiPageSize);

    // Group specs by category
    const byCat: Record<string, ApiSpec[]> = {};
    pagedSpecs.forEach(s => {
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
        <div className="capi-api-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>API Caricate ({loadedSpecs.length}) · {Object.values(db.stores).reduce((a, s) => a + s.length, 0)} records</span>
          {/* Page-size picker */}
          {loadedSpecs.length > 10 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {PAGE_SIZES.map(n => (
                <button key={n} onClick={() => this.setState({ apiPageSize: n, apiPage: 0 })} style={{
                  background: apiPageSize === n ? "#34d39918" : "transparent",
                  border: `1px solid ${apiPageSize === n ? "#34d399" : "var(--cs-border)"}`,
                  color: apiPageSize === n ? "#34d399" : "var(--cs-muted)",
                  borderRadius: 5, padding: "1px 7px", fontSize: 10, fontFamily: "monospace",
                  cursor: "pointer", fontWeight: apiPageSize === n ? 700 : 400,
                }}>{n}</button>
              ))}
            </div>
          )}
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

                        {spec.endpoints.map((ep, j) => {
                          const uriKey = `${gi}-uri-${j}`;
                          const uriOpen = openUris.has(uriKey);
                          return (
                            <div key={j} className="capi-api-card__ep">
                              <MethodBadge method={ep.method} />
                              {/* URI hidden by default — click {URI} toggle to reveal */}
                              <span
                                className="capi-api-card__uri-toggle"
                                onClick={e => {
                                  e.stopPropagation();
                                  const next = new Set(openUris);
                                  uriOpen ? next.delete(uriKey) : next.add(uriKey);
                                  this.setState({ openUris: next });
                                }}
                                title={uriOpen ? "Hide URI" : "Show URI"}
                              >
                                {uriOpen ? ep.path : "{URI}"}
                              </span>
                              {ep.summary && (
                                <span className="capi-api-card__ep-sum">— {ep.summary.slice(0, 50)}</span>
                              )}
                            </div>
                          );
                        })}

                        {spec.fields?.length > 0 && (() => {
                          const fKey = `${gi}-fields`;
                          const fOpen = openSections.has(fKey);
                          return (
                            <div className="capi-api-card__fields-wrap">
                              <div
                                className="capi-api-card__fields-label capi-api-card__fields-label--toggle"
                                onClick={() => {
                                  const next = new Set(openSections);
                                  fOpen ? next.delete(fKey) : next.add(fKey);
                                  this.setState({ openSections: next });
                                }}
                              >
                                <span className="capi-api-card__section-arrow">{fOpen ? "▾" : "▸"}</span>
                                Schema fields ({spec.fields.length}):
                              </div>
                              {fOpen && (
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
                              )}
                            </div>
                          );
                        })()}

                        {spec.dependencies?.length > 0 && (() => {
                          const dKey = `${gi}-deps`;
                          const dOpen = openSections.has(dKey);
                          return (
                            <div className="capi-api-card__fields-wrap" style={{ marginTop: 8 }}>
                              <div
                                className="capi-api-card__fields-label capi-api-card__fields-label--toggle"
                                onClick={() => {
                                  const next = new Set(openSections);
                                  dOpen ? next.delete(dKey) : next.add(dKey);
                                  this.setState({ openSections: next });
                                }}
                              >
                                <span className="capi-api-card__section-arrow">{dOpen ? "▾" : "▸"}</span>
                                Schema dependencies ({spec.dependencies.length}):
                              </div>
                              {dOpen && (
                                <div className="capi-api-card__fields">
                                  {spec.dependencies.map(d => (
                                    <code key={d} className="capi-deps__code-y" style={{ marginRight: 4 }}>
                                      {d}
                                    </code>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 0 4px" }}>
            <button onClick={() => this.setState({ apiPage: apiPage - 1 })} disabled={apiPage === 0}
              style={{ background: "transparent", border: "1px solid var(--cs-border)", color: "var(--cs-muted)", borderRadius: 5, padding: "3px 9px", fontSize: 10, fontFamily: "monospace", cursor: apiPage === 0 ? "default" : "pointer", opacity: apiPage === 0 ? 0.4 : 1 }}>‹ Prev</button>

            {Array.from({ length: totalPages }, (_, pi) => {
              const near = pi === 0 || pi === totalPages - 1 || Math.abs(pi - apiPage) <= 1;
              if (!near) return (pi === 1 || pi === totalPages - 2)
                ? <span key={pi} style={{ fontSize: 10, color: "var(--cs-dim)", fontFamily: "monospace" }}>…</span>
                : null;
              return (
                <button key={pi} onClick={() => this.setState({ apiPage: pi })} style={{
                  background: pi === apiPage ? "#34d399" : "var(--cs-surface-2)",
                  border: `1px solid ${pi === apiPage ? "#34d399" : "var(--cs-border)"}`,
                  color: pi === apiPage ? "#0a1f15" : "var(--cs-muted)",
                  borderRadius: 5, padding: "3px 8px", fontSize: 10, fontFamily: "monospace",
                  cursor: "pointer", fontWeight: pi === apiPage ? 700 : 400, minWidth: 28,
                }}>{pi + 1}</button>
              );
            })}

            <button onClick={() => this.setState({ apiPage: apiPage + 1 })} disabled={apiPage === totalPages - 1}
              style={{ background: "transparent", border: "1px solid var(--cs-border)", color: "var(--cs-muted)", borderRadius: 5, padding: "3px 9px", fontSize: 10, fontFamily: "monospace", cursor: apiPage === totalPages - 1 ? "default" : "pointer", opacity: apiPage === totalPages - 1 ? 0.4 : 1 }}>Next ›</button>

            <span style={{ fontSize: 9, color: "var(--cs-dim)", fontFamily: "monospace", marginLeft: 6 }}>
              {pageStart + 1}–{Math.min(pageStart + apiPageSize, loadedSpecs.length)} of {loadedSpecs.length}
            </span>
          </div>
        )}
      </div>
    );
  }
}
