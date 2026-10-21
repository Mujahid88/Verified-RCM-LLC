#!/usr/bin/env python
"""Moves the contact form to its own "Contact us" page and wires the site to it.

On every .html file in the repo root:
  1. Every link to the old form anchor (about.html#contact) points at
     contact.html instead.
  2. The header gets a "Contact" link and the mobile drawer a "Contact us"
     link, next to About.
  3. The footer legal row gets a "Messaging terms" link (sms-terms.html).
  4. css and js versions are bumped so browsers fetch the new form styles
     and consent validation.

Also: about.html loses the form section (a short pointer to contact.html
takes its place, and old #contact links are redirected), and sitemap.xml and
search-index.json learn about the two new pages.

The pages themselves (contact.html, sms-terms.html) are hand written.

Idempotent. Run from anywhere:  python tools/add-contact-page.py
"""
import glob
import json
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

TODAY = '2026-10-20'
CSS_VERSION, MAIN_JS_VERSION = '3.5', '3.2'

# Pages use CRLF line endings on Windows checkouts, so every pattern allows \r\n.
NAV_RE = re.compile(r'(<li><a class="nav-link[^"]*"[^>]*href="about\.html">About</a></li>)(?!\s*<li><a class="nav-link[^"]*"[^>]*href="contact\.html")(\r?\n[ ]+)')
DRAWER_RE = re.compile(r'(\r?\n)([ ]{8})(<li><a href="about\.html">About us</a></li>)(\r?\n)(?![ ]{8}<li><a href="contact\.html">)')
LEGAL_RE = re.compile(r'(<a href="terms\.html">Terms of service</a>)(?!\s*<a href="sms-terms\.html")(\r?\n[ ]+)')

ABOUT_FORM_RE = re.compile(r'<section class="wrap section" id="contact">.*?</section>', re.S)
ABOUT_POINTER = '''<section class="wrap section" id="get-in-touch">
  <div class="cta-banner">
    <div>
      <div class="eyebrow">Next step</div>
      <div class="cta-banner-title">Ready to see where your revenue is leaking?</div>
      <p>Tell us about your practice and we will reply within one business day, or pick a time that suits you.</p>
    </div>
    <div class="btn-row">
      <a class="btn btn-accent" href="contact.html">Contact us</a>
      <a class="btn btn-line" href="book.html">Book a meeting</a>
    </div>
  </div>
</section>'''
ABOUT_REDIRECT = '<script>if (location.hash === "#contact") location.replace("contact.html");</script>\n'


def rewrite(path, fn):
    src = open(path, encoding='utf-8', newline='').read()
    out = fn(src)
    if out != src:
        open(path, 'w', encoding='utf-8', newline='').write(out)
        return True
    return False


def site_wide(src):
    out = src.replace('about.html#contact', 'contact.html')
    out = NAV_RE.sub(r'\1\2<li><a class="nav-link" href="contact.html">Contact</a></li>\2', out)
    out = DRAWER_RE.sub(r'\1\2\3\4\2<li><a href="contact.html">Contact us</a></li>\4', out)
    out = LEGAL_RE.sub(r'\1\2<a href="sms-terms.html">Messaging terms</a>\2', out)
    out = re.sub(r'css/site\.css\?v=[\d.]+', 'css/site.css?v=' + CSS_VERSION, out)
    out = re.sub(r'js/main\.js\?v=[\d.]+', 'js/main.js?v=' + MAIN_JS_VERSION, out)
    return out


def about(src):
    out = ABOUT_FORM_RE.sub(ABOUT_POINTER, src, count=1) if 'id="contact"' in src else src
    out = re.sub(r'\s*<script src="https://challenges\.cloudflare\.com/turnstile/v0/api\.js" async defer></script>', '', out)
    out = out.replace('| US Medical Billing Company | Contact Us', '| US Medical Billing Company')
    if 'location.hash === "#contact"' not in out:
        out = re.sub(r'(<script>document\.documentElement\.classList\.add\("js"\);</script>)(\r?\n)',
                     lambda m: m.group(1) + m.group(2) + ABOUT_REDIRECT.rstrip('\n') + m.group(2), out, count=1)
    return out


def sitemap(src):
    add = ''
    for page, prio in (('contact.html', '0.8'), ('sms-terms.html', '0.4')):
        if '/' + page + '</loc>' not in src:
            add += '  <url><loc>https://www.verifiedrcm.com/%s</loc><lastmod>%s</lastmod><changefreq>monthly</changefreq><priority>%s</priority></url>\n' % (page, TODAY, prio)
    return src.replace('</urlset>', add + '</urlset>') if add else src


def search_index(src):
    data = json.loads(src)
    have = {e['url'] for e in data}
    new = [
        {'title': 'Contact Verified RCM | Request a Free Practice Review', 'url': 'contact.html',
         'desc': 'Contact Verified RCM by form, phone or email, or book a time on our calendar. Includes how to opt in or out of email, calls and text messages.', 'cat': 'Main'},
        {'title': 'Messaging Terms | Verified RCM Text Message Program', 'url': 'sms-terms.html',
         'desc': 'Terms for Verified RCM text messages: what we send, how often, message and data rates, and how to opt out by replying STOP or get help by replying HELP.', 'cat': 'Main'},
    ]
    for e in new:
        if e['url'] not in have:
            data.append(e)
    for e in data:
        if e['url'] == 'about.html':
            e['title'] = e['title'].replace(' | Contact Us', '')
    return json.dumps(data, ensure_ascii=False, separators=(',', ':'))


changed = sum(rewrite(p, site_wide) for p in sorted(glob.glob('*.html')))
about_changed = rewrite('about.html', about)
rewrite('sitemap.xml', sitemap)
rewrite('search-index.json', search_index)
print('site-wide: %d pages updated; about.html changed: %s' % (changed, about_changed))
