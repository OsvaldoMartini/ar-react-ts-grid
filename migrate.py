#!/usr/bin/env python3
"""
Convert kebab-case CSS Module classes to camelCase and rewrite TSX
className usages to styles.xxx.

Run from project root:  python migrate.py
"""
import re
from pathlib import Path

# Force UTF-8 for all Path.read_text() / write_text() calls in this script.
# Windows defaults to cp1252 which chokes on curly quotes, em-dashes, nbsp,
# and other non-ASCII bytes commonly found in SCSS comments.
import pathlib
_orig_read = pathlib.Path.read_text
_orig_write = pathlib.Path.write_text
pathlib.Path.read_text = lambda self, **kw: _orig_read(self, encoding=kw.pop("encoding", "utf-8"), **kw)
pathlib.Path.write_text = lambda self, data, **kw: _orig_write(self, data, encoding=kw.pop("encoding", "utf-8"), **kw)

# tsx filename -> scss module filename (both in src/components/)
PAIRS = {
    "GridItemScann.tsx":       "GridItemScann.module.scss",
    "GridItem.tsx":            "Griditem.module.scss",
    "GridItemComp.tsx":        "Griditem.module.scss",
    "GridDrag2.tsx":           "Griditem.module.scss",
    "GridItemScannMobile.tsx": "Griditem.module.scss",
}

COMPONENTS_DIR = Path("src/components")
CLASS_RE = re.compile(r"\.([A-Za-z_][A-Za-z0-9_-]*)")


def to_camel(kebab: str) -> str:
    parts = kebab.split("-")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])


def extract_classes_from_scss(scss_path: Path) -> set:
    """Extract every .foo selector. Strip strings per-line so apostrophes
    inside // comments (e.g. header's) don't gobble half the file."""
    text = scss_path.read_text()
    cleaned = []
    for line in text.split("\n"):
        line = re.sub(r"\"[^\"\n]*\"", "\"\"", line)
        line = re.sub(r"'[^'\n]*'", "''", line)
        cleaned.append(line)
    text = "\n".join(cleaned)
    raw = set(CLASS_RE.findall(text))
    return {c for c in raw if c not in {"scss", "tsx", "module", "w3"}}


def rewrite_scss(scss_path: Path, class_map: dict) -> None:
    text = scss_path.read_text()
    # Sort longest first so "block-header-left" is replaced before "block-header"
    for kebab in sorted(class_map, key=len, reverse=True):
        camel = class_map[kebab]
        if kebab == camel:
            continue
        # No lookbehind: compound selectors like .foo.bar must work
        pat = re.compile(r"\." + re.escape(kebab) + r"(?![\w-])")
        text = pat.sub(f".{camel}", text)
    scss_path.write_text(text)


CLASSNAME_STR_RE = re.compile(r"className\s*=\s*([\"'])([^\"'{}]*?)\1")
CLASSNAME_TPL_RE = re.compile(r"className\s*=\s*\{\s*`([^`]*)`\s*\}")


def tokenize(s):
    return [t for t in s.split() if t]


def rewrite_static(match, class_map):
    quote, value = match.group(1), match.group(2)
    tokens = tokenize(value)
    if not tokens or not any(t in class_map for t in tokens):
        return match.group(0)
    if len(tokens) == 1 and tokens[0] in class_map:
        return f"className={{styles.{class_map[tokens[0]]}}}"
    parts = [f"${{styles.{class_map[t]}}}" if t in class_map else t for t in tokens]
    return "className={`" + " ".join(parts) + "`}"


