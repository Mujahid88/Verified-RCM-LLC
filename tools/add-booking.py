#!/usr/bin/env python
"""Points the site's consultation buttons at the Google Calendar booking page.

On every .html file in the repo root:
  1. Header "Book a consultation" button opens the booking page.
  2. Footer: adds a "Skip the wait" line and a "Schedule a meeting with an
     expert" button under the phone number.
  3. Every other "Book a free consultation" button (drawer, home page CTA
     bands, about page) opens the booking page.
  4. Bumps the css/js version so browsers fetch the booking modal code.

Service-specific CTAs (claims review, audits, credentialing) keep pointing at
the contact form, since those need details from the visitor first.

Idempotent. Run from anywhere:  python tools/add-booking.py
"""
import glob
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

BOOK_URL = ('https://calendar.google.com/calendar/appointments/'
            'AcZssZ3U1C2KDYLlRBricu1gqJ_M11FL3HOU4BsHH_k=?gv=true')
ATTRS = 'href="%s" target="_blank" rel="noopener" data-book' % BOOK_URL

CSS_FROM, CSS_TO = 'css/site.css?v=3.0', 'css/site.css?v=3.1'
JS_FROM, JS_TO = 'js/lake.js?v=3.0', 'js/lake.js?v=3.1'

FOOTER_RE = re.compile(
    r'(<a class="foot-phone"[^>]*>[^<]*</a>\n)(\s*)'
    r'<a class="btn btn-solid" href="about\.html#contact">Book a free consultation</a>')
HEADER_OLD = '<a class="btn btn-solid" href="about.html#contact">Book a consultation</a>'
HEADER_NEW = '<a class="btn btn-solid" %s>Book a consultation</a>' % ATTRS
FREE_RE = re.compile(r'<a ([^>]*?)href="about\.html#contact"([^>]*)>Book a free consultation</a>')


def footer(m):
    indent = m.group(2)
    return (m.group(1)
            + indent + '<p class="foot-book">Skip the wait and schedule a 1:1 meeting directly on our calendar.</p>\n'
            + indent + '<a class="btn btn-solid" %s>Schedule a meeting with an expert</a>' % ATTRS)


def free(m):
    attrs = (m.group(1) + m.group(2)).strip()
    return '<a %s %s>Book a free consultation</a>' % (attrs, ATTRS)


changed = 0
for path in sorted(glob.glob('*.html')):
    src = open(path, encoding='utf-8').read()
    out = FOOTER_RE.sub(footer, src)
    out = out.replace(HEADER_OLD, HEADER_NEW)
    out = FREE_RE.sub(free, out)
    out = out.replace(CSS_FROM, CSS_TO).replace(JS_FROM, JS_TO)
    if out != src:
        open(path, 'w', encoding='utf-8', newline='').write(out)
        changed += 1
print('updated %d pages' % changed)
