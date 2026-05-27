const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const SUPPLIERS_FILE = path.join(DATA_DIR, 'suppliers.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ========== Data Layer ==========

function readJSON(filePath, fallback = []) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return fallback; }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getSuppliers() { return readJSON(SUPPLIERS_FILE); }
function saveSuppliers(list) { writeJSON(SUPPLIERS_FILE, list); }

function getLogs(limit = 200) {
  const logs = readJSON(LOGS_FILE);
  return logs.slice(-limit);
}

function addLog(entry) {
  const logs = readJSON(LOGS_FILE);
  logs.push({ ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), timestamp: new Date().toISOString() });
  // Keep max 1000 logs
  if (logs.length > 1000) logs.splice(0, logs.length - 1000);
  writeJSON(LOGS_FILE, logs);
}

// ========== HTTP Proxy ==========

function proxyRequest(targetUrl, authHeader) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const mod = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 0),
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

// ========== MIME Types ==========

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

// ========== Body Parser ==========

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

// ========== Server ==========

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const urlObj = new URL(req.url, 'http://localhost');
  const pathname = urlObj.pathname;

  // --- API: Suppliers CRUD ---
  if (pathname === '/api/suppliers' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getSuppliers()));
    return;
  }

  if (pathname === '/api/suppliers' && req.method === 'POST') {
    const body = await parseBody(req);
    const suppliers = getSuppliers();
    const newSupplier = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: body.name || '',
      icon: body.icon || '🤖',
      baseUrl: body.baseUrl || '',
      apiKey: body.apiKey || '',
      models: body.models || [],
      status: 'offline',
      latency: 0,
      contextLength: body.contextLength || 0,
      createdAt: Date.now(),
    };
    suppliers.push(newSupplier);
    saveSuppliers(suppliers);
    addLog({ type: 'supplier_add', supplier: newSupplier.name, detail: `Base URL: ${newSupplier.baseUrl}` });
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newSupplier));
    return;
  }

  // PUT/DELETE /api/suppliers/:id
  const supplierMatch = pathname.match(/^\/api\/suppliers\/(.+)$/);
  if (supplierMatch && (req.method === 'PUT' || req.method === 'DELETE')) {
    const id = supplierMatch[1];
    const suppliers = getSuppliers();
    const idx = suppliers.findIndex(s => s.id === id);

    if (req.method === 'DELETE') {
      if (idx >= 0) {
        const removed = suppliers.splice(idx, 1)[0];
        saveSuppliers(suppliers);
        addLog({ type: 'supplier_delete', supplier: removed.name, detail: `ID: ${id}` });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
      }
      return;
    }

    if (req.method === 'PUT') {
      const body = await parseBody(req);
      if (idx >= 0) {
        Object.assign(suppliers[idx], body);
        saveSuppliers(suppliers);
        addLog({ type: 'supplier_update', supplier: suppliers[idx].name, detail: `Updated fields: ${Object.keys(body).join(', ')}` });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(suppliers[idx]));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
      }
      return;
    }
  }

  // --- API: Test Connection ---
  if (pathname === '/api/test') {
    const baseUrl = urlObj.searchParams.get('url');
    const apiKey = urlObj.searchParams.get('key');
    const supplierName = urlObj.searchParams.get('name') || 'unknown';
    if (!baseUrl || !apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing url or key' }));
      return;
    }
    let cleanUrl = baseUrl.replace(/\/+$/, '');
    cleanUrl = cleanUrl.replace(/\/v1\/?$/, '');
    const targetUrl = cleanUrl + '/v1/models';
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
          parsed.data.forEach(m => {
            const ctx = m.context_length || m.max_context || m.max_model_len || m.context_window || 0;
            if (ctx > maxContext) maxContext = ctx;
          });
          if (maxContext >= 1000) maxContext = Math.round(maxContext / 1000);
        }
      } catch {}
      const ok = result.status >= 200 && result.status < 300;
      addLog({
        type: 'api_test',
        supplier: supplierName,
        url: targetUrl,
        status: result.status,
        latency,
        models: models.length,
        ok,
        detail: ok ? `${models.length} models, ${maxContext}K context` : `HTTP ${result.status}`,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok, status: result.status, latency, models, maxContext: maxContext || 0 }));
    } catch (e) {
      addLog({ type: 'api_test', supplier: supplierName, url: targetUrl, status: 0, latency: 0, models: 0, ok: false, detail: e.message });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // --- API: Logs ---
  if (pathname === '/api/logs' && req.method === 'GET') {
    const limit = parseInt(urlObj.searchParams.get('limit') || '200');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getLogs(limit)));
    return;
  }

  if (pathname === '/api/logs' && req.method === 'DELETE') {
    writeJSON(LOGS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // --- Static Files ---
  let filePath = pathname;
  if (filePath.startsWith('/supplier/')) filePath = filePath.slice(9) || '/';
  if (filePath.startsWith('/supplier')) filePath = filePath.slice(10) || '/';

  let fullPath = path.join(DIST, filePath);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    fullPath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(fullPath);
  const mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(fullPath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Supplier Manager PWA running on port ${PORT}`);
});
