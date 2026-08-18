#!/usr/bin/env python3
"""
Fix runtime-computed imageClass strings broken by the CSS Modules migration.

The getInstructionTypeElement function uses `imageClass = "kebab-name"` and
later `<img className={imageClass} />`. With CSS Modules those string values
no longer match any DOM class. We rewrite the assignments to use
styles.camelName and rewrite the usage to keep the type system happy.
"""
import re
from pathlib import Path

# UTF-8 for Windows
import pathlib
_orig_read = pathlib.Path.read_text
_orig_write = pathlib.Path.write_text
pathlib.Path.read_text = lambda self, **kw: _orig_read(self, encoding=kw.pop("encoding", "utf-8"), **kw)
pathlib.Path.write_text = lambda self, data, **kw: _orig_write(self, data, encoding=kw.pop("encoding", "utf-8"), **kw)

COMPONENTS = Path("src/components")
TSX_FILES = [
    "GridItem.tsx",
    "GridItemComp.tsx",
    "GridDrag2.tsx",
    "GridItemScann.tsx",
    "GridItemScannMobile.tsx",
]


def to_camel(kebab: str) -> str:
    parts = kebab.split("-")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])


# Regex: matches `imageClass = "kebab-thing";` (handles "image-class" or any kebab)
IMAGECLASS_ASSIGN_RE = re.compile(
    r"""(\bimageClass\s*=\s*)(["'])([a-z][a-z0-9-]*)\2(\s*;)"""
)

# Also catch the default-value pattern: `let imageClass = "operations";`
# (the DEFAULT in your code is "operations" which is also a class that exists
# in the scss, so same treatment.)


def rewrite_assignments(text: str) -> tuple[str, int]:
    def repl(m: re.Match) -> str:
        prefix, quote, kebab, suffix = m.group(1), m.group(2), m.group(3), m.group(4)
        camel = to_camel(kebab)
        # Replace the string literal with a styles lookup
        return f"{prefix}styles.{camel}{suffix}"
    new_text, n = IMAGECLASS_ASSIGN_RE.subn(repl, text)
    return new_text, n


# Change the let declaration's type — `let imageClass = "operations";`
# becomes `let imageClass: string = styles.operations;` so TS stays happy when
# we later assign styles.somethingElse (keeping it as `string` is simplest).
LET_DECL_RE = re.compile(
    r"""(\blet\s+imageClass\s*)=\s*(["'])([a-z][a-z0-9-]*)\2(\s*;)"""
)


def rewrite_let_decl(text: str) -> tuple[str, int]:
    def repl(m: re.Match) -> str:
        prefix, quote, kebab, suffix = m.group(1), m.group(2), m.group(3), m.group(4)
        camel = to_camel(kebab)
        return f"{prefix}: string = styles.{camel}{suffix}"
    return LET_DECL_RE.subn(repl, text)


# Hardcoded `<img ... className="hidden-image" />`  ->  className={styles.hiddenImage}
HARDCODED_IMG_CLS_RE = re.compile(
    r"""className\s*=\s*["']([a-z][a-z0-9-]*-[a-z][a-z0-9-]*)["']"""
)

# Known kebab classes we should rewrite; anything else we leave alone because
# it's likely not in the module (e.g. dead classes).
KNOWN_IMAGE_CLASSES = {
    "hidden-image", "input-image", "output-image", "click-image",
    "close-image", "screen-image", "link-image", "ifelse-image",
    "refresh-image", "wait-image", "else-image", "endif-image",
    "pause-image", "goto-image", "excelgoto-image", "cross-image",
}


def rewrite_hardcoded(text: str) -> tuple[str, int]:
    def repl(m: re.Match) -> str:
        kebab = m.group(1)
        if kebab not in KNOWN_IMAGE_CLASSES:
            return m.group(0)  # leave alone
        return f"className={{styles.{to_camel(kebab)}}}"
    return HARDCODED_IMG_CLS_RE.subn(repl, text)


def process(path: Path) -> None:
    if not path.exists():
        print(f"  SKIP {path.name} (not found)")
        return
    text = path.read_text()
    original = text
    total = 0
    text, n = rewrite_let_decl(text)
    total += n
    text, n = rewrite_assignments(text)
    total += n
    text, n = rewrite_hardcoded(text)
    total += n
    if text != original:
        path.write_text(text)
        print(f"  {path.name}: {total} edits")
    else:
        print(f"  {path.name}: no changes")


def main() -> None:
    print("Fixing runtime-computed image classes for CSS Modules...")
    for name in TSX_FILES:
        process(COMPONENTS / name)
    print("\nDone. Next steps:")
    print("  1. npm run build   (check for any styles.xxx errors)")
    print("  2. npm start       (verify images render at correct size)")


if __name__ == "__main__":
    main()