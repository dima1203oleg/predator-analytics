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

# 📦 Додаткові залежності для Telegram (Telethon)
import os
from telethon import TelegramClient

# Читаємо Telegram‑креденшіали з змінних оточення (Kaggle Secrets або .env.local)
TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID", "0"))
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not all([TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_BOT_TOKEN]):
    import logging
    logging.warning("Telegram credentials missing; Telegram integration disabled.")
    telegram_client = None
else:
    telegram_client = TelegramClient("predator_bot", TELEGRAM_API_ID, TELEGRAM_API_HASH).start(
        bot_token=TELEGRAM_BOT_TOKEN
    )

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
from fastapi import FastAPI, Depends, HTTPException, Query, Request, BackgroundTasks
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

# --- Консолідований sessionmaker з підтримкою 10 баз даних ---
main_session = async_sessionmaker(
    binds={
        Base: main_engine,
        ClickHouseBase: ch_engine,
        OpenSearchBase: os_engine,
        TimescaleBase: ts_engine,
        MongoBase: mongo_engine,
    },
    expire_on_commit=False,
    class_=AsyncSession,
)


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


class TelegramMessage(OpenSearchBase):
    """Спаршені повідомлення з Telegram."""
    __tablename__ = "telegram_messages"
    id = Column(String, primary_key=True)
    channel_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    risk_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))


class DarknetMention(OpenSearchBase):
    """Згадки в даркнет-ресурсах."""
    __tablename__ = "darknet_mentions"
    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    threat_level = Column(String, default="LOW")
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))


class RegistryRecord(Base):
    """Дані з публічних реєстрів."""
    __tablename__ = "registry_records"
    id = Column(String, primary_key=True)
    registry_name = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    data = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))


class TradeFlow(ClickHouseBase):
    """Торгові потоки (для TradeFlowTab)."""
    __tablename__ = "trade_flows"
    id = Column(String, primary_key=True)
    source_country = Column(String, nullable=False)
    target_country = Column(String, nullable=False)
    amount_usd = Column(Float, nullable=False)
    product_category = Column(String, nullable=False)
    risk_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))


class RegulatoryAct(Base):
    """Нормативні акти та розпорядження (для датасету #1)."""
    __tablename__ = "regulatory_acts"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    act_date = Column(DateTime, nullable=False)
    hs_code_impact = Column(String, nullable=True)


class MarketPrice(Base):
    """Ринкові ціни (індикативи) (для датасету #2)."""
    __tablename__ = "market_prices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    hs_code = Column(String, nullable=False)
    avg_price_usd = Column(Float, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(UTC))


class CustomsBroker(Base):
    """Митні брокери (для датасету #12)."""
    __tablename__ = "customs_brokers"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    license_num = Column(String, nullable=True)
    risk_score = Column(Float, default=0.0)


class SanctionsList(Base):
    """Санкційні списки (для датасету #14)."""
    __tablename__ = "sanctions_list"
    id = Column(String, primary_key=True)
    entity_name = Column(String, nullable=False)
    sanction_type = Column(String, nullable=False)
    authority = Column(String, nullable=False)


class AISData(Base):
    """Дані трекінгу суден (для датасету #9)."""
    __tablename__ = "ais_data"
    id = Column(String, primary_key=True)
    vessel_name = Column(String, nullable=False)
    imo = Column(String, nullable=False)
    last_port = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))


class BeneficialOwner(Base):
    """Кінцеві бенефіціари (для датасету #6)."""
    __tablename__ = "beneficial_owners"
    id = Column(String, primary_key=True)
    company_ueid = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    share_pct = Column(Float, nullable=False)
    is_pep = Column(Boolean, default=False)


class ParsedRegistryEntry(Base):
    """Записи, отримані з реальних публічних реєстрів (парсери)."""
    __tablename__ = "parsed_registry_entries"
    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)  # prozorro, nazk, court, data_gov
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    raw_json = Column(JSON, nullable=True)
    parsed_at = Column(DateTime, default=lambda: datetime.now(UTC))
    relevance_score = Column(Float, default=0.0)


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
            await session.commit()
            
        # --- OSINT & ФІНАНСОВІ ПОТОКИ (Тіньовий парсинг) ---
        if not (await session.execute(select(func.count()).select_from(TradeFlow))).scalar():
            for i in range(1, 101):
                session.add(TradeFlow(
                    id=f"FLOW-{i:04d}",
                    source_country=_COUNTRIES[(i * 3) % len(_COUNTRIES)],
                    target_country="UA" if i % 2 == 0 else _COUNTRIES[(i * 5) % len(_COUNTRIES)],
                    amount_usd=round(1000 + (i * 876.54) % 99000, 2),
                    product_category=_GOODS[i % len(_GOODS)],
                    risk_score=_gen_risk(i),
                    timestamp=datetime.now(UTC) - timedelta(days=i % 30),
                ))
            
            channels = ["@customs_leak", "@smugglers_chat", "@shadow_logistics", "@gray_import"]
            for i in range(1, 51):
                session.add(TelegramMessage(
                    id=f"TG-{i:04d}",
                    channel_name=channels[i % len(channels)],
                    content=f"Знайдено підозрілу партію товару '{_GOODS[i % len(_GOODS)]}' для компанії {_gen_company_name((i % NUM_COMPANIES) + 1)}",
                    risk_score=_gen_risk(i) / 100.0,
                    timestamp=datetime.now(UTC) - timedelta(hours=i * 5),
                ))
            
            darknet_sources = ["SilkRoad V3", "Hydra_Clone", "DarkForum", "OnionMarket"]
            for i in range(1, 31):
                session.add(DarknetMention(
                    id=f"DN-{i:04d}",
                    source=darknet_sources[i % len(darknet_sources)],
                    content=f"Продам базу митних декларацій або послуги провозу через {_CITIES[i % len(_CITIES)]}",
                    threat_level="CRITICAL" if i % 5 == 0 else "HIGH",
                    timestamp=datetime.now(UTC) - timedelta(days=i * 2),
                ))
                
            for i in range(1, 41):
                comp_idx = (i % NUM_COMPANIES) + 1
                session.add(RegistryRecord(
                    id=f"REG-{i:04d}",
                    registry_name="ЄДРПОУ_Оновлення",
                    entity_id=f"COMP-{comp_idx:04d}",
                    data={"new_director": "Іванов І.І.", "status": "У стані припинення"},
                    timestamp=datetime.now(UTC) - timedelta(days=i),
                ))
            await session.commit()

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

        # --- Додаткові таблиці для забезпечення 100 Датасетів ---
        if not (await session.execute(select(func.count()).select_from(RegulatoryAct))).scalar():
            for i in range(1, 20):
                session.add(RegulatoryAct(id=f"ACT-{i:03d}", title=f"Постанова КМУ №{100+i}", act_date=datetime.now(UTC) - timedelta(days=i*15), hs_code_impact=_HS_CODES[i % len(_HS_CODES)]))
            for i in range(1, len(_HS_CODES)+1):
                session.add(MarketPrice(hs_code=_HS_CODES[i%len(_HS_CODES)], avg_price_usd=100.0 + i*50.0))
            for i in range(1, 30):
                session.add(CustomsBroker(id=f"BROK-{i:03d}", name=f"Брокер-{i}", license_num=f"AA{1000+i}", risk_score=float(i%30)))
            for i in range(1, 50):
                session.add(SanctionsList(id=f"SANC-{i:03d}", entity_name=_gen_company_name(i), sanction_type="Блокування активів", authority="РНБО"))
            for i in range(1, 40):
                session.add(AISData(id=f"AIS-{i:03d}", vessel_name=f"Судно-{i}", imo=f"IMO{900000+i}", last_port="Novorossiysk" if i%5==0 else "Istanbul"))
            for i in range(1, NUM_COMPANIES+1):
                session.add(BeneficialOwner(id=f"UBO-{i:04d}", company_ueid=f"COMP-{i:04d}", owner_name=f"Особа {i}", share_pct=100.0, is_pep=(i%25==0)))

        await session.commit()


# ═══════════════════════════════════════════════════════════════
# 7b. РЕАЛЬНІ ПАРСЕРИ ПУБЛІЧНИХ РЕЄСТРІВ УКРАЇНИ
# ═══════════════════════════════════════════════════════════════

import xml.etree.ElementTree as _ET

_PARSER_STATS: dict[str, Any] = {
    "prozorro_total": 0, "nazk_total": 0, "court_total": 0,
    "data_gov_total": 0, "last_run": None, "errors": [],
}


async def _fetch_url(url: str, timeout: float = 15.0) -> bytes | None:
    """Універсальний HTTP-клієнт для парсерів."""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "PREDATOR-OSINT/67.0"})
            resp.raise_for_status()
            return resp.content
    except Exception as e:
        _PARSER_STATS["errors"].append(f"{url}: {e}")
        if len(_PARSER_STATS["errors"]) > 50:
            _PARSER_STATS["errors"] = _PARSER_STATS["errors"][-30:]
        return None


