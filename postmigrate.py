#!/usr/bin/env python3
"""
Post-migration fixes for CSS Modules conversion.
Run from project root:  python postmigrate.py

Applies three fixes:
  Step 2 — Rewrites `${executionState?.toLowerCase()}` to use styles[...]
  Step 3 — Fixes .instructionLine / .instructionItem / .keepCheckbox in
           GridItemScann.module.scss for correct grid alignment.
  Step 4 — Tags the attribute slot <div>/<span> with className={styles.attrSlot}
           in GridItemScann.tsx.

Safe to re-run: every edit is idempotent (checks for marker text before applying).
"""
import re
from pathlib import Path
import sys

# Force UTF-8 everywhere (same as migrate.py)
import pathlib
_orig_read = pathlib.Path.read_text
_orig_write = pathlib.Path.write_text
pathlib.Path.read_text = lambda self, **kw: _orig_read(self, encoding=kw.pop("encoding", "utf-8"), **kw)
pathlib.Path.write_text = lambda self, data, **kw: _orig_write(self, data, encoding=kw.pop("encoding", "utf-8"), **kw)

COMPONENTS = Path("src/components")
TSX_FILES = [
    COMPONENTS / "GridItemScann.tsx",
    COMPONENTS / "GridItem.tsx",
    COMPONENTS / "GridItemComp.tsx",
    COMPONENTS / "GridDrag2.tsx",
    COMPONENTS / "GridItemScannMobile.tsx",
]


def step2_fix_execution_state() -> int:
    """Replace bare `${executionState?.toLowerCase()}` with a styles[...] lookup."""
    count = 0
    # Matches the bare dynamic interpolation. We detect it hasn't been fixed
    # already by checking that it isn't wrapped in styles[...].
    pat = re.compile(
        r"\$\{executionState\?\.toLowerCase\(\)\}"
    )
    replacement = (
        "${(styles as Record<string,string>)"
        "[executionState?.toLowerCase() ?? ''] ?? ''}"
    )
    for path in TSX_FILES:
        if not path.exists():
            continue
        text = path.read_text()
        new_text, n = pat.subn(replacement, text)
        if n:
            path.write_text(new_text)
            count += n
            print(f"  Step 2: {path.name} - fixed {n} executionState interpolation(s)")
    if count == 0:
        print("  Step 2: no executionState patterns found (already fixed or absent)")
    return count


