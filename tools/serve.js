'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = Number(process.argv[2] || 8777);
const root = path.resolve(__dirname, '..', 'site');
const types = { '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (pathname.includes('\0') || pathname.includes('\\')) {
    res.writeHead(400); res.end('Bad request'); return;
  }
  let file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  let code = 200;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    file = path.join(root, '404.html'); code = 404;
  }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(500); res.end('Preview file unavailable'); return; }
    res.writeHead(code, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}).listen(port, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:' + port));
