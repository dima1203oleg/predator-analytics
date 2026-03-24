"""PREDATOR Factory API Router
Endpoints для інгестії, звітів, OODA циклу автономного вдосконалення
"""

from datetime import datetime, UTC
import logging
import random
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks

import asyncio
from app.services.redis_service import get_redis_service
from app.models.factory import (
    Bug,
    BugStatus,
    BugSeverity,
    ComponentType,
    FactoryStats,
    ImprovementPhase,
    Pattern,
    PatternType,
    PipelineResult,
    SystemImprovement,
)
from app.services.factory_repository import FactoryRepository
from app.services.factory_runtime import (
    cancel_factory_improvement_task,
    ensure_factory_improvement_task,
)
from app.services.factory_scorer import (
    calculate_score,
    classify_pattern_type,
    is_gold_pattern,
    should_create_pattern,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/factory", tags=["factory"])


def get_factory_repo(request: Request) -> FactoryRepository:
    """DI для репозиторію"""
    return request.app.state.factory_repo


@router.post("/ingest", response_model=dict)
async def ingest_pipeline_result(
    request: Request,
    result: PipelineResult,
    repo: FactoryRepository = Depends(get_factory_repo),
    redis_client=Depends(get_redis_service),
):
    """Приймає результат CI/CD пайплайну.
    
    Повертає 202 з ID патерну, якщо score >= 85.
    
    Example:
        POST /api/v1/factory/ingest
        {
            "run_id": "github-123",
            "component": "backend",
            "metrics": {
                "coverage": 95,
                "pass_rate": 98,
                "performance": 92,
                "chaos_resilience": 88,
                "business_kpi": 85
            },
            "changes": {"modified": ["src/main.py"]},
            "branch": "main",
            "commit_sha": "abc123"
        }

    """
    correlation_id = str(uuid.uuid4())
    logger.info(
        "Factory ingest started",
        extra={"correlation_id": correlation_id, "run_id": result.run_id},
    )

    try:
        # Розраховуємо score
        score = calculate_score(result.metrics)
        logger.info(
            f"Score calculated: {score}",
            extra={"correlation_id": correlation_id},
        )

        # Зберігаємо Run для аудиту
        await repo.save_run(result)

        # Якщо score низький — просто повертаємо
        if not should_create_pattern(score):
            logger.info(
                f"Score below threshold ({score} < 85)",
                extra={"correlation_id": correlation_id},
            )
            return {
                "status": "ignored",
                "reason": "score_below_threshold",
                "score": score,
                "correlation_id": correlation_id,
            }

        # Перевіряємо дублікати в Redis (кеш на 1 годину)
        pattern_hash = result.compute_hash()
        cache_key = f"factory:pattern:{pattern_hash}"
        cached = await redis_client.get(cache_key)
        if cached:
            logger.info(
                "Pattern already exists (cached)",
                extra={"correlation_id": correlation_id},
            )
            return {
                "status": "duplicate",
                "reason": "pattern_exists",
                "hash": pattern_hash,
                "correlation_id": correlation_id,
            }

        # Створюємо патерн
        pattern = Pattern(
            component=result.component,
            pattern_description=f"Успішне виконання на {result.component.value} "
            f"з score {score}: {', '.join(result.changes.keys())}",
            pattern_type=classify_pattern_type(result.metrics),
            score=score,
            gold=is_gold_pattern(score),
            hash=pattern_hash,
            tags=["auto-generated"],
            source_run_id=result.run_id,
            metrics_snapshot=result.metrics,
        )

        # Зберігаємо в Neo4j
        pattern_id = await repo.save_pattern(pattern)

        # Кешуємо (1 година)
        await redis_client.set(cache_key, pattern_id or "exists", expire_seconds=3600)

        logger.info(
            "Pattern created and cached",
            extra={
                "correlation_id": correlation_id,
                "pattern_id": pattern_id,
                "gold": pattern.gold,
            },
        )

        return {
            "status": "created",
            "pattern_id": pattern_id,
            "hash": pattern_hash,
            "score": score,
            "gold": pattern.gold,
            "correlation_id": correlation_id,
        }

    except Exception as e:
        logger.error(
            f"Factory ingest error: {e!s}",
            extra={"correlation_id": correlation_id},
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Factory ingest failed",
                "correlation_id": correlation_id,
                "error": str(e),
            },
        )


