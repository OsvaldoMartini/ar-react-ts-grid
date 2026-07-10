# Avaloq card components — "BUG Not Clik" investigation (Task 3)

Source: `D:\Projects\ARWeb-Martini\BUG Not CLik\Component.html` (portfolio selection card)
and `Component-customized.html` (recent trade card). Investigation only — no code changed.

## What these components are

Avaloq web-banking Angular components (`avq-*` custom elements wrapping Angular Material
MDC). Everything interesting carries a **`test-id` attribute** — unique, stable, semantic:
`web-banking-trading.portfolio-selection-form.portfolio-card.24143977002` (contains the
portfolio number!), `...recent-trade-card.asset-name`, `...instrument-link-button`.

## Why the click fails ("Not Clik") — root cause hypothesis

The real selection control is `<input type="radio" class="mdc-radio__native-control">`.
In Material MDC the native radio is an invisible overlay; the click that actually works
lands on the wrapping `mat-radio-button` / the card itself (`avq-card` is a
state-layer host — the WHOLE CARD is the click target, with ripple + touch-target divs
layered above the input). A bot click aimed at the native input gets intercepted by
`.mat-mdc-radio-touch-target` / ripple layers, or lands on a 0-opacity control.

Also: both `<label for="mat-radio-...-input">` elements are EMPTY (visually-hidden), so
label-based naming finds nothing — but the input's `aria-label` carries the full name
("Lavecchia Luigi / 22989558.1001 Risparmio e investimento") and our someText priority
already prefers aria-label. Naming is fine; clicking is the problem.

## What the scanner misses today

The default scan profile (ALL_INTERACTIVE) matches: the native radio input,
`mat-radio-button`, `mat-icon`, the real `<button>` (asset link). It does NOT include
`[test-id]` / `[data-testid]` selectors, so it misses:

- `avq-portfolio-card[test-id=...24143977002]` — the ACTUAL clickable card
- `avq-card-title[test-id=...portfolio-name]` — the display name
- The read-only value spans: ISIN / TKN / TKS / Numero nazionale / Valuta, each with
  `span[test-id=...asset-key]` — perfect OUTPUTS (bot can read values)
- `avq-currency` (CHF 26'141.26) and the performance div[test-id]

Note the scanner's testId detection (`attr('test-id')` etc.) and the kitchen-sink
DEFAULT_SELECTOR already know `[test-id]` — only the default PROFILE terms lack it.

## Recommendations (awaiting approval before any code change)

1. **Profile coverage**: add `[test-id]`, `[data-testid]`, `[data-test-id]`, `[data-cy]`,
   `[data-qa]` to the ALL_INTERACTIVE scan profile. On Avaloq pages the test-ids are the
   strongest locators available, and today profile scans skip every avq-* element.
2. **Classification for test-id carriers**: a span/div/custom element carrying a test-id
   with no clickable kind should classify as OUTPUT (readable value: ISIN, TKN, currency);
   card hosts with select-control children (mat-radio-button inside) classify as BUTTON
   (clickable card).
3. **Click-target correction (the actual bug fix)**: when the click target is an
   `input.mdc-radio__native-control` (or any input whose click is intercepted), the
   executor should retry on the effective target — ancestor `mat-radio-button`, the
   `avq-card` state-layer host, or the element's touch target — before falling back to
   coordinates. Alternatively Playwright `click(force)` on the input, but clicking the
   card matches what a human does.
4. Generated-id synergy: these cards have no DOM ids but rich test-ids — the new
   generated-id feature plus recommendation 1 gives every card row a strong search id.

## Implementation status (2026-07-10, ar-web-selenium 452da0c3)

- Rec 1 (selector coverage): ALREADY IN PLACE — addCompanionSelectors injects
  [test-id]/[data-testid]/[data-test-id]/[data-cy]/[data-qa] into every scan.
- Rec 2 (classification): DONE — test-id carriers classify button (card hosts wrapping a
  selection control / inside button-link) or output (value spans); Java safety net.
- Rec 3 (click target): DONE — executor retries the nearest effective ancestor
  (mat-radio-button / mat-checkbox / mat-slide-toggle / avq-state-layer-host) between
  force-click and JS dispatch.
- Rec 4 (generated-id synergy): DONE earlier (432830b9).
