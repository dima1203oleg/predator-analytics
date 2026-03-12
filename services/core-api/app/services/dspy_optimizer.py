"""DSPy Optimizer Service — Автоматична оптимізація промптів.

Використовує DSPy для:
- Автоматичної оптимізації промптів
- Few-shot learning
- Chain-of-thought reasoning
- Метрики якості
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
import logging
from typing import Any

logger = logging.getLogger(__name__)


class OptimizerType(StrEnum):
    """Типи оптимізаторів."""

    BOOTSTRAP_FEW_SHOT = "bootstrap_few_shot"
    MIPRO = "mipro"
    COPRO = "copro"
    RANDOM_SEARCH = "random_search"


class MetricType(StrEnum):
    """Типи метрик."""

    ACCURACY = "accuracy"
    F1_SCORE = "f1_score"
    EXACT_MATCH = "exact_match"
    SEMANTIC_SIMILARITY = "semantic_similarity"
    CUSTOM = "custom"


@dataclass
class Example:
    """Приклад для навчання."""

    input: dict[str, Any]
    output: dict[str, Any]
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class OptimizationConfig:
    """Конфігурація оптимізації."""

    optimizer_type: OptimizerType
    metric_type: MetricType
    num_trials: int = 10
    max_bootstrapped_demos: int = 4
    max_labeled_demos: int = 16
    temperature: float = 0.7
    model: str = "gpt-4"
    validation_split: float = 0.2


@dataclass
class OptimizationResult:
    """Результат оптимізації."""

    optimized_prompt: str
    score: float
    metric: str
    num_trials: int
    best_trial: int
    training_examples: int
    validation_score: float
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class PromptTemplate:
    """Шаблон промпта."""

    id: str
    name: str
    template: str
    description: str | None = None
    variables: list[str] = field(default_factory=list)
    examples: list[Example] = field(default_factory=list)
    optimized_version: str | None = None
    score: float | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class DSPyOptimizerService:
    """Сервіс для оптимізації промптів з DSPy."""

    def __init__(self) -> None:
        self.templates: dict[str, PromptTemplate] = {}
        self.optimization_history: list[OptimizationResult] = []

        # Mock шаблони для демонстрації
        self._init_default_templates()

    def _init_default_templates(self) -> None:
        """Ініціалізація шаблонів за замовчуванням."""
        # Шаблон для аналізу ризиків компанії
        self.templates["company_risk_analysis"] = PromptTemplate(
            id="company_risk_analysis",
            name="Аналіз ризиків компанії",
            template="""Проаналізуй ризики компанії {company_name} (ЄДРПОУ: {edrpou}).

Дані:
- Статус: {status}
- Податкові борги: {tax_debt} грн
- Судові справи: {court_cases}
- Санкції: {sanctions}

Надай оцінку ризику (низький/середній/високий) та обґрунтування.""",
            description="Аналіз ризиків компанії на основі даних з реєстрів",
            variables=["company_name", "edrpou", "status", "tax_debt", "court_cases", "sanctions"],
            examples=[
                Example(
                    input={
                        "company_name": "ТОВ \"ТЕСТ\"",
                        "edrpou": "12345678",
                        "status": "active",
                        "tax_debt": "0",
                        "court_cases": "0",
                        "sanctions": "немає",
                    },
                    output={
                        "risk_level": "низький",
                        "reasoning": "Компанія активна, без боргів, судових справ та санкцій.",
                    },
                ),
            ],
        )

        # Шаблон для виявлення аномалій
        self.templates["anomaly_detection"] = PromptTemplate(
            id="anomaly_detection",
            name="Виявлення аномалій у транзакціях",
            template="""Проаналізуй транзакцію на предмет аномалій:

Сума: {amount} {currency}
Контрагент: {counterparty}
Країна: {country}
Товар: {product}
Середня ціна на ринку: {market_price} {currency}

