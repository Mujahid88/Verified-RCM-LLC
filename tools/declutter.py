#!/usr/bin/env python
"""Removes decorative chrome and rebuilds the footer, on every .html page.

Removed:
  - the top bar above the header (phone, "US-registered LLC", Trustpilot link)
  - the small tagline under the logo in the header
  - kicker labels, small tags and chips: .eyebrow, .eyebrow-sm, .tag-pill,
    .art-chips and the hero .pill-row

Rebuilt:
  - the footer, from the single template below, so every page carries the
    same one (there were three slightly different copies before)

Idempotent. Run from the repo root:  python tools/declutter.py
"""
import glob
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

CSS_VERSION, JS_VERSION = '3.7', '3.3'

TOPBAR_RE = re.compile(r'[ \t]*<div class="topbar">\s*<div class="shell">.*?</div>\s*</div>[ \t]*\r?\n?', re.S)
TAGLINE_RE = re.compile(r'(<span class="brand-name">[^<]*)<small>.*?</small>', re.S)
LABEL_RE = re.compile(r'[ \t]*<(p|span|div) class="(?:eyebrow|eyebrow-sm|tag-pill|art-chips|pill-row)"[^>]*>.*?</\1>[ \t]*\r?\n?', re.S)
FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>', re.S)
BOOK_RE = re.compile(r'<a class="btn btn-sun" href="book\.html">Schedule a meeting</a>')
WIDGET_RE = re.compile(r'<div class="trustpilot-widget".*?</div>', re.S)

ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
PHONE = ICON % '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'
MAIL = ICON % '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
PIN = ICON % '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'
STAR = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#00b67a" d="m12 2.2 2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.2 6 20.6l1.3-6.7-5-4.7 6.8-.8z"/></svg>'
# A plain link, not the Trustpilot iframe: the iframe centres its own content and
# switches layout with its width, so it cannot be lined up with the button above it.
REVIEW = '<a class="foot-review" href="https://www.trustpilot.com/review/verifiedrcm.com" target="_blank" rel="noopener">Review us on ' + STAR + ' <b>Trustpilot</b></a>'

FOOTER = '''<footer class="site-footer">
  <div class="shell">
    <div class="foot-top">
      <div class="foot-intro">
        <a class="foot-brand" href="index.html" aria-label="Verified RCM home"><img src="images/logo.jpg" alt="" width="40" height="40"><b>Verified RCM</b></a>
        <p>We believe a practice should be paid correctly for the care it already delivers. Verified RCM closes the gap between the visit and the payment.</p>
        <ul class="foot-contact">
          <li>%(phone)s<a href="tel:+16266461230">+1 (626) 646-1230</a></li>
          <li>%(mail)s<a href="mailto:info@verifiedrcm.com">info@verifiedrcm.com</a></li>
          <li>%(pin)s<span>117 S Lexington St, Ste 100<br>Harrisonville, MO 64701</span></li>
        </ul>
        <a class="btn btn-sun" href="book.html">Schedule a meeting</a>
        %(widget)s
      </div>
      <nav class="foot-cols" aria-label="Site">
        <div><h4>Company</h4><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About us</a></li><li><a href="blog.html">Our blog</a></li><li><a href="contact.html">Contact us</a></li><li><a href="https://sams.verifiedrcm.com">SAMS</a></li></ul></div>
        <div><h4>Services</h4><ul><li><a href="service-practice-management.html">Practice management</a></li><li><a href="service-revenue-cycle-management.html">Revenue cycle management</a></li><li><a href="service-credentialing-enrollment.html">Credentialing &amp; enrollment</a></li><li><a href="prior-auth.html">Prior authorization</a></li><li><a href="medical-coding.html">Medical coding</a></li></ul></div>
        <div><h4>Growth &amp; technology</h4><ul><li><a href="digital-marketing.html">Digital marketing</a></li><li><a href="seo-services.html">Healthcare SEO</a></li><li><a href="google-business-profile.html">Google Business Profile</a></li><li><a href="social-media-management.html">Social media management</a></li><li><a href="web-development.html">Web development</a></li><li><a href="virtual-assistant.html">Virtual assistants</a></li></ul></div>
        <div><h4>Specialties</h4><ul><li><a href="specialty-internal-medicine.html">Internal medicine</a></li><li><a href="specialty-family-medicine.html">Family medicine</a></li><li><a href="specialty-pediatrics.html">Pediatrics</a></li><li><a href="specialty-urgent-care.html">Urgent care</a></li><li><a href="specialty-cardiology.html">Cardiology</a></li><li><a href="specialties.html">All 30 specialties</a></li></ul></div>
      </nav>
    </div>
    <div class="foot-bottom">
      <span>&copy; 2026 Verified RCM LLC. All rights reserved.</span>
      <nav class="foot-legal" aria-label="Legal">
        <a href="privacy.html">Privacy policy</a>
        <a href="terms.html">Terms of service</a>
        <a href="sms-terms.html">Messaging terms</a>
        <a href="hipaa-notice.html">HIPAA notice</a>
        <a href="about.html#faq">FAQs</a>
        <a href="#" id="cookiePrefsLink">Cookie preferences</a>
      </nav>
    </div>
  </div>
</footer>'''


def new_footer(old_footer, eol):
    text = FOOTER % {'phone': PHONE, 'mail': MAIL, 'pin': PIN, 'widget': REVIEW}
    return text.replace('\n', eol)


changed = 0
for path in sorted(glob.glob('*.html')):
    src = open(path, encoding='utf-8', newline='').read()
    eol = '\r\n' if '\r\n' in src else '\n'
    out = TOPBAR_RE.sub('', src)
    out = TAGLINE_RE.sub(r'\1', out)
    out = LABEL_RE.sub('', out)
    fm = FOOTER_RE.search(out)
    if fm and 'class="foot-top"' not in fm.group(0):
        out = out.replace(fm.group(0), new_footer(fm.group(0), eol), 1)
    elif fm and WIDGET_RE.search(fm.group(0)):
        # footer already rebuilt: swap the Trustpilot iframe for the plain link
        out = out.replace(fm.group(0), WIDGET_RE.sub(lambda _: REVIEW, fm.group(0), 1), 1)
    elif fm and 'class="foot-review"' not in fm.group(0):
        # a few pages never had the badge: add the link after the booking button
        out = out.replace(fm.group(0), BOOK_RE.sub(lambda b: b.group(0) + eol + '        ' + REVIEW, fm.group(0), 1), 1)
    out = re.sub(r'css/site\.css\?v=[\d.]+', 'css/site.css?v=' + CSS_VERSION, out)
    out = re.sub(r'js/lake\.js\?v=[\d.]+', 'js/lake.js?v=' + JS_VERSION, out)
    if out != src:
        open(path, 'w', encoding='utf-8', newline='').write(out)
        changed += 1
print('updated %d pages' % changed)
