# KAGGLE CLOUDFLARED ONE-CELL v64.0: з SQLite базою даних
# Вимоги: CPU Only, Internet ON
# Cloudflared quick tunnel — без акаунта, без токена

import subprocess
import sys

# 1. Залежностi
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "fastapi", "uvicorn[standard]", "psutil", "httpx", "sqlalchemy", "aiosqlite"])

# 2. Запис backend
backend_code = '''import os, subprocess, threading, time
from datetime import UTC, datetime
import psutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import aiosqlite

# SQLite база даних
DATABASE_URL = "sqlite+aiosqlite:///./predator.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

# Моделі бази даних
class Company(Base):
    __tablename__ = "companies"
    ueid = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")
    risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True)
    severity = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))
    company_ueid = Column(String, nullable=True)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    ueid = Column(String, primary_key=True)
    score = Column(Float, nullable=False)
    level = Column(String, nullable=False)
    structural = Column(Float, default=0.0)
    behavioral = Column(Float, default=0.0)
    sanctions = Column(Float, default=0.0)
    aml = Column(Float, default=0.0)
    explanation = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC))

app = FastAPI(title="PREDATOR Analytics Kaggle Node", version="64.0-ELITE")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ініціалізація бази даних
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed дані
    async with async_session() as session:
        from sqlalchemy import select, func
        if (await session.execute(select(func.count()).select_from(Company))).scalar() == 0:
            seed_companies = [
                Company(ueid="COMP-001", name="ТОВ ТЕСТОВА КОМПАНІЯ", status="ACTIVE", risk_score=74.2),
                Company(ueid="COMP-002", name="ПП ЕКСПЕРТ", status="ACTIVE", risk_score=45.0),
                Company(ueid="COMP-003", name="ТОВ АЛЬФА ГРУП", status="ACTIVE", risk_score=88.5),
                Company(ueid="COMP-004", name="ПП БЕТА СЕРВІС", status="ACTIVE", risk_score=32.0),
                Company(ueid="COMP-005", name="ТОВ ГАММА ТРЕЙД", status="ACTIVE", risk_score=91.2),
            ]
            for company in seed_companies:
                session.add(company)
        
        if (await session.execute(select(func.count()).select_from(Alert))).scalar() == 0:
            seed_alerts = [
                Alert(id="alert-1", severity="CRITICAL", message="High risk company detected", company_ueid="COMP-005"),
                Alert(id="alert-2", severity="WARNING", message="Unusual transaction pattern", company_ueid="COMP-001"),
                Alert(id="alert-3", severity="INFO", message="New company registered", company_ueid="COMP-004"),
            ]
            for alert in seed_alerts:
                session.add(alert)
        
        if (await session.execute(select(func.count()).select_from(RiskAssessment))).scalar() == 0:
            seed_risks = [
                RiskAssessment(ueid="COMP-001", score=74.2, level="CRITICAL", structural=88, behavioral=62, sanctions=95, aml=45, explanation="Виявлено аномальну активність у Kaggle CPU node."),
                RiskAssessment(ueid="COMP-002", score=45.0, level="MEDIUM", structural=55, behavioral=40, sanctions=30, aml=50, explanation="Помірний ризик фіктивності."),
                RiskAssessment(ueid="COMP-005", score=91.2, level="CRITICAL", structural=95, behavioral=88, sanctions=98, aml=75, explanation="Критичний ризик санкційних порушень."),
            ]
            for risk in seed_risks:
                session.add(risk)
        
        await session.commit()

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
    async with async_session() as session:
        from sqlalchemy import select
        query = select(RiskAssessment).where(RiskAssessment.ueid == ueid)
        result = await session.execute(query)
        risk = result.scalar_one_or_none()
        
        if risk:
            return {
                "ueid": risk.ueid,
                "score": risk.score,
                "level": risk.level,
                "layers": {
                    "structural": risk.structural,
                    "behavioral": risk.behavioral,
                    "sanctions": risk.sanctions,
                    "aml": risk.aml,
                },
                "explanation": risk.explanation,
            }
        else:
            return {
                "ueid": ueid,
                "score": 50.0,
                "level": "MEDIUM",
                "layers": {"structural": 50, "behavioral": 50, "sanctions": 50, "aml": 50},
                "explanation": "Дані про ризик не знайдено в базі.",
            }

@app.get("/api/v1/osint/diligence/{ueid}")
async def diligence(ueid: str):
    async with async_session() as session:
        from sqlalchemy import select
        query = select(Company).where(Company.ueid == ueid)
        result = await session.execute(query)
        company = result.scalar_one_or_none()
        
        if company:
            red_flags = []
            if company.risk_score >= 70:
                red_flags.append("HIGH_RISK_SCORE")
            if company.risk_score >= 80:
                red_flags.append("SANCTIONS_RISK")
            if company.risk_score >= 90:
                red_flags.append("CRITICAL_FRAUD_RISK")
            
            return {
                "ueid": ueid,
                "name": company.name,
                "red_flags": red_flags if red_flags else ["NO_FLAGS"],
                "summary": f"Ризик компанії: {company.risk_score}. Статус: {company.status}.",
            }
        else:
            return {
                "ueid": ueid,
                "name": "Невідома компанія",
                "red_flags": ["COMPANY_NOT_FOUND"],
                "summary": "Компанію не знайдено в базі даних.",
            }

# CRUD ендпоінти для компаній
@app.post("/api/v1/companies")
async def create_company(ueid: str, name: str, status: str = "ACTIVE", risk_score: float = 0.0):
    async with async_session() as session:
        company = Company(ueid=ueid, name=name, status=status, risk_score=risk_score)
        session.add(company)
        await session.commit()
        await session.refresh(company)
        return {"ueid": company.ueid, "name": company.name, "status": company.status, "risk_score": company.risk_score}

@app.put("/api/v1/companies/{ueid}")
async def update_company(ueid: str, name: str = None, status: str = None, risk_score: float = None):
    async with async_session() as session:
        from sqlalchemy import select
        query = select(Company).where(Company.ueid == ueid)
        result = await session.execute(query)
        company = result.scalar_one_or_none()
        
        if company:
            if name is not None:
                company.name = name
            if status is not None:
                company.status = status
            if risk_score is not None:
                company.risk_score = risk_score
            await session.commit()
            await session.refresh(company)
            return {"ueid": company.ueid, "name": company.name, "status": company.status, "risk_score": company.risk_score}
        else:
            return {"error": "Company not found"}, 404

@app.delete("/api/v1/companies/{ueid}")
async def delete_company(ueid: str):
    async with async_session() as session:
        from sqlalchemy import select
        query = select(Company).where(Company.ueid == ueid)
        result = await session.execute(query)
        company = result.scalar_one_or_none()
        
        if company:
            await session.delete(company)
            await session.commit()
            return {"message": "Company deleted"}
        else:
            return {"error": "Company not found"}, 404

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
    async with async_session() as session:
        from sqlalchemy import select, func
        query = select(Company)
        if search:
            query = query.where(Company.name.ilike(f"%{search}%"))
        total_query = select(func.count()).select_from(query.subquery())
        total_result = await session.execute(total_query)
        total = total_result.scalar()
        
        query = query.offset(offset).limit(limit)
        result = await session.execute(query)
        companies = result.scalars().all()
        
        return {
            "companies": [
                {"ueid": c.ueid, "name": c.name, "status": c.status, "risk_score": c.risk_score}
                for c in companies
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

@app.get("/api/v1/alerts")
async def alerts(limit: int = 6):
    async with async_session() as session:
        from sqlalchemy import select
        query = select(Alert).order_by(Alert.timestamp.desc()).limit(limit)
        result = await session.execute(query)
        alerts = result.scalars().all()
        
        return {
            "alerts": [
                {
                    "id": a.id,
                    "severity": a.severity,
                    "message": a.message,
                    "timestamp": a.timestamp.isoformat(),
                    "company_ueid": a.company_ueid,
                }
                for a in alerts
            ]
        }

@app.get("/api/v1/dashboard/overview")
async def dashboard_overview():
    async with async_session() as session:
        from sqlalchemy import select, func
        total_companies = await session.execute(select(func.count()).select_from(Company))
        high_risk = await session.execute(select(func.count()).select_from(Company).where(Company.risk_score >= 70))
        alerts_today = await session.execute(select(func.count()).select_from(Alert).where(Alert.timestamp >= datetime.now(UTC).replace(hour=0, minute=0, second=0)))
        
        return {
            "timestamp": datetime.now(UTC).isoformat(),
            "total_companies": total_companies.scalar(),
            "high_risk": high_risk.scalar(),
            "alerts_today": alerts_today.scalar(),
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
        match = re.search(r"(https://[a-z0-9-]+\\.trycloudflare\\.com)", line)
        if match:
            print("\\n" + "=" * 60, flush=True)
            print("PREDATOR KAGGLE CPU NODE IS LIVE", flush=True)
            print(f"PUBLIC URL: {match.group(1)}", flush=True)
            print("=" * 60 + "\\n", flush=True)

if __name__ == "__main__":
    import uvicorn
    threading.Thread(target=run_cloudflared_tunnel, args=(8000,), daemon=True).start()
    ooda.start()
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

with open('/kaggle/working/predator_app.py', 'w') as f:
    f.write(backend_code)

# 3. Запуск backend + cloudflared
print("Запуск PREDATOR Kaggle Backend (cloudflared) v64.0 з SQLite...")
subprocess.run([sys.executable, "/kaggle/working/predator_app.py"])
