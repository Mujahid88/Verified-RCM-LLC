#!/usr/bin/env node
// Builds css/style.css from the component files in css/src/.
//
// The site has no other build step (plain static HTML, no bundler), and
// every page's <link rel="stylesheet" href="css/style.css"> stays pointed
// at this one generated file — nothing about page markup changes.
//
// Edit the small files under css/src/, not this generated file directly:
// re-running this script overwrites css/style.css from source every time.
//
// Usage:  node css/build.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUT_FILE = path.join(__dirname, 'style.css');

const files = fs.readdirSync(SRC_DIR)
  .filter(f => f.endsWith('.css'))
  .sort(); // numeric prefixes (00-, 01-, ... 13-) fix the cascade order

if (!files.length) {
  console.error('No .css files found in css/src/ — nothing to build.');
  process.exit(1);
}

const banner = `/* ============================================================
   GENERATED FILE — do not edit directly.
   Source lives in css/src/*.css (14 files, one per UI area: nav,
   buttons, cards, services, specialties, article furniture, etc).
   Edit those, then run:  node css/build.js
   This file is what every page's <link href="css/style.css"> loads.
   ============================================================ */

`;

const parts = files.map(f => fs.readFileSync(path.join(SRC_DIR, f), 'utf8').replace(/\s+$/, ''));
const output = banner + parts.join('\n\n');

fs.writeFileSync(OUT_FILE, output + '\n');
console.log(`Built css/style.css from ${files.length} files in css/src/:`);
files.forEach(f => console.log(`  ${f}`));
console.log(`Output: ${OUT_FILE} (${output.length} bytes)`);
