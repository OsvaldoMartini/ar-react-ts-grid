// ═══════════════════════════════════════════════════════════════
// BANKING MODULE — barrel export
// ═══════════════════════════════════════════════════════════════

// Auto-register built-in plugins on first import
import "./plugins/builtInPlugins";

export * from "./BankingContext";
export * from "./PluginSystem";
export * from "./TestLibraryStore";
