#!/usr/bin/env python3
"""
🦅 PREDATOR Analytics v67.0-ELITE — Kaggle Production Backend
═══════════════════════════════════════════════════════════════
Єдиний консолідований бекенд для Kaggle CPU-Only Node.
Покриває 80+ ендпоінтів mock-api-server.mjs.

Режим: CPU Only, Internet ON, Max RAM (30 GB).
Тунель: zrok (HR-23 compliant).
Секрети: через env vars (HR-06 compliant).
"""
from __future__ import annotations

import asyncio
import csv
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tarfile
import threading
import time
import urllib.request
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

# ═══════════════════════════════════════════════════════════════
# 1. ЗАЛЕЖНОСТІ
# ═══════════════════════════════════════════════════════════════

def _install_deps() -> None:
    """Встановлення залежностей у Kaggle середовищі."""
    required = [
        "fastapi", "uvicorn[standard]", "psutil", "httpx",
        "python-jose[cryptography]", "sqlalchemy", "aiosqlite",
        "networkx", "orjson", "numpy", "sse-starlette",
    ]
    try:
        import fastapi, uvicorn, psutil, jose, sqlalchemy  # noqa: F401
        import aiosqlite, networkx, numpy  # noqa: F401
        print("✅ Залежності вже встановлені")
    except ImportError:
        print("🔧 Встановлення залежностей...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", *required],
            check=False,
        )
        print("✅ Залежності встановлено")

    # nest_asyncio для Kaggle/Jupyter
    try:
        import nest_asyncio  # noqa: F401
    except ImportError:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "nest_asyncio"],
            check=False,
        )
    import nest_asyncio
    nest_asyncio.apply()

_install_deps()

import numpy as np
import networkx as nx
import psutil
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, Text, JSON,
    select, func,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import (
    create_async_engine, AsyncSession, async_sessionmaker,
)
from jose import JWTError, jwt

# ═══════════════════════════════════════════════════════════════
# 2. КОНФІГУРАЦІЯ (HR-06: секрети через env vars)
# ═══════════════════════════════════════════════════════════════

SECRET_KEY = os.getenv("PREDATOR_SECRET_KEY", "predator-kaggle-key-v67-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
ZROK_TOKEN = os.getenv("KAGGLE_SECRET_ZROK_TOKEN", os.getenv("ZROK_TOKEN", ""))
VERSION = "67.0-ELITE"
DB_DIR = os.getenv("PREDATOR_DB_DIR", "/kaggle/working")
if not os.path.exists(DB_DIR):
    DB_DIR = "."

# ═══════════════════════════════════════════════════════════════
# 3. БАЗИ ДАНИХ (10 DB Architecture — SQLite emulation)
# ═══════════════════════════════════════════════════════════════

class Base(DeclarativeBase):
    """Базовий клас SQLAlchemy 2.0."""
    pass

# --- Головна БД (PostgreSQL emulation) ---
main_engine = create_async_engine(
    f"sqlite+aiosqlite:///{DB_DIR}/predator_main.db", echo=False
)
main_session = async_sessionmaker(
    main_engine, expire_on_commit=False, class_=AsyncSession
)

# --- ClickHouse emulation (OLAP) ---
ch_engine = create_async_engine(
    f"sqlite+aiosqlite:///{DB_DIR}/predator_clickhouse.db", echo=False
)

class ClickHouseBase(DeclarativeBase):
    pass

# --- OpenSearch emulation (FTS) ---
os_engine = create_async_engine(
    f"sqlite+aiosqlite:///{DB_DIR}/predator_opensearch.db", echo=False
)

class OpenSearchBase(DeclarativeBase):
    pass

# --- TimescaleDB emulation ---
ts_engine = create_async_engine(
    f"sqlite+aiosqlite:///{DB_DIR}/predator_timescale.db", echo=False
)

class TimescaleBase(DeclarativeBase):
    pass

# --- MongoDB emulation ---
mongo_engine = create_async_engine(
    f"sqlite+aiosqlite:///{DB_DIR}/predator_mongo.db", echo=False
)

class MongoBase(DeclarativeBase):
    pass


# ═══════════════════════════════════════════════════════════════
# 4. МОДЕЛІ БД
# ═══════════════════════════════════════════════════════════════

class Company(Base):
    """Реєстр компаній (PostgreSQL SSOT)."""
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
    """Система алертів."""
    __tablename__ = "alerts"
    id = Column(String, primary_key=True)
    severity = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))
    company_ueid = Column(String, nullable=True)
    resolved = Column(Boolean, default=False)
    alert_type = Column(String, default="risk")


class Transaction(Base):
    """Митні транзакції."""
    __tablename__ = "transactions"
    id = Column(String, primary_key=True)
    company_ueid = Column(String, nullable=False)
    direction = Column(String, nullable=False)
    goods_description = Column(Text, nullable=False)
    value_usd = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    origin_country = Column(String, nullable=False)
    destination_country = Column(String, nullable=False)
    customs_office = Column(String, nullable=True)
    declaration_date = Column(DateTime, nullable=False)
    risk_flag = Column(Boolean, default=False)
    hs_code = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class RiskAssessment(Base):
    """Оцінки ризику (Risk Engine v56.5)."""
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
    """Користувачі системи."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class Document(OpenSearchBase):
    """Документи для повнотекстового пошуку."""
    __tablename__ = "documents"
    id = Column(String, primary_key=True)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    ueid = Column(String, nullable=True)
    doc_type = Column(String, default="general")
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))


class TimeSeries(TimescaleBase):
    """Метрики часових рядів."""
    __tablename__ = "timeseries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))
    tags = Column(JSON, default=dict)


class MongoDocument(MongoBase):
    """Document store emulation."""
    __tablename__ = "documents"
    _id = Column(String, primary_key=True)
    collection = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


# ═══════════════════════════════════════════════════════════════
# 5. IN-MEMORY DB MOCKS (Neo4j, Redis, Qdrant, Kafka, MinIO)
# ═══════════════════════════════════════════════════════════════

class Neo4jMock:
    """Графова БД через NetworkX."""
    def __init__(self) -> None:
        self.graph = nx.DiGraph()

    def get_subgraph(self, node_id: str, depth: int = 2) -> dict:
        if node_id not in self.graph:
            return {"nodes": [], "edges": []}
        nodes: set[str] = {node_id}
        edges: list[dict] = []
        for _ in range(depth):
            new_nodes: set[str] = set()
            for n in list(nodes):
                for nb in self.graph.neighbors(n):
                    new_nodes.add(nb)
                    edges.append({"source": n, "target": nb,
                                  "relation": self.graph.edges[n, nb].get("relation", "related")})
            nodes.update(new_nodes)
        return {
            "nodes": [{"id": n, **self.graph.nodes[n]} for n in nodes],
            "edges": edges,
        }


class RedisMock:
    """Redis cache emulation."""
    def __init__(self) -> None:
        self.store: dict[str, Any] = {}
        self.ttl: dict[str, float] = {}

    def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        self.store[key] = value
        self.ttl[key] = time.time() + ttl

    def get(self, key: str) -> Any | None:
        if key in self.store and time.time() < self.ttl.get(key, float("inf")):
            return self.store[key]
        self.store.pop(key, None)
        self.ttl.pop(key, None)
        return None

    def keys(self) -> list[str]:
        return list(self.store.keys())


class QdrantMock:
    """Векторна БД emulation."""
    def __init__(self) -> None:
        self.vectors: dict[str, dict] = {}
        self.payloads: dict[str, dict] = {}

    def upsert(self, collection: str, points: list[dict]) -> None:
        self.vectors.setdefault(collection, {})
        self.payloads.setdefault(collection, {})
        for p in points:
            self.vectors[collection][p["id"]] = p["vector"]
            self.payloads[collection][p["id"]] = p.get("payload", {})

    def search(self, collection: str, query_vector: list, limit: int = 5) -> list[dict]:
        if collection not in self.vectors:
            return []
        qv = np.array(query_vector)
        results = []
        for pid, vec in self.vectors[collection].items():
            v = np.array(vec)
            norm = np.linalg.norm(qv) * np.linalg.norm(v)
            sim = float(np.dot(qv, v) / norm) if norm > 0 else 0.0
            results.append({"id": pid, "score": sim, "payload": self.payloads[collection].get(pid, {})})
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]


class KafkaMock:
    """Kafka topics emulation."""
    def __init__(self) -> None:
        self.topics: dict[str, list] = defaultdict(list)

    def produce(self, topic: str, message: Any) -> None:
        self.topics[topic].append({"value": message, "timestamp": time.time()})

    def consume(self, topic: str) -> Any | None:
        if self.topics[topic]:
            return self.topics[topic].pop(0)["value"]
        return None


class MinIOMock:
    """Файлове сховище emulation."""
    def __init__(self, base_path: str = "/kaggle/working/storage") -> None:
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)

    def put_object(self, bucket: str, key: str, data: bytes) -> None:
        path = os.path.join(self.base_path, bucket)
        os.makedirs(path, exist_ok=True)
        with open(os.path.join(path, key), "wb") as f:
            f.write(data)

    def get_object(self, bucket: str, key: str) -> bytes | None:
        path = os.path.join(self.base_path, bucket, key)
        if os.path.exists(path):
            with open(path, "rb") as f:
                return f.read()
        return None


# Ініціалізація in-memory сервісів
neo4j = Neo4jMock()
redis_mock = RedisMock()
qdrant = QdrantMock()
kafka = KafkaMock()
minio = MinIOMock(os.path.join(DB_DIR, "storage"))


# ═══════════════════════════════════════════════════════════════
# 6. AUTH УТИЛІТИ
# ═══════════════════════════════════════════════════════════════

def _hash_password(password: str) -> str:
    """SHA256 хеш (без bcrypt для CPU economy)."""
    return hashlib.sha256((password + "predator-salt-v67").encode()).hexdigest()


def _verify_password(plain: str, hashed: str) -> bool:
    return _hash_password(plain) == hashed


def _create_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Query(None, description="JWT токен")) -> User | None:
    """Отримати поточного користувача з JWT. Необов'язковий для більшості ендпоінтів."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            return None
    except JWTError:
        return None
    async with main_session() as session:
        result = await session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()


# ═══════════════════════════════════════════════════════════════
# 7. SEED DATA GENERATOR (500 компаній, 2000 транзакцій)
# ═══════════════════════════════════════════════════════════════

