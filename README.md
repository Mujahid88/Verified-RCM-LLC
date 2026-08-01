# Verified RCM — static website

A complete, dependency-free static site. No build step, no framework, no CDN calls.
Open `index.html` in a browser and it works; upload the folder to any host and it works.

---

## 1. What's in here

```
/
├── index.html              Homepage
├── services.html           Services overview
├── service-*.html          3 core service detail pages
├── specialties.html        Specialty directory (filterable)
├── specialty-*.html        17 specialty detail pages
├── blog.html               Blog index (filterable)
├── blog-*.html             9 full articles
├── about.html              About + FAQ + contact form (#contact)
├── medical-coding.html     Coding types / modifiers / CPTs by specialty
├── prior-auth.html         Prior authorization workflow
├── privacy.html            Privacy policy
├── terms.html              Terms of service
├── hipaa-notice.html       HIPAA / Business Associate notice
├── 404.html                Error page (matches site design)
├── sitemap.xml             All 39 URLs
├── robots.txt              Crawl rules + sitemap pointer
├── favicon.ico
├── css/
│   └── style.css           The only stylesheet (design tokens + components + responsive)
├── js/
│   └── main.js             Theme toggle, mobile nav, filters, scroll reveal, form validation
├── images/
│   ├── hero / about / why-choose / testimonial / og-cover  (.jpg + .webp)
│   ├── logo.jpg, favicon.png, apple-touch-icon.png
│   └── blog/               One image per article (.jpg + .webp)
└── fonts/                  Empty — see "Fonts" below
```

All paths in the HTML are **relative** (`css/style.css`, not `/css/style.css`), so the site
works at a domain root, in a subfolder, or straight off your local disk.

---

## 2. Before you go live

### a) Formspree (contact form) — done
Both forms (the About page contact form and the footer email capture on every page) point to
`https://formspree.io/f/xzdnqnly`. Client-side validation runs before submit (required fields,
email format, min lengths, phone pattern) and shows inline errors plus a status message.

### b) Your real domain — done
Every page's `<link rel="canonical">`, Open Graph `og:url`, JSON-LD, `robots.txt`, and
`sitemap.xml` point at `https://www.verifiedrcm.com` (confirmed as the real domain).

### c) Photography — done
`images/` holds licensed photography (Unsplash, free license) at every filename, including
per-article blog images, the homepage/about/testimonial photos, and the social-share cover image.
Old placeholder graphics are kept out of the deploy in `_backups/` for reference only.

### d) Contact details — confirmed
`+1 (623) 231-2306` and `hello@verifiedrcm.com` (footer of every page + `about.html`) are the
real business contact details.

---

## 3. Optional

- **Analytics** — paste your GA4 / Plausible / Fathom snippet just before `</body>` in each
  page, or before `<script src="js/main.js">`.
- **WebP delivery** — both `.jpg` and `.webp` versions of every photo ship here. The HTML
  currently references `.jpg` for maximum compatibility. To serve WebP with a JPG fallback,
  wrap any `<img>` like this:
  ```html
  <picture>
    <source srcset="images/hero.webp" type="image/webp">
    <img src="images/hero.jpg" alt="...">
  </picture>
  ```
  (Or let Netlify/Cloudflare do format negotiation for you — usually easier.)
- **Fonts** — the "Corporate Trust" pairing, both self-hosted (latin subset, variable weight,
  ~72KB total) with a `system-ui` fallback, so there are zero third-party font requests:
  - `fonts/Lexend-Variable.woff2` (~39KB) — headings. Designed for reading proficiency.
  - `fonts/SourceSans3-Variable.woff2` (~29KB) — body copy.
- **Dark mode** — already built in via the moon/sun button in the nav; the choice persists
  in `localStorage`. Delete `#themeToggle` from each page's header if you don't want it.

---

## 4. Deploying

### Netlify (drag and drop)
1. Go to <https://app.netlify.com/drop>.
2. Drag this whole folder onto the page. Done — you get a live URL immediately.
3. Add your domain under **Site settings → Domain management**.

### Netlify (from GitHub — recommended)
1. Push this folder to a GitHub repo (the folder contents should be at the repo root, so
   `index.html` sits at the top level).
