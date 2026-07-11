const { createReadStream, existsSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { extname, normalize, resolve } = require('node:path');

const root = resolve(__dirname, '../..');
const port = Number(process.env.PORT || 5173);
const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.yaml': 'text/yaml'
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (pathname.startsWith('/__http__/')) {
    const send = (status, headers, body) => response.writeHead(status, headers).end(body);
    if (pathname === '/__http__/json') return send(200, { 'Content-Type': 'application/json' }, JSON.stringify({ ok: true, method: request.method }));
    if (pathname === '/__http__/api-error') return send(200, { 'Content-Type': 'application/json' }, JSON.stringify({ error: 'application failed' }));
    if (pathname === '/__http__/text') return send(200, { 'Content-Type': 'text/plain' }, 'plain text');
    if (pathname === '/__http__/head') return send(200, { 'Content-Type': 'text/plain' }, '');
    if (pathname === '/__http__/headers') return send(200, { 'Content-Type': 'application/json', 'Session-Id': 'session-test', 'Device-Id': 'device-test' }, JSON.stringify({ ok: true }));
    if (pathname === '/__http__/inspect') {
      const chunks = [];
      request.on('data', chunk => chunks.push(chunk));
      request.on('end', () => send(200, { 'Content-Type': 'application/json' }, JSON.stringify({ method: request.method, headers: request.headers, body: Buffer.concat(chunks).toString() })));
      return;
    }
    if (pathname === '/__http__/error') return send(422, { 'Content-Type': 'application/json' }, JSON.stringify({ error: 'validation failed' }));
    if (pathname === '/__http__/binary') return send(200, { 'Content-Type': 'application/octet-stream' }, Buffer.from([0, 1, 2, 255]));
    if (pathname === '/__http__/delay') return setTimeout(() => send(200, { 'Content-Type': 'application/json' }, JSON.stringify({ ok: true })), 100);
    if (pathname === '/__http__/form') {
      const chunks = [];
      request.on('data', chunk => chunks.push(chunk));
      request.on('end', () => send(200, { 'Content-Type': 'application/json' }, JSON.stringify({ contentType: request.headers['content-type'] || '', body: Buffer.concat(chunks).toString() })));
      return;
    }
    return send(404, { 'Content-Type': 'application/json' }, JSON.stringify({ error: 'not found' }));
  }
  const file = resolve(root, `.${normalize(pathname)}`);
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1');
