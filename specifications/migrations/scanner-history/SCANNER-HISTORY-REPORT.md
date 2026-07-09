# Page Scanner History Report — from ACCETTA build (cffad3ac) to branch tip

**Purpose:** trace every change to the core Page Scanner
(`src/main/java/com/allinweb/ch/facade/PlaywrightElementScanner.java`) that can make the
AR Web Factory Page Scanner return DIFFERENT web elements than the build that produced
`elementDTO-PS-ACCETTA.json`.

- **Anchor (known good):** `cffad3ac` — 2026-07-05 17:57 — "fix(playwright): open browser maximized / full-window"
- **Branch tip analyzed:** `refactor/perform-actions-decomposition` @ `c3a6a69a` (2026-07-09)
- **Scanner file growth:** 10.6 KB (ACCETTA) → 36.2 KB (tip) — the scanner tripled.
- **Snapshots for WinMerge:** in this folder, one full file per commit, named
  `SCANNER-<hash>-<commit timestamp>.java`. Compare CONSECUTIVE files to see exactly what
  each commit changed.

## Snapshot files (chronological — WinMerge each against the previous)

| # | File | Commit | Date | Author terminal |
|---|------|--------|------|-----------------|
| 0 | `SCANNER-cffad3ac-2026-07-05_17-57-52-BASE-ACCETTA.java` | cffad3ac | 07-05 17:57 | (anchor) |
| 1 | `SCANNER-5852a908-2026-07-07_16-06-13.java` | 5852a908 | 07-07 16:06 | backend terminal |
| 2 | `SCANNER-04627037-2026-07-07_16-32-06.java` | 04627037 | 07-07 16:32 | backend terminal |
| 3 | `SCANNER-6fee0c8a-2026-07-07_17-18-43.java` | 6fee0c8a | 07-07 17:18 | backend terminal |
| 4 | `SCANNER-f874fc18-2026-07-08_00-39-47.java` | f874fc18 | 07-08 00:39 | backend terminal |
| 5 | `SCANNER-a4cd2e02-2026-07-08_07-45-34.java` | a4cd2e02 | 07-08 07:45 | backend terminal |
| 6 | `SCANNER-e8980ef1-2026-07-08_12-28-03.java` | e8980ef1 | 07-08 12:28 | backend terminal |
| 7 | `SCANNER-53691e5c-2026-07-09_05-02-27.java` | 53691e5c | 07-09 05:02 | this terminal |
| 8 | `SCANNER-f6d494ad-2026-07-09_07-57-21.java` | f6d494ad | 07-09 07:57 | this terminal |

Reference dumps: `elementDTO-PS-GOOD.json` (07-08 11:51) was produced by the code of
snapshot **#5 (a4cd2e02)** — inputs-focus scan, 12 elements, all correct.
`elementDTO-PS-ACCETTA.json` was produced by snapshot **#0**.

## What the BASE (ACCETTA) scanner did — the behavior to compare against

- `DEFAULT_SELECTOR` was simply: `input, textarea, button, a, select, option, label, span, div`
- `classifyTag(tagName)` used ONLY the tag name — no attribute/role logic.
- One DTO per matched element; `someText(el, attrs)` taken as found on the page
  (no cleaning, no humanizing, no noise filtering).
- Visibility filter: plain `isVisibleEnough` (rect > 0, not display:none/visibility:hidden).
- No per-`<select>` option expansion, no forceKeep, no control.kind attributes.

## Per-commit changes that alter scan OUTPUT

### 1. `5852a908` — 07-07 16:06 — "scan custom select options with playwright"
- `DEFAULT_SELECTOR` massively expanded: adds `[contenteditable]`, many `[role=...]`
  selectors, `[aria-haspopup]`, `[aria-selected]`, all `data-testid`-style attributes,
  all `mat-*` components, svg… ⇒ **many MORE elements matched** than ACCETTA.
- New `makeDto(el, idx, override)` with `forceKeep`: hidden native `<select>` with
  non-empty options is now kept even when invisible ⇒ elements ACCETTA skipped now appear.
- Per-option expansion: every `<select>` additionally emits one clickable DTO per
  `<option>` (with `trigger-selector`, `select-xpath`, `option-value` attributes).
- `someText` can be overridden per generated DTO.

### 2. `04627037` — 07-07 16:32 — "add scanner focus profiles"
- New JS `inputType/controlKind/typeElementFor` chain: `typeElement` is now COMPUTED
  (input/button/…) from tag+type+role+kind instead of raw tag.
- `classifyTag(tagName)` → `classifyTag(tagName, scannedTypeElement, attributeData)`
  with `isInputType/isButtonType/isClickableKind` ⇒ **classification decisions moved
  from pure tag to attribute/role heuristics.**
