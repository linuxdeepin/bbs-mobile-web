const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist/h5');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.html': 'text/html' };

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname.startsWith('/api/')) {
    response.writeHead(501, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'API requests must be mocked by the browser test' }));
    return;
  }
  let filename = path.resolve(root, `.${pathname}`);
  if (!filename.startsWith(`${root}/`) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    filename = path.join(root, 'index.html');
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
  fs.createReadStream(filename).pipe(response);
}).listen(4201, '127.0.0.1');
