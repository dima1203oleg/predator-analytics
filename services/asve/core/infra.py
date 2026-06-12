import subprocess
import asyncio
import logging

logger = logging.getLogger(__name__)

class InfraChecker:
    async def run(self):
        try:
            # We use a thread to not block the event loop with synchronous subprocess calls
            # Though asyncio.create_subprocess_shell is preferred
            pods = await self._run_cmd("kubectl get pods -A")
            services = await self._run_cmd("kubectl get svc -A")
            containers = await self._run_cmd("docker ps -a")
            
            return {
                "pods": pods,
                "services": services,
                "containers": containers,
                "status": "OK" if not "error" in pods.lower() else "DEGRADED"
            }
        except Exception as e:
            logger.error(f"Infra check failed: {e}")
            return {"status": "FAIL", "error": str(e)}

    async def _run_cmd(self, cmd: str) -> str:
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            return f"Error: {stderr.decode('utf-8').strip()}"
        return stdout.decode('utf-8').strip()
