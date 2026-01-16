#!/usr/bin/env python3.12
"""
PREDATOR v25 - DevOps Automation Agent
Handles CI/CD pipelines, deployments, and infrastructure automation.
"""
import asyncio
import subprocess
import logging
import json
import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

logger = logging.getLogger("agents.devops_automation")


class DeploymentTarget(Enum):
    """Supported deployment targets."""
    DOCKER_COMPOSE = "docker-compose"
    K3S = "k3s"
    KUBERNETES = "kubernetes"
    REMOTE_SSH = "remote-ssh"


@dataclass
class DeploymentConfig:
    """Configuration for a deployment."""
    target: DeploymentTarget
    environment: str
    services: List[str] = field(default_factory=list)
    ssh_host: Optional[str] = None
    ssh_port: int = 6666 # За замовчуванням використовуємо порт 6666 (NVIDIA Server)
    ssh_user: str = "dima"
    ssh_key: Optional[str] = os.path.expanduser("~/.ssh/id_ed25519_ngrok")
    compose_file: str = "docker-compose.yml"
    helm_chart: Optional[str] = None
    helm_values: Optional[str] = None


class DevOpsAutomationAgent:
    """
    Agent for automating DevOps tasks:
    - Docker Compose deployments
    - Remote SSH deployments
    - Kubernetes/K3s deployments
    - Service health monitoring
    - Log aggregation
    """

    def __init__(
        self,
        project_root: str = "/app",
        default_ssh_key: Optional[str] = None
    ):
        self.project_root = project_root
        self.default_ssh_key = default_ssh_key or os.path.expanduser("~/.ssh/id_ed25519_ngrok")
        self.deployment_history: List[Dict] = []

    async def _run_command(
        self,
        cmd: List[str],
        cwd: Optional[str] = None,
        timeout: int = 300,
        env: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Execute a command and return result."""
        try:
            full_env = {**os.environ, **(env or {})}

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=cwd or self.project_root,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=full_env
            )

            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=timeout
            )

            return {
                "success": proc.returncode == 0,
                "return_code": proc.returncode,
                "stdout": stdout.decode("utf-8"),
                "stderr": stderr.decode("utf-8"),
                "command": " ".join(cmd)
            }

        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": f"Command timed out after {timeout}s",
                "command": " ".join(cmd)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": " ".join(cmd)
            }

    async def _run_ssh_command(
        self,
        host: str,
        command: str,
        port: int = 22,
        user: str = "dima",
        key: Optional[str] = None,
        timeout: int = 120
    ) -> Dict[str, Any]:
        """Execute command on remote host via SSH."""
        ssh_key = key or self.default_ssh_key

        ssh_cmd = [
            "ssh",
            "-p", str(port),
            "-i", ssh_key,
            "-o", "StrictHostKeyChecking=no",
            "-o", "ConnectTimeout=10",
            f"{user}@{host}",
            command
        ]

        return await self._run_command(ssh_cmd, timeout=timeout)

    async def deploy_docker_compose(
        self,
        config: DeploymentConfig,
        build: bool = True,
        force_recreate: bool = False
    ) -> Dict[str, Any]:
        """Deploy services using Docker Compose."""
        logger.info(f"🚀 Deploying via Docker Compose to {config.environment}")

        if config.target == DeploymentTarget.REMOTE_SSH:
            # Remote deployment
            cmd_parts = [
                f"cd ~/predator-analytics",
                "git pull origin main",
            ]

            compose_args = ["docker-compose", "-f", config.compose_file]
            if config.environment:
                compose_args.extend(["--profile", config.environment])

            compose_args.append("up -d")
            if build:
                compose_args.append("--build")
            if force_recreate:
                compose_args.append("--force-recreate")
            if config.services:
                compose_args.extend(config.services)

            cmd_parts.append(" ".join(compose_args))

            result = await self._run_ssh_command(
                host=config.ssh_host,
                command=" && ".join(cmd_parts),
                port=config.ssh_port,
                user=config.ssh_user,
                key=config.ssh_key
            )
        else:
            # Local deployment
            cmd = ["docker-compose", "-f", config.compose_file]
            if config.environment:
                cmd.extend(["--profile", config.environment])
            cmd.append("up")
            cmd.append("-d")
            if build:
                cmd.append("--build")
            if force_recreate:
                cmd.append("--force-recreate")
            if config.services:
                cmd.extend(config.services)

            result = await self._run_command(cmd)

        # Record deployment
        self.deployment_history.append({
            "timestamp": datetime.now().isoformat(),
            "target": config.target.value,
            "environment": config.environment,
            "services": config.services,
            "success": result["success"]
        })

        return result

    async def sync_code_to_remote(
        self,
        host: str,
        files: List[str],
        remote_path: str = "~/predator-analytics/",
        port: int = 22,
        user: str = "dima",
        key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Sync local files to remote server using rsync."""
        ssh_key = key or self.default_ssh_key

        rsync_cmd = [
            "rsync", "-avz",
            "-e", f"ssh -p {port} -i {ssh_key} -o StrictHostKeyChecking=no"
        ]
        rsync_cmd.extend(files)
        rsync_cmd.append(f"{user}@{host}:{remote_path}")

        result = await self._run_command(rsync_cmd, timeout=120)

        if result["success"]:
            logger.info(f"✅ Synced {len(files)} files to {host}")
        else:
            logger.error(f"❌ Sync failed: {result.get('error') or result.get('stderr')}")

        return result

    async def deploy_helm(
        self,
        release_name: str,
        chart_path: str,
        values_file: Optional[str] = None,
        namespace: str = "predator-nvidia",
        upgrade: bool = True,
        atomic: bool = True,
        timeout: str = "10m"
    ) -> Dict[str, Any]:
        """Deploy or upgrade a Helm release."""
        logger.info(f"🚀 Deploying Helm release: {release_name}")

        cmd = [
            "helm",
            "upgrade" if upgrade else "install",
            release_name,
            chart_path,
            "-n", namespace,
            "--create-namespace",
            "--timeout", timeout
        ]

        if upgrade:
            cmd.append("--install")  # Install if not exists
        if atomic:
            cmd.append("--atomic")
        if values_file:
            cmd.extend(["-f", values_file])

        result = await self._run_command(cmd, timeout=700)

        return result

    async def get_service_status(
        self,
        config: DeploymentConfig
    ) -> Dict[str, Any]:
        """Get status of deployed services."""
        if config.target == DeploymentTarget.REMOTE_SSH:
            result = await self._run_ssh_command(
                host=config.ssh_host,
                command="docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
                port=config.ssh_port,
                user=config.ssh_user,
                key=config.ssh_key
            )

            if result["success"]:
                # Parse docker ps output
                lines = result["stdout"].strip().split("\n")[1:]  # Skip header
                services = []
                for line in lines:
                    parts = line.split("\t")
                    if len(parts) >= 2:
                        services.append({
                            "name": parts[0].strip(),
                            "status": parts[1].strip() if len(parts) > 1 else "unknown",
                            "ports": parts[2].strip() if len(parts) > 2 else ""
                        })
                return {"success": True, "services": services}

            return result
        else:
            cmd = ["docker", "ps", "--format", "json"]
            result = await self._run_command(cmd)

            if result["success"]:
                services = []
                for line in result["stdout"].strip().split("\n"):
                    if line:
                        try:
                            data = json.loads(line)
                            services.append({
                                "name": data.get("Names", ""),
                                "status": data.get("Status", ""),
                                "ports": data.get("Ports", "")
                            })
                        except:
                            pass
                return {"success": True, "services": services}

            return result

    async def restart_service(
        self,
        service_name: str,
        config: DeploymentConfig
    ) -> Dict[str, Any]:
        """Restart a specific service (with anti-lockup for self-restart)."""
        logger.info(f"🔄 Requesting restart for {service_name}...")

        if config.target == DeploymentTarget.REMOTE_SSH:
            result = await self._run_ssh_command(
                host=config.ssh_host,
                command=f"docker restart {service_name}",
                port=config.ssh_port,
                user=config.ssh_user,
                key=config.ssh_key
            )
        else:
            # Local Restart
            # If we are in docker and trying to restart ourselves, we must be careful
            # We use a detached process to avoid waiting for our own death
            try:
                cmd = ["docker", "restart", service_name]
                subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return {"success": True, "message": "Restart command sent (detached)"}
            except Exception as e:
                return {"success": False, "error": str(e)}

        if result["success"]:
            logger.info(f"✅ Restarted service: {service_name}")
        else:
            logger.error(f"❌ Failed to restart {service_name}")

        return result

    async def get_service_logs(
        self,
        service_name: str,
        config: DeploymentConfig,
        tail: int = 100,
        follow: bool = False
    ) -> Dict[str, Any]:
        """Get logs from a service."""
        cmd_str = f"docker logs --tail {tail} {service_name}"

        if config.target == DeploymentTarget.REMOTE_SSH:
            return await self._run_ssh_command(
                host=config.ssh_host,
                command=cmd_str,
                port=config.ssh_port,
                user=config.ssh_user,
                key=config.ssh_key
            )
        else:
            return await self._run_command(
                ["docker", "logs", "--tail", str(tail), service_name]
            )

    async def run_health_check(
        self,
        config: DeploymentConfig,
        endpoints: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Run health checks on deployed services."""
        default_endpoints = [
            {"name": "Backend API", "url": "http://localhost:8090/api/v25/system/status"},
            {"name": "Frontend", "url": "http://localhost:80/"},
        ]

        checks = endpoints or default_endpoints
        results = []

        for check in checks:
            if config.target == DeploymentTarget.REMOTE_SSH:
                cmd = f"curl -sf '{check['url']}' -o /dev/null -w '%{{http_code}}' --max-time 10"
                result = await self._run_ssh_command(
                    host=config.ssh_host,
                    command=cmd,
                    port=config.ssh_port,
                    user=config.ssh_user,
                    key=config.ssh_key,
                    timeout=15
                )

                status_code = result["stdout"].strip() if result["success"] else "000"
                healthy = status_code.startswith("2")
            else:
                result = await self._run_command(
                    ["curl", "-sf", check["url"], "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "10"]
                )
                status_code = result["stdout"].strip() if result["success"] else "000"
                healthy = status_code.startswith("2")

            results.append({
                "name": check["name"],
                "url": check["url"],
                "status_code": status_code,
                "healthy": healthy
            })

        all_healthy = all(r["healthy"] for r in results)

        return {
            "success": True,
            "all_healthy": all_healthy,
            "checks": results,
            "timestamp": datetime.now().isoformat()
        }

    async def rollback(
        self,
        config: DeploymentConfig,
        to_version: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rollback to previous deployment."""
        logger.warning(f"⏪ Initiating rollback for {config.environment}")

        if config.target == DeploymentTarget.REMOTE_SSH:
            # Git-based rollback
            if to_version:
                cmd = f"cd ~/predator-analytics && git checkout {to_version}"
            else:
                cmd = "cd ~/predator-analytics && git checkout HEAD~1"

            result = await self._run_ssh_command(
                host=config.ssh_host,
                command=cmd,
                port=config.ssh_port,
                user=config.ssh_user,
                key=config.ssh_key
            )

            if result["success"]:
                # Redeploy
                return await self.deploy_docker_compose(config, build=True)

            return result
        else:
            return {"success": False, "error": "Rollback not implemented for this target"}


# Factory function for common configurations
def create_nvidia_config() -> DeploymentConfig:
    """Create configuration for NVIDIA server deployment."""
    return DeploymentConfig(
        target=DeploymentTarget.REMOTE_SSH,
        environment="server",
        ssh_host="194.177.1.240",
        ssh_port=6666,
        ssh_user="dima",
        ssh_key=os.path.expanduser("~/.ssh/id_ed25519_ngrok"),
        compose_file="docker-compose.yml",
        services=[]
    )


def create_local_config() -> DeploymentConfig:
    """Create configuration for local Docker deployment."""
    return DeploymentConfig(
        target=DeploymentTarget.DOCKER_COMPOSE,
        environment="local",
        compose_file="docker-compose.yml",
        services=[]
    )


# CLI interface
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="DevOps Automation CLI")
    parser.add_argument("action", choices=["deploy", "status", "restart", "logs", "health", "sync"])
    parser.add_argument("--target", "-t", choices=["nvidia", "local"], default="nvidia")
    parser.add_argument("--service", "-s")
    parser.add_argument("--files", nargs="*")
    parser.add_argument("--build", action="store_true", default=True)

    args = parser.parse_args()

    async def main():
        agent = DevOpsAutomationAgent()

        if args.target == "nvidia":
            config = create_nvidia_config()
        else:
            config = create_local_config()

        if args.action == "deploy":
            result = await agent.deploy_docker_compose(config, build=args.build)
        elif args.action == "status":
            result = await agent.get_service_status(config)
        elif args.action == "restart" and args.service:
            result = await agent.restart_service(args.service, config)
        elif args.action == "logs" and args.service:
            result = await agent.get_service_logs(args.service, config)
        elif args.action == "health":
            result = await agent.run_health_check(config)
        elif args.action == "sync" and args.files:
            result = await agent.sync_code_to_remote(config.ssh_host, args.files)
        else:
            result = {"error": "Invalid action or missing arguments"}

        print(json.dumps(result, indent=2, default=str))

    asyncio.run(main())
