// Tiny zero-dependency static server for local preview:  node serve.js  →  http://localhost:4321
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname;
const TYPES = { '.html':'text/html;charset=utf-8', '.css':'text/css;charset=utf-8', '.js':'text/javascript;charset=utf-8',
  '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json', '.jpg':'image/jpeg' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
  if (!f.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(d);
  });
}).listen(4321, () => console.log('Balkis site → http://localhost:4321'));