def step3_alignment_scss() -> bool:
    """Re-apply grid alignment fixes to GridItemScann.module.scss."""
    path = COMPONENTS / "GridItemScann.module.scss"
    if not path.exists():
        print(f"  Step 3: SKIP - {path} not found")
        return False

    text = path.read_text()
    original = text
    changes: list[str] = []

    # ---- 3a: .instructionLine block ----
    new_instruction_line = """.instructionLine {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}"""
    # Idempotent: only replace if we don't already see our marker.
    if "text-overflow: ellipsis" not in text or ".instructionLine" not in text:
        pass  # nothing to check — go rewrite
    # Replace any existing .instructionLine { ... } block.
    pat_line = re.compile(r"\.instructionLine\s*\{[^}]*\}", re.S)
    m = pat_line.search(text)
    if m:
        if "text-overflow: ellipsis" in m.group(0):
            print("  Step 3a: .instructionLine already updated")
        else:
            text = text[:m.start()] + new_instruction_line + text[m.end():]
            changes.append("3a: replaced .instructionLine block")
    else:
        print("  Step 3a: WARNING - .instructionLine block not found")

    # ---- 3b: grid-column rules inside .instructionItem ----
    grid_rules = """
  > .instructionLine,
  > .editContainer {
    grid-column: 2;
    justify-self: start;
    padding-left: 6px;
    min-width: 0;
  }

  > .optionsColumn {
    grid-column: 5;
  }

  > .attrSlot {
    grid-column: 3;
    justify-self: start;
  }
"""
    if "> .optionsColumn" in text and "grid-column: 5" in text:
        print("  Step 3b: grid-column rules already present")
    else:
        # Insert after 'z-index: 1;' that sits inside .instructionItem { ... }
        # To be safe we only match the FIRST z-index: 1; following .instructionItem {
        pat_item = re.compile(
            r"(\.instructionItem\s*\{[^}]*?z-index:\s*1;\s*\n)",
            re.S,
        )
        m2 = pat_item.search(text)
        if m2:
            insert_at = m2.end()
            text = text[:insert_at] + grid_rules + text[insert_at:]
            changes.append("3b: inserted grid-column rules into .instructionItem")
        else:
            print("  Step 3b: WARNING - could not find '.instructionItem { ... z-index: 1;' anchor")

    # ---- 3c: .keepCheckbox margin:0 + grid-column:1 ----
    pat_keep = re.compile(r"\.keepCheckbox\s*\{([^}]*)\}", re.S)
    m3 = pat_keep.search(text)
    if m3:
        body = m3.group(1)
        new_body = body
        added_here: list[str] = []
        if "margin:" not in body:
            new_body = new_body.rstrip() + "\n  margin: 0;\n"
            added_here.append("margin: 0")
        if "grid-column:" not in body:
            new_body = "\n  grid-column: 1;" + new_body
            added_here.append("grid-column: 1")
        if added_here:
            new_rule = f".keepCheckbox {{{new_body}}}"
            text = text[:m3.start()] + new_rule + text[m3.end():]
            changes.append(f"3c: added {', '.join(added_here)} to .keepCheckbox")
        else:
            print("  Step 3c: .keepCheckbox already updated")
    else:
        print("  Step 3c: WARNING - .keepCheckbox block not found")

    if text != original:
        path.write_text(text)
        for c in changes:
            print(f"  Step 3: {c}")
        return True
    print("  Step 3: no changes needed")
    return False


def step4_tag_attr_slot() -> bool:
    """Add className={styles.attrSlot} to the showAttributes ternary branches
    in GridItemScann.tsx."""
    path = COMPONENTS / "GridItemScann.tsx"
    if not path.exists():
        print(f"  Step 4: SKIP - {path} not found")
        return False

    text = path.read_text()
    original = text

    # Pattern A: <div> before <AttributeDropdown>
    #   {showAttributes ? (
    #     <div>
    #       <AttributeDropdown ...
    # becomes:
    #     <div className={styles.attrSlot}>
    pat_div = re.compile(
        r"(\{\s*showAttributes\s*\?\s*\(\s*\n\s*<div)(\s*>\s*\n\s*<AttributeDropdown)",
        re.M,
    )
    text, n_div = pat_div.subn(r"\1 className={styles.attrSlot}\2", text)

    # Pattern B: <span>{"\u00A0".repeat(20)}</span> as the else branch
    # We target that specific span (nbsp spacer). Idempotent: skip if already has className.
    pat_span = re.compile(
        r"<span>(\{\"\\u00A0\"\.repeat\(20\)\}</span>)"
    )
    text, n_span = pat_span.subn(r'<span className={styles.attrSlot}>\1', text)

    if text != original:
        path.write_text(text)
        print(f"  Step 4: tagged {n_div} <div> and {n_span} <span> with className={{styles.attrSlot}}")
        return True
    print("  Step 4: attrSlot already applied or pattern not found")
    return False


def main() -> int:
    if not COMPONENTS.exists():
        print(f"ERROR: {COMPONENTS} not found. Run from project root.")
        return 1

    print("\n=== Step 2: fix executionState dynamic color class ===")
    step2_fix_execution_state()

    print("\n=== Step 3: re-apply GridItemScann alignment fix ===")
    step3_alignment_scss()

    print("\n=== Step 4: tag attribute slot with className={styles.attrSlot} ===")
    step4_tag_attr_slot()

    print("\nDone. Next: run 'sanity_check.bat' then 'npm run build'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())