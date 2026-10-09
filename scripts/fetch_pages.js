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
  const targets = [
    { url: 'https://dotlabsupdated.framer.website/contact', file: 'contact.html' },
    { url: 'https://dotlabsupdated.framer.website/thank-you', file: 'thank-you.html' }
  ];

  for (const t of targets) {
    console.log(`Downloading ${t.url}...`);
    try {
      const text = await download(t.url);
      fs.writeFileSync(t.file, text);
      console.log(`Saved ${t.file} (${text.length} bytes)`);
    } catch (e) {
      console.error(`Failed ${t.url}: ${e.message}`);
    }
  }

  // Let's check works.html for detail links
  if (fs.existsSync('works.html')) {
    const worksHtml = fs.readFileSync('works.html', 'utf8');
    const links = [...worksHtml.matchAll(/href=["'](\/works\/[^"'#?]+)["']/g)].map(m => m[1]);
    const uniqueLinks = [...new Set(links)];
    console.log('Found detail links in works.html:', uniqueLinks);

    for (const link of uniqueLinks) {
      const slug = link.replace('/works/', '');
      const file = `works_${slug}.html`;
      console.log(`Downloading ${link} -> ${file}...`);
      try {
        const text = await download(`https://dotlabsupdated.framer.website${link}`);
        fs.writeFileSync(file, text);
        console.log(`Saved ${file} (${text.length} bytes)`);
      } catch (e) {
        console.error(`Failed ${link}: ${e.message}`);
      }
    }
  }
}

run();
