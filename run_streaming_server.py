
import http.server
import json
import random
import re
import socketserver
import threading
import time


PORT = 3005

# Shared State
state = {
    "etl_running": False,
    "stage": "IDLE",
    "progress": 0,
    "records_total": 245000,
    "records_processed": 0,
    "records_indexed": 0,
    "message": ""
}

def etl_simulation_thread():
    """Simulates the ETL process over time."""
    global state
    print("🚀 Auto-Starting ETL Simulation for 'customs_march_2024' (245k records)")

    state["etl_running"] = True
    state["stage"] = "PARSING"
    state["message"] = "Reading file header..."
    time.sleep(2)

    # 1. Parsing / Uploading
    for i in range(0, 101, 10):
        state["progress"] = i
        state["message"] = f"Scanning rows... {(i/100)*245:.1f}k found"
        time.sleep(0.5)

    state["stage"] = "TRANSFORMING"
    state["progress"] = 0
    state["records_processed"] = 0

    # 2. Transforming
    total_chunks = 50
    for i in range(total_chunks):
        state["progress"] = int((i / total_chunks) * 100)
        state["records_processed"] += 4900 # 245000 / 50
        state["message"] = f"Mapping Schema... {state['records_processed']/1000:.1f}k mapped"
        time.sleep(0.4)

    state["stage"] = "INDEXING"
    state["progress"] = 0
    state["records_indexed"] = 0
    state["records_processed"] = 245000

    # 3. Indexing
    for i in range(total_chunks):
        state["progress"] = int((i / total_chunks) * 100)
        state["records_indexed"] += 4900
        state["message"] = f"Vectorizing... {state['records_indexed']/1000:.1f}k indexed"
        time.sleep(0.4)

    state["stage"] = "COMPLETED"
    state["progress"] = 100
    state["records_indexed"] = 245000
    state["etl_running"] = False
    state["message"] = "Done"
    print("✅ ETL Simulation Completed")

class JSONRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-type")
        self.end_headers()

    def do_GET(self):
        path = self.path

        # Add headers
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        if "system/status" in path:
            # Construct the complex response expected by the UI
            is_running = state["etl_running"]

            # Construct last_job object based on state
            last_job = None
            if state["stage"] != "IDLE":
                job_state = "CREATED"
                if state["stage"] == "PARSING": job_state = "UPLOADING"
                if state["stage"] == "TRANSFORMING": job_state = "PROCESSING"
                if state["stage"] == "INDEXING": job_state = "INDEXING"
                if state["stage"] == "COMPLETED": job_state = "COMPLETED"

                last_job = {
                    "id": "sim-job-001",
                    "state": job_state,
                    "progress": {
                        "percent": state["progress"],
                        "records_total": state["records_total"],
                        "records_processed": state["records_processed"],
                        "records_indexed": state["records_indexed"],
                        "message": state["message"]
                    }
                }

            response = {
                "metrics": {"cpu_usage": 45.2, "ram_usage": 62.1},
                "data_pipeline": {
                    "etl_running": is_running,
                    "global_progress": state["progress"] if is_running else 100,
                    "last_sync_time": "2026-01-30T12:00:00Z",
                    "records_synced": state["records_indexed"],
                    "last_job": last_job
                },
                "opensearch": {
                    "opensearch_healthy": True,
                    "qdrant_healthy": True,
                    "opensearch_docs": 125000 + state["records_indexed"],
                    "qdrant_vectors": 125000 + state["records_indexed"]
                },
                "automl": {"is_running": False},
                "flower": {"superlink_connected": True}
            }
            self.wfile.write(json.dumps(response).encode())
            return

        if "etl/jobs" in path:
            self.wfile.write(json.dumps({"jobs": []}).encode())
            return

        # Default fallback
        self.wfile.write(json.dumps({"status": "alive"}).encode())

    def do_POST(self):
        # Handle manual trigger
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        if "etl/process-local" in self.path or "trigger" in self.path:
            # Re-trigger simulation
            if not state["etl_running"]:
                t = threading.Thread(target=etl_simulation_thread)
                t.daemon = True
                t.start()
                self.wfile.write(json.dumps({"status": "started"}).encode())
            else:
                 self.wfile.write(json.dumps({"status": "already_running"}).encode())
            return

        self.wfile.write(json.dumps({"status": "ok"}).encode())

# Auto-start logic on launch
t = threading.Thread(target=etl_simulation_thread)
t.daemon = True
t.start()

print(f"🔥 Predator High-Performance ETL Engine (Mock) running on port {PORT}")
httpd = socketserver.TCPServer(("127.0.0.1", PORT), JSONRequestHandler)
httpd.serve_forever()
