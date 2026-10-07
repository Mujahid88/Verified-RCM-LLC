#!/usr/bin/env node
// Builds the cover banners used by article headers, directory cards and the
// home page: images/covers/banner/<slug>.svg (1200x630) and
// images/covers/banner/<slug>-wide.svg (1200x360, for cluster articles).
//
// Each banner is a dark gradient with a faint grid and glow, the topic's
// line-art glyph (images/covers/<slug>.svg, recoloured for a dark ground)
// in a frosted panel, and the topic name set in large type. Banners are
// standalone SVG files, loaded with <img>, so they do not depend on page CSS.
//
// Re-run after adding or editing a cover: node css/build-banners.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COVERS = path.join(ROOT, 'images', 'covers');
const OUT = path.join(COVERS, 'banner');

// [label, group]. Group decides gradient, eyebrow and subtitle.
const TOPICS = {
  // Specialties
  'specialty-cardiology': ['Cardiology', 'medical'],
  'specialty-chiropractic': ['Chiropractic', 'therapy'],
  'specialty-dental-care': ['Dental care', 'dental'],
  'specialty-dermatology': ['Dermatology', 'surgical'],
  'specialty-endocrinology': ['Endocrinology', 'medical'],
  'specialty-ent': ['ENT', 'surgical'],
  'specialty-family-medicine': ['Family medicine', 'primary-care'],
  'specialty-food-nutrition': ['Food & nutrition', 'behavioral'],
  'specialty-gastroenterology': ['Gastroenterology', 'surgical'],
  'specialty-general-surgery': ['General surgery', 'surgical'],
  'specialty-internal-medicine': ['Internal medicine', 'primary-care'],
  'specialty-mental-health': ['Mental health', 'behavioral'],
  'specialty-nephrology': ['Nephrology', 'medical'],
  'specialty-neurology': ['Neurology', 'medical'],
  'specialty-obstetrics-gynecology': ['OB/GYN', 'surgical'],
  'specialty-occupational-therapy': ['Occupational therapy', 'therapy'],
  'specialty-oncology': ['Oncology', 'medical'],
  'specialty-ophthalmology': ['Ophthalmology', 'medical'],
  'specialty-orthopedics': ['Orthopedics', 'surgical'],
  'specialty-pain-management': ['Pain management', 'medical'],
  'specialty-pediatrics': ['Pediatrics', 'primary-care'],
  'specialty-physical-therapy': ['Physical therapy', 'therapy'],
  'specialty-plastic-surgery': ['Plastic surgery', 'surgical'],
  'specialty-podiatry': ['Podiatry', 'surgical'],
  'specialty-pulmonary-diseases': ['Pulmonary diseases', 'medical'],
  'specialty-rheumatology': ['Rheumatology', 'medical'],
  'specialty-sleep-medicine': ['Sleep medicine', 'medical'],
  'specialty-urgent-care': ['Urgent care', 'primary-care'],
  'specialty-urology': ['Urology', 'surgical'],
  'specialty-vascular-surgery': ['Vascular surgery', 'surgical'],
  // Payer credentialing
  'credentialing-aetna': ['Aetna', 'credentialing'],
  'credentialing-bcbs': ['Blue Cross Blue Shield', 'credentialing'],
  'credentialing-cigna': ['Cigna', 'credentialing'],
  'credentialing-medicaid': ['Medicaid', 'credentialing'],
  'credentialing-medicare': ['Medicare', 'credentialing'],
  'credentialing-unitedhealthcare': ['UnitedHealthcare', 'credentialing'],
  // Billing process
  'eligibility-verification': ['Eligibility verification', 'medical-billing'],
  'prior-auth': ['Prior authorization', 'medical-billing'],
  'claims-scrubbing': ['Claims scrubbing', 'medical-billing'],
  'claims-forms': ['Claim forms', 'medical-billing'],
  'denials-management': ['Denials management', 'medical-billing'],
  'accounts-receivable-recovery': ['A/R recovery', 'medical-billing'],
  'medical-coding': ['Medical coding', 'medical-coding'],
  // Practice
  'practice-licensing': ['Practice licensing', 'practice-mgmt'],
  'practice-management-operations': ['Practice operations', 'practice-mgmt'],
  // Resources
  'in-house-vs-outsourced-billing': ['In-house vs outsourced', 'practice-resources'],
  'switching-billing-companies': ['Switching billing companies', 'practice-resources'],
  'rcm-glossary': ['RCM glossary', 'practice-resources'],
  // Growth
  'digital-marketing': ['Digital marketing', 'practice-growth'],
  'seo-services': ['Healthcare SEO', 'practice-growth'],
  'google-business-profile': ['Google Business Profile', 'practice-growth'],
  'social-media-management': ['Social media', 'practice-growth'],
  'web-development': ['Web development', 'practice-growth'],
  'virtual-assistant': ['Virtual assistants', 'practice-growth'],
};

