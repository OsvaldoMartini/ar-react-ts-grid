import React from "react";
import { testStore, TestCase } from "./utils";
import { StatusBadge } from "./AtomComponents";

// ═══════════════════════════════════════════════════════════════
// RUNNING TAB  — live execution view (BizWizard-style)
// Polls testStore every 150ms so stat cards + case list update
// in real time while ReadyForTestTab is executing.
// ═══════════════════════════════════════════════════════════════

const MONO = "'JetBrains Mono','Fira Code',monospace";

const METHOD_COLORS: Record<string, string> = {
  POST: "#34d399", GET: "#60a5fa", PATCH: "#fb923c",
  PUT: "#f59e0b", DELETE: "#f87171", RPC: "#a78bfa",
};

// ── Small atoms ──────────────────────────────────────────────────
function MChip({ method }: { method: string }) {
  const c = METHOD_COLORS[method?.toUpperCase()] || "#8b949e";
  return (
    <span style={{
      background: c + "18", border: `1px solid ${c}40`, color: c,
      borderRadius: 4, padding: "1px 7px", fontFamily: MONO, fontSize: 10,
      fontWeight: 700, whiteSpace: "nowrap" as const, flexShrink: 0,
    }}>
      {method?.toUpperCase()}
    </span>
  );
}

