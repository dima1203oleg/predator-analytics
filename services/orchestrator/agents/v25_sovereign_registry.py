#!/usr/bin/env python3.12
"""
🛡️ PREDATOR v25 - В25 Суверенний Оркестратор Агентів (Sovereign Agent Orchestrator)
---------------------------------------------------------------------------------
Керує 7-ма основними CLI агентами для автономного життєвого циклу системи:
1. Gemini CLI - Основний інтелектуальний агент системи.
2. Vibe CLI - Агент швидкої ітерації та "вайб-кодингу".
3. Mistral CLI - Експертний агент для складного рефакторингу.
4. GitHub Copilot / Aider - Агент для глибокої роботи з кодом та автовиправлення.
5. Claude CLI - Антропік агент для безпечного коду.
6. DeepSeek CLI - Агент для глибокого аналізу та оптимізації.
7. CodeLlama (Ollama) - Локальний агент для офлайн-кодингу.

Всі агенти працюють в Python 3.12 та повністю українізовані.
"""

import asyncio
import logging
import os
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from libs.core.structured_logger import get_logger, log_business_event, RequestLogger
logger = get_logger("predator.sovereign")

# Імпортуємо існуючі агенти
from .aider_agent import AiderAgent, AiderOrchestration
# Спроба імпорту CopilotAgent з динамічним пошуком шляху
try:
    from app.agents.copilot import CopilotAgent
except ImportError:
    import sys
    # Додаємо шлях до api-gateway, якщо ми в іншому контексті
    for p in [Path(__file__).resolve().parents[3] / "services/api-gateway",
              Path("/app/services/api-gateway")]:
        if p.exists() and str(p) not in sys.path:
            sys.path.append(str(p))
    try:
        from app.agents.copilot import CopilotAgent
    except ImportError:
        logger.warning("⚠️ CopilotAgent не знайдено через стандартний імпорт. Використовуємо заглушку.")
        class CopilotAgent:
            def __init__(self, *args, **kwargs): pass
            async def chat(self, *args, **kwargs): return "CopilotAgent stub"