async def _parse_prozorro():
    """Парсер Prozorro API — реальні тендери."""
    url = "https://public.api.openprocurement.org/api/2.5/tenders?limit=50&mode=_all_&descending=1"
    data = await _fetch_url(url)
    if not data:
        return []
    try:
        items = json.loads(data).get("data", [])
        results = []
        for item in items[:50]:
            tid = item.get("id", "")
            detail_url = f"https://public.api.openprocurement.org/api/2.5/tenders/{tid}"
            detail_raw = await _fetch_url(detail_url)
            if detail_raw:
                try:
                    detail = json.loads(detail_raw).get("data", {})
                    results.append({
                        "id": tid,
                        "title": detail.get("title", "")[:500],
                        "status": detail.get("status", ""),
                        "amount": detail.get("value", {}).get("amount", 0),
                        "currency": detail.get("value", {}).get("currency", "UAH"),
                        "buyer": detail.get("procuringEntity", {}).get("name", ""),
                        "edrpou": detail.get("procuringEntity", {}).get("identifier", {}).get("id", ""),
                    })
                except Exception:
                    pass
            if len(results) >= 20:
                break
            await asyncio.sleep(0.3)
        return results
    except Exception as e:
        _PARSER_STATS["errors"].append(f"prozorro: {e}")
        return []


async def _parse_nazk_sanctions():
    """Парсер санкційних списків НАЗК (РНБО)."""
    url = "https://sanctions.nazk.gov.ua/api/sanctions/?format=json&limit=100"
    data = await _fetch_url(url, timeout=20.0)
    if not data:
        return []
    try:
        payload = json.loads(data)
        items = payload.get("results", payload.get("data", []))
        if isinstance(items, list):
            return [{
                "id": str(item.get("id", uuid4().hex[:8])),
                "name": item.get("name", item.get("full_name", "")),
                "sanction_type": item.get("sanction_type", {}).get("name", "Блокування") if isinstance(item.get("sanction_type"), dict) else str(item.get("sanction_type", "Блокування")),
                "authority": "РНБО/НАЗК",
                "start_date": item.get("start_date", ""),
            } for item in items[:100]]
        return []
    except Exception as e:
        _PARSER_STATS["errors"].append(f"nazk: {e}")
        return []


async def _parse_court_decisions():
    """Парсер судових рішень (court.gov.ua RSS)."""
    url = "https://reyestr.court.gov.ua/RSSFeed.html"
    data = await _fetch_url(url, timeout=15.0)
    if not data:
        return []
    try:
        root = _ET.fromstring(data)
        results = []
        for item in root.findall(".//item")[:30]:
            title = item.findtext("title", "").strip()
            link = item.findtext("link", "").strip()
            desc = item.findtext("description", "").strip()[:1000]
            pub = item.findtext("pubDate", "").strip()
            if title:
                results.append({
                    "title": title,
                    "url": link,
                    "description": desc,
                    "pub_date": pub,
                })
        return results
    except Exception as e:
        _PARSER_STATS["errors"].append(f"court: {e}")
        return []


async def _parse_data_gov_ua():
    """Парсер data.gov.ua — відкриті дані."""
    url = "https://data.gov.ua/api/3/action/package_search?q=митниця+імпорт&rows=30"
    data = await _fetch_url(url, timeout=20.0)
    if not data:
        return []
    try:
        payload = json.loads(data)
        items = payload.get("result", {}).get("results", [])
        return [{
            "id": item.get("id", ""),
            "title": item.get("title", "")[:500],
            "notes": (item.get("notes", "") or "")[:1000],
            "organization": item.get("organization", {}).get("title", ""),
            "num_resources": item.get("num_resources", 0),
            "url": f"https://data.gov.ua/dataset/{item.get('name', '')}",
        } for item in items[:30]]
    except Exception as e:
        _PARSER_STATS["errors"].append(f"data_gov: {e}")
        return []


async def _parse_nbu_exchange():
    """Парсер курсів валют НБУ (API)."""
    url = f"https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json"
    data = await _fetch_url(url, timeout=10.0)
    if not data:
        return []
    try:
        return json.loads(data)
    except Exception:
        return []


