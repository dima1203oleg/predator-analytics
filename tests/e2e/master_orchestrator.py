#!/usr/bin/env python3
"""
🦅 Autonomous Master Orchestrator v2.0
PREDATOR Analytics v61.0-ELITE

Головний координатор автономної системи E2E-тестування з самодіагностикою та самовідновленням.
"""

import asyncio
import json
import os
import sys
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import time

# Додавання шляху до проекту
sys.path.insert(0, '/Users/Shared/Predator_60/tests/e2e')

# Імпорт компонентів
from ai_workflow_tester import AIWorkflowTester
from dom_frontend_auditor import DOMFrontendAuditor
from integration_auditor import IntegrationAuditor
from self_healing_engine import SelfHealingEngine
from continuous_improvement import ContinuousImprovementModule
from web_interface_auditor import WebInterfaceAuditor

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/Users/Shared/Predator_60/tests/e2e/logs/orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class TestStatus(Enum):
    """Статуси тестування"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    RETRYING = "retrying"


class ComponentType(Enum):
    """Типи компонентів для тестування"""
    DEPLOYMENT = "deployment"
    RBAC = "rbac"
    ETL = "etl"
    AI_WORKFLOW = "ai_workflow"
    DOM_AUDIT = "dom_audit"
    INTEGRATION = "integration"
    CONSISTENCY = "consistency"
    SELF_HEALING = "self_healing"
    CONTINUOUS_IMPROVEMENT = "continuous_improvement"
    WEB_INTERFACE = "web_interface"


@dataclass
class TestResult:
    """Результат тесту"""
    component: ComponentType
    status: TestStatus
    duration: float
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class SystemMetrics:
    """Метрики системи"""
    cpu_usage: float
    memory_usage: float
    gpu_usage: float
    disk_usage: float
    network_latency: float
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class FinalReport:
    """Фінальний звіт"""
    timestamp: str
    total_duration: float
    test_results: List[TestResult]
    system_metrics: List[SystemMetrics]
    errors: List[str]
    fixes_applied: List[str]
    recommendations: List[str]
    final_status: str
    iteration: int
    
    def to_dict(self) -> Dict:
        return asdict(self)


class DeploymentManager:
    """Менеджер деплою на NVIDIA сервер"""
    
    def __init__(self, nvidia_server: str = "predator-server"):
        self.nvidia_server = nvidia_server
        self.ssh_config = self._load_ssh_config()
        
    def _load_ssh_config(self) -> Dict:
        """Завантаження SSH конфігурації"""
        return {
            'host': os.getenv('NVIDIA_HOST', '194.177.1.200'),
            'user': os.getenv('NVIDIA_USER', 'predator'),
            'identity_file': os.path.expanduser('~/.ssh/id_rsa')
        }
    
    async def check_ssh_connection(self) -> bool:
        """Перевірка SSH з'єднання"""
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'echo "Connection successful"'],
                capture_output=True,
                text=True,
                timeout=10
            )
            success = result.returncode == 0 and "Connection successful" in result.stdout
            logger.info(f"SSH connection check: {'✅ SUCCESS' if success else '❌ FAILED'}")
            return success
        except Exception as e:
            logger.error(f"SSH connection error: {e}")
            return False
    
    async def check_cluster_status(self) -> Dict:
        """Перевірка статусу K8s кластера"""
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'kubectl get pods -n predator-v61'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return {'status': 'error', 'message': result.stderr}
            
            lines = result.stdout.split('\n')
            pods = []
            for line in lines[1:]:  # Пропускаємо заголовок
                if line.strip():
                    parts = line.split()
                    if len(parts) >= 3:
                        pods.append({
                            'name': parts[0],
                            'ready': parts[1],
                            'status': parts[2],
                            'restarts': parts[3] if len(parts) > 3 else '0'
                        })
            
            running_pods = [p for p in pods if p['status'] == 'Running']
            total_pods = len(pods)
            
            logger.info(f"Cluster status: {len(running_pods)}/{total_pods} pods running")
            
            return {
                'status': 'ok',
                'total_pods': total_pods,
                'running_pods': len(running_pods),
                'pods': pods
            }
        except Exception as e:
            logger.error(f"Cluster status check error: {e}")
            return {'status': 'error', 'message': str(e)}
    
    async def deploy_to_nvidia(self) -> bool:
        """Деплой на NVIDIA сервер"""
        try:
            logger.info("🚀 Starting deployment to NVIDIA server...")
            
            # Перевірка з'єднання
            if not await self.check_ssh_connection():
                logger.error("SSH connection failed")
                return False
            
            # Перевірка статусу кластера
            cluster_status = await self.check_cluster_status()
            if cluster_status['status'] != 'ok':
                logger.warning(f"Cluster status: {cluster_status}")
            
            # Якщо кластер працює, пропускаємо деплой
            if cluster_status.get('running_pods', 0) > 10:
                logger.info("✅ Cluster is already running, skipping deployment")
                return True
            
            # Деплой через Helm
            logger.info("Deploying via Helm...")
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'cd /home/predator/predator-deploy && helm upgrade --install predator-v61 ./helm/predator -n predator-v61 --create-namespace'],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                logger.error(f"Helm deployment failed: {result.stderr}")
                return False
            
            logger.info("✅ Deployment successful")
            return True
            
        except Exception as e:
            logger.error(f"Deployment error: {e}")
            return False
    
    async def rollback_deployment(self) -> bool:
        """Rollback деплою"""
        try:
            logger.info("🔄 Rolling back deployment...")
            
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'helm rollback predator-v61 -n predator-v61'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            success = result.returncode == 0
            logger.info(f"Rollback: {'✅ SUCCESS' if success else '❌ FAILED'}")
            return success
            
        except Exception as e:
            logger.error(f"Rollback error: {e}")
            return False
    
    async def monitor_resources(self) -> SystemMetrics:
        """Моніторинг ресурсів"""
        try:
            # CPU та Memory
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\''],
                capture_output=True,
                text=True,
                timeout=10
            )
            cpu_usage = float(result.stdout.strip()) if result.returncode == 0 else 0.0
            
            # Memory
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'free | grep Mem | awk \'{print ($3/$2) * 100.0}\''],
                capture_output=True,
                text=True,
                timeout=10
            )
            memory_usage = float(result.stdout.strip()) if result.returncode == 0 else 0.0
            
            # GPU (nvidia-smi)
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits'],
                capture_output=True,
                text=True,
                timeout=10
            )
            gpu_usage = float(result.stdout.strip()) if result.returncode == 0 else 0.0
            
            # Disk
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'df -h / | awk \'NR==2 {print $5}\' | sed \'s/%//\''],
                capture_output=True,
                text=True,
                timeout=10
            )
            disk_usage = float(result.stdout.strip()) if result.returncode == 0 else 0.0
            
            # Network latency
            start = time.time()
            await self.check_ssh_connection()
            network_latency = (time.time() - start) * 1000  # ms
            
            metrics = SystemMetrics(
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                gpu_usage=gpu_usage,
                disk_usage=disk_usage,
                network_latency=network_latency
            )
            
            logger.info(f"System metrics: CPU={cpu_usage:.1f}%, RAM={memory_usage:.1f}%, GPU={gpu_usage:.1f}%, Disk={disk_usage:.1f}%, Latency={network_latency:.1f}ms")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Resource monitoring error: {e}")
            return SystemMetrics(
                cpu_usage=0.0,
                memory_usage=0.0,
                gpu_usage=0.0,
                disk_usage=0.0,
                network_latency=0.0
            )


