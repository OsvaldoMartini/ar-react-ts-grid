# ROAD MAPP HEURISTICS

## Fixed Page Scanner Heuristics

- Native `input` and `textarea` are preserved as `typeElement=input`; scanner metadata like `radio-option` or `checkbox-option` no longer turns them into buttons during classification.
- Focus search for `input` also includes `textarea`, `[role='textbox']`, and `[contenteditable='true']`.
- The FOCUS dropdown includes a dedicated `Native - Textarea` option.
- `textarea` elements now use the same input/test behavior as normal input fields in `GridItemScann`.
- Nearby human labels are used before HTML fallback names:
  - `aria-labelledby`
  - `label[for=id]`
  - wrapping `label`
  - previous sibling `label`
  - parent `.form-field` / `[id]` container labels
  - parent/container id as a final humanized fallback
- Generic component-library text such as `checkbox label`, `radio label`, `input label`, and plain `label` is treated as noise.
- When generic label text is ignored, scanner falls back to semantic attributes:
  - `data-testid`
  - `data-test-id`
  - `test-id`
  - `data-cy`
  - `data-qa`
  - `aria-controls`
  - `name`
  - `id`
  - useful CSS class tokens, with noise like `handler`, `control`, `checkbox`, `radio`, and `label` removed.

## Extension Roadmap

- Add user-editable scanner profiles so clients can add selectors without Java changes.
- Add per-client label-noise dictionaries for terms like `checkbox label` or framework placeholder labels.
- Add per-client semantic-token cleanup rules, for example removing suffixes like `handler`, `wrapper`, `container`, or generated ids.
- Save scanner profile/rule overrides in the project config or database and apply them before each Page Scanner run.
- Add a scanner re-run button that applies the latest heuristics and rewrites `page_diagnostics/elementDTO-PS.json`.
- Add a diagnostics report showing why each `someText` and `definedName` was chosen: source, score, rejected fallback, and final value.
- Keep Playwright scanner routines as the source of truth for modern web controls, then let clients extend:
  - selectors
  - label lookup depth
  - ignored text patterns
  - semantic attribute priority
  - visible/hidden element policy
