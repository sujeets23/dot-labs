const fs = require('fs');

const html = fs.readFileSync('page.html', 'utf8');
console.log('HTML Length:', html.length);

const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Found scripts (' + scripts.length + '):', scripts.slice(0, 10));

const links = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Found links (' + links.length + '):', links.slice(0, 10));

// Check title and meta
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
console.log('Title:', titleMatch ? titleMatch[1] : 'No title');

// Check routes or internal links
const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
const internalHrefs = [...new Set(hrefs.filter(h => h.startsWith('/') || h.includes('dotlabsupdated.framer.website')))];
console.log('Internal routes / links:', internalHrefs);

// Check all image and asset URLs
const urls = [...html.matchAll(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s"'<>)]+/g)].map(m => m[0]);
console.log('Total URLs found:', urls.length);
const domains = [...new Set(urls.map(u => {
    try { return new URL(u).hostname; } catch(e) { return null; }
}).filter(Boolean))];
console.log('Domains referenced:', domains);