// Blog posts have no cover of their own; borrow a related glyph.
const EXTRA = {
  'blog-mental-health-specialized-rcm': { label: 'Mental health RCM', group: 'behavioral', glyph: 'specialty-mental-health', sub: 'Blog article' },
  'blog-internal-medicine-practice-management': { label: 'Internal medicine practice management', group: 'primary-care', glyph: 'specialty-internal-medicine', sub: 'Blog article' },
  default: { label: 'Medical billing', group: 'medical-billing', glyph: 'medical-coding', sub: 'Verified RCM guide' },
};

const GROUPS = {
  'medical':            { eyebrow: 'Medical specialty',     sub: 'Billing and coding guide', from: '#1e3a8a', to: '#2563eb', accent: '#5eead4' },
  'surgical':           { eyebrow: 'Surgical specialty',    sub: 'Billing and coding guide', from: '#312e81', to: '#4338ca', accent: '#5eead4' },
  'primary-care':       { eyebrow: 'Primary care',          sub: 'Billing and coding guide', from: '#134e4a', to: '#0f766e', accent: '#fcd34d' },
  'therapy':            { eyebrow: 'Therapy and rehab',     sub: 'Billing and coding guide', from: '#042f2e', to: '#115e59', accent: '#fcd34d' },
  'behavioral':         { eyebrow: 'Behavioral and nutrition', sub: 'Billing and coding guide', from: '#4c1d95', to: '#6d28d9', accent: '#5eead4' },
  'dental':             { eyebrow: 'Dental',                sub: 'Billing and coding guide', from: '#0c4a6e', to: '#0369a1', accent: '#5eead4' },
  'credentialing':      { eyebrow: 'Payer credentialing',   sub: 'Credentialing guide',      from: '#0f2f4a', to: '#0f766e', accent: '#5eead4' },
  'medical-billing':    { eyebrow: 'Revenue cycle',         sub: 'Billing process guide',    from: '#0f172a', to: '#1e3a8a', accent: '#5eead4' },
  'medical-coding':     { eyebrow: 'Medical coding',        sub: 'Coding guide',             from: '#1e1b4b', to: '#4338ca', accent: '#5eead4' },
  'practice-mgmt':      { eyebrow: 'Practice management',   sub: 'Practice guide',           from: '#1e293b', to: '#1d4ed8', accent: '#5eead4' },
  'practice-resources': { eyebrow: 'Practice resources',    sub: 'Resource guide',           from: '#1e293b', to: '#334155', accent: '#5eead4' },
  'practice-growth':    { eyebrow: 'Practice growth',       sub: 'Growth guide',             from: '#164e63', to: '#0e7490', accent: '#fcd34d' },
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Recolour a glyph drawn for a light page so it reads on the dark banner.
function recolourGlyph(svg, accent) {
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  // Comments are legal inline in HTML but a "--" inside one makes a standalone SVG invalid XML.
  const noComments = inner.replace(/<!--[\s\S]*?-->/g, '');
  return noComments
    .replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${(parseFloat(w) * 1.7).toFixed(2)}"`)
    .replace(/stroke="var\(--muted\)"/g, 'stroke="#ffffff" stroke-opacity=".7"')
    .replace(/fill="var\(--muted\)"/g, 'fill="#ffffff" fill-opacity=".7"')
    .replace(/stroke="var\(--color-text\)"/g, 'stroke="#ffffff"')
    .replace(/fill="var\(--color-text\)"/g, 'fill="#ffffff"')
    .replace(/stroke="var\(--cat-[a-z-]+\)"/g, `stroke="${accent}"`)
    .replace(/fill="var\(--cat-[a-z-]+\)"/g, `fill="${accent}"`)
    .replace(/var\(--[a-z-]+\)/g, '#ffffff'); // anything unexpected
}

// Split a long title over two lines at the space nearest the middle.
function titleLines(label) {
  if (label.length <= 13 || !label.includes(' ')) return [label];
  const mid = label.length / 2;
  let best = -1, bestDist = Infinity;
  for (let i = 0; i < label.length; i++) {
    if (label[i] === ' ' && Math.abs(i - mid) < bestDist) { best = i; bestDist = Math.abs(i - mid); }
  }
  return [label.slice(0, best), label.slice(best + 1)];
}

function banner({ slug, label, group, glyphSlug, sub, wide }) {
  const g = GROUPS[group];
  const W = 1200, H = wide ? 360 : 630;
  const FONT = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif";
  const glyphSrc = fs.readFileSync(path.join(COVERS, glyphSlug + '.svg'), 'utf8').trim();
  const glyph = recolourGlyph(glyphSrc, g.accent);

  const lines = titleLines(label);
  const longest = Math.max(...lines.map(l => l.length));
  const maxW = wide ? 640 : 660;
  const baseSize = wide ? (lines.length > 1 ? 70 : 84) : 112;
  const size = Math.max(40, Math.min(baseSize, Math.floor(maxW / (longest * 0.6))));
  const lead = Math.round(size * 1.08);

  const panel = wide ? 250 : 340;
  const panelX = wide ? 860 : 800;
  const panelY = wide ? 55 : 145;
  const scale = (panel - 40) / 480;
  const titleTop = wide ? (lines.length > 1 ? 138 : 160) : 292;
  const eyebrowY = wide ? 78 : 178;
  const barY = wide ? 46 : 118;
  const subY = titleTop + (lines.length - 1) * lead + (wide ? 42 : 62);

  const titleSvg = lines.map((l, i) =>
    `<text x="90" y="${titleTop + i * lead}" font-family="${FONT}" font-size="${size}" font-weight="800" fill="#ffffff" letter-spacing="-2">${esc(l)}</text>`).join('\n  ');

  const id = slug.replace(/[^a-z0-9]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}, ${esc(sub)}">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></linearGradient>
    <radialGradient id="gl${id}" cx="0.85" cy="0.2" r="0.6"><stop offset="0" stop-color="${g.accent}" stop-opacity="0.5"/><stop offset="1" stop-color="${g.accent}" stop-opacity="0"/></radialGradient>
    <pattern id="gr${id}" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/></pattern>
    <clipPath id="cp${id}"><rect x="${panelX}" y="${panelY}" width="${panel}" height="${panel}" rx="28"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg${id})"/>
  <rect width="${W}" height="${H}" fill="url(#gr${id})"/>
  <rect width="${W}" height="${H}" fill="url(#gl${id})"/>
  <circle cx="1040" cy="${wide ? 60 : 130}" r="${wide ? 170 : 220}" fill="${g.accent}" fill-opacity="0.14"/>
  <circle cx="1110" cy="${H - 80}" r="${wide ? 110 : 150}" fill="#ffffff" fill-opacity="0.06"/>
  <rect x="${panelX}" y="${panelY}" width="${panel}" height="${panel}" rx="28" fill="#ffffff" fill-opacity="0.09" stroke="${g.accent}" stroke-opacity="0.55" stroke-width="2"/>
  <g clip-path="url(#cp${id})"><g transform="translate(${panelX + 20} ${panelY + 20}) scale(${scale.toFixed(4)})">${glyph}</g></g>
  <rect x="90" y="${barY}" width="72" height="8" rx="4" fill="${g.accent}"/>
  <text x="90" y="${eyebrowY}" font-family="${FONT}" font-size="${wide ? 20 : 24}" font-weight="600" fill="#ffffff" fill-opacity="0.85" letter-spacing="4">${esc(g.eyebrow.toUpperCase())}</text>
  ${titleSvg}
  <text x="90" y="${subY}" font-family="${FONT}" font-size="${wide ? 24 : 30}" fill="#ffffff" fill-opacity="0.85">${esc(sub)}</text>
  <text x="90" y="${H - (wide ? 24 : 70)}" font-family="${FONT}" font-size="${wide ? 20 : 22}" font-weight="600" fill="#ffffff" fill-opacity="0.7">Verified RCM</text>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
const jobs = [];
for (const [slug, [label, group]] of Object.entries(TOPICS)) {
  jobs.push({ slug, label, group, glyphSlug: slug, sub: GROUPS[group].sub });
}
for (const [slug, e] of Object.entries(EXTRA)) {
  jobs.push({ slug, label: e.label, group: e.group, glyphSlug: e.glyph, sub: e.sub });
}
for (const j of jobs) {
  for (const wide of [false, true]) {
    fs.writeFileSync(path.join(OUT, `${j.slug}${wide ? '-wide' : ''}.svg`), banner({ ...j, wide }));
    n++;
  }
}

// Labels for alt text, read by tools/apply-clean.py
const manifest = {};
for (const j of jobs) manifest[j.slug] = { label: j.label, sub: j.sub, group: j.group };
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');

// Every cover must have a banner, or a page would point at a missing file.
const missing = fs.readdirSync(COVERS).filter(f => f.endsWith('.svg')).map(f => f.replace(/\.svg$/, '')).filter(s => !TOPICS[s]);
console.log(`Wrote ${n} banners (${jobs.length} topics x 2).`);
if (missing.length) { console.error('Covers with no entry in TOPICS:', missing); process.exit(1); }
