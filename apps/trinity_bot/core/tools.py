from __future__ import annotations

import logging
import os

import aiohttp
import kubernetes.client
import kubernetes.config


logger = logging.getLogger("trinity.tools")

class InfraTools:
    def __init__(self):
        try:
            kubernetes.config.load_incluster_config()
        except kubernetes.config.ConfigException:
            try:
                kubernetes.config.load_kube_config()
            except Exception as e:
                logger.warning(f"K8s config load failed: {e}. K8s tools will not work.")

        self.k8s_apps = kubernetes.client.AppsV1Api()
        self.k8s_custom = kubernetes.client.CustomObjectsApi()

    async def execute_plan(self, steps: list) -> dict:
        """Execute a list of operational steps."""
        results = []
        for step in steps:
            action = step.get("action")
            if action == "scale":
                res = await self.scale_deployment(
                    step.get("namespace", "default"),
                    step.get("deployment"),
                    step.get("replicas")
                )
                results.append(res)
            elif action == "restart":
                # Implement restart logic
                pass
        return {"status": "executed", "results": results}

    async def scale_deployment(self, namespace, deployment, replicas):
        """Scale workers (FinOps)."""
        logger.info(f"Scaling {deployment} in {namespace} to {replicas}")

        # FinOps Check Policy
        if replicas > 10:
             # Logic to check budget via Kubecost API
             # Mock check for now
             logger.warning("High replica count requested. Budget check bypassed for demo.")

        try:
            self.k8s_apps.patch_namespaced_deployment_scale(
                name=deployment,
                namespace=namespace,
                body={"spec": {"replicas": replicas}}
            )
            return f"Scaled {deployment} to {replicas} replicas."
        except Exception as e:
            return f"Failed to scale {deployment}: {e}"

    async def get_rabbitmq_backlog(self):
        """Monitor queues."""
        rabbitmq_host = os.getenv("RABBITMQ_HOST", "rabbitmq")
        user = os.getenv("RABBITMQ_USER", "predator")
        password = os.getenv("RABBITMQ_PASS", "predator_secret_key")
        url = f"http://{rabbitmq_host}:15672/api/queues"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, auth=aiohttp.BasicAuth(user, password)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {q['name']: q.get('messages', 0) for q in data}
                    return {"error": f"RabbitMQ API returned {resp.status}"}
        except Exception as e:
            logger.exception(f"RabbitMQ check failed: {e}")
            return {"error": str(e)}

    async def trigger_argocd_sync(self, app_name):
        """GitOps Trigger."""
        # Call ArgoCD API to force sync
        argocd_server = os.getenv("ARGOCD_SERVER", "argocd-server")
        token = os.getenv("ARGOCD_TOKEN", "")

        url = f"http://{argocd_server}/api/v1/applications/{app_name}/sync"
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token}"} if token else {}
                async with session.post(url, headers=headers) as resp:
                    if resp.status == 200:
                        return f"Sync triggered for {app_name}"
                    return f"ArgoCD Sync failed: {resp.status}"
        except Exception as e:
            return f"ArgoCD call failed: {e}"
