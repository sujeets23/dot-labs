const fs = require('fs');
const path = require('path');

// Ensure directories
const DIRS = [
  'assets/sites/4yTGc0YfEEs782AKXgjYhb',
  'assets/sites/icons',
  'assets/images',
  'assets/assets',
  'assets/fonts',
  'assets/css'
];

for (const d of DIRS) {
  fs.mkdirSync(d, { recursive: true });
}

// Concurrency pool
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (concurrency <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return; // Already downloaded
  }
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!resp.ok) {
      console.warn(`[WARN] HTTP ${resp.status} for ${url}`);
      return;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    console.log(`[OK] Downloaded ${url} -> ${destPath} (${buffer.length} bytes)`);
  } catch (err) {
    console.error(`[ERR] Failed ${url}: ${err.message}`);
  }
}

// Recursive script crawler
const processedScripts = new Set();
const scriptQueue = [];

function queueScript(url) {
  // normalize
  if (url.startsWith('./')) {
    url = 'https://framerusercontent.com/sites/4yTGc0YfEEs782AKXgjYhb/' + url.slice(2);
  }
  if (!url.startsWith('http')) return;
  if (!processedScripts.has(url)) {
    processedScripts.add(url);
    scriptQueue.push(url);
  }
}

async function crawlScripts() {
  console.log('--- Crawling JS/MJS modules ---');
  while (scriptQueue.length > 0) {
    const currentBatch = scriptQueue.splice(0, 10);
    await mapConcurrent(currentBatch, 5, async (url) => {
      try {
        const u = new URL(url);
        let localPath;
        if (u.pathname.includes('/sites/4yTGc0YfEEs782AKXgjYhb/')) {
          const fname = path.basename(u.pathname);
          localPath = path.join('assets/sites/4yTGc0YfEEs782AKXgjYhb', fname);
        } else {
          localPath = path.join('assets', u.hostname, u.pathname);
        }

        await downloadFile(url, localPath);

        if (fs.existsSync(localPath)) {
          const content = fs.readFileSync(localPath, 'utf8');
          // Find imports
          const importMatches = [
            ...content.matchAll(/import\s*\(?["'](\.[^"']+)["']\)?/g),
            ...content.matchAll(/from\s*["'](\.[^"']+)["']/g),
            ...content.matchAll(/import\s*["'](\.[^"']+)["']/g)
          ];
          for (const m of importMatches) {
            let rel = m[1];
            if (rel.startsWith('./')) {
              queueScript('https://framerusercontent.com/sites/4yTGc0YfEEs782AKXgjYhb/' + rel.slice(2));
            }
          }
          const absMatches = content.match(/https:\/\/framerusercontent\.com\/sites\/4yTGc0YfEEs782AKXgjYhb\/[a-zA-Z0-9_\-\.]+\.mjs/g) || [];
          for (const a of absMatches) {
            queueScript(a);
          }
        }
      } catch (e) {
        console.error(`Error processing script ${url}:`, e.message);
      }
    });
  }
  console.log(`Finished crawling scripts. Total processed: ${processedScripts.size}`);
}

