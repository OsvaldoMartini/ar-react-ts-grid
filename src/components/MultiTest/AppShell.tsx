// MultiTest/AppShell.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Top-level entry point for the MultiTest app.
//
// Provides:
//   1. ThemeProvider context (default: light)
//   2. One top bar → LanguagePicker + ThemeToggle (only here, never duplicated)
//   3. App rendered below with full theme coverage via [data-mt-theme]
//
// Usage in ApiTestToolAINew.tsx (already done):
//   import AppShell from "./MultiTest/AppShell";
//   export default AppShell;
// ─────────────────────────────────────────────────────────────────────────────

import "../../i18n";               // initialise i18next (src/i18n.ts)
import "./mt-shell.scss";        // shell bar + toggle styles (uses mt-tokens)

import React from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { LanguagePicker } from "./LanguagePicker";
import App, { type AppProps } from "./App";

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle — lives here so useTheme() is always inside <ThemeProvider>
// Styles come from mt-shell.scss (.mt-toggle-*)
// ─────────────────────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      className="mt-toggle-btn"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className={`mt-toggle-track${isDark ? " on" : ""}`}>
        <div className="mt-toggle-thumb" />
      </div>
      <span className="mt-toggle-icon" aria-hidden>
        {isDark ? "☀️" : "🌙"}
      </span>
      <span className="mt-toggle-label">
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
    <div className="mt-shell-bar" role="banner">
      <div className="mt-shell-brand">
        <span className="mt-shell-dot" aria-hidden />
        <span className="mt-shell-title">MultiTest Tools</span>
      </div>
      <div className="mt-shell-controls">
        <LanguagePicker />
        <ThemeToggle />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemedShell — child of ThemeProvider, applies [data-mt-theme] to root div
// This attribute drives ALL CSS tokens in mt-tokens.scss
// ─────────────────────────────────────────────────────────────────────────────

function ThemedShell(props: AppProps) {
  const { theme } = useTheme();
  return (
    <div
      data-mt-theme={theme}
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
// AppShell — public entry point (default export)
// ─────────────────────────────────────────────────────────────────────────────

export default function AppShell(props: AppProps) {
  return (
    <ThemeProvider>
      <ThemedShell {...props} />
    </ThemeProvider>
  );
}
