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

import React, { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { LanguagePicker } from "./LanguagePicker";
import App, { type AppProps } from "./App";
import { MtI18nBridge } from "./MtI18nBridge";
import i18nInstance from "../../i18n";
import { mtT as t } from "./useMtT";

// Toggle to re-enable the language dropdown in the top bar. Bundled English
// fallback in MtI18nBridge keeps the UI readable, so the picker is currently
// hidden — flip to true to expose it again without code edits.
const SHOW_LANGUAGE_PICKER = false;

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle — lives here so useTheme() is always inside <ThemeProvider>
// Styles come from mt-shell.scss (.mt-toggle-*)
// ─────────────────────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  const lightLabel = t("shell.lightMode");
  const darkLabel = t("shell.darkMode");
  const label = isDark ? lightLabel : darkLabel;
  return (
    <button
      className="mt-toggle-btn"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <div className={`mt-toggle-track${isDark ? " on" : ""}`}>
        <div className="mt-toggle-thumb" />
      </div>
      <span className="mt-toggle-icon" aria-hidden>
        {isDark ? "☀️" : "🌙"}
      </span>
      <span className="mt-toggle-label">
        {isDark ? t("shell.light") : t("shell.dark")}
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
        <span className="mt-shell-title">{t("shell.brand")}</span>
      </div>
      <div className="mt-shell-controls">
        {SHOW_LANGUAGE_PICKER && <LanguagePicker />}
        <ThemeToggle />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemedShell — child of ThemeProvider, applies [data-mt-theme] to root div
// This attribute drives ALL CSS tokens in mt-tokens.scss
//
// i18nReady gate: HttpBackend loads translations async. We hold rendering
// until i18next fires "initialized" so App.tsx never sees raw keys on first
// paint. If i18n is already initialized (HMR / warm cache), we render immediately.
// ─────────────────────────────────────────────────────────────────────────────

function ThemedShell(props: AppProps) {
  const { theme } = useTheme();
  const [i18nReady, setI18nReady] = useState<boolean>(i18nInstance.isInitialized);

  useEffect(() => {
    if (i18nInstance.isInitialized) {
      setI18nReady(true);
      return;
    }
    const handler = () => {
      setI18nReady(true);
      i18nInstance.off("initialized", handler); // self-unsubscribe after first fire
    };
    i18nInstance.on("initialized", handler);
    return () => { i18nInstance.off("initialized", handler); };
  }, []);

  if (!i18nReady) {
    // Transparent placeholder — same dimensions, no flash of raw keys
    return (
      <div
        data-mt-theme={theme}
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      />
    );
  }

  return (
    <div
      data-mt-theme={theme}
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <App
        {...props}
        rightControls={
          <>
            {SHOW_LANGUAGE_PICKER && <LanguagePicker />}
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
      <MtI18nBridge>
        <ThemedShell {...props} />
      </MtI18nBridge>
    </ThemeProvider>
  );
}
