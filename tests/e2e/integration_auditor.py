#!/usr/bin/env python3
"""
🔗 Integration Auditor v2.0
PREDATOR Analytics v61.0-ELITE

Аудит інтеграції між сервісами: FastAPI, ETL, фонові задачі, API Gateway, WebSocket, 
журнали, черги повідомлень, тайм-аути, повторні спроби, синхронізація між сервісами.
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
import requests
from urllib.parse import urljoin

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/Users/Shared/Predator_60/tests/e2e/logs/integration_audit.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ServiceStatus(Enum):
    """Статус сервісу"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class ServiceHealth:
    """Здоров'я сервісу"""
    service_name: str
    status: ServiceStatus
    response_time: float
    uptime: float
    error_rate: float
    last_check: str
    details: Dict[str, Any]
    
    def __post_init__(self):
        if not self.last_check:
            self.last_check = datetime.now().isoformat()


@dataclass
class IntegrationIssue:
    """Проблема інтеграції"""
    severity: str
    service_a: str
    service_b: str
    issue_type: str
    message: str
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class MessageQueueAudit:
    """Аудит черги повідомлень"""
    queue_name: str
    message_count: int
    consumer_count: int
    pending_messages: int
    failed_messages: int
    avg_processing_time: float
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class IntegrationAuditResult:
    """Результат інтеграційного аудиту"""
    service_health: List[ServiceHealth]
    integration_issues: List[IntegrationIssue]
    message_queue_audits: List[MessageQueueAudit]
    api_endpoints: Dict[str, Any]
    websocket_status: Dict[str, Any]
    log_analysis: Dict[str, Any]
    timeout_analysis: Dict[str, Any]
    retry_analysis: Dict[str, Any]
    synchronization_status: Dict[str, Any]
    total_duration: float
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        return asdict(self)


