<<<<<<< HEAD
const logger = require('./src/utils/logger.js');
=======
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd
// HEADY_BRAND:BEGIN
// ╔══════════════════════════════════════════════════════════════════╗
// ║  ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                     ║
// ║  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                     ║
// ║  ███████║█████╗  ███████║██║  ██║ ╚████╔╝                      ║
// ║  ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                       ║
// ║  ██║  ██║███████╗██║  ██║██████╔╝   ██║                        ║
// ║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                        ║
// ║                                                                  ║
// ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces    ║
// ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
// ║  FILE: quick-server.js                                                    ║
// ║  LAYER: root                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3300;

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, 'public', filePath);
    
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json'
    };
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (req.url === '/api/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, service: 'heady-manager', version: '3.0.0' }));
                return;
            }
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(content);
    });
});

server.listen(PORT, () => {
<<<<<<< HEAD
    logger.info(`✅ HeadyManager RUNNING on http://manager.local:${PORT}`);
    logger.info(`🌐 Website: http://app.local:${PORT}`);
    logger.info(`📊 Health: http://manager.local:${PORT}/api/health`);
=======
    console.log(`✅ HeadyManager RUNNING on http://manager.local:${PORT}`);
    console.log(`🌐 Website: http://app.local:${PORT}`);
    console.log(`📊 Health: http://manager.local:${PORT}/api/health`);
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd
});