_PREFIXES = ["ТОВ", "ПП", "ТДВ", "АТ", "ФОП"]
_NAMES_1 = [
    "УКРАЇНСЬКИЙ", "НОВИЙ", "СХІДНИЙ", "ЗАХІДНИЙ", "ЄВРО", "ГЛОБАЛ",
    "ПРОМИСЛОВИЙ", "ТОРГОВИЙ", "ФІНАНСОВИЙ", "ТЕХНО", "ІНФО",
    "БУДІВЕЛЬНИЙ", "АГРО", "МЕДІА", "ТРАНС", "ЕКСПОРТНИЙ",
    "ІМПОРТНИЙ", "ЕНЕРГЕТИЧНИЙ", "ЛОГІСТИЧНИЙ", "ІНВЕСТИЦІЙНИЙ",
    "ДЕВЕЛОПМЕНТ", "КОНСАЛТИНГ", "СЕКЬЮРІТІ", "СОФТВЕР", "ХОЛДИНГ",
]
_NAMES_2 = [
    "ЦЕНТР", "СТАНДАРТ", "ПРОМИНЬ", "ШЛЯХ", "ФОРМАТ", "ВЕКТОР",
    "РІШЕННЯ", "ПРОЕКТ", "ГРУП", "АЛЬЯНС", "ПАРТНЕР", "ЛІДЕР",
    "ІННОВАЦІЯ", "РЕГІОН", "КОНТАКТ", "ПОТЕНЦІАЛ", "СИСТЕМА",
    "ТЕХНОЛОДЖІ", "ПЛЮС", "МАКС", "ПРЕМІУМ", "БІЗНЕС", "СЕРВІС",
    "ПРАЙМ", "ФАКТОР", "ЕКСПЕРТ", "КОМПЛЕКС", "СТРАТЕГІЯ",
]
_CITIES = [
    "Kyiv", "Lviv", "Odesa", "Kharkiv", "Dnipro", "Zaporizhzhia",
    "Vinnytsia", "Poltava", "Chernihiv", "Ivano-Frankivsk", "Lutsk",
    "Rivne", "Ternopil", "Khmelnytskyi", "Chernivtsi", "Uzhhorod",
    "Zhytomyr", "Cherkasy", "Sumy", "Kropyvnytskyi",
]
_INDUSTRIES = [
    "IT", "Finance", "Trade", "Logistics", "Construction", "Agriculture",
    "Energy", "Pharma", "Manufacturing", "Media", "Telecom", "Real Estate",
    "Consulting", "Security", "Transport", "Import", "Investment", "Food",
    "Textile", "Mining", "Automotive", "Chemical", "Healthcare", "Education",
    "Tourism",
]
_GOODS = [
    "Нефть сира", "Залізна руда", "Пшениця", "Кукурудза", "Соняшникова олія",
    "Металопрокат", "Пластмаси", "Хімікати промислові", "Фармацевтика",
    "Електроніка", "Автозапчастини", "Текстиль", "Меблі", "Будматеріали",
    "Вугілля кам'яне", "Природний газ", "Деревина", "Папір", "Шоколад",
    "Кава", "Чай", "Вино", "Пиво", "Спирт", "Добрива мінеральні",
    "Цемент", "Скло", "Алюміній", "Мідь", "Титан",
]
_COUNTRIES = [
    "UA", "PL", "DE", "CN", "US", "TR", "GB", "FR", "IT", "ES",
    "NL", "BE", "CZ", "HU", "RO", "BG", "GR", "BY", "KZ", "IN",
    "JP", "KR", "VN", "EG", "IL", "AE", "SA", "QA", "KW", "GE",
]
_CUSTOMS_OFFICES = [
    "Київ-Центральний", "Львів-Галицький", "Одеса-Портовий",
    "Харків-Східний", "Дніпро-Промисловий", "Запоріжжя-Південний",
    "Вінниця-Західний", "Полтава-Центральний",
]
_HS_CODES = [
    "2709.00", "2601.11", "1001.99", "1005.90", "1512.11",
    "7208.51", "3901.10", "2902.41", "3004.90", "8471.30",
    "8708.99", "5208.11", "9403.60", "6802.93", "2701.12",
    "2711.11", "4407.10", "4802.55", "1806.31", "0901.11",
]

NUM_COMPANIES = 500
NUM_TRANSACTIONS = 2000
NUM_ALERTS = 120


def _gen_edrpou(idx: int) -> str:
    return f"{((idx * 37129 + 1234567) % 89999999) + 10000000:08d}"


def _gen_company_name(idx: int) -> str:
    p = _PREFIXES[idx % len(_PREFIXES)]
    n1 = _NAMES_1[idx % len(_NAMES_1)]
    n2 = _NAMES_2[(idx * 7) % len(_NAMES_2)]
    return f"{p} {n1} {n2}"


def _gen_risk(idx: int) -> float:
    if idx % 13 == 0:
        return round(90.0 + (idx % 10), 1)
    if idx % 7 == 0:
        return round(75.0 + (idx % 15), 1)
    return round(float((idx * 17 + 43) % 100), 1)


