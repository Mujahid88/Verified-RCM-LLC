#!/usr/bin/env node
// Inlines each pillar's SVG cover (images/covers/<pillar>.svg) into:
//   1. Every pillar and spoke article page, as a <figure class="article-cover">
//      right after the breadcrumb link and before the <h1>.
//   2. specialties.html's .spec-card grid, as a <div class="card-cover">
//      thumbnail (restructures card body into .spec-card-body).
//   3. services.html's .spec-row list, as a <div class="row-cover"> icon.
//
// Covers are inlined (not <img src>) on purpose: they use var(--cat-*),
// var(--muted) and var(--color-text), so they must live in the page's own
// DOM to pick up the live light/dark theme — an externally-loaded <img>
// can't see the host page's CSS custom properties.
//
// Safe to re-run: skips any file that already has the cover markup.
// Usage:  node css/build-covers.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COVERS_DIR = path.join(ROOT, 'images', 'covers');

const PILLARS = fs.readdirSync(COVERS_DIR)
  .filter(f => f.endsWith('.svg'))
  .map(f => f.replace(/\.svg$/, ''))
  .sort((a, b) => b.length - a.length); // longest first, so prefix matching can't cross-match a shorter sibling pillar

const coverSvg = {};
for (const p of PILLARS) {
  coverSvg[p] = fs.readFileSync(path.join(COVERS_DIR, p + '.svg'), 'utf8').trim();
}

function findPillar(basename) {
  if (coverSvg[basename]) return basename;
  for (const p of PILLARS) {
    if (basename.startsWith(p + '-')) return p;
  }
  return null;
}

// ---------- 1. article hero placement ----------
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
let wired = 0, alreadyWired = 0, redirectStub = 0, noPillar = [];

for (const file of htmlFiles) {
  if (file === 'specialties.html' || file === 'services.html') continue;
  const basename = file.replace(/\.html$/, '');
  const full = path.join(ROOT, file);
  let content = fs.readFileSync(full, 'utf8');

  if (content.includes('http-equiv="refresh"')) { redirectStub++; continue; }
  if (content.includes('class="article-cover"')) { alreadyWired++; continue; }

  const pillar = findPillar(basename);
  if (!pillar) { noPillar.push(file); continue; }

  const crumbMatch = content.match(/(<a[^>]*class="crumb-back"[^>]*>[\s\S]*?<\/a>\n)/);
  if (!crumbMatch) { noPillar.push(file + ' (no crumb-back)'); continue; }

  const figure = `  <figure class="article-cover">${coverSvg[pillar]}</figure>\n`;
  content = content.replace(crumbMatch[0], crumbMatch[0] + figure);
  fs.writeFileSync(full, content);
  wired++;
}

console.log(`Article covers: wired ${wired}, already wired ${alreadyWired}, redirect stubs skipped ${redirectStub}.`);
if (noPillar.length) console.log(`No pillar match for ${noPillar.length} file(s):`, noPillar);

// ---------- 2. specialties.html card thumbnails ----------
{
  const file = path.join(ROOT, 'specialties.html');
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('class="card-cover"')) {
    console.log('specialties.html: already wired.');
  } else {
    let count = 0;
    content = content.replace(
      /<a href="(specialty-[a-z-]+\.html)" class="card spec-card" data-cat="([^"]+)">([\s\S]*?)<\/a>/g,
      (match, href, cat, inner) => {
        const pillar = href.replace(/\.html$/, '');
        const svg = coverSvg[pillar];
        if (!svg) return match;
        count++;
        return `<a href="${href}" class="card spec-card" data-cat="${cat}"><div class="card-cover">${svg}</div><div class="spec-card-body">${inner}</div></a>`;
      }
    );
    fs.writeFileSync(file, content);
    console.log(`specialties.html: wired ${count} card thumbnails.`);
  }
}

// ---------- 3. services.html row icons ----------
{
  const file = path.join(ROOT, 'services.html');
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('class="row-cover"')) {
    console.log('services.html: already wired.');
  } else {
    let count = 0, rowSkipped = [];
    content = content.replace(
      /<a class="spec-row" href="([a-z0-9-]+\.html)">/g,
      (match, href) => {
        const basename = href.replace(/\.html$/, '');
        const svg = coverSvg[basename];
        if (!svg) { rowSkipped.push(href); return match; }
        count++;
        return `${match}<div class="row-cover">${svg}</div>`;
      }
    );
    fs.writeFileSync(file, content);
    console.log(`services.html: wired ${count} row icons.`);
    if (rowSkipped.length) console.log(`  no pillar match (left as-is): ${rowSkipped.join(', ')}`);
  }
}
