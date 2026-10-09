const fs = require('fs');
const path = require('path');

async function downloadCms() {
  const dir1 = 'assets/cms/wJyTEZjmBpqKLUkmIs39/jHROPnTJHbF4UJfKWfIS';
  const dir2 = 'assets/modules/wJyTEZjmBpqKLUkmIs39/jHROPnTJHbF4UJfKWfIS';
  fs.mkdirSync(dir1, { recursive: true });
  fs.mkdirSync(dir2, { recursive: true });

  const files = [
    'YdEUJ9rDC-chunk-default-0.framercms',
    'YdEUJ9rDC-indexes-default-0.framercms'
  ];

  for (const f of files) {
    const url = `https://framerusercontent.com/modules/wJyTEZjmBpqKLUkmIs39/jHROPnTJHbF4UJfKWfIS/${f}`;
    console.log(`Downloading ${url}...`);
    const resp = await fetch(url);
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(path.join(dir1, f), buf);
    fs.writeFileSync(path.join(dir2, f), buf);
    console.log(`Saved ${f} (${buf.length} bytes) to cms and modules directories`);
  }
}

downloadCms().then(() => {
  // Now fix new URL(..., "/assets/...") in all JS files
  const jsDir = 'assets/sites/4yTGc0YfEEs782AKXgjYhb';
  for (const f of fs.readdirSync(jsDir)) {
    const full = path.join(jsDir, f);
    let code = fs.readFileSync(full, 'utf8');
    // Replace new URL(..., "/assets/...") with new URL(..., (typeof location!=="undefined"?location.origin:"http://localhost:3000") + "/assets/...")
    // or new URL(..., window.location.origin + "/assets/...")
    if (code.includes('new URL(')) {
      const updated = code.replace(/new URL\(([^,]+),\s*`\/assets\//g, 'new URL($1, (typeof location!=="undefined"?location.origin:"http://localhost:3000")+`/assets/');
      if (updated !== code) {
        fs.writeFileSync(full, updated, 'utf8');
        console.log(`Fixed new URL() in ${f}`);
      }
    }
  }
}).catch(console.error);
