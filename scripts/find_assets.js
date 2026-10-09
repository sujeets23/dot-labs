const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(getAllFiles(full, exts));
      }
    } else {
      if (exts.some(ext => file.endsWith(ext))) {
        results.push(full);
      }
    }
  }
  return results;
}

const htmlFiles = getAllFiles('.', ['.html']);
console.log('HTML files found:', htmlFiles);

const assetUrls = new Set();
const scriptUrls = new Set();
const imageUrls = new Set();
const fontUrls = new Set();

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');

  // Match all framerusercontent.com URLs
  const urls = content.match(/https?:\/\/[^"'\s<>)`]+(?:\.[a-zA-Z0-9]+[^\s"'<>)`]*)/g) || [];
  for (let u of urls) {
    u = u.replace(/[,\)]+$/, ''); // clean trailing punctuation
    if (u.includes('framerusercontent.com') || u.includes('fonts.gstatic.com') || u.includes('unpkg.com')) {
      assetUrls.add(u);
      if (u.includes('/images/')) imageUrls.add(u);
      else if (u.endsWith('.mjs') || u.endsWith('.js')) scriptUrls.add(u);
      else if (u.includes('fonts.gstatic.com') || u.endsWith('.woff2') || u.endsWith('.woff') || u.endsWith('.ttf')) fontUrls.add(u);
    }
  }

  // Also check srcset
  const srcsets = [...content.matchAll(/srcset=["']([^"']+)["']/g)].map(m => m[1]);
  for (const ss of srcsets) {
    const parts = ss.split(',').map(p => p.trim().split(/\s+/)[0]);
    for (const p of parts) {
      if (p.startsWith('http')) {
        assetUrls.add(p);
        if (p.includes('/images/')) imageUrls.add(p);
      }
    }
  }
}

console.log('Total unique external assets found in HTML:', assetUrls.size);
console.log('  Image URLs:', imageUrls.size);
console.log('  Script URLs:', scriptUrls.size);
console.log('  Font URLs:', fontUrls.size);
console.log('Sample images:', [...imageUrls].slice(0, 5));
console.log('Sample scripts:', [...scriptUrls].slice(0, 5));
console.log('Sample fonts:', [...fontUrls].slice(0, 5));
