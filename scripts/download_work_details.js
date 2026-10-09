const fs = require('fs');

async function download(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return await resp.text();
}

async function run() {
  const slugs = [
    '36ixtybooths',
    'pai-creator-summit',
    'pai-convention-hall',
    'mystoria-agency',
    'ayunurt',
    'apsara-ice-creams',
    'skmei',
    'saasinnova',
    'aicjklu'
  ];

  if (!fs.existsSync('works')) {
    fs.mkdirSync('works');
  }

  for (const slug of slugs) {
    const url = `https://dotlabsupdated.framer.website/works/${slug}`;
    console.log(`Downloading ${url}...`);
    try {
      const html = await download(url);
      fs.writeFileSync(`works/${slug}.html`, html);
      console.log(`Saved works/${slug}.html (${html.length} bytes)`);
    } catch (e) {
      console.error(`Failed ${slug}: ${e.message}`);
    }
  }
}

run();
