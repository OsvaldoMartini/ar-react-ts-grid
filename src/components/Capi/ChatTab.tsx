import React, { createRef } from "react";

// ═══════════════════════════════════════════════════════════════
// CHAT TAB  — AI assistant conversation panel
// ═══════════════════════════════════════════════════════════════
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatTabProps {
  history: ChatMessage[];
  loading: boolean;
  provider: string;
  onSend: (prompt: string) => void;
  onClear: () => void;
  onOpenWizard: () => void;
  onOpenReport: () => void;
}

interface ChatTabState {
  prompt: string;
}

const QUICK_ACTIONS = [
  "Mostra tutti i record",
  "Crea 5 indirizzi bancari europei",
  "Test CRUD su obj-addrs",
  "8 GET load test",
  "Cerca indirizzi in Svizzera",
];

export class ChatTab extends React.Component<ChatTabProps, ChatTabState> {
  state: ChatTabState = { prompt: "" };
  private chatEndRef = createRef<HTMLDivElement>();
  private textareaRef = createRef<HTMLTextAreaElement>();

  componentDidUpdate(prevProps: ChatTabProps) {
    if (prevProps.history !== this.props.history) {
      this.chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  private handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  };

  private handleSend = () => {
    const { prompt } = this.state;
    if (!prompt.trim() || this.props.loading) return;
    this.props.onSend(prompt.trim());
    this.setState({ prompt: "" });
  };

  private providerBadge() {
    return this.props.provider === "ollama"
      ? { label: "🖥 OLLAMA", bg: "#0d2b0d", border: "#3fb950", color: "#3fb950" }
      : { label: "☁ CLAUDE", bg: "#0d1e3a", border: "#58a6ff", color: "#58a6ff" };
  }

  render() {
    const { history, loading, onClear, onOpenWizard, onOpenReport } = this.props;
    const { prompt } = this.state;
    const pBadge = this.providerBadge();

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Quick action bar */}
        <div style={{
          padding: "6px 18px", borderBottom: "1px solid #21262d",
          display: "flex", gap: 5, flexWrap: "wrap",
          background: "#0a0e17", alignItems: "center",
        }}>
          <span style={{ fontSize: 9, color: "#555" }}>QUICK:</span>
          {QUICK_ACTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => { this.setState({ prompt: q }); this.textareaRef.current?.focus(); }}
              style={{
                background: "#161b22", border: "1px solid #30363d",
                color: "#8b949e", borderRadius: 4, padding: "3px 8px",
                cursor: "pointer", fontSize: 9, fontFamily: "inherit",
              }}
            >
              {q}
            </button>
          ))}
          <button onClick={onOpenWizard} style={{
            marginLeft: "auto", background: "#0d2347", border: "1px solid #3fb950",
            color: "#3fb950", borderRadius: 4, padding: "3px 10px",
            cursor: "pointer", fontSize: 9, fontFamily: "inherit", fontWeight: 700,
          }}>🧪 Wizard</button>
          <button onClick={onOpenReport} style={{
            background: "#0a1628", border: "1px solid #c9a84c",
            color: "#c9a84c", borderRadius: 4, padding: "3px 10px",
            cursor: "pointer", fontSize: 9, fontFamily: "inherit", fontWeight: 700,
          }}>📊 Report</button>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "14px 18px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {history.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
              <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 4 }}>Simulatore pronto</div>
              <div style={{ fontSize: 10, color: pBadge.color, marginBottom: 3 }}>
                Provider: {pBadge.label}
              </div>
              <div style={{ fontSize: 10, color: "#30363d" }}>
                Carica API · Chat AI · Business Case Wizard · HTML Reports
              </div>
            </div>
          )}
          {history.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%",
                background: m.role === "user" ? "#1f6feb22" : "#161b22",
                border: m.role === "user" ? "1px solid #1f6feb66" : "1px solid #21262d",
                borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "9px 12px", fontSize: 11, lineHeight: 1.7, color: "#e6edf3",
              }}>
                <div style={{ fontSize: 8, color: "#555", marginBottom: 3, letterSpacing: 1 }}>
                  {m.role === "user" ? "YOU" : "AVALOQ AI"}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex" }}>
              <div style={{
                background: "#161b22", border: "1px solid #21262d",
                borderRadius: "12px 12px 12px 2px", padding: "9px 14px",
                fontSize: 10, color: "#8b949e",
              }}>
                ⚙ Elaborazione...
              </div>
            </div>
          )}
          <div ref={this.chatEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: "10px 18px", borderTop: "1px solid #21262d",
          background: "#0d1117", display: "flex", gap: 7, alignItems: "flex-end",
        }}>
          <textarea
            ref={this.textareaRef}
            value={prompt}
            onChange={e => this.setState({ prompt: e.target.value })}
            onKeyDown={this.handleKeyDown}
            disabled={loading}
            placeholder="Es: Crea 5 clienti europei · Testa endpoint · Cerca per paese..."
            style={{
              flex: 1, background: "#161b22", border: "1px solid #30363d",
              borderRadius: 5, color: "#e6edf3", fontFamily: "inherit",
              fontSize: 11, padding: "9px 10px", resize: "none",
              outline: "none", lineHeight: 1.5, minHeight: 40, maxHeight: 100,
            }}
            rows={2}
          />
          <button
            onClick={this.handleSend}
            disabled={loading || !prompt.trim()}
            style={{
              background: loading ? "#21262d" : "linear-gradient(135deg,#0052cc,#0066ff)",
              border: "none", borderRadius: 5, color: "white",
              padding: "9px 14px", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 11, fontFamily: "inherit", fontWeight: 600,
              height: 40, minWidth: 72,
            }}
          >
            {loading ? "..." : "SEND ↵"}
          </button>
          <button
            onClick={onClear}
            style={{
              background: "none", border: "1px solid #30363d", borderRadius: 5,
              color: "#8b949e", padding: "9px 10px", cursor: "pointer",
              fontSize: 9, fontFamily: "inherit", height: 40,
            }}
          >
            CLR
          </button>
        </div>
      </div>
    );
  }
}