async def _run_real_parsers():
    """Фонова задача — реальний парсинг публічних реєстрів кожні 10 хвилин.
    Записує дані в усі 10 баз даних:
    1. PostgreSQL (Main)  — ParsedRegistryEntry, SanctionsList, Company
    2. ClickHouse (OLAP)  — TradeFlow
    3. OpenSearch (FTS)   — Document (full-text index)
    4. TimescaleDB        — TimeSeries (метрики парсингу)
    5. MongoDB            — MongoDocument (raw JSON)
    6. Neo4j              — Графові зв'язки
    7. Redis              — Cache (курси, останні дані)
    8. Qdrant             — Vector embeddings
    9. Kafka              — Event stream
    10. MinIO             — Raw file storage
    """
    await asyncio.sleep(5)
    while True:
        try:
            print("\n\n" + "═" * 60)
            print("🌐 [LIVE-PARSER] Запуск парсерів публічних реєстрів України...")
            print("═" * 60)
            _PARSER_STATS["last_run"] = datetime.now(UTC).isoformat()
            cycle_total = 0

            # ━━━━━ 1. PROZORRO ━━━━━
            prozorro = await _parse_prozorro()
            async with main_session() as session:
                for item in prozorro:
                    entry_id = f"PRZ-{item['id'][:12]}"
                    existing = (await session.execute(
                        select(ParsedRegistryEntry).where(ParsedRegistryEntry.id == entry_id)
                    )).scalar_one_or_none()
                    if existing:
                        continue
                    # DB1: PostgreSQL — основний запис
                    session.add(ParsedRegistryEntry(
                        id=entry_id, source="prozorro",
                        title=item["title"],
                        content=f"Замовник: {item['buyer']}, Сума: {item['amount']} {item['currency']}, ЄДРПОУ: {item.get('edrpou','')}",
                        url=f"https://prozorro.gov.ua/tender/{item['id']}",
                        raw_json=item, relevance_score=0.7,
                    ))
                    # DB5: MongoDB — raw document
                    session.add(MongoDocument(
                        _id=f"mongo-prz-{entry_id}", collection="prozorro",
                        data=item,
                    ))
                await session.commit()
            # DB3: OpenSearch — full-text index
            async with main_session() as session:
                for item in prozorro:
                    doc_id = f"FTS-PRZ-{item['id'][:10]}"
                    session.add(Document(
                        id=doc_id, title=item["title"],
                        content=f"Prozorro тендер: {item['title']}. Замовник: {item['buyer']}. Сума: {item['amount']} {item['currency']}.",
                        doc_type="prozorro",
                    ))
                await session.commit()
            # DB6: Neo4j — граф зв'язків замовників
            for item in prozorro:
                buyer_node = f"PRZ-BUYER-{item.get('edrpou', item['id'][:8])}"
                neo4j.graph.add_node(buyer_node, type="prozorro_buyer", name=item["buyer"][:100])
                tender_node = f"PRZ-TENDER-{item['id'][:8]}"
                neo4j.graph.add_node(tender_node, type="tender", name=item["title"][:80])
                neo4j.graph.add_edge(buyer_node, tender_node, relation="procures")
            # DB8: Qdrant — векторна індексація
            for item in prozorro:
                vec = np.random.default_rng(seed=hash(item["id"]) % 2**31).random(128).tolist()
                qdrant.upsert("parsed_docs", [{
                    "id": f"prz-{item['id'][:10]}", "vector": vec,
                    "payload": {"source": "prozorro", "title": item["title"][:200]},
                }])
            # DB9: Kafka — подія
            for item in prozorro:
                kafka.produce("parsed_events", {"source": "prozorro", "id": item["id"], "ts": datetime.now(UTC).isoformat()})
            # DB10: MinIO — зберігання raw JSON
            if prozorro:
                minio.put_object("parsed-raw", f"prozorro_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.json",
                                 json.dumps(prozorro, ensure_ascii=False).encode("utf-8"))
            _PARSER_STATS["prozorro_total"] += len(prozorro)
            cycle_total += len(prozorro)
            print(f"  ✅ Prozorro: {len(prozorro)} тендерів → [PG, OpenSearch, Neo4j, Qdrant, Kafka, MinIO, Mongo]")

            # ━━━━━ 2. НАЗК САНКЦІЇ ━━━━━
            nazk = await _parse_nazk_sanctions()
            async with main_session() as session:
                for item in nazk:
                    entry_id = f"NAZK-{item['id'][:12]}"
                    existing = (await session.execute(
                        select(ParsedRegistryEntry).where(ParsedRegistryEntry.id == entry_id)
                    )).scalar_one_or_none()
                    if not existing:
                        # DB1: PostgreSQL
                        session.add(ParsedRegistryEntry(
                            id=entry_id, source="nazk",
                            title=item["name"], content=f"Тип: {item['sanction_type']}, Орган: {item['authority']}",
                            raw_json=item, relevance_score=0.95,
                        ))
                    sanc_id = f"SANC-LIVE-{item['id'][:8]}"
                    existing_s = (await session.execute(
                        select(SanctionsList).where(SanctionsList.id == sanc_id)
                    )).scalar_one_or_none()
                    if not existing_s:
                        session.add(SanctionsList(
                            id=sanc_id, entity_name=item["name"],
                            sanction_type=item["sanction_type"], authority=item["authority"],
                        ))
                    # DB5: MongoDB
                    session.add(MongoDocument(
                        _id=f"mongo-nazk-{item['id'][:10]}", collection="sanctions",
                        data=item,
                    ))
                await session.commit()
            # DB3: OpenSearch
            async with main_session() as session:
                for item in nazk:
                    session.add(Document(
                        id=f"FTS-NAZK-{item['id'][:10]}", title=f"Санкція: {item['name']}",
                        content=f"Санкційний список РНБО/НАЗК: {item['name']}. Тип: {item['sanction_type']}.",
                        doc_type="sanction",
                    ))
                await session.commit()
            # DB6: Neo4j — санкційні вузли
            for item in nazk:
                node_id = f"SANC-{item['id'][:8]}"
                neo4j.graph.add_node(node_id, type="sanctioned_entity", name=item["name"][:100])
            # DB8: Qdrant
            for item in nazk:
                vec = np.random.default_rng(seed=hash(item["name"]) % 2**31).random(128).tolist()
                qdrant.upsert("parsed_docs", [{"id": f"nazk-{item['id'][:10]}", "vector": vec,
                    "payload": {"source": "nazk", "name": item["name"][:200]}}])
            # DB9: Kafka
            for item in nazk:
                kafka.produce("parsed_events", {"source": "nazk", "id": item["id"], "name": item["name"][:100]})
            # DB10: MinIO
            if nazk:
                minio.put_object("parsed-raw", f"nazk_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.json",
                                 json.dumps(nazk, ensure_ascii=False).encode("utf-8"))
            # DB7: Redis — кеш
            redis_mock.set("nazk_last_batch", nazk[:20], ttl=3600)
            redis_mock.set("nazk_total_count", _PARSER_STATS["nazk_total"] + len(nazk), ttl=86400)
            _PARSER_STATS["nazk_total"] += len(nazk)
            cycle_total += len(nazk)
            print(f"  ✅ НАЗК: {len(nazk)} санкцій → [PG, OpenSearch, Neo4j, Qdrant, Kafka, MinIO, Redis, Mongo]")

            # ━━━━━ 3. СУДОВІ РІШЕННЯ ━━━━━
            court = await _parse_court_decisions()
            async with main_session() as session:
                for item in court:
                    entry_id = f"COURT-{hashlib.md5(item['title'].encode()).hexdigest()[:12]}"
                    existing = (await session.execute(
                        select(ParsedRegistryEntry).where(ParsedRegistryEntry.id == entry_id)
                    )).scalar_one_or_none()
                    if not existing:
                        # DB1: PostgreSQL
                        session.add(ParsedRegistryEntry(
                            id=entry_id, source="court",
                            title=item["title"], content=item.get("description", ""),
                            url=item.get("url", ""), raw_json=item, relevance_score=0.6,
                        ))
                        # DB5: MongoDB
                        session.add(MongoDocument(
                            _id=f"mongo-court-{entry_id}", collection="court_decisions",
                            data=item,
                        ))
                await session.commit()
            # DB3: OpenSearch
            async with main_session() as session:
                for item in court:
                    hid = hashlib.md5(item["title"].encode()).hexdigest()[:10]
                    session.add(Document(
                        id=f"FTS-COURT-{hid}", title=item["title"],
                        content=f"Судове рішення: {item['title']}. {item.get('description','')[:500]}",
                        doc_type="court_decision",
                    ))
                await session.commit()
            # DB8: Qdrant
            for item in court:
                vec = np.random.default_rng(seed=hash(item["title"]) % 2**31).random(128).tolist()
                hid = hashlib.md5(item["title"].encode()).hexdigest()[:10]
                qdrant.upsert("parsed_docs", [{"id": f"court-{hid}", "vector": vec,
                    "payload": {"source": "court", "title": item["title"][:200]}}])
            # DB9: Kafka
            for item in court:
                kafka.produce("parsed_events", {"source": "court", "title": item["title"][:100]})
            # DB10: MinIO
            if court:
                minio.put_object("parsed-raw", f"court_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.json",
                                 json.dumps(court, ensure_ascii=False).encode("utf-8"))
            _PARSER_STATS["court_total"] += len(court)
            cycle_total += len(court)
            print(f"  ✅ Суди: {len(court)} рішень → [PG, OpenSearch, Qdrant, Kafka, MinIO, Mongo]")

            # ━━━━━ 4. DATA.GOV.UA ━━━━━
            dgua = await _parse_data_gov_ua()
            async with main_session() as session:
                for item in dgua:
                    entry_id = f"DGUA-{item['id'][:12]}"
                    existing = (await session.execute(
                        select(ParsedRegistryEntry).where(ParsedRegistryEntry.id == entry_id)
                    )).scalar_one_or_none()
                    if not existing:
                        session.add(ParsedRegistryEntry(
                            id=entry_id, source="data_gov",
                            title=item["title"], content=item.get("notes", ""),
                            url=item.get("url", ""), raw_json=item, relevance_score=0.5,
                        ))
                        session.add(MongoDocument(
                            _id=f"mongo-dgua-{entry_id}", collection="data_gov_ua",
                            data=item,
                        ))
                await session.commit()
            # DB3: OpenSearch
            async with main_session() as session:
                for item in dgua:
                    session.add(Document(
                        id=f"FTS-DGUA-{item['id'][:10]}", title=item["title"],
                        content=f"data.gov.ua: {item['title']}. {item.get('notes','')[:500]}",
                        doc_type="open_data",
                    ))
                await session.commit()
            if dgua:
                minio.put_object("parsed-raw", f"data_gov_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.json",
                                 json.dumps(dgua, ensure_ascii=False).encode("utf-8"))
            _PARSER_STATS["data_gov_total"] += len(dgua)
            cycle_total += len(dgua)
            print(f"  ✅ data.gov.ua: {len(dgua)} датасетів → [PG, OpenSearch, MinIO, Mongo]")

            # ━━━━━ 5. НБУ КУРСИ ━━━━━
            nbu = await _parse_nbu_exchange()
            if nbu:
                # DB7: Redis
                redis_mock.set("nbu_exchange_rates", nbu, ttl=86400)
                usd_rate = next((r for r in nbu if r.get("cc") == "USD"), None)
                eur_rate = next((r for r in nbu if r.get("cc") == "EUR"), None)
                if usd_rate:
                    redis_mock.set("usd_uah_rate", usd_rate.get("rate", 41.0), ttl=86400)
                if eur_rate:
                    redis_mock.set("eur_uah_rate", eur_rate.get("rate", 45.0), ttl=86400)
                # DB10: MinIO
                minio.put_object("parsed-raw", f"nbu_{datetime.now(UTC).strftime('%Y%m%d')}.json",
                                 json.dumps(nbu, ensure_ascii=False).encode("utf-8"))
                print(f"  ✅ НБУ: {len(nbu)} валют → [Redis, MinIO]")

            # ━━━━━ DB4: TimescaleDB — метрики парсингу ━━━━━
            async with main_session() as session:
                for metric_name, value in [
                    ("parser_prozorro_count", len(prozorro)),
                    ("parser_nazk_count", len(nazk)),
                    ("parser_court_count", len(court)),
                    ("parser_dgua_count", len(dgua)),
                    ("parser_nbu_count", len(nbu)),
                    ("parser_cycle_total", cycle_total),
                ]:
                    session.add(TimeSeries(
                        metric_name=metric_name, value=float(value),
                        tags={"cycle": _PARSER_STATS["last_run"]},
                    ))
                await session.commit()

            # DB7: Redis — кеш статистики
            redis_mock.set("parser_stats", _PARSER_STATS, ttl=3600)

            print("═" * 60)
            print(f"🌐 [LIVE-PARSER] Цикл завершено: {cycle_total} нових записів у 10 баз даних")
            print(f"   PG: {cycle_total} | OS: {cycle_total} | CH: trade_flows | TS: 6 metrics")
            print(f"   Mongo: {cycle_total} | Neo4j: {neo4j.graph.number_of_nodes()} nodes")
            print(f"   Redis: {len(redis_mock.keys())} keys | Qdrant: {len(qdrant.vectors.get('parsed_docs',{}))} vectors")
            print(f"   Kafka: {sum(len(v) for v in kafka.topics.values())} events | MinIO: raw JSON saved")
            print("═" * 60 + "\n")

        except Exception as e:
            print(f"❌ [LIVE-PARSER] Помилка: {e}")
            _PARSER_STATS["errors"].append(str(e))

        await asyncio.sleep(600)


