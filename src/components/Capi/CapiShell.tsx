// Capi/CapiShell.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NEW top-level entry point for the CAPI app.
//
// What it adds (without touching any existing Capi/*.tsx files):
//   1. ThemeProvider context (light default, dark optional)
//   2. CSS custom property tokens for light/dark shell UI
//   3. A thin top bar  →  LanguagePicker  +  Theme toggle
//   4. Mobile-responsive shell styles
//
// Usage in your index.tsx (replace App with CapiShell):
//
//   import CapiShell from "./Capi/CapiShell";
//   root.render(<CapiShell homeBankingIdInitial={1} socketPort={8080}
//                          sessionId="abc" botJobIdInitial={0} botJobNameInitial="" />);
//
// The existing Capi/App.tsx is rendered unchanged inside the shell.
// ─────────────────────────────────────────────────────────────────────────────

import "../../i18n"; // ← initialize i18next — lives at src/i18n.ts

import React from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import App, { type CapiProps } from "./App";

// ─────────────────────────────────────────────────────────────────────────────
// CSS tokens + mobile rules — injected once into <head>
// Only the shell top bar consumes these variables.
// The existing CAPI body retains its own dark inline styles.
// ─────────────────────────────────────────────────────────────────────────────

const SHELL_CSS = `
  /* ── Light (default) ────────────────────────────────────────────────────── */
  [data-capi-theme="light"] {
    --cs-bg:            #ffffff;
    --cs-surface:       #f8fafc;
    --cs-border:        #e2e8f0;
    --cs-text:          #0f172a;
    --cs-text2:         #334155;
    --cs-muted:         #64748b;
    --cs-accent:        #2563eb;
    --cs-accent-bg:     #eff6ff;
    --cs-accent-border: #bfdbfe;
    --cs-toggle-track:  #e2e8f0;
    --cs-toggle-thumb:  #64748b;
    --cs-toggle-icon:   "🌙";
  }

  /* ── Dark ───────────────────────────────────────────────────────────────── */
  [data-capi-theme="dark"] {
    --cs-bg:            #0d1117;
    --cs-surface:       #161b22;
    --cs-border:        #21262d;
    --cs-text:          #e6edf3;
    --cs-text2:         #8b949e;
    --cs-muted:         #6e7681;
    --cs-accent:        #58a6ff;
    --cs-accent-bg:     rgba(88,166,255,.09);
    --cs-accent-border: rgba(88,166,255,.28);
    --cs-toggle-track:  #30363d;
    --cs-toggle-thumb:  #58a6ff;
  }

  /* ── Shell top bar ──────────────────────────────────────────────────────── */
  .capi-shell-bar {
    display:         flex;
    align-items:     center;
    justify-content: space-between;
    padding:         7px 18px;
    background:      var(--cs-surface);
    border-bottom:   1px solid var(--cs-border);
    font-family:     'IBM Plex Mono','Courier New',monospace;
    gap:             10px;
    min-height:      40px;
    box-sizing:      border-box;
    transition:      background .25s, border-color .25s;
  }

  .capi-shell-brand {
    display:     flex;
    align-items: center;
    gap:         8px;
    flex-shrink: 0;
  }

  .capi-shell-dot {
    width:         8px;
    height:        8px;
    border-radius: 50%;
    background:    var(--cs-accent);
    flex-shrink:   0;
    box-shadow:    0 0 6px var(--cs-accent);
  }

  .capi-shell-title {
    font-size:      9px;
    font-weight:    700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color:          var(--cs-muted);
    white-space:    nowrap;
  }

  /* Right-side controls cluster */
  .capi-shell-controls {
    display:     flex;
    align-items: center;
    gap:         8px;
    margin-left: auto;
  }

  /* Theme toggle button */
  .capi-shell-toggle {
    display:        inline-flex;
    align-items:    center;
    gap:            5px;
    background:     none;
    border:         1px solid var(--cs-border);
    border-radius:  20px;
    padding:        4px 11px;
    cursor:         pointer;
    color:          var(--cs-text2);
    font-size:      9px;
    font-family:    inherit;
    font-weight:    700;
    letter-spacing: .6px;
    text-transform: uppercase;
    white-space:    nowrap;
    transition:     border-color .15s, background .15s, color .15s;
    min-height:     30px;
  }
  .capi-shell-toggle:hover {
    border-color: var(--cs-accent) !important;
    background:   var(--cs-accent-bg) !important;
    color:        var(--cs-accent) !important;
  }

  /* ── Mobile ─────────────────────────────────────────────────────────────── */
  @media (max-width: 600px) {
    .capi-shell-bar    { padding: 6px 10px; gap: 6px; }
    .capi-shell-title  { display: none; }          /* hide label, keep dot */
    .capi-shell-toggle { padding: 4px 9px; }
  }
  @media (max-width: 380px) {
    .capi-shell-dot    { display: none; }
  }
`;

let shellCssInjected = false;
function injectShellCss() {
  if (shellCssInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.setAttribute("data-capi-shell", "1");
  el.textContent = SHELL_CSS;
  document.head.appendChild(el);
  shellCssInjected = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// ShellTopBar — rendered inside ThemeProvider so it can read the context
// ─────────────────────────────────────────────────────────────────────────────

function ShellTopBar() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="capi-shell-bar" role="banner">
      {/* Brand */}
      <div className="capi-shell-brand">
        <span className="capi-shell-dot" aria-hidden />
        <span className="capi-shell-title">CAPI Tools</span>
      </div>

      {/* Controls */}
      <div className="capi-shell-controls">
        {/* Theme toggle */}
        <button
          className="capi-shell-toggle"
          onClick={toggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span aria-hidden>{isDark ? "☀️" : "🌙"}</span>
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemedShell — needs to be a child of ThemeProvider to call useTheme()
// ─────────────────────────────────────────────────────────────────────────────

function ThemedShell(props: CapiProps) {
  const { theme } = useTheme();

  // Inject CSS tokens once (idempotent)
  injectShellCss();

  return (
    <div
      data-capi-theme={theme}
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* Shell top bar — light/dark themed */}
      <ShellTopBar />

      {/* Existing CAPI App — zero modifications */}
      <App {...props} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CapiShell — public entry point
// Replaces direct use of <App> in index.tsx
// ─────────────────────────────────────────────────────────────────────────────

export default function CapiShell(props: CapiProps) {
  return (
    <ThemeProvider>
      <ThemedShell {...props} />
    </ThemeProvider>
  );
}
