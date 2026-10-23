#!/usr/bin/env python
"""Markup tidy-ups from the October 2026 UX pass. Idempotent. Run from the repo root:
    python tools/polish.py

  - article covers use the short banner (1200x360) on every article, not only on
    cluster articles, so the cover no longer pushes the guide below the fold
  - home hero: the floating "99%" badge goes (the same figure is in the outcome
    panel further down the page)
"""
import glob
import os
import re

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

COVER_RE = re.compile(r'(<figure class="article-cover"><img src="images/covers/banner/)([a-z0-9-]+?)(?<!-wide)(\.svg"[^>]*?width="1200" height=")630(")')
FLOAT_STAT_RE = re.compile(r'[ \t]*<div class="float-card float-stat"[^>]*>.*?</div>[ \t]*\r?\n', re.S)

changed = 0
for path in sorted(glob.glob('*.html')):
    src = open(path, encoding='utf-8', newline='').read()
    out = COVER_RE.sub(r'\g<1>\g<2>-wide\g<3>360\g<4>', src)
    if path == 'index.html':
        out = FLOAT_STAT_RE.sub('', out)
    if out != src:
        open(path, 'w', encoding='utf-8', newline='').write(out)
        changed += 1
print('updated %d pages' % changed)