def rewrite_expr(expr, class_map):
    """Walk the expression; only rewrite string literals in class-value
    positions (after ?, :, ||, ??, (, ,, or expression start). Never
    touch literals after ===, !==, ==, !=, <, >, <=, >=.

    Guaranteed to make forward progress on every iteration — unknown
    characters (backtick, braces, brackets, backslash, non-ASCII) are
    passed through unchanged rather than causing an infinite loop.
    """
    out = []
    i = 0
    n = len(expr)
    prev_op = None
    ALLOW = {None, "?", ":", "||", "&&", "??", "(", ","}
    while i < n:
        start_i = i  # sentinel: every branch below MUST advance i past this
        ch = expr[i]
        if ch.isspace():
            out.append(ch)
            i += 1
        elif expr[i:i + 3] in ("===", "!==", "..."):
            out.append(expr[i:i + 3])
            prev_op = expr[i:i + 3]
            i += 3
        elif expr[i:i + 2] in ("==", "!=", "<=", ">=", "||", "&&", "??", "=>", "++", "--"):
            out.append(expr[i:i + 2])
            prev_op = expr[i:i + 2]
            i += 2
        elif ch in "?:(),!<>+-*/=&|":
            out.append(ch)
            prev_op = ch
            i += 1
        elif ch in "'\"":
            quote = ch
            j = i + 1
            while j < n and expr[j] != quote:
                if expr[j] == "\\" and j + 1 < n:
                    j += 2
                    continue
                j += 1
            if j >= n:
                # Unterminated string literal — bail out gracefully
                out.append(ch)
                i += 1
                prev_op = "STR"
                continue
            literal = expr[i + 1:j]
            full = expr[i:j + 1]
            if prev_op in ALLOW:
                tokens = tokenize(literal)
                if len(tokens) == 1 and tokens[0] in class_map:
                    out.append(f"styles.{class_map[tokens[0]]}")
                elif tokens and any(t in class_map for t in tokens):
                    parts = [f"${{styles.{class_map[t]}}}" if t in class_map else t for t in tokens]
                    out.append("`" + " ".join(parts) + "`")
                else:
                    out.append(full)
            else:
                out.append(full)
            prev_op = "STR"
            i = j + 1
        elif ch.isalnum() or ch in "_$.":
            j = i
            while j < n and (expr[j].isalnum() or expr[j] in "_$."):
                j += 1
            out.append(expr[i:j])
            prev_op = "ID"
            i = j
        else:
            # Unknown char (backtick, brace, bracket, backslash, non-ASCII).
            # Pass through and advance so the loop always makes progress.
            out.append(ch)
            prev_op = ch
            i += 1
        # Belt-and-suspenders safety net — guarantees no infinite loop
        # even if a branch above forgot to advance i.
        if i == start_i:
            out.append(expr[i])
            i += 1
    return "".join(out)


def rewrite_template(match, class_map):
    inner = match.group(1)
    pieces = []
    i = 0
    n = len(inner)
    while i < n:
        start_i = i  # sentinel
        if inner[i] == "$" and i + 1 < n and inner[i + 1] == "{":
            depth = 1
            j = i + 2
            while j < n and depth > 0:
                if inner[j] == "{":
                    depth += 1
                elif inner[j] == "}":
                    depth -= 1
                j += 1
            if depth > 0:
                # Unbalanced ${ — bail out
                pieces.append(inner[i:])
                break
            pieces.append("${" + rewrite_expr(inner[i + 2:j - 1], class_map) + "}")
            i = j
        else:
            start = i
            while i < n and inner[i] != "$":
                i += 1
            seg = inner[start:i]
            tokens = tokenize(seg)
            if tokens:
                lead = " " if seg and seg[0].isspace() else ""
                trail = " " if seg and seg[-1].isspace() else ""
                parts = [f"${{styles.{class_map[t]}}}" if t in class_map else t for t in tokens]
                pieces.append(lead + " ".join(parts) + trail)
            else:
                pieces.append(seg)
        if i == start_i:
            pieces.append(inner[i])
            i += 1
    return "className={`" + "".join(pieces) + "`}"


def rewrite_tsx(tsx_path, scss_name, class_map):
    text = tsx_path.read_text()
    # Drop old/broken scss imports for this component
    text = re.sub(
        r"^\s*import\s+['\"]\./(?:gridItemScann\.scss|griditem\.scss|GridItemScann\.module\.scss|Griditem\.module\.scss)['\"];\s*\n",
        "", text, flags=re.M)
    styles_import = f"import styles from './{scss_name}';\n"
    if styles_import not in text:
        imports = list(re.finditer(r"^import .*?;$", text, flags=re.M))
        if imports:
            end = imports[-1].end()
            text = text[:end] + "\n" + styles_import + text[end:]
        else:
            text = styles_import + text
    n_s = [0]
    n_t = [0]

    def _s(m):
        out = rewrite_static(m, class_map)
        if out != m.group(0):
            n_s[0] += 1
        return out

    def _t(m):
        out = rewrite_template(m, class_map)
        if out != m.group(0):
            n_t[0] += 1
        return out

    text = CLASSNAME_STR_RE.sub(_s, text)
    text = CLASSNAME_TPL_RE.sub(_t, text)
    tsx_path.write_text(text)
    return n_s[0], n_t[0]


def main():
    all_classes = set()
    for scss_name in ("GridItemScann.module.scss", "Griditem.module.scss"):
        all_classes |= extract_classes_from_scss(COMPONENTS_DIR / scss_name)
    class_map = {c: to_camel(c) if "-" in c else c for c in all_classes}
    print(f"Discovered {len(class_map)} classes.")
    for scss_name in ("GridItemScann.module.scss", "Griditem.module.scss"):
        rewrite_scss(COMPONENTS_DIR / scss_name, class_map)
        print(f"  Rewrote {scss_name}")
    for tsx_name, scss_name in PAIRS.items():
        p = COMPONENTS_DIR / tsx_name
        if not p.exists():
            print(f"  SKIP {tsx_name}")
            continue
        ns, nt = rewrite_tsx(p, scss_name, class_map)
        print(f"  {tsx_name}: {ns} static + {nt} template classNames rewritten")


if __name__ == "__main__":
    main()