async def _seed_database() -> None:
    """Заповнення БД реалістичними даними."""
    async with main_session() as session:
        # --- Користувачі ---
        if not (await session.execute(select(func.count()).select_from(User))).scalar():
            for uname, role in [
                ("admin", "admin"), ("analyst", "analyst"),
                ("operator", "operator"), ("viewer", "viewer"),
            ]:
                session.add(User(
                    username=uname, email=f"{uname}@predator.ua",
                    hashed_password=_hash_password(f"{uname}123"), role=role,
                ))

        # --- Компанії ---
        if not (await session.execute(select(func.count()).select_from(Company))).scalar():
            for i in range(1, NUM_COMPANIES + 1):
                session.add(Company(
                    ueid=f"COMP-{i:04d}",
                    name=_gen_company_name(i),
                    edrpou=_gen_edrpou(i),
                    status="ACTIVE" if i % 20 != 0 else "SUSPENDED",
                    risk_score=_gen_risk(i),
                    region=_CITIES[i % len(_CITIES)],
                    industry=_INDUSTRIES[i % len(_INDUSTRIES)],
                ))

        # --- Транзакції ---
        if not (await session.execute(select(func.count()).select_from(Transaction))).scalar():
            for i in range(1, NUM_TRANSACTIONS + 1):
                comp_idx = (i % NUM_COMPANIES) + 1
                direction = "import" if i % 2 == 0 else "export"
                value = round(10000 + (i * 137.53) % 990000, 2)
                session.add(Transaction(
                    id=f"TXN-{i:06d}",
                    company_ueid=f"COMP-{comp_idx:04d}",
                    direction=direction,
                    goods_description=_GOODS[i % len(_GOODS)],
                    value_usd=value,
                    weight_kg=round(500 + (i * 89.17) % 49500, 2),
                    origin_country=_COUNTRIES[(i * 3) % len(_COUNTRIES)],
                    destination_country="UA" if direction == "import" else _COUNTRIES[(i * 5) % len(_COUNTRIES)],
                    customs_office=_CUSTOMS_OFFICES[i % len(_CUSTOMS_OFFICES)],
                    declaration_date=datetime.now(UTC) - timedelta(days=i % 365),
                    risk_flag=comp_idx % 13 == 0 or value > 500000,
                    hs_code=_HS_CODES[i % len(_HS_CODES)],
                ))

        # --- Алерти ---
        if not (await session.execute(select(func.count()).select_from(Alert))).scalar():
            templates = [
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
            for i in range(1, NUM_ALERTS + 1):
                comp_idx = (i % NUM_COMPANIES) + 1
                tmpl = templates[i % len(templates)]
                session.add(Alert(
                    id=f"ALERT-{i:04d}",
                    severity=tmpl[0],
                    message=tmpl[1].format(name=_gen_company_name(comp_idx)),
                    company_ueid=f"COMP-{comp_idx:04d}",
                    alert_type=tmpl[2],
                    timestamp=datetime.now(UTC) - timedelta(hours=i * 2),
                    resolved=i % 5 == 0,
                ))

        # --- Оцінки ризику ---
        if not (await session.execute(select(func.count()).select_from(RiskAssessment))).scalar():
            for i in range(1, NUM_COMPANIES + 1):
                risk = _gen_risk(i)
                if risk >= 40.0:
                    level = "CRITICAL" if risk >= 90 else "HIGH" if risk >= 70 else "MEDIUM"
                    session.add(RiskAssessment(
                        ueid=f"COMP-{i:04d}",
                        score=risk,
                        level=level,
                        structural=min(100.0, risk * 0.9 + (i % 15)),
                        behavioral=min(100.0, risk * 0.7 + (i % 23)),
                        sanctions=min(100.0, risk * 0.8 + (i % 11)),
                        aml=min(100.0, risk * 0.6 + (i % 19)),
                        explanation=f"Автоматична оцінка Risk Engine v56.5: {level} рівень ризику.",
                    ))

        await session.commit()

    # --- Збагачення Neo4j графа ---
    for i in range(1, NUM_COMPANIES + 1):
        node_id = f"COMP-{i:04d}"
        neo4j.graph.add_node(node_id, type="company",
                             industry=_INDUSTRIES[i % len(_INDUSTRIES)],
                             region=_CITIES[i % len(_CITIES)])
    # Створення зв'язків власності та партнерства
    relations = ["owns", "invests", "supplies", "partners", "competes"]
    for i in range(1, NUM_COMPANIES + 1):
        owner = f"COMP-{i:04d}"
        for j in range(1, 4):
            target_idx = ((i * 7 + j * 13) % NUM_COMPANIES) + 1
            if target_idx != i:
                target = f"COMP-{target_idx:04d}"
                neo4j.graph.add_edge(owner, target, relation=relations[(i + j) % 5])

    # --- Qdrant seed ---
    vectors_data = []
    for i in range(1, min(201, NUM_COMPANIES + 1)):
        vec = np.random.default_rng(seed=i).random(128).tolist()
        vectors_data.append({
            "id": f"COMP-{i:04d}",
            "vector": vec,
            "payload": {"name": _gen_company_name(i), "risk": _gen_risk(i)},
        })
    if vectors_data:
        qdrant.upsert("companies", vectors_data)

    print(f"✅ Seed: {NUM_COMPANIES} компаній, {NUM_TRANSACTIONS} транзакцій, "
          f"{NUM_ALERTS} алертів, {neo4j.graph.number_of_nodes()} graph nodes, "
          f"{neo4j.graph.number_of_edges()} graph edges")


# ═══════════════════════════════════════════════════════════════
# 8. OODA LOOP (Autonomous Intelligence)
# ═══════════════════════════════════════════════════════════════

class OODALoop:
    """Цикл автономного аналізу OODA."""
    def __init__(self) -> None:
        self.is_running = False
        self.current_phase = "IDLE"
        self.cycles_completed = 0
        self.logs: list[str] = []
        self._lock = threading.Lock()

    _DESCS = {
        "OBSERVE": "Сканування транзакційних потоків ClickHouse та OpenSearch...",
        "ORIENT": "Аналіз відхилень від Gold Pattern v5.0 та виявлення аномалій...",
        "DECIDE": "Формування стратегії превентивного блокування ризиків...",
        "ACT": "Впровадження нових правил у Risk Engine та оновлення сценаріїв...",
    }

    def start(self) -> None:
        with self._lock:
            if self.is_running:
                return
            self.is_running = True
        threading.Thread(target=self._run, daemon=True).start()

    def stop(self) -> None:
        with self._lock:
            self.is_running = False
            self.current_phase = "IDLE"

    def _run(self) -> None:
        phases = ["OBSERVE", "ORIENT", "DECIDE", "ACT"]
        while self.is_running:
            for phase in phases:
                if not self.is_running:
                    break
                self.current_phase = phase
                ts = datetime.now().strftime("%H:%M:%S")
                self.logs.append(f"[{ts}] {phase}: {self._DESCS[phase]}")
                if len(self.logs) > 100:
                    self.logs = self.logs[-60:]
                time.sleep(8)
            self.cycles_completed += 1


ooda = OODALoop()


# ═══════════════════════════════════════════════════════════════
# 9. FASTAPI APP + LIFESPAN
# ═══════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Ініціалізація при старті, очищення при зупинці."""
    # Startup
    print(f"🗄️ Ініціалізація 10 баз даних...")
    for eng, base_cls in [
        (main_engine, Base), (ch_engine, ClickHouseBase),
        (os_engine, OpenSearchBase), (ts_engine, TimescaleBase),
        (mongo_engine, MongoBase),
    ]:
        async with eng.begin() as conn:
            await conn.run_sync(base_cls.metadata.create_all)
    print("✅ Схеми створено")

    await _seed_database()

    ooda.start()
    print("🧠 OODA Loop запущено")

    yield

    # Shutdown
    ooda.stop()
    await main_engine.dispose()


app = FastAPI(
    title="PREDATOR Analytics Kaggle Node",
    version=VERSION,
    description="Продакшн бекенд для Kaggle CPU-Only Node",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# 10. API ЕНДПОІНТИ — HEALTH & MONITORING
# ═══════════════════════════════════════════════════════════════

@app.get("/health")
@app.get("/health/live")
@app.get("/health/ready")
@app.get("/api/v1/health")
@app.get("/api/v1/health/ready")
@app.get("/api/v1/monitoring/health")
async def health():
    """Перевірка здоров'я системи."""
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "status": "ONLINE",
        "mode": "KAGGLE_CPU_NATIVE",
        "node": "KAGGLE_PRODUCTION",
        "version": VERSION,
        "timestamp": datetime.now(UTC).isoformat(),
        "ram_used_gb": round(mem.used / 1024**3, 2),
        "ram_total_gb": round(mem.total / 1024**3, 2),
        "ram_percent": mem.percent,
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "disk_used_gb": round(disk.used / 1024**3, 2),
        "disk_total_gb": round(disk.total / 1024**3, 2),
        "databases": {
            "postgresql": "sqlite (main)",
            "clickhouse": "sqlite (time-series)",
            "neo4j": f"networkx ({neo4j.graph.number_of_nodes()} nodes)",
            "redis": f"dict ({len(redis_mock.store)} keys)",
            "qdrant": f"numpy ({len(qdrant.vectors)} collections)",
            "opensearch": "sqlite (fts)",
            "kafka": f"threading ({len(kafka.topics)} topics)",
            "minio": "files (local)",
            "timescaledb": "sqlite (hypertable)",
            "mongodb": "sqlite (document)",
        },
    }


@app.get("/api/v1/azr/status")
@app.get("/api/v45/azr/status")
async def azr_status():
    """Статус AZR автономної системи."""
    return {
        "status": "active",
        "mode": "KAGGLE_CPU",
        "version": VERSION,
        "generation": 42,
        "phase_name": "Режим Рекомендацій",
        "uptime": "124г",
        "health": 99.8,
        "active": True,
    }


# ═══════════════════════════════════════════════════════════════
# 11. AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    """Модель запиту логіну."""
    username: str
    password: str


@app.post("/api/v1/auth/login")
async def login(body: LoginRequest):
    """Авторизація (JWT)."""
    async with main_session() as session:
        result = await session.execute(
            select(User).where(User.username == body.username)
        )
        user = result.scalar_one_or_none()
        if not user or not _verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Невірний логін або пароль")
        token = _create_token(
            {"sub": user.username, "role": user.role, "tenant_id": "predator"},
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        }


@app.get("/api/v1/auth/me")
async def get_me(current_user: User | None = Depends(get_current_user)):
    """Інформація про поточного користувача."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Не авторизовано")
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }


# ═══════════════════════════════════════════════════════════════
# 12. COMPANIES ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/companies")
async def list_companies(
    search: str = "", region: str = "", industry: str = "",
    min_risk: float = 0.0, max_risk: float = 100.0,
    status: str = "", sort_by: str = "name", sort_order: str = "asc",
    limit: int = 25, offset: int = 0,
):
    """Список компаній з фільтрацією, сортуванням та пагінацією."""
    async with main_session() as session:
        q = select(Company)
        if search:
            q = q.where(Company.name.ilike(f"%{search}%"))
        if region:
            q = q.where(Company.region == region)
        if industry:
            q = q.where(Company.industry == industry)
        if min_risk > 0:
            q = q.where(Company.risk_score >= min_risk)
        if max_risk < 100:
            q = q.where(Company.risk_score <= max_risk)
        if status:
            q = q.where(Company.status == status)

        sort_col = getattr(Company, sort_by, Company.name)
        q = q.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        items = (await session.execute(q.offset(offset).limit(limit))).scalars().all()

        return {
            "companies": [
                {
                    "ueid": c.ueid, "name": c.name, "edrpou": c.edrpou,
                    "status": c.status, "risk_score": c.risk_score,
                    "region": c.region, "industry": c.industry,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in items
            ],
            "total": total, "limit": limit, "offset": offset,
        }


@app.post("/api/v1/companies")
async def create_company(
    ueid: str, name: str, edrpou: str = "",
    status: str = "ACTIVE", risk_score: float = 0.0,
    region: str = "Kyiv", industry: str = "Unknown",
):
    """Створити нову компанію."""
    async with main_session() as session:
        company = Company(
            ueid=ueid, name=name, edrpou=edrpou,
            status=status, risk_score=risk_score,
            region=region, industry=industry,
        )
        session.add(company)
        await session.commit()
        return {"ueid": company.ueid, "name": company.name, "status": "created"}


@app.put("/api/v1/companies/{ueid}")
async def update_company(
    ueid: str, name: str | None = None, status: str | None = None,
    risk_score: float | None = None, region: str | None = None,
    industry: str | None = None,
):
    """Оновити компанію."""
    async with main_session() as session:
        result = await session.execute(select(Company).where(Company.ueid == ueid))
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=404, detail="Компанію не знайдено")
        if name is not None: company.name = name
        if status is not None: company.status = status
        if risk_score is not None: company.risk_score = risk_score
        if region is not None: company.region = region
        if industry is not None: company.industry = industry
        await session.commit()
        return {"ueid": company.ueid, "name": company.name, "status": "updated"}


@app.delete("/api/v1/companies/{ueid}")
async def delete_company(ueid: str):
    """Видалити компанію."""
    async with main_session() as session:
        result = await session.execute(select(Company).where(Company.ueid == ueid))
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=404, detail="Компанію не знайдено")
        await session.delete(company)
        await session.commit()
        return {"message": "Компанію успішно видалено"}


@app.get("/api/v1/companies/export/csv")
async def export_companies_csv(region: str = "", industry: str = ""):
    """Експорт компаній у CSV."""
    async with main_session() as session:
        q = select(Company)
        if region: q = q.where(Company.region == region)
        if industry: q = q.where(Company.industry == industry)
        items = (await session.execute(q)).scalars().all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["UEID", "Name", "EDRPOU", "Status", "Risk Score", "Region", "Industry"])
        for c in items:
            writer.writerow([c.ueid, c.name, c.edrpou, c.status, c.risk_score, c.region, c.industry])
        return {"csv": output.getvalue(), "count": len(items)}


# ═══════════════════════════════════════════════════════════════
# 13. TRANSACTIONS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/transactions")
async def list_transactions(
    company_ueid: str = "", direction: str = "",
    risk_flag: bool | None = None,
    min_value: float = 0.0, max_value: float = 999999999.0,
    limit: int = 25, offset: int = 0,
):
    """Список митних транзакцій з фільтрацією."""
    async with main_session() as session:
        q = select(Transaction).order_by(Transaction.declaration_date.desc())
        if company_ueid: q = q.where(Transaction.company_ueid == company_ueid)
        if direction: q = q.where(Transaction.direction == direction)
        if risk_flag is not None: q = q.where(Transaction.risk_flag == risk_flag)
        if min_value > 0: q = q.where(Transaction.value_usd >= min_value)
        if max_value < 999999999: q = q.where(Transaction.value_usd <= max_value)
        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        items = (await session.execute(q.offset(offset).limit(limit))).scalars().all()
        return {
            "transactions": [
                {
                    "id": t.id, "company_ueid": t.company_ueid, "direction": t.direction,
                    "goods_description": t.goods_description, "value_usd": t.value_usd,
                    "weight_kg": t.weight_kg, "origin_country": t.origin_country,
                    "destination_country": t.destination_country,
                    "customs_office": t.customs_office, "hs_code": t.hs_code,
                    "declaration_date": t.declaration_date.isoformat() if t.declaration_date else None,
                    "risk_flag": t.risk_flag,
                }
                for t in items
            ],
            "total": total, "limit": limit, "offset": offset,
        }


# ═══════════════════════════════════════════════════════════════
# 14. ALERTS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/alerts")
async def list_alerts(
    severity: str = "", resolved: bool | None = None,
    alert_type: str = "", limit: int = 10, offset: int = 0,
):
    """Список алертів з фільтрацією."""
    async with main_session() as session:
        q = select(Alert).order_by(Alert.timestamp.desc())
        if severity: q = q.where(Alert.severity == severity)
        if resolved is not None: q = q.where(Alert.resolved == resolved)
        if alert_type: q = q.where(Alert.alert_type == alert_type)
        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        items = (await session.execute(q.offset(offset).limit(limit))).scalars().all()
        return {
            "alerts": [
                {
                    "id": a.id, "severity": a.severity, "message": a.message,
                    "timestamp": a.timestamp.isoformat(), "company_ueid": a.company_ueid,
                    "resolved": a.resolved, "alert_type": a.alert_type,
                }
                for a in items
            ],
            "total": total, "limit": limit, "offset": offset,
        }


@app.put("/api/v1/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Відмітити алерт як вирішений."""
    async with main_session() as session:
        result = await session.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()
        if not alert:
            raise HTTPException(status_code=404, detail="Алерт не знайдено")
        alert.resolved = True
        await session.commit()
        return {"message": "Алерт відмічено як вирішений", "alert_id": alert_id}


# ═══════════════════════════════════════════════════════════════
# 15. DASHBOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/dashboard/overview")
async def dashboard_overview():
    """Огляд дашборду."""
    async with main_session() as session:
        tc = (await session.execute(select(func.count()).select_from(Company))).scalar()
        hr = (await session.execute(select(func.count()).select_from(Company).where(Company.risk_score >= 70))).scalar()
        cr = (await session.execute(select(func.count()).select_from(Company).where(Company.risk_score >= 90))).scalar()
        ua = (await session.execute(select(func.count()).select_from(Alert).where(Alert.resolved == False))).scalar()  # noqa: E712
        tt = (await session.execute(select(func.count()).select_from(Transaction))).scalar()

        # Розподіл по регіонах
        region_result = await session.execute(
            select(Company.region, func.count()).group_by(Company.region)
        )
        regions = {r[0]: r[1] for r in region_result.all()}

        # Розподіл по індустріях
        industry_result = await session.execute(
            select(Company.industry, func.count()).group_by(Company.industry)
        )
        industries = {i[0]: i[1] for i in industry_result.all()}

        return {
            "timestamp": datetime.now(UTC).isoformat(),
            "total_companies": tc,
            "high_risk": hr,
            "critical_risk": cr,
            "unresolved_alerts": ua,
            "total_transactions": tt,
            "ooda_cycles": ooda.cycles_completed,
            "graph_nodes": neo4j.graph.number_of_nodes(),
            "graph_edges": neo4j.graph.number_of_edges(),
            "redis_keys": len(redis_mock.store),
            "kafka_topics": len(kafka.topics),
            "regions": regions,
            "industries": industries,
            "generated_at": datetime.now(UTC).isoformat(),
        }


# ═══════════════════════════════════════════════════════════════
# 16. RISK ENGINE
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/risk/company/{ueid}")
async def company_risk(ueid: str):
    """Оцінка ризику компанії (Risk Engine v56.5)."""
    async with main_session() as session:
        risk = (await session.execute(
            select(RiskAssessment).where(RiskAssessment.ueid == ueid)
        )).scalar_one_or_none()
        if risk:
            return {
                "ueid": risk.ueid, "score": risk.score, "level": risk.level,
                "layers": {
                    "structural": risk.structural, "behavioral": risk.behavioral,
                    "sanctions": risk.sanctions, "aml": risk.aml,
                },
                "explanation": risk.explanation,
                "updated_at": risk.updated_at.isoformat() if risk.updated_at else None,
            }
        return {
            "ueid": ueid, "score": 50.0, "level": "MEDIUM",
            "layers": {"structural": 50, "behavioral": 50, "sanctions": 50, "aml": 50},
            "explanation": "Дані про ризик не знайдено. Використано дефолтні значення.",
        }


# ═══════════════════════════════════════════════════════════════
# 17. OSINT / DUE DILIGENCE
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/osint/diligence/{ueid}")
async def diligence(ueid: str):
    """OSINT Due Diligence для компанії."""
    async with main_session() as session:
        c = (await session.execute(select(Company).where(Company.ueid == ueid))).scalar_one_or_none()
        if c:
            rf = []
            if c.risk_score >= 70: rf.append("HIGH_RISK_SCORE")
            if c.risk_score >= 80: rf.append("SANCTIONS_RISK")
            if c.risk_score >= 90: rf.append("CRITICAL_FRAUD_RISK")
            if c.status != "ACTIVE": rf.append("INACTIVE_STATUS")
            return {
                "ueid": ueid, "name": c.name, "edrpou": c.edrpou,
                "region": c.region, "industry": c.industry,
                "red_flags": rf or ["NO_FLAGS"],
                "summary": f"Компанія {c.name} (ЄДРПОУ: {c.edrpou}) має ризик {c.risk_score}. Статус: {c.status}.",
            }
        return {
            "ueid": ueid, "name": "Невідома компанія",
            "red_flags": ["COMPANY_NOT_FOUND"],
            "summary": "Компанію не знайдено в базі даних.",
        }


@app.get("/api/v1/osint/tools")
async def osint_tools():
    """Доступні OSINT інструменти."""
    return {
        "tools": [
            {"id": "tool-1", "name": "ЄДР (Єдиний державний реєстр)", "status": "ACTIVE"},
            {"id": "tool-2", "name": "Sanctions Screening (OFAC, ЄС, ООН)", "status": "ACTIVE"},
            {"id": "tool-3", "name": "PEP Check (Політично значущі особи)", "status": "ACTIVE"},
            {"id": "tool-4", "name": "Media Monitoring (новинний моніторинг)", "status": "ACTIVE"},
            {"id": "tool-5", "name": "Court Registry (судовий реєстр)", "status": "ACTIVE"},
            {"id": "tool-6", "name": "Prozorro (публічні закупівлі)", "status": "ACTIVE"},
            {"id": "tool-7", "name": "Maritime AIS Tracking", "status": "ACTIVE"},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 18. GRAPH ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/graph/summary")
async def graph_summary():
    """Статистика графу зв'язків."""
    return {
        "node_count": neo4j.graph.number_of_nodes(),
        "relationship_count": neo4j.graph.number_of_edges(),
        "labels": ["Company", "Person", "Asset", "Transaction"],
        "types": ["OWNER_OF", "DIRECTOR_OF", "TRANSFER_TO", "INVESTS_IN", "SUPPLIES"],
        "components": nx.number_weakly_connected_components(neo4j.graph),
        "density": round(nx.density(neo4j.graph), 6),
    }


@app.get("/api/v1/graph/subgraph/{ueid}")
async def get_subgraph(ueid: str, depth: int = 2):
    """Підграф зв'язків компанії."""
    return neo4j.get_subgraph(ueid, depth)


# ═══════════════════════════════════════════════════════════════
# 19. SYSTEM ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/system/stats")
@app.get("/api/v1/system/metrics")
@app.get("/api/v45/system/status")
async def system_stats():
    """Системні метрики."""
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "cpu_count": psutil.cpu_count(),
        "ram_used_gb": round(mem.used / 1024**3, 2),
        "ram_total_gb": round(mem.total / 1024**3, 2),
        "ram_percent": mem.percent,
        "disk_used_gb": round(disk.used / 1024**3, 2),
        "disk_total_gb": round(disk.total / 1024**3, 2),
        "disk_percent": round(disk.used / disk.total * 100, 1),
        "uptime_seconds": int(time.time() - psutil.boot_time()),
    }


@app.get("/api/v1/system/nodes")
async def system_nodes():
    """Список обчислювальних вузлів."""
    return {
        "nodes": [
            {"id": "kaggle-prod", "name": "Kaggle Production Node", "status": "ONLINE",
             "role": "compute", "version": VERSION, "cpu_count": psutil.cpu_count(),
             "ram_gb": round(psutil.virtual_memory().total / 1024**3, 1)},
        ]
    }


@app.get("/api/v1/system/databases/status")
async def databases_status():
    """Статус всіх 10 баз даних."""
    return {
        "databases": [
            {"name": "PostgreSQL", "status": "ONLINE", "type": "SQLite (main)", "role": "SSOT"},
            {"name": "ClickHouse", "status": "ONLINE", "type": "SQLite (OLAP)", "role": "Analytics"},
            {"name": "Neo4j", "status": "ONLINE", "type": "NetworkX", "nodes": neo4j.graph.number_of_nodes(), "edges": neo4j.graph.number_of_edges()},
            {"name": "Redis", "status": "ONLINE", "type": "Dict", "keys": len(redis_mock.store)},
            {"name": "Qdrant", "status": "ONLINE", "type": "NumPy", "collections": len(qdrant.vectors)},
            {"name": "OpenSearch", "status": "ONLINE", "type": "SQLite (FTS)", "role": "Search"},
            {"name": "Kafka", "status": "ONLINE", "type": "Threading", "topics": len(kafka.topics)},
            {"name": "MinIO", "status": "ONLINE", "type": "Files", "path": minio.base_path},
            {"name": "TimescaleDB", "status": "ONLINE", "type": "SQLite", "role": "TimeSeries"},
            {"name": "MongoDB", "status": "ONLINE", "type": "SQLite", "role": "Documents"},
        ]
    }


@app.get("/api/v1/system/logs/stream")
@app.get("/api/v1/monitoring/logs/stream")
async def system_logs(limit: int = 50):
    """Системні логи."""
    logs = [
        {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": f"Kaggle backend {VERSION} operational"},
        {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": "SQLite databases connected (10/10)"},
        {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": f"OODA Loop: {ooda.current_phase} (cycle {ooda.cycles_completed})"},
        {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": f"Graph: {neo4j.graph.number_of_nodes()} nodes, {neo4j.graph.number_of_edges()} edges"},
    ]
    # Додаємо останні OODA логи
    for log_line in ooda.logs[-20:]:
        logs.append({"timestamp": datetime.now(UTC).isoformat(), "level": "DEBUG", "message": log_line})
    return {"logs": logs[:limit]}


@app.post("/api/v1/system/diagnostics/run")
async def run_diagnostics():
    """Діагностика системи."""
    return {
        "status": "completed",
        "timestamp": datetime.now(UTC).isoformat(),
        "results": {
            "cpu": "OK", "memory": "OK", "disk": "OK",
            "database": "OK", "ooda_loop": "RUNNING" if ooda.is_running else "IDLE",
            "neo4j": "OK", "redis": "OK", "qdrant": "OK",
            "kafka": "OK", "minio": "OK",
        },
    }


@app.get("/api/v1/system/metrics/history")
async def metrics_history():
    """Історія системних метрик."""
    now = datetime.now(UTC)
    return {
        "metrics": [
            {"timestamp": (now - timedelta(minutes=i * 5)).isoformat(),
             "cpu": round(10 + (i * 3.7) % 30, 1),
             "memory": round(40 + (i * 2.1) % 20, 1),
             "disk": round(55 + (i * 0.3) % 5, 1)}
            for i in range(24)
        ]
    }


@app.get("/api/v1/system/nexus/scenarios")
async def nexus_scenarios():
    """Сценарії Nexus аналізу."""
    return {
        "scenarios": [
            {"id": "nexus-1", "name": "Аналіз ланцюгів постачання", "status": "ACTIVE", "companies_analyzed": NUM_COMPANIES},
            {"id": "nexus-2", "name": "Виявлення пов'язаних осіб", "status": "ACTIVE", "connections_found": neo4j.graph.number_of_edges()},
            {"id": "nexus-3", "name": "Міжнародні транзакційні схеми", "status": "STANDBY", "patterns_found": 42},
        ]
    }


@app.get("/api/v1/system/lockdown")
@app.get("/api/v45/system/lockdown")
async def system_lockdown_status():
    """Статус системного блокування."""
    return {"locked": False, "reason": None, "locked_by": None}


@app.post("/api/v45/system/lockdown")
async def system_lockdown_toggle():
    """Перемикання блокування."""
    return {"locked": False, "message": "Lockdown стан оновлено"}


@app.get("/api/v1/system/infrastructure")
async def system_infrastructure():
    """Інфраструктура системи."""
    return {
        "infrastructure": {
            "compute_nodes": 1,
            "databases": 10,
            "total_storage_gb": 30,
            "network": "zrok tunnel",
        }
    }


@app.get("/api/v1/system/engines")
async def system_engines():
    """Стан аналітичних двигунів."""
    return {
        "engines": [
            {"id": "risk-engine", "name": "Risk Engine v56.5", "status": "ACTIVE", "accuracy": 96.5},
            {"id": "insight-engine", "name": "Insight Engine", "status": "ACTIVE", "accuracy": 94.2},
            {"id": "graph-engine", "name": "Graph Analytics", "status": "ACTIVE", "nodes": neo4j.graph.number_of_nodes()},
            {"id": "anomaly-engine", "name": "Anomaly Detector", "status": "ACTIVE", "tps": 847},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 20. FACTORY / OODA ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/factory/stats")
async def factory_stats():
    """Статистика фабрики."""
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "patterns_processed": 1247 + ooda.cycles_completed * 12,
        "anomalies_detected": 23 + ooda.cycles_completed,
        "accuracy": 94.2,
        "models_trained": 15,
        "active_experiments": 3,
        "active_agents": 42,
        "total_tasks": 1250,
        "success_rate": 98.5,
        "avg_latency_ms": 120,
        "vram_usage_gb": 0.0,
    }


@app.get("/api/v1/factory/ooda")
async def get_ooda():
    """Статус OODA Loop."""
    return {
        "is_running": ooda.is_running,
        "current_phase": ooda.current_phase,
        "cycles": ooda.cycles_completed,
        "logs": ooda.logs[-20:],
    }


@app.post("/api/v1/factory/infinite/start")
async def start_ooda():
    """Запуск OODA Loop."""
    ooda.start()
    return {"status": "started", "phase": ooda.current_phase}


@app.post("/api/v1/factory/infinite/stop")
async def stop_ooda():
    """Зупинка OODA Loop."""
    ooda.stop()
    return {"status": "stopped", "phase": ooda.current_phase}


@app.get("/api/v1/factory/infinite/status")
async def ooda_status():
    """Статус нескінченного вдосконалення."""
    return {
        "is_running": ooda.is_running,
        "current_phase": ooda.current_phase,
        "cycles": ooda.cycles_completed,
        "mode": "AUTONOMOUS",
    }


@app.get("/api/v1/factory/patterns/gold")
async def gold_patterns():
    """Gold Patterns для виявлення ризиків."""
    return {
        "patterns": [
            {"id": "gp-1", "name": "Gold Pattern v5.0", "accuracy": 96.5, "status": "ACTIVE", "detections": 847},
            {"id": "gp-2", "name": "Fraud Detection v3.2", "accuracy": 89.1, "status": "ACTIVE", "detections": 412},
            {"id": "gp-3", "name": "Sanctions Evasion v2.1", "accuracy": 92.3, "status": "ACTIVE", "detections": 156},
            {"id": "gp-4", "name": "Money Laundering v4.0", "accuracy": 91.7, "status": "ACTIVE", "detections": 289},
            {"id": "gp-5", "name": "Tax Avoidance v1.8", "accuracy": 87.5, "status": "ACTIVE", "detections": 134},
        ]
    }


@app.get("/api/v1/factory/bugs")
async def factory_bugs():
    """Виявлені баги/аномалії фабрикою."""
    return {
        "bugs": [
            {"id": "bug-1", "severity": "low", "description": "Затримка в обробці batch #42", "status": "fixed"},
            {"id": "bug-2", "severity": "medium", "description": "Memory spike при агрегації >100k записів", "status": "investigating"},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 21. TORNADO INSIGHTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/tornado/stats")
async def tornado_stats():
    """Tornado Strategic Radar."""
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "modules": [
            {"id": "forecast", "accuracy": 94.2, "status": "ACTIVE", "predictions": 1520},
            {"id": "market", "entities": NUM_COMPANIES, "status": "LIVE", "coverage": "85%"},
            {"id": "graph", "nodes": neo4j.graph.number_of_nodes(), "status": "ACTIVE", "edges": neo4j.graph.number_of_edges()},
            {"id": "diligence", "flags": 12, "status": "ACTIVE", "checks": 3400},
            {"id": "anomaly", "tps": 847, "status": "LIVE", "detections": 2341},
            {"id": "scenario", "active": 3, "status": "WAR_ROOM", "simulations": 15},
        ],
    }


# ═══════════════════════════════════════════════════════════════
# 22. WARGAMING
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/wargaming/scenarios")
async def wargaming_scenarios():
    """Сценарії War Gaming."""
    return {
        "scenarios": [
            {"id": "wg-1", "name": "Митна криза: контрабанда через західний кордон", "status": "ACTIVE", "participants": 5},
            {"id": "wg-2", "name": "Обхід санкцій через офшорні компанії", "status": "STANDBY", "participants": 3},
            {"id": "wg-3", "name": "Фіктивний імпорт електроніки", "status": "ACTIVE", "participants": 7},
            {"id": "wg-4", "name": "Зловживання ціноутворенням у Prozorro", "status": "ACTIVE", "participants": 4},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 23. AGENTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/agents")
@app.get("/api/v1/ai/agents")
async def list_agents():
    """Список AI агентів."""
    return {
        "agents": [
            {"id": "sentinel-1", "name": "Sentinel V1", "status": "ACTIVE", "type": "monitoring", "tasks_completed": 1520},
            {"id": "sentinel-2", "name": "Sentinel V2", "status": "STANDBY", "type": "analysis", "tasks_completed": 890},
            {"id": "guardian-1", "name": "Guardian", "status": "ACTIVE", "type": "defense", "tasks_completed": 2340},
            {"id": "hunter-1", "name": "Hunter", "status": "ACTIVE", "type": "osint", "tasks_completed": 567},
            {"id": "oracle-1", "name": "Oracle", "status": "ACTIVE", "type": "prediction", "tasks_completed": 1234},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 24. FINANCE ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/financial/swift-transactions")
async def swift_transactions():
    """SWIFT транзакції."""
    return {
        "transactions": [
            {"id": "SW-001", "sender": "ТОВ АЛЬФА ГРУП", "receiver": "XYZ Corp London", "amount_usd": 245000, "currency": "USD", "date": "2026-05-28", "status": "completed", "risk_level": "HIGH"},
            {"id": "SW-002", "sender": "ПП БЕТА СЕРВІС", "receiver": "ABC GmbH Berlin", "amount_usd": 180000, "currency": "EUR", "date": "2026-05-27", "status": "pending", "risk_level": "MEDIUM"},
            {"id": "SW-003", "sender": "ТОВ ГАММА ТРЕЙД", "receiver": "Delta LLC Dubai", "amount_usd": 890000, "currency": "USD", "date": "2026-05-26", "status": "flagged", "risk_level": "CRITICAL"},
        ]
    }


@app.get("/api/v1/financial/offshore-entities")
async def offshore_entities():
    """Офшорні сутності."""
    return {
        "entities": [
            {"id": "OFF-001", "name": "Sunrise Holdings Ltd", "jurisdiction": "BVI", "connected_ueid": "COMP-0005", "risk_score": 92},
            {"id": "OFF-002", "name": "Pacific Ventures SA", "jurisdiction": "Panama", "connected_ueid": "COMP-0012", "risk_score": 88},
            {"id": "OFF-003", "name": "Global Trade FZE", "jurisdiction": "UAE", "connected_ueid": "COMP-0022", "risk_score": 75},
        ]
    }


@app.get("/api/v1/financial/frozen-assets")
async def frozen_assets():
    """Заморожені активи."""
    return {
        "assets": [
            {"id": "FA-001", "company": "ТОВ ГАММА ТРЕЙД", "amount_usd": 1250000, "reason": "Санкційне обмеження", "date": "2026-04-15", "authority": "РНБО"},
            {"id": "FA-002", "company": "ТОВ КАППА ФІНАНС", "amount_usd": 890000, "reason": "Підозра у відмиванні", "date": "2026-03-22", "authority": "ДСФМУ"},
        ]
    }


@app.get("/api/v1/financial/contract-anomalies")
async def contract_anomalies():
    """Аномалії контрактів."""
    return {
        "anomalies": [
            {"id": "CA-001", "type": "price_deviation", "company": "ТОВ АЛЬФА ГРУП", "deviation_pct": 34.5, "description": "Ціна контракту на 34.5% вище ринкової"},
            {"id": "CA-002", "type": "volume_spike", "company": "ПП БЕТА СЕРВІС", "deviation_pct": 420.0, "description": "Різке зростання обсягу закупівель"},
        ]
    }


@app.post("/api/v1/finance/portfolio-risk/var")
async def portfolio_var():
    """Value at Risk портфеля."""
    return {
        "var_95": 124500.0, "var_99": 234000.0,
        "confidence": 0.95,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get("/api/v1/portfolio/risk-positions")
async def portfolio_risk_positions():
    """Ризикові позиції портфеля."""
    return {
        "positions": [
            {"id": "POS-001", "asset": "UA Bonds 2027", "value_usd": 500000, "risk_pct": 12.5, "var": 62500},
            {"id": "POS-002", "asset": "UA Equities ETF", "value_usd": 300000, "risk_pct": 18.2, "var": 54600},
            {"id": "POS-003", "asset": "EU Trade Credits", "value_usd": 750000, "risk_pct": 8.1, "var": 60750},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 25. MARITIME & LOGISTICS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/maritime/vessels")
async def maritime_vessels():
    """Судна під моніторингом."""
    return {
        "vessels": [
            {"id": "V-001", "name": "MV Odesa Star", "imo": "9876543", "flag": "UA", "status": "underway", "lat": 46.4825, "lng": 30.7233, "destination": "Istanbul"},
            {"id": "V-002", "name": "SS Black Sea Runner", "imo": "9765432", "flag": "PA", "status": "anchored", "lat": 41.0082, "lng": 28.9784, "destination": "Odesa"},
            {"id": "V-003", "name": "MV Dnipro Carrier", "imo": "9654321", "flag": "MT", "status": "underway", "lat": 44.4268, "lng": 26.1025, "destination": "Constanța"},
        ]
    }


@app.get("/api/v1/maritime/ports")
async def maritime_ports():
    """Порти."""
    return {
        "ports": [
            {"id": "P-001", "name": "Одеса", "country": "UA", "vessels_count": 12, "risk_level": "MEDIUM"},
            {"id": "P-002", "name": "Чорноморськ", "country": "UA", "vessels_count": 8, "risk_level": "LOW"},
            {"id": "P-003", "name": "Миколаїв", "country": "UA", "vessels_count": 5, "risk_level": "HIGH"},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 26. REGISTRIES
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/registries/search")
async def registries_search(q: str = "", limit: int = 10):
    """Пошук у реєстрах."""
    async with main_session() as session:
        query = select(Company)
        if q:
            query = query.where(
                Company.name.ilike(f"%{q}%") | Company.edrpou.ilike(f"%{q}%")
            )
        items = (await session.execute(query.limit(limit))).scalars().all()
        return {
            "results": [
                {"ueid": c.ueid, "name": c.name, "edrpou": c.edrpou,
                 "status": c.status, "region": c.region, "industry": c.industry}
                for c in items
            ],
            "total": len(items),
        }


@app.get("/api/v1/registries/company/{edrpou}")
async def registry_company(edrpou: str):
    """Інформація про компанію за ЄДРПОУ."""
    async with main_session() as session:
        c = (await session.execute(select(Company).where(Company.edrpou == edrpou))).scalar_one_or_none()
        if c:
            return {
                "ueid": c.ueid, "name": c.name, "edrpou": c.edrpou,
                "status": c.status, "risk_score": c.risk_score,
                "region": c.region, "industry": c.industry,
                "registration_date": c.created_at.isoformat() if c.created_at else None,
            }
        raise HTTPException(status_code=404, detail="Компанію не знайдено за ЄДРПОУ")


# ═══════════════════════════════════════════════════════════════
# 27. INTEL / OSINT CHANNELS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/intel/channels")
async def intel_channels():
    """Канали розвідки."""
    return {
        "channels": [
            {"id": "ch-1", "name": "Telegram OSINT", "status": "ACTIVE", "messages_today": 245},
            {"id": "ch-2", "name": "Dark Web Monitor", "status": "ACTIVE", "messages_today": 18},
            {"id": "ch-3", "name": "News Aggregator", "status": "ACTIVE", "messages_today": 892},
            {"id": "ch-4", "name": "Social Media Scanner", "status": "ACTIVE", "messages_today": 1204},
        ]
    }


@app.get("/api/v1/intel/messages")
async def intel_messages(channel_id: str = "", limit: int = 20):
    """Повідомлення розвідки."""
    return {
        "messages": [
            {"id": "msg-1", "channel": "Telegram OSINT", "content": "Виявлено підозрілу активність у секторі імпорту електроніки", "timestamp": datetime.now(UTC).isoformat(), "priority": "HIGH"},
            {"id": "msg-2", "channel": "News Aggregator", "content": "Нові санкції ЄС проти 12 українських компаній", "timestamp": datetime.now(UTC).isoformat(), "priority": "CRITICAL"},
            {"id": "msg-3", "channel": "Dark Web Monitor", "content": "Дамп даних ЄДР виставлений на продаж", "timestamp": datetime.now(UTC).isoformat(), "priority": "HIGH"},
        ]
    }


@app.get("/api/v1/intel/hot-topics")
async def intel_hot_topics():
    """Гарячі теми розвідки."""
    return {
        "topics": [
            {"id": "ht-1", "title": "Контрабанда через західний кордон", "mentions": 45, "trend": "rising"},
            {"id": "ht-2", "title": "Офшорні схеми через ОАЕ", "mentions": 32, "trend": "stable"},
            {"id": "ht-3", "title": "Зерновий коридор — нові ризики", "mentions": 67, "trend": "rising"},
        ]
    }


@app.get("/api/v1/intel/disinfo-alerts")
async def intel_disinfo():
    """Алерти дезінформації."""
    return {
        "alerts": [
            {"id": "dis-1", "source": "Telegram", "claim": "Масова блокування рахунків імпортерів", "status": "debunked", "confidence": 0.15},
            {"id": "dis-2", "source": "Social Media", "claim": "Нові тарифи на імпорт з 1 липня", "status": "unverified", "confidence": 0.45},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 28. PROZORRO (PUBLIC PROCUREMENT)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/osint_ua/prozorro/tenders")
async def prozorro_tenders(limit: int = 10, offset: int = 0):
    """Тендери Prozorro."""
    tenders = []
    for i in range(1, min(limit + 1, 31)):
        tenders.append({
            "id": f"UA-2026-05-{i:02d}-{10000 + i}",
            "title": f"Закупівля {_GOODS[i % len(_GOODS)]} для державних потреб",
            "status": "active" if i % 3 != 0 else "completed",
            "amount_uah": round(500000 + (i * 137000) % 9500000),
            "buyer": _gen_company_name(i),
            "region": _CITIES[i % len(_CITIES)],
            "deadline": (datetime.now(UTC) + timedelta(days=i * 3)).isoformat(),
        })
    return {"tenders": tenders, "total": 30, "limit": limit, "offset": offset}


@app.get("/api/v1/osint_ua/prozorro/stats")
async def prozorro_stats():
    """Статистика Prozorro."""
    return {
        "total_tenders": 15420,
        "total_value_uah": 45_200_000_000,
        "active_tenders": 3240,
        "completed_tenders": 12180,
        "avg_competition": 4.2,
        "savings_pct": 18.5,
        "top_categories": [
            {"name": "Будматеріали", "count": 2340, "value_uah": 8_500_000_000},
            {"name": "Медикаменти", "count": 1890, "value_uah": 6_200_000_000},
            {"name": "ІТ послуги", "count": 1560, "value_uah": 4_800_000_000},
        ],
    }


@app.get("/api/v1/osint_ua/prozorro/analytics")
async def prozorro_analytics():
    """Аналітика Prozorro."""
    return {
        "risk_indicators": [
            {"indicator": "Одиничний учасник", "count": 456, "risk_level": "HIGH"},
            {"indicator": "Ціна > 120% від ринкової", "count": 123, "risk_level": "CRITICAL"},
            {"indicator": "Скасовані тендери", "count": 89, "risk_level": "MEDIUM"},
        ],
        "monthly_trend": [
            {"month": "2026-01", "tenders": 1240, "value_uah": 3_800_000_000},
            {"month": "2026-02", "tenders": 1380, "value_uah": 4_100_000_000},
            {"month": "2026-03", "tenders": 1520, "value_uah": 4_500_000_000},
            {"month": "2026-04", "tenders": 1410, "value_uah": 4_200_000_000},
            {"month": "2026-05", "tenders": 1620, "value_uah": 4_900_000_000},
        ],
    }


# ═══════════════════════════════════════════════════════════════
# 29. AI / COPILOT ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/api/v1/ai/query")
@app.post("/api/v1/nexus/chat")
async def ai_query(request: Request):
    """AI запит / Nexus Chat."""
    body = await request.json()
    query = body.get("query", body.get("message", ""))
    return {
        "response": f"[PREDATOR AI] Аналіз запиту: '{query[:100]}'. "
                     "На основі даних Risk Engine v56.5 та графового аналізу Neo4j, "
                     "виявлено 3 потенційні ризикові зв'язки. Рекомендовано поглиблений Due Diligence.",
        "confidence": 0.87,
        "sources": ["Risk Engine v56.5", "Neo4j Graph", "OpenSearch FTS"],
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.post("/api/v1/copilot/chat")
async def copilot_chat(request: Request):
    """AI Copilot Chat."""
    body = await request.json()
    message = body.get("message", body.get("query", ""))
    return {
        "response": f"Аналізую ваш запит: '{message[:80]}'. "
                     "За даними PREDATOR Analytics, ситуація потребує додаткового моніторингу. "
                     "Рекомендую перевірити санкційні списки OFAC та ЄС.",
        "model": "PREDATOR-Copilot-v67",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get("/api/v1/ai/hypotheses")
async def ai_hypotheses():
    """AI гіпотези."""
    return {
        "hypotheses": [
            {"id": "hyp-1", "title": "Можлива контрабанда через Одеський порт", "confidence": 0.82, "evidence_count": 7, "status": "investigating"},
            {"id": "hyp-2", "title": "Фіктивний експорт зернових", "confidence": 0.75, "evidence_count": 12, "status": "confirmed"},
            {"id": "hyp-3", "title": "Відмивання через IT-аутсорсинг", "confidence": 0.68, "evidence_count": 5, "status": "new"},
        ]
    }


@app.post("/api/v1/ai/hypotheses/generate")
async def generate_hypotheses(request: Request):
    """Генерація нових гіпотез."""
    return {
        "hypothesis": {
            "id": f"hyp-{uuid4().hex[:8]}",
            "title": "Автоматично згенерована гіпотеза на основі OODA аналізу",
            "confidence": 0.72,
            "evidence_count": 3,
            "status": "new",
        },
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get("/api/v1/intelligence/council-history")
async def council_history():
    """Історія Council рішень."""
    return [
        {"id": "ch-1", "query": "Яка стратегія захисту від картельних змов?",
         "final_answer": "Рекомендується впровадження графових алгоритмів Louvain для детекції прихованих зв'язків."},
        {"id": "ch-2", "query": "Як виявити phantom shipping?",
         "final_answer": "Порівняння AIS даних з митними деклараціями, аналіз weight/volume аномалій."},
    ]


# ═══════════════════════════════════════════════════════════════
# 30. INGESTION / ETL
# ═══════════════════════════════════════════════════════════════

@app.post("/api/v1/ingest/upload")
@app.post("/api/v1/data-hub/upload")
@app.post("/api/v1/ingestion/upload")
async def ingest_upload(request: Request):
    """Завантаження даних (інгестія)."""
    return {
        "status": "accepted",
        "job_id": f"job-{uuid4().hex[:8]}",
        "message": "Файл прийнято для обробки",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.post("/api/v1/ingest/upload/start")
async def ingest_upload_start(request: Request):
    """Початок завантаження."""
    return {"upload_id": f"upload-{uuid4().hex[:8]}", "status": "ready"}


@app.post("/api/v1/ingest/upload/chunk")
async def ingest_upload_chunk(request: Request):
    """Завантаження чанку."""
    return {"status": "accepted", "chunk": 1}


@app.post("/api/v1/ingest/upload/complete")
async def ingest_upload_complete(request: Request):
    """Завершення завантаження."""
    return {"status": "completed", "records_processed": 150}


@app.get("/api/v1/etl/jobs")
@app.get("/api/v45/etl/jobs")
async def etl_jobs():
    """Список ETL завдань."""
    return {
        "jobs": [
            {"id": "etl-1", "name": "customs_import_daily", "status": "completed", "records": 4520, "duration_s": 45},
            {"id": "etl-2", "name": "sanctions_update", "status": "completed", "records": 1200, "duration_s": 12},
            {"id": "etl-3", "name": "company_enrichment", "status": "running", "records": 890, "duration_s": 0},
        ]
    }


@app.get("/api/v1/etl/status")
async def etl_status():
    """Статус ETL пайплайну."""
    return {
        "status": "healthy",
        "pipelines_active": 3,
        "pipelines_failed": 0,
        "last_run": datetime.now(UTC).isoformat(),
        "total_records_today": 15420,
    }


# ═══════════════════════════════════════════════════════════════
# 31. UBO / PEP
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/ubo/map/{edrpou}")
async def ubo_map(edrpou: str):
    """Карта кінцевих бенефіціарів."""
    return {
        "edrpou": edrpou,
        "beneficiaries": [
            {"name": "Іванов Іван Іванович", "share_pct": 51.0, "is_pep": False, "country": "UA"},
            {"name": "Петренко Петро Петрович", "share_pct": 30.0, "is_pep": True, "country": "UA"},
            {"name": "Offshore Holdings Ltd", "share_pct": 19.0, "is_pep": False, "country": "BVI"},
        ],
    }


@app.get("/api/v1/ubo/pep-database")
async def pep_database():
    """PEP база даних."""
    return {
        "pep_entries": [
            {"name": "Петренко Петро Петрович", "position": "Народний депутат", "status": "active", "risk_level": "HIGH"},
            {"name": "Коваленко Оксана Миколаївна", "position": "Заступник міністра", "status": "active", "risk_level": "MEDIUM"},
            {"name": "Шевченко Андрій Вікторович", "position": "Голова обласної ради", "status": "former", "risk_level": "LOW"},
        ],
        "total": 3,
    }


# ═══════════════════════════════════════════════════════════════
# 32. GEO / M&A / MARKET
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/geo/risk-events")
async def geo_risk_events():
    """Географічні ризикові події."""
    return {
        "events": [
            {"id": "ge-1", "title": "Блокування порту Одеса", "lat": 46.4825, "lng": 30.7233, "severity": "HIGH", "date": "2026-05-28"},
            {"id": "ge-2", "title": "Митна перевірка на КПП Краковець", "lat": 49.9658, "lng": 23.1516, "severity": "MEDIUM", "date": "2026-05-27"},
            {"id": "ge-3", "title": "Затримання контрабанди в Чопі", "lat": 48.4340, "lng": 22.2046, "severity": "CRITICAL", "date": "2026-05-26"},
        ]
    }


@app.get("/api/v1/ma/targets")
async def ma_targets():
    """M&A цілі."""
    return {
        "targets": [
            {"id": "ma-1", "name": "ТОВ ТЕХНО ІННОВАЦІЯ", "valuation_usd": 15_000_000, "industry": "IT", "region": "Kyiv", "risk_score": 35},
            {"id": "ma-2", "name": "ПП АГРО ЛІДЕР", "valuation_usd": 8_000_000, "industry": "Agriculture", "region": "Vinnytsia", "risk_score": 22},
        ]
    }


@app.get("/api/v1/market/entry-scores")
async def market_entry_scores():
    """Оцінки входу на ринок."""
    return {
        "scores": [
            {"market": "IT Services UA", "score": 85, "growth_pct": 12.5, "risk": "LOW"},
            {"market": "Agriculture Export", "score": 72, "growth_pct": 8.3, "risk": "MEDIUM"},
            {"market": "Pharma Distribution", "score": 68, "growth_pct": 15.1, "risk": "HIGH"},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 33. MONITORING / CLUSTER
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/monitoring/cluster")
async def monitoring_cluster():
    """Стан кластеру."""
    return {
        "pods": [
            {"id": "kaggle-backend-1", "name": "kaggle-backend", "status": "Running", "restarts": 0, "replicas": 1,
             "cpu": f"{psutil.cpu_percent()}%", "memory": f"{psutil.virtual_memory().percent}%", "uptime": "continuous"},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 34. LLM / NAS PROVIDERS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/llm/providers")
async def llm_providers():
    """LLM провайдери."""
    return [
        {"id": "google", "name": "Google Vertex AI", "status": "connected", "model": "Gemini 2.0 Flash"},
        {"id": "anthropic", "name": "Anthropic Claude", "status": "connected", "model": "Claude Opus 4"},
        {"id": "ollama", "name": "Ollama (Local)", "status": "connected", "model": "Qwen3-Coder"},
    ]


@app.get("/api/v1/nas/providers")
async def nas_providers():
    """NAS провайдери."""
    return [
        {"id": "google", "name": "Gemini 2.0 Flash"},
        {"id": "openai", "name": "GPT-4o"},
        {"id": "deepseek", "name": "DeepSeek V3"},
    ]


# ═══════════════════════════════════════════════════════════════
# 35. NEURAL TRAINING
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/neural/training/status")
async def neural_training_status():
    """Статус тренування нейронної мережі."""
    return {
        "status": "idle",
        "last_training": datetime.now(UTC).isoformat(),
        "model_version": "v67.0",
        "accuracy": 94.2,
        "loss": 0.042,
        "epochs_completed": 50,
        "total_epochs": 50,
    }


@app.post("/api/v1/neural/training/start")
async def neural_training_start():
    """Запуск тренування."""
    return {"status": "started", "job_id": f"train-{uuid4().hex[:8]}"}


@app.post("/api/v1/neural/training/stop")
async def neural_training_stop():
    """Зупинка тренування."""
    return {"status": "stopped"}


# ═══════════════════════════════════════════════════════════════
# 36. ANTIGRAVITY / CHAOS / TRINITY
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/antigravity/status")
async def antigravity_status():
    """Статус Antigravity агентів."""
    return {
        "is_running": True,
        "completed_tasks": 124,
        "total_spent_usd": 12.45,
        "llm_gateway_status": "online",
        "sandbox_status": "ready",
        "agents": [
            {"id": "a1", "name": "Qwen-Coder", "role": "Surgical Coder", "is_busy": True, "last_task": "Refactor Auth"},
            {"id": "a2", "name": "Nemotron", "role": "Logic Specialist", "is_busy": False, "last_task": "Audit DB"},
        ],
    }


@app.get("/api/v1/antigravity/tasks")
async def antigravity_tasks():
    """Завдання Antigravity."""
    return [
        {"task_id": "t1", "description": "Оптимізація Risk Engine", "priority": "high", "status": "completed", "created_at": "2026-05-25T12:00:00Z"},
        {"task_id": "t2", "description": "Оновлення Neo4j індексів", "priority": "medium", "status": "running", "created_at": "2026-05-26T00:00:00Z"},
    ]


@app.get("/api/v45/trinity/audit")
async def trinity_audit():
    """Trinity аудит."""
    return [
        {"id": "t1", "created_at": datetime.now(UTC).isoformat(), "status": "verified", "intent": "CODE_OPTIMIZATION",
         "request_text": "Рефакторинг search_tenders", "mistral_output": "Оптимізаційний патч #42..."},
        {"id": "t2", "created_at": datetime.now(UTC).isoformat(), "status": "info", "intent": "THREAT_SCAN",
         "request_text": "Періодичний аудит безпеки", "gemini_plan": "Сканування SQL ін'єкцій..."},
    ]


@app.get("/api/v45/training/arbitration-scores")
async def arbitration_scores():
    """Арбітражні оцінки моделей."""
    return [
        {"modelId": "gemini", "modelName": "Gemini 2.0", "criteria": {"safety": 0.95, "performance": 0.85, "cost": 0.9, "logic": 0.92}, "totalScore": 0.91},
        {"modelId": "claude", "modelName": "Claude Opus 4", "criteria": {"safety": 0.98, "performance": 0.92, "cost": 0.75, "logic": 0.96}, "totalScore": 0.90},
    ]


# ═══════════════════════════════════════════════════════════════
# 37. DOCUMENTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/documents")
async def list_documents(limit: int = 20):
    """Список документів."""
    return {
        "documents": [
            {"id": f"doc-{i}", "title": f"Митна декларація #{10000 + i}", "type": "customs_declaration",
             "company_ueid": f"COMP-{(i % NUM_COMPANIES) + 1:04d}", "date": (datetime.now(UTC) - timedelta(days=i)).isoformat()}
            for i in range(1, min(limit + 1, 21))
        ],
        "total": 20,
    }


# ═══════════════════════════════════════════════════════════════
# 38. AUTONOMY STATUS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/autonomy/status")
async def autonomy_status():
    """Статус автономної системи."""
    return {"status": "ACTIVE", "mode": "OODA", "cycles": ooda.cycles_completed}


@app.get("/api/v1/autonomy/metrics")
async def autonomy_metrics():
    """Метрики автономії."""
    return {"accuracy": 94.2, "uptime_pct": 99.8, "decisions_today": ooda.cycles_completed * 4}


@app.get("/api/v1/autonomy/hypotheses")
async def autonomy_hypotheses():
    """Гіпотези автономної системи."""
    return {"hypotheses": [{"id": "h1", "text": "Аномалія в транзакціях COMP-0005", "confidence": 0.85}]}


# ═══════════════════════════════════════════════════════════════
# 39. SSE (Server-Sent Events) — замість WebSocket для zrok
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/events/stream")
async def events_stream():
    """SSE потік подій (замість WebSocket для zrok сумісності)."""
    async def event_generator():
        while True:
            data = json.dumps({
                "type": "dashboard_update",
                "timestamp": datetime.now(UTC).isoformat(),
                "ooda_phase": ooda.current_phase,
                "ooda_cycles": ooda.cycles_completed,
                "cpu_percent": psutil.cpu_percent(interval=0.1),
                "ram_percent": psutil.virtual_memory().percent,
            })
            yield f"data: {data}\n\n"
            await asyncio.sleep(5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ═══════════════════════════════════════════════════════════════
# 40. ADMIN ENDPOINTS (v2 API)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v2/admin/telemetry")
async def admin_telemetry():
    """Телеметрія адміністратора."""
    mem = psutil.virtual_memory()
    return {
        "nodes": [{"id": "kaggle", "status": "ONLINE", "cpu": psutil.cpu_percent(), "ram": mem.percent}],
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get("/api/v2/admin/agents")
async def admin_agents():
    """Агенти (admin view)."""
    return await list_agents()


@app.get("/api/v2/admin/chaos")
async def admin_chaos():
    """Chaos Engineering статус."""
    return {"experiments": [], "last_run": None, "status": "idle"}


@app.get("/api/v2/system/status")
async def v2_system_status():
    """Статус системи (v2)."""
    return await system_stats()


# ═══════════════════════════════════════════════════════════════
# 41. INGEST SOURCES (Telegram, Website, API, RSS)
# ═══════════════════════════════════════════════════════════════

@app.post("/api/v1/ingest/telegram")
async def ingest_telegram(request: Request):
    """Інгестія з Telegram."""
    return {"status": "accepted", "source": "telegram", "job_id": f"tg-{uuid4().hex[:8]}"}


@app.post("/api/v1/ingest/website")
async def ingest_website(request: Request):
    """Інгестія з вебсайту."""
    return {"status": "accepted", "source": "website", "job_id": f"web-{uuid4().hex[:8]}"}


@app.post("/api/v1/ingest/api")
async def ingest_api(request: Request):
    """Інгестія з API."""
    return {"status": "accepted", "source": "api", "job_id": f"api-{uuid4().hex[:8]}"}


@app.post("/api/v1/ingest/rss")
async def ingest_rss(request: Request):
    """Інгестія з RSS."""
    return {"status": "accepted", "source": "rss", "job_id": f"rss-{uuid4().hex[:8]}"}


# ═══════════════════════════════════════════════════════════════
# 42. COPILOT STREAMING
# ═══════════════════════════════════════════════════════════════

@app.post("/api/v1/copilot/chat/stream")
async def copilot_chat_stream(request: Request):
    """Copilot Chat з SSE streaming."""
    body = await request.json()
    message = body.get("message", body.get("query", "Аналіз"))

    async def stream_response():
        words = f"Аналізую запит: {message[:60]}. Згідно з даними Risk Engine v56.5, рекомендую звернути увагу на наступні аспекти:".split()
        for word in words:
            data = json.dumps({"type": "token", "content": word + " "})
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.05)
        done = json.dumps({"type": "done", "content": ""})
        yield f"data: {done}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


# ═══════════════════════════════════════════════════════════════
# 43. CUSTOMS DATASETS (80+ аналітичних датасетів)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/customs/declarations")
async def customs_declarations(limit: int = 25, offset: int = 0):
    """Митні декларації."""
    return await list_transactions(limit=limit, offset=offset)


@app.get("/api/v1/customs/statistics")
async def customs_statistics():
    """Статистика митних операцій."""
    async with main_session() as session:
        total_txn = (await session.execute(select(func.count()).select_from(Transaction))).scalar()
        total_value = (await session.execute(select(func.sum(Transaction.value_usd)))).scalar() or 0
        risky = (await session.execute(select(func.count()).select_from(Transaction).where(Transaction.risk_flag == True))).scalar()  # noqa: E712
        return {
            "total_declarations": total_txn,
            "total_value_usd": round(total_value, 2),
            "risky_declarations": risky,
            "risk_rate_pct": round((risky / total_txn * 100) if total_txn else 0, 2),
            "top_goods": [g for g in _GOODS[:10]],
            "top_countries": [c for c in _COUNTRIES[:10]],
        }


@app.get("/api/v1/customs/hs-codes")
async def customs_hs_codes():
    """Довідник HS кодів."""
    return {
        "hs_codes": [
            {"code": code, "description": _GOODS[i % len(_GOODS)],
             "category": "Category " + str((i % 5) + 1)}
            for i, code in enumerate(_HS_CODES)
        ]
    }


@app.get("/api/v1/customs/risk-profile/{ueid}")
async def customs_risk_profile(ueid: str):
    """Ризик-профіль компанії у митних операціях."""
    async with main_session() as session:
        txns = (await session.execute(
            select(func.count()).select_from(Transaction).where(Transaction.company_ueid == ueid)
        )).scalar()
        risky = (await session.execute(
            select(func.count()).select_from(Transaction).where(
                Transaction.company_ueid == ueid, Transaction.risk_flag == True  # noqa: E712
            )
        )).scalar()
        total_val = (await session.execute(
            select(func.sum(Transaction.value_usd)).where(Transaction.company_ueid == ueid)
        )).scalar() or 0
        return {
            "ueid": ueid,
            "total_transactions": txns,
            "risky_transactions": risky,
            "risk_rate_pct": round((risky / txns * 100) if txns else 0, 2),
            "total_value_usd": round(total_val, 2),
            "profile_level": "HIGH" if (risky / txns * 100 if txns else 0) > 30 else "MEDIUM" if txns > 5 else "LOW",
        }


# ═══════════════════════════════════════════════════════════════
# 44. ZROK TUNNEL (HR-23 compliant)
# ═══════════════════════════════════════════════════════════════

PUBLIC_URL: str | None = None


def _download_zrok() -> str | None:
    """Завантаження zrok бінарника."""
    zrok_bin = os.path.join(DB_DIR, "zrok")
    if os.path.exists(zrok_bin):
        print(f"✅ zrok вже є: {zrok_bin}")
        return zrok_bin

    print("📦 Завантаження zrok...")
    try:
        req = urllib.request.Request(
            "https://api.github.com/repos/openziti/zrok/releases/latest",
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            tag = json.loads(r.read())["tag_name"]
    except Exception:
        tag = "v1.0.0"

    ver = tag.lstrip("v")
    url = f"https://github.com/openziti/zrok/releases/download/{tag}/zrok_{ver}_linux_amd64.tar.gz"
    tar_path = os.path.join(DB_DIR, "zrok.tar.gz")

    print(f"🔽 Завантаження zrok {tag}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            with open(tar_path, "wb") as f:
                f.write(resp.read())

        if os.path.exists(tar_path):
            with tarfile.open(tar_path, "r:gz") as tar:
                for member in tar.getmembers():
                    if member.isfile() and "zrok" in member.name and not member.name.endswith(".txt"):
                        extracted = tar.extractfile(member)
                        if extracted:
                            data = extracted.read()
                            if len(data) > 1_000_000:
                                with open(zrok_bin, "wb") as f:
                                    f.write(data)
                                os.chmod(zrok_bin, 0o755)
                                print(f"✅ zrok {tag} готовий ({len(data)} bytes)")
                                return zrok_bin
    except Exception as e:
        print(f"❌ Не вдалося завантажити zrok: {e}")

    return None


def _run_zrok_tunnel(zrok_bin: str, port: int = 8000) -> None:
    """Запуск zrok тунелю."""
    global PUBLIC_URL

    if not ZROK_TOKEN:
        print("⚠️ ZROK_TOKEN не задано — тунель не запущено. "
              "Встановіть через: export KAGGLE_SECRET_ZROK_TOKEN='your_token'")
        return

    # Деактивація попереднього
    subprocess.run([zrok_bin, "disable"], capture_output=True)

    # Активація
    result = subprocess.run([zrok_bin, "enable", ZROK_TOKEN], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"⚠️ zrok enable: {result.stdout} {result.stderr}")

    # Запуск тунелю
    print("🚀 Запуск zrok тунелю...")
    proc = subprocess.Popen(
        [zrok_bin, "share", "public", f"http://localhost:{port}", "--headless"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )

    for line in proc.stdout:  # type: ignore[union-attr]
        print(f"[zrok] {line.rstrip()}")
        # Пошук URL
        m = re.search(r"https://[\w\-]+\.share\.zrok\.io", line)
        if not m:
            m = re.search(r"https://[\w\-]+\.zrok\.io[\S]*", line)
        if not m and "access your share at" in line.lower():
            parts = line.split("access your share at")
            if len(parts) > 1:
                PUBLIC_URL = parts[-1].strip()
        if m:
            PUBLIC_URL = m.group(0)
        if PUBLIC_URL:
            print("\n" + "=" * 60)
            print(f"🔥 PREDATOR KAGGLE {VERSION} IS LIVE!")
            print(f"🔗 PUBLIC URL: {PUBLIC_URL}")
            print(f"📋 Встановіть у .env.local: VITE_API_URL={PUBLIC_URL}/api/v1")
            print("=" * 60 + "\n")
            break


# ═══════════════════════════════════════════════════════════════
# 45. ENTRYPOINT
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print(f"🦅 PREDATOR Analytics {VERSION} — Kaggle Production Node")
    print("=" * 60)

    # Тунель
    zrok_bin = _download_zrok()
    if zrok_bin:
        threading.Thread(target=_run_zrok_tunnel, args=(zrok_bin, 8000), daemon=True).start()
    else:
        print("⚠️ zrok недоступний — працюємо без тунелю")

    # Запуск сервера
    print("\n🚀 Запуск FastAPI сервера на порту 8000...\n")
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="warning", loop="asyncio")
    server = uvicorn.Server(config)

    loop = asyncio.get_event_loop()
    loop.run_until_complete(server.serve())
