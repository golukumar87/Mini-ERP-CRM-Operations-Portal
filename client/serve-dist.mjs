import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const preferredPort = Number(process.env.CLIENT_PORT || 3000);
const shouldAutoPort = process.env.CLIENT_AUTO_PORT !== 'false';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const rawPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safePath = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(distDir, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const listen = (port, attempts = 0) => {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && shouldAutoPort && attempts < 20) {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      listen(port + 1, attempts + 1);
      return;
    }

    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Run with CLIENT_PORT=3001 or close the old process.`);
      process.exit(1);
    }

    throw error;
  });

  server.listen(port, () => {
    console.log(`Frontend running on http://localhost:${port}`);
  });
};

listen(preferredPort);
