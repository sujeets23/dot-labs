const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon'
};

function serveFile(req, res, filePath, contentType) {
  try {
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    // Support HTTP Range requests for MP4 video streaming
    if (range && (contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fileStream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000, immutable'
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server Error: ' + err.message);
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize route
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Check direct file in root or assets
  let candidatePath = path.join(__dirname, pathname);

  // 1. Exact file exists
  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    const ext = path.extname(candidatePath).toLowerCase();
    serveFile(req, res, candidatePath, MIME_TYPES[ext] || 'application/octet-stream');
    return;
  }

  // 2. Extension-less route (e.g. /works -> works.html, /about -> about.html)
  if (fs.existsSync(candidatePath + '.html')) {
    serveFile(req, res, candidatePath + '.html', MIME_TYPES['.html']);
    return;
  }

  // 3. Subdirectory index (e.g. /works/ -> works.html or works/index.html)
  if (fs.existsSync(path.join(candidatePath, 'index.html'))) {
    serveFile(req, res, path.join(candidatePath, 'index.html'), MIME_TYPES['.html']);
    return;
  }

  // 4. Detail routes like /works/36ixtybooths -> works/36ixtybooths.html
  if (pathname.startsWith('/works/')) {
    const slug = pathname.replace('/works/', '');
    const detailFile = path.join(__dirname, 'works', slug + '.html');
    if (fs.existsSync(detailFile)) {
      serveFile(req, res, detailFile, MIME_TYPES['.html']);
      return;
    }
  }

  // 5. Fallback for assets if requested without /assets/ prefix
  if (pathname.startsWith('/images/')) {
    const p = path.join(__dirname, 'assets', pathname);
    if (fs.existsSync(p)) {
      const ext = path.extname(p).toLowerCase();
      serveFile(req, res, p, MIME_TYPES[ext] || 'application/octet-stream');
      return;
    }
  }

  if (pathname.startsWith('/fonts/')) {
    const p = path.join(__dirname, 'assets', pathname);
    if (fs.existsSync(p)) {
      const ext = path.extname(p).toLowerCase();
      serveFile(req, res, p, MIME_TYPES[ext] || 'application/octet-stream');
      return;
    }
  }

  // 6. Handle 404
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>404 Not Found</h1>');
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