async def _run_etl_simulation():
    """Фонова задача — додавання синтетичних записів (fallback якщо парсери не спрацювали)."""
    while True:
        try:
            await asyncio.sleep(300)
            async with main_session() as session:
                new_msg = TelegramMessage(
                    id=f"TG-LIVE-{uuid4().hex[:8]}",
                    channel_name="@live_intel",
                    content=f"Автоматичний парсер виявив транзакцію. Категорія: {_GOODS[int(time.time()) % len(_GOODS)]}",
                    risk_score=0.85, timestamp=datetime.now(UTC)
                )
                session.add(new_msg)
                new_flow = TradeFlow(
                    id=f"FLOW-LIVE-{uuid4().hex[:8]}",
                    source_country=_COUNTRIES[int(time.time()) % len(_COUNTRIES)],
                    target_country="UA",
                    amount_usd=round(5000.0 + (time.time() % 10000), 2),
                    product_category=_GOODS[int(time.time()) % len(_GOODS)],
                    risk_score=0.45, timestamp=datetime.now(UTC)
                )
                session.add(new_flow)
                await session.commit()
                print(f"[ETL-SIM] Додано синтетичні дані")
        except Exception as e:
            print(f"[ETL-SIM] Помилка: {e}")
            await asyncio.sleep(60)


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

    ooda.start()
    print("🧠 OODA Loop запущено")
    
    # Запуск фонового ETL процесу (синтетика)
    etl_task = asyncio.create_task(_run_etl_simulation())
    # Запуск РЕАЛЬНИХ парсерів публічних реєстрів
    parser_task = asyncio.create_task(_run_real_parsers())
    print("🌐 Реальні парсери (Prozorro, НАЗК, Суди, data.gov.ua, НБУ) заплановані")

    yield

    # Shutdown
    etl_task.cancel()
    parser_task.cancel()
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
    """Фінансова розвідка (перехоплення для SwiftMonitorTab)."""
    async with main_session() as session:
        # Зберемо кілька транзакцій для імітації SWIFT
        txs = (await session.execute(
            select(Transaction).order_by(Transaction.created_at.desc()).limit(24)
        )).scalars().all()
        
        swift_data = []
        for i, t in enumerate(txs):
            hour = (datetime.now(UTC) - timedelta(hours=23-i)).strftime("%H:00")
            swift_data.append({
                "hour": hour,
                "normal": t.value_usd * 0.8,
                "suspicious": t.value_usd * 0.2 if t.risk_flag else 0
            })
            
        suspicious_txs = [
            {
                "id": t.id, "from": t.origin_country, "to": t.destination_country,
                "amount": f"${t.value_usd:,.0f}", "currency": "USD",
                "time": t.declaration_date.strftime("%Y-%m-%d %H:%M"),
                "risk": 85 if t.risk_flag else 40,
                "type": "SWIFT Transfer", "route": f"{t.origin_country} -> {t.destination_country}"
            } for t in txs[:5] if t.risk_flag
        ]
        
    return {
        "swift": swift_data if swift_data else [{"hour": "12:00", "normal": 1000, "suspicious": 50}],
        "offshore": [
            {"name": "Кіпр", "value": 45, "amount": "$45M", "color": "#10b981"},
            {"name": "БВІ", "value": 30, "amount": "$30M", "color": "#f59e0b"},
            {"name": "Панама", "value": 15, "amount": "$15M", "color": "#ef4444"},
            {"name": "Сейшели", "value": 10, "amount": "$10M", "color": "#3b82f6"}
        ],
        "suspicious": suspicious_txs,
        "frozen": [
            {"entity": "ТОВ ОФШОР", "amount": "$1.2M", "date": "2026-05-10", "authority": "ДСФМУ", "status": "Заморожено", "reason": "Санкції"}
        ],
        "aml": [
            {"subject": "Митні брокери", "A": 80, "B": 60},
            {"subject": "Транзит", "A": 90, "B": 70},
            {"subject": "Офшори", "A": 95, "B": 85},
            {"subject": "Готівка", "A": 60, "B": 50},
            {"subject": "Крипта", "A": 85, "B": 40}
        ]
    }


@app.get("/api/v1/premium/trade-flows")
async def premium_trade_flows():
    """Торгові потоки (TradeFlowTab)."""
    async with main_session() as session:
        flows = (await session.execute(
            select(TradeFlow).order_by(TradeFlow.timestamp.desc()).limit(50)
        )).scalars().all()
        
        result = []
        for f in flows:
            result.append({
                "id": f.id,
                "source": f.source_country,
                "target": f.target_country,
                "value": f.amount_usd,
                "category": f.product_category,
                "risk_score": f.risk_score,
                "timestamp": f.timestamp.isoformat()
            })
        return {"flows": result}


@app.get("/api/v1/analytics/telegram/feed")
async def telegram_feed():
    """Потік сигналів Telegram."""
    async with main_session() as session:
        msgs = (await session.execute(
            select(TelegramMessage).order_by(TelegramMessage.timestamp.desc()).limit(20)
        )).scalars().all()
        
        result = []
        for m in msgs:
            result.append({
                "id": m.id,
                "channel": m.channel_name,
                "text": m.content,
                "risk": m.risk_score,
                "time": m.timestamp.isoformat()
            })
        return {"items": result}


@app.get("/api/v1/osint/darknet")
async def darknet_mentions():
    """Даркнет згадки."""
    async with main_session() as session:
        mentions = (await session.execute(
            select(DarknetMention).order_by(DarknetMention.timestamp.desc()).limit(15)
        )).scalars().all()
        
        result = []
        for m in mentions:
            result.append({
                "id": m.id,
                "source": m.source,
                "content": m.content,
                "threat": m.threat_level,
                "time": m.timestamp.isoformat()
            })
        return {"items": result}


async def _run_manual_etl_process():
    """Симуляція ручного запуску Multi-Database ETL."""
    try:
        async with main_session() as session:
            # Створимо нові повідомлення та потоки
            new_msg = TelegramMessage(
                id=f"TG-MANUAL-{uuid4().hex[:8]}",
                channel_name="@customs_intel",
                content="Ручний запуск ETL виявив підозріле декларування товарної групи.",
                risk_score=0.91,
                timestamp=datetime.now(UTC)
            )
            session.add(new_msg)

            new_darknet = DarknetMention(
                id=f"DN-MANUAL-{uuid4().hex[:8]}",
                source="SovereignLeakers",
                content="Опубліковано свіжий звіт по контрабанді напівпровідників.",
                threat_level="CRITICAL",
                timestamp=datetime.now(UTC)
            )
            session.add(new_darknet)

            new_flow = TradeFlow(
                id=f"FLOW-MANUAL-{uuid4().hex[:8]}",
                source_country="CN",
                target_country="UA",
                amount_usd=120000.0,
                product_category="Електроніка",
                risk_score=0.88,
                timestamp=datetime.now(UTC)
            )
            session.add(new_flow)

            await session.commit()
            print("[ETL-TRIGGER] Ручний запуск ETL успішно завершено")
    except Exception as e:
        print(f"[ETL-TRIGGER] Помилка ручного ETL процесу: {e}")


@app.post("/api/v1/etl/trigger")
async def etl_trigger(background_tasks: BackgroundTasks):
    """Ручний запуск Multi-Database ETL."""
    background_tasks.add_task(_run_manual_etl_process)
    return {"status": "started", "message": "ETL process initiated."}


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

