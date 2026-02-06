const http = require('http');
const fs = require('fs');

const PORT = 3030;
const HOST = '0.0.0.0';
const DB_PATH = '/tmp/predator_channels.json';

// Persistent store for channels (Lite DB)
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

// In-memory Job Tracking
let ACTIVE_JOBS = {};
let LAST_JOB = null;

const JOB_STATES = ['CREATED', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'PROCESSED', 'INDEXING', 'INDEXED', 'COMPLETED'];

// Simulation Engine: Advance all active jobs every 2 seconds
setInterval(() => {
    Object.keys(ACTIVE_JOBS).forEach(id => {
        const job = ACTIVE_JOBS[id];
        if (job.state === 'COMPLETED') return;

        // Increment percent
        job.progress.percent += 5;

        // Transition states
        if (job.progress.percent >= 100) {
            const currentIndex = JOB_STATES.indexOf(job.state);
            if (currentIndex < JOB_STATES.length - 1) {
                job.state = JOB_STATES[currentIndex + 1];
                job.progress.percent = 0;
                job.progress.message = `Executing stage: ${job.state}...`;

                // When COMPLETED, update the channel's item count
                if (job.state === 'COMPLETED') {
                    job.progress.percent = 100;
                    job.progress.message = 'Pipeline Finished Successully';
                    incrementChannelItems(job.source_id);
                }
            }
        }
    });
}, 2000);

function incrementChannelItems(sourceId) {
    try {
        const channels = JSON.parse(fs.readFileSync(DB_PATH));
        const idx = channels.findIndex(c => c.id === sourceId);
        if (idx !== -1) {
            channels[idx].itemsCount = (channels[idx].itemsCount || 0) + Math.floor(Math.random() * 500) + 200;
            fs.writeFileSync(DB_PATH, JSON.stringify(channels));
        }
    } catch (e) {}
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    console.log(`[GATEWAY] ${req.method} ${req.url}`);

    // --- CONNECTORS ---
    if (req.method === 'GET' && (req.url === '/api/v1/sources/connectors' || req.url === '/api/v1/sources')) {
        const channels = JSON.parse(fs.readFileSync(DB_PATH));
        const connectors = channels.map(c => ({
            id: c.id,
            name: c.name,
            type: 'telegram',
            source_type: 'telegram',
            status: ACTIVE_JOBS[c.id] && ACTIVE_JOBS[c.id].state !== 'COMPLETED' ? 'syncing' : 'active',
            lastSync: new Date().toISOString(),
            itemsCount: c.itemsCount || 0,
            description: c.url
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(connectors));
        return;
    }

    // --- INGEST TELEGRAM ---
    if (req.method === 'POST' && req.url === '/api/v1/ingest/telegram') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const channels = JSON.parse(fs.readFileSync(DB_PATH));

                const source_id = 'tg-' + Date.now();
                const newChannel = {
                    id: source_id,
                    name: data.name || data.url.split('/').pop(),
                    url: data.url,
                    itemsCount: 0,
                    created_at: new Date().toISOString()
                };

                channels.push(newChannel);
                fs.writeFileSync(DB_PATH, JSON.stringify(channels));

                // Create Job
                const job = {
                    id: 'job-' + Date.now(),
                    source_id: source_id,
                    state: 'CREATED',
                    progress: { percent: 0, message: 'Initiating Neural Handshake...', records_total: 1200 }
                };
                ACTIVE_JOBS[source_id] = job;
                LAST_JOB = job;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', source_id: source_id, job_id: job.id }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // --- JOB STATUS ---
    if (req.method === 'GET' && req.url.startsWith('/api/v1/ingest/status/')) {
        const source_id = req.url.split('/').pop();
        const job = ACTIVE_JOBS[source_id] || { state: 'COMPLETED', progress: { percent: 100, message: 'Idle' } };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(job));
        return;
    }

    // --- SYSTEM STATUS (Vite/Omniscience Core) ---
    if (req.method === 'GET' && (req.url === '/api/v1/system/status' || req.url === '/api/v1/status')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
           status: 'OPERATIONAL',
           health_score: 98.4,
           data_pipeline: {
              etl_running: LAST_JOB && LAST_JOB.state !== 'COMPLETED',
              global_progress: LAST_JOB ? (LAST_JOB.state === 'COMPLETED' ? 100 : LAST_JOB.progress.percent) : 100,
              last_job: LAST_JOB,
              postgresql: { status: 'OK' },
              qdrant: { status: 'OK' }
           },
           opensearch: { opensearch_healthy: true, opensearch_docs: 8420 },
           qdrant: { qdrant_healthy: true, qdrant_vectors: 8420 },
           advisor_note: LAST_JOB && LAST_JOB.state !== 'COMPLETED' ? "Parsing High-Density Neural Stream" : "System in Optimal State"
        }));
        return;
    }

    // --- OTHER STUBS ---
    if (req.method === 'GET' && req.url === '/api/v1/monitoring/alerts') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
        return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'offline-mode', message: 'Endpoint not implemented' }));
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 v30 Lite Gateway running on http://${HOST}:${PORT}`);
});