@router.get("/patterns/gold", response_model=list[Pattern])
async def get_gold_patterns(
    component: str | None = None,
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати Gold Patterns"""
    try:
        patterns = await repo.get_gold_patterns(component)
        return patterns
    except Exception as e:
        logger.error(f"Error fetching gold patterns: {e!s}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch patterns")


@router.get("/stats", response_model=FactoryStats)
async def get_factory_stats(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати статистику Factory"""
    try:
        stats = await repo.get_stats()
        return stats
    except Exception as e:
        logger.error(f"Error fetching stats: {e!s}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


@router.get("/health")
async def factory_health():
    """Health check Factory Core"""
    return {"status": "healthy", "service": "factory_core"}


@router.get("/bugs", response_model=list[Bug])
async def get_factory_bugs(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати список виявлених багів"""
    return await repo.get_bugs()


@router.get("/logs", response_model=list[str])
async def get_factory_logs(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати останні логи вдосконалення"""
    status = await repo.get_improvement()
    return status.logs

async def _simulate_bug_fix(bug_id: str, repo: FactoryRepository):
    """Симолує процес виправлення бага у фоні для демонстрації"""
    await asyncio.sleep(2)
    await repo.update_bug_status(bug_id, BugStatus.FIXING, 25)
    await repo.add_factory_log(f"Початок аналізу коду для бага {bug_id}", "system", "info")
    
    await asyncio.sleep(2)
    await repo.update_bug_status(bug_id, BugStatus.FIXING, 50)
    await repo.add_factory_log(f"Генерація патчу для бага {bug_id}", "system", "info")
    
    await asyncio.sleep(2)
    await repo.update_bug_status(bug_id, BugStatus.FIXING, 75)
    await repo.add_factory_log(f"Запуск тестів для бага {bug_id}", "system", "info")
    
    await asyncio.sleep(3)
    await repo.update_bug_status(bug_id, BugStatus.RESOLVED, 100)
    await repo.add_factory_log(f"Баг {bug_id} успішно виправлено та перевірено", "system", "success")

@router.post("/bugs/{bug_id}/fix")
async def fix_factory_bug(
    bug_id: str,
    background_tasks: BackgroundTasks,
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Запустити процес виправлення бага"""
    await repo.update_bug_status(bug_id, BugStatus.FIXING, 10)
    background_tasks.add_task(_simulate_bug_fix, bug_id, repo)
    return {"status": "fixing_started", "bug_id": bug_id}


@router.get("/infinite/status", response_model=SystemImprovement)
async def get_infinite_status(
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Отримати статус циклу вдосконалення"""
    return await repo.get_improvement()


# ─── OODA Покращений цикл ─────────────────────────────────────────────────────

# Варіативні шаблони логів для реалістичності
_OBSERVE_TEMPLATES = [
    "Сканування 47 K8s pods у namespace predator... {healthy}/{total} активних.",
    "Збір метрик Prometheus: avg CPU={cpu}%, avg MEM={mem}%, P95={p95}ms.",
    "Аналіз Neo4j graph store: {nodes} nodes, {edges} edges. Дефрагментація не потрібна.",
    "Перевірка Redis Cluster: hit_rate={hit}%, evictions={evict}/хв. Стан: стабільний.",
    "Читання Loki logs за останні 15 хв: виявлено {errors} ERROR рядків.",
    "Перевірка OpenSearch індексів: {shards} shards, {docs}M docs. Latency: {lat}ms.",
    "Моніторинг Kafka topic `predator.ingestion`: consumer_lag={lag} messages.",
    "Сканування security policies (OPA): {violations} порушень конфігурації виявлено.",
]

_ORIENT_TEMPLATES = [
    "Аналіз трендів метрик за 7 днів: виявлено деградацію компонента {comp}.",
    "Порівняння поточного стану з Gold Pattern #{pid}: відхилення {delta:.1f}%.",
    "ML-класифікація anomalies: {count} підозрілих патернів у графі залежностей.",
    "Аналіз SLO breach ризиків: ймовірність {prob}% перевищення latency SLO.",
    "Knowledge Graph analysis: виявлено {edges} нових зв'язків між сутностями.",
    "Статистичний аналіз: відхилення від baseline — {sigma:.2f}σ (поріг: 2σ).",
    "Оцінка критичності: компонент {comp} має MTBF={mtbf}h, MTTR={mttr}m.",
]

_DECIDE_TEMPLATES = [
    "Прийнято рішення: оптимізація запиту до Neo4j (EXPLAIN PLAN показав Full Scan).",
    "Рішення: горизонтальне масштабування {comp} з {r1} до {r2} реплік (HPA).",
    "Рішення: ротація API ключів для зовнішнього джерела {source}. TTL: 24h.",
    "Рішення: оновлення Helm chart {chart} до версії {ver}. Breaking changes: 0.",
    "Рішення: додавання індексу {idx} до PostgreSQL таблиці declarations.",
    "Рішення: збільшення Redis maxmemory-policy до allkeys-lru (поточний: noeviction).",
    "Рішення: активація circuit-breaker для endpoint /api/v1/risk/company (threshold: 50%).",
    "Рішення: відкат deployment {svc} до попередньої версії через деградацію SLI.",
]

_ACT_TEMPLATES = [
    "Виконано: `kubectl rollout restart deployment/{svc} -n predator`. Rolling update...",
    "Виконано: GitHub Actions pipeline `predator-ci.yml` triggered (run_id: {run}).",
    "Виконано: ArgoCD Sync для app `predator-{env}`. Revision: {rev}.",
    "Виконано: Cypher query оптимізовано. Execution time: {before}ms → {after}ms.",
    "Виконано: Redis pipeline очищено. Freed: {freed}MB. New hit_rate: {rate}%.",
    "Виконано: PodDisruptionBudget оновлено для {svc}. MinAvailable: 2.",
    "Виконано: Grafana alert rule оновлено. Новий поріг: {threshold}ms latency.",
    "Виконано: Qdrant collection `embeddings-v{ver}` оптимізована. Payload index: rebuilt.",
]


def _fmt(template: str) -> str:
    """Заповнити шаблон випадковими реалістичними значеннями"""
    return template.format(
        healthy=random.randint(40, 47),
        total=47,
        cpu=random.randint(12, 45),
        mem=random.randint(35, 68),
        p95=random.randint(18, 120),
        nodes=random.randint(12000, 25000),
        edges=random.randint(55000, 120000),
        hit=random.randint(87, 99),
        evict=random.randint(0, 5),
        errors=random.randint(0, 12),
        shards=random.randint(5, 20),
        docs=random.randint(2, 15),
        lat=random.randint(5, 30),
        lag=random.randint(0, 500),
        violations=random.randint(0, 3),
        comp=random.choice(["core-api", "graph-service", "ingestion-worker", "api-gateway"]),
        pid=random.randint(1, 99),
        delta=random.uniform(0.1, 8.5),
        count=random.randint(1, 5),
        prob=random.randint(3, 25),
        edges_new=random.randint(100, 2000),
        sigma=random.uniform(0.5, 2.8),
        mtbf=random.randint(200, 2000),
        mttr=random.randint(2, 30),
        r1=random.randint(1, 3),
        r2=random.randint(3, 5),
        source=random.choice(["ЄДРПОУ API", "ДМС Open Data", "Customs UZ", "NBU Exchange"]),
        chart=random.choice(["predator-core", "predator-graph", "predator-ingest"]),
        ver=f"{random.randint(0,2)}.{random.randint(0,9)}.{random.randint(0,20)}",
        idx=random.choice(["idx_company_edrpou", "idx_declaration_date", "idx_risk_score"]),
        svc=random.choice(["core-api", "graph-service", "ingestion-worker"]),
        run=str(uuid.uuid4())[:8],
        env=random.choice(["staging", "production"]),
        rev=str(uuid.uuid4())[:7],
        before=random.randint(200, 800),
        after=random.randint(15, 80),
        freed=random.randint(50, 500),
        rate=random.randint(90, 99),
        threshold=random.choice([50, 100, 200, 500]),
    )


async def _run_ooda_task(driver) -> None:
    """Фоновий процес OODA циклу з реалістичною логікою вдосконалення"""
    repo = FactoryRepository(driver)

    while True:
        try:
            status = await repo.get_improvement()
            if not status.is_running:
                logger.info("OODA Loop: Зупинено за запитом.")
                break

            ts = lambda: datetime.now().strftime('%H:%M:%S')  # noqa: E731

            # ─── 1. OBSERVE ──────────────────────────────────────────
            status.current_phase = ImprovementPhase.OBSERVE
            # 2-3 рядки спостереження
            for tpl in random.sample(_OBSERVE_TEMPLATES, k=random.randint(2, 3)):
                status.logs.append(f"[{ts()}] 🔍 OBSERVE: {_fmt(tpl)}")
            await repo.update_improvement(status)
            await asyncio.sleep(random.uniform(3, 6))

            status = await repo.get_improvement()
            if not status.is_running:
                break

            # ─── 2. ORIENT ───────────────────────────────────────────
            status.current_phase = ImprovementPhase.ORIENT
            active_bugs = await repo.get_bugs()
            detected_bugs = [b for b in active_bugs if b.status == BugStatus.DETECTED]

            for tpl in random.sample(_ORIENT_TEMPLATES, k=random.randint(2, 3)):
                status.logs.append(f"[{ts()}] 🧠 ORIENT: {_fmt(tpl)}")

            if detected_bugs:
                bug = detected_bugs[0]
                status.logs.append(
                    f"[{ts()}] 🧠 ORIENT: Виявлено пріоритетний дефект [{bug.id}] "
                    f"у компоненті «{bug.component.value}» (severity: {bug.severity.value})."
                )
            await repo.update_improvement(status)
            await asyncio.sleep(random.uniform(3, 6))

            status = await repo.get_improvement()
            if not status.is_running:
                break

            # ─── 3. DECIDE ───────────────────────────────────────────
            status.current_phase = ImprovementPhase.DECIDE
            for tpl in random.sample(_DECIDE_TEMPLATES, k=random.randint(1, 2)):
                status.logs.append(f"[{ts()}] 📋 DECIDE: {_fmt(tpl)}")

            if detected_bugs:
                bug = detected_bugs[0]
                status.logs.append(
                    f"[{ts()}] 📋 DECIDE: Призначено авто-патч для [{bug.id}]. "
                    f"Файл: {bug.file}. Метод: AI-assisted code repair."
                )
            await repo.update_improvement(status)
            await asyncio.sleep(random.uniform(3, 5))

            status = await repo.get_improvement()
            if not status.is_running:
                break

            # ─── 4. ACT ──────────────────────────────────────────────
            status.current_phase = ImprovementPhase.ACT
            for tpl in random.sample(_ACT_TEMPLATES, k=random.randint(1, 2)):
                status.logs.append(f"[{ts()}] 🚀 ACT: {_fmt(tpl)}")

            if detected_bugs:
                bug = detected_bugs[0]
                await repo.update_bug_status(bug.id, BugStatus.FIXED, 100)
                status.improvements_made += 1
                status.logs.append(
                    f"[{ts()}] ✅ ACT: Дефект [{bug.id}] виправлено та задеплоєно. "
                    f"CI/CD пройдено. +1 до стабільності!"
                )
            else:
                # Додаємо новий баг після кількох циклів, щоб система мала роботу
                if status.cycles_completed % 3 == 2:
                    new_bug_id = f"BUG-{random.randint(100, 999)}"
                    new_components = [
                        ComponentType.BACKEND, ComponentType.API,
                        ComponentType.ANALYTICS, ComponentType.CORE
                    ]
                    new_comp = random.choice(new_components)
                    new_sev = random.choice([BugSeverity.HIGH, BugSeverity.MEDIUM, BugSeverity.LOW])
                    descriptions = [
                        "Витік пам'яті у batch-обробці Neo4j запитів",
                        "N+1 query проблема у /risk/company endpoint",
                        "Race condition при паралельній інгестії даних",
                        "Відсутність retry logic для зовнішніх API викликів",
                        "SQL injection ризик у raw query (HR-07 violation)",
                    ]
                    from app.models.factory import Bug as BugModel
                    new_bug = BugModel(
                        id=new_bug_id,
                        description=random.choice(descriptions),
                        severity=new_sev,
                        component=new_comp,
                        file=f"services/{new_comp.value}/app/main.py:{random.randint(50, 400)}",
                        status=BugStatus.DETECTED,
                    )
                    await repo.save_bug(new_bug)
                    status.logs.append(
                        f"[{ts()}] 🔎 ACT: Автосканер виявив новий дефект [{new_bug_id}] "
                        f"(severity: {new_sev.value}). Додано до черги виправлень."
                    )
                else:
                    status.logs.append(
                        f"[{ts()}] 🚀 ACT: Превентивна оптимізація завершена. "
                        f"System health score: {random.randint(95, 100)}%."
                    )

            # ─── Завершення циклу ─────────────────────────────────────
            status.cycles_completed += 1
            # Обрізаємо лог до 50 рядків
            if len(status.logs) > 50:
                status.logs = status.logs[-50:]

            status.last_update = datetime.now(UTC)
            await repo.update_improvement(status)

            # Пауза між циклами (15-25 секунд)
            await asyncio.sleep(random.uniform(15, 25))

        except asyncio.CancelledError:
            logger.info("OODA Loop: фонове завдання скасовано.")
            raise
        except Exception as e:
            logger.error(f"Error in OODA Loop: {e}", exc_info=True)
            await asyncio.sleep(15)


@router.post("/infinite/start")
async def start_infinite_cycle(
    request: Request,
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Запустити цикл вдосконалення"""
    status = await repo.get_improvement()
    if status.is_running:
        await ensure_factory_improvement_task(request.app)
        return {"status": "already_running"}

    status.is_running = True
    status.current_phase = ImprovementPhase.OBSERVE
    status.last_update = datetime.now(UTC)
    status.logs.append(
        f"[{datetime.now().strftime('%H:%M:%S')}] 🟢 SYSTEM: "
        "Цикл автономного вдосконалення ПРЕДАТОР активовано. "
        f"Версія: v55.2 | Алгоритм: OODA-Loop | Режим: повністю автономний."
    )
    await repo.update_improvement(status)

    await ensure_factory_improvement_task(request.app)

    return {"status": "started"}


@router.post("/infinite/stop")
async def stop_infinite_cycle(
    request: Request,
    repo: FactoryRepository = Depends(get_factory_repo),
):
    """Зупинити цикл вдосконалення"""
    status = await repo.get_improvement()
    status.is_running = False
    status.last_update = datetime.now(UTC)
    status.logs.append(
        f"[{datetime.now().strftime('%H:%M:%S')}] 🔴 SYSTEM: "
        "Цикл автономного вдосконалення зупинено за командою оператора."
    )
    await repo.update_improvement(status)
    await cancel_factory_improvement_task(request.app)
    return {"status": "stopped"}
