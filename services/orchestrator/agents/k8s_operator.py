#!/usr/bin/env python3
"""
PREDATOR v25 - Kubernetes/K3s Operator Agent
Manages K3s cluster operations, deployments, and health monitoring.
"""
import asyncio
import subprocess
import logging
import json
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger("agents.k8s_operator")


@dataclass
class K8sResource:
    """Represents a Kubernetes resource."""
    kind: str
    name: str
    namespace: str
    status: str
    age: str
    metadata: Dict[str, Any]


class K8sOperatorAgent:
    """
    Agent for managing Kubernetes/K3s cluster operations.
    Provides GitOps-friendly deployment, scaling, and monitoring.
    """

    def __init__(
        self,
        kubeconfig: Optional[str] = None,
        namespace: str = "predator-nvidia",
        context: Optional[str] = None
    ):
        self.kubeconfig = kubeconfig
        self.namespace = namespace
        self.context = context
        self._kubectl_base = self._build_kubectl_cmd()

    def _build_kubectl_cmd(self) -> List[str]:
        """Build base kubectl command with config options."""
        cmd = ["kubectl"]
        if self.kubeconfig:
            cmd.extend(["--kubeconfig", self.kubeconfig])
        if self.context:
            cmd.extend(["--context", self.context])
        return cmd

    async def _run_kubectl(
        self,
        args: List[str],
        timeout: int = 30,
        output_json: bool = True
    ) -> Dict[str, Any]:
        """Execute kubectl command and return result."""
        cmd = self._kubectl_base + args
        if output_json:
            cmd.extend(["-o", "json"])

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=timeout
            )

            if proc.returncode != 0:
                return {
                    "success": False,
                    "error": stderr.decode("utf-8"),
                    "command": " ".join(cmd)
                }

            if output_json and stdout:
                return {
                    "success": True,
                    "data": json.loads(stdout.decode("utf-8"))
                }
            return {
                "success": True,
                "output": stdout.decode("utf-8")
            }

        except asyncio.TimeoutError:
            return {"success": False, "error": f"Command timed out after {timeout}s"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_cluster_info(self) -> Dict[str, Any]:
        """Get cluster information."""
        nodes_result = await self._run_kubectl(["get", "nodes"])
        if not nodes_result["success"]:
            return nodes_result

        nodes = nodes_result.get("data", {}).get("items", [])

        return {
            "success": True,
            "cluster": {
                "node_count": len(nodes),
                "nodes": [
                    {
                        "name": n["metadata"]["name"],
                        "status": self._get_node_status(n),
                        "roles": self._get_node_roles(n),
                        "version": n["status"]["nodeInfo"]["kubeletVersion"],
                        "os": n["status"]["nodeInfo"]["osImage"],
                        "cpu": n["status"]["capacity"]["cpu"],
                        "memory": n["status"]["capacity"]["memory"]
                    }
                    for n in nodes
                ]
            }
        }

    def _get_node_status(self, node: Dict) -> str:
        """Extract node status from conditions."""
        conditions = node.get("status", {}).get("conditions", [])
        for cond in conditions:
            if cond["type"] == "Ready":
                return "Ready" if cond["status"] == "True" else "NotReady"
        return "Unknown"

    def _get_node_roles(self, node: Dict) -> List[str]:
        """Extract node roles from labels."""
        labels = node.get("metadata", {}).get("labels", {})
        roles = []
        for key in labels:
            if key.startswith("node-role.kubernetes.io/"):
                roles.append(key.split("/")[1])
        return roles or ["worker"]

    async def get_pods(
        self,
        namespace: Optional[str] = None,
        label_selector: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get pods in namespace."""
        ns = namespace or self.namespace
        args = ["get", "pods", "-n", ns]
        if label_selector:
            args.extend(["-l", label_selector])

        result = await self._run_kubectl(args)
        if not result["success"]:
            return result

        pods = result.get("data", {}).get("items", [])
        return {
            "success": True,
            "pods": [
                {
                    "name": p["metadata"]["name"],
                    "status": p["status"]["phase"],
                    "ready": self._get_pod_ready_status(p),
                    "restarts": self._get_pod_restarts(p),
                    "age": self._get_age(p["metadata"]["creationTimestamp"]),
                    "node": p["spec"].get("nodeName", "pending")
                }
                for p in pods
            ]
        }

    def _get_pod_ready_status(self, pod: Dict) -> str:
        """Get pod ready status (e.g., '2/2')."""
        containers = pod.get("status", {}).get("containerStatuses", [])
        ready = sum(1 for c in containers if c.get("ready"))
        total = len(containers) or len(pod.get("spec", {}).get("containers", []))
        return f"{ready}/{total}"

    def _get_pod_restarts(self, pod: Dict) -> int:
        """Get total pod restarts."""
        containers = pod.get("status", {}).get("containerStatuses", [])
        return sum(c.get("restartCount", 0) for c in containers)

    def _get_age(self, timestamp: str) -> str:
        """Convert timestamp to human-readable age."""
        try:
            created = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            delta = datetime.now(created.tzinfo) - created

            if delta.days > 0:
                return f"{delta.days}d"
            hours = delta.seconds // 3600
            if hours > 0:
                return f"{hours}h"
            minutes = (delta.seconds % 3600) // 60
            return f"{minutes}m"
        except:
            return "unknown"

    async def scale_deployment(
        self,
        deployment: str,
        replicas: int,
        namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Scale a deployment."""
        ns = namespace or self.namespace
        result = await self._run_kubectl(
            ["scale", "deployment", deployment, f"--replicas={replicas}", "-n", ns],
            output_json=False
        )

        if result["success"]:
            logger.info(f"✅ Scaled {deployment} to {replicas} replicas")
        else:
            logger.error(f"❌ Failed to scale {deployment}: {result.get('error')}")

        return result

    async def restart_deployment(
        self,
        deployment: str,
        namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Restart a deployment via rollout restart."""
        ns = namespace or self.namespace
        result = await self._run_kubectl(
            ["rollout", "restart", "deployment", deployment, "-n", ns],
            output_json=False
        )

        if result["success"]:
            logger.info(f"✅ Restarted deployment {deployment}")
        return result

    async def get_deployment_status(
        self,
        deployment: str,
        namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get detailed deployment status."""
        ns = namespace or self.namespace
        result = await self._run_kubectl(
            ["get", "deployment", deployment, "-n", ns]
        )

        if not result["success"]:
            return result

        dep = result.get("data", {})
        spec = dep.get("spec", {})
        status = dep.get("status", {})

        return {
            "success": True,
            "deployment": {
                "name": deployment,
                "namespace": ns,
                "replicas": {
                    "desired": spec.get("replicas", 0),
                    "ready": status.get("readyReplicas", 0),
                    "available": status.get("availableReplicas", 0),
                    "updated": status.get("updatedReplicas", 0)
                },
                "strategy": spec.get("strategy", {}).get("type", "RollingUpdate"),
                "image": self._get_container_image(spec),
                "conditions": [
                    {"type": c["type"], "status": c["status"], "reason": c.get("reason", "")}
                    for c in status.get("conditions", [])
                ]
            }
        }

    def _get_container_image(self, spec: Dict) -> str:
        """Extract container image from deployment spec."""
        containers = spec.get("template", {}).get("spec", {}).get("containers", [])
        if containers:
            return containers[0].get("image", "unknown")
        return "unknown"

    async def apply_manifest(
        self,
        manifest_path: str,
        namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Apply a Kubernetes manifest file."""
        ns = namespace or self.namespace
        result = await self._run_kubectl(
            ["apply", "-f", manifest_path, "-n", ns],
            output_json=False
        )

        if result["success"]:
            logger.info(f"✅ Applied manifest: {manifest_path}")
        return result

    async def get_events(
        self,
        namespace: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get recent cluster events."""
        ns = namespace or self.namespace
        result = await self._run_kubectl(
            ["get", "events", "-n", ns, "--sort-by=.lastTimestamp"]
        )

        if not result["success"]:
            return result

        events = result.get("data", {}).get("items", [])[-limit:]

        return {
            "success": True,
            "events": [
                {
                    "type": e["type"],
                    "reason": e["reason"],
                    "message": e["message"],
                    "object": f"{e['involvedObject']['kind']}/{e['involvedObject']['name']}",
                    "count": e.get("count", 1),
                    "age": self._get_age(e.get("lastTimestamp", e.get("eventTime", "")))
                }
                for e in events
            ]
        }

    async def get_resource_usage(
        self,
        namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get resource usage via metrics-server."""
        ns = namespace or self.namespace

        # Pod metrics
        result = await self._run_kubectl(
            ["top", "pods", "-n", ns],
            output_json=False
        )

        if not result["success"]:
            return {
                "success": False,
                "error": "Metrics not available. Is metrics-server installed?"
            }

        # Parse text output (kubectl top doesn't support JSON)
        lines = result["output"].strip().split("\n")[1:]  # Skip header
        pods = []
        for line in lines:
            parts = line.split()
            if len(parts) >= 3:
                pods.append({
                    "name": parts[0],
                    "cpu": parts[1],
                    "memory": parts[2]
                })

        return {
            "success": True,
            "pod_metrics": pods
        }


class ArgocdOperator:
    """
    Operator for managing ArgoCD applications and GitOps workflows.
    """

    def __init__(self, argocd_server: str = "argocd-server.argocd.svc"):
        self.server = argocd_server

    async def _run_argocd(
        self,
        args: List[str],
        timeout: int = 30
    ) -> Dict[str, Any]:
        """Execute argocd CLI command."""
        cmd = ["argocd"] + args + ["--server", self.server, "--insecure"]

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=timeout
            )

            return {
                "success": proc.returncode == 0,
                "output": stdout.decode("utf-8"),
                "error": stderr.decode("utf-8") if proc.returncode != 0 else None
            }
        except FileNotFoundError:
            return {"success": False, "error": "argocd CLI not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def list_applications(self) -> Dict[str, Any]:
        """List all ArgoCD applications."""
        result = await self._run_argocd(["app", "list", "-o", "json"])

        if result["success"]:
            try:
                apps = json.loads(result["output"])
                return {
                    "success": True,
                    "applications": [
                        {
                            "name": app["metadata"]["name"],
                            "namespace": app["spec"]["destination"]["namespace"],
                            "sync_status": app["status"]["sync"]["status"],
                            "health": app["status"]["health"]["status"],
                            "repo": app["spec"]["source"]["repoURL"],
                            "path": app["spec"]["source"]["path"]
                        }
                        for app in apps
                    ]
                }
            except json.JSONDecodeError:
                return {"success": False, "error": "Failed to parse response"}

        return result

    async def sync_application(
        self,
        app_name: str,
        prune: bool = True
    ) -> Dict[str, Any]:
        """Sync an ArgoCD application."""
        args = ["app", "sync", app_name]
        if prune:
            args.append("--prune")

        result = await self._run_argocd(args, timeout=120)

        if result["success"]:
            logger.info(f"✅ Synced ArgoCD app: {app_name}")
        else:
            logger.error(f"❌ Failed to sync {app_name}: {result.get('error')}")

        return result

    async def get_app_status(self, app_name: str) -> Dict[str, Any]:
        """Get detailed application status."""
        result = await self._run_argocd(["app", "get", app_name, "-o", "json"])

        if result["success"]:
            try:
                app = json.loads(result["output"])
                return {
                    "success": True,
                    "app": {
                        "name": app_name,
                        "sync_status": app["status"]["sync"]["status"],
                        "health": app["status"]["health"]["status"],
                        "revision": app["status"]["sync"].get("revision", ""),
                        "resources": [
                            {
                                "kind": r["kind"],
                                "name": r["name"],
                                "status": r.get("status", "Unknown"),
                                "health": r.get("health", {}).get("status", "Unknown")
                            }
                            for r in app["status"].get("resources", [])
                        ]
                    }
                }
            except:
                pass

        return result

    async def rollback_application(
        self,
        app_name: str,
        revision: Optional[int] = None
    ) -> Dict[str, Any]:
        """Rollback application to previous revision."""
        args = ["app", "rollback", app_name]
        if revision:
            args.append(str(revision))

        result = await self._run_argocd(args, timeout=120)

        if result["success"]:
            logger.info(f"✅ Rolled back {app_name}")

        return result


# CLI interface
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="K8s/ArgoCD Operator CLI")
    parser.add_argument("action", choices=["cluster-info", "pods", "scale", "sync", "apps"])
    parser.add_argument("--namespace", "-n", default="predator-nvidia")
    parser.add_argument("--deployment", "-d")
    parser.add_argument("--replicas", "-r", type=int)
    parser.add_argument("--app", "-a")

    args = parser.parse_args()

    async def main():
        k8s = K8sOperatorAgent(namespace=args.namespace)
        argocd = ArgocdOperator()

        if args.action == "cluster-info":
            result = await k8s.get_cluster_info()
        elif args.action == "pods":
            result = await k8s.get_pods()
        elif args.action == "scale" and args.deployment:
            result = await k8s.scale_deployment(args.deployment, args.replicas or 1)
        elif args.action == "apps":
            result = await argocd.list_applications()
        elif args.action == "sync" and args.app:
            result = await argocd.sync_application(args.app)
        else:
            result = {"error": "Invalid action or missing arguments"}

        print(json.dumps(result, indent=2))

    asyncio.run(main())
