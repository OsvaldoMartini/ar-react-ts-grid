import React, { createRef } from "react";
import { db, ApiSpec, DEFAULT_SPEC, CAT_COLORS, parseApiSpec } from "./utils";
import { MethodBadge } from "./AtomComponents";
import QuestionsCard, { type QuestionsCardProps } from "../QuestionsCard";
import "./mt-upload.scss";

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
  showParseResults: boolean;
  apiPage: number;
  apiPageSize: number;
  openSections: Set<string>; // keys like "3-fields", "3-deps"
  openUris: Set<string>;     // keys like "3-uri-1" per-endpoint URI toggles
  apiSearch: string;         // filter text for API name / description
  modal: QuestionsCardProps | null;
}

const ACCEPTED_EXTS = [".yaml", ".yml", ".json", ".schema", ".shape", ".proto", ".pdf"];

/**
 * Recursively collect every File from a DataTransferItemList. Supports
 * folder drops via the webkitGetAsEntry / createReader / readEntries
 * pipeline. Falls back gracefully when items aren't entries (e.g.
 * synthetic drag events from automation).
 */
async function collectFilesFromDataTransfer(items: DataTransferItemList): Promise<File[]> {
  const out: File[] = [];
  const fileFromEntry = (entry: any): Promise<File> =>
    new Promise((resolve, reject) => entry.file(resolve, reject));
  const readBatch = (reader: any): Promise<any[]> =>
    new Promise((resolve, reject) => reader.readEntries(resolve, reject));

  const walk = async (entry: any): Promise<void> => {
    if (!entry) return;
    if (entry.isFile) {
      try { out.push(await fileFromEntry(entry)); } catch { /* unreadable */ }
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      // readEntries returns in batches; loop until an empty batch.
      while (true) {
        let batch: any[] = [];
        try { batch = await readBatch(reader); } catch { break; }
        if (batch.length === 0) break;
        for (const child of batch) await walk(child);
      }
    }
  };

  const entries: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const e = (items[i] as any).webkitGetAsEntry?.();
    if (e) entries.push(e);
  }
  await Promise.all(entries.map(walk));
  return out;
}

export class FileUploadPanel extends React.Component<FileUploadPanelProps, FileUploadPanelState> {
  state: FileUploadPanelState = {
    drag: false, parsing: false, results: [], expanded: null, showDeps: false, showParseResults: false,
    apiPage: 0, apiPageSize: 10,
    openSections: new Set<string>(),
    openUris: new Set<string>(),
    apiSearch: "",
    modal: null,
  };

  private closeModal = () => this.setState({ modal: null });

  private folderRef = createRef<HTMLInputElement>();
  private fileRef = createRef<HTMLInputElement>();

  // ── File processing ─────────────────────────────────────────
  // Accepts both FileList (from <input>) and File[] (from folder-walk drop).
  private processFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    this.setState({ parsing: true });

    const all = Array.from(files);
    const arr = all.filter(f =>
      ACCEPTED_EXTS.includes("." + f.name.split(".").pop()!.toLowerCase())
    );

    // Empty drop / nothing-recognized: surface via QuestionsCard so the
    // user knows the gesture registered and what was filtered out.
    if (arr.length === 0) {
      this.setState({
        parsing: false,
        modal: {
          mode: "alert",
          header: all.length === 0 ? "Empty drop" : "No recognised files",
          body: all.length === 0
            ? "Nothing was dropped (or the items couldn't be read). Try again, or use the Pick Files button."
            : `Dropped ${all.length} item${all.length === 1 ? "" : "s"} but none had a recognised extension. Accepted: ${ACCEPTED_EXTS.join(", ")}.`,
          error: true,
          onSubmit: this.closeModal,
          onCancel: this.closeModal,
        },
      });
      return;
    }

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
    const { drag, parsing, results, expanded, showDeps, showParseResults, apiPage, apiPageSize, openSections, openUris, apiSearch } = this.state;