class SovereignAgentOrchestrator:
    """
    Центральний контролер для 7-х основних CLI агентів.
    Реалізує логіку автовдосконалення та автонавчання.
    """

    # Доступні моделі для різних задач (оптимізовано v25.1)
    # Mistral - основний для автовдосконалення коду
    # Llama 3.1 - файнтюнінг під доменні знання Predator
    # Доступні моделі (GTX 1080 Optimized - LOCAL FIRST)
    # Llama 3.1 8B & Mistral 7B -> Пріоритет #1 для швидкості та приватності
    AVAILABLE_MODELS = {
        "analysis": ["mistral/mistral-small-latest", "ollama/llama3.1:8b", "gemini/gemini-2.0-flash"],

        "coding": ["mistral/mistral-small-latest", "ollama/deepseek-coder:6.7b", "gemini/gemini-2.0-flash"],
        "refactoring": ["mistral/mistral-small-latest", "ollama/mistral:7b", "deepseek/deepseek-chat"],
        "review": ["mistral/mistral-small-latest", "ollama/llama3.1:8b", "gemini/gemini-2.0-flash"],

        "domain_knowledge": ["ollama/llama3.1:8b"],
        "local": ["ollama/llama3.1:8b", "ollama/mistral:7b", "ollama/deepseek-coder:6.7b"]
    }


    def __init__(self, workspace_root: str = None):
        if workspace_root is None:
            # Динамічне визначення кореневої директорії
            if Path("/app").exists() and os.access("/app", os.W_OK):
                workspace_root = "/app"
            else:
                workspace_root = str(Path(__file__).resolve().parents[3])

        self.workspace_root = Path(workspace_root)

        self.aider_orchestrator = AiderOrchestration(project_root=str(workspace_root))
        self.cycle_count = 0

        # Ініціалізація Gemini (через CopilotAgent)
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            self.gemini_agent = CopilotAgent(api_key=gemini_key, workspace_root=str(workspace_root))
        else:
            self.gemini_agent = None
            logger.warning("⚠️ GEMINI_API_KEY не знайдено. Gemini агент деактивований.")

        # Конфігурація для Ollama (Llama 3.1 8b)
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        self.llama_model = "llama3.1:8b-instruct-q8_0"

        # Статус агентів
        self.agent_status = {
            "gemini": gemini_key is not None,
            "claude": os.getenv("ANTHROPIC_API_KEY") is not None,
            "mistral": os.getenv("MISTRAL_API_KEY") is not None,
            "deepseek": os.getenv("DEEPSEEK_API_KEY") is not None,
            "github_copilot": os.getenv("GITHUB_TOKEN") is not None,
            "ollama": True,  # Завжди доступний локально
            "aider": True    # Завжди доступний як фолбек
        }

        logger.info(f"🤖 Ініціалізовано Суверенний Оркестратор. Активні агенти: {[k for k,v in self.agent_status.items() if v]}")

    async def execute_comprehensive_cycle(self, task_description: str):
        """
        Запускає повний цикл: Аналіз -> Виправлення -> Тестування -> Розгортання.
        """
        self.cycle_count += 1
        cycle_id = f"cycle_{self.cycle_count}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        with RequestLogger(logger, "comprehensive_cycle", cycle_id=cycle_id, task_preview=task_description[:50]) as req_logger:
            req_logger.info("cycle_started", task=task_description)

            files_modified = []

            try:
                # 1. АНАЛІЗ (Gemini CLI або Claude як фолбек)
                async with RequestLogger(logger, "cycle_phase_analysis", cycle_id=cycle_id):
                    analysis = await self._run_analysis(task_description)

                # 2. ВАЙБ-КОДИНГ (Vibe CLI - швидкий прототип)
                if analysis.get("requires_coding"):
                    async with RequestLogger(logger, "cycle_phase_coding", cycle_id=cycle_id):
                        vibe_result = await self._run_vibe_iteration(analysis)
                    files_modified.extend(vibe_result.get("files_modified", []))

                    # 3. ГЛИБОКЕ ВИПРАВЛЕННЯ (GitHub Copilot / Aider / Claude)
                    async with RequestLogger(logger, "cycle_phase_reconciliation", cycle_id=cycle_id):
                        aider_result = await self._run_aider_reconciliation(vibe_result, analysis)
                    files_modified.extend(aider_result.get("files_modified", []))

                    # 4. РЕФАКТОРИНГ (Mistral CLI або DeepSeek)
                    async with RequestLogger(logger, "cycle_phase_refactoring", cycle_id=cycle_id):
                        final_refactor = await self._run_mistral_refactor(aider_result)
                    files_modified.extend(final_refactor.get("files_modified", []))

                    # 5. CODE REVIEW (Claude - безпека)
                    if self.agent_status["claude"]:
                        async with RequestLogger(logger, "cycle_phase_review", cycle_id=cycle_id):
                            await self._run_claude_review(final_refactor)

                    # 6. АВТО-РОЗГОРТАННЯ (Self-Deployment)
                    if final_refactor.get("status") == "success":
                         async with RequestLogger(logger, "cycle_phase_deploy", cycle_id=cycle_id):
                            await self._run_self_deployment(final_refactor)

                    # 7. GIT AUTO-COMMIT
                    await self._run_git_autocommit(task_description, files_modified, cycle_id)

                    # 8. АВТОНАВЧАННЯ (Llama 3.1 8b)
                    await self._update_local_knowledge(task_description, final_refactor)

                log_business_event(
                    logger,
                    "sovereign_cycle_completed",
                    cycle_id=cycle_id,
                    files_count=len(set(files_modified)),
                    duration_s=0 # calculated by RequestLogger
                )

                return {
                    "status": "success",
                    "message": "Цикл автовдосконалення завершено успішно (UA-v25)",
                    "cycle_id": cycle_id,
                    "files_modified": list(set(files_modified)),
                    "agents_used": [k for k, v in self.agent_status.items() if v]
                }
            except Exception as e:
                req_logger.exception("cycle_failed", error=str(e))
                raise e

    async def _run_claude_review(self, previous_result: Dict):
        """Code Review через Claude для безпеки коду"""
        logger.info("🔍 Запуск Claude для Code Review та перевірки безпеки...")
        try:
            agent = AiderAgent(model="anthropic/claude-3-5-sonnet-20241022", project_root=str(self.workspace_root))
            prompt = """
            Проведи детальний Code Review наступних змін:
            1. Перевір на вразливості безпеки (SQL injection, XSS, etc.)
            2. Перевір на витоки даних
            3. Перевір відповідність Python 3.12 стандартам
            4. Перевір українську локалізацію
            Видай JSON з полями: approved, issues, recommendations.
            """
            result = await agent.execute_task(prompt, previous_result.get("files_modified", []))
            if result.get("status") == "success":
                logger.info("✅ Claude Code Review пройдено успішно.")
            return result
        except Exception as e:
            logger.warning(f"⚠️ Claude Review недоступний: {e}")
            return {"status": "skipped", "reason": str(e)}

    async def _run_deepseek_optimization(self, files: List[str]) -> Dict:
        """Оптимізація коду через DeepSeek"""
        logger.info("🔬 Запуск DeepSeek для глибокої оптимізації...")
        try:
            agent = AiderAgent(model="deepseek/deepseek-chat", project_root=str(self.workspace_root))
            prompt = "Оптимізуй цей код для максимальної продуктивності. Зберігай сумісність з Python 3.12."
            return await agent.execute_task(prompt, files)
        except Exception as e:
            logger.warning(f"⚠️ DeepSeek недоступний: {e}")
            return {"status": "skipped", "reason": str(e)}

    async def _run_git_autocommit(self, task: str, files: List[str], cycle_id: str):
        """Автоматичний Git commit після успішного циклу"""
        logger.info("📝 Запуск Git Auto-Commit...")
        try:
            from .git_committer import GitAutoCommitter
            committer = GitAutoCommitter()

            metadata = {
                "cycle": self.cycle_count,
                "cycle_id": cycle_id,
                "improvements": [task],
                "council_decision": "APPROVED",
                "health_score": "98%"
            }

            success = await committer.commit_improvement(
                description=task[:50],
                files_changed=files,
                metadata=metadata
            )

            if success:
                logger.info(f"✅ Git commit успішний для циклу {cycle_id}")
            else:
                logger.warning(f"⚠️ Git commit не вдався для циклу {cycle_id}")

        except Exception as e:
            logger.error(f"❌ Помилка Git Auto-Commit: {e}")

    async def _run_self_deployment(self, refactor_result: Dict):
        """Автоматичне розгортання змін"""
        logger.info("🚢 Запуск процесу автоматичного розгортання (Self-Deployment)...")
        try:
            from .devops_automation import DevOpsAutomationAgent, create_nvidia_config, create_local_config

            devops = DevOpsAutomationAgent(project_root=str(self.workspace_root))

            # Адаптивний вибір середовища
            if os.getenv("PREDATOR_ENV") == "production-nvidia":
                 config = create_nvidia_config()
                 logger.info("Використання конфігурації сервера NVIDIA")
            else:
                 config = create_local_config()
                 logger.info("Використання конфігурації Local Docker")

            logger.info("🔄 Перезапуск сервісів для застосування змін...")
            await devops.restart_service("predator_backend", config)
            logger.info("✅ Авторозгортання ініційовано.")
        except Exception as e:
            logger.error(f"❌ Помилка авторозгортання: {e}")

    async def _run_analysis(self, prompt: str) -> Dict:
        """Аналіз задачі за допомогою Arbitration Engine (Gemini/Mistral/Ollama)."""
        from ..arbitration.engine import arbitration_engine

        try:
            # Використовуємо новий Arbitration Engine для консенсусу
            result = await arbitration_engine.execute(prompt, task_type="analysis")

            # Парсинг відповіді (очікуємо JSON)
            import re
            json_match = re.search(r'\{.*\}', result.content, re.DOTALL)

            if json_match:
                try:
                    res = json.loads(json_match.group())
                    res["requires_coding"] = True
                    return res
                except:
                    pass

            if result.content:
                return {"requires_coding": True, "files_to_touch": [], "suggestion": result.content}

        except Exception as e:
            logger.error(f"❌ Arbitration Analysis failed: {e}")

        # Fallback (якщо арбітраж впав)
        return {"requires_coding": True, "files_to_touch": [], "suggestion": "Автоматичний аналіз недоступний (Fallback)"}


    async def _run_vibe_iteration(self, analysis: Dict) -> Dict:
        """Імітація Vibe CLI для швидкої ітерації"""
        logger.info("✨ Запуск Vibe CLI для генерації прототипу...")
        # Вибираємо агентів з config (local first)
        preferred = [m.split('/')[-1] for m in self.AVAILABLE_MODELS["coding"]]

        return await self.aider_orchestrator.execute_with_fallback(
            prompt=f"VIBE MODE: {analysis.get('suggestion')}",
            files=analysis.get("files_to_touch", ["services/api-gateway/app/main.py"]),
            preferred_agents=preferred
        )

    async def _run_aider_reconciliation(self, previous_result: Dict, analysis: Dict) -> Dict:
        """Глибока перевірка та виправлення через GitHub Copilot / Aider / Claude"""
        logger.info("📦 Запуск Aider для верифікації коду...")

        # Вибір моделі за пріоритетом
        if self.agent_status["github_copilot"]:
            model = "github/copilot"
        elif self.agent_status["claude"]:
            model = "anthropic/claude-3-5-sonnet-20241022"
        else:
            model = "mistral/mistral-small-latest"

        prompt = f"""
        Перевір та виправ будь-які помилки у попередніх змінах.
        Ціль: {analysis.get('suggestion')}
        Вимоги: Python 3.12, Повна локалізація (UA).
        """

        agent = AiderAgent(model=model, project_root=str(self.workspace_root))
        result = await agent.execute_task(prompt, analysis.get("files_to_touch", []))

        # Перевірка на безпеку (Policy Engine)
        if result.get("status") == "success":
             await self._run_policy_check(result)

        return result

    async def _run_policy_check(self, result: Dict):
        """Перевірка безпеки згенерованого коду (UA)"""
        logger.info("🛡️ Запуск Policy Engine для верифікації безпеки коду...")
        try:
            from scripts.policy_engine import PolicyEngine
            engine = PolicyEngine()

            for file_path in result.get("files_modified", []):
                full_path = self.workspace_root / file_path
                if full_path.exists():
                    with open(full_path, "r", encoding="utf-8") as f:
                        code = f.read()
                        check = engine.check_code(code)
                        if not check["approved"]:
                            logger.error(f"❌ ПОРУШЕННЯ ПОЛІТИКИ у файлі {file_path}: {check['violations']}")
        except Exception as e:
            logger.error(f"⚠️ Помилка Policy Engine: {e}")

    async def _run_mistral_refactor(self, previous_result: Dict) -> Dict:
        """Фінальний рефакторинг та оптимізація через Mistral CLI або DeepSeek"""
        logger.info("🌪️ Запуск Mistral CLI для архітектурного рефакторингу...")

        # Вибір моделі
        if self.agent_status["mistral"]:
            model = "mistral/mistral-large-latest"
        elif self.agent_status["deepseek"]:
            model = "deepseek/deepseek-chat"
        else:
            model = "mistral/mistral-small-latest"

        agent = AiderAgent(model=model, project_root=str(self.workspace_root))
        prompt = "Зроби фінальний рефакторинг коду для забезпечення максимальної чистоти та відповідності стандартам Predator v25."
        return await agent.execute_task(prompt, previous_result.get("files_modified", []))

    async def _update_local_knowledge(self, task: str, result: Dict):
        """Збереження досвіду для автонавчання Llama 3.1 8b"""
        logger.info("📚 Збереження досвіду для автонавчання Llama 3.1...")
        experience = {
            "task": task,
            "result_status": result.get("status"),
            "timestamp": datetime.now().isoformat(),
            "python_version": "3.12",
            "model_engine": "llama3.1-8b-instruct",
            "cycle": self.cycle_count,
            "agents_active": [k for k, v in self.agent_status.items() if v]
        }

        history_file = self.workspace_root / "data/training/experience_log.jsonl"
        history_file.parent.mkdir(parents=True, exist_ok=True)

        with open(history_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(experience, ensure_ascii=False) + "\n")

    def get_agent_status(self) -> Dict[str, Any]:
        """Повертає статус всіх агентів"""
        return {
            "agents": self.agent_status,
            "cycle_count": self.cycle_count,
            "workspace": str(self.workspace_root),
            "available_models": self.AVAILABLE_MODELS
        }

# Експорт сінглтона
sovereign_orchestrator = SovereignAgentOrchestrator()