async function main() {
  // Step 1: Collect seed scripts from HTML
  function scanDir(dir) {
    let files = [];
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        if (f !== 'node_modules' && f !== '.git' && f !== 'assets') files = files.concat(scanDir(full));
      } else if (f.endsWith('.html')) {
        files.push(full);
      }
    }
    return files;
  }

  const htmlFiles = scanDir('.');
  console.log(`Found ${htmlFiles.length} HTML files to inspect.`);

  const imageMap = new Map(); // cleanUrl -> originalUrls
  const fontMap = new Map();
  const assetMap = new Map();

  for (const hf of htmlFiles) {
    const html = fs.readFileSync(hf, 'utf8');
    
    // Scripts
    const sMatches = html.match(/https:\/\/framerusercontent\.com\/sites\/4yTGc0YfEEs782AKXgjYhb\/[a-zA-Z0-9_\-\.]+\.mjs/g) || [];
    sMatches.forEach(queueScript);

    // Images
    const iMatches = html.match(/https:\/\/framerusercontent\.com\/images\/[a-zA-Z0-9_\-\.]+(?:\.[a-zA-Z0-9]+)?/g) || [];
    for (const img of iMatches) {
      const clean = img.split('?')[0];
      imageMap.set(clean, img);
    }

    // Fonts
    const fMatches = html.match(/https:\/\/fonts\.gstatic\.com\/[^\s"'<>\)]+/g) || [];
    for (const font of fMatches) {
      const clean = font.split('?')[0].replace(/[,'")\]]+$/, '');
      fontMap.set(clean, font);
    }

    // framer assets
    const aMatches = html.match(/https:\/\/framerusercontent\.com\/assets\/[^\s"'<>\)]+/g) || [];
    for (const a of aMatches) {
      const clean = a.split('?')[0].replace(/[,'")\]]+$/, '');
      assetMap.set(clean, a);
    }
  }

  // Also download lenis css
  await downloadFile('https://unpkg.com/lenis@1.3.23/dist/lenis.css', 'assets/css/lenis.css');

  // Also download favicons
  await downloadFile('https://framerusercontent.com/sites/icons/default-favicon-light.v1.png', 'assets/sites/icons/default-favicon-light.v1.png');
  await downloadFile('https://framerusercontent.com/sites/icons/default-favicon-dark.v1.png', 'assets/sites/icons/default-favicon-dark.v1.png');
  await downloadFile('https://framerusercontent.com/sites/icons/default-touch-icon.v3.png', 'assets/sites/icons/default-touch-icon.v3.png');

  // Crawl scripts first so we can discover any images inside scripts!
  await crawlScripts();

  // Scan all downloaded scripts for additional images, fonts, and assets!
  const downloadedScripts = fs.readdirSync('assets/sites/4yTGc0YfEEs782AKXgjYhb').map(f => path.join('assets/sites/4yTGc0YfEEs782AKXgjYhb', f));
  console.log(`Scanning ${downloadedScripts.length} downloaded script modules for embedded assets...`);
  for (const sf of downloadedScripts) {
    const code = fs.readFileSync(sf, 'utf8');
    const iMatches = code.match(/https:\/\/framerusercontent\.com\/images\/[a-zA-Z0-9_\-\.]+(?:\.[a-zA-Z0-9]+)?/g) || [];
    for (const img of iMatches) {
      const clean = img.split('?')[0];
      imageMap.set(clean, img);
    }
    const fMatches = code.match(/https:\/\/fonts\.gstatic\.com\/[^\s"'<>\)]+/g) || [];
    for (const font of fMatches) {
      const clean = font.split('?')[0].replace(/[,'")\]]+$/, '');
      fontMap.set(clean, font);
    }
    const aMatches = code.match(/https:\/\/framerusercontent\.com\/assets\/[^\s"'<>\)]+/g) || [];
    for (const a of aMatches) {
      const clean = a.split('?')[0].replace(/[,'")\]]+$/, '');
      assetMap.set(clean, a);
    }
  }

  console.log(`Total images to download: ${imageMap.size}`);
  console.log(`Total fonts to download: ${fontMap.size}`);
  console.log(`Total framer assets to download: ${assetMap.size}`);

  // Download all images
  console.log('--- Downloading Images ---');
  await mapConcurrent([...imageMap.keys()], 6, async (imgUrl) => {
    const fname = path.basename(imgUrl);
    const dest = path.join('assets/images', fname);
    await downloadFile(imgUrl, dest);
  });

  // Download all fonts
  console.log('--- Downloading Fonts ---');
  await mapConcurrent([...fontMap.keys()], 6, async (fontUrl) => {
    const fname = path.basename(fontUrl);
    const dest = path.join('assets/fonts', fname);
    await downloadFile(fontUrl, dest);
  });

  // Download all framer assets
  console.log('--- Downloading Framer Assets ---');
  await mapConcurrent([...assetMap.keys()], 6, async (aUrl) => {
    const fname = path.basename(aUrl);
    const dest = path.join('assets/assets', fname);
    await downloadFile(aUrl, dest);
  });

  console.log('All downloads completed successfully!');
}

main().catch(console.error);
