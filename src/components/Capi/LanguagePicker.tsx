// Capi/LanguagePicker.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Language picker for the CAPI shell top bar.
// Styles live in capi-shell.scss (imported by CapiShell).
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import i18nInstance from "../../i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

interface LangOption {
  code: string;         // i18next language code
  flagCode: string;     // flagcdn.com country code
  label: string;        // English name
  nativeLabel: string;  // Native name
  shortCode: string;    // Uppercase 2-letter abbreviation
}

const LANGUAGES: LangOption[] = [
  { code: "en", flagCode: "gb", label: "English", nativeLabel: "English", shortCode: "EN" },
  { code: "de", flagCode: "de", label: "German", nativeLabel: "Deutsch", shortCode: "DE" },
  { code: "fr", flagCode: "fr", label: "French", nativeLabel: "Français", shortCode: "FR" },
  { code: "it", flagCode: "it", label: "Italian", nativeLabel: "Italiano", shortCode: "IT" },
  { code: "pt", flagCode: "br", label: "Portuguese", nativeLabel: "Português", shortCode: "PT" },
];

function flagUrl(flagCode: string): string {
  return `https://flagcdn.com/w40/${flagCode}.png`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`capi-lt-chevron${open ? " open" : ""}`}
      width={10}
      height={10}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, color: "var(--cs-muted, #64748b)" }}
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: "#fff" }}
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 4"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function LanguagePicker() {
  // Use the i18n instance directly — no hook, no context dependency
  const i18n = i18nInstance;
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<string>(
    () => i18n.language?.slice(0, 2) ?? "en"
  );
  const ref = useRef<HTMLDivElement>(null);

  // Keep in sync if language changes from outside
  useEffect(() => {
    const handler = (lng: string) => setActiveLang(lng.slice(0, 2));
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [i18n]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === activeLang) ?? LANGUAGES[0];

  const select = useCallback((code: string) => {
    i18n.changeLanguage(code);
    setActiveLang(code);
    setOpen(false);
  }, [i18n]);

  // ── Styles (CSS-var-driven) ──────────────────────────────────────────────

  const triggerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 9px 4px 4px",
    border: "1px solid var(--cs-border, #e2e8f0)",
    borderRadius: 20,
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "var(--cs-text2, #334155)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: ".4px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    userSelect: "none",
    transition: "all .18s",
  };

  const flagRingStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    border: "1.5px solid var(--cs-border, #e2e8f0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const flagImgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: 190,
    maxWidth: "calc(100vw - 20px)",
    background: "var(--cs-bg, #ffffff)",
    border: "1px solid var(--cs-border, #e2e8f0)",
    borderRadius: 10,
    boxShadow: "0 4px 6px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.1)",
    overflow: "hidden",
    zIndex: 500,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px 7px",
  };

  const lineStyle: React.CSSProperties = {
    flex: 1,
    height: 1,
    background: "var(--cs-border, #e2e8f0)",
  };

  const headerTextStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: ".9px",
    textTransform: "uppercase",
    color: "var(--cs-muted, #64748b)",
    whiteSpace: "nowrap",
  };

  const listStyle: React.CSSProperties = {
    listStyle: "none",
    margin: 0,
    padding: "0 5px 7px",
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={ref} style={{ position: "relative" }} className="capi-lt">

      {/* Trigger */}
      <button
        className={`capi-lt-trigger${open ? " open" : ""}`}
        style={triggerStyle}
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="capi-lt-flag-ring" style={flagRingStyle}>
          <img
            src={flagUrl(currentLang.flagCode)}
            alt={currentLang.label}
            style={flagImgStyle}
          />
        </span>
        {currentLang.shortCode}
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="capi-lt-dropdown"
          style={dropdownStyle}
          role="listbox"
          aria-label="Language selection"
        >
          {/* Header divider */}
          <div style={headerStyle}>
            <span style={lineStyle} />
            <span style={headerTextStyle}>
              {"Language"}
            </span>
            <span style={lineStyle} />
          </div>

          {/* Options */}
          <ul style={listStyle}>
            {LANGUAGES.map(lang => {
              const isActive = lang.code === currentLang.code;

              const optStyle: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "6px 9px",
                borderRadius: 7,
                cursor: "pointer",
                color: isActive
                  ? "var(--cs-accent, #2563eb)"
                  : "var(--cs-text2, #334155)",
                background: isActive
                  ? "var(--cs-accent-bg, #eff6ff)"
                  : "transparent",
                listStyle: "none",
                transition: "all .12s",
                userSelect: "none",
              };

              const optFlagRing: React.CSSProperties = {
                width: 28,
                height: 28,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                border: `1.5px solid ${isActive
                  ? "var(--cs-accent, #2563eb)"
                  : "var(--cs-border, #e2e8f0)"
                  }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              };

              const checkWrapStyle: React.CSSProperties = {
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--cs-accent, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              };

              return (
                <li
                  key={lang.code}
                  className={`capi-lt-option${isActive ? " capi-lt-opt-active" : ""}`}
                  style={optStyle}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => select(lang.code)}
                >
                  {/* Flag */}
                  <span className="capi-lt-flag-ring" style={optFlagRing}>
                    <img
                      src={flagUrl(lang.flagCode)}
                      alt={lang.label}
                      style={flagImgStyle}
                    />
                  </span>

                  {/* Text */}
                  <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    <span
                      className="capi-lt-native"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      {lang.nativeLabel}
                    </span>
                    <span
                      className="capi-lt-code"
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: ".5px",
                        textTransform: "uppercase",
                        color: isActive
                          ? "var(--cs-accent, #2563eb)"
                          : "var(--cs-muted, #64748b)",
                        opacity: isActive ? .7 : 1,
                      }}
                    >
                      {lang.shortCode}
                    </span>
                  </span>

                  {/* Checkmark */}
                  {isActive && (
                    <span style={checkWrapStyle}>
                      <CheckIcon />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
