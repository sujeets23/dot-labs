const fs = require('fs');
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  const pages = ['/', '/works', '/about', '/contact', '/thank-you'];
  const allLinks = new Set();

  for (const page of pages) {
    console.log(`Fetching https://dotlabsupdated.framer.website${page}...`);
    try {
      const res = await fetchUrl(`https://dotlabsupdated.framer.website${page}`);
      console.log(`  Status: ${res.status}, Length: ${res.data.length}`);

      const fileName = page === '/' ? 'index.html' : page.replace('/', '') + '.html';
      fs.writeFileSync(fileName, res.data);

      const matches = res.data.matchAll(/href=["'](\/works\/[^"']+)["']/g);
      for (const m of matches) {
        allLinks.add(m[1]);
      }
      const otherMatches = res.data.matchAll(/href=["'](\/[a-zA-Z0-9\-_]+)["']/g);
      for (const m of otherMatches) {
        allLinks.add(m[1]);
      }
    } catch (err) {
      console.error(`Error fetching ${page}:`, err.message);
    }
  }

  console.log('Discovered internal routes:');
  for (const link of allLinks) {
    console.log(' - ' + link);
  }

  // Also fetch the detail pages discovered
  for (const link of allLinks) {
    if (pages.includes(link)) continue;
    console.log(`Fetching https://dotlabsupdated.framer.website${link}...`);
    try {
      const res = await fetchUrl(`https://dotlabsupdated.framer.website${link}`);
      console.log(`  Status: ${res.status}, Length: ${res.data.length}`);
      const safeName = link.replace(/^\//, '').replace(/\//g, '_') + '.html';
      fs.writeFileSync(safeName, res.data);
    } catch (e) {
      console.error(`Error fetching ${link}:`, e.message);
    }
  }
}

main();
