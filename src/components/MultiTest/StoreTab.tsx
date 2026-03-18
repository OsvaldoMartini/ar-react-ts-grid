import React from "react";
import { db } from "./utils";
import { JsonBlock } from "./AtomComponents";
import "./mt-store.scss";

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
      <div className="mt-store">
        {Object.entries(db.stores).map(([res, recs]) => (
          <div key={res} className="mt-store__resource">
            {/* Resource header */}
            <div className="mt-store__resource-header">
              <span>/{res.toUpperCase()} — {recs.length} records</span>
              <div className="mt-store__resource-actions">
                <button className="mt-store-btn mt-store-btn--test"    onClick={onOpenWizard}>🧪 Test</button>
                <button className="mt-store-btn mt-store-btn--report"  onClick={onOpenReport}>📊 Report</button>
                <button className="mt-store-btn mt-store-btn--refresh" onClick={this.refresh}>↻</button>
              </div>
            </div>

            {/* Empty state */}
            {recs.length === 0 && (
              <div className="mt-store__empty">Nessun record.</div>
            )}

            {/* Records */}
            <div className="mt-store__records">
              {recs.map(rec => (
                <div key={rec.id} className="mt-store__record">
                  {/* ID badge */}
                  <div className="mt-store__record-id">#{rec.id}</div>

                  {/* Name + meta */}
                  <div>
                    <div className="mt-store__record-name">
                      {[rec.firstName, rec.name].filter(Boolean).join(" ") || rec.firm || `Record ${rec.id}`}
                      {rec.firm && (rec.firstName || rec.name) && (
                        <span className="mt-store__record-firm">@ {rec.firm}</span>
                      )}
                    </div>
                    <div className="mt-store__record-meta">
                      {JSON.stringify(rec).slice(0, 120)}
                      {JSON.stringify(rec).length > 120 ? "..." : ""}
                    </div>
                  </div>

                  {/* Type tags */}
                  <div className="mt-store__record-tags">
                    {rec.addrType?.ident && (
                      <span className="mt-store__tag mt-store__tag--addr">
                        {rec.addrType.ident}
                      </span>
                    )}
                    {rec.country?.ident && (
                      <span className="mt-store__tag mt-store__tag--country">
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
