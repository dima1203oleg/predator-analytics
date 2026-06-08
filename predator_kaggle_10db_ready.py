#!/usr/bin/env python3
"""🦅 PREDATOR Analytics v66.0-ELITE: Kaggle 10-DB Ready-to-Run"""

from collections import defaultdict
from datetime import UTC, datetime, timedelta
import hashlib
import json
import os
import re
import subprocess
import sys
import tarfile
import threading
import time
import urllib.request

ZROK_TOKEN = "1eeje4um7yvA"
SECRET_KEY = "predator-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ─── NEST_ASYNCIO ────────────────────────────────────────────────
try:
    import nest_asyncio
    nest_asyncio.apply()
    print("✅ nest_asyncio активовано")
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "nest_asyncio"])
    import nest_asyncio
    nest_asyncio.apply()
    print("✅ nest_asyncio встановлено")

# ─── ЗАЛЕЖНОСТІ ─────────────────────────────────────────────────
print("📦 Перевірка залежностей...")
try:
    import aiosqlite
    import fastapi
    import httpx
    import jose
    import networkx
    import numpy
    import psutil
    import sqlalchemy
    import uvicorn
    print("✅ Залежності вже встановлені")
except ImportError:
    print("🔧 Встановлення залежностей...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q",
        "fastapi", "uvicorn[standard]", "psutil", "httpx",
        "python-jose[cryptography]", "passlib[bcrypt]",
        "sqlalchemy", "aiosqlite", "networkx", "orjson",
        "pandas", "numpy", "nest_asyncio"])
    print("✅ Залежності встановлено")

# ─── ЗАВАНТАЖЕННЯ ZROK ─────────────────────────────────────────
ZROK_DIR = "/kaggle/working"
ZROK_BIN = f"{ZROK_DIR}/zrok"
os.makedirs(ZROK_DIR, exist_ok=True)

if not os.path.exists(ZROK_BIN):
    print("📦 Завантаження zrok...")
    try:
        req = urllib.request.Request(
            "https://api.github.com/repos/openziti/zrok/releases/latest",
            headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            tag = json.loads(r.read())["tag_name"]
    except Exception:
        tag = "v1.0.0"

    ver = tag.lstrip("v")
    url = f"https://github.com/openziti/zrok/releases/download/{tag}/zrok_{ver}_linux_amd64.tar.gz"
    tar_path = f"{ZROK_DIR}/zrok.tar.gz"

    print(f"🔽 Завантаження zrok {tag}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as resp, open(tar_path, "wb") as f:
        f.write(resp.read())

    if os.path.exists(tar_path):
        with tarfile.open(tar_path, "r:gz") as tar:
            for member in tar.getmembers():
                if member.isfile() and "zrok" in member.name and not member.name.endswith(".txt"):
                    extracted = tar.extractfile(member)
                    if extracted:
                        data = extracted.read()
                        if len(data) > 1000000:  # > 1MB = бінарник
                            with open(ZROK_BIN, "wb") as f:
                                f.write(data)
                            os.chmod(ZROK_BIN, 0o755)
                            print(f"✅ zrok {tag} готовий ({len(data)} bytes)")
                            break
    else:
        print("❌ Не вдалося завантажити zrok")
else:
    print("✅ zrok вже є")

# ─── АКТИВАЦІЯ ZROK ────────────────────────────────────────────
if os.path.exists(ZROK_BIN):
    subprocess.run([ZROK_BIN, "disable"], capture_output=True)
    r = subprocess.run([ZROK_BIN, "enable", ZROK_TOKEN], capture_output=True, text=True)
    if r.returncode == 0:
        print("✅ zrok активовано")
    else:
        print(f"⚠️ zrok enable: {r.stdout} {r.stderr}")
else:
    print("⚠️ zrok бінарник не знайдено — тунель неможливий")

# ─── БЕКЕНД ─────────────────────────────────────────────────────
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
import networkx as nx
import numpy as np
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    func,
    select,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

# 10 БД
DATABASE_URL = "sqlite+aiosqlite:///./predator_main.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

clickhouse_engine = create_async_engine("sqlite+aiosqlite:///./predator_clickhouse.db", echo=False)
ClickHouseBase = declarative_base()

opensearch_engine = create_async_engine("sqlite+aiosqlite:///./predator_opensearch.db", echo=False)
OpenSearchBase = declarative_base()

class Document(OpenSearchBase):
    __tablename__ = "documents"
    id = Column(String, primary_key=True)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    ueid = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))

