#!/usr/bin/env python3
"""
🔗 Integration Auditor - Приклад використання
PREDATOR Analytics v61.0-ELITE
"""

import asyncio
import sys
import os

# Додавання шляху до проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integration_auditor import IntegrationAuditor


async def main():
    """Приклад використання Integration Auditor"""
    
    # Ініціалізація аудитора
    auditor = IntegrationAuditor(
        backend_url="http://localhost:8000",
        nvidia_server="predator-server"
    )
    
    # Запуск повного аудиту
    result = await auditor.run_full_audit()
    
    # Вивід результатів
    print(f"\n🔗 Integration Audit Results:")
    print(f"  Services checked: {len(result.service_health)}")
    print(f"  Integration issues: {len(result.integration_issues)}")
    print(f"  Message queues: {len(result.message_queue_audits)}")
    print(f"  Total duration: {result.total_duration:.2f}s")
    
    # Детальний аналіз сервісів
    print(f"\n📊 Service Health:")
    healthy_services = [s for s in result.service_health if s.status.value == 'healthy']
    unhealthy_services = [s for s in result.service_health if s.status.value == 'unhealthy']
    
    print(f"  Healthy: {len(healthy_services)}")
    for service in healthy_services:
        print(f"    ✅ {service.service_name} ({service.response_time:.2f}s)")
    
    print(f"  Unhealthy: {len(unhealthy_services)}")
    for service in unhealthy_services:
        print(f"    ❌ {service.service_name}")
    
    # Аналіз логів
    print(f"\n📝 Log Analysis:")
    print(f"  Total lines: {result.log_analysis.get('total_lines', 0)}")
    print(f"  Errors: {result.log_analysis.get('error_count', 0)}")
    print(f"  Warnings: {result.log_analysis.get('warning_count', 0)}")
    print(f"  Error rate: {result.log_analysis.get('error_rate', 0):.1%}")
    
    # Синхронізація
    print(f"\n🔄 Synchronization Status:")
    sync_status = result.synchronization_status
    print(f"  PostgreSQL-ClickHouse sync: {sync_status.get('postgres_clickhouse_sync', False)}")
    print(f"  PostgreSQL count: {sync_status.get('postgres_count', 0)}")
    print(f"  ClickHouse count: {sync_status.get('clickhouse_count', 0)}")
    print(f"  Difference: {sync_status.get('difference', 0)}")


if __name__ == "__main__":
    asyncio.run(main())
