#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CLI для Навчання Моделей та Агентів через Triple CLI Chain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Використовує Gemini→Mistral→Aider для автоматизації:
1. Генерації навчальних пайплайнів (H2O AutoML, PyTorch, Kubeflow)
2. Створення агентів (LangGraph, LangChain)
3. Аугментації тренувальних даних
4. Налаштування MLOps інфраструктури

Приклади:
    # Навчання моделі класифікації
    python3 ml_cli.py train --task "класифікація тексту" --framework h2o

    # Створення агента
    python3 ml_cli.py agent --type "код-ревьювер" --tools "git,opensearch"

    # Аугментація даних
    python3 ml_cli.py augment --data-type text --count 1000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import sys
import argparse
from pathlib import Path
from typing import List, Optional

# Імпортуємо Triple CLI Chain
sys.path.insert(0, str(Path(__file__).parent))
from triple_cli import TripleCLIChain


class MLCLIOrchestrator:
    """Оркестратор для ML завдань через CLI"""

    def __init__(self):
        """Ініціалізація з Triple CLI Chain"""
        self.cli_chain = TripleCLIChain()
        self.output_dir = Path("./generated_ml_scripts")
        self.output_dir.mkdir(exist_ok=True)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 1. Навчання Моделей
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def generate_training_pipeline(self, task: str, framework: str = "h2o") -> str:
        """
        Генерація навчального пайплайну

        Args:
            task: Опис ML задачі (класифікація, регресія, NER, etc)
            framework: Фреймворк (h2o, pytorch, sklearn, kubeflow)

        Returns:
            Шлях до згенерованого скрипту
        """
        print(f"\n🎓 Генерація навчального пайплайну ({framework})...")

        # Формуємо детальний промпт
        prompts = {
            "h2o": f"""Створи production-ready H2O AutoML пайплайн для {task}.
Вимоги:
- Завантаження даних з PostgreSQL (використай psycopg2)
- H2O AutoML з max_models=20, max_runtime_secs=600
- Tracking експериментів через MLflow (mlflow.h2o.autolog())
- Збереження найкращої моделі в MinIO
- Логування метрик (accuracy, precision, recall, f1)
- Генерація звіту про модель
- Інтеграція з Prometheus для моніторингу (pushgateway)
Використовуй змінні середовища для credentials.""",

            "pytorch": f"""Створи PyTorch навчальний пайплайн для {task}.
Вимоги:
- PyTorch Lightning для організації коду
- DataLoader з аугментацією (torchvision.transforms)
- Tracking через MLflow (mlflow.pytorch.autolog())
- Early stopping та model checkpointing
- GPU підтримка (CUDA)
- Збереження моделі в MinIO після навчання
- Візуалізація loss/accuracy через TensorBoard
- Експорт у ONNX формат для inference""",

            "sklearn": f"""Створи scikit-learn пайплайн для {task}.
Вимоги:
- Pipeline з preprocessing (StandardScaler, TfidfVectorizer)
- GridSearchCV для hyperparameter tuning
- Cross-validation (5 folds)
- MLflow tracking для експериментів
- Feature importance аналіз
- Confusion matrix та classification report
- Збереження моделі в joblib формат
- RESTful API wrapper через FastAPI для inference""",

            "kubeflow": f"""Створи Kubeflow Pipeline для {task}.
Вимоги:
- Kubeflow Pipelines DSL (@dsl.component декоратори)
- Компоненти: data_prep, train, evaluate, deploy
- Використання Persistent Volumes для даних
- Artifact tracking через MLflow
- GPU resource requests для навчання
- Conditional execution (якщо accuracy > 0.85, deploy)
- Notification через Telegram при завершенні
- Integration з ArgoCD для deploy"""
        }

        prompt = prompts.get(framework, prompts["h2o"])
        output_file = self.output_dir / f"train_{framework}_{task.replace(' ', '_')}.py"

        # Запускаємо CLI chain
        self.cli_chain.run_chain(prompt, str(output_file))

        return str(output_file)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 2. Створення Агентів
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def generate_agent(self, agent_type: str, tools: Optional[List[str]] = None) -> str:
        """
        Генерація AI агента

        Args:
            agent_type: Тип агента (код-ревьювер, дослідник, оптимізатор)
            tools: Список доступних інструментів

        Returns:
            Шлях до згенерованого агента
        """
        print(f"\n🤖 Генерація AI агента ({agent_type})...")

        tools_str = ", ".join(tools) if tools else "opensearch, git, postgres"

        prompt = f"""Створи AI агента типу "{agent_type}" використовуючи LangGraph.

Вимоги:
- LangGraph State Machine з nodes і edges
- Інструменти: {tools_str}
- LLM: Gemini або Mistral (через API)
- Використай наявну інтеграцію Predator Analytics:
  * OpenSearch для пошуку документів
  * PostgreSQL для збереження стану
  * Redis для кешування
  * MinIO для артефактів
- Memory: ConversationBufferMemory з Redis backend
- Structured output через Pydantic models
- Error handling та retry механізм
- Logging та metrics для Prometheus
- Async виконання (asyncio)
- CLI інтерфейс через argparse
- Можливість запуску як сервіс (daemon)

Агент має виконувати наступні завдання:
1. Аналіз вхідних даних
2. Планування кроків
3. Виконання з використанням інструментів
4. Перевірка результатів
5. Генерація звіту

Включи приклади використання в docstring."""

        output_file = self.output_dir / f"agent_{agent_type.replace(' ', '_')}.py"
        self.cli_chain.run_chain(prompt, str(output_file))

        return str(output_file)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 3. Аугментація Даних
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def generate_augmentation_pipeline(self, data_type: str, count: int = 1000) -> str:
        """
        Генерація пайплайну аугментації даних

        Args:
            data_type: Тип даних (text, image, tabular)
            count: Кількість згенерованих семплів

        Returns:
            Шлях до згенерованого скрипту
        """
        print(f"\n📊 Генерація пайплайну аугментації даних ({data_type})...")

        prompts = {
            "text": f"""Створи pipeline для аугментації текстових даних.
Вимоги:
- nlpaug для текстової аугментації (synonym replacement, back translation)
- Завантаження даних з PostgreSQL (таблиця training_data)
- Методи аугментації:
  * Synonym replacement (WordNet)
  * Back translation (en→uk→en через Gemini API)
  * Random insertion/swap/deletion
  * Paraphrasing через LLM
- Генерація {count} нових семплів
- Збереження в PostgreSQL (augmented_training_data table)
- Validation: перевірка якості аугментованих даних
- Метрики: diversity score, semantic similarity
- Візуалізація розподілу класів (before/after)
- MLflow tracking для аугментації параметрів""",

            "image": f"""Створи pipeline для аугментації зображень.
Вимоги:
- augly або albumentations для аугментації
- Завантаження з MinIO (bucket: training-images)
- Методи:
  * Rotation, flip, crop
  * Color jitter, brightness/contrast
  * Gaussian noise, blur
  * Cutout, mixup
- Генерація {count} нових зображень
- Збереження в MinIO (bucket: augmented-images)
- Метадані в PostgreSQL
- Preview: зберегти приклади аугментації для перевірки
- Parallel processing (multiprocessing) для швидкості""",

            "tabular": f"""Створи pipeline для аугментації табличних даних.
Вимоги:
- SMOTE для балансування класів (imbalanced-learn)
- Завантаження з PostgreSQL
- Методи:
  * SMOTE для minority class
  * Random noise injection
  * Feature permutation
  * Synthetic data generation (CTGAN)
- Генерація {count} нових записів
- Збереження в PostgreSQL
- Validation: correlation preservation check
- Метрики: class distribution, feature statistics
- Візуалізація PCA до/після аугментації"""
        }

        prompt = prompts.get(data_type, prompts["text"])
        output_file = self.output_dir / f"augment_{data_type}.py"

        self.cli_chain.run_chain(prompt, str(output_file))

        return str(output_file)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 4. MLOps Infrastructure
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def generate_mlops_script(self, script_type: str) -> str:
        """
        Генерація MLOps скриптів

        Args:
            script_type: Тип скрипту (monitoring, deployment, rollback, testing)

        Returns:
            Шлях до згенерованого скрипту
        """
        print(f"\n⚙️ Генерація MLOps скрипту ({script_type})...")

        prompts = {
            "monitoring": """Створи моніторинг систему для ML моделей.
Вимоги:
- Data drift detection (Evidently AI)
- Model performance tracking (accuracy degradation)
- Feature distribution monitoring
- Prediction latency metrics
- Error rate tracking
- Prometheus metrics export
- Grafana dashboard JSON generation
- Alerting через Telegram при drift > 5%
- Scheduled checks (кожні 15 хвилин)
- Historical comparison (model v1 vs v2)""",

            "deployment": """Створи автоматичний deployment pipeline для ML моделей.
Вимоги:
- Завантаження моделі з MLflow Registry
- Containerization (Docker) з model serving
- Kubernetes deployment (YAML generation)
- A/B testing setup (50/50 traffic split)
- Health checks та liveness probes
- Auto-scaling (KEDA) на базі requests/sec
- Blue-green deployment strategy
- Rollback механізм якщо error rate > 1%
- Integration з ArgoCD GitOps
- Notification через Telegram""",

            "rollback": """Створи систему rollback для ML моделей.
Вимоги:
- Список доступних версій моделей (MLflow Registry)
- Швидкий rollback на попередню версію
- Порівняння метрик: current vs previous
- Automatic rollback при деградації (accuracy drop > 10%)
- Kubernetes deployment update (rollout undo)
- Database migration rollback (Alembic)
- Notification stakeholders
- Audit log (хто, коли, чому rollback)
- Post-rollback validation тести""",

            "testing": """Створи тестовий framework для ML моделей.
Вимоги:
- Unit tests для preprocessing функцій
- Integration tests для повного pipeline
- Model behavioral tests (invariance, directional expectation)
- Performance tests (latency < 100ms)
- Data validation tests (schema, range checks)
- A/B test analysis (statistical significance)
- Load testing (Apache Bench або locust)
- CI/CD integration (pytest з coverage)
- Automated reporting через email/Telegram
- Regression testing (new model vs baseline)"""
        }

        prompt = prompts.get(script_type, prompts["monitoring"])
        output_file = self.output_dir / f"mlops_{script_type}.py"

        self.cli_chain.run_chain(prompt, str(output_file))

        return str(output_file)


