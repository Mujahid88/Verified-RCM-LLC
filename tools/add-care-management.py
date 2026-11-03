#!/usr/bin/env python
"""Registers the care-management (CCM, PCM, RTM) guide family across the site. Idempotent.

Run from the repo root after the pages exist:  python tools/add-care-management.py

  - Services menu: adds "Care management" under Medical billing on every page with the menu
  - blog.html: a card in "Billing process guides"
  - services.html: a row in the guide list, with the cover glyph
  - index.html: guide and page counts in the "full playbook" section
  - sitemap.xml and search-index.json: the new pages
"""
import glob
import json
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

PILLAR = 'care-management.html'
SPOKES = [
    ('care-management-ccm-vs-pcm.html', 'CCM vs PCM: choosing the right care management service', 'Choose between chronic care management and principal care management: who qualifies, who can bill, which combinations are allowed, and the decision rule a billing provider can document.'),
    ('care-management-codes-and-time-rules.html', 'Care management codes, time rules and 2026 Medicare rates', 'CCM, PCM and RTM codes, the minutes each one needs, whose time counts, maximum units per month and approximate 2026 Medicare payment, with a code selection table.'),
    ('care-management-rtm-billing.html', 'Remote therapeutic monitoring billing: 98975 to 98985', 'How RTM is billed: set-up, device days of data, management minutes and the live call, plus the therapy plan of care rule and what the 2027 proposal would change.'),
    ('care-management-rtm-device-and-data-rules.html', 'RTM data that counts and the FDA device question', 'Which app data supports musculoskeletal RTM, why food logs and plain diaries do not, and what the FDA device definition means for billing.'),
    ('care-management-who-can-do-the-work.html', 'Who can do care management work: clinical staff, supervision and state rules', 'Clinical staff, dietitians, nurses, medical assistants and coaches: what Medicare allows, what Arizona and Texas add, and how delegation protocols work.'),
    ('care-management-enrollment-and-consent.html', 'Enrolling patients in CCM and PCM: the initiating visit and consent', 'The initiating visit, G0506, consent wording, cost sharing and how to enroll a patient at a regular office visit without a second visit.'),
    ('care-management-documentation-and-care-plans.html', 'Care management documentation: care plans, time logs and enrollment notes', 'What a care plan has to contain, how to log time so it survives an audit, and provider note templates for PCM and CCM enrollment.'),
    ('care-management-payer-rules.html', 'Payer rules for CCM, PCM and RTM: Medicare, Medicare Advantage and commercial', 'What Medicare, Medicare Advantage, UnitedHealthcare, Aetna, Cigna and others say about care management and remote monitoring, and the benefits check to run first.'),
    ('care-management-diagnosis-codes.html', 'ICD-10 codes for CCM, PCM and RTM', 'Valid FY2027 ICD-10-CM codes for finding PCM, CCM and RTM patients, which codes are rejected as incomplete, and why a code alone never proves eligibility.'),
    ('care-management-compliance-and-audit-risk.html', 'Care management compliance: OIG audits, copays and vendor contracts', 'Where care management audits look: patient selection, oversight, cost-sharing waivers, nutrition therapy and outside vendors.'),
    ('care-management-sops-month-end-and-qa.html', 'Care management SOPs, month-end close and chart audit checklist', 'Eight standard operating procedures, the month-end close, a code selection table and a monthly chart audit scorecard for care management programs.'),
    ('care-management-staff-training.html', 'Care management staff training: curriculum and competency checks', 'What care management staff have to know before they take a patient call, which training is required and which is recommended, and how to check competency.'),
]
PILLAR_TITLE = 'CCM, PCM and RTM billing: the practical guide to care management in 2026'
PILLAR_DESC = ('Care management billing guide: when to use CCM, PCM or RTM, the codes and minutes behind each, who may do the work, consent, documentation, payer rules '
               'and the 2027 proposals, written for billing teams.')
TODAY = '2026-11-03'

changed = {}


def read(p):
    return open(p, encoding='utf-8', newline='').read()


def write(p, s):
    open(p, 'w', encoding='utf-8', newline='').write(s)


