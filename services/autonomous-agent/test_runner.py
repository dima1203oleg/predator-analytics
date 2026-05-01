"""
Test Runner for Autonomous Agent.
Executes Ruff, Pytest, and Vitest to ensure code quality before committing.
"""

import subprocess
from loguru import logger

class TestRunner:
    def __init__(self, repo_path: str = "/app"):
        self.repo_path = repo_path
    
    def run_cmd(self, cmd: list[str], cwd: str = None) -> tuple[bool, str]:
        target_dir = cwd if cwd else self.repo_path
        try:
            result = subprocess.run(cmd, cwd=target_dir, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                return False, result.stdout + "\n" + result.stderr
            return True, result.stdout
        except Exception as e:
            logger.error(f"Test execution error: {e}")
            return False, str(e)

    def run_python_lint(self) -> tuple[bool, str]:
        logger.info("Running Ruff linter...")
        return self.run_cmd(["ruff", "check", "."])

    def run_python_tests(self, service_dir: str) -> tuple[bool, str]:
        logger.info(f"Running Pytest in {service_dir}...")
        return self.run_cmd(["pytest", "tests/"], cwd=f"{self.repo_path}/services/{service_dir}")

    def run_frontend_tests(self) -> tuple[bool, str]:
        logger.info("Running Vitest for UI...")
        return self.run_cmd(["npm", "run", "test", "--run"], cwd=f"{self.repo_path}/apps/predator-analytics-ui")
