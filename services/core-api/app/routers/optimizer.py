"""DSPy Optimizer Router — Автоматична оптимізація промптів.

Endpoints:
- /templates — Управління шаблонами промптів
- /optimize — Оптимізація промптів
- /evaluate — Оцінка якості
- /compare — Порівняння версій
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_tenant_id
from app.services.dspy_optimizer import (
    DSPyOptimizerService,
    MetricType,
    OptimizationConfig,
    OptimizerType,
)

router = APIRouter(prefix="/optimizer", tags=["DSPy оптимізація промптів"])


# ======================== REQUEST MODELS ========================


class CreateTemplateRequest(BaseModel):
    """Запит на створення шаблону."""

    name: str = Field(..., min_length=1, description="Назва шаблону")
    template: str = Field(..., min_length=1, description="Текст промпта")
    description: str | None = Field(None, description="Опис шаблону")
    variables: list[str] = Field(default_factory=list, description="Змінні в шаблоні")


class AddExampleRequest(BaseModel):
    """Запит на додавання прикладу."""

    input: dict = Field(..., description="Вхідні дані")
    output: dict = Field(..., description="Очікуваний результат")
    metadata: dict = Field(default_factory=dict, description="Метадані")


class OptimizeRequest(BaseModel):
    """Запит на оптимізацію."""

    template_id: str = Field(..., description="ID шаблону")
    optimizer_type: str = Field(default="bootstrap_few_shot", description="Тип оптимізатора")
    metric_type: str = Field(default="accuracy", description="Метрика якості")
    num_trials: int = Field(default=10, ge=1, le=100, description="Кількість спроб")
    max_bootstrapped_demos: int = Field(default=4, ge=1, le=10, description="Макс. few-shot прикладів")
    temperature: float = Field(default=0.7, ge=0, le=2, description="Temperature для LLM")
    model: str = Field(default="gpt-4", description="Модель LLM")


class EvaluateRequest(BaseModel):
    """Запит на оцінку."""

    template_id: str = Field(..., description="ID шаблону")
    test_examples: list[dict] = Field(..., description="Тестові приклади")
    metric_type: str = Field(default="accuracy", description="Метрика")


# ======================== TEMPLATES ========================


@router.post("/templates", summary="Створити шаблон промпта")
async def create_template(
    request: CreateTemplateRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Створити новий шаблон промпта для оптимізації."""
    service = DSPyOptimizerService()

    template = await service.create_template(
        name=request.name,
        template=request.template,
        description=request.description,
        variables=request.variables,
    )

    return {
        "id": template.id,
        "name": template.name,
        "template": template.template,
        "description": template.description,
        "variables": template.variables,
        "created_at": template.created_at.isoformat(),
    }


@router.get("/templates", summary="Список шаблонів")
async def list_templates(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати список всіх шаблонів промптів."""
    service = DSPyOptimizerService()
    templates = await service.list_templates()

    return {
        "total": len(templates),
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "variables": t.variables,
                "examples_count": len(t.examples),
                "is_optimized": t.optimized_version is not None,
                "score": t.score,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat(),
            }
            for t in templates
        ],
    }


@router.get("/templates/{template_id}", summary="Деталі шаблону")
async def get_template(
    template_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати детальну інформацію про шаблон."""
    service = DSPyOptimizerService()
    template = await service.get_template(template_id)

    if not template:
        raise HTTPException(status_code=404, detail=f"Шаблон {template_id} не знайдено")

    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "template": template.template,
        "optimized_template": template.optimized_version,
        "variables": template.variables,
        "examples": [
            {
                "input": ex.input,
                "output": ex.output,
                "metadata": ex.metadata,
            }
            for ex in template.examples
        ],
        "score": template.score,
        "created_at": template.created_at.isoformat(),
        "updated_at": template.updated_at.isoformat(),
    }


