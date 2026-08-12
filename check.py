#!/usr/bin/env python3
"""Pre-deploy integrity check.

Exists because a regex that deleted @keyframes stopped at the first closing
brace, left orphaned fragments at the top level, and each stray brace made the
CSS parser swallow the rule after it. Two rules vanished (.vhead and .btn), the
homepage hero lost its centring, every button lost its shape, and nothing in the
repo complained. Run this before every push.

    python3 check.py
"""
import glob
import os
import re
import sys

FAIL = []
CSS = 'styles.css'


def fail(msg):
    FAIL.append(msg)


def check_braces():
    """A stylesheet must never close a block it did not open."""
    depth = 0
    for n, line in enumerate(open(CSS), 1):
        depth += line.count('{') - line.count('}')
        if depth < 0:
            fail(f'{CSS}:{n} closes a block that was never opened')
            depth = 0
    if depth != 0:
        fail(f'{CSS} ends with {depth} unclosed block(s)')


def check_orphan_keyframes():
    """Keyframe bodies loose at the top level are the exact failure that shipped."""
    for n, line in enumerate(open(CSS), 1):
        s = line.strip()
        if re.match(r'^\d+%[,{]|^(from|to)\{', s) and depth_at(n) == 0:
            fail(f'{CSS}:{n} orphaned keyframe fragment: {s[:48]}')


def depth_at(target):
    depth = 0
    for n, line in enumerate(open(CSS), 1):
        if n == target:
            return depth
        depth += line.count('{') - line.count('}')
    return depth


def check_required_rules():
    """Rules whose loss is invisible in the source but obvious on the page."""
    css = open(CSS).read()
    for sel in ['.vhead{', '.btn{', '.frame{', '.pillnav nav{', '.contact{']:
        if sel not in css:
            fail(f'{CSS} is missing the {sel[:-1]} rule')


def check_justify_is_gated():
    """Justification must stay gated on measure, never applied flat.

    A flat `.frame p{text-align:justify}` looks correct on the long-form pages
    and opens rivers in the 3-up cards, where a line is about 30 characters. The
    gate is a container query, so it cannot silently miss a new component the way
    an opt-out list does. It only works if the column declares itself a
    container, so check both halves.
    """
    css = open(CSS).read()
    if 'container-type:inline-size' not in css:
        fail(f'{CSS} has no container-type:inline-size, so the justify gate '
             f'measures the wrong element')
    for m in re.finditer(r'text-align:justify', css):
        before = css[:m.start()]
        # the nearest enclosing at-rule must be the measure query
        if '@container (min-width:26rem)' not in before[-400:]:
            n = before.count('\n') + 1
            fail(f'{CSS}:{n} justifies without the measure gate above it')


def check_asset_versions():
    """A stylesheet edit that keeps its old ?v= is served stale from the edge."""
    versions = set()
    for f in glob.glob('*.html') + glob.glob('notes/*.html'):
        for m in re.findall(r'styles\.css\?v=(\d+)', open(f).read()):
            versions.add(m)
    if len(versions) > 1:
        fail(f'pages disagree on the stylesheet version: {sorted(versions)}')
    elif not versions:
        fail('no page references styles.css with a version')


def check_dead_references():
    """Every local asset a page asks for should exist."""
    for f in glob.glob('*.html') + glob.glob('notes/*.html'):
        html = open(f).read()
        for ref in re.findall(r'(?:href|src)="(/[^"#?]+)', html):
            if ref.endswith('/'):
                continue
            path = ref.lstrip('/')
            if os.path.exists(path) or os.path.exists(path + '.html'):
                continue
            if '.' not in os.path.basename(path):
                continue
            fail(f'{f} references {ref}, which does not exist')


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    check_braces()
    check_orphan_keyframes()
    check_required_rules()
    check_justify_is_gated()
    check_asset_versions()
    check_dead_references()

    if FAIL:
        print(f'FAILED ({len(FAIL)}):')
        for f in FAIL:
            print('  -', f)
        sys.exit(1)
    print('OK: braces balanced, no orphan keyframes, required rules present, '
          'justify gated on measure, one stylesheet version, '
          'no dead asset references')