    // Search filter — applied before pagination
    const searchTerm = apiSearch.trim().toLowerCase();
    const filteredSpecs = searchTerm
      ? loadedSpecs.filter(s =>
        s.title?.toLowerCase().includes(searchTerm) ||
        s.description?.toLowerCase().includes(searchTerm) ||
        s.resourceName?.toLowerCase().includes(searchTerm)
      )
      : loadedSpecs;

    // Pagination slice — applied after filtering
    const PAGE_SIZES = [10, 20, 50, 100];
    const totalPages = Math.ceil(filteredSpecs.length / apiPageSize);
    const pageStart = apiPage * apiPageSize;
    const pagedSpecs = filteredSpecs.slice(pageStart, pageStart + apiPageSize);

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
      <div className="mt-upload">
        {this.state.modal && <QuestionsCard {...this.state.modal} />}

        {/* Upload zones */}
        <div className="mt-upload__zones">

          {/* Multi-file picker zone — webkitdirectory removed because it
              triggers a Chromium "upload all files from <folder>" security
              prompt that JCEF cannot suppress. To bulk-import a whole
              folder, drag-drop it onto the zone on the right. */}
          <div className="mt-zone" onClick={() => this.folderRef.current?.click()}>
            <div className="mt-zone__icon">📁</div>
            <div className="mt-zone__title">Pick Files</div>
            <div className="mt-zone__subtitle">yaml yml json schema shape proto pdf · multi-select</div>
            <input
              ref={this.folderRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTS.join(",")}
              style={{ display: "none" }}
              onChange={e => this.processFiles(e.target.files)}
            />
          </div>

          {/* Drop zone — supports both individual file drops AND recursive
              folder drops via collectFilesFromDataTransfer. */}
          <div
            className={`mt-zone${drag ? " mt-zone--dragging" : ""}`}
            onDragOver={e => { e.preventDefault(); this.setState({ drag: true }); }}
            onDragLeave={() => this.setState({ drag: false })}
            onDrop={async e => {
              e.preventDefault();
              this.setState({ drag: false });
              const items = e.dataTransfer.items;
              if (items && items.length > 0 && (items[0] as any).webkitGetAsEntry) {
                // Use the entry API so folder drops recurse.
                const files = await collectFilesFromDataTransfer(items);
                this.processFiles(files);
              } else {
                // Fallback: synthetic events / older paths
                this.processFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => this.fileRef.current?.click()}
          >
            <div className="mt-zone__icon">🗂️</div>
            <div className="mt-zone__title">Drag &amp; Drop / File</div>
            <div className="mt-zone__subtitle">+ PDF per documentazione API</div>
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
          <div className="mt-upload__delete-row">
            <button
              className="mt-btn-delete"
              onClick={() => this.setState({
                modal: {
                  mode: "confirm",
                  header: "Delete all API files?",
                  body: "This will remove every loaded API spec from this session. The spec files on disk are not affected — you can re-upload them anytime.",
                  okLabel: "Delete all",
                  destructive: true,
                  onSubmit: () => { this.closeModal(); onDeleteAll(); },
                  onCancel: this.closeModal,
                },
              })}
            >
              🗑 Delete All
            </button>
          </div>
        )}


        {/* Search box */}
        {loadedSpecs.length > 0 && (
          <div className="mt-api-search">
            <span className="mt-api-search__icon">🔍</span>
            <input
              className="mt-api-search__input"
              type="text"
              placeholder="Search APIs by name or description…"
              value={apiSearch}
              onChange={e => this.setState({ apiSearch: e.target.value, apiPage: 0 })}
            />
            {apiSearch && (
              <button
                className="mt-api-search__clear"
                onClick={() => this.setState({ apiSearch: "", apiPage: 0 })}
                title="Clear search"
              >✕</button>
            )}
          </div>
        )}

