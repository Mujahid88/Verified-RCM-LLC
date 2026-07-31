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

## 2. Before you go live — required

### a) Formspree (contact form)
The form does not send anywhere until you add your endpoint.

1. Create a free form at <https://formspree.io>.
2. Copy your endpoint ID (looks like `mqkrwxyz`).
3. Find/replace **`YOUR_FORM_ID`** across all files. It appears in two places:
   - `about.html` — the main contact form (marked with an HTML comment)
   - the footer email capture — **in every page's footer**

   Fastest way (macOS/Linux):
   ```bash
   grep -rl YOUR_FORM_ID . | xargs sed -i '' 's/YOUR_FORM_ID/mqkrwxyz/g'
   ```
   (On Linux drop the `''` after `-i`.)

Client-side validation already runs before submit (required fields, email format,
min lengths, phone pattern) and shows inline errors plus a status message. Until the ID
is swapped in, submitting shows a "form not configured yet" notice instead of failing silently.

### b) Your real domain
Every page has `<link rel="canonical">`, Open Graph `og:url`, and JSON-LD pointing at
`https://www.verifiedrcm.com`. Replace that with your live domain everywhere:

```bash
grep -rl 'www.verifiedrcm.com' . | xargs sed -i '' 's|https://www.verifiedrcm.com|https://YOURDOMAIN.com|g'
```

Also update the `Sitemap:` line in `robots.txt` and the `<loc>` values in `sitemap.xml`.

### c) Photography
`images/` currently holds **branded placeholders**, not real photos — each one says so on
the image. Replace with licensed photography at the same filenames and aspect ratios:

| File | Suggested size | Used on |
| --- | --- | --- |
| `hero.jpg` | 1600×1100 | Homepage hero |
| `about.jpg` | 1200×1400 (portrait) | Homepage + About |
| `why-choose.jpg` | 1200×1000 | Homepage "Why choose us" |
| `testimonial.jpg` | 1200×900 | Homepage testimonials |
| `og-cover.jpg` | 1200×630 | Link previews (LinkedIn, email, Twitter) |
| `blog/<slug>.jpg` | 1200×800 | One per article |

Alt text is already written on every `<img>` — update it if the new photo shows something different.

### d) Contact details
Currently `+1 (623) 231-2306` and `hello@verifiedrcm.com` (footer of every page + `about.html`).
Change the email if that isn't your real inbox.

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
- **Fonts** — the site uses Archivo with a `system-ui` fallback and loads **no external font
  files**, so it has zero third-party requests. If you want Archivo self-hosted, drop the
  `.woff2` files into `fonts/` and add an `@font-face` block at the top of `css/style.css`.
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
- Open Graph + Twitter card tags on all 39 pages
- `<link rel="canonical">` per page
- `MedicalBusiness` JSON-LD schema (name, URL, logo, phone, area served)
- `sitemap.xml` (39 URLs, prioritised) and `robots.txt`
- Viewport meta on every page
- One `<h1>` per page, semantic `<main>` / `<section>` / `<article>` / `<nav>` / `<footer>`,
  ordered heading hierarchy
- Alt text on every image
- Responsive and verified at **375px**, **768px** and **1440px** (collapsing nav with a
  hamburger menu, single-column stacks, full-width buttons on small screens)
- WCAG AA contrast: body text is `#181a14` on `#F7F8F2`; the lime accent is only used for
  large text, fills and chrome, with the deeper `--color-accent-700` for accent-coloured
  body copy and links
- Keyboard focus rings (`:focus-visible`), `prefers-reduced-motion` respected
- No console errors, no external requests

---

## 6. Quick checklist

- [ ] Replace `YOUR_FORM_ID` with your Formspree endpoint (about + every footer)
- [ ] Replace `https://www.verifiedrcm.com` with your real domain (HTML + sitemap + robots)
- [ ] Swap placeholder images in `images/` and `images/blog/` for licensed photography
- [ ] Confirm phone number and email address
- [ ] Add your analytics snippet
- [ ] Submit `sitemap.xml` in Google Search Console
- [ ] Test the contact form end to end after adding the Formspree ID
