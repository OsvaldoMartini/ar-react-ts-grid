import React from "react";
import { db } from "./utils";
import { JsonBlock } from "./AtomComponents";

// ═══════════════════════════════════════════════════════════════
// STORE TAB  — shows all in-memory records grouped by resource
// ═══════════════════════════════════════════════════════════════
interface StoreTabProps {
  onOpenWizard: () => void;
  onOpenReport: () => void;
}

interface StoreTabState { tick: number; }

export class StoreTab extends React.Component<StoreTabProps, StoreTabState> {
  state: StoreTabState = { tick: 0 };

  refresh = () => this.setState(s => ({ tick: s.tick + 1 }));

  render() {
    const { onOpenWizard, onOpenReport } = this.props;
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        {Object.entries(db.stores).map(([res, recs]) => (
          <div key={res} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 10, color: "#58a6ff", marginBottom: 8,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>/{res.toUpperCase()} — {recs.length} records</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={onOpenWizard} style={{ background: "#0d2347", border: "1px solid #3fb950", borderRadius: 3, color: "#3fb950", padding: "2px 7px", cursor: "pointer", fontSize: 8, fontFamily: "inherit", fontWeight: 700 }}>🧪 Test</button>
                <button onClick={onOpenReport} style={{ background: "#0a1628", border: "1px solid #c9a84c", borderRadius: 3, color: "#c9a84c", padding: "2px 7px", cursor: "pointer", fontSize: 8, fontFamily: "inherit", fontWeight: 700 }}>📊 Report</button>
                <button onClick={this.refresh} style={{ background: "none", border: "1px solid #30363d", borderRadius: 3, color: "#8b949e", padding: "2px 7px", cursor: "pointer", fontSize: 9, fontFamily: "inherit" }}>↻</button>
              </div>
            </div>
            {recs.length === 0 && (
              <div style={{ fontSize: 10, color: "#30363d", padding: "12px 0" }}>Nessun record.</div>
            )}
            <div style={{ display: "grid", gap: 5 }}>
              {recs.map(rec => (
                <div key={rec.id} style={{
                  background: "#0d1117", border: "1px solid #21262d",
                  borderRadius: 5, padding: "8px 12px",
                  display: "grid", gridTemplateColumns: "auto 1fr auto",
                  gap: 8, alignItems: "start",
                }}>
                  <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 3, padding: "2px 6px", fontSize: 9, color: "#58a6ff", fontFamily: "monospace" }}>
                    #{rec.id}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#e6edf3", marginBottom: 2 }}>
                      {[rec.firstName, rec.name].filter(Boolean).join(" ") || rec.firm || `Record ${rec.id}`}
                      {rec.firm && (rec.firstName || rec.name) && (
                        <span style={{ fontSize: 9, color: "#8b949e", marginLeft: 6 }}>@ {rec.firm}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>
                      {JSON.stringify(rec).slice(0, 120)}{JSON.stringify(rec).length > 120 ? "..." : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {rec.addrType?.ident && (
                      <span style={{ fontSize: 8, background: "#1f6feb22", border: "1px solid #1f6feb44", color: "#58a6ff", borderRadius: 3, padding: "1px 4px" }}>
                        {rec.addrType.ident}
                      </span>
                    )}
                    {rec.country?.ident && (
                      <span style={{ fontSize: 8, background: "#0d2b0d", border: "1px solid #23862044", color: "#3fb950", borderRadius: 3, padding: "1px 4px" }}>
                        {rec.country.ident}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