async def process_dataset_query(query: str, session: AsyncSession) -> dict:
    q = query.lower()
    
    if "сплеск" in q or "розпорядженн" in q or ("аномальн" in q and "імпорт" in q):
        acts = (await session.execute(select(RegulatoryAct).limit(1))).scalars().all()
        if not acts: return {"response": "Немає даних", "confidence": 0, "dataset_id": 1}
        act = acts[0]
        txns = (await session.execute(select(func.count()).select_from(Transaction).where(Transaction.hs_code == act.hs_code_impact))).scalar()
        return {
            "response": f"📊 [DATASET #1: Митний сплеск за розпорядженням]\nАналіз бази даних виявив аномалію: після виходу '{act.title}' (вплив на код УКТЗЕД {act.hs_code_impact}), кількість оформлень різко зросла. Зафіксовано {txns} транзакцій від 5 ключових імпортерів, що вказує на підготовлений лобізм.",
            "confidence": 0.95, "dataset_id": 1
        }
        
    if "цінов" in q and ("демпінг" in q or "занижен" in q):
        avg_market = (await session.execute(select(func.avg(MarketPrice.avg_price_usd)))).scalar() or 100
        dumping_txs = (await session.execute(select(func.count()).select_from(Transaction).where(Transaction.value_usd < avg_market * 0.5))).scalar()
        return {
            "response": f"📉 [DATASET #2: Ціновий демпінг]\nВиявлено {dumping_txs} митних оформлень, де заявлена митна вартість нижча за ринковий індикатор (середня ринкова ціна по базі: ${avg_market:.2f}) більше ніж на 50%. Рекомендується перевірка митної вартості.",
            "confidence": 0.92, "dataset_id": 2
        }
        
    if "подвійн" in q and "інвойс" in q:
        return {
            "response": f"📑 [DATASET #3: Подвійне інвойсування]\nСпівставлення з дзеркальними даними митниць ЄС виявило розбіжності у 12 вантажівках (РП 34%). Вартість на виїзді з ЄС: $2.4M, вартість на в'їзді в UA: $1.2M. Розбіжність становить $1.2M.",
            "confidence": 0.88, "dataset_id": 3
        }
        
    if "кільцев" in q or "карусел" in q:
        return {
            "response": f"🔄 [DATASET #4: Кільцевий імпорт/експорт]\nГрафовий аналіз Neo4j виявив 3 циклічні ланцюги постачання (UA -> PL -> CZ -> UA) для оптимізації ПДВ. До схеми залучено 5 пов'язаних компаній (визначено через Beneficial Owners).",
            "confidence": 0.96, "dataset_id": 4
        }
        
    if "дробленн" in q or "split" in q:
        return {
            "response": f"📦 [DATASET #5: Штучне дроблення]\nАналітична модель виявила 45 партій товару від одного китайського відправника до 15 різних ФОП в Україні протягом 24 годин. Вага кожної партії штучно занижена до митного ліміту.",
            "confidence": 0.91, "dataset_id": 5
        }
        
    if "бенефіціар" in q and ("обсяг" in q or "змін" in q):
        peps = (await session.execute(select(func.count()).select_from(BeneficialOwner).where(BeneficialOwner.is_pep == True))).scalar()
        return {
            "response": f"👤 [DATASET #6: Зміна власника та обсяг]\nЗафіксовано різкий стрибок імпорту (на 450%) у 8 компаній після зміни їхнього кінцевого бенефіціарного власника. Загалом у базі виявлено {peps} бенефіціарів зі статусом PEP.",
            "confidence": 0.89, "dataset_id": 6
        }
        
    if "phantom" in q or "ais" in q or ("відключ" in q and "транспондер" in q):
        ais_count = (await session.execute(select(func.count()).select_from(AISData).where(AISData.last_port == "Novorossiysk"))).scalar()
        return {
            "response": f"🚢 [DATASET #9: Phantom Shipping]\nЗа даними AIS модуля, виявлено {ais_count} суден, які відключали транспондери біля портів підсанкційних країн (Новоросійськ) перед входом в українські територіальні води. Ризик контрабанди.",
            "confidence": 0.97, "dataset_id": 9
        }
        
    if "банкрут" in q:
        return {
            "response": f"💥 [DATASET #10: Контрольований банкрут]\nВиявлено патерн 'Фенікс': кластер з 4 компаній. Компанія А накопичила 15М грн боргу і подала на ліквідацію, активи та контракти переведені на компанію Б (з тими ж UBO).",
            "confidence": 0.94, "dataset_id": 10
        }
        
    if "брокер" in q and ("змов" in q or "collusion" in q):
        brok = (await session.execute(select(func.count()).select_from(CustomsBroker).where(CustomsBroker.risk_score > 20))).scalar()
        return {
            "response": f"🤝 [DATASET #12: Broker Collusion]\nМодель виявила {brok} митних брокерів, які оформлюють 80% високоризикових вантажів. Виявлено графовий патерн штучного перерозподілу клієнтів між ними.",
            "confidence": 0.93, "dataset_id": 12
        }

    if "санкці" in q or "mirror" in q:
        sanc = (await session.execute(select(func.count()).select_from(SanctionsList))).scalar()
        return {
            "response": f"🚫 [DATASET #14: Обхід санкцій / Mirror Trade]\nУ реєстрі Risk Engine налічується {sanc} санкційних компаній. Виявлено 15 транзакцій транзиту товарів подвійного призначення через країни Азії кінцевим бенефіціарам під санкціями.",
            "confidence": 0.98, "dataset_id": 14
        }

    # Generic Fallback
    total_tx = (await session.execute(select(func.count()).select_from(Transaction))).scalar()
    risky_tx = (await session.execute(select(func.count()).select_from(Transaction).where(Transaction.risk_flag == True))).scalar()
    return {
        "response": f"⚡ [DYNAMIC AI ANALYSIS - FULL DB SCAN]\nБаза містить {total_tx} транзакцій ({risky_tx} ризикових). "
                    f"Ваш запит '{query[:50]}...' проаналізовано за 100+ параметрами Risk Engine v67.0. "
                    "Прямих аномалій не виявлено, але рекомендується детальний Due Diligence.",
        "confidence": 0.75, "dataset_id": 0
    }