timescale_engine = create_async_engine("sqlite+aiosqlite:///./predator_timescale.db", echo=False)
TimescaleBase = declarative_base()

class TimeSeries(TimescaleBase):
    __tablename__ = "timeseries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))
    tags = Column(JSON, default={})

mongo_engine = create_async_engine("sqlite+aiosqlite:///./predator_mongo.db", echo=False)
MongoBase = declarative_base()

class MongoDocument(MongoBase):
    __tablename__ = "documents"
    _id = Column(String, primary_key=True)
    collection = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

# Neo4j mock
class Neo4jMock:
    def __init__(self):
        self.graph = nx.DiGraph()
        for i in range(1, 26):
            self.graph.add_node(f"COMP-{i:03d}", type="company")
        for i in range(1, 25):
            self.graph.add_edge(f"COMP-{i:03d}", f"COMP-{i+1:03d}", relation="owns")
    def get_subgraph(self, node_id, depth=2):
        if node_id not in self.graph:
            return {"nodes": [], "edges": []}
        nodes, edges = set([node_id]), []
        for _ in range(depth):
            new = set()
            for n in nodes:
                for nb in self.graph.neighbors(n):
                    new.add(nb)
                    edges.append({"source": n, "target": nb})
            nodes.update(new)
        return {"nodes": [{"id": n, "type": self.graph.nodes[n].get("type", "unknown")} for n in nodes], "edges": edges}
neo4j = Neo4jMock()

# Redis mock
class RedisMock:
    def __init__(self): self.store, self.ttl = {}, {}
    def set(self, k, v, ttl=3600): self.store[k], self.ttl[k] = v, time.time() + ttl
    def get(self, k):
        if k in self.store and time.time() < self.ttl.get(k, float("inf")):
            return self.store[k]
        self.store.pop(k, None)
        self.ttl.pop(k, None)
        return None
    def delete(self, k): self.store.pop(k, None); self.ttl.pop(k, None)
redis = RedisMock()

# Qdrant mock
class QdrantMock:
    def __init__(self): self.vectors, self.payloads = {}, {}
    def upsert(self, col, pts):
        self.vectors.setdefault(col, {})
        self.payloads.setdefault(col, {})
        for p in pts:
            self.vectors[col][p["id"]] = p["vector"]
            self.payloads[col][p["id"]] = p.get("payload", {})
    def search(self, col, qv, limit=5):
        if col not in self.vectors:
            return []
        r = []
        for pid, vec in self.vectors[col].items():
            sim = np.dot(qv, vec) / (np.linalg.norm(qv) * np.linalg.norm(vec))
            r.append({"id": pid, "score": float(sim), "payload": self.payloads[col].get(pid, {})})
        r.sort(key=lambda x: x["score"], reverse=True)
        return r[:limit]
qdrant = QdrantMock()

# Kafka mock
class KafkaMock:
    def __init__(self): self.topics = defaultdict(list)
    def produce(self, t, m): self.topics[t].append({"value": m, "timestamp": time.time()})
    def consume(self, t, g): return self.topics[t].pop(0)["value"] if self.topics[t] else None
kafka = KafkaMock()

# MinIO mock
class MinIOMock:
    def __init__(self, bp="/kaggle/working/storage"): self.base_path = bp; os.makedirs(bp, exist_ok=True)
    def put_object(self, b, k, d):
        p = os.path.join(self.base_path, b)
        os.makedirs(p, exist_ok=True)
        with open(os.path.join(p, k), "wb") as f: f.write(d)
    def get_object(self, b, k):
        p = os.path.join(self.base_path, b, k)
        if os.path.exists(p):
            with open(p, "rb") as f: return f.read()
        return None
minio = MinIOMock()

# Models
class Company(Base):
    __tablename__ = "companies"
    ueid = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    edrpou = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    risk_score = Column(Float, default=0.0)
    region = Column(String, default="Kyiv")
    industry = Column(String, default="Unknown")
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True)
    severity = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))
    company_ueid = Column(String, nullable=True)
    resolved = Column(Boolean, default=False)
    alert_type = Column(String, default="risk")  # risk, sanctions, tax, compliance

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True)
    company_ueid = Column(String, nullable=False)
    direction = Column(String, nullable=False)  # import / export
    goods_description = Column(Text, nullable=False)
    value_usd = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    origin_country = Column(String, nullable=False)
    destination_country = Column(String, nullable=False)
    customs_office = Column(String, nullable=True)
    declaration_date = Column(DateTime, nullable=False)
    risk_flag = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

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

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="standard_client")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

