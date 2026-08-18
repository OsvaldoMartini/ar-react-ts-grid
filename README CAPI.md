# Capi — Avaloq API Simulator (Class Component Refactor)

Refactored from `CapiOsvaldo1.tsx` (single 2864-line file of React hooks)
into **React Class Components** split across a `Capi/` subfolder.

---

## File Structure

```
Capi/
├── utils.ts              # Utilities, SYNTH data generators, ApiStore, REST engine
├── AtomComponents.tsx    # MethodBadge, StatusBadge, JsonBlock, ResultRow
├── ChatTab.tsx           # AI chat panel (conversation UI + quick actions)
├── DebugTab.tsx          # REST/AI log viewer
├── StoreTab.tsx          # In-memory record browser
├── FileUploadPanel.tsx   # API spec file uploader + spec list
├── BizWizard.tsx         # Business Case Wizard (multi-step modal)
├── App.tsx               # Root Class Component — orchestrates all panels
└── README.md             # This file
```

---

## Architecture Map

| Original (hooks) | Refactored (Class) | Responsibility |
|---|---|---|
| `App()` | `class App` | Root state, tab routing, AI call, send |
| `FileUploadPanel()` | `class FileUploadPanel` | Drag/drop upload, spec parsing, spec list |
| `ChatTab` (inline) | `class ChatTab` | Chat messages, quick actions, textarea |
| `DebugTab` (inline) | `class DebugTab` | Log viewer with color-coded entries |
| `StoreTab` (inline) | `class StoreTab` | In-memory store record browser |
| `BizWizard()` | `class BizWizard` | Business case wizard modal |
| `MB`, `SB`, `JB` | `MethodBadge`, `StatusBadge`, `JsonBlock` | Atom UI chips |
| `ResultRow()` | `class ResultRow` | Expandable test step row |
| `ApiStore` | `ApiStore` (unchanged) | In-memory DB (plain class, unchanged) |

---

## Key Patterns Used

### State management
All `useState` hooks converted to `this.state` + `this.setState`.

### Refs
All `useRef` converted to `createRef<T>()` in class fields.

### Effects (scroll-to-end)
`useEffect` for auto-scroll converted to `componentDidUpdate` with ref checks.

### Callbacks
All `useCallback` functions converted to arrow method properties on the class
(e.g. `private sendMessage = async () => { ... }`).

---

## Usage

```tsx
// index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./Capi/App";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

---

## Original App Features Preserved
- 📁 **API File Loader** — YAML / JSON / proto / PDF drag-drop
- 💬 **AI Chat** — Claude (Anthropic API) or Ollama
- 🔍 **Debug Log** — REST request/response timeline
- 🗄️ **Store Viewer** — In-memory record browser
- 🧪 **Business Case Wizard** — Guided multi-step test execution
- ⚡ **Mock REST Engine** — GET / POST / PATCH / DELETE on local store
