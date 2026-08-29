#!/usr/bin/env python3
"""
verify.py — structural integrity checker for nabintmr.github.io

Lean checks for a static 6-page site:
  1. HTML tag balance (per page)
  2. Internal link targets exist (href to local .html files)
  3. Local asset references exist (css/js/img src & href)
  4. Nav "active" state — exactly one per page
  5. CSS brace balance
  6. JS syntax (via `node --check`, skipped if node unavailable)

Run:  python scripts/verify.py
      python scripts/verify.py --verbose

Exit codes: 0 = clean, 1 = errors found
"""
import glob
import os
import re
import subprocess
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

errors = []
passes = []

VERBOSE = "--verbose" in sys.argv


def ok(msg):
    passes.append(msg)
    if VERBOSE:
        print(f"  \u2713 {msg}")


def err(msg):
    errors.append(msg)
    print(f"  \u2717 {msg}")


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}


class TagChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.issues = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        pass  # self-closed, e.g. <meta />, no stack effect

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag:
            self.issues.append(f"mismatched </{tag}>")
        else:
            self.stack.pop()


def check_tag_balance(pages):
    print("\n[1/6] HTML tag balance")
    for f in pages:
        content = open(f, encoding="utf-8").read()
        c = TagChecker()
        c.feed(content)
        if c.issues or c.stack:
            err(f"{f}: tag balance issues {c.issues} unclosed={c.stack}")
        else:
            ok(f"{f} tags balanced")


def check_internal_links(pages):
    print("\n[2/6] Internal link targets")
    page_set = set(pages)
    for f in pages:
        content = open(f, encoding="utf-8").read()
        for h in re.findall(r'href="([^"]+)"', content):
            if h.startswith(("http", "#", "mailto:", "tel:")):
                continue
            if h.startswith("assets/"):
                continue  # checked separately
            if h not in page_set:
                err(f"{f}: broken internal link '{h}'")
        else:
            pass
    if not any("broken internal link" in e for e in errors):
        ok("all internal page links resolve")


def check_asset_refs(pages):
    print("\n[3/6] Local asset references (css/js/img)")
    missing = False
    for f in pages:
        content = open(f, encoding="utf-8").read()
        refs = re.findall(r'(?:href|src)="(assets/[^"]+)"', content)
        for r in refs:
            if not os.path.exists(r):
                err(f"{f}: missing asset '{r}'")
                missing = True
    if not missing:
        ok("all referenced local assets exist")


def check_nav_active(pages):
    print("\n[4/6] Nav active-state consistency")
    for f in pages:
        content = open(f, encoding="utf-8").read()
        count = len(re.findall(r'class="active"', content))
        if count != 1:
            err(f"{f}: expected exactly 1 'active' nav link, found {count}")
        else:
            ok(f"{f} has exactly one active nav link")


def check_css_braces():
    print("\n[5/6] CSS brace balance")
    for f in sorted(glob.glob("assets/css/*.css")):
        content = open(f, encoding="utf-8").read()
        o, c = content.count("{"), content.count("}")
        if o != c:
            err(f"{f}: brace mismatch open={o} close={c}")
        else:
            ok(f"{f} braces balanced")


def check_js_syntax():
    print("\n[6/6] JS syntax")
    node = None
    for candidate in ("node", "nodejs"):
        try:
            subprocess.run([candidate, "--version"], capture_output=True, check=True)
            node = candidate
            break
        except (FileNotFoundError, subprocess.CalledProcessError):
            continue
    if not node:
        print("  (skipped — node not available)")
        return
    for f in sorted(glob.glob("assets/js/**/*.js", recursive=True)):
        result = subprocess.run([node, "--check", f], capture_output=True, text=True)
        if result.returncode != 0:
            err(f"{f}: JS syntax error\n{result.stderr.strip()}")
        else:
            ok(f"{f} syntax OK")


def main():
    pages = sorted(glob.glob("*.html"))
    print(f"Checking {len(pages)} pages in {ROOT}")

    check_tag_balance(pages)
    check_internal_links(pages)
    check_asset_refs(pages)
    check_nav_active(pages)
    check_css_braces()
    check_js_syntax()

    print(f"\n{'='*50}")
    print(f"Passed: {len(passes)}   Errors: {len(errors)}")
    if errors:
        print("\nFAILED — fix the above before committing.")
        sys.exit(1)
    print("All checks passed.")
    sys.exit(0)


if __name__ == "__main__":
    main()