def main():
    """CLI інтерфейс для ML завдань"""
    parser = argparse.ArgumentParser(
        description="ML CLI - автоматизація ML/AI розробки через Triple CLI Chain",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Приклади:
  # Навчання моделі
  python3 ml_cli.py train --task "класифікація тексту" --framework h2o

  # Створення агента
  python3 ml_cli.py agent --type "код-ревьювер" --tools opensearch git

  # Аугментація даних
  python3 ml_cli.py augment --data-type text --count 1000

  # MLOps скрипти
  python3 ml_cli.py mlops --type monitoring
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Команди')

    # Train command
    train_parser = subparsers.add_parser('train', help='Генерація навчального пайплайну')
    train_parser.add_argument('--task', required=True, help='ML задача')
    train_parser.add_argument('--framework', choices=['h2o', 'pytorch', 'sklearn', 'kubeflow'],
                             default='h2o', help='ML фреймворк')

    # Agent command
    agent_parser = subparsers.add_parser('agent', help='Створення AI агента')
    agent_parser.add_argument('--type', required=True, help='Тип агента')
    agent_parser.add_argument('--tools', nargs='+', help='Інструменти агента')

    # Augment command
    augment_parser = subparsers.add_parser('augment', help='Аугментація даних')
    augment_parser.add_argument('--data-type', choices=['text', 'image', 'tabular'],
                               required=True, help='Тип даних')
    augment_parser.add_argument('--count', type=int, default=1000,
                               help='Кількість згенерованих семплів')

    # MLOps command
    mlops_parser = subparsers.add_parser('mlops', help='MLOps скрипти')
    mlops_parser.add_argument('--type', choices=['monitoring', 'deployment', 'rollback', 'testing'],
                             required=True, help='Тип MLOps скрипту')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Створюємо orchestrator
    orchestrator = MLCLIOrchestrator()

    # Виконуємо команду
    if args.command == 'train':
        script = orchestrator.generate_training_pipeline(args.task, args.framework)
        print(f"\n✅ Навчальний пайплайн: {script}")

    elif args.command == 'agent':
        script = orchestrator.generate_agent(args.type, args.tools)
        print(f"\n✅ AI агент: {script}")

    elif args.command == 'augment':
        script = orchestrator.generate_augmentation_pipeline(args.data_type, args.count)
        print(f"\n✅ Аугментаційний пайплайн: {script}")

    elif args.command == 'mlops':
        script = orchestrator.generate_mlops_script(args.type)
        print(f"\n✅ MLOps скрипт: {script}")


if __name__ == "__main__":
    main()
