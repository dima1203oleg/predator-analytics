"""
Advanced Telegram Bot Service
Інтеграція з Predator Analytics:
- ETL/парсинг моніторинг
- Індексація (OpenSearch, Qdrant)
- Celery tasks
- K8s кластери
- AI агент для програмування
"""
import os
import json
import asyncio
import subprocess
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import httpx

logger = logging.getLogger(__name__)


class PredatorMonitor:
    """Моніторинг Predator Analytics системи"""
    
    def __init__(self):
        self.project_dir = "/Users/dima-mac/Documents/Predator_21"
        self.opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    async def get_opensearch_status(self) -> Dict[str, Any]:
        """OpenSearch статус та індекси"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                # Cluster health
                health = await client.get(f"{self.opensearch_url}/_cluster/health")
                health_data = health.json()
                
                # Indices stats
                indices = await client.get(f"{self.opensearch_url}/_cat/indices?format=json")
                indices_data = indices.json()
                
                total_docs = sum(int(idx.get("docs.count", 0)) for idx in indices_data if idx.get("docs.count"))
                total_size = sum(float(idx.get("store.size", "0").replace("kb", "").replace("mb", "").replace("gb", "")) for idx in indices_data if idx.get("store.size"))
                
                return {
                    "status": health_data.get("status", "unknown"),
                    "cluster_name": health_data.get("cluster_name"),
                    "indices_count": health_data.get("number_of_indices", 0),
                    "total_docs": total_docs,
                    "total_size_mb": total_size,
                    "active_shards": health_data.get("active_shards", 0),
                    "indices": [
                        {
                            "name": idx.get("index"),
                            "docs": idx.get("docs.count", "0"),
                            "size": idx.get("store.size", "0"),
                            "health": idx.get("health", "unknown")
                        }
                        for idx in indices_data[:10]  # Top 10
                    ]
                }
        except Exception as e:
            logger.error(f"OpenSearch error: {e}")
            return {"status": "error", "error": str(e)}
    
    async def get_qdrant_status(self) -> Dict[str, Any]:
        """Qdrant статус та колекції"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                # Collections
                collections = await client.get(f"{self.qdrant_url}/collections")
                collections_data = collections.json()
                
                result = {"collections": []}
                
                for coll in collections_data.get("result", {}).get("collections", []):
                    coll_name = coll.get("name")
                    # Get collection info
                    coll_info = await client.get(f"{self.qdrant_url}/collections/{coll_name}")
                    coll_data = coll_info.json().get("result", {})
                    
                    result["collections"].append({
                        "name": coll_name,
                        "vectors_count": coll_data.get("vectors_count", 0),
                        "points_count": coll_data.get("points_count", 0),
                        "status": coll_data.get("status", "unknown")
                    })
                
                result["total_collections"] = len(result["collections"])
                result["status"] = "online"
                return result
                
        except Exception as e:
            logger.error(f"Qdrant error: {e}")
            return {"status": "error", "error": str(e)}
    
    async def get_celery_status(self) -> Dict[str, Any]:
        """Celery workers та tasks статус"""
        try:
            # Через celery inspect
            result = subprocess.run(
                ["celery", "-A", "app.core.celery_app", "inspect", "active"],
                capture_output=True, text=True, timeout=10,
                cwd=f"{self.project_dir}/ua-sources"
            )
            
            active_tasks = "No active tasks"
            if result.returncode == 0 and result.stdout:
                active_tasks = result.stdout[:500]
            
            # Workers stats
            result2 = subprocess.run(
                ["celery", "-A", "app.core.celery_app", "inspect", "stats"],
                capture_output=True, text=True, timeout=10,
                cwd=f"{self.project_dir}/ua-sources"
            )
            
            return {
                "status": "online" if result.returncode == 0 else "offline",
                "active_tasks": active_tasks,
                "workers_stats": result2.stdout[:500] if result2.returncode == 0 else "N/A"
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def get_etl_status(self) -> Dict[str, Any]:
        """ETL jobs статус"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.backend_url}/api/etl/jobs")
                data = response.json()
                return {
                    "status": "online",
                    "total_jobs": data.get("total", 0),
                    "jobs": data.get("jobs", [])[:5]
                }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def get_k8s_detailed_status(self) -> Dict[str, Any]:
        """Детальний статус K8s кластеру"""
        try:
            # Nodes
            nodes_result = subprocess.run(
                ["kubectl", "get", "nodes", "-o", "json"],
                capture_output=True, text=True, timeout=10
            )
            
            nodes_data = {"nodes": [], "total_nodes": 0}
            if nodes_result.returncode == 0:
                nodes_json = json.loads(nodes_result.stdout)
                nodes_data["total_nodes"] = len(nodes_json.get("items", []))
                for node in nodes_json.get("items", []):
                    nodes_data["nodes"].append({
                        "name": node["metadata"]["name"],
                        "status": node["status"]["conditions"][-1]["type"],
                        "ready": node["status"]["conditions"][-1]["status"] == "True"
                    })
            
            # Namespaces
            ns_result = subprocess.run(
                ["kubectl", "get", "namespaces", "-o", "name"],
                capture_output=True, text=True, timeout=10
            )
            namespaces = ns_result.stdout.split('\n') if ns_result.returncode == 0 else []
            
            # Pods across all namespaces
            pods_result = subprocess.run(
                ["kubectl", "get", "pods", "--all-namespaces", "-o", "json"],
                capture_output=True, text=True, timeout=10
            )
            
            pods_data = {"total": 0, "running": 0, "pending": 0, "failed": 0}
            if pods_result.returncode == 0:
                pods_json = json.loads(pods_result.stdout)
                for pod in pods_json.get("items", []):
                    phase = pod["status"].get("phase", "Unknown")
                    pods_data["total"] += 1
                    if phase == "Running":
                        pods_data["running"] += 1
                    elif phase == "Pending":
                        pods_data["pending"] += 1
                    elif phase == "Failed":
                        pods_data["failed"] += 1
            
            # Services
            svc_result = subprocess.run(
                ["kubectl", "get", "services", "--all-namespaces", "-o", "json"],
                capture_output=True, text=True, timeout=10
            )
            services_count = 0
            if svc_result.returncode == 0:
                svc_json = json.loads(svc_result.stdout)
                services_count = len(svc_json.get("items", []))
            
            return {
                "status": "online",
                "nodes": nodes_data,
                "namespaces": len(namespaces),
                "pods": pods_data,
                "services": services_count
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def get_backend_health(self) -> Dict[str, Any]:
        """Backend API health"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.backend_url}/health")
                return response.json()
        except Exception as e:
            return {"status": "error", "error": str(e)}


