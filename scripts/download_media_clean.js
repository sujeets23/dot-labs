const fs = require('fs');
const path = require('path');

function getAllFiles(dir) {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') {
        list = list.concat(getAllFiles(full));
      }
    } else if (full.endsWith('.html') || full.endsWith('.mjs') || full.endsWith('.js')) {
      list.push(full);
    }
  }
  return list;
}

const files = getAllFiles('.');
const targetUrls = new Set();

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');

  // Match all exact URLs ending in extension
  const re = /https:\/\/framerusercontent\.com\/(?:assets|images)\/([a-zA-Z0-9_\-]+)\.([a-zA-Z0-9]+)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const fullUrl = `https://framerusercontent.com/${match[0].includes('/assets/') ? 'assets' : 'images'}/${match[1]}.${match[2]}`;
    targetUrls.add(fullUrl);
  }

  // Also match google fonts
  const fontRe = /https:\/\/fonts\.gstatic\.com\/[^\s"'<>\),`]+/g;
  while ((match = fontRe.exec(content)) !== null) {
    targetUrls.add(match[0]);
  }
}

console.log(`Discovered ${targetUrls.size} clean media/asset URLs across all codebase.`);

async function downloadClean() {
  let downloaded = 0;
  let skipped = 0;
  for (const url of targetUrls) {
    try {
      const u = new URL(url);
      let localPath;
      if (u.hostname === 'fonts.gstatic.com') {
        localPath = path.join('assets/fonts', path.basename(u.pathname));
      } else if (u.pathname.startsWith('/assets/')) {
        localPath = path.join('assets/assets', path.basename(u.pathname));
      } else if (u.pathname.startsWith('/images/')) {
        localPath = path.join('assets/images', path.basename(u.pathname));
      } else {
        localPath = path.join('assets/misc', path.basename(u.pathname));
      }

      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
        skipped++;
        continue;
      }

      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (resp.ok) {
        const buffer = Buffer.from(await resp.arrayBuffer());
        fs.writeFileSync(localPath, buffer);
        console.log(`[OK] (${buffer.length} B) ${url} -> ${localPath}`);
        downloaded++;
      } else {
        console.warn(`[FAIL ${resp.status}] ${url}`);
      }
    } catch (e) {
      console.error(`Error for ${url}:`, e.message);
    }
  }
  console.log(`Completed. Downloaded: ${downloaded}, Skipped (already exist): ${skipped}`);
}

downloadClean();