- `buildSelector` + `addCompanionSelectors`: search term "input" now ALSO matches
  textarea and `[role='textbox']`, etc. ⇒ focus scans return more than the literal term.
- `control.kind` / `control.role` attributes appended to every DTO's attributeData.

### 3. `6fee0c8a` — 07-07 17:18 — "force select options as clickable scanner rows"
- Option DTOs are `forceKeep: true` (emitted even when the select/options are hidden).
- Adds `isOutputType` to classifyTag ⇒ output classification from scanned typeElement.

### 4. `f874fc18` — 07-08 00:39 — "preserve scanner input controls"
- New `cleanText` / `humanizeToken` in JS: `someText` is now trimmed, whitespace-collapsed,
  trailing `：:*?!` stripped, camelCase/underscores humanized, capped at 200 chars
  ⇒ **element NAMES differ from ACCETTA** (this affects xPath-independent matching).
- classifyTag hard rule at the time: `input|textarea` tag ⇒ always "input"
  (the rule the radio test was written against).

### 5. `a4cd2e02` — 07-08 07:45 — "ignore generic scanner labels"  ← produced elementDTO-PS-GOOD.json
- New `usefulText` / `semanticAttributeText` / `semanticToken` noise filters: generic
  labels ("checkbox label", "radio label", "label", noise words id/btn/field/…) are
  DISCARDED and someText falls back to semantic attributes (data-testid, name, id,
  className tokens) ⇒ **someText rewritten again; some elements get '' and fall back
  to attribute-derived names.**

### 6. `e8980ef1` — 07-08 12:28 — "preserve scanner input locator metadata"  ← FIRST change AFTER GOOD
- New `normalizeActionGrouping`: every DTO whose typeElement classifies as input gets
  its **tagName REWRITTEN to "input"** (original tag moved to attributeData original-tag)
  ⇒ changes grid grouping AND the xPath|tagName dedup key ⇒ **different element sets/ids.**
- classifyTag: the `input|textarea ⇒ input` hard rule replaced by `isWritableControl`
  (kind/role/type-based; excludes button/submit/reset/file/checkbox/radio/hidden)
  ⇒ **radio/checkbox inputs flipped from input to button** (broke the committed radio test).

### 7. `53691e5c` — 07-09 05:02 — (this terminal) "normalize select DTOs"
- Base `<select>` DTO emitted with `tagName:'button', typeElement:'button'`
  (+ original-tag/select-xpath in attributeData) instead of raw `select`
  ⇒ selects appear in the Button bucket; dedup key changes for selects.

### 8. `f6d494ad` — 07-09 07:57 — (this terminal) "radio inputs classify as input again"
- Removes "radio" from `isWritableControl`'s exclusion list ⇒ radios classify input
  again (as the committed test demands). Checkbox/submit/etc. unchanged from #6.

## Where the differences most likely come from (ranked)

1. **#1 + #2 (5852a908 / 04627037)** — the selector explosion + computed typeElement are
   the biggest divergence from ACCETTA: far more elements, different classifications.
2. **#6 (e8980ef1)** — tagName rewriting + isWritableControl changed grouping, dedup
   keys and input/button decisions AFTER the GOOD snapshot.
3. **#4 + #5 (f874fc18 / a4cd2e02)** — someText cleaning/noise-filtering renames
   elements (matters if you compare by name, and for OCR/definedName correlation).
4. **#7 (53691e5c)** — select rows re-tagged as button.
5. **#8 (f6d494ad)** — radio classification only.

Note on "lost cookie buttons": no commit filters them out — OneTrust ids still match
`button` in every version. Missing cookie elements in a scan are page STATE (the banner
only exists until consent is stored in the browser profile; close the pre-scan/shared
browser to get a fresh banner) — but verify with WinMerge #0 vs #8 `isVisibleEnough`
usage if in doubt.

## Not in the scanner file but also affecting results (same range)

- Pre-scan only (does NOT affect AR Web Factory): default search profile + actionable
  filter (37f4c3b7), page-settle wait (e48166ad), OCR resolution (b8c1a797).
- The FE grids group by decided category since 68ca6d5 (both scanner + dashboard).

## How to compare in WinMerge

1. Open two consecutive snapshots (e.g. #5 GOOD vs #6) — every behavioral line above is
   visible as a hunk.
2. To find "ACCETTA vs today", compare #0 vs #8 — expect ~3x file size difference.
3. The scan RESULTS comparison lives next to the dumps:
   `<path_db>/page_diagnostics/elementDTO-PS-compare-report.txt`
   (generated by `mvn test -Dtest=PreScanDumpComparisonTest`).