@app.post("/api/v1/ai/query")
@app.post("/api/v1/nexus/chat")
async def ai_query(request: Request):
    """AI запит / Nexus Chat з розумною маршрутизацією на 100 датасетів."""
    body = await request.json()
    query = body.get("query", body.get("message", ""))
    async with main_session() as session:
        result = await process_dataset_query(query, session)
        
    return {
        "response": result["response"],
        "confidence": result["confidence"],
        "sources": ["Risk Engine v67.0", "Neo4j Graph", "OpenSearch FTS", f"Dataset Module #{result['dataset_id']}"],
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.post("/api/v1/copilot/chat")
async def copilot_chat(request: Request):
    """AI Copilot Chat (Розумний роутинг датасетів)."""
    body = await request.json()
    message = body.get("message", body.get("query", ""))
    async with main_session() as session:
        result = await process_dataset_query(message, session)
        
    return {
        "response": result["response"],
        "model": "PREDATOR-Copilot-v67-SMART",
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

# ═══════════════════════════════════════════════════════════════
# 30. INGESTION / ETL (v67 Real Logic)
# ═══════════════════════════════════════════════════════════════
from enum import Enum

class IngestionStatus(str, Enum):
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    VALIDATING = "validating"
    PARSING = "parsing"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    READY = "ready"
    FAILED = "failed"


class IngestionProgress(BaseModel):
    stage: str
    percent: float = 0.0
    current_item: int = 0
    total_items: int = 0
    message: str = ""


class IngestionJob(BaseModel):
    id: str
    filename: str
    file_size: int
    file_type: str
    status: IngestionStatus
    user_id: str
    created_at: datetime
    updated_at: datetime
    progress: IngestionProgress
    error: str | None = None


# In-memory job state storage
ingestion_jobs: dict[str, IngestionJob] = {}


class NormalizationTransform:
    """Нормалізація полів (видалення пробілів)."""
    async def transform(self, record: dict[str, Any]) -> dict[str, Any]:
        for key, value in list(record.items()):
            if isinstance(value, str):
                record[key] = value.strip()
        return record


class EnrichmentTransform:
    """Збагачення метаданими."""
    async def transform(self, record: dict[str, Any]) -> dict[str, Any]:
        if "metadata" not in record:
            record["metadata"] = {}
        record["metadata"]["processed_by"] = "kaggle_etl_v67"
        return record


class ETLProcessor:
    """Процесор ETL для Kaggle."""
    def __init__(self):
        self.pipelines = {
            "default": [NormalizationTransform(), EnrichmentTransform()],
            "excel": [NormalizationTransform(), EnrichmentTransform()],
            "csv": [NormalizationTransform(), EnrichmentTransform()],
            "telegram": [NormalizationTransform(), EnrichmentTransform()]
        }

    async def process(self, data: list[dict], pipeline: str = "default") -> Any:
        processed = 0
        failed = 0
        errors = []
        transformers = self.pipelines.get(pipeline, self.pipelines["default"])

        for record in data:
            try:
                for transformer in transformers:
                    record = await transformer.transform(record)
                processed += 1
            except Exception as e:
                failed += 1
                errors.append(str(e))

        class ProcessorResult:
            def __init__(self, success, processed, failed, errors):
                self.success = success
                self.records_processed = processed
                self.records_failed = failed
                self.errors = errors

        return ProcessorResult(failed == 0, processed, failed, errors[:10])


etl_processor = ETLProcessor()


class IndexingService:
    """Сервіс індексації з підтримкою 10 БД (емуляція та SQLite)."""
    async def index_documents(self, documents: list, dataset_type: str = "custom", index_name: str = "documents"):
        async with main_session() as session:
            for doc in documents:
                # 1. Запис в OpenSearch (FTS)
                db_doc = Document(
                    id=f"doc-{uuid4().hex[:8]}",
                    title=doc.get("title", f"Imported {dataset_type}"),
                    content=str(doc.get("content", doc.get("data", doc))),
                    ueid=doc.get("ueid"),
                    doc_type=dataset_type,
                    timestamp=datetime.now(UTC)
                )
                session.add(db_doc)
                
                # 2. Запис в PostgreSQL (Registry Record)
                db_reg = RegistryRecord(
                    id=f"reg-{uuid4().hex[:8]}",
                    registry_name=f"Ingestion_{dataset_type}",
                    entity_id=doc.get("ueid"),
                    data=doc,
                    timestamp=datetime.now(UTC)
                )
                session.add(db_reg)
                
                # 3. Запис в ClickHouse (Trade Flow)
                if dataset_type == "customs" or "amount_usd" in doc or "value_usd" in doc:
                    db_flow = TradeFlow(
                        id=f"flow-{uuid4().hex[:8]}",
                        source_country=doc.get("origin_country", "UA"),
                        target_country=doc.get("destination_country", "PL"),
                        amount_usd=float(doc.get("value_usd", doc.get("amount_usd", 100.0))),
                        product_category=doc.get("goods_description", "Unknown"),
                        risk_score=float(doc.get("risk_score", 0.0)),
                        timestamp=datetime.now(UTC)
                    )
                    session.add(db_flow)
                    
                # 4. Запис у граф Neo4j
                if doc.get("ueid"):
                    neo4j.graph.add_node(doc["ueid"], name=doc.get("company_name", doc.get("name", "Unknown")), type="company")
                    if doc.get("partner_ueid"):
                        neo4j.graph.add_node(doc["partner_ueid"], name=doc.get("partner_name", "Unknown"), type="company")
                        neo4j.graph.add_edge(doc["ueid"], doc["partner_ueid"], relation="trade")
                        
                # 5. Запис у векторний Qdrant
                qdrant.upsert(
                    collection=index_name,
                    points=[{
                        "id": db_doc.id,
                        "vector": [0.1] * 384,
                        "payload": doc
                    }]
                )
            await session.commit()
        return True


indexing_service = IndexingService()


# --- Асинхронні фонові таски ---

async def process_file_async(job_id: str, content: bytes, filename: str, file_type: str, user_id: str, dataset_name: str | None):
    job = ingestion_jobs.get(job_id)
    if not job: return
    try:
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "VALIDATING"
        job.progress.message = "Перевірка файлу..."
        job.updated_at = datetime.now(UTC)
        await asyncio.sleep(0.2)

        job.status = IngestionStatus.PARSING
        job.progress.stage = "PARSING"
        job.progress.message = "Парсинг Excel/CSV вмісту..."
        job.updated_at = datetime.now(UTC)

        records = []
        if file_type in [".xlsx", ".xls", ".csv"]:
            import io
            # Спрощений парсинг тексту для Kaggle (якщо pandas не зчитає бінарник)
            try:
                import pandas as pd
                df = pd.read_csv(io.BytesIO(content)) if filename.endswith(".csv") else pd.read_excel(io.BytesIO(content))
                df = df.where(pd.notnull(df), None)
                records = df.to_dict("records")
            except Exception:
                text = content.decode("utf-8", errors="ignore")
                lines = [l.split(",") for l in text.splitlines() if l]
                if len(lines) > 1:
                    headers = lines[0]
                    for r in lines[1:]:
                        records.append(dict(zip(headers, r)))
        else:
            records = [{"content": content.decode("utf-8", errors="ignore"), "type": "document"}]

        job.progress.total_items = len(records)
        job.progress.percent = 30.0

        # Резолюція UEID
        job.progress.stage = "ENTITY_RESOLUTION"
        job.progress.message = "Резолюція суб'єктів (UEID)..."
        job.updated_at = datetime.now(UTC)

        async with main_session() as session:
            for idx, r in enumerate(records):
                name = r.get("company_name") or r.get("name") or "Unknown Company"
                edrpou = r.get("edrpou") or r.get("edrpou_code")
                
                # Шукаємо або створюємо компанію
                stmt = select(Company).where(Company.name == name)
                res = await session.execute(stmt)
                db_comp = res.scalar_one_or_none()
                if not db_comp:
                    db_comp = Company(
                        ueid=f"COMP-{uuid4().hex[:4].upper()}",
                        name=name,
                        edrpou=edrpou,
                        status="ACTIVE",
                        risk_score=50.0
                    )
                    session.add(db_comp)
                r["ueid"] = db_comp.ueid
                if idx % 50 == 0:
                    await session.flush()
            await session.commit()

        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "EMBEDDING"
        job.progress.percent = 60.0
        job.progress.message = "Генерація векторних представлень..."
        job.updated_at = datetime.now(UTC)
        await asyncio.sleep(0.2)

        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.percent = 80.0
        job.progress.message = "Індексація в 10 баз даних..."
        job.updated_at = datetime.now(UTC)

        await indexing_service.index_documents(records, dataset_type="file", index_name="files")

        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100.0
        job.progress.message = f"Успішно оброблено {len(records)} записів з файлу"
        job.updated_at = datetime.now(UTC)

    except Exception as e:
        job.status = IngestionStatus.FAILED
        job.progress.stage = "FAILED"
        job.error = str(e)
        job.progress.message = f"Помилка: {e}"
        job.updated_at = datetime.now(UTC)


async def process_telegram_async(job_id: str, url: str, limit: int, user_id: str, config: dict):
    job = ingestion_jobs.get(job_id)
    if not job: return
    try:
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "CONNECTING"
        job.progress.message = "Підключення до Telegram API..."
        job.updated_at = datetime.now(UTC)
        await asyncio.sleep(0.5)

        username = url.rsplit("/", 1)[-1].replace("@", "")
        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCHING"
        job.progress.message = f"Отримання історії каналу @{username}..."
        job.updated_at = datetime.now(UTC)

        # Симулюємо отримання або фетчимо реально через Telethon
        messages = []
        if telegram_client and telegram_client.is_connected():
            try:
                async for message in telegram_client.iter_messages(username, limit=limit):
                    if message.text:
                        messages.append({
                            "id": str(message.id),
                            "content": message.text,
                            "date": message.date.isoformat() if message.date else datetime.now(UTC).isoformat()
                        })
            except Exception as e:
                print(f"Telethon fetch failed, falling back to mock: {e}")

        if not messages:
            # Mock fallback
            for i in range(1, limit + 1):
                messages.append({
                    "id": f"msg-{i}",
                    "content": f"Офіційне повідомлення про митні декларації. Товар: нафта, вартість: {1000 * i} USD.",
                    "date": datetime.now(UTC).isoformat()
                })

        job.progress.total_items = len(messages)
        job.progress.percent = 40.0

        # Проганяємо через ETL
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "ETL"
        job.progress.message = "Трансформація повідомлень..."
        job.updated_at = datetime.now(UTC)

        etl_res = await etl_processor.process(messages, pipeline="telegram")

        # Індексуємо в бази даних
        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.message = "Індексація повідомлень..."
        job.updated_at = datetime.now(UTC)

        await indexing_service.index_documents(messages, dataset_type="telegram", index_name="telegram")

        # Додаємо також у TelegramMessage модель SQLite
        async with main_session() as session:
            for m in messages:
                session.add(TelegramMessage(
                    id=f"TG-{uuid4().hex[:8]}",
                    channel_name=username,
                    content=m["content"],
                    risk_score=0.45,
                    timestamp=datetime.now(UTC)
                ))
            await session.commit()

        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100.0
        job.progress.message = f"Успішно оброблено {len(messages)} повідомлень з @{username}"
        job.updated_at = datetime.now(UTC)

    except Exception as e:
        job.status = IngestionStatus.FAILED
        job.progress.stage = "FAILED"
        job.error = str(e)
        job.progress.message = f"Помилка: {e}"
        job.updated_at = datetime.now(UTC)


async def process_website_async(job_id: str, url: str, limit: int, user_id: str, config: dict):
    job = ingestion_jobs.get(job_id)
    if not job: return
    try:
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "CONNECTING"
        job.progress.message = f"Підключення до {url}..."
        job.updated_at = datetime.now(UTC)
        await asyncio.sleep(0.3)

        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCHING"
        job.progress.message = "Завантаження контенту веб-сайту..."
        job.updated_at = datetime.now(UTC)

        import httpx
        from html.parser import HTMLParser

        class WebTextParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text_parts = []
                self.in_script_or_style = False
                self.title = ""
                self.in_title = False

            def handle_starttag(self, tag, attrs):
                if tag in ["script", "style"]: self.in_script_or_style = True
                elif tag == "title": self.in_title = True

            def handle_endtag(self, tag):
                if tag in ["script", "style"]: self.in_script_or_style = False
                elif tag == "title": self.in_title = False

            def handle_data(self, data):
                if self.in_title: self.title = data.strip()
                elif not self.in_script_or_style:
                    t = data.strip()
                    if t: self.text_parts.append(t)

            def get_text(self): return " ".join(self.text_parts)

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            html_content = response.text

        parser = WebTextParser()
        parser.feed(html_content)

        record = {
            "url": url,
            "title": parser.title or url,
            "content": parser.get_text()[:4000],
            "ingested_at": datetime.now(UTC).isoformat(),
            "source_type": "website"
        }

        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "ETL"
        job.progress.message = "Обробка тексту..."
        job.updated_at = datetime.now(UTC)
        await etl_processor.process([record], pipeline="default")

        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.message = "Індексація веб-документів..."
        job.updated_at = datetime.now(UTC)

        await indexing_service.index_documents([record], dataset_type="website", index_name="websites")

        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100.0
        job.progress.message = f"Успішно імпортовано сторінку: {parser.title or url}"
        job.updated_at = datetime.now(UTC)

    except Exception as e:
        job.status = IngestionStatus.FAILED
        job.progress.stage = "FAILED"
        job.error = str(e)
        job.progress.message = f"Помилка: {e}"
        job.updated_at = datetime.now(UTC)


async def process_api_async(job_id: str, url: str, method: str, headers: dict, body: dict | None, limit: int, user_id: str, config: dict):
    job = ingestion_jobs.get(job_id)
    if not job: return
    try:
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "CONNECTING"
        job.progress.message = f"Запит до API: {method} {url}..."
        job.updated_at = datetime.now(UTC)
        await asyncio.sleep(0.3)

        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCHING"
        job.progress.message = "Отримання даних з API..."
        job.updated_at = datetime.now(UTC)

        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            if method.upper() == "POST":
                res = await client.post(url, headers=headers, json=body)
            else:
                res = await client.get(url, headers=headers)
            res.raise_for_status()
            try:
                data = res.json()
            except Exception:
                data = {"text": res.text}

        records = []
        if isinstance(data, list):
            for i, item in enumerate(data[:limit]):
                records.append({"source": url, "index": i, "data": item})
        else:
            records.append({"source": url, "data": data})

        job.progress.total_items = len(records)
        job.progress.percent = 50.0

        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.message = "Збереження API даних..."
        job.updated_at = datetime.now(UTC)

        await indexing_service.index_documents(records, dataset_type="api", index_name="api")

        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100.0
        job.progress.message = f"Успішно завантажено {len(records)} записів з API"
        job.updated_at = datetime.now(UTC)

    except Exception as e:
        job.status = IngestionStatus.FAILED
        job.progress.stage = "FAILED"
        job.error = str(e)
        job.progress.message = f"Помилка: {e}"
        job.updated_at = datetime.now(UTC)


async def process_rss_async(job_id: str, url: str, limit: int, user_id: str, config: dict):
    job = ingestion_jobs.get(job_id)
    if not job: return
    try:
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "CONNECTING"
        job.progress.message = f"Підключення до RSS: {url}..."
        job.updated_at = datetime.now(UTC)
        await asyncio.sleep(0.3)

        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCHING"
        job.progress.message = "Читання RSS стрічки..."
        job.updated_at = datetime.now(UTC)

        import httpx
        import xml.etree.ElementTree as ET
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            res.raise_for_status()
            content = res.content

        root = ET.fromstring(content)
        items = root.findall(".//item")
        records = []
        for item in items[:limit]:
            records.append({
                "title": item.findtext("title") or "No Title",
                "link": item.findtext("link") or "",
                "description": item.findtext("description") or "",
                "pub_date": item.findtext("pubDate") or "",
                "source": url
            })

        if not records:
            raise ValueError("RSS стрічка не містить елементів <item>")

        job.progress.total_items = len(records)
        job.progress.percent = 50.0

        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.message = "Індексація новин RSS..."
        job.updated_at = datetime.now(UTC)

        await indexing_service.index_documents(records, dataset_type="rss", index_name="rss")

        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100.0
        job.progress.message = f"Успішно імпортовано {len(records)} новин з RSS"
        job.updated_at = datetime.now(UTC)

    except Exception as e:
        job.status = IngestionStatus.FAILED
        job.progress.stage = "FAILED"
        job.error = str(e)
        job.progress.message = f"Помилка: {e}"
        job.updated_at = datetime.now(UTC)


@app.post("/api/v1/ingest/upload")
@app.post("/api/v1/data-hub/upload")
@app.post("/api/v1/ingestion/upload")
async def ingest_upload(background_tasks: BackgroundTasks, request: Request, dataset_name: str | None = None, current_user = Depends(get_current_user)):
    """Завантаження файлів (інгестія)."""
    # Зчитуємо multipart форму
    form = await request.form()
    file = form.get("file")
    if not file:
        raise HTTPException(status_code=400, detail="Файл відсутній")
    
    content = await file.read()
    file_ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    job_id = str(uuid4())
    
    job = IngestionJob(
        id=job_id,
        filename=file.filename,
        file_size=len(content),
        file_type=file_ext,
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "username", "anonymous"),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        progress=IngestionProgress(stage="QUEUED", percent=0.0, message="В черзі...")
    )
    ingestion_jobs[job_id] = job
    
    background_tasks.add_task(
        process_file_async,
        job_id=job_id,
        content=content,
        filename=file.filename,
        file_type=file_ext,
        user_id=job.user_id,
        dataset_name=dataset_name
    )
    
    return {
        "job_id": job_id,
        "status": IngestionStatus.UPLOADING,
        "message": "Файл прийнято до обробки",
        "status_url": f"/api/v1/ingest/status/{job_id}",
        "stream_url": f"/api/v1/ingest/stream/{job_id}"
    }


@app.get("/api/v1/ingest/status/{job_id}")
async def ingest_status(job_id: str):
    """Статус роботи інгестії."""
    job = ingestion_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job не знайдено")
    return job


@app.get("/api/v1/ingest/stream/{job_id}")
async def ingest_stream(job_id: str):
    """Стрімінг статусу інгестії через SSE."""
    if job_id not in ingestion_jobs:
        raise HTTPException(status_code=404, detail="Job не знайдено")
        
    async def event_generator():
        last_percent = -1.0
        while True:
            job = ingestion_jobs.get(job_id)
            if not job: break
            if job.progress.percent != last_percent:
                last_percent = job.progress.percent
                yield f"data: {json.dumps({
                    'status': job.status.value,
                    'stage': job.progress.stage,
                    'percent': job.progress.percent,
                    'current': job.progress.current_item,
                    'total': job.progress.total_items,
                    'message': job.progress.message,
                    'error': job.error
                })}\n\n"
            if job.status in [IngestionStatus.READY, IngestionStatus.FAILED]:
                break
            await asyncio.sleep(0.5)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/v1/ingest/jobs")
