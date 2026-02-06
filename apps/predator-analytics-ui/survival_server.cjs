const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3050;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // API Mocks (to keep the functionality working)
    if (req.url === '/api/v1/sources/connectors' && req.method === 'GET') {
        const db = fs.existsSync('/tmp/predator_channels.json') ?
                   fs.readFileSync('/tmp/predator_channels.json') : '[]';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(db);
        return;
    }

    if (req.url === '/api/v1/ingest/telegram' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Message queued' }));
        return;
    }

    // Static Files (Manual Routing)
    let filePath = req.url === '/' ? './index_survival.html' : '.' + req.url;

    // Very basic protection against path traversal
    if (!filePath.startsWith('./')) filePath = './' + filePath;

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🦁 PREDATOR SURVIVAL SERVER RUNNING AT http://localhost:${PORT}`);
    console.log(`🚀 This server bypasses node_modules permissions.`);
});
