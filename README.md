# Verified RCM: website

The marketing site for Verified RCM LLC, a US medical billing / revenue cycle management
company. 348 HTML pages, one stylesheet, one script file, plus a small Cloudflare Worker
for the contact form. No frontend build step: every page can still be opened directly
or served as plain static files.

---

## 0. Design system: "Lake" (site-wide since 2026-09-15)

The whole site runs on ONE hand-written stylesheet, `css/lake.css`, ported from the
Belleville Lake Pediatrics design: pure black type on white, all colour in pastel
section bands, accent tiles, buttons and artwork; frosted-glass cards over soft
colour glows; Quicksand 700 headings + Nunito Sans body (self-hosted, `fonts/`);
the three-layer wave divider; and an inline SVG "claim river" hero on the home page.
Light theme only: the dark-mode toggle was retired on purpose.

- `css/lake.css` sections 1-26 are the home page system; section 27 restyles every
  interior class (article, takeaways, data-table, protip, dodont, cta-band,
  faq-list, payer-contact, cred-steps, pillar-diagram, spec-card, post-card,
  contact-form, glossary, flow, svc-*) so no page body had to be rewritten.
- `js/lake.js` carries the accessible mobile drawer, the home page's live claim
  feed, denial-cost calculator, specialty finder, scroll-in bars and tilt.
  `js/main.js` still handles search, filters, counters, the reviews slider,
  the contact form and the cookie banner.
- `tools/migrate-lake.py` is the one-off script that moved the 340 interior pages
  onto the new header/footer and lifted each article's breadcrumb, cover, title,
  lede and byline into a full-width `<header class="art-head">` band. It is
  idempotent (skips pages already on lake.css) and documents exactly what changed.
- House style: no em dashes anywhere in copy. The migration replaced them with commas.
- `css/build-covers.js` still inlines the SVG covers; `css/build.js`, `css/src/`
  and `css/style.css` were deleted with the old monochrome system.

---

## 1. Structure

```
/
├── index.html                       Homepage
├── about.html                       About + FAQ + contact form (#contact)
├── services.html                    Services overview
├── service-*.html                   3 core service detail pages
├── specialties.html                 Specialty directory (filterable)
├── specialty-*.html                 25 specialty pillar pages (17 original + orthopedics,
│                                     dermatology, gastroenterology, OB/GYN, urology, ENT,
│                                     general surgery, vascular surgery), each ~2,500-4,500
│                                     words, verified against live ICD-10/CMS Coverage data
├── specialty-{slug}-*.html          206 cluster ("spoke") articles supporting the 25
│                                     pillars (modifiers, denials/appeals, NCCI/MUE or
│                                     bundling, E/M, top procedure families, ICD-10
│                                     specificity, prior auth, and specialty-specific
│                                     topics): hub-and-spoke, same template throughout,
│                                     built via the rcm-authority-content + medical-rcm-expert
│                                     skills and a multi-agent Workflow batch (2026-08-28/30)
├── credentialing-*.html             6 payer credentialing pillars + 36 cluster spokes
│                                     (Medicare, Medicaid, BCBS, UnitedHealthcare,
│                                     Aetna, Cigna): each pillar carries a verified
│                                     payer-contact card (official website, phone,
│                                     hours) and 6 spokes on enrollment mechanics,
│                                     CAQH/revalidation, denials/appeals and delegated
│                                     credentialing, hub-and-spoke like the specialties
│                                     (2026-08-30)
├── eligibility-verification.html    Medical billing process pillars, each with 4
├── prior-auth.html                   spokes (24 total) and a quick-facts card , 
├── claims-scrubbing.html              eligibility, prior auth, claims scrubbing,
├── denials-management.html           claim forms, denials, AR recovery. Verified
├── claims-forms.html                 CARC/RARC codes, 837/270/271 transaction facts,
├── accounts-receivable-recovery.html  Medicare's 12-month timely filing limit
│                                     (2026-08-30)
├── medical-coding.html
├── in-house-vs-outsourced-billing.html   Practice resources, deepened to ~3-4.5K
├── switching-billing-companies.html       words each with cross-links into the new
├── rcm-glossary.html                      clusters (2026-08-30)
├── digital-marketing.html           "Growth & technology" service pages
├── seo-services.html                (marketing services offered alongside RCM)
├── google-business-profile.html
├── social-media-management.html
├── web-development.html
├── virtual-assistant.html
├── blog.html                        Blog index (filterable)
├── blog-*.html                      2 full articles + 7 redirect stubs (2026-08-28: retired
│                                     patient-facing posts that duplicated the matching
│                                     specialty-*.html guide: meta-refresh + canonical to
│                                     the specialty page, since GitHub Pages can't serve a
│                                     true server-side 301; internal links now point straight
│                                     at the specialty page, skipping the redirect hop)
├── privacy.html / terms.html / hipaa-notice.html
├── 404.html
├── practice-licensing.html          Practice licensing pillar + 6 spokes (entity
│                                     formation, state medical board licensure, DEA/
│                                     MATE Act, NPI, multi-state/IMLC, CLIA) (2026-08-30)
├── practice-management-operations.html  Practice management operations pillar + 6
│                                     spokes (staffing, healthcare accounting, HIPAA,
│                                     KPI reporting, EHR selection, multi-location
│                                     scaling) (2026-08-30)
├── sitemap.xml                      340 URLs, kept in sync with the page count
├── robots.txt
├── css/lake.css                     The whole design system, hand written (see §0)
├── js/lake.js                       Drawer, home page interactivity (see §0)
├── tools/migrate-lake.py            One-off migration that moved every page onto lake.css
├── css/build-covers.js              node css/build-covers.js: inlines each pillar's SVG
│                                     cover (images/covers/*.svg) into every article, spoke,
│                                     and directory-card page. Re-run after adding/editing a
│                                     cover file or a new article page; idempotent, safe to
│                                     re-run (skips anything already wired) (2026-09-14)
├── js/main.js                       Nav, filters, reveal/counter animation, form handling
├── fonts/                           Self-hosted woff2 (see Fonts below)
├── images/                          Licensed photography, .jpg + .webp per image
├── images/covers/                   49 hand-designed SVG cover illustrations, one per
│                                     pillar topic (25 specialties + 6 credentialing payers
│                                     + 6 billing-process pillars + 2 practice-management
│                                     pillars + 10 standalone growth/resource pages) , 
│                                     abstract monochrome line art, each with 1-3 elements
│                                     in that topic's category accent color (see
│                                     section 27 of css/lake.css for the palette). Spoke
│                                     articles reuse their pillar's cover; edit the source
│                                     .svg here, then re-run css/build-covers.js to
│                                     propagate: don't hand-edit the inlined copy in a page
└── worker/                          Cloudflare Worker: the contact form backend
    ├── contact-form.js
    └── wrangler.jsonc
```

