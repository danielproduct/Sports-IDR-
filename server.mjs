import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/engine.js', ['engine.js', 'text/javascript; charset=utf-8']],
  ['/sample-data.js', ['sample-data.js', 'text/javascript; charset=utf-8']]
]);
const port = Number(process.env.PORT ?? 4173);
const host = '127.0.0.1';

const server = http.createServer(async (req, res) => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...headers, Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  let pathname;
  try { pathname = new URL(req.url, `http://${host}:${port}`).pathname; }
  catch { res.writeHead(400, headers); res.end(); return; }
  if (!files.has(pathname)) {
    res.writeHead(404, headers); res.end('Not found');
    return;
  }
  const [filename, type] = files.get(pathname);
  try {
    const contents = await readFile(join(root, filename));
    res.writeHead(200, { ...headers, 'Content-Type': type });
    res.end(req.method === 'HEAD' ? undefined : contents);
  } catch {
    res.writeHead(500, headers);
    res.end('Unable to read demo file');
  }
});
server.listen(port, host, () => {
  console.log(`Collins Cross FC IDR demo: http://${host}:${port}`);
});