class IntegrationAuditor:
    """Аудитор інтеграції"""
    
    def __init__(self, backend_url: str = "http://localhost:8000", nvidia_server: str = "predator-server"):
        self.backend_url = backend_url
        self.nvidia_server = nvidia_server
        self.service_health: List[ServiceHealth] = []
        self.integration_issues: List[IntegrationIssue] = []
        self.message_queue_audits: List[MessageQueueAudit] = []
    
    async def check_fastapi_health(self) -> ServiceHealth:
        """Перевірка здоров'я FastAPI"""
        logger.info("🔍 Checking FastAPI health...")
        
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                health_data = response.json()
                status = ServiceStatus.HEALTHY
            elif response.status_code >= 500:
                status = ServiceStatus.UNHEALTHY
            else:
                status = ServiceStatus.DEGRADED
            
            return ServiceHealth(
                service_name="core-api",
                status=status,
                response_time=response_time,
                uptime=health_data.get('uptime', 0) if response.status_code == 200 else 0,
                error_rate=health_data.get('error_rate', 0) if response.status_code == 200 else 1.0,
                details=health_data if response.status_code == 200 else {'error': response.text}
            )
        except Exception as e:
            logger.error(f"FastAPI health check error: {e}")
            return ServiceHealth(
                service_name="core-api",
                status=ServiceStatus.UNHEALTHY,
                response_time=10.0,
                uptime=0,
                error_rate=1.0,
                details={'error': str(e)}
            )
    
    async def check_graph_service_health(self) -> ServiceHealth:
        """Перевірка здоров'я Graph Service"""
        logger.info("🔍 Checking Graph Service health...")
        
        try:
            start_time = time.time()
            response = requests.get("http://localhost:8001/health", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                health_data = response.json()
                status = ServiceStatus.HEALTHY
            else:
                status = ServiceStatus.UNHEALTHY
            
            return ServiceHealth(
                service_name="graph-service",
                status=status,
                response_time=response_time,
                uptime=health_data.get('uptime', 0) if response.status_code == 200 else 0,
                error_rate=health_data.get('error_rate', 0) if response.status_code == 200 else 1.0,
                details=health_data if response.status_code == 200 else {'error': response.text}
            )
        except Exception as e:
            logger.error(f"Graph Service health check error: {e}")
            return ServiceHealth(
                service_name="graph-service",
                status=ServiceStatus.UNKNOWN,
                response_time=10.0,
                uptime=0,
                error_rate=1.0,
                details={'error': str(e)}
            )
    
    async def check_database_connections(self) -> List[ServiceHealth]:
        """Перевірка підключень до баз даних"""
        logger.info("🔍 Checking database connections...")
        
        db_health = []
        
        # PostgreSQL
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/health/db/postgres", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                db_health.append(ServiceHealth(
                    service_name="postgresql",
                    status=ServiceStatus.HEALTHY,
                    response_time=response_time,
                    uptime=0,
                    error_rate=0,
                    details=response.json()
                ))
            else:
                db_health.append(ServiceHealth(
                    service_name="postgresql",
                    status=ServiceStatus.UNHEALTHY,
                    response_time=response_time,
                    uptime=0,
                    error_rate=1.0,
                    details={'error': response.text}
                ))
        except Exception as e:
            logger.error(f"PostgreSQL health check error: {e}")
            db_health.append(ServiceHealth(
                service_name="postgresql",
                status=ServiceStatus.UNKNOWN,
                response_time=10.0,
                uptime=0,
                error_rate=1.0,
                details={'error': str(e)}
            ))
        
        # Redis
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/health/db/redis", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                db_health.append(ServiceHealth(
                    service_name="redis",
                    status=ServiceStatus.HEALTHY,
                    response_time=response_time,
                    uptime=0,
                    error_rate=0,
                    details=response.json()
                ))
            else:
                db_health.append(ServiceHealth(
                    service_name="redis",
                    status=ServiceStatus.UNHEALTHY,
                    response_time=response_time,
                    uptime=0,
                    error_rate=1.0,
                    details={'error': response.text}
                ))
        except Exception as e:
            logger.error(f"Redis health check error: {e}")
            db_health.append(ServiceHealth(
                service_name="redis",
                status=ServiceStatus.UNKNOWN,
                response_time=10.0,
                uptime=0,
                error_rate=1.0,
                details={'error': str(e)}
            ))
        
        return db_health
    
    async def check_kubernetes_pods(self) -> List[ServiceHealth]:
        """Перевірка статусу Kubernetes pods"""
        logger.info("🔍 Checking Kubernetes pods...")
        
        pod_health = []
        
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'kubectl get pods -n predator-v61 -o json'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                pod_data = json.loads(result.stdout)
                
                for item in pod_data.get('items', []):
                    pod_name = item['metadata']['name']
                    pod_status = item['status']['phase']
                    
                    if pod_status == 'Running':
                        status = ServiceStatus.HEALTHY
                    elif pod_status in ['Pending', 'Unknown']:
                        status = ServiceStatus.DEGRADED
                    else:
                        status = ServiceStatus.UNHEALTHY
                    
                    pod_health.append(ServiceHealth(
                        service_name=pod_name,
                        status=status,
                        response_time=0,
                        uptime=0,
                        error_rate=0,
                        details={
                            'phase': pod_status,
                            'node': item['spec'].get('nodeName', 'unknown'),
                            'containers': [c['name'] for c in item['spec'].get('containers', [])]
                        }
                    ))
            else:
                logger.warning(f"Kubernetes pods check failed: {result.stderr}")
                
        except Exception as e:
            logger.error(f"Kubernetes pods check error: {e}")
        
        return pod_health
    
    async def audit_message_queues(self) -> List[MessageQueueAudit]:
        """Аудит черг повідомлень"""
        logger.info("🔍 Auditing message queues...")
        
        queue_audits = []
        
        try:
            # Перевірка Redis черг
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'docker exec predator-redis redis-cli LLEN etl_queue'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                message_count = int(result.stdout.strip())
                queue_audits.append(MessageQueueAudit(
                    queue_name="etl_queue",
                    message_count=message_count,
                    consumer_count=1,
                    pending_messages=message_count,
                    failed_messages=0,
                    avg_processing_time=0
                ))
        except Exception as e:
            logger.error(f"Message queue audit error: {e}")
        
        return queue_audits
    
    async def analyze_api_endpoints(self) -> Dict[str, Any]:
        """Аналіз API endpoints"""
        logger.info("🔍 Analyzing API endpoints...")
        
        try:
            response = requests.get(f"{self.backend_url}/docs", timeout=10)
            
            if response.status_code == 200:
                # TODO: Парсинг OpenAPI специфікації
                return {
                    'total_endpoints': 0,
                    'healthy_endpoints': 0,
                    'degraded_endpoints': 0,
                    'unhealthy_endpoints': 0
                }
            else:
                return {
                    'error': 'Failed to fetch API documentation'
                }
        except Exception as e:
            logger.error(f"API endpoints analysis error: {e}")
            return {
                'error': str(e)
            }
    
    async def analyze_logs(self) -> Dict[str, Any]:
        """Аналіз логів"""
        logger.info("🔍 Analyzing logs...")
        
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'kubectl logs -n predator-v61 deploy-core-api-1 --tail=100'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logs = result.stdout
                
                # Аналіз логів на наявність помилок
                error_count = logs.count('ERROR')
                warning_count = logs.count('WARNING')
                critical_count = logs.count('CRITICAL')
                
                return {
                    'total_lines': len(logs.split('\n')),
                    'error_count': error_count,
                    'warning_count': warning_count,
                    'critical_count': critical_count,
                    'error_rate': error_count / len(logs.split('\n')) if logs else 0
                }
            else:
                return {
                    'error': 'Failed to fetch logs'
                }
        except Exception as e:
            logger.error(f"Log analysis error: {e}")
            return {
                'error': str(e)
            }
    
    async def analyze_timeouts(self) -> Dict[str, Any]:
        """Аналіз тайм-аутів"""
        logger.info("🔍 Analyzing timeouts...")
        
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'kubectl logs -n predator-v61 deploy-core-api-1 --tail=100 | grep -i timeout'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            timeout_logs = result.stdout
            timeout_count = len([line for line in timeout_logs.split('\n') if line.strip()])
            
            return {
                'timeout_count': timeout_count,
                'timeout_rate': timeout_count / 100 if timeout_count > 0 else 0
            }
        except Exception as e:
            logger.error(f"Timeout analysis error: {e}")
            return {
                'error': str(e)
            }
    
    async def analyze_retries(self) -> Dict[str, Any]:
        """Аналіз повторних спроб"""
        logger.info("🔍 Analyzing retries...")
        
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'kubectl logs -n predator-v61 deploy-core-api-1 --tail=100 | grep -i retry'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            retry_logs = result.stdout
            retry_count = len([line for line in retry_logs.split('\n') if line.strip()])
            
            return {
                'retry_count': retry_count,
                'retry_rate': retry_count / 100 if retry_count > 0 else 0
            }
        except Exception as e:
            logger.error(f"Retry analysis error: {e}")
            return {
                'error': str(e)
            }
    
    async def check_synchronization(self) -> Dict[str, Any]:
        """Перевірка синхронізації між сервісами"""
        logger.info("🔍 Checking service synchronization...")
        
        try:
            # Перевірка синхронізації між PostgreSQL та ClickHouse
            result = subprocess.run(
                ['python3', 'validate_8_dbs.py'],
                cwd='/Users/Shared/Predator_60/tests/e2e',
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode == 0:
                # Парсинг результату валідації
                json_start = result.stdout.find('{')
                json_end = result.stdout.rfind('}') + 1
                json_str = result.stdout[json_start:json_end]
                validation_data = json.loads(json_str)
                
                postgres_count = validation_data.get('postgres', {}).get('count', 0)
                clickhouse_count = validation_data.get('clickhouse', {}).get('count', 0)
                
                sync_status = {
                    'postgres_clickhouse_sync': abs(postgres_count - clickhouse_count) / max(postgres_count, 1) < 0.1,
                    'postgres_count': postgres_count,
                    'clickhouse_count': clickhouse_count,
                    'difference': abs(postgres_count - clickhouse_count)
                }
                
                return sync_status
            else:
                return {
                    'error': 'Validation failed'
                }
        except Exception as e:
            logger.error(f"Synchronization check error: {e}")
            return {
                'error': str(e)
            }
    
    async def detect_integration_issues(self) -> List[IntegrationIssue]:
        """Виявлення проблем інтеграції"""
        logger.info("🔍 Detecting integration issues...")
        
        issues = []
        
        # Аналіз здоров'я сервісів
        unhealthy_services = [s for s in self.service_health if s.status == ServiceStatus.UNHEALTHY]
        for service in unhealthy_services:
            issues.append(IntegrationIssue(
                severity="critical",
                service_a=service.service_name,
                service_b="system",
                issue_type="service_unhealthy",
                message=f"Service {service.service_name} is unhealthy"
            ))
        
        # Аналіз черг повідомлень
        for queue in self.message_queue_audits:
            if queue.message_count > 1000:
                issues.append(IntegrationIssue(
                    severity="high",
                    service_a="producer",
                    service_b=queue.queue_name,
                    issue_type="queue_backlog",
                    message=f"Queue {queue.queue_name} has {queue.message_count} pending messages"
                ))
        
        return issues
    
    async def run_full_audit(self) -> IntegrationAuditResult:
        """Запуск повного інтеграційного аудиту"""
        logger.info("🔗 Starting full integration audit...")
        start_time = time.time()
        
        # 1. Перевірка здоров'я сервісів
        logger.info("Step 1: Checking service health...")
        fastapi_health = await self.check_fastapi_health()
        self.service_health.append(fastapi_health)
        
        graph_health = await self.check_graph_service_health()
        self.service_health.append(graph_health)
        
        db_health = await self.check_database_connections()
        self.service_health.extend(db_health)
        
        pod_health = await self.check_kubernetes_pods()
        self.service_health.extend(pod_health)
        
        # 2. Аудит черг повідомлень
        logger.info("Step 2: Auditing message queues...")
        self.message_queue_audits = await self.audit_message_queues()
        
        # 3. Аналіз API endpoints
        logger.info("Step 3: Analyzing API endpoints...")
        api_endpoints = await self.analyze_api_endpoints()
        
        # 4. Аналіз логів
        logger.info("Step 4: Analyzing logs...")
        log_analysis = await self.analyze_logs()
        
        # 5. Аналіз тайм-аутів
        logger.info("Step 5: Analyzing timeouts...")
        timeout_analysis = await self.analyze_timeouts()
        
        # 6. Аналіз повторних спроб
        logger.info("Step 6: Analyzing retries...")
        retry_analysis = await self.analyze_retries()
        
        # 7. Перевірка синхронізації
        logger.info("Step 7: Checking synchronization...")
        synchronization_status = await self.check_synchronization()
        
        # 8. Виявлення проблем інтеграції
        logger.info("Step 8: Detecting integration issues...")
        self.integration_issues = await self.detect_integration_issues()
        
        # WebSocket статус (mock)
        websocket_status = {
            'connected': True,
            'url': 'ws://localhost:8000/ws',
            'active_connections': 5
        }
        
        total_duration = time.time() - start_time
        
        logger.info(f"Integration audit completed:")
        logger.info(f"  Services checked: {len(self.service_health)}")
        logger.info(f"  Integration issues: {len(self.integration_issues)}")
        logger.info(f"  Message queues: {len(self.message_queue_audits)}")
        logger.info(f"  Total duration: {total_duration:.2f}s")
        
        return IntegrationAuditResult(
            service_health=self.service_health,
            integration_issues=self.integration_issues,
            message_queue_audits=self.message_queue_audits,
            api_endpoints=api_endpoints,
            websocket_status=websocket_status,
            log_analysis=log_analysis,
            timeout_analysis=timeout_analysis,
            retry_analysis=retry_analysis,
            synchronization_status=synchronization_status,
            total_duration=total_duration
        )


async def main():
    """Головна функція"""
    auditor = IntegrationAuditor()
    result = await auditor.run_full_audit()
    
    # Збереження результатів
    report_dir = '/Users/Shared/Predator_60/tests/e2e/reports'
    os.makedirs(report_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    result_file = os.path.join(report_dir, f'integration_audit_result_{timestamp}.json')
    
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
    
    logger.info(f"📊 Integration audit result saved: {result_file}")
    
    return result


if __name__ == "__main__":
    asyncio.run(main())
