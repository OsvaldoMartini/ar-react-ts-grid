# Project Audit Report — abr-react-ts-grid

**Date:** 2026-04-03
**Scope:** SCSS rename, broken references, bug audit, root cleanup, legacy migration, test organisation

---

## 1. Summary of Findings

The project is a multi-purpose React/TypeScript application serving several Java-backend-integrated views (scanner grids, component tasks, API test tools) routed via `sessionId` values injected by `window.receiveDataFromJava()`. A newer **MultiTest/Capi** SaaS module lives under `src/components/MultiTest/` and is the actively developed area.

**Key statistics:**
- **369 total files** (including build artefacts and assets)
- **11 SCSS files** in MultiTest, **6 SCSS** in legacy components, **4 orphan CSS** in assets
- **12 components with 0 external references** (dead code)
- **3 pages with 0 external references** (dead code)
- **1 `.module.scss` file** — the rename introduces a **critical CSS Modules risk**

---

## 2. Rename Impact Analysis

### Requested Rename
`mt-readytest.scss` → `ReadyForTestTab.module.scss`

### What Was Done
- File copied to new name `ReadyForTestTab.module.scss`
- Import in `ReadyForTestTab.tsx` updated from `import "./mt-readytest.scss"` to `import "./ReadyForTestTab.module.scss"`
- Comment header updated in the new file

### ⚠ CRITICAL RISK: `.module.scss` Breaks Global Class Names

**react-scripts 5.0.1** (CRA) treats any file ending in `.module.scss` as a **CSS Module**. This means:
- All class names become locally-scoped hashes (e.g. `rft-exec-wrapper` → `ReadyForTestTab_rft-exec-wrapper__a1b2c`)
- The 26+ usages of `className="rft-*"` in `ReadyForTestTab.tsx` will **no longer match** the generated class names
- **ALL styling in the Ready for Test tab will silently disappear**

**No other file in the project uses `.module.scss`** — every SCSS file is imported as a global side-effect.

### Safe Alternatives

| Option | Risk | Effort |
|--------|------|--------|
| **A. Rename to `ReadyForTestTab.scss`** (no `.module`) | None — keeps global scope | Minimal — just change filename |
| **B. Keep `.module.scss` + refactor classNames** | Medium — many changes | High — 26+ className edits, import change to `import styles from "..."`, bracket notation for hyphenated names |
| **C. Add `:global { }` wrapper** inside `.module.scss` | Low — preserves global scope inside module file | Low — wrap all rules in `:global { ... }` block |

**Recommendation:** Option A (rename without `.module`) or Option C (`:global` wrapper) for zero-risk migration.

### Affected Files
Only **1 file** imports `mt-readytest.scss`:
- `src/components/MultiTest/ReadyForTestTab.tsx` (line 5)

No other SCSS file `@import`s `mt-readytest`. No cross-dependency.

---

## 3. Broken References Found

### 3.1 Missing `@import 'mt-tokens'` in ReadyForTestTab

**Every** other MultiTest SCSS file imports the shared token file:
- `mt-app.scss` → `@import 'mt-tokens'`
- `mt-shell.scss` → `@import 'mt-tokens'`
- `mt-ai.scss` → `@import './mt-tokens'`
- `mt-atoms.scss` → `@import 'mt-tokens'`
- `mt-debug.scss` → `@import 'mt-tokens'`
- `mt-library.scss` → `@import './mt-tokens'`
- `mt-store.scss` → `@import 'mt-tokens'`
- `mt-upload.scss` → `@import 'mt-tokens'`
- `mt-wizard.scss` → `@import 'mt-tokens'`

**`mt-readytest.scss` / `ReadyForTestTab.module.scss` does NOT import `mt-tokens`.** Instead, it re-declares its own local variables (`$mono`, `$teal`, `$amber`, etc.). This creates:
- Drift risk: if design tokens change in `mt-tokens.scss`, ReadyForTestTab won't update
- Inconsistency: `$mono` locally defined vs `$font-mono` in tokens
- The file DOES reference `var(--cs-bg)`, `var(--cs-surface-2)`, `var(--cs-border)`, `var(--cs-muted)`, `var(--cs-dim)` — these CSS custom properties come from `mt-tokens.scss` and work because they're injected globally at runtime. So the CSS custom props work, but the SCSS variables are duplicated.