class AICodeAgent:
    """AI агент для програмування через Telegram"""
    
    def __init__(self):
        self.project_dir = "/Users/dima-mac/Documents/Predator_21"
    
    async def execute_code(self, code: str, language: str = "python") -> Tuple[bool, str]:
        """Виконує код"""
        try:
            if language == "python":
                # Створюємо тимчасовий файл
                temp_file = f"/tmp/telegram_code_{datetime.now().timestamp()}.py"
                with open(temp_file, 'w') as f:
                    f.write(code)
                
                # Виконуємо
                result = subprocess.run(
                    ["python3", temp_file],
                    capture_output=True, text=True, timeout=30,
                    cwd=self.project_dir
                )
                
                os.remove(temp_file)
                
                output = result.stdout or result.stderr
                return result.returncode == 0, output[:2000]
            
            elif language == "bash":
                result = subprocess.run(
                    code, shell=True,
                    capture_output=True, text=True, timeout=30,
                    cwd=self.project_dir
                )
                output = result.stdout or result.stderr
                return result.returncode == 0, output[:2000]
            
            return False, "Unsupported language"
            
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    async def create_file(self, path: str, content: str) -> Tuple[bool, str]:
        """Створює файл"""
        try:
            full_path = os.path.join(self.project_dir, path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            with open(full_path, 'w') as f:
                f.write(content)
            
            return True, f"✅ Файл створено: {path}"
        except Exception as e:
            return False, f"❌ Помилка: {str(e)}"
    
    async def edit_file(self, path: str, search: str, replace: str) -> Tuple[bool, str]:
        """Редагує файл"""
        try:
            full_path = os.path.join(self.project_dir, path)
            
            with open(full_path, 'r') as f:
                content = f.read()
            
            if search not in content:
                return False, f"⚠️ Текст '{search}' не знайдено"
            
            new_content = content.replace(search, replace)
            
            with open(full_path, 'w') as f:
                f.write(new_content)
            
            return True, f"✅ Файл відредаговано: {path}"
        except Exception as e:
            return False, f"❌ Помилка: {str(e)}"
    
    async def run_tests(self, test_path: str = "") -> Tuple[bool, str]:
        """Запускає тести"""
        try:
            cmd = ["pytest", "-v"]
            if test_path:
                cmd.append(test_path)
            
            result = subprocess.run(
                cmd,
                capture_output=True, text=True, timeout=60,
                cwd=f"{self.project_dir}/ua-sources"
            )
            
            output = result.stdout or result.stderr
            return result.returncode == 0, output[-1500:]
        except Exception as e:
            return False, f"Error: {str(e)}"


# Singleton instances
predator_monitor = PredatorMonitor()
ai_agent = AICodeAgent()


async def get_full_system_status() -> str:
    """Повний статус системи"""
    
    tasks = [
        predator_monitor.get_opensearch_status(),
        predator_monitor.get_qdrant_status(),
        predator_monitor.get_celery_status(),
        predator_monitor.get_etl_status(),
        predator_monitor.get_k8s_detailed_status(),
        predator_monitor.get_backend_health()
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    opensearch, qdrant, celery, etl, k8s, backend = results
    
    # Format output
    status_text = "📊 **PREDATOR ANALYTICS - Повний статус**\n\n"
    
    # Backend
    status_text += "🔹 **Backend API**\n"
    if isinstance(backend, dict):
        status_text += f"  Status: {backend.get('status', 'unknown')}\n"
    status_text += "\n"
    
    # OpenSearch
    status_text += "🔸 **OpenSearch (Індексація)**\n"
    if isinstance(opensearch, dict) and opensearch.get("status") != "error":
        status_text += f"  Cluster: {opensearch.get('cluster_name', 'N/A')}\n"
        status_text += f"  Status: {opensearch.get('status', 'unknown')}\n"
        status_text += f"  Indices: {opensearch.get('indices_count', 0)}\n"
        status_text += f"  Docs: {opensearch.get('total_docs', 0):,}\n"
        status_text += f"  Size: {opensearch.get('total_size_mb', 0):.2f} MB\n"
    else:
        status_text += f"  ❌ {opensearch.get('error', 'Offline')}\n"
    status_text += "\n"
    
    # Qdrant
    status_text += "🔹 **Qdrant (Vector DB)**\n"
    if isinstance(qdrant, dict) and qdrant.get("status") != "error":
        status_text += f"  Collections: {qdrant.get('total_collections', 0)}\n"
        for coll in qdrant.get("collections", [])[:3]:
            status_text += f"    • {coll['name']}: {coll.get('points_count', 0)} vectors\n"
    else:
        status_text += f"  ❌ {qdrant.get('error', 'Offline')}\n"
    status_text += "\n"
    
    # Celery
    status_text += "🔸 **Celery Workers**\n"
    if isinstance(celery, dict):
        status_text += f"  Status: {celery.get('status', 'unknown')}\n"
    status_text += "\n"
    
    # ETL
    status_text += "🔹 **ETL Pipeline**\n"
    if isinstance(etl, dict) and etl.get("status") != "error":
        status_text += f"  Total Jobs: {etl.get('total_jobs', 0)}\n"
    else:
        status_text += f"  Status: {etl.get('status', 'offline')}\n"
    status_text += "\n"
    
    # K8s
    status_text += "🔸 **Kubernetes**\n"
    if isinstance(k8s, dict) and k8s.get("status") != "error":
        pods = k8s.get("pods", {})
        status_text += f"  Nodes: {k8s.get('nodes', {}).get('total_nodes', 0)}\n"
        status_text += f"  Namespaces: {k8s.get('namespaces', 0)}\n"
        status_text += f"  Pods: {pods.get('running', 0)}/{pods.get('total', 0)} Running\n"
        status_text += f"  Services: {k8s.get('services', 0)}\n"
    else:
        status_text += f"  ❌ {k8s.get('error', 'Offline')}\n"
    
    return status_text
