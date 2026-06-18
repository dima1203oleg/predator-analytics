#!/usr/bin/env python3
"""
🔧 Self-Healing Engine v2.0
PREDATOR Analytics v61.0-ELITE

Система самовідновлення з LLM діагностикою для автоматичного виправлення помилок.
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import os
import re

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/Users/Shared/Predator_60/tests/e2e/logs/self_healing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class HealingAction(Enum):
    """Типи дій самовідновлення"""
    RESTART_SERVICE = "restart_service"
    RESTART_POD = "restart_pod"
    CLEAR_CACHE = "clear_cache"
    REINDEX_DATA = "reindex_data"
    FIX_CONFIGURATION = "fix_configuration"
    UPDATE_DEPENDENCIES = "update_dependencies"
    ROLLBACK_DEPLOYMENT = "rollback_deployment"
    MANUAL_INTERVENTION = "manual_intervention"


@dataclass
class HealingActionRecord:
    """Запис дії самовідновлення"""
    action: HealingAction
    target: str
    description: str
    success: bool
    duration: float
    error: Optional[str] = None
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class LLMDiagnosis:
    """Діагноз від LLM"""
    problem_type: str
    root_cause: str
    suggested_actions: List[str]
    confidence: float
    reasoning: str
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class SelfHealingResult:
    """Результат самовідновлення"""
    diagnosis: LLMDiagnosis
    actions_taken: List[HealingActionRecord]
    total_duration: float
    success: bool
    remaining_issues: List[str]
    requires_manual_intervention: bool
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        return asdict(self)


class SelfHealingEngine:
    """Двигун самовідновлення"""
    
    def __init__(self, nvidia_server: str = "predator-server", enable_llm: bool = True):
        self.nvidia_server = nvidia_server
        self.enable_llm = enable_llm
        self.actions_taken: List[HealingActionRecord] = []
        self.remaining_issues: List[str] = []
    
    async def diagnose_with_llm(self, error_logs: List[str], system_metrics: Dict) -> LLMDiagnosis:
        """Діагностика за допомогою LLM"""
        logger.info("🧠 Running LLM diagnosis...")
        
        if not self.enable_llm:
            logger.warning("LLM diagnostics disabled, using rule-based diagnosis")
            return self._rule_based_diagnosis(error_logs, system_metrics)
        
        try:
            # Підготовка промпту для LLM
            prompt = self._prepare_llm_prompt(error_logs, system_metrics)
            
            # Виклик локального LLM (Ollama)
            # TODO: Реалізувати реальний виклик LLM
            # Поки що використовуємо rule-based diagnosis
            
            logger.info("LLM diagnosis not yet implemented, using rule-based")
            return self._rule_based_diagnosis(error_logs, system_metrics)
            
        except Exception as e:
            logger.error(f"LLM diagnosis error: {e}")
            return self._rule_based_diagnosis(error_logs, system_metrics)
    
    def _prepare_llm_prompt(self, error_logs: List[str], system_metrics: Dict) -> str:
        """Підготовка промпту для LLM"""
        prompt = f"""
Аналізуй наступні помилки та метрики системи PREDATOR Analytics:

ПОМИЛКИ:
{chr(10).join(error_logs[:10])}  # Обмеження до 10 помилок

МЕТРИКИ СИСТЕМИ:
{json.dumps(system_metrics, indent=2)}

Визнач:
1. Тип проблеми
2. Кореневу причину
3. Рекомендовані дії для виправлення
4. Рівень впевненості (0-1)
5. Обґрунтування

