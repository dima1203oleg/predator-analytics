
const http = require('http');

const PORT = 8000;

// Shared State
let state = {
    etl_running: false,
    stage: "IDLE",
    progress: 0,
    records_total: 245000,
    records_processed: 0,
    records_indexed: 0,
    message: ""
};

function startSimulation() {
    console.log("🚀 Auto-Starting ETL Simulation for 'customs_march_2024' (245k records)");
    state.etl_running = true;
    state.stage = "PARSING";
    state.message = "Reading file header...";

    let progress = 0;

    // 1. Parsing
    let parseInterval = setInterval(() => {
        progress += 10;
        state.progress = progress;
        state.message = `Scanning rows... ${((progress/100)*245).toFixed(1)}k found`;

        if (progress >= 100) {
            clearInterval(parseInterval);
            startTransform();
        }
    }, 500);
}

function startTransform() {
    state.stage = "TRANSFORMING";
    state.progress = 0;
    state.records_processed = 0;

    let progress = 0;
    let transformInterval = setInterval(() => {
        progress += 2;
        state.progress = progress;
        state.records_processed += (245000 / 50);
        state.message = `Mapping Schema... ${(state.records_processed/1000).toFixed(1)}k mapped`;

        if (progress >= 100) {
            clearInterval(transformInterval);
            startIndexing();
        }
    }, 400);
}

function startIndexing() {
    state.stage = "INDEXING";
    state.progress = 0;
    state.records_indexed = 0;
    state.records_processed = 245000;

    let progress = 0;
    let indexInterval = setInterval(() => {
        progress += 2;
        state.progress = progress;
        state.records_indexed += (245000 / 50);
        state.message = `Vectorizing... ${(state.records_indexed/1000).toFixed(1)}k indexed`;

        if (progress >= 100) {
            clearInterval(indexInterval);
            complete();
        }
    }, 400);
}

function complete() {
    state.stage = "COMPLETED";
    state.progress = 100;
    state.records_indexed = 245000;
    state.etl_running = false;
    state.message = "Done";
    console.log("✅ ETL Simulation Completed");
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url.includes('system/status')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });

        let lastJob = null;
        if (state.stage !== "IDLE") {
            let jobState = "CREATED";
            if (state.stage === "PARSING") jobState = "UPLOADING";
            if (state.stage === "TRANSFORMING") jobState = "PROCESSING";
            if (state.stage === "INDEXING") jobState = "INDEXING";
            if (state.stage === "COMPLETED") jobState = "COMPLETED";

            lastJob = {
                id: "sim-job-001",
                state: jobState,
                progress: {
                    percent: state.progress,
                    records_total: state.records_total,
                    records_processed: state.records_processed,
                    records_indexed: state.records_indexed,
                    message: state.message
                }
            };
        }

        const response = {
            metrics: { cpu_usage: 45.2, ram_usage: 62.1 },
            data_pipeline: {
                etl_running: state.etl_running,
                global_progress: state.etl_running ? state.progress : 100,
                last_sync_time: "2026-01-30T12:00:00Z",
                records_synced: state.records_indexed,
                last_job: lastJob
            },
            opensearch: {
                opensearch_healthy: true,
                qdrant_healthy: true,
                opensearch_docs: 125000 + state.records_indexed,
                qdrant_vectors: 125000 + state.records_indexed
            },
            automl: { is_running: false },
            flower: { superlink_connected: true }
        };
        res.end(JSON.stringify(response));
        return;
    }

    if (req.url.includes('api/v25/etl/process-local') || req.url.includes('trigger')) {
        if (!state.etl_running) {
            startSimulation();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: "started" }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: "already_running" }));
        }
        return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "alive" }));
});

// Auto-start
startSimulation();

server.listen(PORT, () => {
    console.log(`🔥 Predator ETL Engine (Node.js) running on port ${PORT}`);
});
