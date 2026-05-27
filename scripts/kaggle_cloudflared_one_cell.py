# KAGGLE CLOUDFLARED ONE-CELL: скопiй усe в одну кодову клiтинку i натисни Run
# Вимоги: CPU Only, Internet ON
# Cloudflared quick tunnel — без акаунта, без токена

import subprocess, sys, os, re, threading, time

# 1. Залежностi
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "fastapi", "uvicorn[standard]", "psutil", "httpx"])

# 2. Запис backend
backend = r'''
import os, subprocess, threading, time
from datetime import UTC, datetime
import psutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PREDATOR Analytics Kaggle Node", version="63.2-ELITE")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OODALoop:
    def __init__(self):
        self.is_running = False
        self.current_phase = "IDLE"
        self.cycles_completed = 0
        self.logs = []
        self._lock = threading.Lock()
    def start(self):
        with self._lock:
            if self.is_running: return
            self.is_running = True
        threading.Thread(target=self._run, daemon=True).start()
    def stop(self):
        with self._lock:
            self.is_running = False
            self.current_phase = "IDLE"
    def _run(self):
        phases = ["OBSERVE", "ORIENT", "DECIDE", "ACT"]
        descriptions = {
            "OBSERVE": "Сканування транзакційних потоків...",
            "ORIENT": "Аналіз відхилень від Gold Pattern v5.0...",
            "DECIDE": "Формування стратегії превентивного блокування...",
            "ACT": "Впровадження правил у Risk Engine...",
        }
        while self.is_running:
            for phase in phases:
                if not self.is_running: break
                self.current_phase = phase
                ts = datetime.now().strftime("%H:%M:%S")
                self.logs.append(f"[{ts}] {phase}: {descriptions[phase]}")
                if len(self.logs) > 40: self.logs.pop(0)
                time.sleep(8)
            self.cycles_completed += 1

ooda = OODALoop()

@app.get("/api/v1/health")
async def health():
    mem = psutil.virtual_memory()
    return {
        "status": "ONLINE",
        "mode": "KAGGLE_CPU_NATIVE",
        "node": "KAGGLE_RESERVE",
        "timestamp": datetime.now(UTC).isoformat(),
        "ram_used_gb": round(mem.used / 1024**3, 2),
        "ram_total_gb": round(mem.total / 1024**3, 2),
        "ram_percent": mem.percent,
        "cpu_percent": psutil.cpu_percent(interval=0.1),
    }

@app.get("/api/v1/factory/ooda")
async def get_ooda():
    return {
        "is_running": ooda.is_running,
        "current_phase": ooda.current_phase,
        "cycles": ooda.cycles_completed,
        "logs": ooda.logs,
    }

@app.post("/api/v1/factory/infinite/start")
async def start_ooda():
    ooda.start()
    return {"status": "started"}

@app.post("/api/v1/factory/infinite/stop")
async def stop_ooda():
    ooda.stop()
    return {"status": "stopped"}

@app.get("/api/v1/tornado/stats")
async def tornado_stats():
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "modules": [
            {"id": "forecast", "accuracy": 94.2, "status": "ACTIVE"},
            {"id": "market", "entities": 1200, "status": "LIVE"},
            {"id": "graph", "nodes": 45000, "status": "ACTIVE"},
            {"id": "diligence", "flags": 12, "status": "ACTIVE"},
            {"id": "anomaly", "tps": 847, "status": "LIVE"},
            {"id": "scenario", "active": 3, "status": "WAR_ROOM"},
        ],
    }

@app.get("/api/v1/risk/company/{ueid}")
async def company_risk(ueid: str):
    return {
        "ueid": ueid,
        "score": 74.2,
        "level": "CRITICAL",
        "layers": {"structural": 88, "behavioral": 62, "sanctions": 95, "aml": 45},
        "explanation": "Виявлено аномальну активність у Kaggle CPU node.",
    }

@app.get("/api/v1/osint/diligence/{ueid}")
async def diligence(ueid: str):
    return {
        "ueid": ueid,
        "name": "ТОВ ТЕСТОВА КОМПАНІЯ",
        "red_flags": ["SUDDEN_DIRECTOR_CHANGE", "HIGH_DEBT_RATIO"],
        "summary": "Високий ризик фіктивності. Рекомендовано поглиблений аудит.",
    }

# Додаткові ендпоінти для повної сумісності з frontend
@app.get("/api/v1/agents")
async def agents():
    return {
        "agents": [
            {"id": "sentinel-1", "name": "Sentinel V1", "status": "ACTIVE", "type": "monitoring"},
            {"id": "sentinel-2", "name": "Sentinel V2", "status": "STANDBY", "type": "analysis"},
        ]
    }

@app.get("/api/v1/system/stats")
async def system_stats():
    mem = psutil.virtual_memory()
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "ram_used_gb": round(mem.used / 1024**3, 2),
        "ram_total_gb": round(mem.total / 1024**3, 2),
        "ram_percent": mem.percent,
        "disk_used_gb": round(psutil.disk_usage('/').used / 1024**3, 2),
        "disk_total_gb": round(psutil.disk_usage('/').total / 1024**3, 2),
    }

@app.get("/api/v1/system/nodes")
async def system_nodes():
    return {
        "nodes": [
            {"id": "kaggle-cpu", "name": "Kaggle CPU Node", "status": "ONLINE", "role": "compute"},
            {"id": "kaggle-reserve", "name": "Kaggle Reserve", "status": "ONLINE", "role": "backup"},
        ]
    }

@app.get("/api/v1/system/logs/stream")
async def system_logs_stream(limit: int = 50):
    return {
        "logs": [
            {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": "Kaggle backend initialized"},
            {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": "OODA Loop running"},
        ][:limit]
    }

@app.get("/api/v1/factory/stats")
async def factory_stats():
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "patterns_processed": 1247,
        "anomalies_detected": 23,
        "accuracy": 94.2,
    }

@app.get("/api/v1/factory/patterns/gold")
async def gold_patterns():
    return {
        "patterns": [
            {"id": "pattern-1", "name": "Gold Pattern v5.0", "accuracy": 96.5, "status": "ACTIVE"},
            {"id": "pattern-2", "name": "Fraud Detection v3.2", "accuracy": 89.1, "status": "ACTIVE"},
        ]
    }

@app.get("/api/v1/wargaming/scenarios")
async def wargaming_scenarios():
    return {
        "scenarios": [
            {"id": "scenario-1", "name": "Customs Crisis Simulation", "status": "ACTIVE"},
            {"id": "scenario-2", "name": "Sanctions Evasion Detection", "status": "STANDBY"},
        ]
    }

@app.get("/api/v1/companies")
async def companies(search: str = "", limit: int = 25, offset: int = 0):
    return {
        "companies": [
            {"ueid": "COMP-001", "name": "ТОВ ТЕСТОВА КОМПАНІЯ", "status": "ACTIVE"},
            {"ueid": "COMP-002", "name": "ПП ЕКСПЕРТ", "status": "ACTIVE"},
        ][:limit],
        "total": 2,
        "limit": limit,
        "offset": offset,
    }

@app.get("/api/v1/alerts")
async def alerts(limit: int = 6):
    return {
        "alerts": [
            {"id": "alert-1", "severity": "CRITICAL", "message": "High risk company detected", "timestamp": datetime.now(UTC).isoformat()},
            {"id": "alert-2", "severity": "WARNING", "message": "Unusual transaction pattern", "timestamp": datetime.now(UTC).isoformat()},
        ][:limit]
    }

@app.get("/api/v1/dashboard/overview")
async def dashboard_overview():
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "total_companies": 1247,
        "high_risk": 23,
        "alerts_today": 5,
        "ooda_cycles": ooda.cycles_completed,
    }

@app.post("/api/v1/finance/portfolio-risk/var")
async def portfolio_var():
    return {
        "var_95": 124500.0,
        "var_99": 234000.0,
        "confidence": 0.95,
    }

@app.get("/api/v1/graph/summary")
async def graph_summary():
    return {
        "nodes": 45000,
        "edges": 127000,
        "components": 847,
        "largest_component": 41200,
    }

@app.get("/api/v1/osint/tools")
async def osint_tools():
    return {
        "tools": [
            {"id": "tool-1", "name": "Company Registry Lookup", "status": "ACTIVE"},
            {"id": "tool-2", "name": "Sanctions Screening", "status": "ACTIVE"},
        ]
    }

@app.post("/api/v1/system/diagnostics/run")
async def run_diagnostics():
    return {
        "status": "completed",
        "timestamp": datetime.now(UTC).isoformat(),
        "results": {"cpu": "OK", "memory": "OK", "disk": "OK"},
    }

@app.get("/api/v1/system/metrics/history")
async def metrics_history():
    return {
        "metrics": [
            {"timestamp": datetime.now(UTC).isoformat(), "cpu": 12.5, "memory": 45.2},
            {"timestamp": datetime.now(UTC).isoformat(), "cpu": 15.1, "memory": 46.8},
        ]
    }

@app.get("/api/v1/system/nexus/scenarios")
async def nexus_scenarios():
    return {
        "scenarios": [
            {"id": "nexus-1", "name": "Supply Chain Analysis", "status": "ACTIVE"},
        ]
    }

@app.get("/api/v1/health/ready")
async def health_ready():
    return {"status": "ready"}

@app.get("/api/v1/azr/status")
async def azr_status():
    return {"status": "ONLINE", "mode": "KAGGLE_CPU"}

def run_cloudflared_tunnel(port: int = 8000):
    import urllib.request, re
    cf_path = "/kaggle/working/cloudflared"
    if not os.path.exists(cf_path):
        print("Завантаження cloudflared...")
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
        subprocess.run(f"wget -q {url} -O {cf_path} && chmod +x {cf_path}", shell=True, check=False)
    if not os.path.exists(cf_path):
        print("ERROR: cloudflared не завантажився")
        return
    process = subprocess.Popen(
        [cf_path, "tunnel", "--url", f"http://localhost:{port}"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    for line in process.stdout:
        print(f"[cloudflared] {line.rstrip()}", flush=True)
        # try-cloudflared.com — це quick tunnel
        match = re.search(r"(https://[a-z0-9-]+\.trycloudflare\.com)", line)
        if match:
            print("\n" + "=" * 60, flush=True)
            print("PREDATOR KAGGLE CPU NODE IS LIVE", flush=True)
            print(f"PUBLIC URL: {match.group(1)}", flush=True)
            print("=" * 60 + "\n", flush=True)

if __name__ == "__main__":
    import uvicorn
    threading.Thread(target=run_cloudflared_tunnel, args=(8000,), daemon=True).start()
    ooda.start()
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

with open('/kaggle/working/predator_app.py', 'w') as f:
    f.write(backend)

# 3. Запуск backend + cloudflared
print("Запуск PREDATOR Kaggle Backend (cloudflared)...")
subprocess.run([sys.executable, "/kaggle/working/predator_app.py"])