Формат відповіді у JSON:
{{
    "problem_type": "string",
    "root_cause": "string",
    "suggested_actions": ["action1", "action2"],
    "confidence": 0.0-1.0,
    "reasoning": "string"
}}
"""
        return prompt
    
    def _rule_based_diagnosis(self, error_logs: List[str], system_metrics: Dict) -> LLMDiagnosis:
        """Rule-based діагностика (fallback)"""
        logger.info("🔍 Running rule-based diagnosis...")
        
        # Аналіз помилок
        error_types = {}
        for log in error_logs:
            if 'Connection' in log or 'timeout' in log:
                error_types['connection'] = error_types.get('connection', 0) + 1
            elif 'Memory' in log or 'OOM' in log:
                error_types['memory'] = error_types.get('memory', 0) + 1
            elif 'Database' in log or 'SQL' in log:
                error_types['database'] = error_types.get('database', 0) + 1
            elif 'Kafka' in log or 'queue' in log:
                error_types['queue'] = error_types.get('queue', 0) + 1
        
        # Визначення проблеми
        if error_types.get('memory', 0) > 5:
            return LLMDiagnosis(
                problem_type="memory_issue",
                root_cause="High memory usage causing OOM errors",
                suggested_actions=[
                    "Restart affected services",
                    "Increase memory limits",
                    "Clear cache"
                ],
                confidence=0.8,
                reasoning="Multiple memory-related errors detected in logs"
            )
        elif error_types.get('connection', 0) > 5:
            return LLMDiagnosis(
                problem_type="connectivity_issue",
                root_cause="Network connectivity problems between services",
                suggested_actions=[
                    "Check network configuration",
                    "Restart affected services",
                    "Verify DNS resolution"
                ],
                confidence=0.7,
                reasoning="Multiple connection/timeout errors detected"
            )
        elif error_types.get('database', 0) > 5:
            return LLMDiagnosis(
                problem_type="database_issue",
                root_cause="Database connectivity or performance problems",
                suggested_actions=[
                    "Restart database services",
                    "Check connection pool",
                    "Verify database health"
                ],
                confidence=0.8,
                reasoning="Multiple database-related errors detected"
            )
        elif error_types.get('queue', 0) > 5:
            return LLMDiagnosis(
                problem_type="queue_issue",
                root_cause="Message queue processing problems",
                suggested_actions=[
                    "Restart queue consumers",
                    "Clear backlog",
                    "Check Kafka/Redpanda status"
                ],
                confidence=0.7,
                reasoning="Multiple queue-related errors detected"
            )
        else:
            return LLMDiagnosis(
                problem_type="unknown",
                root_cause="Unable to determine specific issue from logs",
                suggested_actions=[
                    "Restart all services",
                    "Check system logs",
                    "Manual intervention required"
                ],
                confidence=0.3,
                reasoning="No clear pattern detected in error logs"
            )
    
    async def execute_healing_action(self, action: HealingAction, target: str) -> HealingActionRecord:
        """Виконання дії самовідновлення"""
        logger.info(f"🔧 Executing healing action: {action.value} on {target}")
        start_time = time.time()
        
        try:
            if action == HealingAction.RESTART_SERVICE:
                success = await self._restart_service(target)
            elif action == HealingAction.RESTART_POD:
                success = await self._restart_pod(target)
            elif action == HealingAction.CLEAR_CACHE:
                success = await self._clear_cache(target)
            elif action == HealingAction.REINDEX_DATA:
                success = await self._reindex_data(target)
            elif action == HealingAction.FIX_CONFIGURATION:
                success = await self._fix_configuration(target)
            elif action == HealingAction.UPDATE_DEPENDENCIES:
                success = await self._update_dependencies(target)
            elif action == HealingAction.ROLLBACK_DEPLOYMENT:
                success = await self._rollback_deployment()
            else:
                logger.warning(f"Action {action.value} not implemented")
                success = False
            
            duration = time.time() - start_time
            
            record = HealingActionRecord(
                action=action,
                target=target,
                description=f"Executed {action.value} on {target}",
                success=success,
                duration=duration
            )
            
            logger.info(f"{'✅' if success else '❌'} Healing action completed in {duration:.2f}s")
            
            return record
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Healing action error: {e}")
            
            return HealingActionRecord(
                action=action,
                target=target,
                description=f"Failed to execute {action.value} on {target}",
                success=False,
                duration=duration,
                error=str(e)
            )
    
    async def _restart_service(self, service_name: str) -> bool:
        """Перезапуск сервісу"""
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, f'docker restart {service_name}'],
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Service restart error: {e}")
            return False
    
    async def _restart_pod(self, pod_name: str) -> bool:
        """Перезапуск Kubernetes pod"""
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, f'kubectl delete pod {pod_name} -n predator-v61'],
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Pod restart error: {e}")
            return False
    
    async def _clear_cache(self, cache_name: str) -> bool:
        """Очищення кешу"""
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, f'docker exec predator-redis redis-cli FLUSHALL'],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    async def _reindex_data(self, index_name: str) -> bool:
        """Реіндексація даних"""
        # TODO: Реалізувати реіндексацію
        logger.warning("Reindex not yet implemented")
        return False
    
    async def _fix_configuration(self, config_file: str) -> bool:
        """Виправлення конфігурації"""
        # TODO: Реалізувати виправлення конфігурації
        logger.warning("Configuration fix not yet implemented")
        return False
    
    async def _update_dependencies(self, service_name: str) -> bool:
        """Оновлення залежностей"""
        # TODO: Реалізувати оновлення залежностей
        logger.warning("Dependency update not yet implemented")
        return False
    
    async def _rollback_deployment(self) -> bool:
        """Rollback деплою"""
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'helm rollback predator-v61 -n predator-v61'],
                capture_output=True,
                text=True,
                timeout=120
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Rollback error: {e}")
            return False
    
    async def apply_healing_strategy(self, diagnosis: LLMDiagnosis) -> List[HealingActionRecord]:
        """Застосування стратегії самовідновлення"""
        logger.info(f"🔧 Applying healing strategy for: {diagnosis.problem_type}")
        
        actions = []
        
        for suggested_action in diagnosis.suggested_actions:
            # Визначення типу дії на основі рекомендації
            if 'restart' in suggested_action.lower():
                if 'service' in suggested_action.lower():
                    action = HealingAction.RESTART_SERVICE
                    target = 'predator_backend'  # Default target
                elif 'pod' in suggested_action.lower():
                    action = HealingAction.RESTART_POD
                    target = 'deploy-core-api-1'  # Default target
                else:
                    action = HealingAction.RESTART_SERVICE
                    target = 'predator_backend'
            elif 'cache' in suggested_action.lower():
                action = HealingAction.CLEAR_CACHE
                target = 'redis'
            elif 'reindex' in suggested_action.lower():
                action = HealingAction.REINDEX_DATA
                target = 'all'
            elif 'configuration' in suggested_action.lower():
                action = HealingAction.FIX_CONFIGURATION
                target = 'config'
            elif 'dependency' in suggested_action.lower():
                action = HealingAction.UPDATE_DEPENDENCIES
                target = 'backend'
            elif 'rollback' in suggested_action.lower():
                action = HealingAction.ROLLBACK_DEPLOYMENT
                target = 'cluster'
            else:
                continue
            
            # Виконання дії
            record = await self.execute_healing_action(action, target)
            actions.append(record)
            
            # Якщо дія не вдалася, спробуємо альтернативу
            if not record.success:
                logger.warning(f"Action {action.value} failed, trying alternative...")
                # TODO: Реалізувати альтернативні дії
        
        return actions
    
    async def verify_healing(self) -> bool:
        """Перевірка успішності самовідновлення"""
        logger.info("🔍 Verifying healing success...")
        
        # Перевірка здоров'я сервісів
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'kubectl get pods -n predator-v61'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                running_pods = sum(1 for line in lines if 'Running' in line)
                total_pods = len(lines) - 2  # Minus header and empty line
                
                success_rate = running_pods / total_pods if total_pods > 0 else 0
                logger.info(f"Pod health: {running_pods}/{total_pods} running ({success_rate:.1%})")
                
                return success_rate >= 0.8
            else:
                logger.error("Failed to check pod status")
                return False
                
        except Exception as e:
            logger.error(f"Healing verification error: {e}")
            return False
    
    async def run_self_healing(self, error_logs: List[str], system_metrics: Dict) -> SelfHealingResult:
        """Запуск процесу самовідновлення"""
        logger.info("🔧 Starting self-healing process...")
        start_time = time.time()
        
        # 1. Діагностика
        diagnosis = await self.diagnose_with_llm(error_logs, system_metrics)
        logger.info(f"Diagnosis: {diagnosis.problem_type} (confidence: {diagnosis.confidence:.1%})")
        
        # 2. Застосування стратегії самовідновлення
        self.actions_taken = await self.apply_healing_strategy(diagnosis)
        
        # 3. Перевірка успішності
        healing_success = await self.verify_healing()
        
        # 4. Очікування стабілізації
        if healing_success:
            logger.info("⏳ Waiting for system stabilization...")
            await asyncio.sleep(30)  # 30 секунд на стабілізацію
        
        # 5. Повторна перевірка
        final_success = await self.verify_healing()
        
        total_duration = time.time() - start_time
        
        # Визначення проблем, що залишилися
        if not final_success:
            self.remaining_issues = [
                "System still unhealthy after healing attempts",
                "Manual intervention may be required"
            ]
        
        logger.info(f"Self-healing completed:")
        logger.info(f"  Actions taken: {len(self.actions_taken)}")
        logger.info(f"  Success: {final_success}")
        logger.info(f"  Duration: {total_duration:.2f}s")
        
        return SelfHealingResult(
            diagnosis=diagnosis,
            actions_taken=self.actions_taken,
            total_duration=total_duration,
            success=final_success,
            remaining_issues=self.remaining_issues,
            requires_manual_intervention=not final_success
        )


async def main():
    """Головна функція для тестування"""
    engine = SelfHealingEngine()
    
    # Тестові дані
    error_logs = [
        "ERROR: Connection timeout to database",
        "ERROR: Memory allocation failed",
        "ERROR: Database connection pool exhausted"
    ]
    
    system_metrics = {
        "cpu_usage": 85.0,
        "memory_usage": 92.0,
        "disk_usage": 45.0,
        "network_latency": 150.0
    }
    
    result = await engine.run_self_healing(error_logs, system_metrics)
    
    # Збереження результатів
    report_dir = '/Users/Shared/Predator_60/tests/e2e/reports'
    os.makedirs(report_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    result_file = os.path.join(report_dir, f'self_healing_result_{timestamp}.json')
    
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
    
    logger.info(f"📊 Self-healing result saved: {result_file}")
    
    return result


if __name__ == "__main__":
    asyncio.run(main())