# 1. Services menu ---------------------------------------------------------------
NAV_RE = re.compile(r'([ \t]*)<a href="accounts-receivable-recovery\.html">A/R recovery</a>(\r?\n)(?!\s*<a href="care-management\.html")')
n = 0
for path in sorted(glob.glob('*.html')):
    src = read(path)
    if 'href="care-management.html">Care management' in src:
        continue
    out, k = NAV_RE.subn(lambda m: m.group(0) + m.group(1) + '<a href="care-management.html">Care management (CCM, PCM, RTM)</a>' + m.group(2), src, count=1)
    if k:
        write(path, out)
        n += 1
changed['menu pages'] = n

# 2. blog.html card ---------------------------------------------------------------
blog = read('blog.html')
if 'href="care-management.html"' not in blog.split('id="billing-process-guides"')[1].split('id="specialty-billing-guides"')[0]:
    eol = '\r\n' if '\r\n' in blog else '\n'
    anchor = re.search(r'([ \t]*)<a class="card post-card" href="accounts-receivable-recovery\.html">.*?</a>(\r?\n)', blog, re.S)
    card = ('<a class="card post-card" href="care-management.html"><div class="card-cover"><img src="images/covers/banner/care-management.svg" alt="" width="1200" height="630" loading="lazy" decoding="async"></div>'
            '<div class="post-body"><h3>Care management billing: CCM, PCM and RTM without the audit risk.</h3><p>%s</p><span class="arrow">Read the guide &rarr;</span></div></a>' % PILLAR_DESC.split(', written for')[0])
    blog = blog[:anchor.end()] + anchor.group(1) + card + anchor.group(2) + blog[anchor.end():]
    write('blog.html', blog)
    changed['blog.html'] = 1

# 3. services.html row ------------------------------------------------------------
services = read('services.html')
if 'href="care-management.html"><div class="row-cover">' not in services:
    glyph = read('images/covers/care-management.svg').strip().replace('\r\n', '\n')
    row = ('<li><a class="spec-row" href="care-management.html"><div class="row-cover">%s</div><span class="spec-row-name">Care management (CCM, PCM, RTM)'
           '<span class="spec-row-note">Monthly care management and remote monitoring, billed correctly</span></span>%s</a></li>')
    m = re.search(r'<li><a class="spec-row" href="accounts-receivable-recovery\.html">.*?</a></li>', services, re.S)
    arrow = re.search(r'</span></span>(<svg.*?</svg>)</a></li>', m.group(0), re.S).group(1)
    eol = '\r\n' if '\r\n' in services else '\n'
    services = services[:m.end()] + eol + '        ' + (row % (glyph, arrow)) + services[m.end():]
    write('services.html', services)
    changed['services.html'] = 1

# 4. index.html counts --------------------------------------------------------------
idx = read('index.html')
total = len(glob.glob('*.html'))
o = idx
# "pages and counting" has always read three fewer than the file count (404 and two utility pages)
o = re.sub(r'\d+ pages and counting', '%d pages and counting' % (total - 3), o, count=1)
if '6 topics, 30 pages' in o:
    o = o.replace('6 topics, 30 pages', '7 topics, %d pages' % (30 + 1 + len(SPOKES)), 1)
    o = o.replace('denials management and A/R recovery, with verified', 'denials management, A/R recovery and care management, with verified', 1)
if o != idx:
    write('index.html', o)
    changed['index.html'] = 1

# 5. sitemap and search index -------------------------------------------------------
sm = read('sitemap.xml')
eol = '\r\n' if '\r\n' in sm else '\n'
add = ''
for i, (url, _, _) in enumerate([(PILLAR, 0, 0)] + SPOKES):
    loc = 'https://www.verifiedrcm.com/' + url
    if loc in sm:
        continue
    pr = '0.8' if url == PILLAR else '0.6'
    add += '  <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>monthly</changefreq><priority>%s</priority></url>%s' % (loc, TODAY, pr, eol)
if add:
    sm = sm.replace('</urlset>', add + '</urlset>')
    write('sitemap.xml', sm)
    changed['sitemap'] = add.count('<url>')

raw = read('search-index.json')
data = json.loads(raw)
have = {d['url'] for d in data}
new = 0
for url, title, desc in [(PILLAR, PILLAR_TITLE, PILLAR_DESC)] + SPOKES:
    if url not in have:
        data.append({'title': title, 'url': url, 'desc': desc, 'cat': 'Resource'})
        new += 1
if new:
    write('search-index.json', json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    changed['search-index'] = new

print(changed or 'nothing to do')
