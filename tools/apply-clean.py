#!/usr/bin/env python
"""Rolls the Clean design system (css/site.css) onto every page.

What it changes, on every .html file in the repo root:
  1. Swaps the stylesheet link to css/site.css, the font preloads to Inter,
     and bumps the script version so browsers fetch the new js/lake.js.
  2. Article pages (<article class="wrap article">):
       - replaces the inline cover art with the banner image from
         images/covers/banner/ (full size for a pillar page, slim for a
         cluster article);
       - gives every top-level <h2> an anchor id;
       - adds an "In this guide" contents list beside the article.
  3. specialties.html: swaps each card's inline cover art for the banner.

Idempotent: a page that already has the new markup is left alone.
Run from the repo root after css/build-banners.js:  python tools/apply-clean.py
"""
import glob
import html as htmllib
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

MANIFEST = json.load(open('images/covers/banner/manifest.json', encoding='utf-8'))
COVERS = {os.path.basename(f)[:-4] for f in glob.glob('images/covers/*.svg')}
COVERS |= {k for k in MANIFEST if k.startswith('blog-')}  # blog posts borrow a glyph but have their own banner
PILLARS = sorted(COVERS, key=len, reverse=True)  # longest first so a prefix cannot match a shorter sibling

CSS_VERSION = '3.0'
JS_VERSION = '3.0'
MIN_TOC_ITEMS = 3
SKIP_H2 = {'key takeaways', 'more articles'}


def find_pillar(base):
    if base in COVERS:
        return base
    for p in PILLARS:
        if base.startswith(p + '-'):
            return p
    return None


def plain(fragment):
    return htmllib.unescape(re.sub(r'<[^>]+>', '', fragment)).strip()


def slugify(text, used):
    s = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    s = re.sub(r'\s+', '-', s.strip())
    s = re.sub(r'-+', '-', s).strip('-')[:60].strip('-') or 'section'
    base, n = s, 2
    while s in used:
        s = f'{base}-{n}'
        n += 1
    used.add(s)
    return s


def swap_assets(src):
    src = re.sub(r'css/(?:lake|site)\.css(\?v=[\d.]+)?', f'css/site.css?v={CSS_VERSION}', src)
    src = re.sub(r'js/lake\.js(\?v=[\d.]+)?', f'js/lake.js?v={JS_VERSION}', src)
    inter = '<link rel="preload" href="fonts/Inter-latin-variable.woff2" as="font" type="font/woff2" crossorigin>'
    if 'Inter-latin-variable' not in src:
        src = re.sub(r'<link rel="preload" href="fonts/Quicksand-700-latin\.woff2"[^>]*>', inter, src)
    src = re.sub(r'\n?<link rel="preload" href="fonts/(?:Quicksand-700|NunitoSans-Variable)-latin\.woff2"[^>]*>', '', src)
    return src


def banner_img(base, pillar):
    pillar_page = (base == pillar)
    name = pillar + ('' if pillar_page else '-wide')
    meta = MANIFEST[pillar]
    h = 630 if pillar_page else 360
    alt = htmllib.escape(f"{meta['label']}: {meta['sub'].lower()}", quote=True)
    return (f'<img src="images/covers/banner/{name}.svg" alt="{alt}" width="1200" height="{h}" '
            f'fetchpriority="high" decoding="async">')


def transform_article(src, base):
    stats = {'cover': 0, 'toc': 0}
    pillar = find_pillar(base)

    # Cover: inline svg -> banner image
    m = re.search(r'<figure class="article-cover">(.*?)</figure>', src, re.S)
    if m and pillar and '<img' not in m.group(1):
        src = src.replace(m.group(0), f'<figure class="article-cover">{banner_img(base, pillar)}</figure>', 1)
        stats['cover'] = 1

    if 'article-layout' in src or 'class="toc"' in src:
        return src, stats

    am = re.search(r'<article class="wrap article">(.*?)</article>', src, re.S)
    if not am or src.count('<article') != 1:
        return src, stats
    inner = am.group(1)

    used = set(re.findall(r'\bid="([^"]+)"', src))
    items = []

    def tag_h2(hm):
        attrs, body = hm.group(1), hm.group(2)
        text = plain(body)
        if text.lower() in SKIP_H2 or not text:
            return hm.group(0)
        idm = re.search(r'\bid="([^"]+)"', attrs)
        if idm:
            hid = idm.group(1)
        else:
            hid = slugify(text, used)
            attrs = f'{attrs} id="{hid}"'
        items.append((hid, text))
        return f'<h2{attrs}>{body}</h2>'

    new_inner = re.sub(r'<h2([^>]*)>(.*?)</h2>', tag_h2, inner, flags=re.S)
    if len(items) < MIN_TOC_ITEMS:
        return src, stats

    lis = '\n'.join(f'      <li><a href="#{hid}">{htmllib.escape(text, quote=False)}</a></li>' for hid, text in items)
    toc = (f'  <details class="toc" open>\n'
           f'    <summary>In this guide</summary>\n'
           f'    <nav aria-label="In this guide">\n'
           f'    <ol>\n{lis}\n    </ol>\n    </nav>\n'
           f'  </details>\n')
    new_article = f'<article class="wrap article article-layout">\n{toc}  <div class="article-main">{new_inner}</div>\n</article>'
    src = src.replace(am.group(0), new_article, 1)
    stats['toc'] = 1
    return src, stats


def transform_specialties(src):
    n = 0

    def swap(m):
        nonlocal n
        slug = m.group(1)
        if slug not in MANIFEST:
            return m.group(0)
        n += 1
        return (f'<a href="{slug}.html" class="card spec-card" data-cat="{m.group(2)}">'
                f'<div class="card-cover"><img src="images/covers/banner/{slug}.svg" alt="" width="1200" height="630" loading="lazy" decoding="async"></div>'
                f'<div class="spec-card-body">')

    src = re.sub(r'<a href="(specialty-[a-z-]+)\.html" class="card spec-card" data-cat="([^"]+)">\s*<div class="card-cover"><svg.*?</svg></div>\s*<div class="spec-card-body">',
                 swap, src, flags=re.S)
    return src, n


def main():
    totals = {'pages': 0, 'covers': 0, 'tocs': 0, 'cards': 0}
    for f in sorted(glob.glob('*.html')):
        base = f[:-5]
        original = open(f, encoding='utf-8', newline='').read()
        src = swap_assets(original)
        if 'http-equiv="refresh"' not in src:
            if '<article class="wrap article' in src:
                src, st = transform_article(src, base)
                totals['covers'] += st['cover']
                totals['tocs'] += st['toc']
            if f == 'specialties.html':
                src, n = transform_specialties(src)
                totals['cards'] += n
        if src != original:
            open(f, 'w', encoding='utf-8', newline='').write(src)
            totals['pages'] += 1
    print(f"Updated {totals['pages']} pages: {totals['covers']} covers swapped, "
          f"{totals['tocs']} contents lists added, {totals['cards']} directory cards.")


if __name__ == '__main__':
    main()
