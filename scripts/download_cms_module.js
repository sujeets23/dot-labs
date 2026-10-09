const fs = require('fs');
const path = require('path');

async function download() {
  const url = 'https://framerusercontent.com/modules/wJyTEZjmBpqKLUkmIs39/jHROPnTJHbF4UJfKWfIS/YdEUJ9rDC.js';
  const dest = 'assets/modules/wJyTEZjmBpqKLUkmIs39/jHROPnTJHbF4UJfKWfIS/YdEUJ9rDC.js';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const resp = await fetch(url);
  if (resp.ok) {
    const text = await resp.text();
    fs.writeFileSync(dest, text);
    console.log(`Saved module (${text.length} bytes)`);
    // Check if it imports anything else
    const imports = text.match(/https?:\/\/[^\s"'<>\),`]+/g) || [];
    console.log('Imports/URLs in this module:', [...new Set(imports)]);
  } else {
    console.error('Failed to download module:', resp.status);
  }
}

download();
