const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts) {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') {
        list = list.concat(getAllFiles(full, exts));
      }
    } else if (exts.some(ext => full.endsWith(ext))) {
      list.push(full);
    }
  }
  return list;
}

// 1. Check all fonts
const htmlFiles = getAllFiles('.', ['.html']);
const localFonts = new Set(fs.readdirSync('assets/fonts'));
const allFontUrls = new Set();

for (const f of htmlFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/https:\/\/fonts\.gstatic\.com\/s\/[^\s"'<>\),`]+/g) || [];
  matches.forEach(m => allFontUrls.add(m));
}

console.log('Total unique Google Font URLs across HTML:', allFontUrls.size);
for (const u of allFontUrls) {
  const fname = path.basename(u);
  if (!localFonts.has(fname)) {
    console.log('Missing font:', u, '->', fname);
  }
}

// 2. Rewrite function for HTML
function rewriteHtml(content) {
  let res = content;

  // External script shims
  res = res.replace(/https:\/\/events\.framer\.com\/script\?v=2/g, '/assets/js/events_framer_shim.js');
  res = res.replace(/https:\/\/framer\.com\/edit\/init\.mjs/g, '/assets/js/edit_shim.js');

  // Framer User Content Sites scripts
  res = res.replace(/https:\/\/framerusercontent\.com\/sites\/4yTGc0YfEEs782AKXgjYhb\//g, '/assets/sites/4yTGc0YfEEs782AKXgjYhb/');

  // Framer icons
  res = res.replace(/https:\/\/framerusercontent\.com\/sites\/icons\//g, '/assets/sites/icons/');

  // Framer images
  res = res.replace(/https:\/\/framerusercontent\.com\/images\//g, '/assets/images/');

  // Framer assets (videos, fonts, etc.)
  res = res.replace(/https:\/\/framerusercontent\.com\/assets\//g, '/assets/assets/');

  // Framer modules
  res = res.replace(/https:\/\/framerusercontent\.com\/modules\//g, '/assets/modules/');

  // Lenis CSS
  res = res.replace(/https:\/\/unpkg\.com\/lenis@1\.3\.23\/dist\/lenis\.css/g, '/assets/css/lenis.css');

  // Google fonts (replace https://fonts.gstatic.com/s/.../font.woff2 with /assets/fonts/font.woff2)
  res = res.replace(/https:\/\/fonts\.gstatic\.com\/s\/[^\s"'<>\),`\/]+\/[^\s"'<>\),`\/]+\/([a-zA-Z0-9_\-]+\.woff2)/g, '/assets/fonts/$1');

  // Navigation link fixups: replace "./works/" with "/works/" etc.
  res = res.replace(/href=["']\.\/works\/([^"']+)["']/g, 'href="/works/$1"');
  res = res.replace(/href=["']\.\/works["']/g, 'href="/works"');
  res = res.replace(/href=["']\.\/about["']/g, 'href="/about"');
  res = res.replace(/href=["']\.\/contact["']/g, 'href="/contact"');
  res = res.replace(/href=["']\.\/["']/g, 'href="/"');

  return res;
}

// 3. Rewrite function for JS / MJS
function rewriteJs(content) {
  let res = content;

  res = res.replace(/https:\/\/framerusercontent\.com\/sites\/4yTGc0YfEEs782AKXgjYhb\//g, '/assets/sites/4yTGc0YfEEs782AKXgjYhb/');
  res = res.replace(/https:\/\/framerusercontent\.com\/images\//g, '/assets/images/');
  res = res.replace(/https:\/\/framerusercontent\.com\/assets\//g, '/assets/assets/');
  res = res.replace(/https:\/\/framerusercontent\.com\/modules\//g, '/assets/modules/');
  res = res.replace(/https:\/\/fonts\.gstatic\.com\/s\/[^\s"'<>\),`\/]+\/[^\s"'<>\),`\/]+\/([a-zA-Z0-9_\-]+\.woff2)/g, '/assets/fonts/$1');
  res = res.replace(/https:\/\/events\.framer\.com\/script\?v=2/g, '/assets/js/events_framer_shim.js');

  return res;
}

console.log('Rewriting HTML files...');
for (const f of htmlFiles) {
  const orig = fs.readFileSync(f, 'utf8');
  const updated = rewriteHtml(orig);
  fs.writeFileSync(f, updated, 'utf8');
  console.log(`Updated ${f}`);
}

console.log('Rewriting JS/MJS files in assets...');
const jsFiles = getAllFiles('assets', ['.mjs', '.js']);
for (const f of jsFiles) {
  const orig = fs.readFileSync(f, 'utf8');
  const updated = rewriteJs(orig);
  if (orig !== updated) {
    fs.writeFileSync(f, updated, 'utf8');
    console.log(`Updated ${f}`);
  }
}

console.log('Rewriting completed successfully!');
