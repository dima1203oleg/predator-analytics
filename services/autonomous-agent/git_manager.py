"""Git Manager for Autonomous Agent.
Handles branching, committing, and pushing changes autonomously.
"""

import subprocess

from loguru import logger


class GitManager:
    def __init__(self, repo_path: str = "/app"):
        self.repo_path = repo_path

    def run_cmd(self, cmd: list[str]) -> tuple[bool, str]:
        try:
            result = subprocess.run(cmd, cwd=self.repo_path, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                logger.error(f"Git cmd failed: {' '.join(cmd)}\nError: {result.stderr}")
                return False, result.stderr
            return True, result.stdout
        except Exception as e:
            logger.error(f"Git execution error: {e}")
            return False, str(e)

    def create_branch(self, branch_name: str) -> bool:
        logger.info(f"Creating branch {branch_name}")
        success, _ = self.run_cmd(["git", "checkout", "-b", branch_name])
        return success

    def commit_changes(self, message: str) -> bool:
        logger.info("Committing changes...")
        self.run_cmd(["git", "add", "."])
        success, out = self.run_cmd(["git", "commit", "-m", message, "--no-verify"]) # HR-13 format expected in message
        if success:
             logger.info(f"Commit success: {out}")
        return success

    def get_diff(self) -> str:
        _, out = self.run_cmd(["git", "diff", "HEAD"])
        return out