Чи є ознаки аномалії? Поясни.""",
            description="Виявлення підозрілих транзакцій",
            variables=["amount", "currency", "counterparty", "country", "product", "market_price"],
        )

        # Шаблон для генерації звіту
        self.templates["report_generation"] = PromptTemplate(
            id="report_generation",
            name="Генерація експертного висновку",
            template="""Згенеруй експертний висновок для компанії {company_name}.

Дані:
{data}

Висновок має містити:
1. Резюме
2. Виявлені ризики
3. Рекомендації
4. Оцінка надійності (1-100)""",
            description="Генерація структурованого експертного висновку",
            variables=["company_name", "data"],
        )

    async def create_template(
        self,
        name: str,
        template: str,
        description: str | None = None,
        variables: list[str] | None = None,
    ) -> PromptTemplate:
        """Створити новий шаблон промпта."""
        template_id = name.lower().replace(" ", "_")

        prompt_template = PromptTemplate(
            id=template_id,
            name=name,
            template=template,
            description=description,
            variables=variables or [],
        )

        self.templates[template_id] = prompt_template
        return prompt_template

    async def get_template(self, template_id: str) -> PromptTemplate | None:
        """Отримати шаблон за ID."""
        return self.templates.get(template_id)

    async def list_templates(self) -> list[PromptTemplate]:
        """Отримати список всіх шаблонів."""
        return list(self.templates.values())

    async def add_example(
        self,
        template_id: str,
        input_data: dict[str, Any],
        output_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> bool:
        """Додати приклад до шаблону."""
        template = self.templates.get(template_id)
        if not template:
            return False

        example = Example(
            input=input_data,
            output=output_data,
            metadata=metadata or {},
        )

        template.examples.append(example)
        template.updated_at = datetime.now(UTC)
        return True

    async def optimize_prompt(
        self,
        template_id: str,
        config: OptimizationConfig,
    ) -> OptimizationResult:
        """Оптимізувати промпт за допомогою DSPy.

        В реальності тут буде інтеграція з DSPy.
        Поки що повертаємо mock результат.
        """
        template = self.templates.get(template_id)
        if not template:
            raise ValueError(f"Шаблон {template_id} не знайдено")

        # Mock оптимізація
        # В реальності тут буде:
        # 1. Завантаження прикладів
        # 2. Розділення на train/validation
        # 3. Запуск оптимізатора (BootstrapFewShot, MIPRO, etc.)
        # 4. Оцінка на validation set

        optimized_prompt = f"""[ОПТИМІЗОВАНО]
{template.template}

[FEW-SHOT EXAMPLES]
{self._format_examples(template.examples[:config.max_bootstrapped_demos])}