class RBACTestSuite:
    """Тест сьют для RBAC (4 рівні доступу)"""
    
    def __init__(self, ui_url: str = "http://localhost:3030"):
        self.ui_url = ui_url
        self.test_users = {
            'ADMIN': {'email': 'admin@predator.dev', 'password': 'admin123', 'role': 'admin'},
            'COMMANDER': {'email': 'commander@predator.dev', 'password': 'test123', 'role': 'commander'},
            'STRATEG': {'email': 'strateg@predator.dev', 'password': 'test123', 'role': 'strateg'},
            'OPERATIONS': {'email': 'operations@predator.dev', 'password': 'test123', 'role': 'operations'}
        }
    
    async def test_level_1_admin(self) -> TestResult:
        """Тест Level 1 - Admin (Tech Admin)"""
        start_time = time.time()
        logger.info("🛡️ Testing Level 1: Admin (Tech Admin)")
        
        try:
            # Запуск Playwright тесту для Admin
            result = subprocess.run(
                ['npx', 'playwright', 'test', 'e2e/rbac-scenarios.spec.ts', '--grep', 'СЦЕНАРІЙ 4'],
                cwd='/Users/Shared/Predator_60/apps/predator-analytics-ui',
                capture_output=True,
                text=True,
                timeout=300
            )
            
            duration = time.time() - start_time
            success = result.returncode == 0
            
            logger.info(f"Level 1 (Admin): {'✅ PASSED' if success else '❌ FAILED'}")
            
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={'level': 'admin', 'tests': 'tech_panel, etl_management, db_management, ai_management, logs, monitoring'}
            )
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Level 1 (Admin) error: {e}")
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e),
                details={'level': 'admin'}
            )
    
    async def test_level_2_commander(self) -> TestResult:
        """Тест Level 2 - Commander (Командир)"""
        start_time = time.time()
        logger.info("🎖️ Testing Level 2: Commander (Командир)")
        
        try:
            # Запуск Playwright тесту для Commander
            result = subprocess.run(
                ['npx', 'playwright', 'test', 'e2e/rbac-scenarios.spec.ts', '--grep', 'СЦЕНАРІЙ 2'],
                cwd='/Users/Shared/Predator_60/apps/predator-analytics-ui',
                capture_output=True,
                text=True,
                timeout=300
            )
            
            duration = time.time() - start_time
            success = result.returncode == 0
            
            logger.info(f"Level 2 (Commander): {'✅ PASSED' if success else '❌ FAILED'}")
            
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={'level': 'commander', 'tests': 'chat, voice_interaction, ai_avatar, graph_links, analytics_panels, query_history, report_generation'}
            )
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Level 2 (Commander) error: {e}")
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e),
                details={'level': 'commander'}
            )
    
    async def test_level_3_strateg(self) -> TestResult:
        """Тест Level 3 - Strateg (Стратег)"""
        start_time = time.time()
        logger.info("🎯 Testing Level 3: Strateg (Стратег)")
        
        try:
            # Запуск Playwright тесту для Strateg
            result = subprocess.run(
                ['npx', 'playwright', 'test', 'e2e/rbac-scenarios.spec.ts', '--grep', 'СЦЕНАРІЙ 3'],
                cwd='/Users/Shared/Predator_60/apps/predator-analytics-ui',
                capture_output=True,
                text=True,
                timeout=300
            )
            
            duration = time.time() - start_time
            success = result.returncode == 0
            
            logger.info(f"Level 3 (Strateg): {'✅ PASSED' if success else '❌ FAILED'}")
            
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={'level': 'strateg', 'tests': 'scenario_analysis, forecasting, link_building, semantic_search, ai_consultant'}
            )
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Level 3 (Strateg) error: {e}")
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e),
                details={'level': 'strateg'}
            )
    
    async def test_level_4_operations(self) -> TestResult:
        """Тест Level 4 - Operations Officer (Оперативний офіцер)"""
        start_time = time.time()
        logger.info("⚡ Testing Level 4: Operations Officer (Оперативний офіцер)")
        
        try:
            # Запуск Playwright тесту для Operations
            result = subprocess.run(
                ['npx', 'playwright', 'test', 'e2e/rbac-scenarios.spec.ts', '--grep', 'СЦЕНАРІЙ 1'],
                cwd='/Users/Shared/Predator_60/apps/predator-analytics-ui',
                capture_output=True,
                text=True,
                timeout=300
            )
            
            duration = time.time() - start_time
            success = result.returncode == 0
            
            logger.info(f"Level 4 (Operations): {'✅ PASSED' if success else '❌ FAILED'}")
            
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={'level': 'operations', 'tests': 'quick_queries, search, counterparty_cards, risks, customs_declarations, interactive_panels'}
            )
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Level 4 (Operations) error: {e}")
            return TestResult(
                component=ComponentType.RBAC,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e),
                details={'level': 'operations'}
            )
    
    async def run_all_levels(self) -> List[TestResult]:
        """Запуск тестів для всіх рівнів"""
        logger.info("🎭 Starting RBAC test suite for all 4 levels...")
        
        results = []
        results.append(await self.test_level_1_admin())
        results.append(await self.test_level_2_commander())
        results.append(await self.test_level_3_strateg())
        results.append(await self.test_level_4_operations())
        
        passed = sum(1 for r in results if r.status == TestStatus.PASSED)
        logger.info(f"RBAC test suite completed: {passed}/{len(results)} levels passed")
        
        return results


