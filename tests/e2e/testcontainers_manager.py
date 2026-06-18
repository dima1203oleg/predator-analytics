#!/usr/bin/env python3
"""
🐳 Testcontainers Manager v3.0
PREDATOR Analytics v61.0-ELITE

Менеджер Testcontainers для тестування з реальними контейнерами.
"""

import asyncio
import os
from typing import Dict, Optional
from datetime import datetime


class TestcontainersManager:
    """Менеджер Testcontainers для управління тестовими контейнерами"""
    
    def __init__(self):
        self.containers = {}
        self.network_name = "predator-test-network"
    
    async def start_postgres_container(self) -> Dict[str, str]:
        """Запускає PostgreSQL контейнер"""
        try:
            from testcontainers.postgres import PostgresContainer
            
            postgres = PostgresContainer(
                "postgres:16-alpine",
                dbname="predator_test",
                user="predator_test",
                password="test_password",
                port=5433
            )
            
            postgres.start()
            
            connection_string = postgres.get_connection_url()
            
            self.containers["postgres"] = postgres
            
            return {
                "status": "running",
                "connection_string": connection_string,
                "container_id": postgres.get_container_id()
            }
        except ImportError:
            # Fallback якщо testcontainers не встановлено
            return {
                "status": "fallback",
                "message": "testcontainers not installed, using external PostgreSQL",
                "connection_string": os.getenv("DATABASE_URL", "postgresql://predator_test:test_password@localhost:5433/predator_test")
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def start_redis_container(self) -> Dict[str, str]:
        """Запускає Redis контейнер"""
        try:
            from testcontainers.redis import RedisContainer
            
            redis = RedisContainer("redis:7-alpine", port=6380)
            redis.start()
            
            connection_string = redis.get_connection_url()
            
            self.containers["redis"] = redis
            
            return {
                "status": "running",
                "connection_string": connection_string,
                "container_id": redis.get_container_id()
            }
        except ImportError:
            return {
                "status": "fallback",
                "message": "testcontainers not installed, using external Redis",
                "connection_string": os.getenv("REDIS_URL", "redis://localhost:6380")
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def start_qdrant_container(self) -> Dict[str, str]:
        """Запускає Qdrant контейнер"""
        try:
            from testcontainers.core.container import DockerContainer
            
            qdrant = DockerContainer("qdrant/qdrant:v1.8.1")
            qdrant.with_exposed_ports(6333, 6334)
            qdrant.with_volume("qdrant_test_data", "/qdrant/storage")
            qdrant.start()
            
            host = qdrant.get_container_host_ip()
            port = qdrant.get_exposed_port(6333)
            
            self.containers["qdrant"] = qdrant
            
            return {
                "status": "running",
                "url": f"http://{host}:{port}",
                "container_id": qdrant.get_container_id()
            }
        except ImportError:
            return {
                "status": "fallback",
                "message": "testcontainers not installed, using external Qdrant",
                "url": os.getenv("QDRANT_URL", "http://localhost:6334")
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def start_all_containers(self) -> Dict[str, Dict[str, str]]:
        """Запускає всі контейнери для тестування"""
        
        results = {}
        
        # PostgreSQL
        results["postgres"] = await self.start_postgres_container()
        
        # Redis
        results["redis"] = await self.start_redis_container()
        
        # Qdrant
        results["qdrant"] = await self.start_qdrant_container()
        
        return results
    
    async def stop_all_containers(self):
        """Зупиняє всі контейнери"""
        
        for name, container in self.containers.items():
            try:
                container.stop()
                print(f"✅ Зупинено контейнер: {name}")
            except Exception as e:
                print(f"❌ Помилка зупинки контейнера {name}: {e}")
        
        self.containers.clear()
    
    def get_container_status(self, name: str) -> Dict[str, str]:
        """Отримує статус контейнера"""
        
        if name not in self.containers:
            return {
                "status": "not_running",
                "message": f"Контейнер {name} не запущено"
            }
        
        container = self.containers[name]
        
        try:
            # Перевірка чи контейнер працює
            if hasattr(container, 'get_container_id'):
                return {
                    "status": "running",
                    "container_id": container.get_container_id()
                }
            else:
                return {
                    "status": "running",
                    "message": "Контейнер працює"
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }


async def main():
    """Приклад використання"""
    
    manager = TestcontainersManager()
    
    print("🐳 Запуск контейнерів...")
    results = await manager.start_all_containers()
    
    print("\n📊 Статус контейнерів:")
    for name, result in results.items():
        status_icon = "✅" if result.get("status") == "running" else "❌"
        print(f"  {status_icon} {name}: {result.get('status')}")
        if result.get("status") == "running":
            print(f"     {result}")
    
    print("\n⏳ Чекаємо 10 секунд...")
    await asyncio.sleep(10)
    
    print("\n🛑 Зупинка контейнерів...")
    await manager.stop_all_containers()
    
    print("✅ Завершено")


if __name__ == "__main__":
    asyncio.run(main())
