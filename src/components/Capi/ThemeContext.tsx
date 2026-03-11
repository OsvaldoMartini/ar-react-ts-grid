// Capi/ThemeContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Ported from AutoTraderAI/src/context/ThemeContext.tsx
// Scoped to CAPI: localStorage key → "capi-theme" | default → "light"
// Used by CapiShell to drive the data-capi-theme attribute on the root wrapper.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    // Explicit cast — stored value is always "light" | "dark" | null
    return (localStorage.getItem("capi-theme") as Theme) ?? "light";
  });

  // Persist to localStorage whenever theme changes
  useEffect(() => {
    localStorage.setItem("capi-theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === "light" ? "dark" : "light"));

  return (
    <Ctx.Provider value={{ theme, isDark: theme === "dark", toggle }}>
      {children}
    </Ctx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