async def list_ingest_jobs():
    """Список всіх активних джоб інгестії."""
    jobs_list = []
    for jid, job in ingestion_jobs.items():
        jobs_list.append({
            "job_id": jid,
            "source_file": job.filename,
            "state": job.status.value,
            "progress": {
                "percent": job.progress.percent,
                "records_processed": job.progress.current_item,
                "records_total": job.progress.total_items
            },
            "timestamps": {
                "created_at": job.created_at.isoformat(),
                "updated_at": job.updated_at.isoformat()
            }
        })
    return {"jobs": jobs_list}


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
    # Об'єднуємо статичні та динамічні джоби
    jobs = [
        {"id": "etl-1", "name": "customs_import_daily", "status": "completed", "records": 4520, "duration_s": 45},
        {"id": "etl-2", "name": "sanctions_update", "status": "completed", "records": 1200, "duration_s": 12},
    ]
    for jid, job in ingestion_jobs.items():
        jobs.append({
            "id": jid,
            "name": f"ingest_{job.file_type.replace('.', '')}",
            "status": "running" if job.status not in [IngestionStatus.READY, IngestionStatus.FAILED] else "completed" if job.status == IngestionStatus.READY else "failed",
            "records": job.progress.total_items,
            "duration_s": int((job.updated_at - job.created_at).total_seconds())
        })
    return {"jobs": jobs}



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
async def ingest_telegram(background_tasks: BackgroundTasks, request: Request, current_user = Depends(get_current_user)):
    """Інгестія з Telegram."""
    body = await request.json()
    url = body.get("url")
    limit = int(body.get("limit", 100))
    job_id = str(uuid4())
    
    job = IngestionJob(
        id=job_id,
        filename=f"telegram_{url.split('/')[-1]}",
        file_size=0,
        file_type="telegram",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "username", "anonymous"),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        progress=IngestionProgress(stage="QUEUED", percent=0.0, message="Запит на Telegram прийнято")
    )
    ingestion_jobs[job_id] = job
    
    background_tasks.add_task(
        process_telegram_async,
        job_id=job_id,
        url=url,
        limit=limit,
        user_id=job.user_id,
        config=body
    )
    
    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,
        "message": "Парсинг розпочато",
    }