All in-page paths are relative, so the site still works opened from disk or served from
a subfolder: the Worker is the only piece that needs an actual domain (see §4).

---

## 2. Design system

See section 0. Colour tokens, type and spacing all live at the top of `css/lake.css`;
the 12 `--cat-*` cover accents referenced by the inline SVG covers are defined in
section 27 of the same file, mapped onto the Lake accent palette.

---

## 3. Contact form (Cloudflare Worker, not Formspree)

The form used to post to Formspree. It now posts same-origin to
`/api/contact`, handled by `worker/contact-form.js` deployed as a Cloudflare Worker,
sending through **Resend**. Rationale for the rebuild, and why mail is sent from
`noreply@verifiedrcm.com` rather than a different domain, is documented in the comment
block at the top of `contact-form.js`: worth reading before touching it, it explains a
real deliverability problem the original setup had.

**Required secrets** (Cloudflare dashboard → Workers → this worker → Settings →
Variables, never in this repo):
- `RESEND_API_KEY`: send-only key, kept separate from any key SAMS uses
- `TURNSTILE_SECRET`: pairs with the Turnstile widget on the form

Confirmed working end-to-end via a real test submission (2026-08).

---

## 4. Hosting and deployment

- **Domain**: `verifiedrcm.com` / `www.verifiedrcm.com`, registered at Namecheap.
- **DNS/CDN**: proxied through **Cloudflare** (both apex and `www`): this is what makes
  the `/api/contact` Worker route possible. TLS is Cloudflare's own certificate.
- **Origin**: the static site is still deployed via **GitHub Pages** from this repo's
  `main` branch (confirm current state in this repo's Settings → Pages if it matters , 
  not re-verified every session).
- **Deploying**: push to `main`. There's no build step for the HTML/CSS/JS: GitHub
  Pages serves the repo as-is. The Worker is deployed **separately** via
  `wrangler deploy` from inside `worker/`: pushing this repo does **not** redeploy the
  Worker; that's a manual/separate step.

---

## 5. Analytics and consent

GA4 (`G-M6QSPSLHV2`) is live sitewide, gated behind a cookie-consent banner using GA4
Consent Mode (default-accept with an explicit opt-out), disclosed in `privacy.html`.
Tracked events include the contact form, phone clicks, and email clicks.

---

## 6. SEO, schema, accessibility

- Unique `<title>`/`<meta description>` per page, `<link rel="canonical">`,
  Open Graph + Twitter cards throughout.
- `MedicalBusiness` JSON-LD on every page, including the real registered business
  address, phone, `sameAs` (LinkedIn, Facebook, Trustpilot). `BlogPosting`, `FAQPage`,
  `BreadcrumbList`, and `HowTo` schema where relevant.
- Every specialty/credentialing/coding/process page (33 of them) carries a
  **content-accuracy disclaimer** (`.content-disclaimer`, just above "Related resources")
 : codes and payer policy go stale, and this makes that explicit rather than implying
  the site is a substitute for current payer verification.
- WCAG AA target: `pa11y --standard WCAG2AA` should return 0 on both light and dark theme.
  Dark-theme pa11y runs need a ~2s wait after the theme toggle click, or most findings
  are phantom (mid-transition colour values, not real failures).
- `sitemap.xml` is kept at exactly the live page count (340): if you add or remove a
  page, update it in the same commit.

---

## 7. Local preview

```bash
python -m http.server 8891 --directory .
```
or, from the Claude Code session, `preview_start` with the launch.json entry
`verified-rcm-static-site` (defined in `D:\Claude\.claude\launch.json`, one level up from
this repo). The previous setup used a custom PowerShell script (`serve.ps1`) that no
longer exists: this repo doesn't need one now that Python's built-in server covers it.

---

## 8. Known gaps

- [ ] Delete the two orphaned font files (§2): cosmetic, no functional impact.
- [ ] Confirm whether GitHub Pages is still the actual origin behind Cloudflare, or
      whether hosting moved somewhere else at some point (§4): inferred from response
      headers, not confirmed directly.
- [ ] Clinical/payer content (CPT codes, denial reasons, credentialing steps) reflects
      standard practice as documented, not a real payer-mix-specific review: the
      disclaimer in §6 covers this in the meantime.