        {/* API list label */}
        <div className="mt-api-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>API Caricate ({filteredSpecs.length}{searchTerm ? ` / ${loadedSpecs.length}` : ""}) · {Object.values(db.stores).reduce((a, s) => a + s.length, 0)} records</span>
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
            <div key={cat} className="mt-api-group">
              <div
                className="mt-api-group__header"
                style={{ borderBottom: `1px solid ${cc}33` }}
              >
                <span className="mt-api-group__dot" style={{ background: cc }} />
                <span className="mt-api-group__name" style={{ color: cc }}>{cat}</span>
                <span className="mt-api-group__count">{specs.length}</span>
              </div>

              {specs.map((spec, i) => {
                const gi = loadedSpecs.indexOf(spec);
                return (
                  <div key={i} className="mt-api-card">
                    <div
                      className="mt-api-card__header"
                      onClick={() => this.setState({ expanded: expanded === gi ? null : gi })}
                    >
                      <div className="mt-api-card__name-row">
                        <span className="mt-api-card__name">{spec.title}</span>
                        <span className="mt-api-card__version">v{spec.version}</span>
                        <span className="mt-api-card__ext">{spec.ext.toUpperCase()}</span>
                        {spec.parseError && <span className="mt-api-card__warn">⚠</span>}
                      </div>
                      <div className="mt-api-card__controls">
                        {spec.dependencies?.length > 0 && (
                          <span className="mt-api-card__deps">{spec.dependencies.length} deps</span>
                        )}
                        {spec.authSchemes?.length > 0 && (
                          <span className="mt-api-card__auth">🔐</span>
                        )}
                        <span className="mt-api-card__chevron">{expanded === gi ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {expanded === gi && (
                      <div className="mt-api-card__body">
                        {spec.description && (
                          <div className="mt-api-card__desc">{spec.description.slice(0, 200)}</div>
                        )}
                        {spec.servers?.length > 0 && (
                          <div className="mt-api-card__srv">
                            Servers: {spec.servers.map(s => (
                              <code key={s} className="mt-deps__code-y">{s}</code>
                            ))}
                          </div>
                        )}
                        <div className="mt-api-card__res">
                          Resource: <code className="mt-deps__code-y">/{spec.resourceName}</code>
                          {" · "}Records: <code className="mt-deps__code-b">
                            {db.get(spec.resourceName || "").length}
                          </code>
                          {spec.schemaName && (
                            <>{" · "}Schema: <code className="mt-deps__code-y">{spec.schemaName}</code></>
                          )}
                        </div>

                        {spec.endpoints.map((ep, j) => {
                          const uriKey = `${gi}-uri-${j}`;
                          const uriOpen = openUris.has(uriKey);
                          return (
                            <div key={j} className="mt-api-card__ep">
                              <MethodBadge method={ep.method} />
                              {/* URI hidden by default — click {URI} toggle to reveal */}
                              <span
                                className="mt-api-card__uri-toggle"
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
                                <span className="mt-api-card__ep-sum">— {ep.summary.slice(0, 50)}</span>
                              )}
                            </div>
                          );
                        })}

                        {spec.fields?.length > 0 && (() => {
                          const fKey = `${gi}-fields`;
                          const fOpen = openSections.has(fKey);
                          return (
                            <div className="mt-api-card__fields-wrap">
                              <div
                                className="mt-api-card__fields-label mt-api-card__fields-label--toggle"
                                onClick={() => {
                                  const next = new Set(openSections);
                                  fOpen ? next.delete(fKey) : next.add(fKey);
                                  this.setState({ openSections: next });
                                }}
                              >
                                <span className="mt-api-card__section-arrow">{fOpen ? "▾" : "▸"}</span>
                                Schema fields ({spec.fields.length}):
                              </div>
                              {fOpen && (
                                <div className="mt-api-card__fields">
                                  {spec.fields.slice(0, 20).map(f => (
                                    <span
                                      key={f.name}
                                      className="mt-api-card__field-chip"
                                      title={`${f.name}: ${f.type}${f.required ? " (required)" : ""}`}
                                    >
                                      {f.name}
                                      {f.type !== "string" && f.type !== "integer" && (
                                        <em style={{ opacity: 0.6, marginLeft: 3 }}>:{f.type}</em>
                                      )}
                                    </span>
                                  ))}
                                  {spec.fields.length > 20 && (
                                    <span className="mt-api-card__more">+{spec.fields.length - 20} altri</span>
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
                            <div className="mt-api-card__fields-wrap" style={{ marginTop: 8 }}>
                              <div
                                className="mt-api-card__fields-label mt-api-card__fields-label--toggle"
                                onClick={() => {
                                  const next = new Set(openSections);
                                  dOpen ? next.delete(dKey) : next.add(dKey);
                                  this.setState({ openSections: next });
                                }}
                              >
                                <span className="mt-api-card__section-arrow">{dOpen ? "▾" : "▸"}</span>
                                Schema dependencies ({spec.dependencies.length}):
                              </div>
                              {dOpen && (
                                <div className="mt-api-card__fields">
                                  {spec.dependencies.map(d => (
                                    <code key={d} className="mt-deps__code-y" style={{ marginRight: 4 }}>
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
              {pageStart + 1}–{Math.min(pageStart + apiPageSize, filteredSpecs.length)} of {filteredSpecs.length}
            </span>
          </div>
        )}

        {/* Parse status spinner */}
        {parsing && (
          <div className="mt-upload__parsing">⚙ Parsing in corso...</div>
        )}

        {/* Parse results log — collapsed by default, before Grafo */}
        {results.length > 0 && (
          <div className="mt-deps">
            <button
              className="mt-deps__toggle"
              onClick={() => this.setState(s => ({ showParseResults: !s.showParseResults }))}
            >
              {showParseResults ? "▲" : "▼"} Log Caricamento API ({results.filter(r => r.ok).length} ok
              {results.filter(r => !r.ok).length > 0 && `, ${results.filter(r => !r.ok).length} errori`})
            </button>
            {showParseResults && (
              <div className="mt-upload__results">
                {results.slice(-4).map((r, i) => (
                  <div
                    key={i}
                    className={`mt-upload__result mt-upload__result--${r.ok ? "ok" : "err"}`}
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
          </div>
        )}

        {/* Dependency graph */}
        {loadedSpecs.length > 1 && (
          <div className="mt-deps">
            <button
              className="mt-deps__toggle"
              onClick={() => this.setState(s => ({ showDeps: !s.showDeps }))}
            >
              {showDeps ? "▲" : "▼"} Grafo Dipendenze API ({depEdges.length} link tra {Object.keys(depNodes).length} risorse)
            </button>
            {showDeps && (
              <div className="mt-deps__body">
                {Object.entries(depNodes).map(([id, node]) => {
                  const deps = depEdges.filter(e => e.from === id).map(e => e.to);
                  const usedBy = depEdges.filter(e => e.to === id).map(e => e.from);
                  return (
                    <div key={id} className="mt-deps__row">
                      <div className="mt-deps__row-meta">
                        <span className="mt-deps__path">/{id}</span>
                        <span className="mt-deps__tag">{node.type}</span>
                        <span className="mt-deps__meta">{node.endpoints} ep</span>
                        {node.fields > 0 && <span className="mt-deps__meta">{node.fields} fields</span>}
                      </div>
                      {deps.length > 0 && (
                        <div className="mt-deps__links">
                          → dipende da: {deps.map(d => <code key={d} className="mt-deps__code-y">{d}</code>)}
                        </div>
                      )}
                      {usedBy.length > 0 && (
                        <div className="mt-deps__links">
                          ← usato da: {usedBy.map(d => <code key={d} className="mt-deps__code-b">{d}</code>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