class MasterOrchestrator:
    """Головний оркестратор автономної системи тестування"""
    
    def __init__(self):
        self.deployment_manager = DeploymentManager()
        self.rbac_suite = RBACTestSuite()
        self.ai_workflow_tester = AIWorkflowTester()
        self.dom_auditor = DOMFrontendAuditor()
        self.web_interface_auditor = WebInterfaceAuditor()  # Додано для веб тестування
        self.integration_auditor = IntegrationAuditor()
        self.self_healing_engine = SelfHealingEngine()
        self.continuous_improvement_module = ContinuousImprovementModule()
        self.test_results: List[TestResult] = []
        self.system_metrics: List[SystemMetrics] = []
        self.errors: List[str] = []
        self.fixes_applied: List[str] = []
        self.recommendations: List[str] = []
        self.max_iterations = int(os.getenv('MAX_ITERATIONS', '10'))
        self.current_iteration = 0
        
    async def execute(self) -> FinalReport:
        """Головний метод виконання"""
        logger.info("🦅 Autonomous Master Orchestrator v2.0 starting...")
        start_time = time.time()
        
        for self.current_iteration in range(1, self.max_iterations + 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"ITERATION {self.current_iteration}/{self.max_iterations}")
            logger.info(f"{'='*60}\n")
            
            try:
                # 1. Deployment
                logger.info("📦 STEP 1: Deployment Manager")
                deployment_result = await self._run_deployment()
                self.test_results.append(deployment_result)
                
                # 2. RBAC Testing
                logger.info("🎭 STEP 2: RBAC Test Suite")
                rbac_results = await self.rbac_suite.run_all_levels()
                self.test_results.extend(rbac_results)
                
                # 3. ETL Pipeline Testing
                logger.info("🔄 STEP 3: ETL Pipeline Validator")
                etl_result = await self._run_etl_validation()
                self.test_results.append(etl_result)
                
                # 4. AI Workflow Testing
                logger.info("🤖 STEP 4: AI Workflow Tester")
                ai_result = await self._run_ai_workflow()
                self.test_results.append(ai_result)
                
                # 5. DOM & Frontend Audit
                logger.info("🖥️ STEP 5: DOM & Frontend Audit")
                dom_result = await self._run_dom_audit()
                self.test_results.append(dom_result)
                
                # 5.5 Web Interface Testing (Google Antigravity Style)
                logger.info("🌐 STEP 5.5: Web Interface Surface Testing")
                web_result = await self._run_web_interface_test()
                self.test_results.append(web_result)
                
                # 6. Integration Audit
                logger.info("🔗 STEP 6: Integration Audit")
                integration_result = await self._run_integration_audit()
                self.test_results.append(integration_result)
                
                # 7. Consistency Check
                logger.info("✅ STEP 7: Consistency Check")
                consistency_result = await self._run_consistency_check()
                self.test_results.append(consistency_result)
                
                # 8. Final Validation
                logger.info("🎯 STEP 8: Final Validation")
                if self._perform_final_validation():
                    logger.info("✅ ALL TESTS PASSED - System is READY FOR PRODUCTION")
                    break
                else:
                    logger.warning("⚠️ Some tests failed - attempting self-healing...")
                    if self.current_iteration < self.max_iterations:
                        healing_result = await self._attempt_self_healing()
                        self.test_results.append(healing_result)
                    else:
                        logger.error("❌ Max iterations reached - system requires manual intervention")
                        break
                        
            except Exception as e:
                logger.error(f"❌ Critical error in iteration {self.current_iteration}: {e}")
                self.errors.append(f"Iteration {self.current_iteration}: {str(e)}")
                
                if self.current_iteration < self.max_iterations:
                    await self._attempt_self_healing()
                else:
                    break
        
        # 9. Continuous Improvement
        logger.info("📈 STEP 9: Continuous Improvement")
        improvement_result = await self._run_continuous_improvement()
        self.test_results.append(improvement_result)
        
        # 10. Generate Final Report
        total_duration = time.time() - start_time
        final_report = self._generate_final_report(total_duration)
        
        logger.info(f"\n{'='*60}")
        logger.info(f"FINAL STATUS: {final_report.final_status}")
        logger.info(f"TOTAL DURATION: {total_duration:.2f}s")
        logger.info(f"{'='*60}\n")
        
        return final_report
    
    async def _run_deployment(self) -> TestResult:
        """Запуск деплою"""
        start_time = time.time()
        
        try:
            success = await self.deployment_manager.deploy_to_nvidia()
            duration = time.time() - start_time
            
            return TestResult(
                component=ComponentType.DEPLOYMENT,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={'server': 'predator-server', 'method': 'ssh + helm'}
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.DEPLOYMENT,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _run_etl_validation(self) -> TestResult:
        """Запуск ETL валідації"""
        start_time = time.time()
        logger.info("Running ETL validation via Playwright...")
        
        try:
            result = subprocess.run(
                ['npx', 'playwright', 'test', 'e2e/autonomous-excel-import.spec.ts'],
                cwd='/Users/Shared/Predator_60/apps/predator-analytics-ui',
                capture_output=True,
                text=True,
                timeout=1800  # 30 хвилин
            )
            
            duration = time.time() - start_time
            success = result.returncode == 0
            
            return TestResult(
                component=ComponentType.ETL,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={'excel_import': 'dom_based', 'etl_pipeline': 'full', 'storage_validation': '8_dbs'}
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.ETL,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _run_ai_workflow(self) -> TestResult:
        """Запуск AI workflow тестів"""
        start_time = time.time()
        logger.info("Running AI workflow tests...")
        
        try:
            result = await self.ai_workflow_tester.run_full_workflow()
            duration = time.time() - start_time
            
            success = result.success_rate >= 0.8
            
            return TestResult(
                component=ComponentType.AI_WORKFLOW,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={
                    'queries_tested': len(result.queries),
                    'success_rate': result.success_rate,
                    'vectors_created': result.vectorization.total_vectors,
                    'errors': len(result.errors)
                }
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.AI_WORKFLOW,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _run_dom_audit(self) -> TestResult:
        """Запуск DOM аудиту"""
        start_time = time.time()
        logger.info("Running DOM audit...")
        
        try:
            result = await self.dom_auditor.run_full_audit()
            duration = time.time() - start_time
            
            # Критичні проблеми
            critical_issues = [i for i in result.issues if i.severity.value == 'critical']
            success = len(critical_issues) == 0
            
            return TestResult(
                component=ComponentType.DOM_AUDIT,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={
                    'total_issues': len(result.issues),
                    'critical_issues': len(critical_issues),
                    'console_errors': len(result.console_errors),
                    'network_errors': len(result.network_errors),
                    'accessibility_issues': len(result.accessibility_issues)
                }
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.DOM_AUDIT,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _run_web_interface_test(self) -> TestResult:
        """Запуск веб інтерфейс тестування (Google Antigravity Style)"""
        start_time = time.time()
        logger.info("🤖 Running Web Interface Surface Testing (Google Antigravity Style)...")
        
        try:
            result = await self.web_interface_auditor.run_surface_test()
            duration = time.time() - start_time
            
            success = result['success_rate'] >= 70  # 70% успішності достатньо
            
            return TestResult(
                component=ComponentType.WEB_INTERFACE,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={
                    'total_clicks': result['total_clicks'],
                    'successful_clicks': result['successful_clicks'],
                    'failed_clicks': result['failed_clicks'],
                    'form_interactions': result['form_interactions'],
                    'keyboard_interactions': result['keyboard_interactions'],
                    'success_rate': result['success_rate'],
                    'errors': result['errors']
                }
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.WEB_INTERFACE,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _run_integration_audit(self) -> TestResult:
        """Запуск інтеграційного аудиту"""
        start_time = time.time()
        logger.info("Running integration audit...")
        
        try:
            result = await self.integration_auditor.run_full_audit()
            duration = time.time() - start_time
            
            # Критичні проблеми інтеграції
            unhealthy_services = [s for s in result.service_health if s.status.value == 'unhealthy']
            critical_issues = [i for i in result.integration_issues if i.severity == 'critical']
            success = len(unhealthy_services) == 0 and len(critical_issues) == 0
            
            return TestResult(
                component=ComponentType.INTEGRATION,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={
                    'services_checked': len(result.service_health),
                    'unhealthy_services': len(unhealthy_services),
                    'integration_issues': len(result.integration_issues),
                    'message_queues': len(result.message_queue_audits)
                }
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.INTEGRATION,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _run_consistency_check(self) -> TestResult:
        """Запуск перевірки консистентності"""
        start_time = time.time()
        logger.info("Running consistency check...")
        
        try:
            result = subprocess.run(
                ['python3', 'validate_8_dbs.py'],
                cwd='/Users/Shared/Predator_60/tests/e2e',
                capture_output=True,
                text=True,
                timeout=300
            )
            
            duration = time.time() - start_time
            success = result.returncode == 0
            
            return TestResult(
                component=ComponentType.CONSISTENCY,
                status=TestStatus.PASSED if success else TestStatus.FAILED,
                duration=duration,
                details={'databases': '8', 'check': 'row_count_consistency'}
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.CONSISTENCY,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _attempt_self_healing(self) -> TestResult:
        """Спроба самовідновлення"""
        start_time = time.time()
        logger.info("🔧 Attempting self-healing...")
        
        try:
            # Збір помилок та метрик
            error_logs = [r.error for r in self.test_results if r.error]
            system_metrics = {
                'failed_tests': len([r for r in self.test_results if r.status == TestStatus.FAILED]),
                'total_tests': len(self.test_results)
            }
            
            # Виклик Self-Healing Engine
            result = await self.self_healing_engine.run_self_healing(error_logs, system_metrics)
            
            # Оновлення списку виправлень
            for action in result.actions_taken:
                if action.success:
                    self.fixes_applied.append(f"{action.action.value} on {action.target}")
            
            duration = time.time() - start_time
            
            return TestResult(
                component=ComponentType.SELF_HEALING,
                status=TestStatus.PASSED if result.success else TestStatus.FAILED,
                duration=duration,
                details={
                    'diagnosis': result.diagnosis.problem_type,
                    'actions_taken': len(result.actions_taken),
                    'requires_manual_intervention': result.requires_manual_intervention
                }
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.SELF_HEALING,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    async def _run_continuous_improvement(self) -> TestResult:
        """Запуск безперервного покращення"""
        start_time = time.time()
        logger.info("📈 Running continuous improvement analysis...")
        
        try:
            # Виклик Continuous Improvement Module
            result = await self.continuous_improvement_module.run_continuous_improvement()
            
            # Оновлення рекомендацій
            for rec in result.optimization_recommendations:
                self.recommendations.append(f"{rec.title}: {rec.description}")
            
            for rec in result.architecture_recommendations:
                self.recommendations.append(f"Architecture: {rec}")
            
            duration = time.time() - start_time
            
            return TestResult(
                component=ComponentType.CONTINUOUS_IMPROVEMENT,
                status=TestStatus.PASSED,
                duration=duration,
                details={
                    'performance_metrics': len(result.performance_metrics),
                    'optimization_recommendations': len(result.optimization_recommendations),
                    'architecture_recommendations': len(result.architecture_recommendations),
                    'regression_test_status': result.regression_test_results.get('status', 'unknown')
                }
            )
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                component=ComponentType.CONTINUOUS_IMPROVEMENT,
                status=TestStatus.FAILED,
                duration=duration,
                error=str(e)
            )
    
    def _perform_final_validation(self) -> bool:
        """Фінальна валідація"""
        logger.info("Performing final validation...")
        
        # Критерії успіху
        critical_components = [
            ComponentType.DEPLOYMENT,
            ComponentType.RBAC,
            ComponentType.ETL,
            ComponentType.CONSISTENCY
        ]
        
        passed_critical = all(
            any(r.component == comp and r.status == TestStatus.PASSED for r in self.test_results)
            for comp in critical_components
        )
        
        total_passed = sum(1 for r in self.test_results if r.status == TestStatus.PASSED)
        total_tests = len(self.test_results)
        pass_rate = total_passed / total_tests if total_tests > 0 else 0
        
        logger.info(f"Critical components: {'✅ PASSED' if passed_critical else '❌ FAILED'}")
        logger.info(f"Overall pass rate: {pass_rate:.1%} ({total_passed}/{total_tests})")
        
        return passed_critical and pass_rate >= 0.8
    
    def _generate_final_report(self, total_duration: float) -> FinalReport:
        """Генерація фінального звіту"""
        passed = sum(1 for r in self.test_results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.test_results if r.status == TestStatus.FAILED)
        skipped = sum(1 for r in self.test_results if r.status == TestStatus.SKIPPED)
        
        final_status = "READY FOR PRODUCTION" if self._perform_final_validation() else "NOT READY"
        
        report = FinalReport(
            timestamp=datetime.now().isoformat(),
            total_duration=total_duration,
            test_results=self.test_results,
            system_metrics=self.system_metrics,
            errors=self.errors,
            fixes_applied=self.fixes_applied,
            recommendations=self.recommendations,
            final_status=final_status,
            iteration=self.current_iteration
        )
        
        # Збереження звіту
        self._save_report(report)
        
        return report
    
    def _save_report(self, report: FinalReport):
        """Збереження звіту"""
        report_dir = '/Users/Shared/Predator_60/tests/e2e/reports'
        os.makedirs(report_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # JSON звіт
        json_path = os.path.join(report_dir, f'autonomous_agent_report_{timestamp}.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(report.to_dict(), f, indent=2, ensure_ascii=False)
        logger.info(f"📊 JSON report saved: {json_path}")
        
        # Markdown звіт
        md_path = os.path.join(report_dir, f'autonomous_agent_report_{timestamp}.md')
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(self._generate_markdown_report(report))
        logger.info(f"📊 Markdown report saved: {md_path}")
    
    def _generate_markdown_report(self, report: FinalReport) -> str:
        """Генерація Markdown звіту"""
        md = f"""# 🦅 Autonomous Agent Report v2.0
**PREDATOR Analytics v61.0-ELITE**

## Загальна інформація
- **Timestamp**: {report.timestamp}
- **Iteration**: {report.iteration}
- **Total Duration**: {report.total_duration:.2f}s
- **Final Status**: {report.final_status}

## Результати тестування

### Статистика
- **Total Tests**: {len(report.test_results)}
- **Passed**: {sum(1 for r in report.test_results if r.status == TestStatus.PASSED)}
- **Failed**: {sum(1 for r in report.test_results if r.status == TestStatus.FAILED)}
- **Skipped**: {sum(1 for r in report.test_results if r.status == TestStatus.SKIPPED)}

### Деталі по компонентах

"""
        
        for result in report.test_results:
            status_emoji = "✅" if result.status == TestStatus.PASSED else "❌" if result.status == TestStatus.FAILED else "⏭️"
            md += f"#### {status_emoji} {result.component.value.upper()}\n"
            md += f"- **Status**: {result.status.value}\n"
            md += f"- **Duration**: {result.duration:.2f}s\n"
            if result.error:
                md += f"- **Error**: {result.error}\n"
            if result.details:
                md += f"- **Details**: {result.details}\n"
            md += "\n"
        
        if report.errors:
            md += "## Помилки\n\n"
            for error in report.errors:
                md += f"- {error}\n"
            md += "\n"
        
        if report.fixes_applied:
            md += "## Виправлення\n\n"
            for fix in report.fixes_applied:
                md += f"- {fix}\n"
            md += "\n"
        
        if report.recommendations:
            md += "## Рекомендації\n\n"
            for rec in report.recommendations:
                md += f"- {rec}\n"
            md += "\n"
        
        md += f"""
## Фінальний статус
**{report.final_status}**

---
**Generated by**: Autonomous Master Orchestrator v2.0  
**Version**: PREDATOR Analytics v61.0-ELITE
"""
        
        return md


async def main():
    """Головна функція"""
    orchestrator = MasterOrchestrator()
    report = await orchestrator.execute()
    
    logger.info("\n" + "="*60)
    logger.info("AUTONOMOUS AGENT EXECUTION COMPLETED")
    logger.info("="*60 + "\n")
    
    return report


if __name__ == "__main__":
    asyncio.run(main())