2. In Netlify: **Add new site → Import an existing project → GitHub**, pick the repo.
3. Build command: **leave empty**. Publish directory: **`.`** (or the folder name if nested).
4. Deploy. `404.html` is picked up automatically as the error page.

### cPanel / shared hosting (FTP)
1. Log into cPanel → **File Manager**, open `public_html`.
2. Upload the contents of this folder (not the folder itself) into `public_html`, so the
   final path is `public_html/index.html`.
3. If you prefer FTP, connect with FileZilla and drag the contents into `public_html`.
4. `.htaccess` isn't required — Apache serves `index.html` and `404.html` by default. If your
   host doesn't pick up the 404, add a file named `.htaccess` containing:
   ```
   ErrorDocument 404 /404.html
   ```
5. Force HTTPS in cPanel under **Domains → force HTTPS redirect**, or enable **AutoSSL**.

### GitHub Pages
Push to a repo, then **Settings → Pages → Deploy from a branch → `main` / root**. Works as-is
because all paths are relative.

---

## 5. What's already handled

- Unique `<title>` and `<meta name="description">` per page, written for a US medical
  billing / RCM audience
- `<meta name="robots" content="index, follow">` on all 39 pages
- Open Graph + Twitter card tags on all 39 pages; blog posts use `og:type=article` and their
  own photo (not the generic cover) for social-share previews
- `<link rel="canonical">` per page
- `MedicalBusiness` JSON-LD schema on every page (name, URL, logo, phone, area served)
- `BlogPosting` JSON-LD schema on all 9 articles (headline, image, dates, author, publisher)
- `FAQPage` JSON-LD schema on the homepage and About page (enables FAQ rich snippets in search)
- `sitemap.xml` (39 URLs, prioritised) and `robots.txt`
- Viewport meta on every page
- One `<h1>` per page, semantic `<main>` / `<section>` / `<article>` / `<nav>` / `<footer>`,
  ordered heading hierarchy
- Alt text on every image
- Responsive and verified at **375px**, **768px** and **1440px** (collapsing nav with a
  hamburger menu, single-column stacks, full-width buttons on small screens)
- WCAG AA contrast, verified by computing every pairing rather than eyeballing it:
  body text `#0B1B21` on `#F6FAFB` (16.75:1); muted text `#52636A` (5.96:1); accent body
  copy and links use `--color-accent-800` (6.92:1). The base teal `--color-accent`
  (`#0891B2`, 3.5:1) is a **fill/chrome colour only** and never carries body copy.
  Gradients are checked at *every stop*, since white button labels sit on the lightest
  one — `--grad-brand` bottoms out at 5.36:1 and `--grad-vivid` (which carries the
  headline text) at 4.77:1.
- Ink on solid accent fills is dark, not white (4.60:1 vs 3.68:1 on teal). Do not lighten
  `--on-accent`: `#04222B` lands at 4.49:1 and misses AA by a hair.
- Skip-to-content link on all 40 pages, `<main id="main">` landmark
- Touch targets: 44×44px on nav links, chips, toggles, slider controls and FAQ rows
  (AAA 2.5.5). Dense footer link lists target the AA 2.5.8 minimum (24×24) instead, since
  44px rows would balloon the footer
- Animated number counters, staggered card/grid reveal (~60ms per sibling, capped at 360ms),
  nav shrink-on-scroll, floating hero cards, badge pulse, button shine sweep — all respect
  `prefers-reduced-motion`
- Testimonial slider built on native scroll-snap: fully usable with no JS, keyboard
  arrow-key support, ARIA labels, and dots that stay in sync with scroll position
- Keyboard focus rings (`:focus-visible`)
- No console errors, no external requests (fonts and images are all self-hosted)

---

## 6. Quick checklist

- [x] Formspree endpoint wired in (about + every footer)
- [x] Real domain confirmed everywhere (HTML + sitemap + robots)
- [x] Licensed images in place in `images/` and `images/blog/`
- [x] Phone number and email confirmed
- [ ] Add your analytics snippet (optional, see section 3)
- [ ] Decide on final deploy target (GitHub Pages / Netlify / Vercel / Namecheap hosting)
- [ ] Submit `sitemap.xml` in Google Search Console
- [ ] Test the contact form end to end after adding the Formspree ID