# Auth utils
def get_password_hash(pw):
    return hashlib.sha256((pw + "predator-salt-v66").encode()).hexdigest()

def verify_password(pw, hp):
    return get_password_hash(pw) == hp

def create_access_token(data, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Query(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(401, "Invalid credentials")
    except JWTError:
        raise HTTPException(401, "Invalid credentials")
    async with async_session() as session:
        user = (await session.execute(select(User).where(User.username == username))).scalar_one_or_none()
        if not user:
            raise HTTPException(401, "Invalid credentials")
        return user

# ─── ГЕНЕРАТОР РЕАЛІСТИЧНИХ ДАНИХ ──────────────────────────────

_UA_COMPANY_PREFIXES = ["ТОВ", "ПП", "ТДВ", "АТ", "ФОП"]
_UA_COMPANY_NAMES_1 = [
    "УКРАЇНСЬКИЙ", "НОВИЙ", "СХІДНИЙ", "ЗАХІДНИЙ", "ЄВРО", "ГЛОБАЛ",
    "ПРОМИСЛОВИЙ", "ТОРГОВИЙ", "ФІНАНСОВИЙ", "ТЕХНО", "ІНФО",
    "БУДІВЕЛЬНИЙ", "АГРО", "МЕДІА", "ТРАНС", "ЕКСПОРТНИЙ",
    "ІМПОРТНИЙ", "ЕНЕРГЕТИЧНИЙ", "ЛОГІСТИЧНИЙ", "ІНВЕСТИЦІЙНИЙ",
    "ДЕВЕЛОПМЕНТ", "КОНСАЛТИНГ", "СЕКЬЮРІТІ", "СОФТВЕР", "ХОЛДИНГ"
]
_UA_COMPANY_NAMES_2 = [
    "ЦЕНТР", "СТАНДАРТ", "ПРОМИНЬ", "ШЛЯХ", "ФОРМАТ", "ВЕКТОР",
    "РІШЕННЯ", "ПРОЕКТ", "ГРУП", "АЛЬЯНС", "ПАРТНЕР", "ЛІДЕР",
    "ІННОВАЦІЯ", "РЕГІОН", "КОНТАКТ", "ПОТЕНЦІАЛ", "СИСТЕМА",
    "ТЕХНОЛОДЖІ", "ПЛЮС", "МАКС", "ПРЕМІУМ", "БІЗНЕС", "СЕРВІС",
    "ПРАЙМ", "ФАКТОР", "ЕКСПЕРТ", "КОМПЛЕКС", "СТРАТЕГІЯ"
]
_UA_CITIES = ["Kyiv", "Lviv", "Odesa", "Kharkiv", "Dnipro", "Zaporizhzhia", "Vinnytsia", "Poltava", "Chernihiv", "Ivano-Frankivsk", "Lutsk", "Rivne", "Ternopil", "Khmelnytskyi", "Chernivtsi", "Uzhhorod", "Zhytomyr", "Cherkasy", "Sumy", "Kropyvnytskyi"]
_UA_INDUSTRIES = ["IT", "Finance", "Trade", "Logistics", "Construction", "Agriculture", "Energy", "Pharma", "Manufacturing", "Media", "Telecom", "Real Estate", "Consulting", "Security", "Transport", "Import", "Investment", "Food", "Textile", "Mining", "Automotive", "Chemical", "Healthcare", "Education", "Tourism"]
_UA_GOODS = [
    "Нефть сира", "Залізна руда", "Пшениця", "Кукурудза", "Соняшникова олія",
    "Металопрокат", "Пластмаси", "Хімікати промислові", "Фармацевтика",
    "Електроніка", "Автозапчастини", "Текстиль", "Меблі", "Будматеріали",
    "Вугілля кам'яне", "Природний газ", "Деревина", "Папір", "Шоколад",
    "Кава", "Чай", "Вино", "Пиво", "Спирт", "Добрива мінеральні",
    "Цемент", "Скло", "Алюміній", "Мідь", "Титан", "Уран",
    "Ртуть", "Свинець", "Цинк", "Нікель", "Кобальт", "Літій"
]
_COUNTRIES = ["UA", "PL", "DE", "CN", "US", "TR", "GB", "FR", "IT", "ES", "NL", "BE", "CZ", "HU", "RO", "BG", "GR", "BY", "RU", "KZ", "IN", "JP", "KR", "VN", "EG", "IL", "AE", "SA", "QA", "KW"]
_CUSTOMS_OFFICES = ["Київ-Центральний", "Львів-Галицький", "Одеса-Портовий", "Харків-Східний", "Дніпро-Промисловий", "Запоріжжя-Південний", "Вінниця-Західний", "Полтава-Центральний"]

def _gen_edrpou(idx: int) -> str:
    return f"{((idx * 37129 + 1234567) % 89999999) + 10000000:08d}"

def _gen_company_name(idx: int) -> str:
    p = _UA_COMPANY_PREFIXES[idx % len(_UA_COMPANY_PREFIXES)]
    n1 = _UA_COMPANY_NAMES_1[idx % len(_UA_COMPANY_NAMES_1)]
    n2 = _UA_COMPANY_NAMES_2[(idx * 7) % len(_UA_COMPANY_NAMES_2)]
    return f"{p} {n1} {n2}"

def _gen_risk_score(idx: int) -> float:
    base = (idx * 17 + 43) % 100
    if idx % 13 == 0:
        return round(90.0 + (idx % 10), 1)
    if idx % 7 == 0:
        return round(75.0 + (idx % 15), 1)
    return round(float(base), 1)

# Init DB
async def init_all_databases():
    for eng, base in [(engine, Base), (clickhouse_engine, ClickHouseBase), (opensearch_engine, OpenSearchBase),
                       (timescale_engine, TimescaleBase), (mongo_engine, MongoBase)]:
        async with eng.begin() as conn:
            await conn.run_sync(base.metadata.create_all)

    async with async_session() as session:
        # ── Користувачі ──
        if not (await session.execute(select(func.count()).select_from(User))).scalar():
            for u in [("admin", "tech_admin"), ("client", "standard_client"), ("vip", "vip_client")]:
                session.add(User(username=u[0], email=f"{u[0]}@predator.ua",
                                hashed_password=get_password_hash(f"{u[0]}123"), role=u[1]))

        # ── 150 Компаній ──
        if not (await session.execute(select(func.count()).select_from(Company))).scalar():
            for i in range(1, 151):
                ueid = f"COMP-{i:03d}"
                name = _gen_company_name(i)
                edrpou = _gen_edrpou(i)
                risk = _gen_risk_score(i)
                region = _UA_CITIES[i % len(_UA_CITIES)]
                industry = _UA_INDUSTRIES[i % len(_UA_INDUSTRIES)]
                session.add(Company(ueid=ueid, name=name, edrpou=edrpou, status="ACTIVE",
                                    risk_score=risk, region=region, industry=industry))

        # ── 600 Транзакцій ──
        if not (await session.execute(select(func.count()).select_from(Transaction))).scalar():
            for i in range(1, 601):
                comp_idx = (i % 150) + 1
                ueid = f"COMP-{comp_idx:03d}"
                direction = "import" if i % 2 == 0 else "export"
                goods = _UA_GOODS[i % len(_UA_GOODS)]
                value = round(10000 + (i * 137.53) % 990000, 2)
                weight = round(500 + (i * 89.17) % 49500, 2)
                orig = _COUNTRIES[(i * 3) % len(_COUNTRIES)]
                dest = "UA" if direction == "import" else _COUNTRIES[(i * 5) % len(_COUNTRIES)]
                customs = _CUSTOMS_OFFICES[i % len(_CUSTOMS_OFFICES)]
                decl_date = datetime.now(UTC) - timedelta(days=i % 365)
                risk_flag = comp_idx % 13 == 0 or value > 500000
                session.add(Transaction(
                    id=f"TXN-{i:06d}", company_ueid=ueid, direction=direction,
                    goods_description=goods, value_usd=value, weight_kg=weight,
                    origin_country=orig, destination_country=dest,
                    customs_office=customs, declaration_date=decl_date,
                    risk_flag=risk_flag))

        # ── 60 Алертів ──
        if not (await session.execute(select(func.count()).select_from(Alert))).scalar():
            alert_templates = [
                ("CRITICAL", "Критичний ризик санкцій для {name}", "sanctions"),
                ("HIGH", "Аномальні транзакції у {name}", "risk"),
                ("MEDIUM", "Зміна директора {name}", "compliance"),
                ("HIGH", "Підозріла активність {name}", "risk"),
                ("CRITICAL", "Санкційний ризик {name}", "sanctions"),
                ("LOW", "Затримка подачі звітності {name}", "tax"),
                ("MEDIUM", "Зміна бенефіціара {name}", "compliance"),
                ("HIGH", "Виявлено подвійне інвойсування {name}", "risk"),
                ("CRITICAL", "Можливе відмивання коштів через {name}", "risk"),
                ("MEDIUM", "Перевищення ліміту операцій {name}", "risk"),
                ("LOW", "Автоматичне сповіщення: перевірка {name}", "compliance"),
                ("HIGH", "Співпадіння з PEP-реєстром у {name}", "sanctions"),
            ]
            for i in range(1, 61):
                comp_idx = (i % 150) + 1
                ueid = f"COMP-{comp_idx:03d}"
                tmpl = alert_templates[i % len(alert_templates)]
                comp = _gen_company_name(comp_idx)
                msg = tmpl[1].format(name=comp)
                severity = tmpl[0]
                alert_type = tmpl[2]
                ts = datetime.now(UTC) - timedelta(hours=i * 4)
                session.add(Alert(id=f"ALERT-{i:03d}", severity=severity, message=msg,
                                  company_ueid=ueid, alert_type=alert_type, timestamp=ts))

        # ── Оцінки ризику для всіх компаній з ризиком >50 ──
        if not (await session.execute(select(func.count()).select_from(RiskAssessment))).scalar():
            for i in range(1, 151):
                risk = _gen_risk_score(i)
                if risk >= 50.0:
                    level = "CRITICAL" if risk >= 90 else "HIGH" if risk >= 70 else "MEDIUM"
                    structural = min(100.0, risk * 0.9 + (i % 15))
                    behavioral = min(100.0, risk * 0.7 + (i % 23))
                    sanctions = min(100.0, risk * 0.8 + (i % 11))
                    aml = min(100.0, risk * 0.6 + (i % 19))
                    expl = f"Автоматична оцінка: {level} рівень ризику."
                    session.add(RiskAssessment(
                        ueid=f"COMP-{i:03d}", score=risk, level=level,
                        structural=structural, behavioral=behavioral,
                        sanctions=sanctions, aml=aml, explanation=expl))

        # ── Збагачення Neo4j graph реалістичними зв'язками ──
        for i in range(1, 151):
            node_id = f"COMP-{i:03d}"
            if node_id not in neo4j.graph:
                neo4j.graph.add_node(node_id, type="company", industry=_UA_INDUSTRIES[i % len(_UA_INDUSTRIES)])
        # Створення зв'язків власності (кожна компанія володіє 1-3 іншими)
        for i in range(1, 151):
            owner = f"COMP-{i:03d}"
            for j in range(1, 4):
                target_idx = ((i * 7 + j * 13) % 150) + 1
                if target_idx != i:
                    target = f"COMP-{target_idx:03d}"
                    rel_type = ["owns", "invests", "supplies", "partners", "competes"][(i + j) % 5]
                    neo4j.graph.add_edge(owner, target, relation=rel_type)

        await session.commit()

# OODA Loop
class OODALoop:
    def __init__(self):
        self.is_running = False
        self.current_phase = "IDLE"
        self.cycles_completed = 0
        self.logs = []
        self._lock = threading.Lock()
    def start(self):
        with self._lock:
            if self.is_running:
                return
            self.is_running = True
        threading.Thread(target=self._run, daemon=True).start()
    def stop(self):
        with self._lock:
            self.is_running = False
            self.current_phase = "IDLE"
    def _run(self):
        phases = ["OBSERVE", "ORIENT", "DECIDE", "ACT"]
        descs = {
            "OBSERVE": "Сканування транзакційних потоків ClickHouse...",
            "ORIENT": "Аналіз відхилень від Gold Pattern v5.0...",
            "DECIDE": "Формування стратегії превентивного блокування...",
            "ACT": "Впровадження правил у Risk Engine..."
        }
        while self.is_running:
            for ph in phases:
                if not self.is_running:
                    break
                self.current_phase = ph
                ts = datetime.now().strftime("%H:%M:%S")
                self.logs.append(f"[{ts}] {ph}: {descs[ph]}")
                if len(self.logs) > 40:
                    self.logs.pop(0)
                time.sleep(8)
            self.cycles_completed += 1

ooda = OODALoop()

# FastAPI
app = FastAPI(title="PREDATOR Analytics Kaggle 10-DB Node", version="66.0-ELITE")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/v1/health")
async def health():
    mem = psutil.virtual_memory()
    return {
        "status": "ONLINE",
        "mode": "KAGGLE_10DB_NATIVE",
        "node": "KAGGLE_RESERVE",
        "version": "66.0-ELITE",
        "timestamp": datetime.now(UTC).isoformat(),
        "ram_used_gb": round(mem.used / 1024**3, 2),
        "ram_total_gb": round(mem.total / 1024**3, 2),
        "ram_percent": mem.percent,
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "databases": {
            "postgresql": "sqlite (main)",
            "clickhouse": "sqlite (time-series)",
            "neo4j": "networkx (in-memory)",
            "redis": "dict (in-memory)",
            "qdrant": "numpy (in-memory)",
            "opensearch": "sqlite (fts)",
            "kafka": "threading (in-memory)",
            "minio": "files (local)",
            "timescaledb": "sqlite (hypertable)",
            "mongodb": "sqlite (document)"
        }
    }

@app.get("/api/v1/health/ready")
async def health_ready():
    return {"status": "ready", "timestamp": datetime.now(UTC).isoformat()}

@app.get("/api/v1/azr/status")
async def azr_status():
    return {"status": "ONLINE", "mode": "KAGGLE_10DB", "version": "66.0-ELITE"}

@app.post("/api/v1/auth/login")
async def login(username: str, password: str):
    async with async_session() as session:
        user = (await session.execute(select(User).where(User.username == username))).scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(401, "Incorrect username or password")
        return {
            "access_token": create_access_token(
                {"sub": user.username, "role": user.role},
                timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)),
            "token_type": "bearer",
            "user": {"username": user.username, "email": user.email, "role": user.role}
        }

@app.get("/api/v1/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }

@app.get("/api/v1/companies")
async def companies(search: str = "", region: str = "", industry: str = "",
                    min_risk: float = 0.0, max_risk: float = 100.0,
                    status: str = "", limit: int = 25, offset: int = 0):
    async with async_session() as session:
        q = select(Company)
        if search: q = q.where(Company.name.ilike(f"%{search}%"))
        if region: q = q.where(Company.region == region)
        if industry: q = q.where(Company.industry == industry)
        if min_risk > 0: q = q.where(Company.risk_score >= min_risk)
        if max_risk < 100: q = q.where(Company.risk_score <= max_risk)
        if status: q = q.where(Company.status == status)
        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        items = (await session.execute(q.offset(offset).limit(limit))).scalars().all()
        return {
            "companies": [{"ueid": c.ueid, "name": c.name, "edrpou": c.edrpou,
                          "status": c.status, "risk_score": c.risk_score,
                          "region": c.region, "industry": c.industry,
                          "created_at": c.created_at.isoformat() if c.created_at else None}
                         for c in items],
            "total": total, "limit": limit, "offset": offset
        }

@app.get("/api/v1/transactions")
async def transactions(company_ueid: str = "", direction: str = "", risk_flag: bool = None,
                       min_value: float = 0.0, max_value: float = 999999999.0,
                       limit: int = 25, offset: int = 0):
    async with async_session() as session:
        q = select(Transaction).order_by(Transaction.declaration_date.desc())
        if company_ueid: q = q.where(Transaction.company_ueid == company_ueid)
        if direction: q = q.where(Transaction.direction == direction)
        if risk_flag is not None: q = q.where(Transaction.risk_flag == risk_flag)
        if min_value > 0: q = q.where(Transaction.value_usd >= min_value)
        if max_value < 999999999: q = q.where(Transaction.value_usd <= max_value)
        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        items = (await session.execute(q.offset(offset).limit(limit))).scalars().all()
        return {
            "transactions": [{"id": t.id, "company_ueid": t.company_ueid, "direction": t.direction,
                              "goods_description": t.goods_description, "value_usd": t.value_usd,
                              "weight_kg": t.weight_kg, "origin_country": t.origin_country,
                              "destination_country": t.destination_country, "customs_office": t.customs_office,
                              "declaration_date": t.declaration_date.isoformat() if t.declaration_date else None,
                              "risk_flag": t.risk_flag} for t in items],
            "total": total, "limit": limit, "offset": offset
        }

@app.get("/api/v1/alerts")
async def alerts(severity: str = "", resolved: bool = None, alert_type: str = "", limit: int = 10, offset: int = 0):
    async with async_session() as session:
        q = select(Alert).order_by(Alert.timestamp.desc())
        if severity: q = q.where(Alert.severity == severity)
        if resolved is not None: q = q.where(Alert.resolved == resolved)
        if alert_type: q = q.where(Alert.alert_type == alert_type)
        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        items = (await session.execute(q.offset(offset).limit(limit))).scalars().all()
        return {
            "alerts": [{"id": a.id, "severity": a.severity, "message": a.message,
                        "timestamp": a.timestamp.isoformat(), "company_ueid": a.company_ueid,
                        "resolved": a.resolved, "alert_type": a.alert_type} for a in items],
            "total": total, "limit": limit, "offset": offset
        }

@app.get("/api/v1/dashboard/overview")
async def dashboard_overview():
    async with async_session() as session:
        tc = (await session.execute(select(func.count()).select_from(Company))).scalar()
        hr = (await session.execute(select(func.count()).select_from(Company).where(Company.risk_score >= 70))).scalar()
        cr = (await session.execute(select(func.count()).select_from(Company).where(Company.risk_score >= 90))).scalar()
        at = (await session.execute(select(func.count()).select_from(Alert).where(
            Alert.timestamp >= datetime.now(UTC).replace(hour=0, minute=0, second=0)))).scalar()
        ua = (await session.execute(select(func.count()).select_from(Alert).where(Alert.resolved == False))).scalar()
        return {
            "timestamp": datetime.now(UTC).isoformat(),
            "total_companies": tc, "high_risk": hr, "critical_risk": cr,
            "alerts_today": at, "unresolved_alerts": ua,
            "ooda_cycles": ooda.cycles_completed,
            "graph_nodes": neo4j.graph.number_of_nodes(),
            "graph_edges": neo4j.graph.number_of_edges(),
            "redis_keys": len(redis.store),
            "kafka_topics": len(kafka.topics)
        }

@app.get("/api/v1/risk/company/{ueid}")
async def company_risk(ueid: str):
    async with async_session() as session:
        risk = (await session.execute(select(RiskAssessment).where(RiskAssessment.ueid == ueid))).scalar_one_or_none()
        if risk:
            return {
                "ueid": risk.ueid, "score": risk.score, "level": risk.level,
                "layers": {"structural": risk.structural, "behavioral": risk.behavioral,
                          "sanctions": risk.sanctions, "aml": risk.aml},
                "explanation": risk.explanation,
                "updated_at": risk.updated_at.isoformat()
            }
        return {"ueid": ueid, "score": 50.0, "level": "MEDIUM",
                "layers": {"structural": 50, "behavioral": 50, "sanctions": 50, "aml": 50},
                "explanation": "Дані про ризик не знайдено."}

@app.get("/api/v1/graph/subgraph/{ueid}")
async def get_subgraph(ueid: str, depth: int = 2):
    return neo4j.get_subgraph(ueid, depth)

@app.get("/api/v1/osint/diligence/{ueid}")
async def diligence(ueid: str):
    async with async_session() as session:
        c = (await session.execute(select(Company).where(Company.ueid == ueid))).scalar_one_or_none()
        if c:
            rf = []
            if c.risk_score >= 70: rf.append("HIGH_RISK_SCORE")
            if c.risk_score >= 80: rf.append("SANCTIONS_RISK")
            if c.risk_score >= 90: rf.append("CRITICAL_FRAUD_RISK")
            return {
                "ueid": ueid, "name": c.name, "edrpou": c.edrpou,
                "region": c.region, "industry": c.industry,
                "red_flags": rf or ["NO_FLAGS"],
                "summary": f"Компанія {c.name} має ризик {c.risk_score}."
            }
        return {"ueid": ueid, "name": "Невідома компанія",
                "red_flags": ["COMPANY_NOT_FOUND"], "summary": "Компанію не знайдено."}

@app.get("/api/v1/factory/ooda")
async def get_ooda():
    return {"is_running": ooda.is_running, "current_phase": ooda.current_phase,
            "cycles": ooda.cycles_completed, "logs": ooda.logs}

@app.post("/api/v1/factory/infinite/start")
async def start_ooda():
    ooda.start()
    return {"status": "started"}

@app.post("/api/v1/factory/infinite/stop")
async def stop_ooda():
    ooda.stop()
    return {"status": "stopped"}

@app.get("/api/v1/tornado/stats")
async def get_tornado():
    return {"timestamp": datetime.now(UTC).isoformat(), "modules": [
        {"id": "forecast", "accuracy": 94.2, "status": "ACTIVE"},
        {"id": "market", "entities": 1200, "status": "LIVE"},
        {"id": "graph", "nodes": neo4j.graph.number_of_nodes(), "status": "ACTIVE"},
        {"id": "diligence", "flags": 12, "status": "ACTIVE"},
        {"id": "anomaly", "tps": 847, "status": "LIVE"},
        {"id": "scenario", "active": 3, "status": "WAR_ROOM"}
    ]}

@app.get("/api/v1/system/stats")
async def system_stats():
    mem = psutil.virtual_memory()
    return {"timestamp": datetime.now(UTC).isoformat(),
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "cpu_count": psutil.cpu_count(),
            "ram_used_gb": round(mem.used / 1024**3, 2),
            "ram_total_gb": round(mem.total / 1024**3, 2),
            "ram_percent": mem.percent}

@app.get("/api/v1/system/nodes")
async def system_nodes():
    return {"nodes": [{"id": "kaggle-10db", "name": "Kaggle 10-DB Node",
                       "status": "ONLINE", "role": "compute", "version": "66.0-ELITE"}]}

@app.get("/api/v1/system/databases/status")
async def databases_status():
    return {"databases": [
        {"name": "PostgreSQL", "status": "ONLINE", "type": "SQLite (main)", "size_mb": 1.2},
        {"name": "ClickHouse", "status": "ONLINE", "type": "SQLite (time-series)", "size_mb": 0.8},
        {"name": "Neo4j", "status": "ONLINE", "type": "NetworkX (in-memory)", "nodes": neo4j.graph.number_of_nodes()},
        {"name": "Redis", "status": "ONLINE", "type": "Dict (in-memory)", "keys": len(redis.store)},
        {"name": "Qdrant", "status": "ONLINE", "type": "NumPy (in-memory)", "vectors": len(qdrant.vectors)},
        {"name": "OpenSearch", "status": "ONLINE", "type": "SQLite (FTS)", "size_mb": 0.5},
        {"name": "Kafka", "status": "ONLINE", "type": "Threading (in-memory)", "topics": len(kafka.topics)},
        {"name": "MinIO", "status": "ONLINE", "type": "Files (local)", "path": "/kaggle/working/storage"},
        {"name": "TimescaleDB", "status": "ONLINE", "type": "SQLite (hypertable)", "size_mb": 0.3},
        {"name": "MongoDB", "status": "ONLINE", "type": "SQLite (document)", "size_mb": 0.4}
    ]}

# ─── ГОЛОВНИЙ БЛОК ─────────────────────────────────────────────
if __name__ == "__main__":
    import asyncio

    import uvicorn

    print("=" * 60)
    print("🦅 PREDATOR Analytics v66.0-ELITE: Kaggle 10-DB Node")
    print("=" * 60)

    print("\n🗄️ Ініціалізація 10 баз даних...")
    loop = asyncio.get_event_loop()
    loop.run_until_complete(init_all_databases())
    print("✅ Всі 10 баз даних готові")

    print("🧠 Запуск OODA Loop...")
    ooda.start()

    # Тунель
    PUBLIC_URL = None
    def run_tunnel():
        global PUBLIC_URL
        if not os.path.exists(ZROK_BIN):
            print("❌ zrok не знайдено — тунель не запущено")
            return
        proc = subprocess.Popen([ZROK_BIN, "share", "public", "http://localhost:8000", "--headless"],
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in proc.stdout:
            print(f"[zrok] {line.rstrip()}")
            m = re.search(r"https://[a-z0-9]+\.share\.zrok\.io", line)
            if not m:
                m = re.search(r"https://[\w\-]+\.zrok\.io[\S]*", line)
            if not m and "access your share at" in line:
                p = line.split("access your share at")
                if len(p) > 1:
                    PUBLIC_URL = p[-1].strip()
            if m:
                PUBLIC_URL = m.group(0)
            if PUBLIC_URL:
                print("\n" + "=" * 60)
                print("🔥 PREDATOR KAGGLE 10-DB NODE IS LIVE!")
                print(f"🔗 PUBLIC URL: {PUBLIC_URL}")
                print("=" * 60 + "\n")
                break
    threading.Thread(target=run_tunnel, daemon=True).start()

    # Запуск сервера
    print("🚀 Запуск FastAPI сервера на порту 8000...\n")
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="warning", loop="asyncio")
    server = uvicorn.Server(config)
    loop.run_until_complete(server.serve())
