const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function proxyRequest(targetUrl, authHeader) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const mod = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Authorization': authHeader, 'User-Agent': 'SupplierManager/1.0' },
      timeout: 10000,
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let url = req.url.split('?')[0];

  // API proxy
  if (url === '/api/test') {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const baseUrl = params.get('url');
    const apiKey = params.get('key');
    if (!baseUrl || !apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing url or key' }));
      return;
    }
    let cleanUrl = baseUrl.replace(/\/+$/, ''); cleanUrl = cleanUrl.replace(/\/v1\/?$/, ''); const targetUrl = cleanUrl + '/v1/models';
    try {
      const start = Date.now();
      const result = await proxyRequest(targetUrl, 'Bearer ' + apiKey);
      const latency = Date.now() - start;
      let models = [];
      let maxContext = 0;
      try {
        const parsed = JSON.parse(result.body);
        if (parsed.data) {
          models = parsed.data.map(m => m.id).slice(0, 30);
          // Try to extract max context length from model metadata
          parsed.data.forEach(m => {
            const ctx = m.context_length || m.max_context || m.max_model_len || m.context_window || 0;
            if (ctx > maxContext) maxContext = ctx;
          });
          if (maxContext >= 1000) maxContext = Math.round(maxContext / 1000);
        }
      } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: result.status >= 200 && result.status < 300, status: result.status, latency, models, maxContext: maxContext || 0 }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // Strip /supplier/ prefix for backward compat
  if (url.startsWith('/supplier/')) url = url.slice(9) || '/';
  if (url.startsWith('/supplier')) url = url.slice(10) || '/';

  // Static files
  let filePath = path.join(DIST, url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Supplier Manager PWA running on port ${PORT}`);
});
