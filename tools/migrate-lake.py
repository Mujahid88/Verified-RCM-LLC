#!/usr/bin/env python3
"""One-off migration: move every interior page onto the Lake design system.

Run from the repo root:  python3 tools/migrate-lake.py

What it does to each *.html except index.html and the meta-refresh stubs:
  head    swap the old stylesheet and Google Fonts links for css/lake.css and
          the self-hosted font preloads
  header  replace the old nav-wrap block with the home page's topbar, header
          and drawer, with the matching top-level link marked current
  footer  replace the footer, cookie banner and scripts with the home page's
  article lift breadcrumb, cover, h1, lede and byline out of the article into
          a full-width <header class="art-head"> band (page-head sections get
          the same treatment)
  copy    replace em dashes with commas, per house style
Idempotent: a page that already loads css/lake.css is skipped.
"""
import re, glob, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

index = open('index.html', encoding='utf-8').read()

# ---- pieces from the home page ------------------------------------------
m = re.search(r'(<div class="topbar">.*?)(?=<main id="main">)', index, re.S)
HEADER = m.group(1)
m = re.search(r'(<footer class="site-footer">.*?)</body>', index, re.S)
TAIL = m.group(1)

FONT_PRELOAD = ('<link rel="preload" href="fonts/Quicksand-700-latin.woff2" as="font" type="font/woff2" crossorigin>\n'
                '<link rel="preload" href="fonts/NunitoSans-Variable-latin.woff2" as="font" type="font/woff2" crossorigin>\n'
                '<link rel="stylesheet" href="css/lake.css?v=2.0">')

def nav_key(fname):
    f = fname.lower()
    if f.startswith(('specialty', 'specialties')): return 'specialties.html'
    if f.startswith(('blog', 'rcm-glossary', 'in-house', 'switching')): return 'blog.html'
    if f.startswith('about'): return 'about.html'
    if f.startswith(('service', 'credentialing', 'eligibility', 'prior-auth', 'claims', 'denials',
                     'accounts-receivable', 'medical-coding', 'digital-marketing', 'seo', 'google-business',
                     'social-media', 'web-development', 'virtual-assistant', 'practice-')): return 'services.html'
    return None

def header_for(fname):
    key = nav_key(fname)
    h = HEADER
    if key:
        h = h.replace('<a class="nav-link" href="%s"' % key,
                      '<a class="nav-link is-current" aria-current="page" href="%s"' % key, 1)
    return h

def dedash(s):
    s = s.replace(' &mdash; ', ', ').replace('&mdash;', ', ')
    s = s.replace(' — ', ', ').replace('—', ', ')
    return s

ARTICLE_OPEN = re.compile(r'<article class="wrap article">\s*')

def lift_article_head(html):
    m = ARTICLE_OPEN.search(html)
    if not m: return html, False
    start = m.end()
    rest = html[start:]
    parts = {'crumb': '', 'cover': '', 'h1': '', 'lede': '', 'meta': ''}
    pos = 0
    patterns = [
        ('crumb', re.compile(r'\s*<a href="[^"]+" class="crumb-back">.*?</a>', re.S)),
        ('cover', re.compile(r'\s*<figure class="article-cover">.*?</figure>', re.S)),
        ('h1',    re.compile(r'\s*<h1>.*?</h1>', re.S)),
        ('lede',  re.compile(r'\s*<p class="lede">.*?</p>', re.S)),
        ('meta',  re.compile(r'\s*<div class="post-meta">.*?</div>', re.S)),
    ]
    for name, pat in patterns:
        mm = pat.match(rest, pos)
        if mm:
            parts[name] = mm.group(0).strip()
            pos = mm.end()
    if not parts['h1']:
        return html, False
    copy = '\n      '.join(x for x in (parts['crumb'], parts['h1'], parts['lede'], parts['meta']) if x)
    head = ('<header class="art-head">\n  <div class="shell">\n    <div class="art-head-copy">\n      %s\n    </div>\n'
            '    %s\n  </div>\n</header>\n' % (copy, parts['cover']))
    new = html[:m.start()] + head + '<article class="wrap article">\n  ' + rest[pos:].lstrip()
    return new, True

PAGE_HEAD = re.compile(r'<section class="wrap section page-head( narrow)?">(.*?)</section>', re.S)

def lift_page_head(html):
    def rep(mm):
        inner = mm.group(2)
        return '<section class="page-head">\n  <div class="shell">%s</div>\n</section>' % inner
    return PAGE_HEAD.sub(rep, html, count=1)

def migrate(fname):
    html = open(fname, encoding='utf-8').read()
    if 'css/lake.css' in html: return 'skip (already migrated)'
    if 'http-equiv="refresh"' in html: return 'skip (redirect stub)'
    if '<div class="nav-wrap">' not in html: return 'skip (no nav-wrap)'

    # head
    html = re.sub(r'<link rel="preconnect" href="https://fonts\.g[^"]+"[^>]*>\n?', '', html)
    html = re.sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]+" rel="stylesheet">\n?', '', html)
    html = re.sub(r'<link rel="stylesheet" href="css/style\.css[^"]*">', FONT_PRELOAD, html, count=1)
    html = html.replace('<meta name="theme-color" content="#0a5b9c">', '<meta name="theme-color" content="#0B3B5E">')

    # header
    html = re.sub(r'<div class="nav-wrap">.*?(?=<main id="main">)', lambda _: header_for(fname), html, count=1, flags=re.S)
    html = html.replace('<body>\n<a class="skip-link" href="#main">Skip to main content</a>\n',
                        '<body>\n<script>document.documentElement.classList.add("js");</script>\n<a class="skip-link" href="#main">Skip to main content</a>\n', 1)

    # footer + tail
    html = re.sub(r'<footer class="site-footer">.*?</body>', lambda _: TAIL + '</body>', html, count=1, flags=re.S)

    # article / page head
    html, lifted = lift_article_head(html)
    html = lift_page_head(html)

    # copy
    html = dedash(html)

    open(fname, 'w', encoding='utf-8').write(html)
    return 'ok' + (' +art-head' if lifted else '')

if __name__ == '__main__':
    files = sorted(f for f in glob.glob('*.html') if f != 'index.html')
    counts = {}
    for f in files:
        r = migrate(f)
        counts[r] = counts.get(r, 0) + 1
    for k, v in sorted(counts.items(), key=lambda x: -x[1]): print(v, k)
