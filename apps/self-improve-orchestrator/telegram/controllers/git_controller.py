"""
Git Operations Controller
Handles git commands via python-git or subprocess
"""
import asyncio
import logging
import os

logger = logging.getLogger(__name__)

class GitController:
    def __init__(self, repo_path: str = "/app"):
        self.repo_path = repo_path

    async def get_status(self) -> str:
        """Get git status"""
        try:
            proc = await asyncio.create_subprocess_shell(
                "git status",
                cwd=self.repo_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            if proc.returncode != 0:
                return f"Error: {stderr.decode()}"
            return f"📄 *Git Status*:\n```\n{stdout.decode().strip()}\n```"
        except Exception as e:
            return f"Error: {str(e)}"

    async def pull(self) -> str:
        """Pull latest changes"""
        try:
            # First stash changes if any
            await self._run_command("git stash")

            # Pull
            code, out, err = await self._run_command("git pull")

            # Pop stash if needed (basic logic)
            # await self._run_command("git stash pop")

            if code != 0:
                return f"❌ Pull Failed:\n```\n{err}\n```"
            return f"✅ Pull Success:\n```\n{out}\n```"
        except Exception as e:
            return f"Error: {str(e)}"

    async def get_log(self, n: int = 5) -> str:
        """Get git log"""
        try:
            cmd = f"git log -n {n} --pretty=format:'%h - %an, %ar : %s'"
            code, out, err = await self._run_command(cmd)
            if code != 0:
                return f"Error: {err}"
            return f"📜 *Recent Commits*:\n```\n{out}\n```"
        except Exception as e:
            return f"Error: {str(e)}"

    async def _run_command(self, cmd: str) -> tuple[int, str, str]:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            cwd=self.repo_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        return proc.returncode, stdout.decode().strip(), stderr.decode().strip()