@router.post("/templates/{template_id}/examples", summary="Додати приклад")
async def add_example(
    template_id: str,
    request: AddExampleRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Додати приклад для навчання до шаблону."""
    service = DSPyOptimizerService()

    success = await service.add_example(
        template_id=template_id,
        input_data=request.input,
        output_data=request.output,
        metadata=request.metadata,
    )

    if not success:
        raise HTTPException(status_code=404, detail=f"Шаблон {template_id} не знайдено")

    return {
        "template_id": template_id,
        "status": "example_added",
    }


@router.get("/templates/{template_id}/export", summary="Експортувати шаблон")
async def export_template(
    template_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Експортувати шаблон у форматі DSPy."""
    service = DSPyOptimizerService()

    try:
        data = await service.export_template(template_id)
        return data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/templates/import", summary="Імпортувати шаблон")
async def import_template(
    data: dict,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Імпортувати шаблон з DSPy формату."""
    service = DSPyOptimizerService()

    template = await service.import_template(data)

    return {
        "id": template.id,
        "name": template.name,
        "status": "imported",
    }


# ======================== OPTIMIZATION ========================


@router.post("/optimize", summary="Оптимізувати промпт")
async def optimize_prompt(
    request: OptimizeRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Автоматично оптимізувати промпт за допомогою DSPy.

    Підтримувані оптимізатори:
    - `bootstrap_few_shot` — Few-shot learning з автоматичним підбором прикладів
    - `mipro` — Multi-stage Instruction Proposal and Refinement Optimizer
    - `copro` — Coordinate Ascent Prompt Optimization
    - `random_search` — Випадковий пошук
    """
    service = DSPyOptimizerService()

    config = OptimizationConfig(
        optimizer_type=OptimizerType(request.optimizer_type),
        metric_type=MetricType(request.metric_type),
        num_trials=request.num_trials,
        max_bootstrapped_demos=request.max_bootstrapped_demos,
        temperature=request.temperature,
        model=request.model,
    )

    try:
        result = await service.optimize_prompt(request.template_id, config)

        return {
            "template_id": request.template_id,
            "optimized_prompt": result.optimized_prompt,
            "score": result.score,
            "metric": result.metric,
            "num_trials": result.num_trials,
            "best_trial": result.best_trial,
            "training_examples": result.training_examples,
            "validation_score": result.validation_score,
            "metadata": result.metadata,
            "created_at": result.created_at.isoformat(),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/evaluate", summary="Оцінити якість промпта")
async def evaluate_prompt(
    request: EvaluateRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Оцінити якість промпта на тестових прикладах."""
    service = DSPyOptimizerService()

    # Конвертуємо dict у Example
    from app.services.dspy_optimizer import Example
    test_examples = [
        Example(input=ex["input"], output=ex["output"])
        for ex in request.test_examples
    ]

    try:
        metrics = await service.evaluate_prompt(
            template_id=request.template_id,
            test_examples=test_examples,
            metric_type=MetricType(request.metric_type),
        )

        return metrics
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/templates/{template_id}/compare", summary="Порівняти версії")
async def compare_prompts(
    template_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Порівняти оригінальний та оптимізований промпт."""
    service = DSPyOptimizerService()

    # Mock тестові приклади
    from app.services.dspy_optimizer import Example
    test_examples = [Example(input={}, output={})]

    try:
        comparison = await service.compare_prompts(template_id, test_examples)
        return comparison
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


# ======================== HISTORY & METRICS ========================


@router.get("/history", summary="Історія оптимізацій")
async def get_optimization_history(
    template_id: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати історію оптимізацій."""
    service = DSPyOptimizerService()

    history = await service.get_optimization_history(template_id, limit)

    return {
        "total": len(history),
        "history": [
            {
                "score": h.score,
                "metric": h.metric,
                "num_trials": h.num_trials,
                "best_trial": h.best_trial,
                "training_examples": h.training_examples,
                "validation_score": h.validation_score,
                "metadata": h.metadata,
                "created_at": h.created_at.isoformat(),
            }
            for h in history
        ],
    }


@router.get("/metrics", summary="Метрики оптимізації")
async def get_metrics_summary(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати зведення метрик оптимізації."""
    service = DSPyOptimizerService()

    metrics = await service.get_metrics_summary()
    return metrics


# ======================== QUICK START ========================


@router.get("/quick-start", summary="Швидкий старт")
async def quick_start(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати приклади для швидкого старту з DSPy."""
    return {
        "examples": [
            {
                "name": "Аналіз ризиків компанії",
                "template_id": "company_risk_analysis",
                "description": "Автоматична оцінка ризиків на основі даних з реєстрів",
                "use_case": "AML, Due Diligence",
            },
            {
                "name": "Виявлення аномалій",
                "template_id": "anomaly_detection",
                "description": "Виявлення підозрілих транзакцій",
                "use_case": "Fraud Detection",
            },
            {
                "name": "Генерація звітів",
                "template_id": "report_generation",
                "description": "Автоматична генерація експертних висновків",
                "use_case": "Reporting",
            },
        ],
        "optimizers": [
            {
                "type": "bootstrap_few_shot",
                "name": "Bootstrap Few-Shot",
                "description": "Автоматичний підбір найкращих прикладів",
                "recommended_for": "Класифікація, Q&A",
            },
            {
                "type": "mipro",
                "name": "MIPRO",
                "description": "Багатоетапна оптимізація інструкцій",
                "recommended_for": "Складні reasoning задачі",
            },
            {
                "type": "copro",
                "name": "COPRO",
                "description": "Координатний підйом для промптів",
                "recommended_for": "Генерація тексту",
            },
        ],
        "metrics": [
            {
                "type": "accuracy",
                "name": "Accuracy",
                "description": "Точність класифікації",
            },
            {
                "type": "f1_score",
                "name": "F1 Score",
                "description": "Гармонійне середнє precision і recall",
            },
            {
                "type": "exact_match",
                "name": "Exact Match",
                "description": "Точний збіг з очікуваним результатом",
            },
            {
                "type": "semantic_similarity",
                "name": "Semantic Similarity",
                "description": "Семантична схожість (embedding-based)",
            },
        ],
    }
