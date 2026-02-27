const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3030;
const baseDir = '/Users/dima-mac/Documents/Predator_21/apps/v45_active/dist';

http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    let filePath = path.join(baseDir, url === '/' ? 'index.html' : url);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Fallback to index.html for SPA routing
            fs.readFile(path.join(baseDir, 'index.html'), (err2, data2) => {
                if (err2) {
                    res.writeHead(404);
                    res.end("Not Found");
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data2);
            });
            return;
        }

        // Basic content types
        const ext = path.extname(filePath);
        const map = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };
        res.writeHead(200, { 'Content-Type': map[ext] || 'text/plain' });
        res.end(data);
    });
}).listen(port, '0.0.0.0', () => console.log(`Server running at http://localhost:${port}/`));
