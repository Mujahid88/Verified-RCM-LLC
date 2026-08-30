# Verified RCM — website

The marketing site for Verified RCM LLC, a US medical billing / revenue cycle management
company. 273 HTML pages, one stylesheet, one script file, plus a small Cloudflare Worker
for the contact form. No frontend build step — every page can still be opened directly
or served as plain static files.

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
│                                     topics) — hub-and-spoke, same template throughout,
│                                     built via the rcm-authority-content + medical-rcm-expert
│                                     skills and a multi-agent Workflow batch (2026-08-28/30)
├── credentialing-*.html             6 payer credentialing guides
│                                     (Medicare, Medicaid, BCBS, UnitedHealthcare,
│                                     Aetna, Cigna)
├── eligibility-verification.html    Core RCM process pages
├── prior-auth.html
├── claims-scrubbing.html
├── denials-management.html
├── medical-coding.html
├── claims-forms.html
├── accounts-receivable-recovery.html
├── in-house-vs-outsourced-billing.html
├── switching-billing-companies.html
├── rcm-glossary.html
├── digital-marketing.html           "Growth & technology" service pages
├── seo-services.html                (marketing services offered alongside RCM)
├── google-business-profile.html
├── social-media-management.html
├── web-development.html
├── virtual-assistant.html
├── blog.html                        Blog index (filterable)
├── blog-*.html                      2 full articles + 7 redirect stubs (2026-08-28: retired
│                                     patient-facing posts that duplicated the matching
│                                     specialty-*.html guide — meta-refresh + canonical to
│                                     the specialty page, since GitHub Pages can't serve a
│                                     true server-side 301; internal links now point straight
│                                     at the specialty page, skipping the redirect hop)
├── privacy.html / terms.html / hipaa-notice.html
├── 404.html
├── sitemap.xml                      59 URLs, kept in sync with the page count
├── robots.txt
├── css/style.css                    The only stylesheet — design tokens + components
├── js/main.js                       Nav, filters, reveal/counter animation, form handling
├── fonts/                           Self-hosted woff2 (see Fonts below)
├── images/                          Licensed photography, .jpg + .webp per image
└── worker/                          Cloudflare Worker: the contact form backend
    ├── contact-form.js
    └── wrangler.jsonc
```

All in-page paths are relative, so the site still works opened from disk or served from
a subfolder — the Worker is the only piece that needs an actual domain (see §4).

---

## 2. Design system

Teal + coral, rebuilt from an earlier lime/amber palette (which itself replaced an
original blue). Every colour token in `css/style.css` is a **measured** contrast value,
not an eyeballed one — the file's own comments carry the ratios and the reasoning
(e.g. why teal and coral take opposite ink colours on purpose). Don't change a token
without reading those comments first; several of them exist specifically because an
earlier change silently broke AA contrast.

Radii are intentionally small (10/16/20px) to match **SAMS**, the same company's
practice-management product at `sams.verifiedrcm.com` — the two products cross-link
(nav, footer, and a homepage section) and were deliberately brought into the same
visual family.

**Fonts** — self-hosted woff2, zero third-party font requests:
- `Lexend-Variable.woff2` — headings
- `instrument-sans-{400,500,600}-normal.woff2` — body/UI

`fonts/Fraunces-Variable.woff2` and `fonts/SourceSans3-Variable.woff2` are **orphaned** —
both were tried as the display/body face at an earlier point and later replaced; nothing
in the CSS references them anymore, so browsers never fetch them, but the files are still
sitting in the repo. Safe to delete as housekeeping; left in place for now.

---

## 3. Contact form (Cloudflare Worker, not Formspree)

The form used to post to Formspree. It now posts same-origin to
`/api/contact`, handled by `worker/contact-form.js` deployed as a Cloudflare Worker,
sending through **Resend**. Rationale for the rebuild, and why mail is sent from
`noreply@verifiedrcm.com` rather than a different domain, is documented in the comment
block at the top of `contact-form.js` — worth reading before touching it, it explains a
real deliverability problem the original setup had.

**Required secrets** (Cloudflare dashboard → Workers → this worker → Settings →
Variables, never in this repo):
- `RESEND_API_KEY` — send-only key, kept separate from any key SAMS uses
- `TURNSTILE_SECRET` — pairs with the Turnstile widget on the form

Confirmed working end-to-end via a real test submission (2026-08).

---

## 4. Hosting and deployment

- **Domain**: `verifiedrcm.com` / `www.verifiedrcm.com`, registered at Namecheap.
- **DNS/CDN**: proxied through **Cloudflare** (both apex and `www`) — this is what makes
  the `/api/contact` Worker route possible. TLS is Cloudflare's own certificate.
- **Origin**: the static site is still deployed via **GitHub Pages** from this repo's
  `main` branch (confirm current state in this repo's Settings → Pages if it matters —
  not re-verified every session).
- **Deploying**: push to `main`. There's no build step for the HTML/CSS/JS — GitHub
  Pages serves the repo as-is. The Worker is deployed **separately** via
  `wrangler deploy` from inside `worker/` — pushing this repo does **not** redeploy the
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
  — codes and payer policy go stale, and this makes that explicit rather than implying
  the site is a substitute for current payer verification.
- WCAG AA target: `pa11y --standard WCAG2AA` should return 0 on both light and dark theme.
  Dark-theme pa11y runs need a ~2s wait after the theme toggle click, or most findings
  are phantom (mid-transition colour values, not real failures).
- `sitemap.xml` is kept at exactly the live page count (59) — if you add or remove a
  page, update it in the same commit.

---

## 7. Local preview

```bash
python -m http.server 8891 --directory .
```
or, from the Claude Code session, `preview_start` with the launch.json entry
`verified-rcm-static-site` (defined in `D:\Claude\.claude\launch.json`, one level up from
this repo). The previous setup used a custom PowerShell script (`serve.ps1`) that no
longer exists — this repo doesn't need one now that Python's built-in server covers it.

---

## 8. Known gaps

- [ ] Delete the two orphaned font files (§2) — cosmetic, no functional impact.
- [ ] Confirm whether GitHub Pages is still the actual origin behind Cloudflare, or
      whether hosting moved somewhere else at some point (§4) — inferred from response
      headers, not confirmed directly.
- [ ] Clinical/payer content (CPT codes, denial reasons, credentialing steps) reflects
      standard practice as documented, not a real payer-mix-specific review — the
      disclaimer in §6 covers this in the meantime.