function StatCard({ value, label, color, icon }: {
  value: string | number; label: string; color: string; icon: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 90, padding: "18px 14px", borderRadius: 12,
      textAlign: "center", background: color + "0c", border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{
        fontFamily: MONO, fontSize: 26, fontWeight: 800,
        color, lineHeight: 1, marginBottom: 5,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 700,
        color, opacity: 0.65, textTransform: "uppercase" as const, letterSpacing: 1,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Case row ─────────────────────────────────────────────────────
function CaseRow({ tc, idx }: { tc: TestCase; idx: number }) {
  const isRunning = tc.status === "running";
  const isPassed  = tc.status === "passed";
  const isFailed  = tc.status === "failed";
  const isPending = tc.status === "pending";

  const rowCol = isRunning ? "#f59e0b"
    : isPassed  ? "#34d399"
    : isFailed  ? "#f87171"
    : "#8b949e";

  const icon = isRunning ? "⏳"
    : isPassed  ? "✅"
    : isFailed  ? "❌"
    : "○";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 14px",
      background: rowCol + (isRunning ? "12" : isPassed ? "08" : isFailed ? "08" : "05"),
      borderRadius: 8,
      border: `1px solid ${rowCol}${isRunning ? "44" : "22"}`,
      borderLeft: `3px solid ${rowCol}`,
      transition: "all .2s",
      opacity: isPending ? 0.45 : 1,
    }}>
      <span style={{ fontFamily: MONO, fontSize: 13, flexShrink: 0, width: 20, textAlign: "center" as const }}>
        {icon}
      </span>
      <span style={{
        fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
        background: "var(--cs-surface-2)", border: "1px solid var(--cs-border-sub)",
        borderRadius: 4, padding: "1px 6px", flexShrink: 0,
      }}>
        #{tc.seq}
      </span>
      <MChip method={tc.method} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 600,
          color: "var(--cs-text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
        }}>
          {tc.apiTitle}
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)", marginTop: 1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
        }}>
          {tc.resolvedUrl ?? tc.path}
        </div>
      </div>
      {tc.httpStatus != null && <StatusBadge status={tc.httpStatus} />}
      {tc.latency != null && (
        <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)", flexShrink: 0 }}>
          {tc.latency}ms
        </span>
      )}
      {isRunning && (
        <span style={{
          fontFamily: MONO, fontSize: 10, color: "#f59e0b",
          animation: "spin 1s linear infinite",
          display: "inline-block", flexShrink: 0,
        }}>⟳</span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
interface RunningTabState {
  tick: number;
  showAll: boolean;
}

export class RunningTab extends React.Component<{}, RunningTabState> {
  state: RunningTabState = { tick: 0, showAll: false };
  private pollId: ReturnType<typeof setInterval> | null = null;
  private bottomRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    // Inject spin keyframe if needed
    if (typeof document !== "undefined" && !document.getElementById("rt-spin")) {
      const s = document.createElement("style");
      s.id = "rt-spin";
      s.textContent = `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
      document.head.appendChild(s);
    }
    // Poll every 150ms for live updates
    this.pollId = setInterval(() => this.setState(s => ({ tick: s.tick + 1 })), 150);
  }

  componentDidUpdate() {
    // Auto-scroll to the currently running case
    this.bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  componentWillUnmount() {
    if (this.pollId) clearInterval(this.pollId);
  }

  render() {
    const { showAll } = this.state;
    const cases = testStore.cases;

    if (cases.length === 0) {
      return (
        <div style={{
          display: "flex", flexDirection: "column" as const,
          alignItems: "center", justifyContent: "center",
          padding: "60px 24px", gap: 12, textAlign: "center" as const,
        }}>
          <span style={{ fontSize: 36 }}>🔍</span>
          <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "var(--cs-muted)" }}>
            No execution yet
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--cs-dim)", maxWidth: 320, lineHeight: 1.6 }}>
            Go to <strong>Ready for Test</strong>, load test cases and click
            <strong> ▶▶ Execute Flow</strong> or <strong>⚗ Execute Independent</strong>.
            Results will appear here in real time.
          </div>
        </div>
      );
    }

    const total   = cases.length;
    const pending = cases.filter(c => c.status === "pending").length;
    const passed  = cases.filter(c => c.status === "passed").length;
    const failed  = cases.filter(c => c.status === "failed").length;
    const running = cases.filter(c => c.status === "running").length;
    const executed = passed + failed;
    const avgLat = executed > 0
      ? Math.round(cases.filter(c => c.latency != null).reduce((a, c) => a + (c.latency || 0), 0) / executed)
      : 0;

    const isLive = running > 0;
    const pct = executed > 0 ? Math.round((passed / executed) * 100) : 0;
    const pctCol = pct === 100 ? "#34d399" : pct >= 70 ? "#f59e0b" : "#f87171";

    // Show: currently running case + completed (most recent 50), or all if showAll
    const active   = cases.filter(c => c.status === "running");
    const done     = cases.filter(c => c.status === "passed" || c.status === "failed").slice(-50);
    const visible  = showAll ? cases : [...active, ...done].slice(-60);

    return (
      <div style={{
        display: "flex", flexDirection: "column" as const,
        gap: 16, padding: "20px 24px", fontFamily: MONO,
      }}>

        {/* ── Live indicator ── */}
        {isLive && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 8,
            background: "#f59e0b10", border: "1px solid #f59e0b33",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#f59e0b", display: "inline-block",
              boxShadow: "0 0 6px #f59e0b",
              animation: "spin 2s linear infinite",
            }} />
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>
              LIVE — execution in progress
            </span>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          <StatCard value={total}   label="Total"   color="#58a6ff"  icon="📋" />
          <StatCard value={pending} label="Pending"  color="#8b949e"  icon="○" />
          <StatCard value={passed}  label="Passed"   color="#34d399"  icon="✓" />
          <StatCard value={failed}  label="Failed"   color="#f87171"  icon="✗" />
          <StatCard value={avgLat > 0 ? `${avgLat}ms` : "—"} label="Avg Lat" color="#f59e0b" icon="⚡" />
        </div>

        {/* ── Progress bar ── */}
        {(isLive || executed > 0) && (
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: MONO, fontSize: 11, color: "var(--cs-muted)", marginBottom: 6,
            }}>
              <span>
                Execution progress ({executed} / {total} executed)
              </span>
              {executed > 0 && (
                <span style={{ fontWeight: 700, color: pctCol }}>{pct}% pass</span>
              )}
            </div>
            <div style={{
              height: 8, borderRadius: 4,
              background: "var(--cs-surface-2)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${(executed / total) * 100}%`,
                background: `linear-gradient(90deg, #34d399, ${pctCol})`,
                transition: "width .3s ease",
              }} />
            </div>
            <div style={{
              display: "flex", gap: 14, marginTop: 6,
              fontFamily: MONO, fontSize: 10, color: "var(--cs-dim)",
            }}>
              {passed  > 0 && <span style={{ color: "#34d399" }}>■ {passed} passed</span>}
              {failed  > 0 && <span style={{ color: "#f87171" }}>■ {failed} failed</span>}
              {pending > 0 && <span>■ {pending} pending</span>}
            </div>
          </div>
        )}

        {/* ── Method breakdown (post-run) ── */}
        {!isLive && executed > 0 && (
          <div>
            <div style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 700,
              color: "var(--cs-dim)", letterSpacing: 1,
              textTransform: "uppercase" as const, marginBottom: 8,
            }}>By HTTP Method</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {(["POST", "GET", "PATCH", "PUT", "DELETE"] as const).map(m => {
                const mCases = cases.filter(c => c.method.toUpperCase() === m && c.status !== "pending");
                if (mCases.length === 0) return null;
                const ok  = mCases.filter(c => c.status === "passed").length;
                const col = METHOD_COLORS[m];
                const lat = mCases.filter(c => c.latency != null);
                const avgM = lat.length > 0
                  ? Math.round(lat.reduce((a, c) => a + (c.latency || 0), 0) / lat.length)
                  : 0;
                return (
                  <div key={m} style={{
                    padding: "8px 13px", borderRadius: 8,
                    background: col + "0a", border: `1px solid ${col}30`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <MChip method={m} />
                      <span style={{ fontFamily: MONO, fontSize: 10, color: col, fontWeight: 700 }}>
                        {ok}/{mCases.length}
                      </span>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--cs-dim)" }}>
                      {avgM}ms avg
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Case stream ── */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontFamily: MONO, fontSize: 10, fontWeight: 700,
            color: "var(--cs-dim)", letterSpacing: 1,
            textTransform: "uppercase" as const, marginBottom: 8,
          }}>
            <span>
              {isLive ? "Live Execution Stream" : "Results"}
              {!showAll && cases.length > 60 && ` (showing last ${visible.length})`}
            </span>
            {cases.length > 60 && (
              <button
                onClick={() => this.setState(s => ({ showAll: !s.showAll }))}
                style={{
                  background: "transparent", border: "1px solid var(--cs-border-sub)",
                  color: "var(--cs-muted)", borderRadius: 5, padding: "2px 9px",
                  fontFamily: MONO, fontSize: 9, cursor: "pointer",
                  textTransform: "none" as const, letterSpacing: 0,
                }}>
                {showAll ? "Show recent" : `Show all ${cases.length}`}
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
            {visible.map((tc, i) => (
              <CaseRow key={tc.id} tc={tc} idx={i} />
            ))}
          </div>
          <div ref={this.bottomRef} />
        </div>

      </div>
    );
  }
}
