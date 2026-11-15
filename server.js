const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

function serveFile(request, response) {
  const requestPath = request.url.split('?')[0] || '/';
  const requestedPath = requestPath === '/' ? '/index.html' : requestPath;
  const threeDir = path.join(__dirname, 'node_modules', 'three');
  const addonRequest = requestedPath.startsWith('/vendor/addons/');
  const moduleRequest = ['/vendor/three.module.js', '/vendor/three.core.js'].includes(requestedPath);
  const baseDir = addonRequest ? path.join(threeDir, 'examples', 'jsm') : moduleRequest ? path.join(threeDir, 'build') : publicDir;
  const relativePath = addonRequest ? requestedPath.slice('/vendor/addons/'.length) : moduleRequest ? path.basename(requestedPath) : requestedPath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(baseDir, relativePath);
  const relativeToBase = path.relative(baseDir, filePath);

  if (relativeToBase.startsWith('..') || path.isAbsolute(relativeToBase)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    response.end(file);
  });
}

http.createServer(serveFile).listen(port, () => {
  console.log(`Astra-01 disponible en http://localhost:${port}`);
});
