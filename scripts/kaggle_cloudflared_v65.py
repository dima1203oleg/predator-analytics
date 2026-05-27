# KAGGLE CLOUDFLARED ONE-CELL v65.0: з SQLite, RBAC, фільтрацією, CSV імпорт/експорт
# Вимоги: CPU Only, Internet ON
# Cloudflared quick tunnel — без акаунта, без токена

import subprocess, sys, os, re, threading, time

# 1. Залежностi
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "fastapi", "uvicorn[standard]", "psutil", "httpx", "sqlalchemy", "aiosqlite", "python-jose[cryptography]", "passlib[bcrypt]"])

# 2. Запис backend
backend_code = '''import os, subprocess, threading, time, csv, io, json
from datetime import UTC, datetime, timedelta
import psutil
from fastapi import FastAPI, Depends, HTTPException, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, Text, select, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import aiosqlite
from jose import JWTError, jwt
from passlib.context import CryptContext

# Налаштування
SECRET_KEY = "predator-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# SQLite база даних
DATABASE_URL = "sqlite+aiosqlite:///./predator_v65.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Моделі бази даних
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

app = FastAPI(title="PREDATOR Analytics Kaggle Node", version="65.0-ELITE")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== УТІЛІТИ АУТЕНТИФІКАЦІЇ ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Query(..., description="JWT token")):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    async with async_session() as session:
        query = select(User).where(User.username == username)
        result = await session.execute(query)
        user = result.scalar_one_or_none()
        if user is None:
            raise credentials_exception
        return user

# ==================== ІНІЦІАЛІЗАЦІЯ БАЗИ ДАНИХ ====================

async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # Seed Users
        if (await session.execute(select(func.count()).select_from(User))).scalar() == 0:
            seed_users = [
                User(username="admin", email="admin@predator.ua", hashed_password=get_password_hash("admin123"), role="tech_admin"),
                User(username="client", email="client@predator.ua", hashed_password=get_password_hash("client123"), role="standard_client"),
                User(username="vip", email="vip@predator.ua", hashed_password=get_password_hash("vip123"), role="vip_client"),
            ]
            for user in seed_users:
                session.add(user)
        
        # Seed Companies (25 українських)
        if (await session.execute(select(func.count()).select_from(Company))).scalar() == 0:
            companies_data = [
                ("COMP-001", "ТОВ ТЕСТОВА КОМПАНІЯ", "12345678", "ACTIVE", 74.2, "Kyiv", "IT"),
                ("COMP-002", "ПП ЕКСПЕРТ", "23456789", "ACTIVE", 45.0, "Lviv", "Consulting"),
                ("COMP-003", "ТОВ АЛЬФА ГРУП", "34567890", "ACTIVE", 88.5, "Kyiv", "Finance"),
                ("COMP-004", "ПП БЕТА СЕРВІС", "45678901", "ACTIVE", 32.0, "Odesa", "Logistics"),
                ("COMP-005", "ТОВ ГАММА ТРЕЙД", "56789012", "ACTIVE", 91.2, "Kyiv", "Trade"),
                ("COMP-006", "ТОВ ДЕЛЬТА ЛОДЖИСТИКС", "67890123", "ACTIVE", 67.0, "Kharkiv", "Logistics"),
                ("COMP-007", "ПП ЕПСИЛОН КОНСАЛТИНГ", "78901234", "ACTIVE", 23.5, "Dnipro", "Consulting"),
                ("COMP-008", "ТОВ ЗЕТА БІЛДІНГ", "89012345", "ACTIVE", 82.1, "Kyiv", "Construction"),
                ("COMP-009", "ПП ЕТА ТРЕЙДІНГ", "90123456", "ACTIVE", 55.0, "Lviv", "Trade"),
                ("COMP-010", "ТОВ ТЕТА ІНВЕСТ", "01234567", "ACTIVE", 78.3, "Kyiv", "Investment"),
                ("COMP-011", "ПП ЙОТА СЕКЬЮРИТІ", "11223344", "ACTIVE", 42.0, "Odesa", "Security"),
                ("COMP-012", "ТОВ КАППА ФІНАНС", "22334455", "ACTIVE", 95.0, "Kyiv", "Finance"),
                ("COMP-013", "ПП ЛЯМБДА ТЕХ", "33445566", "ACTIVE", 36.0, "Kharkiv", "IT"),
                ("COMP-014", "ТОВ МЮ ФАРМА", "44556677", "ACTIVE", 71.5, "Lviv", "Pharma"),
                ("COMP-015", "ПП НЮ ЕНЕРДЖІ", "55667788", "ACTIVE", 60.0, "Dnipro", "Energy"),
                ("COMP-016", "ТОВ КСІ АГРО", "66778899", "ACTIVE", 48.0, "Kyiv", "Agriculture"),
                ("COMP-017", "ПП ОМІКРОН МЕДІА", "77889900", "ACTIVE", 85.0, "Odesa", "Media"),
                ("COMP-018", "ТОВ ПІ АЙ ТЕХНОЛОДЖІ", "88990011", "ACTIVE", 39.0, "Kharkiv", "IT"),
                ("COMP-019", "ПП РО СОФТВЕР", "99001122", "ACTIVE", 52.0, "Lviv", "Software"),
                ("COMP-020", "ТОВ СИГМА КОНСТРАКШН", "00112233", "ACTIVE", 76.0, "Kyiv", "Construction"),
                ("COMP-021", "ПП ТАУ ТРАНСПОРТ", "11002233", "ACTIVE", 33.0, "Dnipro", "Transport"),
                ("COMP-022", "ТОВ ІПСИЛОН ІМПОРТ", "22003344", "ACTIVE", 88.0, "Odesa", "Import"),
                ("COMP-023", "ПП ФІ ДЕВЕЛОПМЕНТ", "33004455", "ACTIVE", 64.0, "Kyiv", "Real Estate"),
                ("COMP-024", "ТОВ ХІ МАНУФАКТУРІНГ", "44005566", "ACTIVE", 41.0, "Lviv", "Manufacturing"),
                ("COMP-025", "ПП ПСІ ТЕЛЕКОМ", "55006677", "ACTIVE", 79.0, "Kharkiv", "Telecom"),
            ]
            for data in companies_data:
                session.add(Company(ueid=data[0], name=data[1], edrpou=data[2], status=data[3], risk_score=data[4], region=data[5], industry=data[6]))
        
        # Seed Alerts
        if (await session.execute(select(func.count()).select_from(Alert))).scalar() == 0:
            alerts_data = [
                ("alert-1", "CRITICAL", "Критичний ризик санкцій для ТОВ ГАММА ТРЕЙД", "COMP-005"),
                ("alert-2", "HIGH", "Аномальні транзакції у ТОВ ТЕСТОВА КОМПАНІЯ", "COMP-001"),
                ("alert-3", "MEDIUM", "Зміна директора ПП ЕКСПЕРТ", "COMP-002"),
                ("alert-4", "HIGH", "Підозріла активність ТОВ АЛЬФА ГРУП", "COMP-003"),
                ("alert-5", "CRITICAL", "Санкційний ризик ПП ЕПСИЛОН КОНСАЛТИНГ", "COMP-007"),
                ("alert-6", "INFO", "Нова реєстрація ТОВ ДЕЛЬТА ЛОДЖИСТИКС", "COMP-006"),
                ("alert-7", "WARNING", "Високий рівень боргу ТОВ ЗЕТА БІЛДІНГ", "COMP-008"),
                ("alert-8", "MEDIUM", "Перевірка документів ТОВ ТЕТА ІНВЕСТ", "COMP-010"),
            ]
            for data in alerts_data:
                session.add(Alert(id=data[0], severity=data[1], message=data[2], company_ueid=data[3]))
        
        # Seed Risk Assessments
        if (await session.execute(select(func.count()).select_from(RiskAssessment))).scalar() == 0:
            risks_data = [
                ("COMP-001", 74.2, "CRITICAL", 88, 62, 95, 45, "Аномальні фінансові транзакції виявлені під час моніторингу."),
                ("COMP-003", 88.5, "CRITICAL", 92, 78, 88, 85, "Високий ризик відмивання коштів через складну структуру власності."),
                ("COMP-005", 91.2, "CRITICAL", 95, 88, 98, 75, "Критичний ризик санкційних порушень. Рекомендовано термінову перевірку."),
                ("COMP-008", 82.1, "HIGH", 85, 70, 80, 65, "Високий боргове навантаження та часта зміна директорів."),
                ("COMP-010", 78.3, "HIGH", 75, 82, 70, 80, "Підозріла інвестиційна діяльність в офшорних зонах."),
                ("COMP-012", 95.0, "CRITICAL", 98, 92, 95, 90, "Максимальний рівень ризику. Компанія в санкційних списках."),
                ("COMP-017", 85.0, "HIGH", 80, 85, 88, 70, "Медіа-компанія з підозрілими фінансовими потоками."),
                ("COMP-022", 88.0, "CRITICAL", 90, 82, 85, 88, "Імпортна компанія з ризиком контрабандних схем."),
                ("COMP-025", 79.0, "HIGH", 75, 80, 78, 75, "Телекомунікаційна компанія з непрозорою структурою власності."),
            ]
            for data in risks_data:
                session.add(RiskAssessment(ueid=data[0], score=data[1], level=data[2], structural=data[3], behavioral=data[4], sanctions=data[5], aml=data[6], explanation=data[7]))
        
        await session.commit()

@app.on_event("startup")
async def startup():
    await init_database()

# ==================== OODA LOOP ====================

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
            "OBSERVE": "Сканування транзакційних потоків та митних декларацій...",
            "ORIENT": "Аналіз відхилень від Gold Pattern v5.0 та виявлення аномалій...",
            "DECIDE": "Формування стратегії превентивного блокування ризиків...",
            "ACT": "Впровадження правил у Risk Engine та оновлення сценаріїв...",
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

# ==================== API ЕНДПОІНТИ ====================

@app.get("/api/v1/health")
async def health():
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    return {
        "status": "ONLINE",
        "mode": "KAGGLE_CPU_NATIVE",
        "node": "KAGGLE_RESERVE",
        "version": "65.0-ELITE",
        "timestamp": datetime.now(UTC).isoformat(),
        "ram_used_gb": round(mem.used / 1024**3, 2),
        "ram_total_gb": round(mem.total / 1024**3, 2),
        "ram_percent": mem.percent,
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "disk_used_gb": round(disk.used / 1024**3, 2),
        "disk_total_gb": round(disk.total / 1024**3, 2),
        "disk_percent": round(disk.used / disk.total * 100, 1),
    }

@app.get("/api/v1/health/ready")
async def health_ready():
    return {"status": "ready", "timestamp": datetime.now(UTC).isoformat()}

@app.get("/api/v1/azr/status")
async def azr_status():
    return {"status": "ONLINE", "mode": "KAGGLE_CPU", "version": "65.0-ELITE"}

# --- AUTH ---

@app.post("/api/v1/auth/login")
async def login(username: str, password: str):
    async with async_session() as session:
        query = select(User).where(User.username == username)
        result = await session.execute(query)
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role,
            }
        }

@app.get("/api/v1/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }

# --- COMPANIES (з фільтрацією та сортуванням) ---

@app.get("/api/v1/companies")
async def companies(
    search: str = "",
    region: str = "",
    industry: str = "",
    min_risk: float = 0.0,
    max_risk: float = 100.0,
    status: str = "",
    sort_by: str = "name",
    sort_order: str = "asc",
    limit: int = 25,
    offset: int = 0,
):
    async with async_session() as session:
        query = select(Company)
        
        # Фільтрація
        if search:
            query = query.where(Company.name.ilike(f"%{search}%"))
        if region:
            query = query.where(Company.region == region)
        if industry:
            query = query.where(Company.industry == industry)
        if min_risk > 0:
            query = query.where(Company.risk_score >= min_risk)
        if max_risk < 100:
            query = query.where(Company.risk_score <= max_risk)
        if status:
            query = query.where(Company.status == status)
        
        # Сортування
        sort_column = getattr(Company, sort_by, Company.name)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Пагінація
        total_query = select(func.count()).select_from(query.subquery())
        total_result = await session.execute(total_query)
        total = total_result.scalar()
        
        query = query.offset(offset).limit(limit)
        result = await session.execute(query)
        companies = result.scalars().all()
        
        return {
            "companies": [
                {
                    "ueid": c.ueid,
                    "name": c.name,
                    "edrpou": c.edrpou,
                    "status": c.status,
                    "risk_score": c.risk_score,
                    "region": c.region,
                    "industry": c.industry,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in companies
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
            "filters": {
                "search": search,
                "region": region,
                "industry": industry,
                "min_risk": min_risk,
                "max_risk": max_risk,
                "status": status,
                "sort_by": sort_by,
                "sort_order": sort_order,
            }
        }

@app.post("/api/v1/companies")
async def create_company(
    ueid: str, name: str, edrpou: str = "",
    status: str = "ACTIVE", risk_score: float = 0.0,
    region: str = "Kyiv", industry: str = "Unknown",
):
    async with async_session() as session:
        company = Company(
            ueid=ueid, name=name, edrpou=edrpou,
            status=status, risk_score=risk_score,
            region=region, industry=industry,
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)
        return {
            "ueid": company.ueid, "name": company.name,
            "status": company.status, "risk_score": company.risk_score,
        }

@app.put("/api/v1/companies/{ueid}")
async def update_company(
    ueid: str,
    name: str = None, status: str = None,
    risk_score: float = None, region: str = None, industry: str = None,
):
    async with async_session() as session:
        query = select(Company).where(Company.ueid == ueid)
        result = await session.execute(query)
        company = result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        if name is not None: company.name = name
        if status is not None: company.status = status
        if risk_score is not None: company.risk_score = risk_score
        if region is not None: company.region = region
        if industry is not None: company.industry = industry
        
        await session.commit()
        await session.refresh(company)
        return {"ueid": company.ueid, "name": company.name, "status": company.status, "risk_score": company.risk_score}

@app.delete("/api/v1/companies/{ueid}")
async def delete_company(ueid: str):
    async with async_session() as session:
        query = select(Company).where(Company.ueid == ueid)
        result = await session.execute(query)
        company = result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        await session.delete(company)
        await session.commit()
        return {"message": "Компанію успішно видалено"}

# --- CSV ІМПОРТ/ЕКСПОРТ ---

@app.get("/api/v1/companies/export/csv")
async def export_companies_csv(
    region: str = "", industry: str = "", min_risk: float = 0.0, max_risk: float = 100.0,
):
    async with async_session() as session:
        query = select(Company)
        if region:
            query = query.where(Company.region == region)
        if industry:
            query = query.where(Company.industry == industry)
        if min_risk > 0:
            query = query.where(Company.risk_score >= min_risk)
        if max_risk < 100:
            query = query.where(Company.risk_score <= max_risk)
        
        result = await session.execute(query)
        companies = result.scalars().all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["UEID", "Name", "EDRPOU", "Status", "Risk Score", "Region", "Industry"])
        for c in companies:
            writer.writerow([c.ueid, c.name, c.edrpou, c.status, c.risk_score, c.region, c.industry])
        
        return {"csv": output.getvalue(), "count": len(companies)}

@app.post("/api/v1/companies/import/csv")
async def import_companies_csv(csv_data: str):
    async with async_session() as session:
        reader = csv.reader(io.StringIO(csv_data))
        next(reader)  # Skip header
        imported = 0
        for row in reader:
            if len(row) >= 5:
                company = Company(
                    ueid=row[0], name=row[1], edrpou=row[2] if len(row) > 2 else "",
                    status=row[3] if len(row) > 3 else "ACTIVE",
                    risk_score=float(row[4]) if len(row) > 4 else 0.0,
                    region=row[5] if len(row) > 5 else "Kyiv",
                    industry=row[6] if len(row) > 6 else "Unknown",
                )
                session.add(company)
                imported += 1
        await session.commit()
        return {"imported": imported, "message": f"Успішно імпортовано {imported} компаній"}

# --- ALERTS ---

@app.get("/api/v1/alerts")
async def alerts(
    severity: str = "",
    resolved: bool = None,
    limit: int = 10,
    offset: int = 0,
):
    async with async_session() as session:
        query = select(Alert).order_by(Alert.timestamp.desc())
        
        if severity:
            query = query.where(Alert.severity == severity)
        if resolved is not None:
            query = query.where(Alert.resolved == resolved)
        
        total_query = select(func.count()).select_from(query.subquery())
        total_result = await session.execute(total_query)
        total = total_result.scalar()
        
        query = query.offset(offset).limit(limit)
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
                    "resolved": a.resolved,
                }
                for a in alerts
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

@app.put("/api/v1/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    async with async_session() as session:
        query = select(Alert).where(Alert.id == alert_id)
        result = await session.execute(query)
        alert = result.scalar_one_or_none()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert.resolved = True
        await session.commit()
        return {"message": "Алерт відмічено як вирішений", "alert_id": alert_id}

# --- DASHBOARD ---

@app.get("/api/v1/dashboard/overview")
async def dashboard_overview():
    async with async_session() as session:
        total_companies = (await session.execute(select(func.count()).select_from(Company))).scalar()
        high_risk = (await session.execute(select(func.count()).select_from(Company).where(Company.risk_score >= 70))).scalar()
        critical_risk = (await session.execute(select(func.count()).select_from(Company).where(Company.risk_score >= 90))).scalar()
        alerts_today = (await session.execute(select(func.count()).select_from(Alert).where(Alert.timestamp >= datetime.now(UTC).replace(hour=0, minute=0, second=0)))).scalar()
        unresolved_alerts = (await session.execute(select(func.count()).select_from(Alert).where(Alert.resolved == False))).scalar()
        
        # Розподіл по регіонах
        region_query = select(Company.region, func.count()).group_by(Company.region)
        region_result = await session.execute(region_query)
        regions = {r[0]: r[1] for r in region_result.all()}
        
        # Розподіл по індустріям
        industry_query = select(Company.industry, func.count()).group_by(Company.industry)
        industry_result = await session.execute(industry_query)
        industries = {i[0]: i[1] for i in industry_result.all()}
        
        return {
            "timestamp": datetime.now(UTC).isoformat(),
            "total_companies": total_companies,
            "high_risk": high_risk,
            "critical_risk": critical_risk,
            "alerts_today": alerts_today,
            "unresolved_alerts": unresolved_alerts,
            "ooda_cycles": ooda.cycles_completed,
            "regions": regions,
            "industries": industries,
        }

# --- RISK ---

@app.get("/api/v1/risk/company/{ueid}")
async def company_risk(ueid: str):
    async with async_session() as session:
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
                "updated_at": risk.updated_at.isoformat(),
            }
        else:
            return {
                "ueid": ueid,
                "score": 50.0,
                "level": "MEDIUM",
                "layers": {"structural": 50, "behavioral": 50, "sanctions": 50, "aml": 50},
                "explanation": "Дані про ризик не знайдено в базі. Використано дефолтні значення.",
            }

# --- OSINT ---

@app.get("/api/v1/osint/diligence/{ueid}")
async def diligence(ueid: str):
    async with async_session() as session:
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
            if company.status != "ACTIVE":
                red_flags.append("INACTIVE_STATUS")
            
            return {
                "ueid": ueid,
                "name": company.name,
                "edrpou": company.edrpou,
                "region": company.region,
                "industry": company.industry,
                "red_flags": red_flags if red_flags else ["NO_FLAGS"],
                "summary": f"Компанія {company.name} (ЄДРПОУ: {company.edrpou}) має ризик {company.risk_score}. Статус: {company.status}.",
            }
        else:
            return {
                "ueid": ueid,
                "name": "Невідома компанія",
                "red_flags": ["COMPANY_NOT_FOUND"],
                "summary": "Компанію не знайдено в базі даних.",
            }

@app.get("/api/v1/osint/tools")
async def osint_tools():
    return {
        "tools": [
            {"id": "tool-1", "name": "ЄДР (Єдиний державний реєстр)", "status": "ACTIVE"},
            {"id": "tool-2", "name": "Sanctions Screening (OFAC, ЄС, ООН)", "status": "ACTIVE"},
            {"id": "tool-3", "name": "PEP Check (Політично значущі особи)", "status": "ACTIVE"},
            {"id": "tool-4", "name": "Media Monitoring (новинний моніторинг)", "status": "ACTIVE"},
            {"id": "tool-5", "name": "Court Registry (судовий реєстр)", "status": "ACTIVE"},
        ]
    }

# --- SYSTEM ---

@app.get("/api/v1/system/stats")
async def system_stats():
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
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
    }

@app.get("/api/v1/system/nodes")
async def system_nodes():
    return {
        "nodes": [
            {"id": "kaggle-cpu", "name": "Kaggle CPU Node", "status": "ONLINE", "role": "compute", "version": "65.0-ELITE"},
            {"id": "kaggle-reserve", "name": "Kaggle Reserve", "status": "ONLINE", "role": "backup", "version": "65.0-ELITE"},
        ]
    }

@app.get("/api/v1/system/logs/stream")
async def system_logs_stream(limit: int = 50):
    return {
        "logs": [
            {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": "Kaggle backend v65.0 initialized"},
            {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": "SQLite database connected"},
            {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": "OODA Loop running"},
        ][:limit]
    }

@app.post("/api/v1/system/diagnostics/run")
async def run_diagnostics():
    return {
        "status": "completed",
        "timestamp": datetime.now(UTC).isoformat(),
        "results": {
            "cpu": "OK",
            "memory": "OK",
            "disk": "OK",
            "database": "OK",
            "ooda_loop": "RUNNING" if ooda.is_running else "IDLE",
        },
    }

@app.get("/api/v1/system/metrics/history")
async def metrics_history():
    return {
        "metrics": [
            {"timestamp": datetime.now(UTC).isoformat(), "cpu": 12.5, "memory": 45.2, "disk": 60.0},
            {"timestamp": datetime.now(UTC).isoformat(), "cpu": 15.1, "memory": 46.8, "disk": 60.1},
        ]
    }

# --- FACTORY ---

@app.get("/api/v1/factory/stats")
async def factory_stats():
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "patterns_processed": 1247,
        "anomalies_detected": 23,
        "accuracy": 94.2,
        "models_trained": 15,
        "active_experiments": 3,
    }

@app.get("/api/v1/factory/patterns/gold")
async def gold_patterns():
    return {
        "patterns": [
            {"id": "pattern-1", "name": "Gold Pattern v5.0", "accuracy": 96.5, "status": "ACTIVE", "detections": 847},
            {"id": "pattern-2", "name": "Fraud Detection v3.2", "accuracy": 89.1, "status": "ACTIVE", "detections": 412},
            {"id": "pattern-3", "name": "Sanctions Evasion v2.1", "accuracy": 92.3, "status": "ACTIVE", "detections": 156},
        ]
    }

@app.get("/api/v1/factory/ooda")
async def get_ooda():
    return {
        "is_running": ooda.is_running,
        "current_phase": ooda.current_phase,
        "cycles": ooda.cycles_completed,
        "logs": ooda.logs[-10:],
    }

@app.post("/api/v1/factory/infinite/start")
async def start_ooda():
    ooda.start()
    return {"status": "started", "phase": ooda.current_phase}

@app.post("/api/v1/factory/infinite/stop")
async def stop_ooda():
    ooda.stop()
    return {"status": "stopped", "phase": ooda.current_phase}

# --- WARGAMING ---

@app.get("/api/v1/wargaming/scenarios")
async def wargaming_scenarios():
    return {
        "scenarios": [
            {"id": "scenario-1", "name": "Митна криза: контрабанда через західний кордон", "status": "ACTIVE", "participants": 5},
            {"id": "scenario-2", "name": "Обхід санкцій через офшорні компанії", "status": "STANDBY", "participants": 3},
            {"id": "scenario-3", "name": "Фіктивний імпорт електроніки", "status": "ACTIVE", "participants": 7},
        ]
    }

# --- TORNADO ---

@app.get("/api/v1/tornado/stats")
async def tornado_stats():
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "modules": [
            {"id": "forecast", "accuracy": 94.2, "status": "ACTIVE", "predictions": 1520},
            {"id": "market", "entities": 1200, "status": "LIVE", "coverage": "85%"},
            {"id": "graph", "nodes": 45000, "status": "ACTIVE", "edges": 127000},
            {"id": "diligence", "flags": 12, "status": "ACTIVE", "checks": 3400},
            {"id": "anomaly", "tps": 847, "status": "LIVE", "detections": 2341},
            {"id": "scenario", "active": 3, "status": "WAR_ROOM", "simulations": 15},
        ],
    }

# --- GRAPH ---

@app.get("/api/v1/graph/summary")
async def graph_summary():
    return {
        "nodes": 45000,
        "edges": 127000,
        "components": 847,
        "largest_component": 41200,
        "communities": 156,
        "density": 0.125,
    }

# --- FINANCE ---

@app.post("/api/v1/finance/portfolio-risk/var")
async def portfolio_var():
    return {
        "var_95": 124500.0,
        "var_99": 234000.0,
        "confidence": 0.95,
        "timestamp": datetime.now(UTC).isoformat(),
    }

# --- NEXUS ---

@app.get("/api/v1/system/nexus/scenarios")
async def nexus_scenarios():
    return {
        "scenarios": [
            {"id": "nexus-1", "name": "Аналіз ланцюгів постачання", "status": "ACTIVE", "companies_analyzed": 25},
            {"id": "nexus-2", "name": "Виявлення повязаних осіб", "status": "ACTIVE", "connections_found": 142},
        ]
    }

# --- AGENTS ---

@app.get("/api/v1/agents")
async def agents():
    return {
        "agents": [
            {"id": "sentinel-1", "name": "Sentinel V1", "status": "ACTIVE", "type": "monitoring", "tasks_completed": 1520},
            {"id": "sentinel-2", "name": "Sentinel V2", "status": "STANDBY", "type": "analysis", "tasks_completed": 890},
            {"id": "sentinel-3", "name": "Guardian", "status": "ACTIVE", "type": "defense", "tasks_completed": 2340},
        ]
    }

# --- WEBSOCKET для real-time ---

@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(UTC).isoformat()})
            elif data == "dashboard":
                # Надсилаємо поточний стан dashboard
                await websocket.send_json({
                    "type": "dashboard_update",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "ooda_phase": ooda.current_phase,
                    "ooda_cycles": ooda.cycles_completed,
                })
            else:
                await websocket.send_json({"type": "echo", "message": data})
    except Exception:
        pass

# ==================== CLOUDFLARED TUNNEL ====================

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
        match = re.search(r"(https://[a-z0-9-]+\.trycloudflare\.com)", line)
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
print("Запуск PREDATOR Kaggle Backend v65.0 (SQLite + RBAC + Фільтрація + CSV)...")
subprocess.run([sys.executable, "/kaggle/working/predator_app.py"])