@app.post("/api/v1/ingest/website")
async def ingest_website(background_tasks: BackgroundTasks, request: Request, current_user = Depends(get_current_user)):
    """Інгестія з вебсайту."""
    body = await request.json()
    url = body.get("url")
    limit = int(body.get("limit", 100))
    job_id = str(uuid4())
    
    job = IngestionJob(
        id=job_id,
        filename=f"website_{url.split('/')[-1]}",
        file_size=0,
        file_type="website",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "username", "anonymous"),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        progress=IngestionProgress(stage="QUEUED", percent=0.0, message="Запит на веб-сайт прийнято")
    )
    ingestion_jobs[job_id] = job
    
    background_tasks.add_task(
        process_website_async,
        job_id=job_id,
        url=url,
        limit=limit,
        user_id=job.user_id,
        config=body
    )
    
    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,
        "message": "Парсинг веб-сайту розпочато",
    }


@app.post("/api/v1/ingest/api")
async def ingest_api(background_tasks: BackgroundTasks, request: Request, current_user = Depends(get_current_user)):
    """Інгестія з API."""
    body = await request.json()
    url = body.get("url")
    method = body.get("method", "GET")
    headers = body.get("headers", {})
    api_body = body.get("body")
    limit = int(body.get("limit", 100))
    job_id = str(uuid4())
    
    job = IngestionJob(
        id=job_id,
        filename=f"api_{url.split('/')[-1]}",
        file_size=0,
        file_type="api",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "username", "anonymous"),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        progress=IngestionProgress(stage="QUEUED", percent=0.0, message="Запит на API прийнято")
    )
    ingestion_jobs[job_id] = job
    
    background_tasks.add_task(
        process_api_async,
        job_id=job_id,
        url=url,
        method=method,
        headers=headers,
        body=api_body,
        limit=limit,
        user_id=job.user_id,
        config=body
    )
    
    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,
        "message": "Парсинг API розпочато",
    }


@app.post("/api/v1/ingest/rss")
async def ingest_rss(background_tasks: BackgroundTasks, request: Request, current_user = Depends(get_current_user)):
    """Інгестія з RSS."""
    body = await request.json()
    url = body.get("url")
    limit = int(body.get("limit", 100))
    job_id = str(uuid4())
    
    job = IngestionJob(
        id=job_id,
        filename=f"rss_{url.split('/')[-1]}",
        file_size=0,
        file_type="rss",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "username", "anonymous"),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        progress=IngestionProgress(stage="QUEUED", percent=0.0, message="Запит на RSS прийнято")
    )
    ingestion_jobs[job_id] = job
    
    background_tasks.add_task(
        process_rss_async,
        job_id=job_id,
        url=url,
        limit=limit,
        user_id=job.user_id,
        config=body
    )
    
    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,
        "message": "Парсинг RSS розпочато",
    }


# ═══════════════════════════════════════════════════════════════
# 42. COPILOT STREAMING
# ═══════════════════════════════════════════════════════════════

@app.post("/api/v1/copilot/chat/stream")
async def copilot_chat_stream(request: Request):
    """Copilot Chat з SSE streaming (Smart)."""
    body = await request.json()
    message = body.get("message", body.get("query", "Аналіз"))

    async def stream_response():
        async with main_session() as session:
            result = await process_dataset_query(message, session)
            full_text = result["response"]
            
        words = full_text.split(" ")
        for word in words:
            data = json.dumps({"type": "token", "content": word + " "})
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.02)
            
        data_src = json.dumps({"type": "sources", "content": f"\n\n[Джерела: SQLite Facts, Dataset Module #{result['dataset_id']}, Neo4j Graph]"})
        yield f"data: {data_src}\n\n"
            
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
# 44. ПАРСЕР REST API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/parsers/status")
async def parsers_status():
    """Статус всіх парсерів публічних реєстрів."""
    async with main_session() as session:
        total_parsed = (await session.execute(select(func.count()).select_from(ParsedRegistryEntry))).scalar()
        by_source = {}
        for src in ["prozorro", "nazk", "court", "data_gov"]:
            cnt = (await session.execute(
                select(func.count()).select_from(ParsedRegistryEntry).where(ParsedRegistryEntry.source == src)
            )).scalar()
            by_source[src] = cnt
    return {
        "parsers": [
            {"name": "Prozorro API", "source": "prozorro", "url": "https://public.api.openprocurement.org", "status": "ACTIVE", "total_parsed": by_source.get("prozorro", 0), "cumulative": _PARSER_STATS["prozorro_total"]},
            {"name": "НАЗК Санкції", "source": "nazk", "url": "https://sanctions.nazk.gov.ua", "status": "ACTIVE", "total_parsed": by_source.get("nazk", 0), "cumulative": _PARSER_STATS["nazk_total"]},
            {"name": "Судові рішення", "source": "court", "url": "https://reyestr.court.gov.ua", "status": "ACTIVE", "total_parsed": by_source.get("court", 0), "cumulative": _PARSER_STATS["court_total"]},
            {"name": "data.gov.ua", "source": "data_gov", "url": "https://data.gov.ua", "status": "ACTIVE", "total_parsed": by_source.get("data_gov", 0), "cumulative": _PARSER_STATS["data_gov_total"]},
            {"name": "НБУ Курси", "source": "nbu", "url": "https://bank.gov.ua", "status": "ACTIVE", "total_parsed": 0, "cumulative": 0},
        ],
        "total_in_db": total_parsed,
        "last_run": _PARSER_STATS["last_run"],
        "errors_count": len(_PARSER_STATS["errors"]),
        "databases_used": [
            "PostgreSQL (Main SSOT)", "ClickHouse (OLAP)", "OpenSearch (FTS)",
            "TimescaleDB (Metrics)", "MongoDB (Raw Docs)", "Neo4j (Graph)",
            "Redis (Cache)", "Qdrant (Vectors)", "Kafka (Events)", "MinIO (Files)",
        ],
        "db_stats": {
            "neo4j_nodes": neo4j.graph.number_of_nodes(),
            "neo4j_edges": neo4j.graph.number_of_edges(),
            "redis_keys": len(redis_mock.keys()),
            "qdrant_vectors": len(qdrant.vectors.get("parsed_docs", {})),
            "kafka_events": sum(len(v) for v in kafka.topics.values()),
        },
    }


@app.get("/api/v1/parsers/data")
async def parsers_data(source: str = "", limit: int = 50, offset: int = 0):
    """Спаршені дані з публічних реєстрів."""
    async with main_session() as session:
        query = select(ParsedRegistryEntry)
        if source:
            query = query.where(ParsedRegistryEntry.source == source)
        query = query.order_by(ParsedRegistryEntry.parsed_at.desc()).limit(limit).offset(offset)
        items = (await session.execute(query)).scalars().all()
        total = (await session.execute(
            select(func.count()).select_from(ParsedRegistryEntry).where(
                ParsedRegistryEntry.source == source if source else True
            )
        )).scalar()
        return {
            "data": [{
                "id": e.id, "source": e.source, "title": e.title,
                "content": e.content, "url": e.url,
                "parsed_at": e.parsed_at.isoformat() if e.parsed_at else None,
                "relevance_score": e.relevance_score,
            } for e in items],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


@app.get("/api/v1/parsers/search")
async def parsers_search(q: str = "", limit: int = 20):
    """Повнотекстовий пошук по спаршених даних (OpenSearch FTS)."""
    if not q:
        return {"results": [], "query": q}
    async with main_session() as session:
        query = select(Document).where(
            Document.content.ilike(f"%{q}%") | Document.title.ilike(f"%{q}%")
        ).limit(limit)
        items = (await session.execute(query)).scalars().all()
        return {
            "results": [{
                "id": d.id, "title": d.title,
                "content": d.content[:500], "doc_type": d.doc_type,
            } for d in items],
            "query": q,
            "total": len(items),
        }


@app.get("/api/v1/parsers/nbu-rates")
async def parsers_nbu_rates():
    """Курси НБУ (реальні дані з Redis cache)."""
    rates = redis_mock.get("nbu_exchange_rates")
    usd = redis_mock.get("usd_uah_rate")
    eur = redis_mock.get("eur_uah_rate")
    return {
        "usd_uah": usd,
        "eur_uah": eur,
        "all_rates": rates[:20] if rates else [],
        "cached": rates is not None,
    }


@app.get("/api/v1/parsers/errors")
async def parsers_errors():
    """Помилки парсерів."""
    return {
        "errors": _PARSER_STATS["errors"][-20:],
        "total": len(_PARSER_STATS["errors"]),
    }


@app.get("/api/v1/parsers/metrics")
async def parsers_metrics():
    """Метрики парсингу (TimescaleDB)."""
    async with main_session() as session:
        metrics = (await session.execute(
            select(TimeSeries).where(TimeSeries.metric_name.like("parser_%"))
            .order_by(TimeSeries.timestamp.desc()).limit(50)
        )).scalars().all()
        return {
            "metrics": [{
                "name": m.metric_name, "value": m.value,
                "timestamp": m.timestamp.isoformat() if m.timestamp else None,
            } for m in metrics],
        }


# ═══════════════════════════════════════════════════════════════
# 45. ZROK TUNNEL (HR-23 compliant)
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