[CHAIN-OF-THOUGHT]
Крок 1: Проаналізуй вхідні дані
Крок 2: Визнач ключові фактори ризику
Крок 3: Оціни кожен фактор
Крок 4: Сформулюй загальний висновок"""

        # Mock метрики
        score = 0.85 + (len(template.examples) * 0.02)  # Більше прикладів = вища точність
        validation_score = score - 0.05

        result = OptimizationResult(
            optimized_prompt=optimized_prompt,
            score=score,
            metric=config.metric_type.value,
            num_trials=config.num_trials,
            best_trial=config.num_trials - 2,
            training_examples=len(template.examples),
            validation_score=validation_score,
            metadata={
                "optimizer": config.optimizer_type.value,
                "model": config.model,
                "temperature": config.temperature,
            },
        )

        # Зберігаємо оптимізовану версію
        template.optimized_version = optimized_prompt
        template.score = score
        template.updated_at = datetime.now(UTC)

        # Зберігаємо в історію
        self.optimization_history.append(result)

        return result

    def _format_examples(self, examples: list[Example]) -> str:
        """Форматувати приклади для промпта."""
        formatted = []
        for i, ex in enumerate(examples, 1):
            formatted.append(f"Приклад {i}:")
            formatted.append(f"Вхід: {ex.input}")
            formatted.append(f"Вихід: {ex.output}")
            formatted.append("")
        return "\n".join(formatted)

    async def evaluate_prompt(
        self,
        template_id: str,
        test_examples: list[Example],
        metric_type: MetricType = MetricType.ACCURACY,
    ) -> dict[str, Any]:
        """Оцінити якість промпта на тестових прикладах."""
        template = self.templates.get(template_id)
        if not template:
            raise ValueError(f"Шаблон {template_id} не знайдено")

        # Mock оцінка
        # В реальності тут буде:
        # 1. Запуск промпта на кожному прикладі
        # 2. Порівняння з очікуваним результатом
        # 3. Розрахунок метрик

        total = len(test_examples)
        correct = int(total * 0.82)  # Mock 82% accuracy

        metrics = {
            "accuracy": correct / total if total > 0 else 0,
            "total_examples": total,
            "correct_predictions": correct,
            "metric_type": metric_type.value,
            "evaluated_at": datetime.now(UTC).isoformat(),
        }

        if metric_type == MetricType.F1_SCORE:
            metrics["f1_score"] = 0.80
            metrics["precision"] = 0.85
            metrics["recall"] = 0.76

        return metrics

    async def get_optimization_history(
        self,
        template_id: str | None = None,
        limit: int = 50,
    ) -> list[OptimizationResult]:
        """Отримати історію оптимізацій."""
        history = self.optimization_history

        if template_id:
            # Фільтруємо за template_id (в metadata)
            history = [
                h for h in history
                if h.metadata.get("template_id") == template_id
            ]

        return history[-limit:]

    async def compare_prompts(
        self,
        template_id: str,
        test_examples: list[Example],
    ) -> dict[str, Any]:
        """Порівняти оригінальний та оптимізований промпт."""
        template = self.templates.get(template_id)
        if not template:
            raise ValueError(f"Шаблон {template_id} не знайдено")

        # Mock порівняння
        original_score = 0.65
        optimized_score = template.score or 0.85

        return {
            "template_id": template_id,
            "original": {
                "prompt": template.template,
                "score": original_score,
            },
            "optimized": {
                "prompt": template.optimized_version,
                "score": optimized_score,
            },
            "improvement": {
                "absolute": optimized_score - original_score,
                "relative": ((optimized_score - original_score) / original_score) * 100,
            },
            "test_examples": len(test_examples),
            "compared_at": datetime.now(UTC).isoformat(),
        }

    async def export_template(self, template_id: str) -> dict[str, Any]:
        """Експортувати шаблон у форматі DSPy."""
        template = self.templates.get(template_id)
        if not template:
            raise ValueError(f"Шаблон {template_id} не знайдено")

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

    async def import_template(self, data: dict[str, Any]) -> PromptTemplate:
        """Імпортувати шаблон з DSPy формату."""
        template = PromptTemplate(
            id=data["id"],
            name=data["name"],
            template=data["template"],
            description=data.get("description"),
            variables=data.get("variables", []),
            optimized_version=data.get("optimized_template"),
            score=data.get("score"),
        )

        # Імпортуємо приклади
        for ex_data in data.get("examples", []):
            example = Example(
                input=ex_data["input"],
                output=ex_data["output"],
                metadata=ex_data.get("metadata", {}),
            )
            template.examples.append(example)

        self.templates[template.id] = template
        return template

    async def get_metrics_summary(self) -> dict[str, Any]:
        """Отримати зведення метрик оптимізації."""
        if not self.optimization_history:
            return {
                "total_optimizations": 0,
                "average_score": 0,
                "best_score": 0,
                "total_templates": len(self.templates),
            }

        scores = [h.score for h in self.optimization_history]

        return {
            "total_optimizations": len(self.optimization_history),
            "average_score": sum(scores) / len(scores),
            "best_score": max(scores),
            "worst_score": min(scores),
            "total_templates": len(self.templates),
            "optimized_templates": sum(1 for t in self.templates.values() if t.optimized_version),
            "total_examples": sum(len(t.examples) for t in self.templates.values()),
        }
