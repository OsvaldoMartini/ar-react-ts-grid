// Capi/CapiShell.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Top-level entry point for the CAPI app.
//
// Provides:
//   1. ThemeProvider context (default: light)
//   2. One top bar → LanguagePicker + ThemeToggle (only here, never duplicated)
//   3. App rendered below with full theme coverage via [data-capi-theme]
//
// Usage in ApiTestToolAINew.tsx (already done):
//   import CapiShell from "./Capi/CapiShell";
//   export default CapiShell;
// ─────────────────────────────────────────────────────────────────────────────

import "../../i18n";               // initialise i18next (src/i18n.ts)
import "./capi-shell.scss";        // shell bar + toggle styles (uses capi-tokens)

import React from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { LanguagePicker } from "./LanguagePicker";
import App, { type CapiProps } from "./App";

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle — lives here so useTheme() is always inside <ThemeProvider>
// Styles come from capi-shell.scss (.capi-toggle-*)
// ─────────────────────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      className="capi-toggle-btn"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className={`capi-toggle-track${isDark ? " on" : ""}`}>
        <div className="capi-toggle-thumb" />
      </div>
      <span className="capi-toggle-icon" aria-hidden>
        {isDark ? "☀️" : "🌙"}
      </span>
      <span className="capi-toggle-label">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShellTopBar — one bar, full width, brand left / controls right
// ─────────────────────────────────────────────────────────────────────────────

function ShellTopBar() {
  return (
    <div className="capi-shell-bar" role="banner">
      <div className="capi-shell-brand">
        <span className="capi-shell-dot" aria-hidden />
        <span className="capi-shell-title">CAPI Tools</span>
      </div>
      <div className="capi-shell-controls">
        <LanguagePicker />
        <ThemeToggle />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemedShell — child of ThemeProvider, applies [data-capi-theme] to root div
// This attribute drives ALL CSS tokens in capi-tokens.scss
// ─────────────────────────────────────────────────────────────────────────────

function ThemedShell(props: CapiProps) {
  const { theme } = useTheme();
  return (
    <div
      data-capi-theme={theme}
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <App
        {...props}
        rightControls={
          <>
            <LanguagePicker />
            <ThemeToggle />
          </>
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CapiShell — public entry point (default export)
// ─────────────────────────────────────────────────────────────────────────────

export default function CapiShell(props: CapiProps) {
  return (
    <ThemeProvider>
      <ThemedShell {...props} />
    </ThemeProvider>
  );
}