### 3.2 `clothing_type.scss` Imports `App.css`

`src/pages/clothing_type.scss` begins with:
```scss
/* App.css */
.app-container { ... }
```
This is a copy-paste of `src/App.css` content into a SCSS file. The `App.css` file itself is **never imported** by any component. This is dead code.

### 3.3 `ApiTestToolAINew.tsx` Comment Mismatch

The JSDoc comment says the component is rendered when `sessionId.includes("apiTestToolAINew")`, but `src/index.tsx` actually checks for `sessionId.includes("capiApiTestToolAI")`. The comment is misleading but the code is correct.

### 3.4 Self-Referencing Package Dependencies

`package.json` contains:
```json
"abr-react-ts-grid": "file:",
"react-ts-grid": "file:",
```
These are self-referencing `file:` dependencies pointing at the project root. They are harmless but unnecessary noise.

---

## 4. Bugs Found

### BUG-01: `.module.scss` Will Break All ReadyForTestTab Styling
- **Severity:** CRITICAL
- **Details:** See Section 2 above
- **Fix:** Use Option A or C from the alternatives

### BUG-02: Design Token Drift in ReadyForTestTab
- **Severity:** MEDIUM
- **Details:** Local `$mono`, `$teal`, `$amber`, `$green`, `$blue`, `$red`, `$purple` variables duplicate (but don't exactly match) the tokens in `mt-tokens.scss`
- **Fix:** Add `@import 'mt-tokens';` and replace local variables with `$font-mono`, etc.

### BUG-03: Orphan CSS Files Never Loaded
- **Severity:** LOW
- **Files:** `src/assets/button.css`, `src/assets/stiles.css`, `src/assets/tableView.css`, `src/assets/listView.css`, `src/App.css`
- **Impact:** No runtime impact — they are dead weight

### BUG-04: `card.scss` Has Zero Imports
- **Severity:** LOW
- **File:** `src/components/card.scss`
- **Impact:** Dead file — no component references it

### BUG-05: Local Test Values Left in `index.tsx`
- **Severity:** INFO (user aware)
- **Details:** `socketPort=49370`, `botJobId=76`, etc. are hardcoded local-test defaults. Must be zeroed before production build.
- **Current values in file:** Local test mode (non-zero defaults)

### BUG-06: Duplicate `testStore` Import in `App.tsx`
- **Severity:** LOW
- **File:** `src/components/MultiTest/App.tsx`
- **Details:** `testStore` is imported twice — once from `utils` (line 2 via destructuring) and once standalone (line 11: `import { testStore } from "./utils"`). The second import is redundant.

### BUG-07: `productsConfig.js` is Plain JS in a TypeScript Project
- **Severity:** LOW
- **File:** `src/components/productsConfig.js`
- **Details:** Only used by `src/pages/Card.tsx` (legacy). Should be `.ts` for type safety, but since the whole pages directory is legacy, this is low priority.

---

## 5. What Must Remain in Root

| File/Folder | Reason |
|------------|--------|
| `package.json` | NPM manifest — required |
| `package-lock.json` | Dependency lock — required |
| `tsconfig.json` | TypeScript config — required |
| `webpack.config.js` | Production build config (obfuscation) — required |
| `index.html` | Possible Webpack entry HTML template — verify if `public/index.html` supersedes it |
| `obfuscator-config.json` | Referenced by webpack obfuscation — required |
| `public/` | CRA public assets, locales, favicons — required |
| `src/` | All source code — required |
| `build/` | Production output — required (or regenerated) |
| `.gitignore` | Git config — required |
| `.gitattributes` | Git config — required |
| `CNAME` | GitHub Pages domain (`shifthunter.com`) — required if using GH Pages |

---

## 6. What Can Move to `_legacy`

### Root-Level Files

| File | Why Safe to Move |
|------|-----------------|
| `OpenAI.js` | Standalone experiment — not imported by any src file |
| `babel.min.js` | Bundled Babel — not used by CRA build |
| `client.js` | Standalone socket client experiment |
| `client.py` | Python socket client experiment |
| `server.js` | Standalone Node server — not part of React app |
| `server.py` | Python server experiment |
| `proxyServer.js` | Proxy experiment — not part of build |
| `https_server_2.js` | HTTPS server experiment |
| `https_server_csp.3.js` | CSP server experiment |
| `socket_server.js` | WebSocket server experiment |
| `socket_client_2.js` | Socket client experiment |
| `socket_client_ws.js` | Socket client experiment |
| `socket_client_ws.py` | Python socket client |
| `socket_client_wss.js` | WSS client experiment |
| `socket_client_wss.py` | Python WSS client |
| `socket_http_client_2.js` | Socket HTTP client experiment |
| `socket_test.py` | Python socket test |
| `react.development.js` | React dev bundle — CRA bundles its own |
| `react-dom.development.js` | ReactDOM dev bundle — CRA bundles its own |
| `WSS-Socket-Test.html` | Standalone HTML test page |
| `WSS-Socket-Test-2.html` | Standalone HTML test page |
| `README-MINIFIED.md` | Outdated/redundant readme |
| `README CAPI.md` | Informational — can archive |

### Source Files

| File | Refs | Why Safe |
|------|------|----------|
| `src/components/BlockInstructionsDnd.tsx` | 0 | Dead code — never imported |
| `src/components/BlockList.tsx` | 0 | Dead code |
| `src/components/BrowserConsole.tsx` | 0 | Dead code |
| `src/components/ErrorTest.tsx` | 0 | Dead code |
| `src/components/GridDrag2.tsx` | 0 | Dead code |
| `src/components/MyComponent.tsx` | 0 | Dead code |
| `src/components/NavigableBKP.tsx` | 0 | Backup of Navigable — dead code |
| `src/components/StompMessage.tsx` | 0 | Dead code |
| `src/components/StompSocketComponent.tsx` | 0 | Dead code |
| `src/components/ToggleActive.tsx` | 0 | Dead code |
| `src/components/instructionsMockData4.tsx` | 0 | Dead mock data |
| `src/components/instructionsMockData5.tsx` | 0 | Dead mock data |
| `src/components/mycomponent.scss` | 1 | Only used by MyComponent (dead) |
| `src/components/card.scss` | 0 | Never imported |
| `src/components/WebSocketComponentClient2.jsx` | 0 | Legacy JSX — dead code |
| `src/pages/InputPage.tsx` | 0 | Dead page |
| `src/pages/Menu.tsx` | 0 | Dead page |
| `src/pages/PageOne.tsx` | 0 | Dead page |
| `src/pages/pageone.scss` | 1 | Only used by PageOne (dead) |
| `src/App.tsx` | 0 | Legacy App — superseded by MultiTest AppShell |
| `src/App.css` | 0 | Never imported (content duplicated in clothing_type.scss) |
| `src/App.test.tsx` | 0 | Tests legacy App component |
| `src/logo.svg` | 0 | CRA default — unused |
| `src/assets/button.css` | 0 | Dead CSS |
| `src/assets/stiles.css` | 0 | Dead CSS |
| `src/assets/tableView.css` | 0 | Dead CSS |
| `src/assets/listView.css` | 0 | Dead CSS |

### Folders

| Folder | Why Safe |
|--------|----------|
| `scripts/` | Browser automation scripts — not part of React build. Contains `.js` scripts for hover-pick, search, injection, iframe, etc. These are Chrome DevTools injection scripts, not build dependencies. |
| `XPC10 Tests/` | Test JSON/XML data — not imported by any source file |
| `src/pages/` | **Entire directory** — none of the pages are imported from `index.tsx` or any active component. The `Home → ClothingType → FilterComponent → MatIcon` chain is self-contained and unreachable from the app entry point. **CAUTION:** verify with backend team that no Java-side routing points to these pages. |

### Files That MUST NOT Move (Backend Integration)

| File | Why It Must Stay |
|------|-----------------|
| `src/index.tsx` | Entry point — `receiveDataFromJava()` is the Java bridge |
| `src/components/GridItem.tsx` | Rendered for `botJobTasks` sessionId |
| `src/components/GridItemComp.tsx` | Rendered for `componentTasks` sessionId |
| `src/components/GridItemScann.tsx` | Rendered for `scannerGrid` sessionId |
| `src/components/GridItemScannMobile.tsx` | Rendered for `mobileScannerGrid` sessionId |
| `src/components/ApiTestToolAI.tsx` | Rendered for `apiTestToolAI` sessionId |
| `src/components/ApiTestToolAINew.tsx` | Rendered for `capiApiTestToolAI` sessionId |
| `src/components/AlertModal.tsx` | Used by index.tsx error display |
| `src/components/instructionsMockData.tsx` | Provides types + mock data for index.tsx |
| `src/components/instructionsMockData2.tsx` | Referenced by instructionsMockData |
| `src/components/instructionsMockData3.tsx` | Referenced by instructionsMockData |
| All `src/components/MultiTest/*` | Active Capi module |

---

## 7. Risk Notes

1. **`src/pages/` removal risk:** If the Java backend routes to any of these pages via a different HTML file or iframe, removing them would break that flow. The `.bat` script isolates them but does not delete.

2. **`scripts/` folder:** These are Chrome DevTools injection scripts used by the automation bot. They are NOT part of the React build but may be deployed alongside the app for the Java desktop client to inject. **Do not delete** — move to `_legacy` only if confirmed unused by bot runtime.

3. **`index.html` at root vs `public/index.html`:** The root `index.html` is used by `webpack.config.js` indirectly (HtmlWebpackPlugin references `./public/index.html`). The root `index.html` appears to be a standalone dev test page. Safe to move to `_legacy`.

4. **`build/` folder:** Contains compiled output. Should be in `.gitignore` and regenerated. Currently checked in.

---

## 8. SCSS / Module / Global Relationship Analysis

### Architecture

```
mt-tokens.scss          ← Design system: fonts, colors, radii, transitions, CSS custom props
    ↑ @import
    ├── mt-app.scss      ← App root, header, badges, tabs
    ├── mt-shell.scss    ← AppShell bar, theme toggle, language picker
    ├── mt-atoms.scss    ← Shared atoms: MethodBadge, StatusBadge, JsonBlock
    ├── mt-upload.scss   ← FileUploadPanel
    ├── mt-wizard.scss   ← BizWizard modal
    ├── mt-ai.scss       ← AIAssistantTab
    ├── mt-library.scss  ← TestLibraryTab
    ├── mt-store.scss    ← StoreTab
    ├── mt-debug.scss    ← DebugTab
    └── (MISSING) mt-readytest.scss ← ReadyForTestTab (defines own tokens!)

Legacy (no token system):
    ├── griditem.scss       ← GridItem, GridDrag2, GridItemComp, GridItemScann, GridItemScannMobile
    ├── navigable.scss      ← Navigable, NavigableBKP
    ├── attribute-dropdown.scss ← AttributeDropdown, NameDropdown
    ├── alert-modal.scss    ← AlertModal
    ├── mycomponent.scss    ← MyComponent (dead)
    ├── card.scss           ← (dead — 0 imports)
    └── clothing_type.scss  ← ClothingType (dead page, contains App.css copy)
```

### Key Observations
- All MultiTest SCSS files use **global side-effect imports** (`import "./file.scss"`)
- No `.module.scss` convention exists anywhere in the project
- `mt-tokens.scss` defines CSS custom properties on `[data-mt-theme="light"]` and `[data-mt-theme="dark"]`
- `ReadyForTestTab` uses `var(--cs-*)` custom properties (which work globally) but misses SCSS variables from tokens

---

## 9. Roadmap

### Phase 1: Safe Rename Validation (Immediate)
- [ ] Decide on `.module.scss` vs `.scss` (see Section 2 alternatives)
- [ ] If keeping `.module.scss`: wrap all rules in `:global { }` OR refactor 26+ classNames
- [ ] If switching to `.scss`: rename file, update import
- [ ] Remove old `mt-readytest.scss` after confirming new file works
- [ ] Verify ReadyForTestTab renders correctly in browser

### Phase 2: Reference Repair (1-2 hours)
- [ ] Add `@import 'mt-tokens';` to `ReadyForTestTab.module.scss`
- [ ] Replace local `$mono` with `$font-mono`, `$teal`/`$amber`/etc. with token equivalents
- [ ] Remove duplicate `testStore` import in `App.tsx`
- [ ] Fix misleading JSDoc comment in `ApiTestToolAINew.tsx`
- [ ] Remove self-referencing `file:` deps from `package.json`

### Phase 3: SCSS / Global Style Audit (2-3 hours)
- [ ] Verify all `var(--cs-*)` custom properties have matching definitions in `mt-tokens.scss`
- [ ] Check for class name collisions between legacy components and MultiTest
- [ ] Audit `griditem.scss` — used by 4+ components — ensure no side-effect conflicts
- [ ] Remove dead `clothing_type.scss` → `App.css` content duplication

### Phase 4: Unused File Detection (1 hour)
- [ ] Run the `_legacy` migration `.bat` script (see Section below)
- [ ] Verify no build errors after migration
- [ ] Check that `npm run build` succeeds

### Phase 5: Legacy Migration (1-2 hours)
- [ ] Execute `.bat` script to move files to `_legacy/`
- [ ] Verify `npm start` works
- [ ] Verify `npm run build` works
- [ ] Verify all sessionId-based views still render

### Phase 6: Test Organisation (1 hour)
- [ ] Create `tests_run/` folder
- [ ] Move `XPC10 Tests/` data into `tests_run/test-data/`
- [ ] Move standalone HTML test pages into `tests_run/manual/`
- [ ] Move `socket_test.py` into `tests_run/scripts/`

### Phase 7: Final Regression Validation (2-3 hours)
- [ ] Test each sessionId view: `botJobTasks`, `componentTasks`, `scannerGrid`, `mobileScannerGrid`, `apiTestToolAI`, `capiApiTestToolAI`
- [ ] Test all 8 MultiTest tabs
- [ ] Test light/dark theme toggle
- [ ] Test all 5 language locales

### Phase 8: Backend Compatibility Verification (Coordination Required)
- [ ] Confirm with Java team that `receiveDataFromJava()` contract is unchanged
- [ ] Confirm no Java-side routing depends on `src/pages/` components
- [ ] Confirm `scripts/` folder deployment status
- [ ] Verify production build + obfuscation still works

---

## 10. `tests_run` Folder Proposal

```
tests_run/
├── test-data/                    ← from XPC10 Tests/
│   ├── tests_banco_1.json
│   ├── tests_banco_2.json
│   ├── tests_banco_3.json
│   ├── tests_banco_4.json
│   ├── tests_banco_5.json
│   ├── tests_banco_6.json
│   ├── Test.json
│   └── Test.xml
├── manual/                       ← standalone HTML test pages
│   ├── WSS-Socket-Test.html
│   └── WSS-Socket-Test-2.html
├── scripts/                      ← test utility scripts
│   └── socket_test.py
└── README.md                     ← describes test structure
```

---

## 11. Recommended Fixes Summary

### Safe (apply now)
- Remove duplicate `testStore` import in `App.tsx` line 11
- Remove self-referencing `file:` dependencies from `package.json`
- Delete old `mt-readytest.scss` after rename is validated
- Add `@import 'mt-tokens';` to renamed SCSS file

### Recommended (low risk)
- Wrap `.module.scss` rules in `:global { }` to prevent class name scoping
- Migrate local color/font variables in ReadyForTestTab to use `mt-tokens` SCSS variables
- Move all files listed in Section 6 "What Can Move" to `_legacy/`

### Risky (needs manual review)
- Refactoring `className="rft-*"` to CSS Module syntax (26+ changes)
- Removing `src/pages/` directory (need backend team confirmation)
- Removing `scripts/` directory (need bot runtime confirmation)
- Changing `index.tsx` default state values (local vs production toggle)
