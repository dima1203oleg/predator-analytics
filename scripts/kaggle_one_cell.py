# KAGGLE ONE-CELL: скопiюй цей файл повнiстю у одну кодову клiтинку Kaggle Notebook i натисни Run
# Вимоги: Kaggle Notebook, CPU Only, Internet ON

import subprocess
import sys

# 1. Залежностi
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "fastapi", "uvicorn[standard]", "psutil", "httpx"])

# 2. Запис backend
backend = r'''
import os, re, subprocess, threading, time
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

def run_zrok_tunnel(token: str):
    zrok_path = "/kaggle/working/zrok"
    if not os.path.exists(zrok_path):
        print("Завантаження останньої версії zrok...")
        try:
            import urllib.request, json
            with urllib.request.urlopen("https://api.github.com/repos/openziti/zrok/releases/latest", timeout=10) as r:
                rel = json.loads(r.read())
                tag = rel.get("tag_name", "v1.0.0")
        except Exception as e:
            print(f"GitHub API error: {e}")
            tag = "v1.0.0"
        ver = tag.lstrip("v")
        url = f"https://github.com/openziti/zrok/releases/download/{tag}/zrok_{ver}_linux_amd64.tar.gz"
        subprocess.run(f"wget -q {url} -O /tmp/zrok.tar.gz && tar -xzf /tmp/zrok.tar.gz -C /tmp/ && find /tmp -maxdepth 2 -name 'zrok' -type f -exec cp {{}} {zrok_path} \; 2>/dev/null; chmod +x {zrok_path} 2>/dev/null", shell=True, check=False)
    if not os.path.exists(zrok_path):
        print("ERROR: zrok binary not found after extraction")
        return
    subprocess.run([zrok_path, "disable"], capture_output=True)
    subprocess.run([zrok_path, "enable", token], check=False)
    process = subprocess.Popen(
        [zrok_path, "share", "public", "http://localhost:8000", "--headless"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    for line in process.stdout:
        print(f"[zrok] {line.rstrip()}", flush=True)
        match = re.search(r"https://[a-z0-9]+\.shares?\.zrok\.io", line)
        if match:
            print("\n" + "=" * 60, flush=True)
            print("PREDATOR KAGGLE CPU NODE IS LIVE", flush=True)
            print(f"PUBLIC URL: {match.group(0)}", flush=True)
            print("=" * 60 + "\n", flush=True)

if __name__ == "__main__":
    import uvicorn
    token = os.getenv("ZROK_TOKEN", "1eeje4um7yvA")
    threading.Thread(target=run_zrok_tunnel, args=(token,), daemon=True).start()
    ooda.start()
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

with open('/kaggle/working/predator_app.py', 'w') as f:
    f.write(backend)

# 3. Запуск backend + zrok
print("Запуск PREDATOR Kaggle Backend...")
subprocess.run([sys.executable, "/kaggle/working/predator_app.py"])
