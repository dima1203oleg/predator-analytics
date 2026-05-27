# KAGGLE NGROK ONE-CELL: скопiй усe в одну кодову клiтинку i натисни Run
# Вимоги: CPU Only, Internet ON
# Примітка: ngrok безкоштовний план — тимчасовий URL, 1 тунель

import subprocess, sys, os, re, threading, time, json

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

def run_ngrok_tunnel(port: int = 8000):
    import urllib.request, json, re
    ngrok_path = "/kaggle/working/ngrok"
    if not os.path.exists(ngrok_path):
        print("Завантаження ngrok...")
        url = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"
        subprocess.run(f"wget -q {url} -O /tmp/ngrok.tgz && tar -xzf /tmp/ngrok.tgz -C /kaggle/working/ && chmod +x {ngrok_path}", shell=True, check=False)
    if not os.path.exists(ngrok_path):
        print("ERROR: ngrok не завантажився")
        return
    # Спробувати без токена (безкоштовний план)
    token = os.getenv("NGROK_AUTHTOKEN", "")
    if token:
        subprocess.run([ngrok_path, "config", "add-authtoken", token], capture_output=True)
    process = subprocess.Popen(
        [ngrok_path, "http", str(port), "--log=stdout"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    for line in process.stdout:
        print(f"[ngrok] {line.rstrip()}", flush=True)
        # Шукаємо URL у логах
        match = re.search(r"url=(https://[a-z0-9-]+\.ngrok-free\.app)", line)
        if match:
            print("\n" + "=" * 60, flush=True)
            print("PREDATOR KAGGLE CPU NODE IS LIVE", flush=True)
            print(f"PUBLIC URL: {match.group(1)}", flush=True)
            print("=" * 60 + "\n", flush=True)

if __name__ == "__main__":
    import uvicorn
    threading.Thread(target=run_ngrok_tunnel, args=(8000,), daemon=True).start()
    ooda.start()
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

with open('/kaggle/working/predator_app.py', 'w') as f:
    f.write(backend)

# 3. Запуск backend + ngrok
print("Запуск PREDATOR Kaggle Backend (ngrok)...")
subprocess.run([sys.executable, "/kaggle/working/predator_app.py"])
