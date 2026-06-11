import os
import asyncio
import logging
from typing import Dict, Any

import docker
from kubernetes import client, config

logger = logging.getLogger(__name__)

class Level1InfraValidator:
    """
    Рівень 1: Infrastructure Validation
    Перевіряє доступність та базові метрики Docker, Kubernetes, Helm та ArgoCD.
    """
    def __init__(self):
        self.docker_client = None
        self.k8s_client = None
        self._init_clients()

    def _init_clients(self):
        try:
            self.docker_client = docker.from_env()
        except Exception as e:
            logger.warning(f"Failed to initialize Docker client: {e}")
            
        try:
            config.load_incluster_config()
            self.k8s_client = client.CoreV1Api()
        except Exception as e:
            logger.warning(f"Failed to load K8s in-cluster config, trying kubeconfig: {e}")
            try:
                config.load_kube_config()
                self.k8s_client = client.CoreV1Api()
            except Exception as e2:
                logger.warning(f"Failed to initialize Kubernetes client: {e2}")

    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 1,
            "name": "Infrastructure Validation",
            "status": "pass",
            "details": {}
        }
        
        # 1. Docker validation
        docker_status = await self._check_docker()
        result["details"]["docker"] = docker_status
        if docker_status.get("status") == "fail":
            result["status"] = "fail"
            
        # 2. Kubernetes validation
        k8s_status = await self._check_kubernetes()
        result["details"]["kubernetes"] = k8s_status
        
        # 3. Helm validation
        helm_status = await self._check_helm()
        result["details"]["helm"] = helm_status
        
        # 4. ArgoCD validation
        argocd_status = await self._check_argocd()
        result["details"]["argocd"] = argocd_status

        return result

    async def _check_docker(self) -> Dict[str, Any]:
        if not self.docker_client:
            return {"status": "fail", "error": "Docker client not initialized"}
        try:
            info = self.docker_client.info()
            return {
                "status": "pass",
                "containers": info.get("Containers"),
                "containers_running": info.get("ContainersRunning"),
                "server_version": info.get("ServerVersion")
            }
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_kubernetes(self) -> Dict[str, Any]:
        if not self.k8s_client:
            return {"status": "skip", "error": "K8s client not initialized"}
        try:
            nodes = self.k8s_client.list_node()
            return {
                "status": "pass",
                "nodes_count": len(nodes.items)
            }
        except Exception as e:
            return {"status": "fail", "error": str(e)}

    async def _check_helm(self) -> Dict[str, Any]:
        try:
            process = await asyncio.create_subprocess_shell(
                "helm list -A -o json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            if process.returncode == 0:
                return {"status": "pass"}
            else:
                return {"status": "skip", "error": stderr.decode('utf-8').strip()}
        except Exception as e:
             return {"status": "fail", "error": str(e)}

    async def _check_argocd(self) -> Dict[str, Any]:
        try:
            process = await asyncio.create_subprocess_shell(
                "argocd app list -o json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            if process.returncode == 0:
                return {"status": "pass"}
            else:
                return {"status": "skip", "error": stderr.decode('utf-8').strip()}
        except Exception as e:
             return {"status": "fail", "error": str(e)}
