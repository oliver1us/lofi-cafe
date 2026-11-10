import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachPresence } from './presence.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const rootPath = resolve(root);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  let file = resolve(root, `.${pathname}`);
  if (file !== rootPath && !file.startsWith(rootPath + sep)) { res.writeHead(403).end(); return; }
  try {
    let info;
    try { info = await stat(file); } catch { /* Fall through to SPA route handling. */ }
    if (!info?.isFile()) {
      if (extname(pathname)) { res.writeHead(404).end(); return; }
      file = resolve(root, 'index.html'); info = await stat(file);
    }
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(500).end('Run npm run build before starting the server.'); }
});
attachPresence(server);
server.listen(Number(process.env.PORT || 5173), '0.0.0.0', () => console.log(`lofi.cafe → http://localhost:${process.env.PORT || 5173}`));
